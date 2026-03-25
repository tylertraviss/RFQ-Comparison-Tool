'use client'

import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="w-full border-b" style={{ background: '#ffffff', borderColor: '#e2e8f0' }}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L4 7v10l8 5 8-5V7L12 2z" fill="#0f172a" />
          </svg>
          <span className="font-bold text-lg tracking-tight" style={{ color: '#0f172a' }}>
            QuoteCompare
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <span className="text-sm" style={{ color: '#64748b' }}>
            Defense Procurement Intelligence
          </span>
          <Link
            href="/rfq/new"
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: '#0f172a', color: '#ffffff' }}
          >
            + New RFQ
          </Link>
        </div>
      </div>
    </nav>
  )
}
