-- Apply quantity discounts to the uncovered products in an order.
-- Curated offers remain authoritative for their claimed components: the 25%
-- Complete Care offer and 11% offers for other collections are not stacked.
-- This adds a new checkout entry point without renaming or changing the
-- existing order functions, so existing clients keep their current behavior.
CREATE FUNCTION public.place_order_with_volume_discount(
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_customer_email TEXT,
  p_governorate_id UUID,
  p_city TEXT,
  p_address_line TEXT,
  p_landmark TEXT,
  p_order_notes TEXT,
  p_items JSONB,
  p_ip_address TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL,
  p_curated_offers JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_result JSONB;
  v_order_id UUID;
  v_item_count INTEGER := 0;
  v_volume_percent SMALLINT := 0;
  v_order_subtotal NUMERIC(10, 2) := 0;
  v_covered_subtotal NUMERIC(10, 2) := 0;
  v_volume_discount NUMERIC(10, 2) := 0;
  v_total_discount NUMERIC(10, 2) := 0;
  v_order_total NUMERIC(10, 2) := 0;
BEGIN
  -- Use the existing checkout transaction for input validation, inventory
  -- locking, stock checks, price verification, order creation and curated
  -- collection discounts. This function only adds the volume discount after
  -- that trusted result has been created.
  v_result := public.place_order_with_curated_offers(
    p_customer_name,
    p_customer_phone,
    p_customer_email,
    p_governorate_id,
    p_city,
    p_address_line,
    p_landmark,
    p_order_notes,
    p_items,
    p_ip_address,
    p_idempotency_key,
    p_curated_offers
  );

  v_order_id := (v_result->>'order_id')::UUID;

  -- A retry must return the already-discounted order without applying another
  -- discount or changing its inventory a second time.
  IF COALESCE((v_result->>'is_duplicate')::BOOLEAN, FALSE) THEN
    RETURN v_result;
  END IF;

  SELECT COALESCE(SUM((item.value->>'quantity')::INTEGER), 0)::INTEGER
    INTO v_item_count
  FROM jsonb_array_elements(COALESCE(p_items, '[]'::jsonb)) AS item(value);

  v_volume_percent := CASE
    WHEN v_item_count >= 3 THEN 15
    WHEN v_item_count = 2 THEN 11
    ELSE 0
  END;

  SELECT COALESCE(SUM(
    product.price * component.component_quantity * (claim.value->>'quantity')::INTEGER
  ), 0)
    INTO v_covered_subtotal
  FROM jsonb_array_elements(COALESCE(p_curated_offers, '[]'::jsonb)) AS claim(value)
  JOIN private.curated_offer_components AS component
    ON component.offer_key = claim.value->>'offer_key'
  JOIN public.products AS product
    ON product.slug = component.product_slug;

  SELECT subtotal
    INTO v_order_subtotal
  FROM public.orders
  WHERE id = v_order_id;

  IF v_order_subtotal IS NULL THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND: The created order could not be loaded';
  END IF;

  v_volume_discount := ROUND(
    GREATEST(0, v_order_subtotal - v_covered_subtotal) * v_volume_percent / 100,
    0
  );

  IF v_volume_discount > 0 THEN
    UPDATE public.orders
    SET discount_amount = discount_amount + v_volume_discount,
        total = total - v_volume_discount
    WHERE id = v_order_id
    RETURNING discount_amount, total
      INTO v_total_discount, v_order_total;
  ELSE
    SELECT discount_amount, total
      INTO v_total_discount, v_order_total
    FROM public.orders
    WHERE id = v_order_id;
  END IF;

  RETURN v_result || jsonb_build_object(
    'discount_amount', v_total_discount,
    'total', v_order_total,
    'volume_discount_amount', v_volume_discount,
    'volume_discount_percent', v_volume_percent
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.place_order_with_volume_discount(
  TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, JSONB
) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.place_order_with_volume_discount(
  TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, JSONB
) TO anon, authenticated, service_role;
