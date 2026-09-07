"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function AuthCallbackPage() {
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let redirected = false;

    const goToDashboard = () => {
      if (!active || redirected) return;
      redirected = true;
      window.history.replaceState({}, document.title, "/auth/callback");
      window.location.replace("/dashboard");
    };

    const handleError = (message: string) => {
      if (!active || redirected) return;
      setError(message);
    };

    const checkSession = async () => {
      const params = new URLSearchParams(window.location.search);
      const oauthError = params.get("error_description") || params.get("error");
      if (oauthError) {
        handleError(`تعذر تسجيل الدخول عبر Google: ${oauthError}`);
        return;
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;
      if (sessionError) {
        handleError(sessionError.message);
        return;
      }
      if (data.session) {
        goToDashboard();
      }
    };

    // Register immediately so we catch the SIGNED_IN event emitted by the
    // automatic PKCE URL exchange. getSession() below also covers a race where
    // the event fires before React finishes mounting the listener.
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        goToDashboard();
      }
    });

    void checkSession();

    const timeout = window.setTimeout(async () => {
      if (!active || redirected) return;
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        goToDashboard();
      } else {
        handleError("تم الرجوع من Google، لكن لم تصل جلسة التطبيق. أعد المحاولة من صفحة تسجيل الدخول.");
      }
    }, 8000);

    return () => {
      active = false;
      window.clearTimeout(timeout);
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "Arial, sans-serif", direction: "rtl", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 520 }}>
        {error ? (
          <>
            <h1>تعذر إكمال تسجيل الدخول</h1>
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
