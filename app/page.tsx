import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import SessionHistory from '@/components/SessionHistory'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  let sessions: Awaited<ReturnType<typeof prisma.rFQSession.findMany>> = []

  try {
    sessions = await prisma.rFQSession.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        quotes: { select: { id: true, supplierName: true } },
      },
    })
  } catch {
    // DB not connected yet — show empty state
  }

  const hasSessions = sessions.length > 0

  return (
    <div className="flex flex-col gap-12">
      {/* Hero — centered */}
      <div className="flex flex-col items-center justify-center text-center" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <div className="flex flex-col items-center gap-6 max-w-2xl">
          <h1 className="text-5xl font-bold leading-tight" style={{ color: 'var(--text)' }}>
            Source Smarter.<br />Bid Faster. Win More.
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-muted)' }}>
            Built for defense distributors. Paste quotes from your suppliers, compare pricing and lead times instantly, then calculate your DLA bid with the right markup — all in one place.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/quotes/new"
              className="px-6 py-3 rounded-lg font-semibold text-sm transition-colors no-underline"
              style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
            >
              Analyze Your First Quote →
            </Link>
            {hasSessions && (
              <span className="text-sm" style={{ color: 'var(--text-faint)' }}>
                {sessions.length} session{sessions.length !== 1 ? 's' : ''} saved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Session history — only shown if sessions exist */}
      {hasSessions && (
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-faint)' }}>
            Recent Sessions
          </span>
          <SessionHistory sessions={sessions as unknown as Parameters<typeof SessionHistory>[0]['sessions']} />
        </div>
      )}
    </div>
  )
}
