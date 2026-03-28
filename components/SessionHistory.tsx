'use client'

import Link from 'next/link'

interface Session {
  id: string
  name: string
  createdAt: string
  quotes: { id: string; supplierName: string }[]
}

interface Props {
  sessions: Session[]
}

export default function SessionHistory({ sessions }: Props) {
  if (sessions.length === 0) {
    return (
      <div
        className="rounded-xl border px-6 py-12 text-center"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
          No sessions yet.{' '}
          <Link href="/quotes/new" style={{ color: 'var(--text)', fontWeight: 600 }} className="hover:underline">
            Start your first RFQ →
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
      {sessions.map((session, i) => (
        <Link
          key={session.id}
          href={`/quotes/${session.id}`}
          className="flex items-center justify-between px-5 py-4 transition-colors no-underline"
          style={{
            background: 'var(--bg)',
            borderTop: i > 0 ? '1px solid var(--border)' : undefined,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg)')}
        >
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
              {session.name}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
              {session.quotes.length} supplier{session.quotes.length !== 1 ? 's' : ''} ·{' '}
              {new Date(session.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </span>
          </div>
          <span style={{ color: 'var(--text-faint)' }}>→</span>
        </Link>
      ))}
    </div>
  )
}
