/**
 * Egyptian mobile number helpers — mirrors the database validation used inside
 * `public.normalize_egyptian_phone(...)` so the client never submits a value the
 * backend would reject. The database remains the authority.
 */
const EGYPTIAN_MOBILE = /^(\+20|0020|0)?1[0125][0-9]{8}$/;

export function cleanPhone(value: string): string {
  return value.replace(/[\s\-()]/g, "");
}

export function isValidEgyptianPhone(value: string): boolean {
  if (!value) return false;
  return EGYPTIAN_MOBILE.test(cleanPhone(value));
}

/** Returns `+201xxxxxxxxx` or null when invalid. */
export function normalizeEgyptianPhone(value: string): string | null {
  const cleaned = cleanPhone(value);
  if (!EGYPTIAN_MOBILE.test(cleaned)) return null;
  const match = cleaned.match(/(1[0125][0-9]{8})$/);
  return match?.[1] ? `+20${match[1]}` : null;
}

/** Pretty local format for UI: 0101 234 5678 */
export function formatEgyptianPhone(value: string): string {
  const normalized = normalizeEgyptianPhone(value);
  if (!normalized) return value;
  const local = `0${normalized.slice(3)}`;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}
