import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { SupplierResult } from '@/types/quote'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { results } = await req.json() as { results: SupplierResult[] }

  const table = results.map((r) => {
    const lines = r.line_items.map((li) =>
      `  - ${li.part_number}: $${li.unit_price ?? 'N/A'} each, ${li.lead_time_days ?? 'N/A'} day lead time`
    ).join('\n')
    return `${r.supplier}:\n${lines}`
  }).join('\n\n')

  const message = await client.messages.create({
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
  const intel = JSON.parse(cleaned)
  return NextResponse.json(intel)
}
