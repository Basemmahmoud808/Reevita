-- Keep curated bundle offers private and calculate savings from trusted catalog prices.
CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.curated_offers (
  offer_key TEXT PRIMARY KEY,
  collection_slug TEXT NOT NULL,
  offer_kind TEXT NOT NULL CHECK (offer_kind IN ('set', 'collection')),
  discount_percent SMALLINT NOT NULL CHECK (discount_percent IN (11, 15, 25))
);

CREATE TABLE IF NOT EXISTS private.curated_offer_components (
  offer_key TEXT NOT NULL REFERENCES private.curated_offers(offer_key) ON DELETE CASCADE,
  product_slug TEXT NOT NULL REFERENCES public.products(slug) ON UPDATE CASCADE ON DELETE RESTRICT,
  component_quantity INTEGER NOT NULL CHECK (component_quantity > 0),
  PRIMARY KEY (offer_key, product_slug)
);

ALTER TABLE private.curated_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.curated_offer_components ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.curated_offers FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE private.curated_offer_components FROM PUBLIC, anon, authenticated, service_role;

INSERT INTO private.curated_offers (offer_key, collection_slug, offer_kind, discount_percent) VALUES
  ('hair-care-duo-bundle:set:1', 'hair-care-duo-bundle', 'set', 11),
  ('hair-care-duo-bundle:set:2', 'hair-care-duo-bundle', 'set', 11),
  ('hair-care-duo-bundle:set:3', 'hair-care-duo-bundle', 'set', 11),
  ('hair-care-duo-bundle:collection', 'hair-care-duo-bundle', 'collection', 25),
  ('soft-glow-bundle:set:1', 'soft-glow-bundle', 'set', 15),
  ('soft-glow-bundle:set:3', 'soft-glow-bundle', 'set', 15),
  ('soft-glow-bundle:set:4', 'soft-glow-bundle', 'set', 15),
  ('soft-glow-bundle:collection', 'soft-glow-bundle', 'collection', 25),
  ('complete-care-bundle:set:2', 'complete-care-bundle', 'set', 15),
  ('complete-care-bundle:set:3', 'complete-care-bundle', 'set', 15),
  ('complete-care-bundle:collection', 'complete-care-bundle', 'collection', 25),
  ('fresh-all-day-bundle:set:1', 'fresh-all-day-bundle', 'set', 15),
  ('fresh-all-day-bundle:set:2', 'fresh-all-day-bundle', 'set', 15),
  ('fresh-all-day-bundle:set:3', 'fresh-all-day-bundle', 'set', 15),
  ('fresh-all-day-bundle:collection', 'fresh-all-day-bundle', 'collection', 25);

INSERT INTO private.curated_offer_components (offer_key, product_slug, component_quantity) VALUES
  ('hair-care-duo-bundle:set:1', 'shampoo-dove', 1),
  ('hair-care-duo-bundle:set:1', 'hair-mist-queen', 1),
  ('hair-care-duo-bundle:set:2', 'shampoo-blueberry', 1),
  ('hair-care-duo-bundle:set:2', 'hair-mist-ruby-musk', 1),
  ('hair-care-duo-bundle:set:3', 'shampoo-bubble-gum', 1),
  ('hair-care-duo-bundle:set:3', 'hair-mist-sexy', 1),
  ('hair-care-duo-bundle:collection', 'shampoo-dove', 1),
  ('hair-care-duo-bundle:collection', 'hair-mist-queen', 1),
  ('hair-care-duo-bundle:collection', 'shampoo-blueberry', 1),
  ('hair-care-duo-bundle:collection', 'hair-mist-ruby-musk', 1),
  ('hair-care-duo-bundle:collection', 'shampoo-bubble-gum', 1),
  ('hair-care-duo-bundle:collection', 'hair-mist-sexy', 1),
  ('soft-glow-bundle:set:1', 'body-lotion-queen', 1),
  ('soft-glow-bundle:set:1', 'body-splash-queen', 1),
  ('soft-glow-bundle:set:1', 'body-butter-queen', 1),
  ('soft-glow-bundle:set:3', 'body-lotion-ruby-musk', 1),
  ('soft-glow-bundle:set:3', 'body-splash-ruby-musk', 1),
  ('soft-glow-bundle:set:3', 'body-butter-ruby-musk', 1),
  ('soft-glow-bundle:set:4', 'body-lotion-sexy', 1),
  ('soft-glow-bundle:set:4', 'body-splash-sexy', 1),
  ('soft-glow-bundle:set:4', 'body-butter-sexy', 1),
  ('soft-glow-bundle:collection', 'body-lotion-queen', 1),
  ('soft-glow-bundle:collection', 'body-splash-queen', 1),
  ('soft-glow-bundle:collection', 'body-butter-queen', 1),
  ('soft-glow-bundle:collection', 'body-lotion-ruby-musk', 1),
  ('soft-glow-bundle:collection', 'body-splash-ruby-musk', 1),
  ('soft-glow-bundle:collection', 'body-butter-ruby-musk', 1),
  ('soft-glow-bundle:collection', 'body-lotion-sexy', 1),
  ('soft-glow-bundle:collection', 'body-splash-sexy', 1),
  ('soft-glow-bundle:collection', 'body-butter-sexy', 1),
  ('complete-care-bundle:set:2', 'shampoo-dove', 1),
  ('complete-care-bundle:set:2', 'shower-gel-dove', 1),
  ('complete-care-bundle:set:2', 'body-butter-queen', 1),
  ('complete-care-bundle:set:2', 'body-lotion-queen', 1),
  ('complete-care-bundle:set:2', 'body-splash-queen', 1),
  ('complete-care-bundle:set:2', 'hair-mist-sexy', 1),
  ('complete-care-bundle:set:3', 'shampoo-bubble-gum', 1),
  ('complete-care-bundle:set:3', 'shower-gel-bubble-gum', 1),
  ('complete-care-bundle:set:3', 'body-butter-sexy', 1),
  ('complete-care-bundle:set:3', 'body-lotion-sexy', 1),
  ('complete-care-bundle:set:3', 'body-splash-sexy', 1),
  ('complete-care-bundle:set:3', 'hair-mist-sexy', 1),
  ('complete-care-bundle:collection', 'shampoo-dove', 1),
  ('complete-care-bundle:collection', 'shower-gel-dove', 1),
  ('complete-care-bundle:collection', 'body-butter-queen', 1),
  ('complete-care-bundle:collection', 'body-lotion-queen', 1),
  ('complete-care-bundle:collection', 'body-splash-queen', 1),
  ('complete-care-bundle:collection', 'hair-mist-sexy', 2),
  ('complete-care-bundle:collection', 'shampoo-bubble-gum', 1),
  ('complete-care-bundle:collection', 'shower-gel-bubble-gum', 1),
  ('complete-care-bundle:collection', 'body-butter-sexy', 1),
  ('complete-care-bundle:collection', 'body-lotion-sexy', 1),
  ('complete-care-bundle:collection', 'body-splash-sexy', 1),
  ('fresh-all-day-bundle:set:1', 'shower-gel-dove', 1),
  ('fresh-all-day-bundle:set:1', 'body-lotion-queen', 1),
  ('fresh-all-day-bundle:set:1', 'body-splash-queen', 1),
  ('fresh-all-day-bundle:set:2', 'shower-gel-bubble-gum', 1),
  ('fresh-all-day-bundle:set:2', 'body-lotion-sexy', 1),
  ('fresh-all-day-bundle:set:2', 'body-splash-sexy', 1),
  ('fresh-all-day-bundle:set:3', 'shower-gel-blueberry', 1),
  ('fresh-all-day-bundle:set:3', 'body-lotion-ruby-musk', 1),
  ('fresh-all-day-bundle:set:3', 'body-splash-ruby-musk', 1),
  ('fresh-all-day-bundle:collection', 'shower-gel-dove', 1),
  ('fresh-all-day-bundle:collection', 'body-lotion-queen', 1),
  ('fresh-all-day-bundle:collection', 'body-splash-queen', 1),
  ('fresh-all-day-bundle:collection', 'shower-gel-bubble-gum', 1),
  ('fresh-all-day-bundle:collection', 'body-lotion-sexy', 1),
  ('fresh-all-day-bundle:collection', 'body-splash-sexy', 1),
  ('fresh-all-day-bundle:collection', 'shower-gel-blueberry', 1),
  ('fresh-all-day-bundle:collection', 'body-lotion-ruby-musk', 1),
  ('fresh-all-day-bundle:collection', 'body-splash-ruby-musk', 1);

DROP FUNCTION IF EXISTS public.place_order_with_curated_offers(TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, JSONB);

CREATE FUNCTION public.place_order_with_curated_offers(
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
  v_curated_offers JSONB := COALESCE(p_curated_offers, '[]'::jsonb);
  v_claim JSONB;
  v_offer_key TEXT;
  v_offer_quantity INTEGER;
  v_discount_percent SMALLINT;
  v_offer_kind TEXT;
  v_offer_total NUMERIC(10, 2);
  v_discount_amount NUMERIC(10, 2) := 0;
  v_order_total NUMERIC(10, 2);
  v_result JSONB;
  v_order_id UUID;
BEGIN
  IF jsonb_typeof(v_curated_offers) <> 'array' OR jsonb_array_length(v_curated_offers) > 20 THEN
    RAISE EXCEPTION 'INVALID_BUNDLE_OFFER: Invalid collection discount selection';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(v_curated_offers) AS claim(value)
    WHERE jsonb_typeof(claim.value) <> 'object'
       OR COALESCE(claim.value->>'offer_key', '') !~ '^[a-z0-9-]+:(collection|set:[0-9]+)$'
       OR COALESCE(claim.value->>'quantity', '') !~ '^(?:[1-9]|10)$'
  ) THEN
    RAISE EXCEPTION 'INVALID_BUNDLE_OFFER: Invalid collection discount selection';
  END IF;

  IF EXISTS (
    SELECT claim.value->>'offer_key'
    FROM jsonb_array_elements(v_curated_offers) AS claim(value)
    GROUP BY claim.value->>'offer_key'
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'INVALID_BUNDLE_OFFER: Duplicate collection discount selection';
  END IF;

  -- Preserve the existing inventory locks, price checks, stock checks and order creation.
  v_result := public.place_order(
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
    p_idempotency_key
  );

  v_order_id := (v_result->>'order_id')::UUID;
  IF COALESCE((v_result->>'is_duplicate')::BOOLEAN, FALSE) THEN
    SELECT discount_amount, total
      INTO v_discount_amount, v_order_total
    FROM public.orders
    WHERE id = v_order_id;
    RETURN v_result || jsonb_build_object(
      'discount_amount', COALESCE(v_discount_amount, 0),
      'total', v_order_total
    );
  END IF;

  -- Offers are looked up from a private table, and their component prices come from products.
  FOR v_claim IN SELECT value FROM jsonb_array_elements(v_curated_offers) AS claims(value)
  LOOP
    v_offer_key := v_claim->>'offer_key';
    v_offer_quantity := (v_claim->>'quantity')::INTEGER;

    SELECT offer.offer_kind,
           offer.discount_percent,
           SUM(product.price * component.component_quantity)
      INTO v_offer_kind, v_discount_percent, v_offer_total
    FROM private.curated_offers AS offer
    JOIN private.curated_offer_components AS component ON component.offer_key = offer.offer_key
    JOIN public.products AS product ON product.slug = component.product_slug
    WHERE offer.offer_key = v_offer_key
    GROUP BY offer.offer_kind, offer.discount_percent;

    IF v_offer_kind IS NULL OR v_offer_total IS NULL THEN
      RAISE EXCEPTION 'INVALID_BUNDLE_OFFER: Unknown collection discount';
    END IF;

    v_discount_amount := v_discount_amount + ROUND(v_offer_total * v_offer_quantity * v_discount_percent / 100, 0);
  END LOOP;

  -- Every discounted component must be present in the cart, without applying a discount twice.
  IF EXISTS (
    WITH claim_list AS (
      SELECT claim.value->>'offer_key' AS offer_key,
             (claim.value->>'quantity')::INTEGER AS offer_quantity
      FROM jsonb_array_elements(v_curated_offers) AS claim(value)
    ), required_components AS (
      SELECT product.id AS product_id,
             SUM(component.component_quantity * claim_list.offer_quantity) AS quantity
      FROM claim_list
      JOIN private.curated_offers AS offer ON offer.offer_key = claim_list.offer_key
      JOIN private.curated_offer_components AS component ON component.offer_key = offer.offer_key
      JOIN public.products AS product ON product.slug = component.product_slug
      GROUP BY product.id
    ), requested_items AS (
      SELECT (item.value->>'product_id')::UUID AS product_id,
             SUM((item.value->>'quantity')::INTEGER) AS quantity
      FROM jsonb_array_elements(p_items) AS item(value)
      GROUP BY (item.value->>'product_id')::UUID
    )
    SELECT 1
    FROM required_components AS required
    LEFT JOIN requested_items AS requested USING (product_id)
    WHERE COALESCE(requested.quantity, 0) < required.quantity
  ) THEN
    RAISE EXCEPTION 'INVALID_BUNDLE_OFFER: Collection products do not match the cart';
  END IF;

  UPDATE public.orders
  SET discount_amount = v_discount_amount,
      total = total - v_discount_amount
  WHERE id = v_order_id
  RETURNING total INTO v_order_total;

  RETURN v_result || jsonb_build_object(
    'discount_amount', v_discount_amount,
    'total', v_order_total
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.place_order_with_curated_offers(TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order_with_curated_offers(TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, JSONB) TO anon, authenticated, service_role;
