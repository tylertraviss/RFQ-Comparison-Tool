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
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold" style={{ color: '#0f172a' }}>
        RFQ Sessions
      </h1>
      <SessionHistory sessions={sessions as unknown as Parameters<typeof SessionHistory>[0]['sessions']} />
    </div>
  )
}
