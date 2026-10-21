"use client";

import { useActionState } from "react";
import { Loader2, Send } from "lucide-react";
import { subscribeAction, type NewsletterState } from "@/lib/actions/newsletter";
import { cn } from "@/lib/format";

export function NewsletterForm({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const [state, formAction, pending] = useActionState<NewsletterState | null, FormData>(
    subscribeAction,
    null,
  );

  return (
    <form action={formAction} className={cn("w-full", className)}>
      <label htmlFor="newsletter-email" className="sr-only">
        البريد الإلكتروني
      </label>
      <div
        className={cn(
          "flex items-center gap-2 rounded-full border p-1.5",
          tone === "light" ? "border-ivory/25 bg-white/10" : "border-line bg-white",
        )}
      >
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="بريدك الإلكتروني"
          aria-describedby="newsletter-help"
          className={cn(
            "min-w-0 flex-1 bg-transparent px-4 py-2 text-sm outline-none",
            tone === "light" ? "text-ivory placeholder:text-ivory/50" : "text-ink placeholder:text-muted/70",
          )}
        />
        <button
          type="submit"
          disabled={pending}
          className={cn("btn shrink-0 px-5 py-2.5 text-xs", tone === "light" ? "btn-gold" : "btn-primary")}
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-3.5" aria-hidden />}
          اشتراك
        </button>
      </div>
      <p
        id="newsletter-help"
        className={cn("mt-2 px-2 text-[0.7rem]", tone === "light" ? "text-ivory/50" : "text-muted")}
        role={state?.error ? "alert" : undefined}
      >
        {state?.ok
          ? "تم اشتراكك بنجاح — أول من يعرف عن الجديد والمكافآت."
          : state?.error
            ? state.error
            : "اشتركي لتصلك العروض الحصرية وإطلاقات ريفيتا أولًا."}
      </p>
    </form>
  );
}
