import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "WordStreak — Daily Vocabulary Challenge",
    template: "%s | WordStreak",
  },
  description:
    "WordStreak is a private vocabulary-learning platform for Vinuu & Bhuu. Build your vocabulary together, one word at a time.",
  keywords: ["vocabulary", "learning", "streak", "English", "education"],
  openGraph: {
    title: "WordStreak",
    description: "Daily vocabulary challenge for Vinuu & Bhuu",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="bg-gray-950 text-gray-100 antialiased min-h-screen font-inter">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
