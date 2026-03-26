import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { bullet, context } = await req.json() as { bullet: string; context: string }

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 150,
    messages: [{
      role: 'user',
      content: `You are a defense procurement advisor. A procurement manager is reading an intelligence brief and wants to know more about this point from the "${context}" section:

"${bullet}"

Give a 2-3 sentence explanation that adds useful context, background, or actionable detail. Be direct and practical. No preamble.`,
    }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response')

  return NextResponse.json({ detail: content.text })
}
