"use client";
import { FormEvent, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage(){
 const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [loading,setLoading]=useState(false); const [error,setError]=useState("");
 async function submit(e:FormEvent){e.preventDefault(); setLoading(true); setError("");
  if(!supabase){setError("Supabase is not configured");setLoading(false);return;}
  const {error}=await supabase.auth.signInWithPassword({email,password});
  if(error){setError(error.message);setLoading(false);return;}
  window.location.href="/";
 }
 return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24}}><form onSubmit={submit} style={{width:"100%",maxWidth:420,display:"grid",gap:16}}>
  <div><h1>Ustadh Manager</h1><p>تسجيل الدخول إلى حسابك</p></div>
  <input required type="email" placeholder="البريد الإلكتروني" value={email} onChange={e=>setEmail(e.target.value)} />
  <input required type="password" placeholder="كلمة المرور" value={password} onChange={e=>setPassword(e.target.value)} />
  {error&&<p role="alert">{error}</p>}
  <button disabled={loading} type="submit">{loading?"جارٍ الدخول…":"تسجيل الدخول"}</button>
 </form></main>
}
