'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
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

const COLUMNS: { status: BidStatus; label: string; accent: string; accentBg: string; icon: React.ReactNode }[] = [
  {
    status: 'WON',
    label: 'Won',
    accent: '#16a34a',
    accentBg: 'var(--highlight-green)',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  {
    status: 'WAITING',
    label: 'Waiting',
    accent: '#c2410c',
    accentBg: '#fff7ed',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    status: 'LOST',
    label: 'Lost',
    accent: '#dc2626',
    accentBg: '#fef2f2',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
  },
]

function ContractCard({ bid, onStatusChange }: { bid: Bid; onStatusChange: (id: string, status: BidStatus, lostBy?: number) => void }) {
  const [lostByInput, setLostByInput] = useState('')
  const [showLostInput, setShowLostInput] = useState(false)
  const date = new Date(bid.bidDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })

  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-3"
      style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="font-bold text-sm font-mono truncate" style={{ color: 'var(--text)' }}>{bid.partNumber}</p>
          {bid.description && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{bid.description}</p>}
        </div>
        {bid.status === 'WON' && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" className="flex-shrink-0 mt-0.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        )}
        {bid.status === 'WAITING' && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c2410c" strokeWidth="2.5" className="flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
        )}
        {bid.status === 'LOST' && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" className="flex-shrink-0 mt-0.5">
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

      {bid.status === 'WAITING' && (
        <div className="flex flex-col gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          {showLostInput ? (
            <div className="flex items-center gap-2">
              <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>Lost by</span>
              <div className="relative flex-shrink-0">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-faint)' }}>$</span>
                <input
                  type="number" min="0" step="0.01" placeholder="0.00"
                  value={lostByInput} onChange={e => setLostByInput(e.target.value)}
                  className="w-20 rounded-lg pl-5 pr-2 py-1.5 text-xs border outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>
              <button
                onClick={() => { onStatusChange(bid.id, 'LOST', parseFloat(lostByInput) || 0); setShowLostInput(false) }}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: '#fef2f2', color: '#dc2626' }}
              >Confirm</button>
              <button onClick={() => setShowLostInput(false)} className="flex-shrink-0 text-xs" style={{ color: 'var(--text-faint)' }}>Cancel</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => onStatusChange(bid.id, 'WON')}
                className="flex-1 rounded-lg py-1.5 text-xs font-semibold"
                style={{ background: 'var(--highlight-green)', color: '#16a34a' }}
              >Mark Won</button>
              <button
                onClick={() => setShowLostInput(true)}
                className="flex-1 rounded-lg py-1.5 text-xs font-semibold"
                style={{ background: '#fef2f2', color: '#dc2626' }}
              >Mark Lost</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-faint)' }}>{title}</span>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </div>
  )
}

function buildWinRate(bids: Bid[]) {
  const byWeek: Record<string, { won: number; total: number }> = {}
  for (const bid of bids) {
    const d = new Date(bid.bidDate)
    const week = `${d.getMonth() + 1}/${d.getDate() - d.getDay()}`
    if (!byWeek[week]) byWeek[week] = { won: 0, total: 0 }
    byWeek[week].total++
    if (bid.status === 'WON') byWeek[week].won++
  }
  return Object.entries(byWeek)
    .sort(([a], [b]) => new Date('2026/' + a).getTime() - new Date('2026/' + b).getTime())
    .map(([week, v]) => ({ week, rate: Math.round((v.won / v.total) * 100) }))
}

function buildPipeline(bids: Bid[]) {
  const byWeek: Record<string, { won: number; waiting: number; lost: number }> = {}
  for (const bid of bids) {
    const d = new Date(bid.bidDate)
    const week = `${d.getMonth() + 1}/${d.getDate() - d.getDay()}`
    if (!byWeek[week]) byWeek[week] = { won: 0, waiting: 0, lost: 0 }
    const val = bid.unitSell * bid.quantity
    if (bid.status === 'WON') byWeek[week].won += val
    else if (bid.status === 'WAITING') byWeek[week].waiting += val
    else byWeek[week].lost += val
  }
  return Object.entries(byWeek)
    .sort(([a], [b]) => new Date('2026/' + a).getTime() - new Date('2026/' + b).getTime())
    .map(([week, v]) => ({ week, ...v }))
}

function buildSupplierWinRate(bids: Bid[]) {
  const bySupplier: Record<string, { won: number; total: number }> = {}
  for (const bid of bids) {
    if (!bySupplier[bid.supplierName]) bySupplier[bid.supplierName] = { won: 0, total: 0 }
    bySupplier[bid.supplierName].total++
    if (bid.status === 'WON') bySupplier[bid.supplierName].won++
  }
  return Object.entries(bySupplier).map(([name, v]) => ({
    name: name.split(' ')[0],
    rate: Math.round((v.won / v.total) * 100),
    won: v.won,
    total: v.total,
  }))
}

function buildAvgLostBy(bids: Bid[]) {
  const lost = bids.filter(b => b.status === 'LOST' && b.lostBy != null)
  const bySupplier: Record<string, number[]> = {}
  for (const bid of lost) {
    if (!bySupplier[bid.supplierName]) bySupplier[bid.supplierName] = []
    bySupplier[bid.supplierName].push(bid.lostBy!)
  }
  return Object.entries(bySupplier).map(([name, vals]) => ({
    name: name.split(' ')[0],
    avg: parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)),
  }))
}

const TOOLTIP_STYLE = {
  contentStyle: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: 'var(--text-muted)' },
}

type Tab = 'kanban' | 'charts'

export default function ContractsPage() {
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('kanban')

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

  const winRateData = buildWinRate(bids)
  const pipelineData = buildPipeline(bids)
  const supplierData = buildSupplierWinRate(bids)
  const lostByData = buildAvgLostBy(bids)

  return (
    <div className="flex flex-col gap-6">

      {/* Page header */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-faint)' }}>Contracts</span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      {/* GitHub-style tab bar */}
      <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
        {([
          { key: 'kanban', label: 'Kanban Board', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="12" rx="1"/></svg> },
          { key: 'charts', label: 'Charts',       icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
        ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(t => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative"
              style={{ color: active ? 'var(--text)' : 'var(--text-muted)' }}
            >
              {t.icon}
              {t.label}
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t" style={{ background: 'var(--highlight-blue-text)' }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Charts tab */}
      {tab === 'charts' && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Win Rate Over Time */}
          <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Win Rate Over Time</span>
              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>% of bids won per week</span>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={winRateData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad-wr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} width={32} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`${v}%`, 'Win Rate']} />
                <Area type="monotone" dataKey="rate" stroke="#16a34a" strokeWidth={2} fill="url(#grad-wr)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pipeline Value */}
          <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Pipeline Value</span>
              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>Won / Waiting / Lost value by week</span>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={pipelineData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={12}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} width={40} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'K' : v}`} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`$${Number(v).toFixed(2)}`]} />
                <Bar dataKey="won" stackId="a" fill="#16a34a" radius={[0,0,0,0]} />
                <Bar dataKey="waiting" stackId="a" fill="#f59e0b" radius={[0,0,0,0]} />
                <Bar dataKey="lost" stackId="a" fill="#dc2626" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4">
              {[['Won','#16a34a'],['Waiting','#f59e0b'],['Lost','#dc2626']].map(([l,c]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: c }} />
                  <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Avg Lost-By */}
          <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Avg Lost-By Amount</span>
              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>How close your losing bids are by supplier</span>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={lostByData} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} width={55} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`$${v}`, 'Avg Lost By']} />
                <Bar dataKey="avg" fill="#dc2626" radius={[0,4,4,0]} barSize={18}>
                  {lostByData.map((_, i) => <Cell key={i} fill="#dc2626" fillOpacity={0.7 + i * 0.1} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Supplier Win Rate */}
          <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Supplier Win Rate</span>
              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>Which supplier wins you the most contracts</span>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={supplierData} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} width={55} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`${v}%`, 'Win Rate']} />
                <Bar dataKey="rate" radius={[0,4,4,0]} barSize={18}>
                  {supplierData.map((_, i) => <Cell key={i} fill="#2563eb" fillOpacity={0.6 + i * 0.15} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>}

      {/* Kanban tab */}
      {tab === 'kanban' && (loading ? (
        <div className="text-sm" style={{ color: 'var(--text-faint)' }}>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {COLUMNS.map(col => {
            const colBids = bids.filter(b => b.status === col.status)
            return (
              <div key={col.status} className="flex flex-col gap-3">
                {/* Column header */}
                <div
                  className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ background: col.accentBg }}
                >
                  <div className="flex items-center gap-2" style={{ color: col.accent }}>
                    {col.icon}
                    <span className="text-xs font-bold tracking-widest uppercase">{col.label}</span>
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: col.accent, color: '#fff' }}
                  >
                    {colBids.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-3">
                  {colBids.length === 0 ? (
                    <div
                      className="rounded-xl border border-dashed p-6 text-center text-xs"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-faint)' }}
                    >
                      No {col.label.toLowerCase()} contracts
                    </div>
                  ) : (
                    colBids.map(bid => (
                      <ContractCard key={bid.id} bid={bid} onStatusChange={handleStatusChange} />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
