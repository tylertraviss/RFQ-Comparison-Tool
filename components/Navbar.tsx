'use client'

import Link from 'next/link'

export default function Navbar() {
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

        <div className="flex items-center gap-2">
          <Link
            href="/contracts"
            className="px-4 py-2 rounded-lg text-sm font-semibold no-underline transition-opacity hover:opacity-70"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            Contracts
          </Link>
          <Link
            href="/rfq/new"
            className="px-4 py-2 rounded-lg text-sm font-semibold no-underline transition-opacity hover:opacity-70"
            style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
          >
            RFQs
          </Link>
        </div>
      </div>
    </nav>
  )
}
