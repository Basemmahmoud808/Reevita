import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: "customer" | "admin";
  isBlacklisted: boolean;
}

const DEMO_USER_COOKIE = "rv_demo_user";
export const DEMO_ADMIN_COOKIE = "rv_demo_admin";

function parseDemoUser(raw: string | undefined): SessionUser | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<SessionUser>;
    if (!parsed.email) return null;
    return {
      id: parsed.id ?? "demo-customer",
      email: parsed.email,
      fullName: parsed.fullName ?? parsed.email.split("@")[0] ?? "ضيفة ريفيتا",
      phone: parsed.phone ?? null,
      role: "customer",
      isBlacklisted: false,
    };
  } catch {
    return null;
  }
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();

  if (isDemoMode) {
    return parseDemoUser(cookieStore.get(DEMO_USER_COOKIE)?.value);
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  // getUser() re-validates the JWT with Supabase Auth — safer than getSession().
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, role, is_blacklisted")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: (profile as { full_name?: string } | null)?.full_name ?? user.email?.split("@")[0] ?? "",
    phone: (profile as { phone?: string | null } | null)?.phone ?? null,
    role: ((profile as { role?: string } | null)?.role === "admin" ? "admin" : "customer") as
      | "admin"
      | "customer",
    isBlacklisted: Boolean((profile as { is_blacklisted?: boolean } | null)?.is_blacklisted),
  };
});

export const getAdminSession = cache(async (): Promise<SessionUser | null> => {
  if (isDemoMode) {
    const cookieStore = await cookies();
    if (cookieStore.get(DEMO_ADMIN_COOKIE)?.value !== "1") return null;
    return {
      id: "demo-admin",
      email: "admin@reevita.demo",
      fullName: "مدير المتجر (عرض تجريبي)",
      phone: null,
      role: "admin",
      isBlacklisted: false,
    };
  }
  const user = await getSessionUser();
  return user?.role === "admin" ? user : null;
});

export async function requireCustomer(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/account/login");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function isDemoAdminEnabled(): Promise<boolean> {
  return isDemoMode;
}

export { DEMO_USER_COOKIE };
