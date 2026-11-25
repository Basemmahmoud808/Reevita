"use client";

import { useActionState, useState, useTransition } from "react";
import {
  BellPlus,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
  Users,
  AlertCircle,
} from "lucide-react";
import {
  sendMessengerBroadcastAction,
  sendMessengerOptInAction,
  syncMessengerConversationsAction,
  type MessengerActionState,
} from "@/lib/actions/messenger";
import type { MessengerStats } from "@/lib/messenger/facebook-bot";
import { formatDateTimeAr } from "@/lib/format";

export interface MessengerCatalogItem {
  id: string;
  kind: "product" | "collection";
  label: string;
  title: string;
  message: string;
  linkUrl: string;
  imageUrl: string;
}

export function AdminMessengerPanel({
  configured,
  hasVerifyToken,
  webhookUrl,
  stats,
  catalogItems,
}: {
  configured: boolean;
  hasVerifyToken: boolean;
  webhookUrl: string;
  stats: MessengerStats;
  catalogItems: MessengerCatalogItem[];
}) {
  const [broadcastState, broadcastAction, broadcastPending] = useActionState<
    MessengerActionState | null,
    FormData
  >(sendMessengerBroadcastAction, null);

  const [toolFeedback, setToolFeedback] = useState<MessengerActionState | null>(null);
  const [isSyncing, startSync] = useTransition();
  const [isInviting, startInvite] = useTransition();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [buttonLabel, setButtonLabel] = useState("اطلبي الآن 🛍️");
  const [audience, setAudience] = useState<"all_eligible" | "window_24h" | "marketing_opted_in">(
    "all_eligible",
  );

  function handleSelectPreset(value: string) {
    const item = catalogItems.find((entry) => entry.id === value);
    if (!item) return;
    setTitle(item.title);
    setMessage(item.message);
    setLinkUrl(item.linkUrl);
    setImageUrl(item.imageUrl);
  }

  function handleSync() {
    setToolFeedback(null);
    startSync(async () => {
      const res = await syncMessengerConversationsAction();
      setToolFeedback(res);
    });
  }

  function handleInviteOptIn() {
    setToolFeedback(null);
    startInvite(async () => {
      const res = await sendMessengerOptInAction();
      setToolFeedback(res);
    });
  }

  const kpis = [
    {
      icon: Users,
      label: "إجمالي المحادثات المسجلة",
      value: String(stats.totalSubscribers),
      hint: "كل من تواصل مع الصفحة",
    },
    {
      icon: MessageSquare,
      label: "نشط خلال آخر 24 ساعة",
      value: String(stats.active24hCount),
      hint: "متاح للإرسال الفوري مجاناً",
    },
    {
      icon: BellPlus,
      label: "مشتركين في إشعارات العروض",
      value: String(stats.marketingOptInCount),
      hint: "متاح للإرسال بعد الـ 24 ساعة",
    },
    {
      icon: Sparkles,
      label: "إجمالي المؤهلين الآن",
      value: String(stats.eligibleCount),
      hint: "سيصلهم البث عند الضغط على إرسال",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">FACEBOOK MESSENGER BOT</p>
          <h1 className="display-lg mt-2">بوت رسائل فيسبوك والعروض</h1>
          <p className="mt-1 text-xs text-muted">
            أرسلي عروضك ومنتجاتك الجديدة لمحادثات صفحة فيسبوك بشكل رسمي وآمن وفق سياسة Meta.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSync}
            disabled={!configured || isSyncing}
            className="btn btn-outline px-3.5 py-2 text-xs"
          >
            {isSyncing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            مزامنة محادثات الصفحة
          </button>
          <button
            type="button"
            onClick={handleInviteOptIn}
            disabled={!configured || isInviting || stats.active24hCount === 0}
            className="btn btn-outline px-3.5 py-2 text-xs"
          >
            {isInviting ? <Loader2 className="size-3.5 animate-spin" /> : <BellPlus className="size-3.5" />}
            إرسال دعوة اشتراك العروض
          </button>
        </div>
      </div>

      {/* Status banner */}
      {!configured ? (
        <div className="rounded-2xl border border-gold/50 bg-gold/10 p-4 text-xs leading-6 text-plum">
          <p className="font-bold">البوت جاهز — باقي ربط صفحة فيسبوك (3 متغيرات في Vercel):</p>
          <ul className="mt-2 list-disc space-y-1 ps-5 text-muted">
            <li>
              <code className="font-mono text-plum">META_PAGE_ACCESS_TOKEN</code> — التوكن الخاص بصفحة فيسبوك من Meta Developer App.
            </li>
            <li>
              <code className="font-mono text-plum">META_WEBHOOK_VERIFY_TOKEN</code> — كلمة سر تختارها لتأكيد الـ Webhook{" "}
              {hasVerifyToken ? "(مضاف ✓)" : "(غير مضاف)"}.
            </li>
            <li>
              <code className="font-mono text-plum">META_APP_SECRET</code> — (اختياري لكنه موصى به لحماية توقيع الـ Webhook).
            </li>
          </ul>
          <p className="mt-2 text-muted">
            رابط الـ Webhook اللي هتحطه في Meta:{" "}
            <code dir="ltr" className="rounded bg-white px-2 py-0.5 font-mono text-plum">
              {webhookUrl}
            </code>
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-xs text-plum">
          <span className="inline-flex items-center gap-2 font-bold">
            <CheckCircle2 className="size-4 text-success" />
            بوت ماسنجر متصل وجاهز للإرسال
          </span>
          <code dir="ltr" className="rounded bg-white/80 px-2 py-0.5 font-mono text-[0.68rem] text-muted">
            {webhookUrl}
          </code>
        </div>
      )}

      {toolFeedback && (
        <div
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold ${
            toolFeedback.ok
              ? "border-success/30 bg-success/10 text-plum"
              : "border-danger/30 bg-danger/10 text-danger"
          }`}
        >
          {toolFeedback.ok ? (
            <CheckCircle2 className="size-4 shrink-0 text-success" />
          ) : (
            <AlertCircle className="size-4 shrink-0" />
          )}
          <span>{toolFeedback.message || toolFeedback.error}</span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-line bg-white/80 p-5">
            <span className="flex size-9 items-center justify-center rounded-full bg-cream text-gold-deep">
              <kpi.icon className="size-4.5" aria-hidden />
            </span>
            <p className="mt-3 text-[0.65rem] font-semibold text-muted">{kpi.label}</p>
            <p className="mt-1 text-xl font-bold text-plum">{kpi.value}</p>
            <p className="mt-0.5 text-[0.6rem] text-muted">{kpi.hint}</p>
          </div>
        ))}
      </div>

      {/* Composer + Live Card Preview */}
      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
        <form
          action={broadcastAction}
          className="space-y-4 rounded-2xl border border-line bg-white/85 p-5"
        >
          <div>
            <h2 className="display-md text-lg">إرسال عرض أو منتج جديد</h2>
            <p className="mt-0.5 text-xs text-muted">
              اختاري منتج أو مجموعة من المتجر لملء البيانات تلقائياً، أو اكتبي عرض مخصص.
            </p>
          </div>

          <div>
            <label htmlFor="preset-select" className="mb-1.5 block text-xs font-bold text-plum">
              تعبئة سريعة من المتجر (اختياري)
            </label>
            <select
              id="preset-select"
              defaultValue=""
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="w-full rounded-xl border border-line bg-ivory px-3.5 py-2.5 text-xs text-ink"
            >
              <option value="">— اختاري منتج أو مجموعة —</option>
              <optgroup label="المجموعات (Bundles)">
                {catalogItems
                  .filter((item) => item.kind === "collection")
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="المنتجات">
                {catalogItems
                  .filter((item) => item.kind === "product")
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ms-title" className="mb-1.5 block text-xs font-bold text-plum">
                عنوان الرسالة / العرض *
              </label>
              <input
                id="ms-title"
                name="title"
                required
                maxLength={80}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: عرض الوايت فرايداي — اشتري 2 وخدي 1 هدية"
                className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-xs text-ink"
              />
            </div>

            <div>
              <label htmlFor="ms-audience" className="mb-1.5 block text-xs font-bold text-plum">
                الفئة المستهدفة
              </label>
              <select
                id="ms-audience"
                name="audience"
                value={audience}
                onChange={(e) =>
                  setAudience(
                    e.target.value as "all_eligible" | "window_24h" | "marketing_opted_in",
                  )
                }
                className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-xs text-ink"
              >
                <option value="all_eligible">
                  الكل المؤهل ({stats.eligibleCount}) — 24 ساعة + المشتركين
                </option>
                <option value="window_24h">
                  محادثات آخر 24 ساعة فقط ({stats.active24hCount})
                </option>
                <option value="marketing_opted_in">
                  المشتركين في إشعارات العروض فقط ({stats.marketingOptInCount})
                </option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="ms-message" className="mb-1.5 block text-xs font-bold text-plum">
              نص الرسالة *
            </label>
            <textarea
              id="ms-message"
              name="message"
              required
              rows={3}
              maxLength={600}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="تفاصيل العرض أو المنتج الجديد والسعر..."
              className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-xs text-ink"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label htmlFor="ms-link" className="mb-1.5 block text-xs font-bold text-plum">
                رابط الزر (المنتج أو المجموعة)
              </label>
              <input
                id="ms-link"
                name="linkUrl"
                dir="ltr"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="/collections/soft-glow-bundle"
                className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-xs text-ink"
              />
            </div>

            <div>
              <label htmlFor="ms-btn" className="mb-1.5 block text-xs font-bold text-plum">
                نص الزر
              </label>
              <input
                id="ms-btn"
                name="buttonLabel"
                maxLength={20}
                value={buttonLabel}
                onChange={(e) => setButtonLabel(e.target.value)}
                className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-xs text-ink"
              />
            </div>
          </div>

          <div>
            <label htmlFor="ms-img" className="mb-1.5 block text-xs font-bold text-plum">
              رابط صورة الكارت (اختياري)
            </label>
            <input
              id="ms-img"
              name="imageUrl"
              dir="ltr"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="/images/curated-collections/soft-glow-bundle/set-02.jpg"
              className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-xs text-ink"
            />
          </div>

          {broadcastState && (
            <div
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold ${
                broadcastState.ok
                  ? "border-success/30 bg-success/10 text-plum"
                  : "border-danger/30 bg-danger/10 text-danger"
              }`}
            >
              {broadcastState.ok ? (
                <CheckCircle2 className="size-4 shrink-0 text-success" />
              ) : (
                <AlertCircle className="size-4 shrink-0" />
              )}
              <span>{broadcastState.message || broadcastState.error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!configured || broadcastPending}
            className="btn btn-primary w-full justify-center py-3 text-xs"
          >
            {broadcastPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            إرسال الرسالة لمحادثات فيسبوك الآن
          </button>
        </form>

        {/* Live Messenger Card Preview */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-white/85 p-5">
            <p className="text-xs font-bold text-plum">معاينة شكل الرسالة في الماسنجر</p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-ivory shadow-sm">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="aspect-[16/10] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[16/10] w-full items-center justify-center bg-cream/60 text-xs text-muted">
                  صورة العرض ستظهر هنا
                </div>
              )}
              <div className="p-3.5">
                <p className="text-sm font-bold text-plum">
                  {title || "عنوان العرض أو المنتج الجديد"}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-muted">
                  {message || "اكتبي تفاصيل العرض هنا عشان تظهر للعملاء داخل الماسنجر."}
                </p>
                <div className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-plum py-2 text-xs font-bold text-ivory">
                  <span>{buttonLabel || "اطلبي الآن 🛍️"}</span>
                  <ExternalLink className="size-3.5" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white/85 p-5 text-xs leading-6 text-muted">
            <p className="font-bold text-plum">تذكير سريع بسياسة Meta:</p>
            <ul className="mt-2 list-disc space-y-1 ps-4">
              <li>المحادثات اللي خلال آخر 24 ساعة بتستلم العروض فوراً ومجاناً.</li>
              <li>
                اضغطي <strong>«إرسال دعوة اشتراك العروض»</strong> عشان عملاء آخر 24 ساعة يشتركوا في{" "}
                <strong>Marketing Messages</strong> وتقدري تبعتيلهم مستقبلاً حتى بعد مرور 24 ساعة.
              </li>
              <li>أي عميل يكتب كلمة «عروض» أو «اشتراك» على الصفحة، البوت بيبعتله زر الاشتراك تلقائياً.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Recent Broadcasts History */}
      <section className="rounded-2xl border border-line bg-white/85 p-5">
        <h2 className="display-md text-lg">سجل الحملات السابقة</h2>
        {stats.recentBroadcasts.length === 0 ? (
          <p className="mt-3 text-xs text-muted">لم يتم إرسال أي حملات رسائل بعد.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="pb-2 text-start font-bold">العنوان</th>
                  <th className="pb-2 text-start font-bold">الفئة</th>
                  <th className="pb-2 text-start font-bold">تم الإرسال</th>
                  <th className="pb-2 text-start font-bold">فشل</th>
                  <th className="pb-2 text-start font-bold">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {stats.recentBroadcasts.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2.5 font-bold text-plum">{row.title}</td>
                    <td className="py-2.5 text-muted">
                      {row.audience === "window_24h"
                        ? "آخر 24 ساعة"
                        : row.audience === "marketing_opted_in"
                          ? "مشتركين الإشعارات"
                          : "الكل المؤهل"}
                    </td>
                    <td className="py-2.5 font-bold text-success">{row.sent_count}</td>
                    <td className="py-2.5 text-muted">{row.failed_count}</td>
                    <td className="py-2.5 text-muted">{formatDateTimeAr(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
