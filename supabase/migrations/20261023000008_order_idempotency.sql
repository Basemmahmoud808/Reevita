-- Migration 000008: Duplicate-order protection (idempotency) + server-trusted order items
-- Adds a client-generated idempotency key to orders and returns the validated items
-- from place_order so the confirmation page never has to trust browser-supplied data.

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key
    ON public.orders(idempotency_key)
    WHERE idempotency_key IS NOT NULL;

-- Replace the previous 10-argument signature (a defaulted 11th argument would make
-- calls with 10 named arguments ambiguous).
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
    v_existing_items JSONB;
BEGIN
    -- 0. Idempotency: a retried submission (same browser key) returns the original order
    --    instead of charging stock and creating a duplicate order.
    IF p_idempotency_key IS NOT NULL AND length(trim(p_idempotency_key)) BETWEEN 8 AND 64 THEN
        PERFORM pg_advisory_xact_lock(hashtextextended('order:' || trim(p_idempotency_key), 0));
        SELECT id, order_number, status, customer_name, customer_phone,
               subtotal, shipping_fee, cod_fee, total, currency, created_at
        INTO v_existing
        FROM public.orders
        WHERE idempotency_key = trim(p_idempotency_key);

        IF FOUND THEN
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                       'product_name', product_name,
                       'quantity', quantity,
                       'unit_price', unit_price,
                       'total_price', total_price
                   ) ORDER BY product_name), '[]'::jsonb)
            INTO v_existing_items
            FROM public.order_items
            WHERE order_id = v_existing.id;

            RETURN jsonb_build_object(
                'success', TRUE,
                'replayed', TRUE,
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
                'items', v_existing_items
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

    -- Check if customer is blacklisted (e.g. repeated fake orders/refusals)
    IF EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE phone = v_normalized_phone AND is_blacklisted = TRUE
    ) THEN
        RAISE EXCEPTION 'ORDER_REJECTED: Account or phone number is restricted. Please contact customer support.';
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

    -- Validate Items array
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'EMPTY_CART: Order must contain at least one item';
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

        -- CRITICAL CONCURRENCY PROTECTION:
        -- Lock the inventory row FOR UPDATE to prevent race conditions & overselling
        SELECT quantity_available 
        INTO v_avail_stock
        FROM public.inventory
        WHERE product_id = v_product_id
        FOR UPDATE;

        IF v_avail_stock IS NULL OR v_avail_stock < v_quantity THEN
            RAISE EXCEPTION 'INSUFFICIENT_STOCK: Product "%" only has % item(s) in stock (requested %)',
                v_product_name, COALESCE(v_avail_stock, 0), v_quantity;
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

    -- 5. Insert Order Items (referencing the newly created order)
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
        'items', v_validated_items
    );
END;
$$;
