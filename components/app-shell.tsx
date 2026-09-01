"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CalendarDays, Clock3, FileBarChart2, FileText, LayoutDashboard, LogOut, Settings, WalletCards, BookOpen, ClipboardCheck, Users, Bell, BookMarked, Menu, X } from "lucide-react";
import { supabase } from "../lib/supabase";

const items = [
  { href: "/dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/calendar", label: "التقويم والمواعيد", icon: CalendarDays },
  { href: "/students", label: "الطلاب", icon: Users },
  { href: "/learning-paths", label: "المسارات التعليمية", icon: BookMarked },
  { href: "/quran", label: "القرآن", icon: BookOpen },
  { href: "/exams", label: "الاختبارات", icon: ClipboardCheck },
  { href: "/schedule", label: "جدولي الشخصي", icon: Clock3 },
  { href: "/hours", label: "الساعات", icon: FileBarChart2 },
  { href: "/payments", label: "المدفوعات", icon: WalletCards },
  { href: "/reports", label: "التقارير", icon: FileText },
  { href: "/notifications", label: "التنبيهات", icon: Bell },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

const DASHBOARD_LOGO = "/dashboard-logo.png";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function logout() {
    await supabase?.auth.signOut();
    window.location.replace("/login");
  }

  const Nav = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className={mobile ? "ustadh-nav ustadh-mobile-nav" : "ustadh-nav"} aria-label="التنقل الرئيسي">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link key={item.href} href={item.href} onClick={() => mobile && setMobileOpen(false)} className={active ? "ustadh-nav-link active" : "ustadh-nav-link"}>
            <Icon size={14} strokeWidth={2} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="app-shell ustadh-shell">
      <header className="ustadh-topbar">
        <div className="ustadh-topbar-inner">
          <Link href="/dashboard" className="ustadh-brand" aria-label="رِواق - الرئيسية">
            <span className="ustadh-brand-mark"><img src={DASHBOARD_LOGO} alt="" /></span>
            <div><b>رِواق</b><span>إدارة التدريس والطلاب</span></div>
          </Link>
          <div className="ustadh-top-actions">
            <Link className="ustadh-quick-btn" href="/students?action=new">+ تسجيل طالب</Link>
            <Link className="ustadh-quick-btn warm" href="/calendar?action=new">+ حجز درس</Link>
          </div>
          <button className="ustadh-mobile-menu" aria-label="فتح القائمة" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
        </div>
        <div className="ustadh-nav-wrap"><Nav /></div>
      </header>
      {mobileOpen && <div className="ustadh-mobile-backdrop" onClick={() => setMobileOpen(false)} />}
      <aside className={mobileOpen ? "ustadh-mobile-drawer open" : "ustadh-mobile-drawer"} aria-hidden={!mobileOpen}>
        <div className="ustadh-mobile-head">
          <Link href="/dashboard" className="ustadh-brand" onClick={() => setMobileOpen(false)}><span className="ustadh-brand-mark"><img src={DASHBOARD_LOGO} alt="" /></span><div><b>رِواق</b><span>إدارة التدريس والطلاب</span></div></Link>
          <button className="icon-btn" onClick={() => setMobileOpen(false)} aria-label="إغلاق"><X size={18} /></button>
        </div>
        <Nav mobile />
        <button className="logout-btn" onClick={logout}><LogOut size={17} /><span>تسجيل الخروج</span></button>
      </aside>
      <main className="main ustadh-main">{children}</main>
      <style jsx global>{`
        .ustadh-shell{min-height:100vh;background:#fdfbf7;color:#2d3436}
        .ustadh-topbar{position:sticky;top:0;z-index:80;background:#4a5d4e;color:#fdfbf7;border-bottom:1px solid #3d4c40;box-shadow:0 2px 8px rgba(25,45,28,.08)}
        .ustadh-topbar-inner{min-height:72px;max-width:1500px;margin:auto;padding:12px 28px;display:flex;align-items:center;justify-content:space-between;gap:20px}
        .ustadh-brand{display:flex;align-items:center;gap:11px;text-decoration:none;color:#fdfbf7;min-width:220px}.ustadh-brand-mark{width:44px;height:44px;border-radius:14px;background:#3d4c40;border:1px solid rgba(255,255,255,.1);display:grid;place-items:center;overflow:hidden}.ustadh-brand-mark img{width:31px;height:31px;object-fit:contain}.ustadh-brand b{display:block;font-size:19px;line-height:1.2}.ustadh-brand span:not(.ustadh-brand-mark){display:block;color:rgba(255,255,255,.76);font-size:10px;margin-top:4px}
        .ustadh-top-actions{display:flex;align-items:center;gap:8px}.ustadh-quick-btn{display:inline-flex;align-items:center;gap:6px;text-decoration:none;background:#3d4c40;border:1px solid rgba(255,255,255,.1);color:#fff;padding:9px 13px;border-radius:11px;font-size:11px;font-weight:700}.ustadh-quick-btn:hover{background:#344136}.ustadh-quick-btn.warm{background:#d4a373;color:#2d3436;border-color:#d4a373}.ustadh-quick-btn.warm:hover{background:#b5824c}
        .ustadh-nav-wrap{background:#f8f5ee;border-bottom:1px solid #e8e1d5}.ustadh-nav{max-width:1500px;margin:auto;padding:8px 28px;display:flex;align-items:center;gap:5px;overflow-x:auto;scrollbar-width:none}.ustadh-nav::-webkit-scrollbar{display:none}.ustadh-nav-link{display:inline-flex;align-items:center;gap:7px;padding:9px 12px;border-radius:11px;color:#5d6567;text-decoration:none;font-size:11px;font-weight:700;white-space:nowrap;transition:all .15s ease}.ustadh-nav-link:hover{color:#2d3436;background:#efe9dd}.ustadh-nav-link.active{background:#4a5d4e;color:#fdfbf7;box-shadow:0 2px 8px rgba(74,93,78,.15)}
        .ustadh-main{margin:0 auto;width:100%;max-width:1500px;padding:25px 32px 50px}.ustadh-mobile-menu{display:none;border:1px solid rgba(255,255,255,.15);background:#3d4c40;color:#fff;width:42px;height:42px;border-radius:11px;place-items:center}.ustadh-mobile-drawer,.ustadh-mobile-backdrop{display:none}
        @media(max-width:800px){.ustadh-topbar-inner{min-height:62px;padding:9px 13px}.ustadh-brand{min-width:0}.ustadh-brand-mark{width:39px;height:39px}.ustadh-brand-mark img{width:28px;height:28px}.ustadh-brand b{font-size:16px}.ustadh-brand span:not(.ustadh-brand-mark){font-size:9px}.ustadh-top-actions,.ustadh-nav-wrap{display:none}.ustadh-mobile-menu{display:grid}.ustadh-main{padding:17px 13px 35px}.ustadh-mobile-backdrop{display:block;position:fixed;inset:0;background:rgba(20,30,23,.38);backdrop-filter:blur(2px);z-index:190}.ustadh-mobile-drawer{display:flex;position:fixed;z-index:200;top:0;right:0;bottom:0;width:min(320px,88vw);background:#fff;border-left:1px solid #e8e1d5;padding:14px;flex-direction:column;transform:translateX(105%);transition:transform .22s ease;box-shadow:-20px 0 50px rgba(25,45,28,.14)}.ustadh-mobile-drawer.open{transform:translateX(0)}.ustadh-mobile-head{display:flex;align-items:center;justify-content:space-between;padding-bottom:13px;margin-bottom:8px;border-bottom:1px solid #e8e1d5}.ustadh-mobile-head .ustadh-brand{color:#2d3436}.ustadh-mobile-head .ustadh-brand span:not(.ustadh-brand-mark){color:#6d776f}.ustadh-mobile-nav{display:flex;flex-direction:column;align-items:stretch;overflow:auto;padding:5px 0}.ustadh-mobile-nav .ustadh-nav-link{padding:12px 13px}.ustadh-mobile-drawer .logout-btn{margin-top:auto}}
      `}</style>
    </div>
  );
}
