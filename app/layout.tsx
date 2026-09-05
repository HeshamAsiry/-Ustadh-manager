import type { Metadata } from "next";
import "./globals.css";
import AppShell from "../components/app-shell";

export const metadata: Metadata = {
  title: "رواق | إدارة التعليم",
  description: "منصة رواق لإدارة دروس القرآن واللغة العربية",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body><AppShell>{children}</AppShell></body>
    </html>
  );
}
