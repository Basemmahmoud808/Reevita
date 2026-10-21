import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/account/auth-forms";
import { isDemoMode } from "@/lib/env";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "إنشاء حساب",
  robots: { index: false, follow: false },
};

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) redirect("/account");

  return (
    <div className="container-luxe flex justify-center py-14 md:py-20">
      <div className="w-full max-w-md">
        <div className="text-center">
          <p className="eyebrow justify-center">JOIN REEVITA</p>
          <h1 className="display-xl mt-4">أنشئي حسابك</h1>
          <p className="mt-3 text-sm text-muted">احفظي بياناتك وتابعي طلباتك بسهولة.</p>
        </div>
        <div className="mt-8 rounded-2xl border border-line bg-white/80 p-6 shadow-card sm:p-8">
          <RegisterForm demo={isDemoMode} />
        </div>
      </div>
    </div>
  );
}
