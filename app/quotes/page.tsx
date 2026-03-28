import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import SessionHistory from '@/components/SessionHistory'

export const dynamic = 'force-dynamic'

export default async function QuotesPage() {
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

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto w-full">
      {/* CTA */}
      <Link
        href="/quotes/new"
        className="no-underline rounded-xl border flex items-center justify-between px-6 py-5 transition-colors group"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        onMouseEnter={undefined}
      >
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-base" style={{ color: 'var(--text)' }}>
            New Quote Comparison
          </span>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Paste supplier quotes and get an AI-powered procurement brief instantly
          </span>
        </div>
        <span className="text-2xl" style={{ color: 'var(--text-faint)' }}>+</span>
      </Link>

      {/* History */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-faint)' }}>
          {sessions.length > 0 ? 'Past RFQ Sessions' : 'No sessions yet'}
        </span>
        <SessionHistory sessions={sessions as unknown as Parameters<typeof SessionHistory>[0]['sessions']} />
      </div>
    </div>
  )
}
