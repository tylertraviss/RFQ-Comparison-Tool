'use client'

import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts'

type BidStatus = 'WAITING' | 'WON' | 'LOST'

interface Bid {
  id: string
  partNumber: string
  description: string | null
  supplierName: string
  unitCost: number
  unitSell: number
  unitProfit: number
  quantity: number
  leadTimeDays: number | null
  markup: number
  status: BidStatus
  lostBy: number | null
  bidDate: string
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function StatusBadge({ status }: { status: BidStatus }) {
  const styles: Record<BidStatus, { bg: string; color: string; label: string }> = {
    WON:     { bg: 'var(--highlight-green)',   color: 'var(--highlight-green-text)',  label: 'Won'     },
    WAITING: { bg: '#fff7ed',                  color: '#c2410c',                      label: 'Waiting' },
    LOST:    { bg: '#fef2f2',                  color: '#dc2626',                      label: 'Lost'    },
  }
  const s = styles[status]
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

function ContractCard({ bid, onStatusChange }: { bid: Bid; onStatusChange: (id: string, status: BidStatus, lostBy?: number) => void }) {
  const [lostByInput, setLostByInput] = useState('')
  const [showLostInput, setShowLostInput] = useState(false)

  const date = new Date(bid.bidDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })

  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-3"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-sm font-mono" style={{ color: 'var(--text)' }}>{bid.partNumber}</p>
          {bid.description && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{bid.description}</p>}
        </div>
        {bid.status === 'WON' && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        )}
        {bid.status === 'WAITING' && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c2410c" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
        )}
        {bid.status === 'LOST' && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        )}
      </div>

      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-faint)' }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        {date}
      </div>

      {bid.status === 'WON' && (
        <div className="flex gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>Profit/Unit: <span className="font-semibold" style={{ color: '#16a34a' }}>${fmt(bid.unitProfit)}</span></span>
          <span>Units: <span className="font-semibold" style={{ color: 'var(--text)' }}>{bid.quantity}</span></span>
        </div>
      )}
      {bid.status === 'WAITING' && (
        <div className="flex gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>Units: <span className="font-semibold" style={{ color: 'var(--text)' }}>{bid.quantity}</span></span>
          <span>Est. Profit: <span className="font-semibold" style={{ color: 'var(--text)' }}>${fmt(bid.unitProfit * bid.quantity)}</span></span>
        </div>
      )}
      {bid.status === 'LOST' && (
        <div className="flex gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>Unit Price: <span className="font-semibold" style={{ color: 'var(--text)' }}>${fmt(bid.unitSell)}</span></span>
          {bid.lostBy != null && (
            <span>Lost by: <span className="font-semibold" style={{ color: '#dc2626' }}>${fmt(bid.lostBy)}</span></span>
          )}
        </div>
      )}

      {/* Status actions */}
      {bid.status === 'WAITING' && (
        <div className="flex flex-col gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          {showLostInput ? (
            <div className="flex items-center gap-2">
              <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>Lost by</span>
              <div className="relative flex-shrink-0">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-faint)' }}>$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={lostByInput}
                  onChange={e => setLostByInput(e.target.value)}
                  className="w-20 rounded-lg pl-5 pr-2 py-1.5 text-xs border outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>
              <button
                onClick={() => { onStatusChange(bid.id, 'LOST', parseFloat(lostByInput) || 0); setShowLostInput(false) }}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: '#fef2f2', color: '#dc2626' }}
              >
                Confirm
              </button>
              <button onClick={() => setShowLostInput(false)} className="flex-shrink-0 text-xs" style={{ color: 'var(--text-faint)' }}>Cancel</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => onStatusChange(bid.id, 'WON')}
                className="flex-1 rounded-lg py-1.5 text-xs font-semibold"
                style={{ background: 'var(--highlight-green)', color: 'var(--highlight-green-text)' }}
              >
                Mark Won
              </button>
              <button
                onClick={() => setShowLostInput(true)}
                className="flex-1 rounded-lg py-1.5 text-xs font-semibold"
                style={{ background: '#fef2f2', color: '#dc2626' }}
              >
                Mark Lost
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ChartCard({ title, data, dataKey, color }: { title: string; data: any[]; dataKey: string; color: string }) {
  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-3"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: color }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{title}</span>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.15} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} width={40}
            tickFormatter={dataKey.includes('value') ? (v) => `$${v >= 1000000 ? (v/1000000).toFixed(1)+'M' : v >= 1000 ? (v/1000).toFixed(0)+'K' : v}` : undefined}
          />
          <Tooltip
            contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: 'var(--text-muted)' }}
          />
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#grad-${dataKey})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function buildChartData(bids: Bid[]) {
  const byDay: Record<string, { bids: number; awards: number; valueBid: number; valueAwarded: number }> = {}

  for (const bid of bids) {
    const d = new Date(bid.bidDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
    if (!byDay[d]) byDay[d] = { bids: 0, awards: 0, valueBid: 0, valueAwarded: 0 }
    byDay[d].bids += 1
    byDay[d].valueBid += bid.unitSell * bid.quantity
    if (bid.status === 'WON') {
      byDay[d].awards += 1
      byDay[d].valueAwarded += bid.unitSell * bid.quantity
    }
  }

  return Object.entries(byDay)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([date, vals]) => ({ date, ...vals }))
}

const TABS: BidStatus[] = ['WON', 'WAITING', 'LOST']
const TAB_LABELS: Record<BidStatus, string> = { WON: 'Won', WAITING: 'Waiting', LOST: 'Lost' }
const TAB_COLORS: Record<BidStatus, { active: string; text: string }> = {
  WON:     { active: 'var(--highlight-green)',   text: 'var(--highlight-green-text)' },
  WAITING: { active: '#fff7ed',                  text: '#c2410c' },
  LOST:    { active: '#fef2f2',                  text: '#dc2626' },
}

export default function ContractsPage() {
  const [bids, setBids] = useState<Bid[]>([])
  const [tab, setTab] = useState<BidStatus>('WON')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/bids').then(r => r.json()).then(data => { setBids(data); setLoading(false) })
  }, [])

  async function handleStatusChange(id: string, status: BidStatus, lostBy?: number) {
    const body: any = { status }
    if (lostBy != null) body.lostBy = lostBy
    const res = await fetch(`/api/bids/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const updated = await res.json()
    setBids(prev => prev.map(b => b.id === updated.id ? updated : b))
  }

  const filtered = bids.filter(b => b.status === tab)
  const chartData = buildChartData(bids)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-faint)' }}>
          Contracts
        </span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">

        {/* Left — contract list */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold" style={{ color: 'var(--text)' }}>Contracts</span>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {TABS.map(t => {
              const active = tab === t
              const c = TAB_COLORS[t]
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="px-3 py-1 rounded-full text-xs font-semibold border transition-all"
                  style={{
                    background: active ? c.active : 'transparent',
                    color: active ? c.text : 'var(--text-muted)',
                    borderColor: active ? c.text : 'var(--border)',
                  }}
                >
                  {TAB_LABELS[t]}
                </button>
              )
            })}
          </div>

          {/* Cards */}
          <div className="flex flex-col gap-3">
            {loading && (
              <div className="text-xs" style={{ color: 'var(--text-faint)' }}>Loading...</div>
            )}
            {!loading && filtered.length === 0 && (
              <div
                className="rounded-xl border p-6 text-center text-sm"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-faint)' }}
              >
                No {TAB_LABELS[tab].toLowerCase()} contracts yet
              </div>
            )}
            {filtered.map(bid => (
              <ContractCard key={bid.id} bid={bid} onStatusChange={handleStatusChange} />
            ))}
          </div>
        </div>

        {/* Right — charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartCard title="Bid by Day"           data={chartData} dataKey="bids"          color="#2563eb" />
          <ChartCard title="Awards by Day"        data={chartData} dataKey="awards"        color="#16a34a" />
          <ChartCard title="Value Bid by Day"     data={chartData} dataKey="valueBid"      color="#2563eb" />
          <ChartCard title="Value Awarded by Day" data={chartData} dataKey="valueAwarded"  color="#16a34a" />
        </div>
      </div>
    </div>
  )
}
