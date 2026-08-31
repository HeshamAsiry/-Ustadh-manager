import "./globals.css";
import "./mobile-responsive.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "رِواق",
  description: "إدارة التدريس والطلاب والقرآن والوقت",
  icons: {
    icon: "/favicon.png",
    apple: "/app-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}