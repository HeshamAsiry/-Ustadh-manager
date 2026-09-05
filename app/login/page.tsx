"use client";

import { FormEvent, useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import "../auth.css";

const logoUrl = "https://raw.githubusercontent.com/HeshamAsiry/-Ustadh-manager/main/icons/login%20logo.png";
const googleLogoUrl = "https://raw.githubusercontent.com/HeshamAsiry/-Ustadh-manager/main/icons/Google_Favicon_2025.svg.webp";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const clearFeedback = () => { setError(""); setMessage(""); };

  const submit = async (e: FormEvent) => {
    e.preventDefault(); clearFeedback();
    if (!supabase) { setError("لم يتم إعداد الاتصال بالخادم بعد."); return; }
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/dashboard"); router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name.trim() } } });
        if (error) throw error;
        if (data.session) { router.replace("/dashboard"); router.refresh(); }
        else setMessage("تم إنشاء الحساب. تحقق من بريدك الإلكتروني لتأكيد الحساب.");
      }
    } catch (err) { setError(err instanceof Error ? err.message : "حدث خطأ، حاول مرة أخرى."); }
    finally { setBusy(false); }
  };

  const signInWithGoogle = async () => {
    clearFeedback();
    if (!supabase) { setError("لم يتم إعداد الاتصال بالخادم بعد."); return; }
    setGoogleBusy(true);

    // Browser-only implicit OAuth: Google returns the session tokens in the
    // URL fragment and Supabase automatically persists them before /dashboard
    // starts checking the session. This avoids the PKCE callback race that was
    // sending the first login attempt back to /login.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });

    if (error) {
      setError(error.message);
      setGoogleBusy(false);
    }
  };

  const reset = async () => {
    clearFeedback();
    if (!supabase) { setError("لم يتم إعداد الاتصال بالخادم بعد."); return; }
    if (!email.trim()) { setError("اكتب بريدك الإلكتروني أولًا."); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
    if (error) setError(error.message);
    else setMessage("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.");
  };

  return (
    <main className="auth-page" dir="rtl">
      <section className="auth-card" aria-label="تسجيل الدخول إلى رواق">
        <div className="brand"><div className="brand-logo"><img src={logoUrl} alt="رواق" width={240} height={96} /></div><p>إدارة دروس القرآن واللغة العربية</p></div>
        <div className="tabs" role="tablist" aria-label="نوع الحساب">
          <button type="button" role="tab" aria-selected={mode === "login"} className={`tab ${mode === "login" ? "active" : ""}`} onClick={() => { setMode("login"); clearFeedback(); }}>تسجيل الدخول</button>
          <button type="button" role="tab" aria-selected={mode === "signup"} className={`tab ${mode === "signup" ? "active" : ""}`} onClick={() => { setMode("signup"); clearFeedback(); }}>إنشاء حساب</button>
        </div>
        <button type="button" className="google-button" onClick={signInWithGoogle} disabled={googleBusy || busy} aria-busy={googleBusy}>
          <img className="google-logo" src={googleLogoUrl} alt="" width={20} height={20} /><span>{googleBusy ? "جارٍ المتابعة مع Google..." : "المتابعة باستخدام Google"}</span>
        </button>
        <div className="divider" aria-hidden="true"><span>أو</span></div>
        <form className="form" onSubmit={submit} noValidate>
          {mode === "signup" && <div className="field"><label htmlFor="name">الاسم</label><input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="اكتب اسمك" autoComplete="name" required /></div>}
          <div className="field"><label htmlFor="email">البريد الإلكتروني</label><div className="input-icon"><Mail size={17} aria-hidden="true" /><input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" dir="ltr" autoComplete="email" required /></div></div>
          <div className="field"><label htmlFor="password">كلمة المرور</label><div className="password-row input-icon"><LockKeyhole size={17} aria-hidden="true" /><input id="password" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" dir="ltr" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={6} required /><button type="button" className="password-toggle" onClick={() => setShow((value) => !value)} aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>{show ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></div>
          {mode === "login" && <button type="button" className="forgot" onClick={reset} disabled={busy || googleBusy}>نسيت كلمة المرور؟</button>}
          {error && <div className="message error" role="alert">{error}</div>}{message && <div className="message" role="status">{message}</div>}
          <button className="submit" disabled={busy || googleBusy} aria-busy={busy}>{busy ? (mode === "login" ? "جارٍ تسجيل الدخول..." : "جارٍ إنشاء الحساب...") : (mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب")}</button>
          {mode === "signup" && <p className="terms">بإنشاء الحساب، أنت توافق على شروط استخدام رواق.</p>}
        </form>
        <div className="footer">رواق · منصة إدارة التعليم</div>
      </section>
    </main>
  );
}
