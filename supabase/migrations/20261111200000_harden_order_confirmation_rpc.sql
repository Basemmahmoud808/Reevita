-- Harden get_order_confirmation RPC against order-number enumeration and PII leakage.
-- 1. Add an unguessable confirmation_token to public.orders (additive; existing orders get a random UUID).
-- 2. Include confirmation_token in public.place_order_with_gifts return payload.
-- 3. Replace public.get_order_confirmation so it requires both order_number and confirmation_token,
--    returns only minimal non-sensitive fields needed by the confirmation page & Purchase event,
--    sets a fixed search_path, and restricts EXECUTE permissions.

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS confirmation_token UUID NOT NULL DEFAULT gen_random_uuid();

CREATE OR REPLACE FUNCTION public.place_order_with_gifts(
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
    p_idempotency_key TEXT DEFAULT NULL,
    p_gift_items JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_result JSONB;
    v_order_id UUID;
    v_confirmation_token UUID;
    v_item_count INTEGER;
    v_gift_count INTEGER;
    v_gift_value NUMERIC(10, 2) := 0;
    v_total NUMERIC(10, 2);
BEGIN
    v_item_count := COALESCE((
        SELECT SUM((item.value->>'quantity')::INTEGER)
        FROM jsonb_array_elements(COALESCE(p_items, '[]'::jsonb)) AS item(value)
    ), 0);
    v_gift_count := COALESCE((
        SELECT SUM((item.value->>'quantity')::INTEGER)
        FROM jsonb_array_elements(COALESCE(p_gift_items, '[]'::jsonb)) AS item(value)
    ), 0);

    IF v_gift_count > (CASE WHEN v_item_count >= 6 THEN 2 WHEN v_item_count >= 3 THEN 1 ELSE 0 END) THEN
        RAISE EXCEPTION 'INVALID_GIFT_SELECTION: Too many free gifts selected';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(COALESCE(p_gift_items, '[]'::jsonb)) AS gift(value)
        LEFT JOIN LATERAL (
            SELECT SUM((item.value->>'quantity')::INTEGER) AS quantity
            FROM jsonb_array_elements(COALESCE(p_items, '[]'::jsonb)) AS item(value)
            WHERE (item.value->>'product_id')::UUID = (gift.value->>'product_id')::UUID
        ) AS requested ON TRUE
        WHERE COALESCE(requested.quantity, 0) < (gift.value->>'quantity')::INTEGER
    ) THEN
        RAISE EXCEPTION 'INVALID_GIFT_SELECTION: Gift selection does not match the bag';
    END IF;

    v_result := public.place_order(
        p_customer_name, p_customer_phone, p_customer_email, p_governorate_id,
        p_city, p_address_line, p_landmark, p_order_notes, p_items,
        p_ip_address, p_idempotency_key
    );
    v_order_id := (v_result->>'order_id')::UUID;

    SELECT confirmation_token
      INTO v_confirmation_token
    FROM public.orders
    WHERE id = v_order_id;

    IF COALESCE((v_result->>'is_duplicate')::BOOLEAN, FALSE) THEN
        RETURN v_result || jsonb_build_object(
            'confirmation_token', v_confirmation_token
        );
    END IF;

    SELECT COALESCE(SUM(product.price * (gift.value->>'quantity')::INTEGER), 0)
      INTO v_gift_value
    FROM jsonb_array_elements(COALESCE(p_gift_items, '[]'::jsonb)) AS gift(value)
    JOIN public.products AS product ON product.id = (gift.value->>'product_id')::UUID;

    IF v_gift_value > 0 THEN
        UPDATE public.orders
        SET discount_amount = discount_amount + v_gift_value,
            total = total - v_gift_value
        WHERE id = v_order_id
        RETURNING total INTO v_total;
    ELSE
        v_total := (v_result->>'total')::NUMERIC;
    END IF;

    RETURN v_result || jsonb_build_object(
        'discount_amount', v_gift_value,
        'total', v_total,
        'gift_discount_amount', v_gift_value,
        'confirmation_token', v_confirmation_token
    );
END;
$$;

REVOKE ALL ON FUNCTION public.place_order_with_gifts(
    TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, JSONB
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order_with_gifts(
    TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, JSONB
) TO postgres, anon, authenticated, service_role;

-- Drop old 1-argument RPC so it cannot be called without a confirmation token
DROP FUNCTION IF EXISTS public.get_order_confirmation(TEXT);

CREATE OR REPLACE FUNCTION public.get_order_confirmation(
    p_order_number TEXT,
    p_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_items JSONB;
BEGIN
    IF p_order_number IS NULL OR length(trim(p_order_number)) = 0 THEN
        RETURN NULL;
    END IF;

    IF p_token IS NULL OR length(trim(p_token)) = 0 THEN
        RETURN NULL;
    END IF;

    SELECT
        o.id,
        o.order_number,
        o.status,
        split_part(trim(o.customer_name), ' ', 1) AS first_name,
        COALESCE(o.shipping_address_snapshot->>'city', '') AS city,
        COALESCE(o.shipping_address_snapshot->>'governorate_ar', '') AS governorate_ar,
        o.subtotal,
        COALESCE(o.discount_amount, 0) AS discount_amount,
        o.shipping_fee,
        o.cod_fee,
        o.total,
        o.currency,
        o.created_at
    INTO v_order
    FROM public.orders o
    WHERE lower(o.order_number) = lower(trim(p_order_number))
      AND o.confirmation_token::text = lower(trim(p_token))
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'productId', oi.product_id,
                'productName', oi.product_name,
                'quantity', oi.quantity,
                'unitPrice', oi.unit_price,
                'totalPrice', oi.total_price
            )
        ),
        '[]'::jsonb
    )
    INTO v_items
    FROM public.order_items oi
    WHERE oi.order_id = v_order.id;

    RETURN jsonb_build_object(
        'orderNumber', v_order.order_number,
        'status', v_order.status,
        'customerName', v_order.first_name,
        'city', v_order.city,
        'governorateAr', v_order.governorate_ar,
        'subtotal', v_order.subtotal,
        'discountAmount', v_order.discount_amount,
        'shippingFee', v_order.shipping_fee,
        'codFee', v_order.cod_fee,
        'total', v_order.total,
        'currency', v_order.currency,
        'createdAt', v_order.created_at,
        'items', v_items
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_order_confirmation(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_confirmation(TEXT, TEXT) TO postgres, anon, authenticated, service_role;
