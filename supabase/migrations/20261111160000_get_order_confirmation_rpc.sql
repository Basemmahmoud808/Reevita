-- Secure RPC to display order confirmation after checkout even if cookies are dropped
CREATE OR REPLACE FUNCTION public.get_order_confirmation(p_order_number TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_items JSONB;
BEGIN
    SELECT * INTO v_order
    FROM public.orders
    WHERE lower(order_number) = lower(trim(p_order_number))
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'productId', product_id,
            'productName', product_name,
            'quantity', quantity,
            'unitPrice', unit_price,
            'totalPrice', total_price
        )
    ), '[]'::jsonb) INTO v_items
    FROM public.order_items
    WHERE order_id = v_order.id;

    RETURN jsonb_build_object(
        'orderId', v_order.id,
        'orderNumber', v_order.order_number,
        'customerName', v_order.customer_name,
        'customerPhone', v_order.customer_phone,
        'subtotal', v_order.subtotal,
        'discountAmount', COALESCE(v_order.discount_amount, 0),
        'shippingFee', v_order.shipping_fee,
        'codFee', v_order.cod_fee,
        'total', v_order.total,
        'currency', v_order.currency,
        'createdAt', v_order.created_at,
        'status', v_order.status,
        'items', v_items
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_confirmation(TEXT) TO postgres, anon, authenticated, service_role;
