import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/account/auth-forms";
import { isDemoMode } from "@/lib/env";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <main className="container-luxe max-w-xl py-10 md:py-14">
      <div className="card-luxe p-6 sm:p-8">
        <p className="eyebrow">JOIN REEVITA</p>
        <h1 className="display-xl mt-3 text-3xl">Create your account</h1>
        <p className="mt-3 text-sm text-muted">Keep your order details close and make every ritual easier.</p>
        <div className="mt-7"><RegisterForm demo={isDemoMode} /></div>
        <p className="mt-6 text-center text-sm text-muted">Already have an account? <Link href="/account/login" className="font-bold text-gold-deep hover:underline">Sign in</Link></p>
      </div>
    </main>
  );
}
