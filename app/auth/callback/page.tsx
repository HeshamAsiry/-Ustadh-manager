"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) {
      setError("لم يتم إعداد الاتصال بالخادم بعد.");
      return;
    }

    let active = true;
    const client = supabase;

    const goToDashboard = () => {
      if (!active) return;
      router.replace("/dashboard");
      router.refresh();
    };

    // detectSessionInUrl is enabled in lib/supabase.ts, so Supabase itself
    // consumes the one-time PKCE code from the OAuth callback URL.
    // Do not call exchangeCodeForSession here: a PKCE auth code can only be
    // exchanged once, and doing it manually can race with auto detection.
    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        goToDashboard();
      }
    });

    const checkSession = async () => {
      const { data, error: sessionError } = await client.auth.getSession();
      if (!active) return;

      if (sessionError) {
        setError("تعذر قراءة جلسة تسجيل الدخول. أعد المحاولة.");
        return;
      }

      if (data.session) {
        goToDashboard();
        return;
      }

      // Give the automatic URL detection a moment to finish, then check once more.
      window.setTimeout(async () => {
        const { data: retry } = await client.auth.getSession();
        if (!active) return;

        if (retry.session) {
          goToDashboard();
        } else {
          setError("لم يتم إنشاء جلسة تسجيل الدخول. أعد المحاولة من صفحة تسجيل الدخول.");
        }
      }, 2000);
    };

    void checkSession();

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "Arial, sans-serif", direction: "rtl", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        {error ? (
          <>
            <h1>تعذر تسجيل الدخول</h1>
            <p>{error}</p>
            <button onClick={() => router.replace("/login")}>العودة إلى تسجيل الدخول</button>
          </>
        ) : (
          <>
            <h1>جارٍ تسجيل الدخول...</h1>
            <p>لحظات، يتم تأكيد حسابك الآن.</p>
          </>
        )}
      </div>
    </main>
  );
}
