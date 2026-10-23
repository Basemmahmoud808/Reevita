import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/account/auth-forms";
import { getSessionUser } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/env";

export const metadata: Metadata = { title: "تسجيل الدخول", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/account");
  return (
    <div className="container-luxe flex justify-center py-16">
      <div className="w-full max-w-md">
        <h1 className="display-xl mb-6">تسجيل الدخول</h1>
        <LoginForm demo={isDemoMode} />
      </div>
    </div>
  );
}
