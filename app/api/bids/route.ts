import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const bids = await prisma.bid.findMany({ orderBy: { bidDate: 'desc' } })
  return NextResponse.json(bids)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const bid = await prisma.bid.create({ data: body })
  return NextResponse.json(bid)
}
