'use client'

import Link from 'next/link'
import { useTheme } from '@/lib/theme'

export default function Navbar() {
  const { theme, toggle } = useTheme()

  return (
    <nav className="w-full border-b" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--text)' }}>
            SalesPatriot
          </span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--highlight-blue)', color: 'var(--highlight-blue-text)' }}
          >
            YC25
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-sm hidden md:block" style={{ color: 'var(--text-muted)' }}>
            Defense Procurement Intelligence
          </span>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="w-9 h-9 rounded-lg border flex items-center justify-center transition-colors"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              // Moon icon
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              // Sun icon
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>

          <Link
            href="/rfq/new"
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
          >
            + New RFQ
          </Link>
        </div>
      </div>
    </nav>
  )
}
