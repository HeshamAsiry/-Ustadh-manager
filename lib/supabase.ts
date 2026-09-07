import { createClient } from "@supabase/supabase-js";

// Browser-safe Supabase URL and publishable key.
const SUPABASE_URL = "https://pnhmfkigcvynhrmvcxam.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_NawCKjOBIvETIQEFj3u8hg_jBJSmBJs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(url, key, {
  auth: {
    // Use PKCE for Google OAuth. The callback page exchanges the one-time
    // authorization code before the dashboard is allowed to render.
    flowType: "pkce",
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});
