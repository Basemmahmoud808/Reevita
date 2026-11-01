-- The individual Complete Care set offer is 25% as shown on the collection cards.
UPDATE private.curated_offers
SET discount_percent = 25
WHERE collection_slug = 'complete-care-bundle'
  AND offer_kind = 'set';
