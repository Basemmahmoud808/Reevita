-- Allow authenticated admins to permanently remove an order and its dependent records.
CREATE OR REPLACE FUNCTION public.admin_delete_order(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'NOT_AUTHORIZED';
    END IF;

    DELETE FROM public.orders WHERE id = p_order_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ORDER_NOT_FOUND';
    END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_delete_order(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_order(UUID) TO authenticated, service_role;
