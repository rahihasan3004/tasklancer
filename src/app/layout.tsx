import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tasklancer",
  description: "Earn points by completing tasks and watching ads.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://sad.adsgram.ai/js/sad.min.js"
          strategy="afterInteractive"
        />
        <div className="app-frame relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col border-x border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#09090B] text-slate-900 dark:text-zinc-100">
          {children}
        </div>
      </body>
    </html>
  );
}