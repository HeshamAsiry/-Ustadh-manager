import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("تعذر إكمال تسجيل الدخول عبر Google.")}`, requestUrl.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("انتهت جلسة Google أو لم تكتمل. حاول مرة أخرى.")}`, requestUrl.origin));
  }

  const response = NextResponse.redirect(new URL(safeNext, requestUrl.origin));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
