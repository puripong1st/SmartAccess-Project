import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai, Inter } from "next/font/google";
import "./globals.css";
import CookieConsent from "./components/CookieConsent";
import { ThemeProvider } from "./components/ThemeProvider";
import ServiceWorkerRegistration from "./components/ServiceWorkerRegistration";
import PushNotificationManager from "./components/PushNotificationManager";
import CacheRecoveryScript from "./components/CacheRecoveryScript";

// Self-hosted via next/font — ตัด render-blocking @import จาก Google Fonts CDN
// และ preload อัตโนมัติ (เร็วกว่า + ลด external request)
const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai"],
  display: "swap",
  variable: "--font-noto-thai",
});
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  themeColor: "#7C3AED",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "SmartAccess Door Access System",
  description: "SmartAccess — ระบบควบคุมการเข้าออกห้องเรียนแบบไร้สาย (Innovative system for managing access rights and controlling classroom access via wireless network) คณะครุศาสตร์อุตสาหกรรม มหาวิทยาลัยเทคโนโลยีราชมงคลพระนคร",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-128x128.png",
    shortcut: "/icons/icon-128x128.png",
    apple: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SmartAccess",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${notoSansThai.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <CacheRecoveryScript />
        {/* PWA — Apple Touch Icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        {/* Speculation Rules API for Instant Prerender on 200ms hover */}
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              prerender: [
                {
                  where: { href_matches: "/*" },
                  eagerness: "moderate",
                },
              ],
            }),
          }}
        />
      </head>
      <body style={{ minHeight: "100vh" }}>
        <ThemeProvider>
          {children}
          <CookieConsent />
          <ServiceWorkerRegistration />
          <PushNotificationManager />
        </ThemeProvider>
      </body>
    </html>
  );
}

