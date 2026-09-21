"use client";

import { usePathname } from "next/navigation";
import { FileDown } from "lucide-react";
import AppNavigation from "./app-navigation";
import "../app/dashboard/dashboard.css";
import "../app/reference-theme.css";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const standalone = pathname === "/login" || pathname?.startsWith("/auth/");

  if (standalone) return <>{children}</>;

  return (
    <div className="dashboard-shell app-shell">
      <AppNavigation />
      <button className="global-pdf-button no-print" type="button" onClick={() => { document.title = document.querySelector("h1")?.textContent?.trim() || "رواق"; window.print(); }} aria-label="تصدير الصفحة بصيغة PDF"><FileDown size={16}/><span>تصدير PDF</span></button>
      <section className="dashboard-content app-content">{children}</section>
    </div>
  );
}
