import type { Metadata } from "next";
import "./globals.css";
import "./reference-theme.css";
import "./reference-layout.css";
import "./reference-fidelity.css";
import "./riwaq-typography.css";
import "./riwaq-modal-forms.css";
import "./students/students-reference-overrides.css";
import AppShell from "../components/app-shell";
import StudentFormEnhancer from "../components/student-form-enhancer";

export const metadata: Metadata = {
  title: "رواق | إدارة التعليم",
  description: "منصة رواق لإدارة دروس القرآن واللغة العربية",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body><StudentFormEnhancer/><AppShell>{children}</AppShell></body>
    </html>
  );
}
