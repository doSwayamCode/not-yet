import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider, UserButton } from '@/lib/auth-wrapper';
import Link from 'next/link';
import { Analytics } from '@vercel/analytics/react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'notYET — The Global Archive of Human Persistence',
  description: 'Everyone celebrates Chapter 20. We collect Chapters 1–19. The world\'s archive of rejection stories, failed attempts, lessons, pivots, and comebacks.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://not-yet-nu.vercel.app'),
  openGraph: {
    title: 'notYET — The Archive of Rejection and Comebacks',
    description: 'Everyone celebrates Chapter 20. We collect Chapters 1–19.',
    url: 'https://not-yet-nu.vercel.app',
    siteName: 'notYET',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'notYET — Chapters 1 through 19 complete. Everyone celebrates Chapter 20. We collect Chapters 1–19.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'notYET — Rejections & Persistence',
    description: 'Everyone celebrates Chapter 20. We collect Chapters 1–19.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#050505] text-white selection:bg-amber-500/30 selection:text-white">
        <AuthProvider>
          {/* Header Navigation */}
          <header className="sticky top-0 z-40 w-full border-b border-neutral-900 bg-[#050505]/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
              {/* Logo */}
              <div className="flex items-center gap-6">
                <Link href="/" className="flex items-center gap-2 group">
                  <span className="text-xl font-black tracking-widest text-white transition group-hover:text-amber-400">
                    not<span className="text-amber-500 font-medium">YET</span>
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 group-hover:animate-ping"></div>
                </Link>
                <nav className="hidden md:flex items-center gap-6 text-sm">
                  <Link
                    href="/explore"
                    className="text-neutral-400 hover:text-white transition-colors"
                  >
                    Explore Archive
                  </Link>
                  <Link
                    href="/share"
                    className="text-neutral-400 hover:text-white transition-colors"
                  >
                    Share Your Journey
                  </Link>
                  <Link
                    href="/behind-the-win"
                    className="text-neutral-400 hover:text-white transition-colors"
                  >
                    Behind the Win
                  </Link>
                </nav>
              </div>

              {/* Action Buttons & Auth */}
              <div className="flex items-center gap-4">
                <Link
                  href="/share"
                  className="hidden sm:inline-flex items-center justify-center rounded-md bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-amber-400 transition"
                >
                  Share Story
                </Link>
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
          </header>

          {/* Main Area */}
          <main className="flex-1 flex flex-col">{children}</main>

          {/* Footer */}
          <footer className="border-t border-neutral-900 bg-[#050505] py-8 mt-auto">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-600">
              <div>
                © {new Date().getFullYear()} notYET. Built for persistence.
              </div>
              <div className="flex gap-6">
                <Link href="/explore" className="hover:text-neutral-400 transition">Archive</Link>
                <Link href="/share" className="hover:text-neutral-400 transition">Share</Link>
                <Link href="/behind-the-win" className="hover:text-neutral-400 transition">Behind The Win</Link>
                <a href="#" className="hover:text-neutral-400 transition">Terms & Privacy</a>
              </div>
            </div>
          </footer>
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
