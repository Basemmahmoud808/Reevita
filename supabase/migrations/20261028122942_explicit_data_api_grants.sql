-- Make the storefront's Data API access explicit as Supabase phases out
-- automatic exposure of new public tables. RLS remains the row-level guard.
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
GRANT SELECT ON
  public.inventory,
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

-- Keep helper and trigger routines off the public RPC surface.
REVOKE EXECUTE ON FUNCTION public.normalize_egyptian_phone(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_order_status_transition() FROM PUBLIC, anon, authenticated;

-- These two public routines are intentionally used by guest checkout/tracking.
REVOKE EXECUTE ON FUNCTION public.place_order(TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT) TO anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.track_order(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_order(TEXT, TEXT) TO anon, authenticated, service_role;

-- RLS policies call is_admin(), so callers need this non-mutating predicate.
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- Administrative RPCs are available to signed-in sessions, then authorize
-- the caller in their function bodies with public.is_admin().
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

-- This Supabase-installed event-trigger helper should not appear as an
-- executable public API function. Its trigger continues to invoke it.
DO $$
BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
  END IF;
END;
$$;
