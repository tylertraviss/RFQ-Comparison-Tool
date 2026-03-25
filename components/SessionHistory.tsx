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
        style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
      >
        <p className="text-sm" style={{ color: '#94a3b8' }}>
          No sessions yet.{' '}
          <Link href="/rfq/new" style={{ color: '#0f172a', fontWeight: 600 }} className="hover:underline">
            Start your first RFQ →
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
      {sessions.map((session, i) => (
        <Link
          key={session.id}
          href={`/rfq/${session.id}`}
          className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors no-underline"
          style={{
            background: '#ffffff',
            borderTop: i > 0 ? '1px solid #e2e8f0' : undefined,
          }}
        >
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-sm" style={{ color: '#0f172a' }}>
              {session.name}
            </span>
            <span className="text-xs" style={{ color: '#94a3b8' }}>
              {session.quotes.length} supplier{session.quotes.length !== 1 ? 's' : ''} ·{' '}
              {new Date(session.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <span style={{ color: '#94a3b8' }}>→</span>
        </Link>
      ))}
    </div>
  )
}
