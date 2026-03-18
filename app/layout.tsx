import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

import { SiteHeader } from "@/components/layout/site-header";
import { getViewer } from "@/lib/auth";
import { getRuntimeFlags } from "@/lib/env";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "DermaLens",
    template: "%s | DermaLens",
  },
  description:
    "Simple skin progress tracking with photo analysis, concise care suggestions, and weekly follow-ups.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const viewer = await getViewer();
  const flags = getRuntimeFlags();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background font-sans text-foreground antialiased`}
      >
        <div className="min-h-screen">
          <SiteHeader user={viewer.user} flags={flags} />
          <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
            {children}
          </main>
          <footer className="border-t border-slate-200/80 bg-white/80">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
              <p>DermaLens helps track visible skin progress with simple weekly check-ins.</p>
              <p>Weekly reminders and follow-up uploads stay attached to each case.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
