"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isDemoMode, siteUrl } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "@/lib/validation";
import { DEMO_ADMIN_COOKIE, DEMO_USER_COOKIE } from "@/lib/auth/session";
import { normalizeEgyptianPhone } from "@/lib/phone";
import { clientIp, hashedKey, rateLimit } from "@/lib/security/rate-limit";

export interface AuthFormState {
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

const RATE_LIMITED_MESSAGE = "عدد المحاولات كبير. يرجى الانتظار قليلًا ثم المحاولة مرة أخرى.";

function demoUserCookie(email: string, fullName: string, phone: string | null) {
  return encodeURIComponent(
    JSON.stringify({
      id: `demo-${Buffer.from(email).toString("base64url").slice(0, 12)}`,
      email,
      fullName,
      phone,
    }),
  );
}

/**
 * Throttle sensitive credential endpoints.
 *
 * Keys combine the caller's network with the targeted account (hashed), which
 * stops both a single host from spraying many accounts and a distributed
 * low-rate attack against one account. Counters live in Redis when Upstash is
 * configured, so limits hold across serverless instances.
 */
async function throttle(scope: string, account: string, limit: number, windowMs: number): Promise<boolean> {
  const headerList = await headers();
  const ip = clientIp(headerList);
  const perIp = await rateLimit(hashedKey(`${scope}-ip`, ip), limit, windowMs);
  const perAccount = await rateLimit(hashedKey(`${scope}-account`, account), limit, windowMs);
  return perIp.allowed && perAccount.allowed;
}

export async function signInAction(_prev: AuthFormState | null, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "يرجى مراجعة البيانات المدخلة", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  if (!(await throttle("login", parsed.data.email, 10, 15 * 60 * 1000))) {
    return { error: RATE_LIMITED_MESSAGE };
  }

  if (isDemoMode) {
    const cookieStore = await cookies();
    const email = parsed.data.email.toLowerCase();
    cookieStore.set(DEMO_USER_COOKIE, demoUserCookie(email, email.split("@")[0] ?? "ضيفة", null), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === "production",
    });
    redirect("/account");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "خدمة الدخول غير متاحة حاليًا." };

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // Deliberately generic: never reveal whether the address exists.
    return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة." };
  }
  redirect("/account");
}

export async function signUpAction(_prev: AuthFormState | null, formData: FormData): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "يرجى مراجعة البيانات المدخلة", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  if (!(await throttle("register", parsed.data.email, 5, 60 * 60 * 1000))) {
    return { error: RATE_LIMITED_MESSAGE };
  }

  const phone = normalizeEgyptianPhone(parsed.data.phone);

  if (isDemoMode) {
    const cookieStore = await cookies();
    cookieStore.set(DEMO_USER_COOKIE, demoUserCookie(parsed.data.email, parsed.data.fullName, phone), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === "production",
    });
    redirect("/account");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "خدمة التسجيل غير متاحة حاليًا." };

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
      data: {
        full_name: parsed.data.fullName,
        phone,
      },
    },
  });
  if (error) {
    // Do not surface provider internals ("User already registered", SMTP errors…):
    // they leak account existence and infrastructure details.
    console.error("[reevita] sign-up failed", error.message);
    return { message: "تعذّر إكمال إنشاء الحساب. إذا كان البريد مسجلًا بالفعل فاستخدمي تسجيل الدخول أو استعادة كلمة المرور." };
  }
  if (!data.session) {
    return { message: "تم إنشاء حسابك. يرجى تأكيد بريدك الإلكتروني ثم تسجيل الدخول." };
  }
  redirect("/account");
}

export async function signOutAction() {
  if (isDemoMode) {
    const cookieStore = await cookies();
    cookieStore.delete(DEMO_USER_COOKIE);
    redirect("/");
  }
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function demoAdminSignInAction() {
  if (!isDemoMode) redirect("/admin/login");
  const cookieStore = await cookies();
  cookieStore.set(DEMO_ADMIN_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
    secure: process.env.NODE_ENV === "production",
  });
  redirect("/admin");
}

export async function demoAdminSignOutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_ADMIN_COOKIE);
  redirect("/admin/login");
}

export async function adminSignInAction(_prev: AuthFormState | null, formData: FormData): Promise<AuthFormState> {
  if (isDemoMode) {
    await demoAdminSignInAction();
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "يرجى مراجعة البريد وكلمة المرور." };

  // The admin endpoint is the highest-value credential target: throttle per
  // network and per account before touching the auth provider.
  if (!(await throttle("admin-login", parsed.data.email, 5, 15 * 60 * 1000))) {
    return { error: RATE_LIMITED_MESSAGE };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "خدمة الدخول غير متاحة حاليًا." };

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .maybeSingle();

  if ((profile as { role?: string } | null)?.role !== "admin") {
    await supabase.auth.signOut();
    return { error: "هذا الحساب لا يملك صلاحية الوصول إلى لوحة الإدارة." };
  }
  redirect("/admin");
}
