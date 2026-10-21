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

/** Demo mode = static catalogue + in-memory orders + cookie sessions (no real data). */
export const isDemoMode = !isSupabaseConfigured;

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const onlinePaymentsEnabled =
  process.env.NEXT_PUBLIC_ENABLE_ONLINE_PAYMENTS === "true" && isSupabaseConfigured;

export const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "+201000000000";

export const isProduction = process.env.NODE_ENV === "production";
