import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import InAppBrowserEscape from "@/components/InAppBrowserEscape";
import VisualViewportProvider from "@/components/VisualViewportProvider";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "답쳌 (Dapchek) - 모의고사 자동 채점",
  description: "OMR 자동 채점 및 N회차 오답 노트 앱",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <VisualViewportProvider>
            <InAppBrowserEscape />
            <Header />
            <main className="flex-1 flex flex-col w-full h-full overflow-y-auto">
              {children}
            </main>
          </VisualViewportProvider>
        </Providers>
      </body>
    </html>
  );
}
