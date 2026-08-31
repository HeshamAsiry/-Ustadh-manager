"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, Lock, Mail, UserRound } from "lucide-react";
import { supabase } from "../../lib/supabase";

const RIWAQ_LOGO =
  "https://raw.githubusercontent.com/HeshamAsiry/-Ustadh-manager/main/public/riwaq-logo-light.png";

const logoStyle = {
  display: "block",
  width: "100%",
  height: "100%",
  objectFit: "contain" as const,
};

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (!supabase) {
      setError("Supabase is not configured");
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            locale: "ar",
            timezone: "Africa/Cairo",
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.user && data.session) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            full_name: name || email.split("@")[0],
            locale: "ar",
            timezone: "Africa/Cairo",
          });

        if (profileError) {
          setError(profileError.message);
          setLoading(false);
          return;
        }

        window.location.replace("/");
      } else {
        setMessage(
          "تم إنشاء الحساب. افتح رسالة تأكيد البريد إن كانت مفعّلة، ثم سجّل الدخول."
        );
        setMode("login");
        setLoading(false);
      }

      return;
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("تعذر إنشاء جلسة تسجيل الدخول");
      setLoading(false);
      return;
    }

    window.location.replace("/");
  }

  return (
    <main className="login-page" dir="rtl">
      <div className="login-shell">
        <section className="login-visual">
          <div className="login-logo">
            <img src={RIWAQ_LOGO} alt="رِواق" style={logoStyle} />
          </div>

          <div className="login-brand-subtitle">إدارة التدريس والطلاب بذكاء وبساطة</div>

          <div className="login-quote">
            كل ما تحتاجه لإدارة طلابك، دروسك، وتقاريرك في مكان واحد.
          </div>

          <div className="login-features">
            <span>إدارة الطلاب والحصص</span>
            <span>تنظيم المواعيد والتقويم</span>
            <span>متابعة تقدم الطلاب</span>
          </div>
        </section>

        <section className="login-card">
          <div className="login-card-head">
            <div className="mobile-login-logo">
              <img src={RIWAQ_LOGO} alt="رِواق" style={logoStyle} />
            </div>

            <div>
              <h1>
                {mode === "login" ? "مرحبًا بعودتك" : "إنشاء حساب الأستاذ"}
              </h1>
              <p>
                {mode === "login"
                  ? "سجّل الدخول للمتابعة إلى لوحة التحكم."
                  : "أنشئ حسابك وابدأ بإدارة دروسك."}
              </p>
            </div>
          </div>

          <form onSubmit={submit} className="login-form">
            {mode === "signup" && (
              <label className="login-field">
                <UserRound size={17} />
                <input
                  required
                  placeholder="اسم الأستاذ"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
            )}

            <label className="login-field">
              <Mail size={17} />
              <input
                required
                type="email"
                placeholder="البريد الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="login-field">
              <Lock size={17} />
              <input
                required
                minLength={6}
                type="password"
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {error && <div className="login-error">{error}</div>}
            {message && <div className="login-success">{message}</div>}

            <button disabled={loading} className="login-submit" type="submit">
              {loading
                ? "جارٍ الدخول…"
                : mode === "login"
                  ? "تسجيل الدخول"
                  : "إنشاء الحساب"}
              <ArrowLeft size={17} />
            </button>
          </form>

          <button
            type="button"
            className="login-switch"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
              setMessage("");
            }}
          >
            {mode === "login"
              ? "ليس لديك حساب؟ إنشاء حساب جديد"
              : "لديك حساب بالفعل؟ تسجيل الدخول"}
          </button>
        </section>
      </div>
    </main>
  );
}
