"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function AuthCallbackPage() {
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let finished = false;

    const finish = () => {
      if (!active || finished) return;
      finished = true;
      // Remove OAuth query parameters before navigating away.
      window.history.replaceState({}, document.title, "/auth/callback");
      window.location.replace("/dashboard");
    };

    const fail = (message: string) => {
      if (!active || finished) return;
      finished = true;
      setError(message);
    };

    const run = async () => {
      // PKCE returns a one-time `code` in the query string. Exchange it exactly
      // once on the same browser Supabase client that owns the PKCE verifier.
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const oauthError = params.get("error_description") || params.get("error");

      if (oauthError) {
        fail(`تعذر تسجيل الدخول عبر Google: ${oauthError}`);
        return;
      }

      if (!code) {
        // Covers a direct visit to this page and a session that was already
        // created before navigation.
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          fail(sessionError.message);
          return;
        }
        if (data.session) finish();
        else fail("لم يصل رمز تسجيل الدخول من Google. أعد المحاولة من صفحة تسجيل الدخول.");
        return;
      }

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        fail(`تعذر تأكيد جلسة Google: ${exchangeError.message}`);
        return;
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session) {
        fail("تم تأكيد Google لكن لم يتم إنشاء جلسة التطبيق. أعد المحاولة.");
        return;
      }

      finish();
    };

    void run();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "Arial, sans-serif", direction: "rtl", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 460 }}>
        {error ? (
          <>
            <h1>تعذر تسجيل الدخول</h1>
            <p>{error}</p>
            <button onClick={() => window.location.replace("/login")}>العودة إلى تسجيل الدخول</button>
          </>
        ) : (
          <>
            <h1>جارٍ تسجيل الدخول...</h1>
            <p>يتم تأكيد حساب Google وإنشاء الجلسة، لحظات فقط.</p>
          </>
        )}
      </div>
    </main>
  );
}
