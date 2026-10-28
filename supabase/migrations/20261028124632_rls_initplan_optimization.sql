-- Evaluate the stable auth context once per statement rather than once per
-- row, preserving the same ownership checks with lower query overhead.
ALTER POLICY "profiles_select_own_or_admin" ON public.profiles
  USING ((SELECT auth.uid()) = id OR (SELECT public.is_admin()));

ALTER POLICY "profiles_update_own" ON public.profiles
  USING ((SELECT auth.uid()) = id)
  WITH CHECK (
    (SELECT auth.uid()) = id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = (SELECT auth.uid()))
    AND is_blacklisted = (SELECT p.is_blacklisted FROM public.profiles p WHERE p.id = (SELECT auth.uid()))
  );

ALTER POLICY "addresses_owner_select" ON public.addresses
  USING ((SELECT auth.uid()) = user_id OR (SELECT public.is_admin()));
ALTER POLICY "addresses_owner_insert" ON public.addresses
  WITH CHECK ((SELECT auth.uid()) = user_id);
ALTER POLICY "addresses_owner_update" ON public.addresses
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
ALTER POLICY "addresses_owner_delete" ON public.addresses
  USING ((SELECT auth.uid()) = user_id OR (SELECT public.is_admin()));

ALTER POLICY "orders_customer_select_own" ON public.orders
  USING (((SELECT auth.uid()) IS NOT NULL AND user_id = (SELECT auth.uid())) OR (SELECT public.is_admin()));
ALTER POLICY "order_items_customer_select_own" ON public.order_items
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (((SELECT auth.uid()) IS NOT NULL AND o.user_id = (SELECT auth.uid())) OR (SELECT public.is_admin()))
    )
  );
ALTER POLICY "order_history_select" ON public.order_status_history
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_status_history.order_id
        AND (((SELECT auth.uid()) IS NOT NULL AND o.user_id = (SELECT auth.uid())) OR (SELECT public.is_admin()))
    )
  );
