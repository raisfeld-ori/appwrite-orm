import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Appwrite ORM - Type-Safe TypeScript ORM for Appwrite",
  description: "A powerful, type-safe TypeScript ORM for Appwrite with automatic migrations, schema validation, indexes, and join support. Works seamlessly in both server-side and client-side environments.",
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/logo-icon.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Appwrite ORM',
    description: 'Type-Safe TypeScript ORM for Appwrite',
    images: ['/logo.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Appwrite ORM',
    description: 'Type-Safe TypeScript ORM for Appwrite',
    images: ['/logo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
