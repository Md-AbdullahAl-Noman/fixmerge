import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeSentry",
  description: "Lightweight PR quality gate — catches bugs on merge",
};

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="8" fill="url(#logo-grad)" />
      <path
        d="M8 14l4-4 4 4-4 4-4-4z"
        fill="white"
        fillOpacity="0.9"
      />
      <path
        d="M14 10l4-2v8l-4 2V10z"
        fill="white"
        fillOpacity="0.5"
      />
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="28" y2="28">
          <stop stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen">
        <div className="mesh-bg" />
        <div className="noise-overlay" />

        {/* Top nav */}
        <header className="sticky top-0 z-50 glass border-b border-[var(--border-default)]">
          <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <Logo />
              <span className="text-[15px] font-bold tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent-light)] transition-colors">
                CodeSentry
              </span>
            </Link>
            <nav className="flex items-center gap-1">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.04] transition-all"
              >
                Dashboard
              </Link>
              <a
                href="/api/analyses"
                target="_blank"
                className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.04] transition-all"
              >
                API
              </a>
              <div className="w-px h-4 bg-[var(--border-default)] mx-1" />
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[var(--accent-glow)] text-[var(--accent-light)] border border-[var(--accent)]/20">
                v1.0
              </span>
            </nav>
          </div>
        </header>

        <main className="max-w-[1400px] mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
