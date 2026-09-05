"use client";

import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, FileText, LayoutDashboard, LogOut, Settings, Users, BookOpenCheck } from "lucide-react";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import "../app/dashboard/dashboard.css";

export default function AppNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  // Dashboard already owns its sidebar. Auth screens should stay clean.
  if (pathname === "/dashboard" || pathname === "/login" || pathname?.startsWith("/auth/")) return null;

  const signOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <aside className="sidebar app-sidebar">
      <div className="sidebar-brand">
        <div className="brand-symbol">ر</div>
        <div><strong>رواق</strong><span>إدارة التعليم</span></div>
      </div>
      <nav className="main-nav" aria-label="الأقسام الرئيسية">
        <a className="nav-item" href="/dashboard"><LayoutDashboard size={18} /><span>لوحة التحكم</span></a>
        <a className="nav-item" href="/students"><Users size={18} /><span>الطلاب</span><b>7</b></a>
        <a className={`nav-item ${pathname === "/calendar" ? "active" : ""}`} href="/calendar"><CalendarDays size={18} /><span>التقويم</span></a>
        <a className={`nav-item ${pathname === "/lessons" ? "active" : ""}`} href="/lessons"><BookOpenCheck size={18} /><span>الحصص</span></a>
        <a className={`nav-item ${pathname === "/reports" ? "active" : ""}`} href="/reports"><FileText size={18} /><span>التقارير</span></a>
      </nav>
      <div className="sidebar-bottom">
        <a className={`nav-item ${pathname === "/settings" ? "active" : ""}`} href="/settings"><Settings size={18} /><span>الإعدادات</span></a>
        <button className="nav-item logout" onClick={signOut} disabled={signingOut}><LogOut size={18} /><span>{signingOut ? "جارٍ الخروج..." : "تسجيل الخروج"}</span></button>
      </div>
    </aside>
  );
}
