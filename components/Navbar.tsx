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

        <div className="flex items-center gap-1">
          <Link
            href="/dashboard?tab=analytics"
            className="px-3 py-2 rounded-lg text-sm font-semibold no-underline transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
          >
            Analytics
          </Link>
          <Link
            href="/dashboard?tab=agent"
            className="px-3 py-2 rounded-lg text-sm font-semibold no-underline transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
          >
            Agent
          </Link>
          <Link
            href="/dashboard?tab=pipeline"
            className="px-3 py-2 rounded-lg text-sm font-semibold no-underline transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
          >
            Pipeline
          </Link>
          <Link
            href="/dashboard"
            className="px-3 py-2 rounded-lg text-sm font-semibold no-underline transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
          >
            Dashboard
          </Link>
          <Link
            href="/quotes"
            className="ml-2 px-4 py-2 rounded-lg text-sm font-semibold no-underline transition-opacity hover:opacity-70"
            style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
          >
            RFQs
          </Link>
        </div>
      </div>
    </nav>
  )
}
