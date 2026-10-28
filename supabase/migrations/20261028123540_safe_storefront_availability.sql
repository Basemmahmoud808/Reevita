-- Keep the storefront's stock status available without giving public roles
-- access to the inventory table or a security-definer view.
ALTER FUNCTION public.normalize_egyptian_phone(TEXT)
  SET search_path = pg_catalog, public;

DROP VIEW public.product_availability;
CREATE TABLE public.product_availability (
  product_id UUID PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  in_stock BOOLEAN NOT NULL,
  stock_status TEXT NOT NULL CHECK (stock_status IN ('out_of_stock', 'low_stock', 'in_stock'))
);

ALTER TABLE public.product_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_availability_public_read" ON public.product_availability
  FOR SELECT TO anon, authenticated USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_availability.product_id AND p.is_active = TRUE
    ) OR public.is_admin()
  );
GRANT SELECT ON public.product_availability TO anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.product_availability FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.sync_product_availability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_product_id UUID;
  v_quantity INTEGER;
  v_threshold INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.product_availability WHERE product_id = OLD.product_id;
    RETURN OLD;
  END IF;

  v_product_id := NEW.product_id;
  v_quantity := NEW.quantity_available;
  v_threshold := NEW.low_stock_threshold;
  INSERT INTO public.product_availability (product_id, in_stock, stock_status)
  VALUES (
    v_product_id,
    v_quantity > 0,
    CASE
      WHEN v_quantity <= 0 THEN 'out_of_stock'
      WHEN v_quantity <= v_threshold THEN 'low_stock'
      ELSE 'in_stock'
    END
  )
  ON CONFLICT (product_id) DO UPDATE SET
    in_stock = EXCLUDED.in_stock,
    stock_status = EXCLUDED.stock_status;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.sync_product_availability() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER sync_product_availability_after_inventory_change
  AFTER INSERT OR UPDATE OR DELETE
  ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.sync_product_availability();

INSERT INTO public.product_availability (product_id, in_stock, stock_status)
SELECT product_id, quantity_available > 0,
  CASE
    WHEN quantity_available <= 0 THEN 'out_of_stock'
    WHEN quantity_available <= low_stock_threshold THEN 'low_stock'
    ELSE 'in_stock'
  END
FROM public.inventory
ON CONFLICT (product_id) DO UPDATE SET
  in_stock = EXCLUDED.in_stock,
  stock_status = EXCLUDED.stock_status;

COMMENT ON TABLE public.product_availability IS
  'Public-safe stock status maintained by an inventory trigger; never stores exact quantities.';

-- Cover foreign-key lookups that Supabase's performance advisor identified.
CREATE INDEX IF NOT EXISTS idx_addresses_governorate ON public.addresses(governorate_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant ON public.order_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_changed_by ON public.order_status_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_orders_governorate ON public.orders(governorate_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);

NOTIFY pgrst, 'reload schema';
