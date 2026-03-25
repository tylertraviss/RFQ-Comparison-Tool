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

  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#f1f5f9' }}>
            RFQ Sessions
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#64748b' }}>
            Paste raw supplier quotes and get instant AI-powered comparison tables.
          </p>
        </div>
        <Link
          href="/rfq/new"
          className="px-5 py-3 rounded-lg font-semibold text-sm tracking-wide no-underline transition-colors"
          style={{ background: '#2563eb', color: '#ffffff' }}
        >
          + New RFQ
        </Link>
      </div>

      {/* Session history */}
      <div className="flex flex-col gap-3">
        <span
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: '#64748b' }}
        >
          Past Sessions
        </span>
        <SessionHistory sessions={sessions as unknown as Parameters<typeof SessionHistory>[0]['sessions']} />
      </div>
    </div>
  )
}
