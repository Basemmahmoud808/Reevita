-- Match set discounts to their visible component count. The 25% offer is
-- reserved for purchasing the Complete Care collection as a whole.
WITH offer_component_counts AS (
  SELECT offer_key, COALESCE(SUM(component_quantity), 0)::INTEGER AS item_count
  FROM private.curated_offer_components
  GROUP BY offer_key
)
UPDATE private.curated_offers AS offer
SET discount_percent = CASE
  WHEN offer.offer_kind = 'collection' AND offer.collection_slug = 'complete-care-bundle' THEN 25
  WHEN offer.offer_kind = 'collection' THEN 11
  WHEN COALESCE(offer_component_counts.item_count, 0) >= 3 THEN 15
  WHEN COALESCE(offer_component_counts.item_count, 0) = 2 THEN 11
  ELSE 0
END
FROM offer_component_counts
WHERE offer.offer_key = offer_component_counts.offer_key;
