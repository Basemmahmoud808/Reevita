-- Migration 000002: Row Level Security (RLS) Policies
-- 100% of tables have RLS enabled with strict least-privilege policies.

-- 1. Enable and FORCE RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories FORCE ROW LEVEL SECURITY;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products FORCE ROW LEVEL SECURITY;

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants FORCE ROW LEVEL SECURITY;

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images FORCE ROW LEVEL SECURITY;

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory FORCE ROW LEVEL SECURITY;

ALTER TABLE public.governorates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governorates FORCE ROW LEVEL SECURITY;

ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rates FORCE ROW LEVEL SECURITY;

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses FORCE ROW LEVEL SECURITY;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items FORCE ROW LEVEL SECURITY;

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history FORCE ROW LEVEL SECURITY;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings FORCE ROW LEVEL SECURITY;

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log FORCE ROW LEVEL SECURITY;

-- ====================================================================
-- PROFILES POLICIES
-- ====================================================================
-- Users can read their own profile; admins can read all profiles
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id OR public.is_admin()
    );

-- Users can update their own non-sensitive profile fields
-- (role and is_blacklisted are protected by trigger or admin only)
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (
        auth.uid() = id
    ) WITH CHECK (
        auth.uid() = id AND (
            -- Ensure non-admins cannot elevate their role or unblacklist themselves
            role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) AND
            is_blacklisted = (SELECT p.is_blacklisted FROM public.profiles p WHERE p.id = auth.uid())
        )
    );

-- Admins can update any profile (including roles)
CREATE POLICY "profiles_admin_all" ON public.profiles
    FOR ALL USING (public.is_admin());

-- ====================================================================
-- CATEGORIES POLICIES
-- ====================================================================
-- Anyone (visitors and customers) can view active categories
CREATE POLICY "categories_public_select_active" ON public.categories
    FOR SELECT USING (is_active = TRUE OR public.is_admin());

-- Admins can insert/update/delete categories
CREATE POLICY "categories_admin_all" ON public.categories
    FOR ALL USING (public.is_admin());

-- ====================================================================
-- PRODUCTS, VARIANTS, IMAGES POLICIES
-- ====================================================================
-- Anyone can view active products
CREATE POLICY "products_public_select_active" ON public.products
    FOR SELECT USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "products_admin_all" ON public.products
    FOR ALL USING (public.is_admin());

CREATE POLICY "variants_public_select_active" ON public.product_variants
    FOR SELECT USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "variants_admin_all" ON public.product_variants
    FOR ALL USING (public.is_admin());

CREATE POLICY "images_public_select" ON public.product_images
    FOR SELECT USING (TRUE);

CREATE POLICY "images_admin_all" ON public.product_images
    FOR ALL USING (public.is_admin());

-- ====================================================================
-- INVENTORY POLICIES
-- ====================================================================
-- Direct inventory queries are RESTRICTED to admins only.
-- (Public storefront receives availability status via products view or RPC, preventing competitor stock-scraping)
CREATE POLICY "inventory_admin_only" ON public.inventory
    FOR ALL USING (public.is_admin());

-- ====================================================================
-- GOVERNORATES & SHIPPING RATES POLICIES
-- ====================================================================
-- Anyone can view active governorates and shipping rates
CREATE POLICY "governorates_public_select" ON public.governorates
    FOR SELECT USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "governorates_admin_all" ON public.governorates
    FOR ALL USING (public.is_admin());

CREATE POLICY "shipping_rates_public_select" ON public.shipping_rates
    FOR SELECT USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "shipping_rates_admin_all" ON public.shipping_rates
    FOR ALL USING (public.is_admin());

-- ====================================================================
-- CUSTOMER ADDRESSES POLICIES
-- ====================================================================
CREATE POLICY "addresses_owner_select" ON public.addresses
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "addresses_owner_insert" ON public.addresses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "addresses_owner_update" ON public.addresses
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "addresses_owner_delete" ON public.addresses
    FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- ====================================================================
-- ORDERS & ORDER ITEMS POLICIES
-- ====================================================================
-- CRITICAL SECURITY RULE:
-- Direct INSERT on orders by client is FORBIDDEN.
-- Orders MUST be created exclusively via `place_order` security definer RPC!
-- Customers can only SELECT their own authenticated orders.
CREATE POLICY "orders_customer_select_own" ON public.orders
    FOR SELECT USING (
        (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR public.is_admin()
    );

CREATE POLICY "orders_admin_all" ON public.orders
    FOR ALL USING (public.is_admin());

CREATE POLICY "order_items_customer_select_own" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
            AND ((auth.uid() IS NOT NULL AND o.user_id = auth.uid()) OR public.is_admin())
        )
    );

CREATE POLICY "order_items_admin_all" ON public.order_items
    FOR ALL USING (public.is_admin());

-- ====================================================================
-- ORDER STATUS HISTORY POLICIES
-- ====================================================================
CREATE POLICY "order_history_select" ON public.order_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_status_history.order_id
            AND ((auth.uid() IS NOT NULL AND o.user_id = auth.uid()) OR public.is_admin())
        )
    );

CREATE POLICY "order_history_admin_all" ON public.order_status_history
    FOR ALL USING (public.is_admin());

-- ====================================================================
-- SITE SETTINGS & AUDIT LOG POLICIES
-- ====================================================================
CREATE POLICY "site_settings_public_read" ON public.site_settings
    FOR SELECT USING (TRUE);

CREATE POLICY "site_settings_admin_all" ON public.site_settings
    FOR ALL USING (public.is_admin());

CREATE POLICY "audit_log_admin_only" ON public.audit_log
    FOR ALL USING (public.is_admin());
