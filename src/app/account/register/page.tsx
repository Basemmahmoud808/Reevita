import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UserPlus } from "lucide-react";
import { RegisterForm } from "@/components/account/auth-forms";
import { getSessionUser } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/env";

export const metadata: Metadata = {
  title: "إنشاء حساب — REEVITA",
  robots: { index: false, follow: false },
};

export default async function AccountRegisterPage() {
  const user = await getSessionUser();
  if (user) redirect("/account");

  return (
    <div className="container-luxe flex justify-center py-14 md:py-20">
      <div className="w-full max-w-md">
        <div className="text-center">
          <UserPlus className="mx-auto size-8 text-gold-deep" aria-hidden />
          <p className="eyebrow justify-center mt-4">CREATE ACCOUNT</p>
          <h1 className="display-xl mt-3">إنشاء حساب جديد</h1>
          <p className="mt-3 text-sm text-muted">حساب واحد لمتابعة كل طلباتك.</p>
        </div>
        <div className="mt-8 rounded-2xl border border-line bg-white/80 p-6 shadow-card sm:p-8">
          <RegisterForm demo={isDemoMode} />
        </div>
      </div>
    </div>
  );
}
