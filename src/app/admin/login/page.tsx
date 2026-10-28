import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Crown, ShieldCheck } from "lucide-react";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { demoAdminSignInAction } from "@/lib/actions/auth";
import { getAdminSession } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/env";

export const metadata: Metadata = {
  title: "دخول لوحة الإدارة",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const admin = await getAdminSession();
  if (admin) redirect("/admin");

  return (
    <div className="container-luxe flex justify-center py-16 md:py-24">
      <div className="w-full max-w-md">
        <div className="text-center">
          <Crown className="mx-auto size-8 text-gold-deep" aria-hidden />
          <p className="eyebrow justify-center mt-4">REEVITA ADMIN</p>
          <h1 className="display-xl mt-3">لوحة الإدارة</h1>
          <p className="mt-3 text-sm text-muted">
            إدارة الطلبات والمخزون والشحن. الصلاحية مقيّدة بحسابات الأدمن فقط.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-line bg-white/80 p-6 shadow-card sm:p-8">
          {error ? (
            <p role="alert" className="mb-4 rounded-xl border border-danger/20 bg-danger/5 px-3.5 py-3 text-xs leading-6 text-danger">
              {error === "not-admin"
                ? "حساب GitHub هذا غير مخوّل لإدارة المتجر. استخدم الحساب المسجل كمدير."
                : error === "supabase"
                  ? "اتصال Supabase غير مضبوط على استضافة الموقع. أضف رابط المشروع والمفتاح العام في Vercel ثم أعد النشر."
                : error === "github"
                  ? "تسجيل GitHub غير مفعّل بعد في إعدادات Supabase. أكمل إعداد مزود GitHub ثم حاول مجددًا."
                  : "تعذر إكمال تسجيل الدخول. راجع إعدادات GitHub وروابط التحويل في Supabase وحاول مرة أخرى."}
            </p>
          ) : null}
          {isDemoMode ? (
            <div className="space-y-4">
              <p className="rounded-xl border border-gold/40 bg-gold/10 px-3.5 py-3 text-[0.75rem] leading-6 text-plum">
                وضع العرض التجريبي مفعّل. يمكنك استعراض لوحة الإدارة ببيانات وهمية للطلبات والمخزون
                دون أي اتصال بقاعدة بيانات حقيقية.
              </p>
              <form action={demoAdminSignInAction}>
                <button type="submit" className="btn btn-primary w-full">
                  دخول العرض التجريبي
                </button>
              </form>
              <p className="flex items-center justify-center gap-1.5 text-[0.68rem] text-muted">
                <ShieldCheck className="size-3.5" aria-hidden />
                في الإنتاج: يتطلب حساب Supabase بدور admin
              </p>
            </div>
          ) : (
            <AdminLoginForm />
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/" className="font-bold text-gold-deep hover:underline">
            العودة إلى المتجر
          </Link>
        </p>
      </div>
    </div>
  );
}
