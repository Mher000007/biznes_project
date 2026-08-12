import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Montserrat, JetBrains_Mono } from "next/font/google";
import "../styles/leaflet.css";
import "./globals.scss";

import StoreProvider from "@/store/provider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ChatWidget from "@/components/chat/ChatWidget";
import { I18nProvider } from "@/i18n";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { AlertProvider } from "@/context/AlertContext";
import { ThemeProvider } from "@/context/ThemeContext";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://findy.am"),
  title: {
    template: "%s | Findy",
    default: "Findy — Armenia's Business Directory",
  },
  description: "Discover, connect, and grow with Armenian entrepreneurs. Find B2B partners and services across every industry in Armenia.",
  keywords: ["Armenia", "business directory", "Armenian businesses", "B2B", "Yerevan", "Findy"],
  authors: [{ name: "Findy Team" }],
  robots: "index, follow",
  openGraph: {
    type: "website",
    siteName: "Findy",
    title: "Findy — Armenia's Business Directory",
    description: "Discover, connect, and grow with Armenian entrepreneurs. Find B2B partners and services across every industry in Armenia.",
    images: ["/og-default.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Findy — Armenia's Business Directory",
    description: "Discover, connect, and grow with Armenian entrepreneurs. Find B2B partners and services across every industry in Armenia.",
    images: ["/og-default.jpg"],
  },
  manifest: "/site.webmanifest",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "en";

  return (
    <html lang={locale} className={`${montserrat.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('findy_theme') || 'system';
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else {
                    var hour = new Date().getHours();
                    if (hour >= 17 || hour < 8) {
                      document.documentElement.classList.add('dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col font-[family-name:var(--font-montserrat)] antialiased">
        <StoreProvider>
          <ThemeProvider>
            <AuthProvider>
              <I18nProvider>
                <ToastProvider>
                  <AlertProvider>
                    <Navbar />
                    <main className="flex-1">{children}</main>
                    <Footer />
                    <ChatWidget />
                  </AlertProvider>
                </ToastProvider>
              </I18nProvider>
            </AuthProvider>
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
