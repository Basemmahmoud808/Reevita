import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}

export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "طلب غير صالح" }, { status: 403 });

  let subscription: unknown;
  try {
    subscription = await request.json();
  } catch {
    return NextResponse.json({ error: "بيانات الاشتراك غير صالحة" }, { status: 400 });
  }

  if (!subscription || typeof subscription !== "object") {
    return NextResponse.json({ error: "بيانات الاشتراك غير صالحة" }, { status: 400 });
  }
  const value = subscription as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  if (
    typeof value.endpoint !== "string" ||
    !value.endpoint.startsWith("https://") ||
    typeof value.keys?.p256dh !== "string" ||
    typeof value.keys?.auth !== "string"
  ) {
    return NextResponse.json({ error: "بيانات الاشتراك غير مكتملة" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "الخدمة غير متاحة" }, { status: 503 });
  const { error } = await supabase.from("admin_push_subscriptions").upsert(
    {
      endpoint: value.endpoint,
      user_id: admin.id,
      subscription,
      user_agent: request.headers.get("user-agent"),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );
  if (error) {
    console.error("[reevita] admin push subscription save failed");
    return NextResponse.json({ error: "تعذّر حفظ إعداد الإشعارات" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "طلب غير صالح" }, { status: 403 });

  let endpoint: unknown;
  try {
    endpoint = (await request.json()).endpoint;
  } catch {
    return NextResponse.json({ error: "بيانات الاشتراك غير صالحة" }, { status: 400 });
  }
  if (typeof endpoint !== "string" || !endpoint.startsWith("https://")) {
    return NextResponse.json({ error: "بيانات الاشتراك غير صالحة" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "الخدمة غير متاحة" }, { status: 503 });
  const { error } = await supabase
    .from("admin_push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("user_id", admin.id);
  if (error) return NextResponse.json({ error: "تعذّر إيقاف الإشعارات" }, { status: 500 });
  return NextResponse.json({ success: true });
}
