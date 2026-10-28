import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/account/auth-forms";
import { isDemoMode } from "@/lib/env";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="container-luxe max-w-xl py-10 md:py-14">
      <div className="card-luxe p-6 sm:p-8">
        <p className="eyebrow">YOUR REEVITA ACCOUNT</p>
        <h1 className="display-xl mt-3 text-3xl">Sign in</h1>
        <p className="mt-3 text-sm text-muted">Save your details and keep track of your orders.</p>
        <div className="mt-7"><LoginForm demo={isDemoMode} /></div>
        <p className="mt-6 text-center text-sm text-muted">New to REEVITA? <Link href="/account/register" className="font-bold text-gold-deep hover:underline">Create an account</Link></p>
      </div>
    </main>
  );
}
