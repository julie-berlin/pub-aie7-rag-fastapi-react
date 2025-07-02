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
  title: "The Information",
  description: "AI-powered knowledge base chat application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <header className="bg-gray-900 text-white p-4">
          <h1 className="text-2xl font-bold">The Information</h1>
        </header>
        <main className="flex-1">
          {children}
        </main>
        <footer className="bg-gray-100 text-gray-600 p-4 text-center border-t">
          <p className="text-sm">Note: This is a proof of concept. LLMs can make mistakes.</p>
        </footer>
      </body>
    </html>
  );
}
