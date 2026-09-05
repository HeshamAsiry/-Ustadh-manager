"use client";

import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import "../auth.css";

const logoUrl = "https://raw.githubusercontent.com/HeshamAsiry/-Ustadh-manager/main/icons/login%20logo.png";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) {
      setError("لم يتم إعداد الاتصال بالخادم بعد.");
      return;
    }

    const client = supabase;
    let mounted = true;

    const checkSession = async () => {
      const { data, error } = await client.auth.getSession();
      if (!mounted) return;
      if (error || !data.session) {
        setError("رابط إعادة تعيين كلمة المرور غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا من صفحة تسجيل الدخول.");
      } else {
        setReady(true);
      }
    };

    checkSession();

    const { data: authListener } = client.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) {
        setError("");
        setReady(true);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const client = supabase;
    if (!client || !ready) return;
    if (password.length < 6) {
      setError("كلمة المرور يجب أن تتكون من 6 أحرف على الأقل.");
      return;
    }
    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }

    setBusy(true);
    const { error } = await client.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setMessage("تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => router.push("/login"), 1400);
    }
    setBusy(false);
  };

  return (
    <main className="auth-page" dir="rtl">
      <section className="auth-card" aria-label="إعادة تعيين كلمة المرور">
        <div className="brand">
          <div className="brand-logo">
            <img src={logoUrl} alt="رواق" width={240} height={96} />
          </div>
          <p>إعادة تعيين كلمة المرور</p>
        </div>

        <form className="form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="new-password">كلمة المرور الجديدة</label>
            <div className="password-row input-icon">
              <LockKeyhole size={17} aria-hidden="true" />
              <input id="new-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" dir="ltr" autoComplete="new-password" minLength={6} required disabled={!ready || busy} />
              <button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <div className="field">
            <label htmlFor="confirm-password">تأكيد كلمة المرور</label>
            <div className="password-row input-icon">
              <LockKeyhole size={17} aria-hidden="true" />
              <input id="confirm-password" type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" dir="ltr" autoComplete="new-password" minLength={6} required disabled={!ready || busy} />
              <button type="button" className="password-toggle" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>
                {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {error && <div className="message error" role="alert">{error}</div>}
          {message && <div className="message" role="status">{message}</div>}

          <button className="submit" disabled={!ready || busy}>
            {busy ? "جارٍ حفظ كلمة المرور..." : "حفظ كلمة المرور"}
          </button>

          <button type="button" className="forgot reset-back" onClick={() => router.push("/login")}>
            العودة إلى تسجيل الدخول
          </button>
        </form>

        <div className="footer">رواق · منصة إدارة التعليم</div>
      </section>
    </main>
  );
}
