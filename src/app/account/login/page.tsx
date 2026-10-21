import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/account/auth-forms";
import { isDemoMode } from "@/lib/env";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/account");

  return (
    <div className="container-luxe flex justify-center py-14 md:py-20">
      <div className="w-full max-w-md">
        <div className="text-center">
          <p className="eyebrow justify-center">WELCOME BACK</p>
          <h1 className="display-xl mt-4">أهلًا بعودتك</h1>
          <p className="mt-3 text-sm text-muted">سجّلي الدخول لمتابعة طلباتك وحفظ بياناتك.</p>
        </div>
        <div className="mt-8 rounded-2xl border border-line bg-white/80 p-6 shadow-card sm:p-8">
          <LoginForm demo={isDemoMode} />
        </div>
        <p className="mt-5 text-center text-[0.7rem] text-muted">
          بالمتابعة أنت توافقين على{" "}
          <Link href="/policies/terms" className="font-bold text-gold-deep hover:underline">
            الشروط والأحكام
          </Link>{" "}
          و{" "}
          <Link href="/policies/privacy" className="font-bold text-gold-deep hover:underline">
            سياسة الخصوصية
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
