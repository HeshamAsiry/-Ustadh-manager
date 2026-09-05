"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const completeSignIn = async () => {
      if (!supabase) {
        setError("لم يتم إعداد الاتصال بالخادم بعد.");
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setError(error.message);
          return;
        }
      }

      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        setError("تعذر إكمال تسجيل الدخول. حاول مرة أخرى.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    };

    completeSignIn();
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
