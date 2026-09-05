import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "رواق | إدارة التعليم",
  description: "منصة رواق لإدارة دروس القرآن واللغة العربية",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}