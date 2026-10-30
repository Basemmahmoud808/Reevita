CREATE INDEX IF NOT EXISTS curated_offer_components_product_slug_idx
  ON private.curated_offer_components (product_slug);
