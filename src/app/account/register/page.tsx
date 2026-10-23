import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/account/auth-forms";
import { getSessionUser } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/env";

export const metadata: Metadata = { title: "إنشاء حساب", robots: { index: false, follow: false } };

export default async function RegisterPage() {
  if (await getSessionUser()) redirect("/account");
  return (
    <div className="container-luxe flex justify-center py-16">
      <div className="w-full max-w-md">
        <h1 className="display-xl mb-6">إنشاء حساب</h1>
        <RegisterForm demo={isDemoMode} />
      </div>
    </div>
  );
}
