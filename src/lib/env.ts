/**
 * Environment configuration.
 *
 * The storefront boots in a fully functional demo mode when Supabase is not
 * configured, so it can be reviewed locally before the database is provisioned.
 * Nothing secret is ever read here — only public browser variables.
 */
const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const rawAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

export const supabaseUrl = rawUrl;
export const supabaseAnonKey = rawAnonKey;

export const isSupabaseConfigured =
  /^https?:\/\//.test(rawUrl) && rawAnonKey.length > 20 && !rawAnonKey.startsWith("your-");

/** Demo mode is local-only; production must use Supabase-backed sessions. */
export const isDemoMode = !isSupabaseConfigured && process.env.NODE_ENV !== "production";

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const onlinePaymentsEnabled =
  process.env.NEXT_PUBLIC_ENABLE_ONLINE_PAYMENTS === "true" && isSupabaseConfigured;

export const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "+201157024375";

export const isProduction = process.env.NODE_ENV === "production";

/**
 * Which backend the server-side data layer may use.
 *
 * - `supabase`  → real database, RLS and RPCs (configured project).
 * - `demo`      → in-memory fixtures, allowed only outside production.
 * - `blocked`   → production without Supabase credentials. Order creation and
 *                 admin operations must fail closed: silently writing orders to
 *                 an in-memory store would accept real customer orders that are
 *                 never persisted or fulfilled.
 */
export type BackendMode = "supabase" | "demo" | "blocked";

export const backendMode: BackendMode = isSupabaseConfigured
  ? "supabase"
  : isDemoMode
    ? "demo"
    : "blocked";

/** True when writes (orders, inventory, status changes) may be persisted. */
export const canPersistWrites = backendMode !== "blocked";

