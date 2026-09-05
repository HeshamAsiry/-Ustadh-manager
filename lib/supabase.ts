import { createClient } from "@supabase/supabase-js";

// Supabase URL and publishable key are safe for browser-side use.
const SUPABASE_URL = "https://pnhmfkigcvynhrmvcxam.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_NawCKjOBIvETIQEFj3u8hg_jBJSmBJs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(url, key, {
  auth: {
    flowType: "pkce",
    // The callback page performs the single PKCE code exchange explicitly.
    // Keeping URL detection off prevents a race/double exchange on the first
    // Google sign-in attempt.
    detectSessionInUrl: false,
    persistSession: true,
    autoRefreshToken: true,
  },
});
