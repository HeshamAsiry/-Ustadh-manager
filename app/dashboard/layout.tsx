"use client";

import { ReactNode, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pnhmfkigcvynhrmvcxam.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_NawCKjOBIvETIQEFj3u8hg_jBJSmBJs";

// The OAuth callback is returned to /dashboard with tokens in the URL hash.
// Initialize a dedicated client explicitly before rendering the dashboard so
// the existing dashboard page cannot race Supabase's automatic initialization.
const authClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    flowType: "implicit",
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
    skipAutoInitialize: true,
  },
});

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    void authClient.auth.initialize().finally(() => {
      if (mounted) setReady(true);
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    return (
      <main className="dashboard-loading" dir="rtl">
        <div className="loading-card">
          <div className="loading-mark">ر</div>
          <p>جارٍ التحقق من تسجيل الدخول...</p>
        </div>
      </main>
    );
  }

  return children;
}
