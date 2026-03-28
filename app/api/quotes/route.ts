import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import type { SupplierResult } from '@/types/quote'

const anthropic = new Anthropic()

async function generateIntel(quotes: Array<{ supplier: string; line_items: SupplierResult['line_items'] }>) {
  const table = quotes.map((r) => {
    const lines = r.line_items.map((li) =>
      `  - ${li.part_number}: $${li.unit_price ?? 'N/A'} each, ${li.lead_time_days ?? 'N/A'} day lead time`
    ).join('\n')
    return `${r.supplier}:\n${lines}`
  }).join('\n\n')

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1200,
    messages: [{
      role: 'user',
      content: `You are a defense procurement analyst. Analyze these supplier quotes. Return a JSON object with three fields, each an array of exactly 3 bullet strings. Each bullet must be a single compact phrase under 12 words. No full sentences. Be specific and cite numbers.

${table}

Return ONLY valid JSON. No markdown. No preamble.

{
  "recommendation": ["bullet 1", "bullet 2", "bullet 3"],
  "vulnerabilities": ["bullet 1", "bullet 2", "bullet 3"],
  "countermeasures": ["bullet 1", "bullet 2", "bullet 3"]
}`,
    }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response')
  const cleaned = content.text.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  return JSON.parse(cleaned)
}

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

  const intel = await generateIntel(quotes).catch(() => null)

  const session = await prisma.rFQSession.create({
    data: {
      name,
      intelJson: intel ?? undefined,
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
