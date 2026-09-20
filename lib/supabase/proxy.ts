import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_URL = "https://tzbafipmzhsjzziqcxoa.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_GNXLzI9Ft0R6w8seT7DfdQ_TlPEOUUx";

const PRIVATE_PREFIXES = [
  "/dashboard",
  "/students",
  "/calendar",
  "/lessons",
  "/quran",
  "/reports",
  "/hours",
  "/payments",
  "/exams",
  "/educational-paths",
  "/alerts",
  "/settings",
  "/my-calendar",
];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const pathname = request.nextUrl.pathname;
  const isPrivate = PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (isPrivate && !data?.claims?.sub) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  response.headers.set("Cache-Control", "private, no-store");
  return response;
}