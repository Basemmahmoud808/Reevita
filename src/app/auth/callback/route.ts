import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** PKCE callback for Supabase email confirmation / magic links. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/account";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account";

  if (code) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        if (safeNext === "/admin") {
          const { data: { user } } = await supabase.auth.getUser();
          const { data: profile } = user
            ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
            : { data: null };

          if ((profile as { role?: string } | null)?.role !== "admin") {
            await supabase.auth.signOut();
            redirect("/admin/login?error=not-admin");
          }
        }
        redirect(safeNext);
      }
    }
  }
  const returnToAdmin = new URL(request.url).searchParams.get("next") === "/admin";
  redirect(returnToAdmin ? "/admin/login?error=callback" : "/account/login?error=callback");
}
