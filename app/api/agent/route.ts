import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { messages } = await req.json() as { messages: { role: 'user' | 'assistant'; content: string }[] }

  const bids = await prisma.bid.findMany({ orderBy: { bidDate: 'desc' } })

  const won     = bids.filter(b => b.status === 'WON')
  const waiting = bids.filter(b => b.status === 'WAITING')
  const lost    = bids.filter(b => b.status === 'LOST')
  const decided = won.length + lost.length
  const winRate = decided ? Math.round((won.length / decided) * 100) : 0
  const totalProfit = won.reduce((s, b) => s + b.unitProfit * b.quantity, 0)

  const formatBid = (b: typeof bids[0]) =>
    `  ${b.partNumber} | ${b.description ?? ''} | supplier: ${b.supplierName} | sell: $${b.unitSell} | cost: $${b.unitCost} | profit/unit: $${b.unitProfit} | qty: ${b.quantity} | markup: ${b.markup}% | lead: ${b.leadTimeDays ?? '?'}d | date: ${new Date(b.bidDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}${b.lostBy != null ? ` | lost by: $${b.lostBy}` : ''}`

  const context = `You are a defense distributor sales intelligence agent. You help a defense parts distributor win more bids to the DLA (Defense Logistics Agency). They buy parts from suppliers (Apex Defense Supply, Ironclad Fastener Co., Patriot Hardware Solutions), mark them up, and resell to DLA.

CURRENT PIPELINE SUMMARY:
- Total bids: ${bids.length} (${won.length} won, ${waiting.length} waiting, ${lost.length} lost)
- Win rate: ${winRate}% (of decided bids)
- Total profit on won bids: $${totalProfit.toFixed(2)}

WON BIDS (${won.length}):
${won.map(formatBid).join('\n')}

WAITING BIDS (${waiting.length}):
${waiting.map(formatBid).join('\n')}

LOST BIDS (${lost.length}):
${lost.map(formatBid).join('\n')}

Be direct, specific, and cite numbers from the data. Keep responses concise — 2–4 short paragraphs max unless a longer answer is clearly needed. If asked for a list, use a tight bullet format.

After your response, on a new line write exactly: FOLLOWUPS: then a JSON array of 3 short follow-up question strings the user might want to ask next, based on what you just answered. Example: FOLLOWUPS: ["Question one?","Question two?","Question three?"]`

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1200,
    system: context,
    messages,
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const raw = content.text
  const followupsMatch = raw.match(/FOLLOWUPS:\s*(\[.*?\])\s*$/s)
  const followUps: string[] = followupsMatch ? JSON.parse(followupsMatch[1]) : []
  const reply = raw.replace(/\nFOLLOWUPS:.*$/s, '').trim()

  return NextResponse.json({ reply, followUps })
}
