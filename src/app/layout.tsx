// Packages
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

// Styles
import "./globals.css";

// Custom
import Providers from "@/components/Providers";
import BackgroundAccents from "@/components/global/BackgroundAccents";
import Navbar from "@/components/global/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nox Chess",
  description: "Nox Chess Official Website",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}>
        <Providers>
          <BackgroundAccents />
          <Navbar />

          {children}
        </Providers>
      </body>
    </html>
  );
}
