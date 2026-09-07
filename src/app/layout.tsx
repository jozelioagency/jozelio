import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono, Cairo } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-arabic",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: "Jozelio — Universal Restaurant & Business Platform",
  description: "Power your restaurant, café or retail business with Jozelio: instant QR digital menus, subdomain storefronts, bilingual support, and a universal management dashboard.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read the language cookie server-side to prevent client-side layout shift
  const cookieStore = await cookies();
  const savedLang = cookieStore.get("jozelio_language")?.value || "English";
  const isRtl = savedLang === "Arabic";

  return (
    <html
      lang={isRtl ? "ar" : "en"}
      dir={isRtl ? "rtl" : "ltr"}
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${cairo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
