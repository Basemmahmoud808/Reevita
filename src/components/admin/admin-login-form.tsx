"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { adminGitHubSignInAction, adminSignInAction, type AuthFormState } from "@/lib/actions/auth";

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState<AuthFormState | null, FormData>(
    adminSignInAction,
    null,
  );

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="admin-email" className="label">
          بريد المدير
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          dir="ltr"
          className="field text-start"
        />
      </div>
      <div>
        <label htmlFor="admin-password" className="label">
          كلمة المرور
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
          dir="ltr"
          className="field text-start"
        />
      </div>
      {state?.error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-danger/5 px-3 py-2.5 text-xs font-semibold text-danger">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        دخول لوحة الإدارة
      </button>
      </form>
      <div className="relative py-1 text-center text-[0.7rem] text-muted before:absolute before:inset-x-0 before:top-1/2 before:border-t before:border-line">
        <span className="relative bg-white px-3">أو</span>
      </div>
      <form action={adminGitHubSignInAction}>
        <button type="submit" className="btn w-full border border-line bg-white text-[#263238] hover:bg-[#f7f6f2]">
          <span aria-hidden className="text-xs font-extrabold tracking-tight">GH</span>
          الدخول بحساب GitHub
        </button>
      </form>
    </div>
  );
}
