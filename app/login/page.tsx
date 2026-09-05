"use client";

import { FormEvent, useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import "../auth.css";

export default function LoginPage(){
  const router=useRouter();
  const [mode,setMode]=useState<"login"|"signup">("login");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [name,setName]=useState("");
  const [show,setShow]=useState(false);
  const [busy,setBusy]=useState(false);
  const [googleBusy,setGoogleBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");

  const submit=async(e:FormEvent)=>{
    e.preventDefault(); setError(""); setMessage("");
    if(!supabase){setError("لم يتم إعداد الاتصال بالخادم بعد.");return}
    setBusy(true);
    try{
      if(mode==="login"){
        const {error}=await supabase.auth.signInWithPassword({email,password});
        if(error) throw error;
        router.push("/dashboard"); router.refresh();
      }else{
        const {data,error}=await supabase.auth.signUp({email,password,options:{data:{full_name:name}}});
        if(error) throw error;
        if(data.session){router.push("/dashboard");router.refresh();}
        else setMessage("تم إنشاء الحساب. تحقق من بريدك الإلكتروني لتأكيد الحساب.");
      }
    }catch(err){setError(err instanceof Error?err.message:"حدث خطأ، حاول مرة أخرى.");}
    finally{setBusy(false)}
  };

  const signInWithGoogle=async()=>{
    setError(""); setMessage("");
    if(!supabase){setError("لم يتم إعداد الاتصال بالخادم بعد.");return}
    setGoogleBusy(true);
    const {error}=await supabase.auth.signInWithOAuth({
      provider:"google",
      options:{redirectTo:`${window.location.origin}/dashboard`},
    });
    if(error){setError(error.message);setGoogleBusy(false)}
  };

  const reset=async()=>{
    setError("");setMessage("");
    if(!supabase){setError("لم يتم إعداد الاتصال بالخادم بعد.");return}
    if(!email){setError("اكتب بريدك الإلكتروني أولًا.");return}
    const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/reset-password`});
    if(error)setError(error.message);else setMessage("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.");
  };

  return <main className="auth-page"><section className="auth-card">
    <div className="brand"><div className="brand-mark">ر</div><h1>رواق</h1><p>إدارة دروس القرآن واللغة العربية</p></div>
    <div className="tabs"><button type="button" className={`tab ${mode==="login"?"active":""}`} onClick={()=>{setMode("login");setError("");setMessage("")}}>تسجيل الدخول</button><button type="button" className={`tab ${mode==="signup"?"active":""}`} onClick={()=>{setMode("signup");setError("");setMessage("")}}>إنشاء حساب</button></div>

    <button type="button" className="google-button" onClick={signInWithGoogle} disabled={googleBusy||busy}>
      <span className="google-logo" aria-hidden="true">G</span>
      <span>{googleBusy?"جارٍ المتابعة مع Google...":"المتابعة باستخدام Google"}</span>
    </button>

    <div className="divider"><span>أو</span></div>

    <form className="form" onSubmit={submit}>
      {mode==="signup"&&<div className="field"><label>الاسم</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="اكتب اسمك" required /></div>}
      <div className="field"><label>البريد الإلكتروني</label><div className="input-icon"><Mail size={17}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com" dir="ltr" required /></div></div>
      <div className="field"><label>كلمة المرور</label><div className="password-row input-icon"><LockKeyhole size={17}/><input type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" dir="ltr" minLength={6} required /><button type="button" className="password-toggle" onClick={()=>setShow(!show)} aria-label="إظهار كلمة المرور">{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></div>
      {mode==="login"&&<button type="button" className="forgot" onClick={reset}>نسيت كلمة المرور؟</button>}
      {error&&<div className="message error">{error}</div>}{message&&<div className="message">{message}</div>}
      <button className="submit" disabled={busy||googleBusy}>{busy?(mode==="login"?"جارٍ تسجيل الدخول...":"جارٍ إنشاء الحساب..."):(mode==="login"?"تسجيل الدخول":"إنشاء الحساب")}</button>
      {mode==="signup"&&<p className="terms">بإنشاء الحساب، أنت توافق على شروط استخدام رواق.</p>}
    </form><div className="footer">رواق · منصة إدارة التعليم</div>
  </section></main>
}