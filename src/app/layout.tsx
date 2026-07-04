import type { Metadata } from "next";
import { Montserrat, JetBrains_Mono } from "next/font/google";
import "../styles/leaflet.css";
import "./globals.scss";

import StoreProvider from "@/store/provider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ChatWidget from "@/components/chat/ChatWidget";
import { I18nProvider } from "@/i18n";
import { AuthProvider } from "@/context/AuthContext";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ArmBiz — Armenia's Business Directory",
  description: "Discover, connect, and grow with Armenian entrepreneurs. Find B2B partners and services across every industry in Armenia.",
  keywords: ["Armenia", "business directory", "Armenian businesses", "B2B", "Yerevan"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col font-[family-name:var(--font-montserrat)] antialiased">
        <StoreProvider>
          <AuthProvider>
            <I18nProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
              <ChatWidget />
            </I18nProvider>
          </AuthProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
