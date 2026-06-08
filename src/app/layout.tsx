import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/AppProviders";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "Filer",
  authors: [{ name: "Filer" }],
  description:
    "A private Google Drive file manager that stores files in your own Drive.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { type: "image/svg+xml", url: "/icon.svg" },
    ],
    shortcut: "/icon.svg",
  },
  keywords: ["Google Drive", "file manager", "cloud storage", "Filer"],
  metadataBase: new URL(
    process.env.AUTH_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000"),
  ),
  openGraph: {
    description:
      "Sign in with Google and manage files directly inside your own Drive.",
    images: [{ height: 64, url: "/filer-icon.svg", width: 64 }],
    siteName: "Filer",
    title: "Filer",
    type: "website",
  },
  title: {
    default: "Filer",
    template: "%s | Filer",
  },
  twitter: {
    card: "summary",
    description:
      "Sign in with Google and manage files directly inside your own Drive.",
    images: ["/filer-icon.svg"],
    title: "Filer",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
