"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function AuthCallbackPage() {
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const finishLogin = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const authError = params.get("error_description") || params.get("error");

      if (authError) {
        if (active) setError(authError);
        return;
      }

      if (!code) {
        const { data } = await supabase.auth.getSession();
        if (!active) return;
        if (data.session) {
          window.location.replace("/dashboard");
        } else {
          setError("لم يتم العثور على بيانات تسجيل الدخول. أعد المحاولة من Google.");
        }
        return;
      }

      // The Supabase client uses PKCE and detectSessionInUrl=false, so this
      // is the only place where the one-time Google authorization code is
      // exchanged. We then verify the persisted session before navigating.
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (!active) return;

      if (exchangeError || !data.session) {
        setError(exchangeError?.message || "تعذر تأكيد جلسة تسجيل الدخول. أعد المحاولة.");
        return;
      }

      const { data: verified } = await supabase.auth.getSession();
      if (!active) return;

      if (!verified.session) {
        setError("تم تسجيل الدخول مع Google لكن لم يتم حفظ الجلسة. أعد المحاولة.");
        return;
      }

      // Remove the single-use code, then perform a hard navigation so the
      // dashboard starts with the persisted Supabase session already loaded.
      window.history.replaceState({}, document.title, "/auth/callback");
      window.location.replace("/dashboard");
    };

    void finishLogin();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "Arial, sans-serif", direction: "rtl", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        {error ? (
          <>
            <h1>تعذر تسجيل الدخول</h1>
            <p>{error}</p>
            <button onClick={() => window.location.replace("/login")}>العودة إلى تسجيل الدخول</button>
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
