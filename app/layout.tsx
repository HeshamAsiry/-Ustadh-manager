import "./globals.css";
import "./mobile-responsive.css";
import "./calendar/calendar-overrides.css";
import "./teacher-core-upgrades.css";
import "./students/students-visual.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "رِواق | إدارة التدريس والطلاب",
  description: "إدارة التدريس والطلاب والقرآن والوقت",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/app-icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.png",
    apple: "/app-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/app-icon.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
