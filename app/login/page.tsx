"use client";
import { FormEvent, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name, locale: "ar", timezone: "Africa/Cairo" } },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      if (data.session) {
        await supabase.from("profiles").upsert({ id: data.user.id, full_name: name || email.split("@")[0], locale: "ar", timezone: "Africa/Cairo" });
        window.location.href = "/";
      } else {
        setMessage("تم إنشاء الحساب. إذا كان تأكيد البريد مفعّلًا، افتح رسالة التأكيد ثم سجّل الدخول.");
        setMode("login");
        setLoading(false);
      }
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from("profiles").upsert({ id: data.user.id, full_name: name || email.split("@")[0], locale: "ar", timezone: "Africa/Cairo" });
    }
    window.location.href = "/";
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f6f5f1" }} dir="rtl">
      <form onSubmit={submit} style={{ width: "100%", maxWidth: 430, display: "grid", gap: 16, background: "white", padding: 32, borderRadius: 24, boxShadow: "0 12px 40px rgba(0,0,0,.08)" }}>
        <div>
          <h1 style={{ margin: 0 }}>Ustadh Manager</h1>
          <p style={{ marginBottom: 0, color: "#6b7280" }}>{mode === "login" ? "تسجيل الدخول إلى حسابك" : "إنشاء حساب الأستاذ"}</p>
        </div>

        {mode === "signup" && <input required placeholder="اسم الأستاذ" value={name} onChange={e => setName(e.target.value)} />}
        <input required type="email" placeholder="البريد الإلكتروني" value={email} onChange={e => setEmail(e.target.value)} />
        <input required minLength={6} type="password" placeholder="كلمة المرور (6 أحرف على الأقل)" value={password} onChange={e => setPassword(e.target.value)} />

        {error && <p role="alert" style={{ color: "#b42318", margin: 0 }}>{error}</p>}
        {message && <p role="status" style={{ color: "#027a48", margin: 0 }}>{message}</p>}

        <button disabled={loading} type="submit" style={{ padding: "12px 16px", border: 0, borderRadius: 12, background: "#1f2937", color: "white", cursor: loading ? "wait" : "pointer" }}>
          {loading ? "جارٍ التنفيذ…" : mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب"}
        </button>

        <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setMessage(""); }} style={{ padding: 10, border: 0, background: "transparent", color: "#475467", cursor: "pointer" }}>
          {mode === "login" ? "ليس لديك حساب؟ إنشاء حساب جديد" : "لديك حساب بالفعل؟ تسجيل الدخول"}
        </button>
      </form>
    </main>
  );
}
