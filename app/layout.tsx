import "./globals.css";
import "./mobile-responsive.css";
import type { Metadata } from "next";

const assetBase = "https://media.githubusercontent.com/media/HeshamAsiry/-Ustadh-manager/main";

export const metadata: Metadata = {
  title: "رِواق",
  description: "إدارة التدريس والطلاب والقرآن والوقت",
  icons: {
    icon: `${assetBase}/favicon.png`,
    apple: `${assetBase}/app%20icon.png`,
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}