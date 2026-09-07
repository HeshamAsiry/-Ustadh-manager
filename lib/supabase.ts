import { createClient } from "@supabase/supabase-js";

// Browser-safe Supabase URL and publishable key.
const SUPABASE_URL = "https://pnhmfkigcvynhrmvcxam.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_NawCKjOBIvETIQEFj3u8hg_jBJSmBJs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(url, key, {
  auth: {
    // Riwaq is a browser-only client, so use the implicit OAuth flow.
    // Google returns the session tokens directly to the browser and Supabase
    // persists them before the dashboard is rendered.
    flowType: "implicit",
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});
