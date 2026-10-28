-- Migration 000015: Idempotency Key, Guest COD Abuse Protection, and Routine Permission Hardening

-- 1. Add idempotency_key to orders to prevent duplicate orders and double stock deductions
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_idx
  ON public.orders (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- 2. Persistent Blacklist for Guest and Registered COD Abusers (e.g. refused parcels)
CREATE TABLE IF NOT EXISTS public.blocked_phones (
  phone TEXT PRIMARY KEY,
  reason TEXT NOT NULL DEFAULT 'COD delivery refused at door',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blocked_phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_phones FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocked_phones_admin_all" ON public.blocked_phones;
CREATE POLICY "blocked_phones_admin_all" ON public.blocked_phones
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Count failed tracking requests per existing order number. The table is not
-- exposed through the Data API; only the SECURITY DEFINER tracking routine uses it.
CREATE SCHEMA IF NOT EXISTS private;
CREATE TABLE IF NOT EXISTS private.order_tracking_attempts (
  order_number TEXT PRIMARY KEY,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE private.order_tracking_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.order_tracking_attempts FORCE ROW LEVEL SECURITY;
REVOKE ALL ON private.order_tracking_attempts FROM PUBLIC, anon, authenticated;

-- 3. Update status transition trigger to record refused deliveries in blocked_phones
CREATE OR REPLACE FUNCTION public.handle_order_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_item RECORD;
    v_is_valid_transition BOOLEAN := FALSE;
BEGIN
    -- Only run when status actually changes
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Allowed state transitions matrix
    CASE OLD.status
        WHEN 'new' THEN
            v_is_valid_transition := NEW.status IN ('confirmed', 'cancelled');
        WHEN 'confirmed' THEN
            v_is_valid_transition := NEW.status IN ('packed', 'cancelled');
        WHEN 'packed' THEN
            v_is_valid_transition := NEW.status IN ('shipped', 'cancelled');
        WHEN 'shipped' THEN
            v_is_valid_transition := NEW.status IN ('delivered', 'refused', 'returned');
        WHEN 'delivered' THEN
            v_is_valid_transition := NEW.status IN ('returned');
        ELSE
            -- Terminal states: refused, returned, cancelled cannot transition further
            v_is_valid_transition := FALSE;
    END CASE;

    IF NOT v_is_valid_transition THEN
        RAISE EXCEPTION 'INVALID_STATUS_TRANSITION: Cannot transition order status from "%" to "%"',
            OLD.status, NEW.status;
    END IF;

    -- Inventory Auto-Restoration on Cancellation, Refusal, or Return
    IF NEW.status IN ('cancelled', 'refused', 'returned') AND OLD.status NOT IN ('cancelled', 'refused', 'returned') THEN
        FOR v_item IN
            SELECT product_id, quantity FROM public.order_items WHERE order_id = NEW.id
        LOOP
            -- Restore available stock, reduce reserved stock
            UPDATE public.inventory
            SET quantity_available = quantity_available + v_item.quantity,
                quantity_reserved = GREATEST(0, quantity_reserved - v_item.quantity),
                updated_at = now()
            WHERE product_id = v_item.product_id;
        END LOOP;
    END IF;

    -- When delivered: finalize reservation (deduct from reserved)
    IF NEW.status = 'delivered' AND OLD.status = 'shipped' THEN
        FOR v_item IN
            SELECT product_id, quantity FROM public.order_items WHERE order_id = NEW.id
        LOOP
            UPDATE public.inventory
            SET quantity_reserved = GREATEST(0, quantity_reserved - v_item.quantity),
                updated_at = now()
            WHERE product_id = v_item.product_id;
        END LOOP;
    END IF;

    -- Refusal protection (Anti-COD Abuse in Egypt):
    -- If customer refuses delivery at door, flag the phone number in profiles AND blocked_phones
    IF NEW.status = 'refused' THEN
        UPDATE public.profiles
        SET is_blacklisted = TRUE,
            notes = COALESCE(notes, '') || ' [Automated Flag: Refused delivery on order ' || NEW.order_number || ']'
        WHERE phone = NEW.customer_phone;

        INSERT INTO public.blocked_phones (phone, reason)
        VALUES (NEW.customer_phone, 'Automated Flag: Refused delivery on order ' || NEW.order_number)
        ON CONFLICT (phone) DO UPDATE
        SET reason = EXCLUDED.reason, created_at = now();
    END IF;

    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

-- 4. Update place_order to support idempotency key and blocked_phones verification
DROP FUNCTION IF EXISTS public.place_order(TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT);

CREATE OR REPLACE FUNCTION public.place_order(
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_customer_email TEXT,
    p_governorate_id UUID,
    p_city TEXT,
    p_address_line TEXT,
    p_landmark TEXT,
    p_order_notes TEXT,
    p_items JSONB,
    p_ip_address TEXT DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_normalized_phone TEXT;
    v_clean_name TEXT;
    v_clean_city TEXT;
    v_clean_address TEXT;
    v_gov_name_ar TEXT;
    v_gov_name_en TEXT;
    v_shipping_cost NUMERIC(10, 2);
    v_free_threshold NUMERIC(10, 2);
    v_actual_shipping NUMERIC(10, 2);
    v_subtotal NUMERIC(10, 2) := 0.00;
    v_cod_fee NUMERIC(10, 2) := 0.00;
    v_total NUMERIC(10, 2) := 0.00;
    v_order_id UUID;
    v_order_number TEXT;
    v_item JSONB;
    v_product_id UUID;
    v_quantity INTEGER;
    v_product_name TEXT;
    v_product_price NUMERIC(10, 2);
    v_product_active BOOLEAN;
    v_avail_stock INTEGER;
    v_item_total NUMERIC(10, 2);
    v_address_snapshot JSONB;
    v_validated_items JSONB := '[]'::jsonb;
    v_existing RECORD;
    v_recent_order_count INTEGER;
BEGIN
    -- Check idempotency key before any operations
    IF p_idempotency_key IS NOT NULL AND trim(p_idempotency_key) <> '' THEN
        -- Serialize retries that share a key so the second request can see the
        -- first committed order instead of racing into the unique index.
        PERFORM pg_advisory_xact_lock(hashtextextended(trim(p_idempotency_key), 0));

        SELECT
            id, order_number, status, customer_name, customer_phone,
            subtotal, shipping_fee, cod_fee, total, currency, created_at
        INTO v_existing
        FROM public.orders
        WHERE idempotency_key = trim(p_idempotency_key);

        IF v_existing.id IS NOT NULL THEN
            RETURN jsonb_build_object(
                'success', TRUE,
                'order_id', v_existing.id,
                'order_number', v_existing.order_number,
                'status', v_existing.status,
                'customer_name', v_existing.customer_name,
                'customer_phone', v_existing.customer_phone,
                'subtotal', v_existing.subtotal,
                'shipping_fee', v_existing.shipping_fee,
                'cod_fee', v_existing.cod_fee,
                'total', v_existing.total,
                'currency', v_existing.currency,
                'created_at', v_existing.created_at,
                'is_duplicate', TRUE
            );
        END IF;
    END IF;

    -- 1. Input Validation
    v_user_id := auth.uid();
    v_clean_name := trim(COALESCE(p_customer_name, ''));
    v_clean_city := trim(COALESCE(p_city, ''));
    v_clean_address := trim(COALESCE(p_address_line, ''));

    IF length(v_clean_name) < 2 THEN
        RAISE EXCEPTION 'INVALID_INPUT: Customer name must be at least 2 characters';
    END IF;

    IF length(v_clean_address) < 5 THEN
        RAISE EXCEPTION 'INVALID_INPUT: Detailed address must be at least 5 characters';
    END IF;

    IF length(v_clean_city) < 2 THEN
        RAISE EXCEPTION 'INVALID_INPUT: City name is required';
    END IF;

    -- Validate & normalize phone
    v_normalized_phone := public.normalize_egyptian_phone(p_customer_phone);

    -- Check if customer is blacklisted (profiles or blocked_phones)
    IF EXISTS (
        SELECT 1 FROM public.profiles
        WHERE phone = v_normalized_phone AND is_blacklisted = TRUE
    ) OR EXISTS (
        SELECT 1 FROM public.blocked_phones
        WHERE phone = v_normalized_phone
    ) THEN
        RAISE EXCEPTION 'ORDER_REJECTED: Account or phone number is restricted. Please contact customer support.';
    END IF;

    SELECT count(*) INTO v_recent_order_count
    FROM public.orders
    WHERE customer_phone = v_normalized_phone
      AND created_at >= now() - interval '10 minutes';

    IF v_recent_order_count >= 5 THEN
        RAISE EXCEPTION 'RATE_LIMITED: Too many orders for this phone number. Please try again later.';
    END IF;

    -- Validate Governorate & Shipping Rate
    SELECT g.name_ar, g.name_en, sr.shipping_cost, sr.free_shipping_threshold
    INTO v_gov_name_ar, v_gov_name_en, v_shipping_cost, v_free_threshold
    FROM public.governorates g
    JOIN public.shipping_rates sr ON sr.governorate_id = g.id
    WHERE g.id = p_governorate_id AND g.is_active = TRUE AND sr.is_active = TRUE;

    IF v_gov_name_ar IS NULL THEN
        RAISE EXCEPTION 'INVALID_LOCATION: Selected governorate is invalid or inactive';
    END IF;

    -- Validate items in the database too; clients can call the public RPC
    -- directly and bypass the storefront's Zod limits.
    IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
        RAISE EXCEPTION 'INVALID_ITEM: Items must be a JSON array';
    END IF;

    IF jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'EMPTY_CART: Order must contain at least one item';
    END IF;

    IF jsonb_array_length(p_items) > 20 THEN
        RAISE EXCEPTION 'INVALID_ITEM: An order cannot contain more than 20 products';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(p_items) AS items(item)
        GROUP BY item->>'product_id'
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'INVALID_ITEM: A product may appear only once in an order';
    END IF;

    -- 2. First Pass: Lock inventory, validate prices, verify stock, calculate subtotal
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_quantity := COALESCE((v_item->>'quantity')::INTEGER, 0);

        IF v_product_id IS NULL OR v_quantity <= 0 THEN
            RAISE EXCEPTION 'INVALID_ITEM: Each item must have a valid product_id and quantity > 0';
        END IF;

        -- Verify product exists and active
        SELECT name, price, is_active
        INTO v_product_name, v_product_price, v_product_active
        FROM public.products
        WHERE id = v_product_id;

        IF v_product_name IS NULL OR NOT v_product_active THEN
            RAISE EXCEPTION 'PRODUCT_UNAVAILABLE: Product % is not available', v_product_id;
        END IF;

        -- Lock inventory row FOR UPDATE
        SELECT quantity_available
        INTO v_avail_stock
        FROM public.inventory
        WHERE product_id = v_product_id
        FOR UPDATE;

        IF v_avail_stock IS NULL OR v_avail_stock < v_quantity THEN
            RAISE EXCEPTION 'INSUFFICIENT_STOCK: Product "%" only has % item(s) in stock (requested %)',
                v_product_name, COALESCE(v_avail_stock, 0), v_quantity;
        END IF;

        IF v_quantity > 10 THEN
            RAISE EXCEPTION 'INVALID_ITEM: A product quantity cannot exceed 10 per order';
        END IF;

        -- Deduct from available inventory, add to reserved
        UPDATE public.inventory
        SET quantity_available = quantity_available - v_quantity,
            quantity_reserved = quantity_reserved + v_quantity,
            updated_at = now()
        WHERE product_id = v_product_id;

        -- Calculate line item total
        v_item_total := v_product_price * v_quantity;
        v_subtotal := v_subtotal + v_item_total;

        -- Store validated item details
        v_validated_items := v_validated_items || jsonb_build_object(
            'product_id', v_product_id,
            'product_name', v_product_name,
            'unit_price', v_product_price,
            'quantity', v_quantity,
            'total_price', v_item_total
        );
    END LOOP;

    -- 3. Calculate Final Shipping and Grand Total
    IF v_subtotal >= v_free_threshold THEN
        v_actual_shipping := 0.00;
    ELSE
        v_actual_shipping := v_shipping_cost;
    END IF;

    v_total := v_subtotal + v_actual_shipping + v_cod_fee;

    -- 4. Create Order Header record
    v_order_number := 'RV-' || to_char(now(), 'YYYY') || '-' || lpad((nextval('public.order_number_seq'))::text, 5, '0');
    v_order_id := gen_random_uuid();

    v_address_snapshot := jsonb_build_object(
        'governorate_id', p_governorate_id,
        'governorate_ar', v_gov_name_ar,
        'governorate_en', v_gov_name_en,
        'city', v_clean_city,
        'address_line', v_clean_address,
        'landmark', trim(COALESCE(p_landmark, ''))
    );

    INSERT INTO public.orders (
        id,
        order_number,
        user_id,
        customer_name,
        customer_phone,
        customer_email,
        governorate_id,
        shipping_address_snapshot,
        status,
        payment_method,
        payment_status,
        subtotal,
        shipping_fee,
        cod_fee,
        discount_amount,
        total,
        currency,
        order_notes,
        ip_address,
        idempotency_key
    ) VALUES (
        v_order_id,
        v_order_number,
        v_user_id,
        v_clean_name,
        v_normalized_phone,
        nullif(trim(COALESCE(p_customer_email, '')), ''),
        p_governorate_id,
        v_address_snapshot,
        'new',
        'cod',
        'pending',
        v_subtotal,
        v_actual_shipping,
        v_cod_fee,
        0.00,
        v_total,
        'EGP',
        nullif(trim(COALESCE(p_order_notes, '')), ''),
        p_ip_address,
        nullif(trim(COALESCE(p_idempotency_key, '')), '')
    );

    -- 5. Insert Order Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_validated_items)
    LOOP
        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_name,
            unit_price,
            quantity,
            total_price
        ) VALUES (
            v_order_id,
            (v_item->>'product_id')::UUID,
            v_item->>'product_name',
            (v_item->>'unit_price')::NUMERIC(10, 2),
            (v_item->>'quantity')::INTEGER,
            (v_item->>'total_price')::NUMERIC(10, 2)
        );
    END LOOP;

    -- 6. Insert Initial Status History
    INSERT INTO public.order_status_history (
        order_id,
        from_status,
        to_status,
        changed_by,
        reason
    ) VALUES (
        v_order_id,
        NULL,
        'new',
        v_user_id,
        'Order created successfully (COD Egypt)'
    );

    -- 7. Return clean order summary for client
    RETURN jsonb_build_object(
        'success', TRUE,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'status', 'new',
        'customer_name', v_clean_name,
        'customer_phone', v_normalized_phone,
        'subtotal', v_subtotal,
        'shipping_fee', v_actual_shipping,
        'cod_fee', v_cod_fee,
        'total', v_total,
        'currency', 'EGP',
        'created_at', now(),
        'is_duplicate', FALSE
    );
END;
$$;

-- 5. Revoke EXECUTE from anon on administrative routines (defense-in-depth)
REVOKE EXECUTE ON FUNCTION public.admin_get_orders(TEXT, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_get_metrics() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_inventory(UUID, INTEGER, INTEGER) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_shipping_rate(UUID, NUMERIC, NUMERIC, INTEGER, INTEGER) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_order_status(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_get_orders(TEXT, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, INTEGER, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_metrics() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_inventory(UUID, INTEGER, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_shipping_rate(UUID, NUMERIC, NUMERIC, INTEGER, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_order_status(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
