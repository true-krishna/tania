import type { Metadata } from "next";
import { Geist, Geist_Mono, Nunito_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { ApolloProvider } from "@/lib/apollo";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Product typeface (constitution v4.0.0, Principle III — binary weights).
// The shipped --tp-font-* tokens consume the variable via globals.css.
const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Tania — Talent Profiles",
  description:
    "Complete talent profiles: identity, role, grade, squad, location, status, and manager — auto-generated when a user is created.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${nunitoSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ApolloProvider>
          <ToastProvider>{children}</ToastProvider>
        </ApolloProvider>
      </body>
    </html>
  );
}