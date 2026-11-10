-- Safer order deletion:
--  * only cancelled / refused orders can be deleted (matches the admin UI)
--  * every deletion is written to audit_log (who, when, which order)
CREATE OR REPLACE FUNCTION public.admin_delete_order(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order public.orders%ROWTYPE;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'NOT_AUTHORIZED';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'ORDER_NOT_FOUND';
    END IF;

    IF v_order.status NOT IN ('cancelled', 'refused') THEN
        RAISE EXCEPTION 'INVALID_STATUS_TRANSITION: Only cancelled or refused orders can be deleted';
    END IF;

    INSERT INTO public.audit_log (user_id, action, entity, entity_id, details)
    VALUES (
        auth.uid(),
        'DELETE_ORDER',
        'orders',
        p_order_id::text,
        jsonb_build_object(
            'order_number', v_order.order_number,
            'customer_name', v_order.customer_name,
            'customer_phone', v_order.customer_phone,
            'status', v_order.status,
            'total', v_order.total
        )
    );

    DELETE FROM public.orders WHERE id = p_order_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_delete_order(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_order(UUID) TO authenticated, service_role;
