"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import {
  sendMessengerOfferBroadcast,
  sendOptInInviteToActive24h,
  syncRecentPageConversations,
  type MessengerAudience,
} from "@/lib/messenger/facebook-bot";

export interface MessengerActionState {
  ok?: boolean;
  message?: string;
  error?: string;
}

export async function syncMessengerConversationsAction(): Promise<MessengerActionState> {
  await requireAdmin();
  const result = await syncRecentPageConversations();
  revalidatePath("/admin/messenger");

  if (!result.ok) {
    return { ok: false, error: result.error ?? "تعذر مزامنة المحادثات." };
  }
  return {
    ok: true,
    message: `تمت مزامنة ${result.synced} محادثة من صفحة فيسبوك بنجاح.`,
  };
}

export async function sendMessengerOptInAction(): Promise<MessengerActionState> {
  await requireAdmin();
  const result = await sendOptInInviteToActive24h();
  revalidatePath("/admin/messenger");

  if (!result.ok) {
    return { ok: false, error: result.error ?? "تعذر إرسال دعوة الاشتراك." };
  }
  return {
    ok: true,
    message: `تم إرسال دعوة الاشتراك في العروض لـ ${result.sent} عميل (فشل: ${result.failed}).`,
  };
}

export async function sendMessengerBroadcastAction(
  _prevState: MessengerActionState | null,
  formData: FormData,
): Promise<MessengerActionState> {
  const admin = await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const linkUrl = String(formData.get("linkUrl") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const buttonLabel = String(formData.get("buttonLabel") ?? "").trim();
  const rawAudience = String(formData.get("audience") ?? "all_eligible");
  const audience: MessengerAudience =
    rawAudience === "window_24h" || rawAudience === "marketing_opted_in"
      ? rawAudience
      : "all_eligible";

  if (!title || !message) {
    return { ok: false, error: "يرجى كتابة عنوان العرض ونص الرسالة." };
  }

  const result = await sendMessengerOfferBroadcast({
    title,
    message,
    linkUrl: linkUrl || undefined,
    imageUrl: imageUrl || undefined,
    buttonLabel: buttonLabel || undefined,
    audience,
    createdBy: admin.email,
  });

  revalidatePath("/admin/messenger");

  if (!result.ok) {
    return { ok: false, error: result.error ?? "تعذر إرسال الرسالة." };
  }

  return {
    ok: true,
    message: `تم الإرسال بنجاح لـ ${result.sent} عميل (فشل: ${result.failed} | خارج النطاق: ${result.skipped}).`,
  };
}
