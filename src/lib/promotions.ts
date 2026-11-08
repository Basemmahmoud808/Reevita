// Temporary switch for the White Friday gift promotion.
// Product and bundle discounts stay disabled while gifts are offered instead.
export const PROMOTIONAL_DISCOUNTS_ENABLED = false;

export function freeGiftSlots(itemCount: number) {
  if (itemCount >= 6) return 2;
  if (itemCount >= 3) return 1;
  return 0;
}
