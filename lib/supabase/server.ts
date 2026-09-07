import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const SUPABASE_URL = "https://pnhmfkigcvynhrmvcxam.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_NawCKjOBIvETIQEFj3u8hg_jBJSmBJs";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY;

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Cookie writes can be unavailable outside a mutable request context.
        }
      },
    },
  });
}
