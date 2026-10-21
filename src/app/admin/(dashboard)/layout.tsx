import Link from "next/link";
import { LogOut, ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { demoAdminSignOutAction, signOutAction } from "@/lib/actions/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { Logo } from "@/components/brand/logo";
import { isDemoMode } from "@/lib/env";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-[#f6f0ea]">
      <div className="border-b border-line bg-ivory">
        <div className="container-luxe flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-4">
            <Logo size="sm" withTagline={false} />
            <span className="rounded-full bg-plum px-2.5 py-1 text-[0.58rem] font-bold tracking-[0.18em] text-gold uppercase">
              ADMIN
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-end sm:block">
              <p className="text-xs font-bold text-plum">{admin.fullName}</p>
              <p className="text-[0.62rem] text-muted">{admin.email}</p>
            </div>
            <form
              action={isDemoMode ? demoAdminSignOutAction : signOutAction}
            >
              <button type="submit" className="btn btn-outline px-3.5 py-2 text-[0.68rem]">
                <LogOut className="size-3.5" aria-hidden />
                خروج
              </button>
            </form>
            <Link href="/" className="btn btn-primary px-3.5 py-2 text-[0.68rem]">
              المتجر
            </Link>
          </div>
        </div>
      </div>

      <div className="container-luxe py-7">
        {isDemoMode && (
          <p className="mb-5 flex items-start gap-2 rounded-xl border border-gold/40 bg-gold/10 px-4 py-2.5 text-[0.7rem] leading-6 text-plum">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-gold-deep" aria-hidden />
            <span>
              <strong>وضع تجريبي:</strong> كل البيانات هنا وهمية وتُحفظ في الذاكرة فقط — التغييرات
              تختفي عند إعادة تشغيل السيرفر. اربطي Supabase لتشغيل الإدارة الحقيقية.
            </span>
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
          <AdminNav />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
