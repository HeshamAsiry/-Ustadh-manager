import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

const SUPABASE_URL = "https://pnhmfkigcvynhrmvcxam.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_NawCKjOBIvETIQEFj3u8hg_jBJSmBJs";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  if (!code) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("تعذر إكمال تسجيل الدخول عبر Google.")}`, requestUrl.origin),
    );
  }

  // The OAuth code must be exchanged using the same response that receives
  // Supabase's session cookies. Creating the redirect response only after the
  // exchange would otherwise lose the cookies and make /dashboard think the
  // user is signed out on the first login.
  const response = NextResponse.redirect(new URL(safeNext, requestUrl.origin));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.headers.get("cookie")
          ? request.headers.get("cookie")!.split("; ").map((item) => {
              const index = item.indexOf("=");
              return { name: item.slice(0, index), value: decodeURIComponent(item.slice(index + 1)) };
            })
          : [];
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("انتهت جلسة Google أو لم تكتمل. حاول مرة أخرى.")}`, requestUrl.origin),
    );
  }

  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
