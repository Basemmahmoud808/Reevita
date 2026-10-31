import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signOutAction } from "@/lib/actions/auth";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "My REEVITA Account",
  description: "View your private REEVITA account and order information.",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/account/login");

  return (
    <main className="container-luxe max-w-3xl py-10 md:py-14">
      <p className="eyebrow">YOUR REEVITA ACCOUNT</p>
      <h1 className="display-xl mt-3">Welcome back, {user.fullName}</h1>
      <div className="card-luxe mt-9 p-6 sm:p-8">
        <dl className="grid gap-5 sm:grid-cols-2">
          <div><dt className="label">Email</dt><dd className="text-sm text-muted">{user.email}</dd></div>
          <div><dt className="label">Phone</dt><dd className="text-sm text-muted">{user.phone ?? "Not added yet"}</dd></div>
        </dl>
        <div className="mt-8 flex flex-wrap gap-3 border-t border-line pt-6">
          <a href="/track" className="btn btn-primary">Track an order</a>
          <form action={signOutAction}><button type="submit" className="btn btn-outline">Sign out</button></form>
        </div>
      </div>
    </main>
  );
}
