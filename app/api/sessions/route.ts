import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { SupplierResult } from '@/types/quote'

export async function GET() {
  const sessions = await prisma.rFQSession.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      quotes: { select: { id: true, supplierName: true } },
    },
  })
  return NextResponse.json(sessions)
}

export async function POST(req: NextRequest) {
  const { name, quotes } = await req.json() as {
    name: string
    quotes: Array<{ supplier: string; rawText: string; line_items: SupplierResult['line_items'] }>
  }

  const session = await prisma.rFQSession.create({
    data: {
      name,
      quotes: {
        create: quotes.map((q) => ({
          supplierName: q.supplier,
          rawText: q.rawText,
          lineItems: {
            create: q.line_items.map((li) => ({
              partNumber: li.part_number,
              description: li.description,
              quantity: li.quantity,
              unitPrice: li.unit_price,
              leadTimeDays: li.lead_time_days,
              notes: li.notes,
            })),
          },
        })),
      },
    },
    include: { quotes: { include: { lineItems: true } } },
  })

  return NextResponse.json(session)
}
