"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
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
        if (active && data.session) {
          router.replace("/dashboard");
          router.refresh();
        } else if (active) {
          setError("لم يتم العثور على بيانات تسجيل الدخول. أعد المحاولة من Google.");
        }
        return;
      }

      // One explicit PKCE exchange. detectSessionInUrl is disabled in the
      // Supabase client, so there is no second exchange racing this request.
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (!active) return;

      if (exchangeError || !data.session) {
        setError(exchangeError?.message || "تعذر تأكيد جلسة تسجيل الدخول. أعد المحاولة.");
        return;
      }

      // Remove the one-time authorization code from the address bar before
      // navigating so a refresh can never attempt to exchange it again.
      window.history.replaceState({}, document.title, "/auth/callback");
      router.replace("/dashboard");
      router.refresh();
    };

    void finishLogin();
    return () => { active = false; };
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
