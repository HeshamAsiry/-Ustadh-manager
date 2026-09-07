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

  const response = NextResponse.redirect(new URL(safeNext, requestUrl.origin));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        const cookieHeader = request.headers.get("cookie") ?? "";
        return cookieHeader
          .split("; ")
          .filter(Boolean)
          .map((part) => {
            const separator = part.indexOf("=");
            return separator === -1
              ? { name: part, value: "" }
              : { name: part.slice(0, separator), value: decodeURIComponent(part.slice(separator + 1)) };
          });
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("انتهت جلسة Google أو لم تكتمل. حاول مرة أخرى.")}`, requestUrl.origin),
    );
  }

  return response;
}
