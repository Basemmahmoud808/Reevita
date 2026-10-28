-- Supabase default grants can be broader than the RLS policies. Remove those
-- grants first, then expose only the operations the storefront actually uses.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT ON
  public.categories,
  public.products,
  public.product_variants,
  public.product_images,
  public.product_availability,
  public.governorates,
  public.shipping_rates,
  public.site_settings,
  public.collections,
  public.collection_products
TO anon, authenticated;

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT SELECT, INSERT ON public.inventory TO authenticated;
GRANT SELECT ON
  public.orders,
  public.order_items,
  public.order_status_history,
  public.audit_log,
  public.blocked_phones
TO authenticated;
GRANT INSERT, UPDATE, DELETE ON
  public.products,
  public.product_images,
  public.collections,
  public.collection_products
TO authenticated;
GRANT INSERT ON public.newsletter_subscribers TO anon, authenticated;
GRANT SELECT ON public.newsletter_subscribers TO authenticated;

NOTIFY pgrst, 'reload schema';
