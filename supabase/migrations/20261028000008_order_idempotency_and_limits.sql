-- Migration 000008: Idempotent COD order creation, strict server-side limits,
-- privacy-safe stock errors, and an authenticated order receipt RPC.
--
-- Problem addressed
--   1. `place_order` created a new order (and deducted inventory) for every call.
--      Double-clicks, browser retries and concurrent submissions therefore produced
--      duplicate COD orders and duplicate stock movements.
--   2. Item input was unbounded: a caller could submit hundreds of lines, repeat the
--      same product to exceed the per-item quantity cap, or send malformed quantities
--      that surfaced raw Postgres errors.
--   3. `INSUFFICIENT_STOCK` errors echoed the exact available quantity back to the
--      anonymous caller, defeating the "never expose exact stock" rule implemented
--      by `product_availability`.
--   4. Guests could not re-read their own receipt after the confirmation cookie
--      expired; the confirmation page had to trust a browser-cookie snapshot.
--
-- All changes are additive and backwards compatible: `p_idempotency_key` is an
-- optional trailing parameter and `p_ip_address` keeps its position.

-- ====================================================================
-- 1. Idempotency claim table
-- ====================================================================
-- A row is claimed *before* any inventory work. The whole RPC runs in one
-- transaction, so a failed attempt rolls the claim back and the key can be
-- retried. Concurrent duplicates block on the primary key until the winner
-- commits, then replay the stored result instead of creating a second order.
CREATE TABLE IF NOT EXISTS public.order_idempotency (
    key TEXT PRIMARY KEY,
    phone TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_idempotency ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_idempotency FORCE ROW LEVEL SECURITY;

-- No policies on purpose: only SECURITY DEFINER functions may touch this table,
-- and anon/authenticated must never read or write it directly.
REVOKE ALL ON TABLE public.order_idempotency FROM anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_order_idempotency_created_at
    ON public.order_idempotency(created_at);

-- Traceability: which order belongs to which claim.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_idempotency_key
    ON public.orders(idempotency_key)
    WHERE idempotency_key IS NOT NULL;


-- ====================================================================
-- 2. `place_order` v2 — idempotent, bounded, privacy-safe
-- ====================================================================
-- The signature gains a trailing parameter, so the old 10-argument overload must
-- be dropped explicitly (CREATE OR REPLACE would otherwise create an ambiguous
-- overload instead of replacing it).
DROP FUNCTION IF EXISTS public.place_order(
    TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT
);

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
    v_idem TEXT;
    v_claimed TEXT;
    v_replay RECORD;
    v_row RECORD;
    v_product_id UUID;
    v_quantity INTEGER;
    v_product_name TEXT;
    v_product_price NUMERIC(10, 2);
    v_product_active BOOLEAN;
    v_avail_stock INTEGER;
    v_item_total NUMERIC(10, 2);
    v_address_snapshot JSONB;
    v_validated_items JSONB := '[]'::jsonb;
    v_grouped JSONB := '{}'::jsonb;
BEGIN
    -- 1. Input validation -------------------------------------------------
    v_user_id := auth.uid();
    v_clean_name := trim(COALESCE(p_customer_name, ''));
    v_clean_city := trim(COALESCE(p_city, ''));
    v_clean_address := trim(COALESCE(p_address_line, ''));
    v_idem := NULLIF(trim(COALESCE(p_idempotency_key, '')), '');

    IF length(v_clean_name) < 2 OR length(v_clean_name) > 80 THEN
        RAISE EXCEPTION 'INVALID_INPUT: Customer name must be between 2 and 80 characters';
    END IF;

    IF length(v_clean_address) < 5 OR length(v_clean_address) > 240 THEN
        RAISE EXCEPTION 'INVALID_INPUT: Detailed address must be between 5 and 240 characters';
    END IF;

    IF length(v_clean_city) < 2 OR length(v_clean_city) > 80 THEN
        RAISE EXCEPTION 'INVALID_INPUT: City name is required';
    END IF;

    IF p_order_notes IS NOT NULL AND length(p_order_notes) > 500 THEN
        RAISE EXCEPTION 'INVALID_INPUT: Order notes are too long';
    END IF;

    IF p_landmark IS NOT NULL AND length(p_landmark) > 120 THEN
        RAISE EXCEPTION 'INVALID_INPUT: Landmark is too long';
    END IF;

    IF p_customer_email IS NOT NULL AND length(trim(p_customer_email)) > 254 THEN
        RAISE EXCEPTION 'INVALID_INPUT: Email is too long';
    END IF;

    -- Authoritative phone normalisation (+201xxxxxxxxx)
    v_normalized_phone := public.normalize_egyptian_phone(p_customer_phone);

    IF v_idem IS NOT NULL AND v_idem !~ '^[A-Za-z0-9_.:-]{8,128}$' THEN
        RAISE EXCEPTION 'INVALID_INPUT: Invalid idempotency key';
    END IF;

    -- 2. Idempotency claim (first write in the transaction) --------------
    IF v_idem IS NOT NULL THEN
        INSERT INTO public.order_idempotency (key, phone)
        VALUES (v_idem, v_normalized_phone)
        ON CONFLICT (key) DO NOTHING
        RETURNING key INTO v_claimed;

        IF v_claimed IS NULL THEN
            -- The key was already used. Replay only when the stored order
            -- belongs to the same phone number.
            SELECT id, order_number, status, customer_name, customer_phone,
                   subtotal, shipping_fee, cod_fee, total, currency, created_at
            INTO v_replay
            FROM public.orders
            WHERE idempotency_key = v_idem;

            IF v_replay.id IS NULL OR v_replay.customer_phone <> v_normalized_phone THEN
                RAISE EXCEPTION 'ORDER_REJECTED: This checkout attempt was already used';
            END IF;

            RETURN jsonb_build_object(
                'success', TRUE,
                'replayed', TRUE,
                'order_id', v_replay.id,
                'order_number', v_replay.order_number,
                'status', v_replay.status,
                'customer_name', v_replay.customer_name,
                'customer_phone', v_replay.customer_phone,
                'subtotal', v_replay.subtotal,
                'shipping_fee', v_replay.shipping_fee,
                'cod_fee', v_replay.cod_fee,
                'total', v_replay.total,
                'currency', v_replay.currency,
                'created_at', v_replay.created_at
            );
        END IF;
    END IF;

    -- 3. Blacklist check (anti-COD-abuse) --------------------------------
    IF EXISTS (
        SELECT 1 FROM public.profiles
        WHERE phone = v_normalized_phone AND is_blacklisted = TRUE
    ) THEN
        RAISE EXCEPTION 'ORDER_REJECTED: Account or phone number is restricted. Please contact customer support.';
    END IF;

    -- 4. Governorate & shipping rate validation -------------------------
    SELECT g.name_ar, g.name_en, sr.shipping_cost, sr.free_shipping_threshold
    INTO v_gov_name_ar, v_gov_name_en, v_shipping_cost, v_free_threshold
    FROM public.governorates g
    JOIN public.shipping_rates sr ON sr.governorate_id = g.id
    WHERE g.id = p_governorate_id AND g.is_active = TRUE AND sr.is_active = TRUE;

    IF v_gov_name_ar IS NULL THEN
        RAISE EXCEPTION 'INVALID_LOCATION: Selected governorate is invalid or inactive';
    END IF;


    -- 5. Item payload validation ----------------------------------------
    IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'EMPTY_CART: Order must contain at least one item';
    END IF;

    IF jsonb_array_length(p_items) > 20 THEN
        RAISE EXCEPTION 'INVALID_ITEM: An order can contain at most 20 line items';
    END IF;

    -- Shape validation before any cast so malformed payloads cannot surface
    -- raw Postgres errors to the caller.
    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(p_items) AS element
        WHERE jsonb_typeof(element) <> 'object'
           OR (element->>'product_id') IS NULL
           OR (element->>'product_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
           OR (element->>'quantity') IS NULL
           OR (element->>'quantity') !~ '^[0-9]{1,6}$'
    ) THEN
        RAISE EXCEPTION 'INVALID_ITEM: Each item needs a valid product_id and a whole-number quantity';
    END IF;

    -- Collapse duplicate product lines into one quantity per product so the
    -- per-product cap cannot be bypassed by repeating the same product.
    SELECT COALESCE(jsonb_object_agg(product_id, total_quantity), '{}'::jsonb)
    INTO v_grouped
    FROM (
        SELECT lower(element->>'product_id') AS product_id,
               SUM((element->>'quantity')::INTEGER) AS total_quantity
        FROM jsonb_array_elements(p_items) AS element
        GROUP BY 1
    ) grouped;

    IF (SELECT count(*) FROM jsonb_object_keys(v_grouped)) > 20 THEN
        RAISE EXCEPTION 'INVALID_ITEM: An order can contain at most 20 distinct products';
    END IF;

    -- 6. Lock inventory in deterministic (product_id) order, validate prices and
    --    stock server-side, deduct atomically. Sorting prevents deadlocks between
    --    concurrent multi-product orders.
    FOR v_row IN
        SELECT key AS product_key, value::INTEGER AS quantity
        FROM jsonb_each_text(v_grouped)
        ORDER BY key
    LOOP
        v_product_id := v_row.product_key::UUID;
        v_quantity := v_row.quantity;

        IF v_quantity < 1 THEN
            RAISE EXCEPTION 'INVALID_ITEM: Quantity must be at least 1';
        END IF;

        IF v_quantity > 10 THEN
            RAISE EXCEPTION 'INVALID_ITEM: Maximum quantity per product is 10';
        END IF;

        SELECT name, price, is_active
        INTO v_product_name, v_product_price, v_product_active
        FROM public.products
        WHERE id = v_product_id;

        IF v_product_name IS NULL OR NOT v_product_active THEN
            RAISE EXCEPTION 'PRODUCT_UNAVAILABLE: Product % is not available', v_product_id;
        END IF;

        -- CRITICAL CONCURRENCY PROTECTION: lock the inventory row.
        SELECT quantity_available
        INTO v_avail_stock
        FROM public.inventory
        WHERE product_id = v_product_id
        FOR UPDATE;

        IF v_avail_stock IS NULL OR v_avail_stock < v_quantity THEN
            -- Never disclose the exact remaining quantity to the caller.
            RAISE EXCEPTION 'INSUFFICIENT_STOCK: The requested quantity is not available for product "%"',
                v_product_name;
        END IF;

        UPDATE public.inventory
        SET quantity_available = quantity_available - v_quantity,
            quantity_reserved = quantity_reserved + v_quantity,
            updated_at = now()
        WHERE product_id = v_product_id;

        v_item_total := v_product_price * v_quantity;
        v_subtotal := v_subtotal + v_item_total;

        v_validated_items := v_validated_items || jsonb_build_object(
            'product_id', v_product_id,
            'product_name', v_product_name,
            'unit_price', v_product_price,
            'quantity', v_quantity,
            'total_price', v_item_total
        );
    END LOOP;

    -- 7. Shipping and totals (trusted server-side rules only) -----------
    IF v_subtotal >= v_free_threshold THEN
        v_actual_shipping := 0.00;
    ELSE
        v_actual_shipping := v_shipping_cost;
    END IF;

    v_total := v_subtotal + v_actual_shipping + v_cod_fee;

    -- 8. Persist the order ----------------------------------------------
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
        id, order_number, user_id, customer_name, customer_phone, customer_email,
        governorate_id, shipping_address_snapshot, status, payment_method,
        payment_status, subtotal, shipping_fee, cod_fee, discount_amount, total,
        currency, order_notes, ip_address, idempotency_key
    ) VALUES (
        v_order_id, v_order_number, v_user_id, v_clean_name, v_normalized_phone,
        nullif(trim(COALESCE(p_customer_email, '')), ''),
        p_governorate_id, v_address_snapshot, 'new', 'cod', 'pending',
        v_subtotal, v_actual_shipping, v_cod_fee, 0.00, v_total,
        'EGP', nullif(trim(COALESCE(p_order_notes, '')), ''), p_ip_address, v_idem
    );

    FOR v_row IN SELECT * FROM jsonb_array_elements(v_validated_items)
    LOOP
        INSERT INTO public.order_items (
            order_id, product_id, product_name, unit_price, quantity, total_price
        ) VALUES (
            v_order_id,
            (v_row.value->>'product_id')::UUID,
            v_row.value->>'product_name',
            (v_row.value->>'unit_price')::NUMERIC(10, 2),
            (v_row.value->>'quantity')::INTEGER,
            (v_row.value->>'total_price')::NUMERIC(10, 2)
        );
    END LOOP;

    INSERT INTO public.order_status_history (
        order_id, from_status, to_status, changed_by, reason
    ) VALUES (
        v_order_id, NULL, 'new', v_user_id, 'Order created successfully (COD Egypt)'
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'replayed', FALSE,
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
        'created_at', now()
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_order(
    TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT
) TO anon, authenticated;

-- ====================================================================
-- 3. Order receipt (confirmation page, cookie-independent)
-- ====================================================================
-- Requires BOTH the order number and the phone that placed the order — the same
-- anti-IDOR control used by `track_order`. Returns item lines and totals only:
-- no address, no email, no payment details.
CREATE OR REPLACE FUNCTION public.get_order_receipt(
    p_order_number TEXT,
    p_phone TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_normalized_phone TEXT;
    v_order RECORD;
    v_items JSONB;
BEGIN
    IF p_order_number IS NULL OR trim(p_order_number) = '' THEN
        RAISE EXCEPTION 'INVALID_INPUT: Order number is required';
    END IF;

    v_normalized_phone := public.normalize_egyptian_phone(p_phone);

    SELECT o.id, o.order_number, o.status, o.customer_name, o.customer_phone,
           o.subtotal, o.shipping_fee, o.cod_fee, o.total, o.currency,
           o.created_at, g.name_ar AS governorate_ar
    INTO v_order
    FROM public.orders o
    LEFT JOIN public.governorates g ON g.id = o.governorate_id
    WHERE upper(trim(o.order_number)) = upper(trim(p_order_number))
      AND o.customer_phone = v_normalized_phone;

    IF v_order.id IS NULL THEN
        RETURN jsonb_build_object('found', FALSE);
    END IF;

    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'product_name', oi.product_name,
                'quantity', oi.quantity,
                'unit_price', oi.unit_price,
                'total_price', oi.total_price
            )
            ORDER BY oi.product_name
        ),
        '[]'::jsonb
    )
    INTO v_items
    FROM public.order_items oi
    WHERE oi.order_id = v_order.id;

    RETURN jsonb_build_object(
        'found', TRUE,
        'order_number', v_order.order_number,
        'status', v_order.status,
        'customer_name', v_order.customer_name,
        'customer_phone', v_order.customer_phone,
        'governorate_ar', v_order.governorate_ar,
        'subtotal', v_order.subtotal,
        'shipping_fee', v_order.shipping_fee,
        'cod_fee', v_order.cod_fee,
        'total', v_order.total,
        'currency', v_order.currency,
        'created_at', v_order.created_at,
        'items', v_items
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_receipt(TEXT, TEXT) TO anon, authenticated;

-- ====================================================================
-- 4. Admin transition validation (domain error instead of a CHECK violation)
-- ====================================================================
-- Also locks the order row so two administrators cannot interleave an invalid
-- pair of transitions, and validates free-text field lengths server-side.
CREATE OR REPLACE FUNCTION public.admin_update_order_status(
    p_order_id UUID,
    p_new_status TEXT,
    p_reason TEXT DEFAULT NULL,
    p_shipping_carrier TEXT DEFAULT NULL,
    p_tracking_number TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_old_status TEXT;
    v_order_number TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'FORBIDDEN: Only administrators can update order status';
    END IF;

    IF p_new_status IS NULL OR p_new_status NOT IN (
        'new', 'confirmed', 'packed', 'shipped', 'delivered', 'refused', 'returned', 'cancelled'
    ) THEN
        RAISE EXCEPTION 'INVALID_STATUS_TRANSITION: Unknown target status';
    END IF;

    IF p_reason IS NOT NULL AND length(p_reason) > 240 THEN
        RAISE EXCEPTION 'INVALID_INPUT: Reason is too long';
    END IF;

    IF p_tracking_number IS NOT NULL AND length(p_tracking_number) > 80 THEN
        RAISE EXCEPTION 'INVALID_INPUT: Tracking number is too long';
    END IF;

    IF p_shipping_carrier IS NOT NULL AND length(p_shipping_carrier) > 80 THEN
        RAISE EXCEPTION 'INVALID_INPUT: Carrier name is too long';
    END IF;

    SELECT status, order_number INTO v_old_status, v_order_number
    FROM public.orders WHERE id = p_order_id FOR UPDATE;

    IF v_old_status IS NULL THEN
        RAISE EXCEPTION 'ORDER_NOT_FOUND: Order does not exist';
    END IF;

    UPDATE public.orders
    SET status = p_new_status,
        shipping_carrier = COALESCE(p_shipping_carrier, shipping_carrier),
        tracking_number = COALESCE(p_tracking_number, tracking_number),
        updated_at = now()
    WHERE id = p_order_id;

    INSERT INTO public.order_status_history (
        order_id, from_status, to_status, changed_by, reason
    ) VALUES (
        p_order_id, v_old_status, p_new_status, auth.uid(),
        COALESCE(p_reason, 'Status changed by admin to ' || p_new_status)
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'order_id', p_order_id,
        'order_number', v_order_number,
        'from_status', v_old_status,
        'to_status', p_new_status
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_order_status(UUID, TEXT, TEXT, TEXT, TEXT)
    TO authenticated;

