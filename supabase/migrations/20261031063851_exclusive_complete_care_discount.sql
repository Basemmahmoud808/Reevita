-- Keep the 25% promotion exclusive to Complete Care.
-- All other collection and set offers receive the standard 11% discount.
ALTER TABLE private.curated_offers
  DROP CONSTRAINT IF EXISTS curated_offers_discount_percent_check;

ALTER TABLE private.curated_offers
  ADD CONSTRAINT curated_offers_discount_percent_check
  CHECK (discount_percent IN (0, 11, 15, 25));

UPDATE private.curated_offers
SET discount_percent = CASE
  WHEN collection_slug = 'complete-care-bundle' THEN 25
  ELSE 11
END;

INSERT INTO private.curated_offers (offer_key, collection_slug, offer_kind, discount_percent)
VALUES ('complete-care-bundle:set:1', 'complete-care-bundle', 'set', 25)
ON CONFLICT (offer_key) DO UPDATE SET discount_percent = EXCLUDED.discount_percent;

INSERT INTO private.curated_offer_components (offer_key, product_slug, component_quantity) VALUES
  ('complete-care-bundle:set:1', 'shampoo-blueberry', 1),
  ('complete-care-bundle:set:1', 'shower-gel-blueberry', 1),
  ('complete-care-bundle:set:1', 'body-butter-ruby-musk', 1),
  ('complete-care-bundle:set:1', 'body-lotion-ruby-musk', 1),
  ('complete-care-bundle:set:1', 'body-splash-ruby-musk', 1),
  ('complete-care-bundle:set:1', 'hair-mist-ruby-musk', 1)
ON CONFLICT (offer_key, product_slug) DO UPDATE SET component_quantity = EXCLUDED.component_quantity;

DELETE FROM private.curated_offer_components
WHERE offer_key = 'complete-care-bundle:collection';

INSERT INTO private.curated_offer_components (offer_key, product_slug, component_quantity) VALUES
  ('complete-care-bundle:collection', 'shampoo-blueberry', 1),
  ('complete-care-bundle:collection', 'shower-gel-blueberry', 1),
  ('complete-care-bundle:collection', 'body-butter-ruby-musk', 1),
  ('complete-care-bundle:collection', 'body-lotion-ruby-musk', 1),
  ('complete-care-bundle:collection', 'body-splash-ruby-musk', 1),
  ('complete-care-bundle:collection', 'hair-mist-ruby-musk', 1),
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
  ('complete-care-bundle:collection', 'body-splash-sexy', 1)
ON CONFLICT (offer_key, product_slug) DO UPDATE SET component_quantity = EXCLUDED.component_quantity;
