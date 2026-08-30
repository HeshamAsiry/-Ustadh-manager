import "./globals.css";
import "./mobile-responsive.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ustadh Manager", description: "إدارة التدريس والطلاب والقرآن والوقت" };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ar" dir="rtl"><body>{children}</body></html>}