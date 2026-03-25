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
      <div className="text-center py-12" style={{ color: '#64748b' }}>
        No sessions yet.{' '}
        <Link href="/rfq/new" style={{ color: '#2563eb' }} className="hover:underline">
          Start your first RFQ →
        </Link>
      </div>
    )
  }

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: '#1e293b' }}
    >
      {sessions.map((session, i) => (
        <Link
          key={session.id}
          href={`/rfq/${session.id}`}
          className="flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors no-underline"
          style={{
            background: '#111827',
            borderTop: i > 0 ? '1px solid #1e293b' : undefined,
          }}
        >
          <div className="flex flex-col gap-1">
            <span className="font-semibold" style={{ color: '#f1f5f9' }}>
              {session.name}
            </span>
            <span className="text-xs" style={{ color: '#64748b' }}>
              {session.quotes.length} supplier{session.quotes.length !== 1 ? 's' : ''} ·{' '}
              {new Date(session.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <span style={{ color: '#64748b' }}>→</span>
        </Link>
      ))}
    </div>
  )
}
