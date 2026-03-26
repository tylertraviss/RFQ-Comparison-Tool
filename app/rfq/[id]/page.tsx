import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import ComparisonTableServer from './ComparisonTableServer'

export const dynamic = 'force-dynamic'

export default async function RFQSessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const session = await prisma.rFQSession.findUnique({
    where: { id },
    include: {
      quotes: {
        include: { lineItems: true },
      },
    },
  })

  if (!session) notFound()

  const results = session.quotes.map((q) => ({
    supplier: q.supplierName,
    line_items: q.lineItems.map((li) => ({
      part_number: li.partNumber,
      description: li.description,
      quantity: li.quantity,
      unit_price: li.unitPrice,
      lead_time_days: li.leadTimeDays,
      notes: li.notes,
    })),
  }))

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
            RFQ Session
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {session.name}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            {session.quotes.length} supplier{session.quotes.length !== 1 ? 's' : ''} ·{' '}
            {new Date(session.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
        <Link
          href="/"
          className="text-sm no-underline hover:underline"
          style={{ color: '#64748b' }}
        >
          ← All sessions
        </Link>
      </div>

      <ComparisonTableServer results={results} sessionName={session.name} />
    </div>
  )
}
