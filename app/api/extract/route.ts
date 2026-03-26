import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildExtractionPrompt } from '@/lib/prompt'
import type { LineItem, SupplierResult } from '@/types/quote'

const client = new Anthropic()

function parseJSON(text: string): LineItem[] {
  // Strip markdown code blocks if Claude wraps the response
  const cleaned = text.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  return JSON.parse(cleaned)
}

async function extractQuote(supplier: string, rawText: string): Promise<SupplierResult> {
  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 8096,
    messages: [
      {
        role: 'user',
        content: buildExtractionPrompt(rawText),
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const line_items: LineItem[] = parseJSON(content.text)
  return { supplier, line_items }
}

export async function POST(req: NextRequest) {
  try {
    const { quotes } = await req.json() as {
      quotes: Array<{ supplier: string; rawText: string }>
    }

    if (!quotes || quotes.length < 2) {
      return NextResponse.json({ error: 'At least 2 quotes required' }, { status: 400 })
    }

    const results = await Promise.all(
      quotes.map((q) => extractQuote(q.supplier, q.rawText))
    )

    return NextResponse.json({ results })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Extraction error:', message)
    return NextResponse.json({ error: `Extraction failed: ${message}` }, { status: 500 })
  }
}
