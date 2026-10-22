"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  email: z.string().trim().email({ message: "يرجى إدخال بريد إلكتروني صحيح" }),
});

export interface NewsletterState {
  ok?: boolean;
  error?: string;
}

/** Demo-mode subscribers live in memory; Supabase mode inserts into newsletter_subscribers (RLS: insert-only). */
const demoSubscribers = new Set<string>();

export async function subscribeAction(_prev: NewsletterState | null, formData: FormData): Promise<NewsletterState> {
  const headerList = await headers();
  const ip = clientIp(headerList);
  if (!(await rateLimit(`newsletter:${ip}`, 5, 10 * 60 * 1000)).allowed) {
    return { error: "عدد المحاولات كبير. يرجى المحاولة لاحقًا." };
  }

  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بريد إلكتروني غير صحيح" };
  }
  const email = parsed.data.email.toLowerCase();

  if (!isSupabaseConfigured) {
    demoSubscribers.add(email);
    return { ok: true };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "خدمة الاشتراك غير متاحة حاليًا." };
  const { error } = await supabase.from("newsletter_subscribers").insert({ email, source: "storefront" });
  if (error && !error.message.includes("duplicate")) {
    console.error("[reevita] newsletter insert failed", error.message);
    return { error: "تعذّر إتمام الاشتراك. يرجى المحاولة لاحقًا." };
  }
  return { ok: true };
}
