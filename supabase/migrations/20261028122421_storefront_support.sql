-- Migration 000006: Storefront support
-- 1) Automatically create a profile whenever a Supabase Auth user signs up.
-- 2) Expose a privacy-safe stock availability view to the storefront WITHOUT
--    opening the inventory table (which stays admin-only under RLS).
-- 3) Newsletter subscriptions with insert-only public access.

-- ====================================================================
-- 1. Auth user -> profile provisioning
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone, role)
    VALUES (
        NEW.id,
        COALESCE(
            NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
            NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
            'عميلة ريفيتا'
        ),
        NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'phone', '')), ''),
        'customer'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- 2. Public stock availability (no quantities, no competitor scraping)
-- ====================================================================
DROP VIEW IF EXISTS public.product_availability;
CREATE VIEW public.product_availability AS
SELECT
    product_id,
    (quantity_available > 0) AS in_stock,
    CASE
        WHEN quantity_available <= 0 THEN 'out_of_stock'
        WHEN quantity_available <= low_stock_threshold THEN 'low_stock'
        ELSE 'in_stock'
    END AS stock_status
FROM public.inventory;

COMMENT ON VIEW public.product_availability IS
    'Storefront-safe availability: exposes only in_stock/low_stock/out_of_stock — never exact stock.';

GRANT SELECT ON public.product_availability TO anon, authenticated;

-- ====================================================================
-- 3. Newsletter subscribers (insert-only for the public)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    source TEXT NOT NULL DEFAULT 'storefront',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "newsletter_public_insert" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_public_insert" ON public.newsletter_subscribers
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "newsletter_admin_select" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_admin_select" ON public.newsletter_subscribers
    FOR SELECT USING (public.is_admin());

GRANT INSERT ON public.newsletter_subscribers TO anon, authenticated;
GRANT SELECT ON public.newsletter_subscribers TO authenticated;

-- ====================================================================
-- 4. Helpful indexes for storefront queries
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- Refresh PostgREST schema cache so the new view/table are immediately visible.
NOTIFY pgrst, 'reload schema';
