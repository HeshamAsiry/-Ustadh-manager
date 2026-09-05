"use client";

import { usePathname } from "next/navigation";
import AppNavigation from "./app-navigation";
import "../app/dashboard/dashboard.css";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const standalone = pathname === "/dashboard" || pathname === "/login" || pathname?.startsWith("/auth/");

  if (standalone) return <>{children}</>;

  return (
    <div className="dashboard-shell app-shell">
      <AppNavigation />
      <section className="dashboard-content app-content">{children}</section>
    </div>
  );
}
