-- White Friday: buy 2 get 1 free, or buy 4 get 2 free.
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
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
    v_order_id UUID;
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

    IF COALESCE((v_result->>'is_duplicate')::BOOLEAN, FALSE) THEN
        RETURN v_result;
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
        'gift_discount_amount', v_gift_value
    );
END;
$$;

REVOKE ALL ON FUNCTION public.place_order_with_gifts(
    TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, JSONB
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order_with_gifts(
    TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, JSONB
) TO anon, authenticated, service_role;
