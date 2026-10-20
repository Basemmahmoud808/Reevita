-- Migration 000005: Admin Operations, Analytics Views & Audit Logging
-- Strictly secured by public.is_admin() check in every function

-- 1. Admin Order Listing with Pagination & Multi-filter
CREATE OR REPLACE FUNCTION public.admin_get_orders(
    p_status TEXT DEFAULT NULL,
    p_governorate_id UUID DEFAULT NULL,
    p_from_date TIMESTAMPTZ DEFAULT NULL,
    p_to_date TIMESTAMPTZ DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_count INTEGER;
    v_orders JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'FORBIDDEN: Admin access required';
    END IF;

    -- Count matching orders
    SELECT count(*)
    INTO v_total_count
    FROM public.orders o
    WHERE (p_status IS NULL OR o.status = p_status)
      AND (p_governorate_id IS NULL OR o.governorate_id = p_governorate_id)
      AND (p_from_date IS NULL OR o.created_at >= p_from_date)
      AND (p_to_date IS NULL OR o.created_at <= p_to_date)
      AND (p_search IS NULL OR (
          o.order_number ILIKE '%' || p_search || '%' OR
          o.customer_name ILIKE '%' || p_search || '%' OR
          o.customer_phone ILIKE '%' || p_search || '%'
      ));

    -- Get matching records with governorate name & items summary
    SELECT COALESCE(jsonb_agg(row_data), '[]'::jsonb)
    INTO v_orders
    FROM (
        SELECT 
            o.id,
            o.order_number,
            o.customer_name,
            o.customer_phone,
            o.customer_email,
            g.name_ar as governorate_ar,
            o.status,
            o.payment_method,
            o.payment_status,
            o.subtotal,
            o.shipping_fee,
            o.total,
            o.currency,
            o.shipping_carrier,
            o.tracking_number,
            o.created_at,
            o.shipping_address_snapshot,
            (
                SELECT jsonb_agg(jsonb_build_object(
                    'product_name', oi.product_name,
                    'quantity', oi.quantity,
                    'unit_price', oi.unit_price,
                    'total_price', oi.total_price
                ))
                FROM public.order_items oi
                WHERE oi.order_id = o.id
            ) as items
        FROM public.orders o
        JOIN public.governorates g ON g.id = o.governorate_id
        WHERE (p_status IS NULL OR o.status = p_status)
          AND (p_governorate_id IS NULL OR o.governorate_id = p_governorate_id)
          AND (p_from_date IS NULL OR o.created_at >= p_from_date)
          AND (p_to_date IS NULL OR o.created_at <= p_to_date)
          AND (p_search IS NULL OR (
              o.order_number ILIKE '%' || p_search || '%' OR
              o.customer_name ILIKE '%' || p_search || '%' OR
              o.customer_phone ILIKE '%' || p_search || '%'
          ))
        ORDER BY o.created_at DESC
        LIMIT p_limit OFFSET p_offset
    ) row_data;

    RETURN jsonb_build_object(
        'total_count', v_total_count,
        'limit', p_limit,
        'offset', p_offset,
        'orders', v_orders
    );
END;
$$;

-- 2. Store Analytics & KPIs (Egyptian E-Commerce Metrics)
CREATE OR REPLACE FUNCTION public.admin_get_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_orders INTEGER;
    v_total_sales NUMERIC(10, 2);
    v_status_counts JSONB;
    v_delivered_count INTEGER := 0;
    v_refused_count INTEGER := 0;
    v_refusal_rate NUMERIC(5, 2) := 0.00;
    v_low_stock JSONB;
    v_low_stock_count INTEGER;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'FORBIDDEN: Admin access required';
    END IF;

    -- Total orders & revenue (Delivered or Confirmed/Shipped)
    SELECT count(*), COALESCE(sum(total), 0.00)
    INTO v_total_orders, v_total_sales
    FROM public.orders
    WHERE status NOT IN ('cancelled', 'refused');

    -- Status breakdowns
    SELECT jsonb_object_agg(status, count)
    INTO v_status_counts
    FROM (
        SELECT status, count(*) as count
        FROM public.orders
        GROUP BY status
    ) s;

    -- Refusal rate calculation: refused / (delivered + refused) * 100
    SELECT 
        COALESCE(count(*) FILTER (WHERE status = 'delivered'), 0),
        COALESCE(count(*) FILTER (WHERE status = 'refused'), 0)
    INTO v_delivered_count, v_refused_count
    FROM public.orders;

    IF (v_delivered_count + v_refused_count) > 0 THEN
        v_refusal_rate := round(((v_refused_count::NUMERIC / (v_delivered_count + v_refused_count)::NUMERIC) * 100), 2);
    END IF;

    -- Low stock products
    SELECT 
        count(*),
        COALESCE(jsonb_agg(jsonb_build_object(
            'product_id', p.id,
            'name', p.name,
            'name_ar', p.name_ar,
            'quantity_available', i.quantity_available,
            'low_stock_threshold', i.low_stock_threshold
        )), '[]'::jsonb)
    INTO v_low_stock_count, v_low_stock
    FROM public.inventory i
    JOIN public.products p ON p.id = i.product_id
    WHERE i.quantity_available <= i.low_stock_threshold;

    RETURN jsonb_build_object(
        'total_orders', v_total_orders,
        'total_sales_egp', v_total_sales,
        'orders_by_status', COALESCE(v_status_counts, '{}'::jsonb),
        'delivered_count', v_delivered_count,
        'refused_count', v_refused_count,
        'refusal_rate_percentage', v_refusal_rate,
        'low_stock_count', v_low_stock_count,
        'low_stock_items', v_low_stock
    );
END;
$$;

-- 3. Admin Update Inventory Stock with Audit Logging
CREATE OR REPLACE FUNCTION public.admin_update_inventory(
    p_product_id UUID,
    p_quantity_available INTEGER,
    p_low_stock_threshold INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_old_qty INTEGER;
    v_prod_name TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'FORBIDDEN: Admin access required';
    END IF;

    IF p_quantity_available < 0 THEN
        RAISE EXCEPTION 'INVALID_INPUT: Stock cannot be negative';
    END IF;

    SELECT i.quantity_available, p.name INTO v_old_qty, v_prod_name
    FROM public.inventory i
    JOIN public.products p ON p.id = i.product_id
    WHERE i.product_id = p_product_id;

    IF v_old_qty IS NULL THEN
        RAISE EXCEPTION 'NOT_FOUND: Product inventory record does not exist';
    END IF;

    UPDATE public.inventory
    SET quantity_available = p_quantity_available,
        low_stock_threshold = COALESCE(p_low_stock_threshold, low_stock_threshold),
        updated_at = now()
    WHERE product_id = p_product_id;

    -- Audit Log
    INSERT INTO public.audit_log (
        user_id, action, entity, entity_id, details
    ) VALUES (
        auth.uid(),
        'UPDATE_STOCK',
        'inventory',
        p_product_id::text,
        jsonb_build_object(
            'product_name', v_prod_name,
            'old_quantity', v_old_qty,
            'new_quantity', p_quantity_available
        )
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'product_id', p_product_id,
        'old_quantity', v_old_qty,
        'new_quantity', p_quantity_available
    );
END;
$$;

-- 4. Admin Update Shipping Rates with Audit Logging
CREATE OR REPLACE FUNCTION public.admin_update_shipping_rate(
    p_governorate_id UUID,
    p_shipping_cost NUMERIC(10, 2),
    p_free_shipping_threshold NUMERIC(10, 2),
    p_estimated_days_min INTEGER DEFAULT NULL,
    p_estimated_days_max INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_gov_name TEXT;
    v_old_cost NUMERIC(10, 2);
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'FORBIDDEN: Admin access required';
    END IF;

    IF p_shipping_cost < 0 OR p_free_shipping_threshold < 0 THEN
        RAISE EXCEPTION 'INVALID_INPUT: Cost and threshold cannot be negative';
    END IF;

    SELECT g.name_ar, sr.shipping_cost INTO v_gov_name, v_old_cost
    FROM public.governorates g
    JOIN public.shipping_rates sr ON sr.governorate_id = g.id
    WHERE g.id = p_governorate_id;

    IF v_gov_name IS NULL THEN
        RAISE EXCEPTION 'NOT_FOUND: Governorate or shipping rate not found';
    END IF;

    UPDATE public.shipping_rates
    SET shipping_cost = p_shipping_cost,
        free_shipping_threshold = p_free_shipping_threshold,
        estimated_days_min = COALESCE(p_estimated_days_min, estimated_days_min),
        estimated_days_max = COALESCE(p_estimated_days_max, estimated_days_max),
        updated_at = now()
    WHERE governorate_id = p_governorate_id;

    -- Audit Log
    INSERT INTO public.audit_log (
        user_id, action, entity, entity_id, details
    ) VALUES (
        auth.uid(),
        'UPDATE_SHIPPING_RATE',
        'shipping_rates',
        p_governorate_id::text,
        jsonb_build_object(
            'governorate', v_gov_name,
            'old_cost', v_old_cost,
            'new_cost', p_shipping_cost,
            'free_threshold', p_free_shipping_threshold
        )
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'governorate_id', p_governorate_id,
        'governorate', v_gov_name,
        'shipping_cost', p_shipping_cost,
        'free_shipping_threshold', p_free_shipping_threshold
    );
END;
$$;
