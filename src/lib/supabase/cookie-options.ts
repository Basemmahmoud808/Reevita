/**
 * Auth cookie options shared by the server client and the middleware refresh.
 *
 * `httpOnly: true` is only safe because **all** Supabase usage in this app is server-side
 * (server actions, server components, middleware). There is deliberately no browser Supabase
 * client: if one is ever added, it cannot read these cookies and the flag must be revisited.
 * `maxAge` bounds the browser copy to 60 days instead of the library default of 400 days.
 */
export const authCookieOptions = {
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
  maxAge: 60 * 24 * 60 * 60,
};
