"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { signInAction, signUpAction, type AuthFormState } from "@/lib/actions/auth";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-semibold text-danger">{message}</p>;
}

export function LoginForm({ demo }: { demo: boolean }) {
  const [state, formAction, pending] = useActionState<AuthFormState | null, FormData>(
    signInAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      {demo && (
        <p className="rounded-xl border border-gold/40 bg-gold/10 px-3.5 py-2.5 text-[0.72rem] leading-6 text-plum">
          وضع العرض التجريبي: سجّلي الدخول بأي بريد إلكتروني وكلمة مرور (٨ أحرف). للتجربة مع طلبات
          سابقة استخدمي <span dir="ltr">mona@example.com</span>.
        </p>
      )}
      <div>
        <label htmlFor="login-email" className="label">
          البريد الإلكتروني
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          dir="ltr"
          className="field text-start"
          placeholder="name@example.com"
        />
        <FieldError message={state?.fieldErrors?.email?.[0]} />
      </div>
      <div>
        <label htmlFor="login-password" className="label">
          كلمة المرور
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
          dir="ltr"
          className="field text-start"
          placeholder="••••••••"
        />
        <FieldError message={state?.fieldErrors?.password?.[0]} />
      </div>

      {state?.error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-danger/5 px-3 py-2.5 text-xs font-semibold text-danger">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {state.error}
        </p>
      )}
      {state?.message && (
        <p role="status" className="rounded-xl bg-success/10 px-3 py-2.5 text-xs font-semibold text-success">
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        تسجيل الدخول
      </button>

      <p className="text-center text-xs text-muted">
        ليس لديك حساب؟{" "}
        <Link href="/account/register" className="font-bold text-gold-deep hover:underline">
          أنشئي حسابًا
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ demo }: { demo: boolean }) {
  const [state, formAction, pending] = useActionState<AuthFormState | null, FormData>(
    signUpAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      {demo && (
        <p className="rounded-xl border border-gold/40 bg-gold/10 px-3.5 py-2.5 text-[0.72rem] leading-6 text-plum">
          وضع العرض التجريبي: التسجيل لا يتصل بـ Supabase، وسيتم إنشاء جلسة محلية للتجربة.
        </p>
      )}
      <div>
        <label htmlFor="reg-name" className="label">
          الاسم بالكامل
        </label>
        <input id="reg-name" name="fullName" required autoComplete="name" className="field" placeholder="سارة أحمد" />
        <FieldError message={state?.fieldErrors?.fullName?.[0]} />
      </div>
      <div>
        <label htmlFor="reg-phone" className="label">
          رقم الموبايل
        </label>
        <input
          id="reg-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          required
          autoComplete="tel"
          dir="ltr"
          className="field text-start"
          placeholder="01XXXXXXXXX"
        />
        <FieldError message={state?.fieldErrors?.phone?.[0]} />
      </div>
      <div>
        <label htmlFor="reg-email" className="label">
          البريد الإلكتروني
        </label>
        <input
          id="reg-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          dir="ltr"
          className="field text-start"
          placeholder="name@example.com"
        />
        <FieldError message={state?.fieldErrors?.email?.[0]} />
      </div>
      <div>
        <label htmlFor="reg-password" className="label">
          كلمة المرور
        </label>
        <input
          id="reg-password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          dir="ltr"
          className="field text-start"
          placeholder="٨ أحرف على الأقل"
        />
        <FieldError message={state?.fieldErrors?.password?.[0]} />
      </div>

      {state?.error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-danger/5 px-3 py-2.5 text-xs font-semibold text-danger">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {state.error}
        </p>
      )}
      {state?.message && (
        <p role="status" className="rounded-xl bg-success/10 px-3 py-2.5 text-xs font-semibold text-success">
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        إنشاء الحساب
      </button>

      <p className="text-center text-xs text-muted">
        لديك حساب بالفعل؟{" "}
        <Link href="/account/login" className="font-bold text-gold-deep hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </form>
  );
}
