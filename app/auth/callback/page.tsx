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

    const finish = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          if (active) setError("تعذر تأكيد تسجيل الدخول مع Google. أعد المحاولة من صفحة تسجيل الدخول.");
          return;
        }
      }

      const { data, error: sessionError } = await client.auth.getSession();
      if (sessionError) {
        if (active) setError("تعذر قراءة جلسة تسجيل الدخول. أعد المحاولة.");
        return;
      }

      if (data.session) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      // Wait briefly for Supabase to finish restoring the session from the URL.
      const { data: listener } = client.auth.onAuthStateChange((event, session) => {
        if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
          router.replace("/dashboard");
          router.refresh();
        }
      });

      window.setTimeout(async () => {
        const { data: retry } = await client.auth.getSession();
        listener.subscription.unsubscribe();
        if (!retry.session && active) {
          setError("لم يتم إنشاء جلسة تسجيل الدخول. أعد المحاولة من صفحة تسجيل الدخول.");
        }
      }, 1500);
    };

    finish();

    return () => {
      active = false;
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
