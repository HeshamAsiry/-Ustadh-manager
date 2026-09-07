"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function AuthCallbackPage() {
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let redirected = false;

    const redirectToDashboard = () => {
      if (!active || redirected) return;
      redirected = true;
      window.history.replaceState({}, document.title, "/auth/callback");
      window.location.replace("/dashboard");
    };

    // Google uses the browser implicit flow here. Supabase automatically
    // consumes the tokens from the URL fragment and persists the session.
    // The reliable signal is the auth state event, not an immediate getSession().
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED")) {
        redirectToDashboard();
      }
    });

    const timeout = window.setTimeout(async () => {
      if (!active || redirected) return;
      const { data } = await supabase.auth.getSession();
      if (data.session) redirectToDashboard();
      else setError("لم يتم تأكيد جلسة Google. أعد المحاولة من صفحة تسجيل الدخول.");
    }, 8000);

    return () => {
      active = false;
      window.clearTimeout(timeout);
      listener.subscription.unsubscribe();
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
