"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const finishLogin = async () => {
      const code = searchParams.get("code");
      const authError = searchParams.get("error_description") || searchParams.get("error");

      if (authError) {
        if (active) setError(decodeURIComponent(authError.replace(/\+/g, " ")));
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

      router.replace("/dashboard");
      router.refresh();
    };

    void finishLogin();
    return () => { active = false; };
  }, [router, searchParams]);

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
