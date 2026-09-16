import type { Metadata } from "next";
import { DM_Sans, Newsreader } from "next/font/google";
import { Header } from "@/components/Header";
import { Providers } from "@/components/Providers";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Resolve",
    template: "%s · Resolve",
  },
  description:
    "Binary YES/NO prediction markets on Stellar. Settlement is on-chain; the indexer is discovery only.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${newsreader.variable} ${dmSans.variable}`}>
      <body>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="mx-auto w-full max-w-content flex-1 px-4 py-10 sm:px-6">
              {children}
            </main>
            <footer className="border-t border-ink-line">
              <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs text-ink-faint sm:px-6">
                <span>Resolve — Stellar prediction markets</span>
                <span>Indexer is never settlement authority</span>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
