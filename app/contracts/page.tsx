'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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
function fmtK(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${fmt(n)}`
}

const TOOLTIP_STYLE = {
  contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12, color: '#f1f5f9' },
  labelStyle: { color: '#94a3b8' },
  itemStyle: { color: '#f1f5f9' },
}

// ── Data builders ─────────────────────────────────────────────────────────────

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

function buildSupplierWinRate(bids: Bid[]) {
  const m: Record<string, { won: number; total: number }> = {}
  for (const bid of bids) {
    if (!m[bid.supplierName]) m[bid.supplierName] = { won: 0, total: 0 }
    m[bid.supplierName].total++
    if (bid.status === 'WON') m[bid.supplierName].won++
  }
  return Object.entries(m).map(([name, v]) => ({
    name: name.split(' ')[0],
    rate: Math.round((v.won / v.total) * 100),
    won: v.won, total: v.total,
  })).sort((a, b) => b.rate - a.rate)
}

function buildAvgLostBy(bids: Bid[]) {
  const m: Record<string, number[]> = {}
  for (const bid of bids.filter(b => b.status === 'LOST' && b.lostBy != null)) {
    if (!m[bid.supplierName]) m[bid.supplierName] = []
    m[bid.supplierName].push(bid.lostBy!)
  }
  return Object.entries(m).map(([name, vals]) => ({
    name: name.split(' ')[0],
    avg: parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)),
  })).sort((a, b) => b.avg - a.avg)
}

function buildMarginByMonth(bids: Bid[]) {
  const m: Record<string, { revenue: number; cost: number }> = {}
  for (const bid of bids.filter(b => b.status === 'WON')) {
    const month = new Date(bid.bidDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    if (!m[month]) m[month] = { revenue: 0, cost: 0 }
    m[month].revenue += bid.unitSell * bid.quantity
    m[month].cost += bid.unitCost * bid.quantity
  }
  return Object.entries(m)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([month, v]) => ({
      month,
      revenue: parseFloat(v.revenue.toFixed(2)),
      cost: parseFloat(v.cost.toFixed(2)),
      profit: parseFloat((v.revenue - v.cost).toFixed(2)),
    }))
}

function buildMarkupWinRate(bids: Bid[]) {
  const ranges: Record<string, { won: number; total: number }> = {
    '≤15%': { won: 0, total: 0 },
    '16–18%': { won: 0, total: 0 },
    '19–20%': { won: 0, total: 0 },
    '21–25%': { won: 0, total: 0 },
    '26–30%': { won: 0, total: 0 },
  }
  for (const bid of bids.filter(b => b.status !== 'WAITING')) {
    const key = bid.markup <= 15 ? '≤15%' : bid.markup <= 18 ? '16–18%' : bid.markup <= 20 ? '19–20%' : bid.markup <= 25 ? '21–25%' : '26–30%'
    ranges[key].total++
    if (bid.status === 'WON') ranges[key].won++
  }
  return Object.entries(ranges)
    .filter(([, v]) => v.total > 0)
    .map(([range, v]) => ({ range, rate: Math.round((v.won / v.total) * 100), total: v.total }))
}

function buildRecentActivity(bids: Bid[]) {
  return [...bids].sort((a, b) => new Date(b.bidDate).getTime() - new Date(a.bidDate).getTime())
}

function buildTopParts(bids: Bid[]) {
  return bids
    .filter(b => b.status === 'WON')
    .map(b => ({ ...b, totalProfit: b.unitProfit * b.quantity }))
    .sort((a, b) => b.totalProfit - a.totalProfit)
    .slice(0, 10)
}

// ── Markdown renderer ─────────────────────────────────────────────────────────

function renderMarkdown(text: string) {
  return text.split('\n').map((line, i) => {
    // ## Heading
    if (/^##\s/.test(line)) {
      return <p key={i} className="font-bold text-base mb-1" style={{ color: 'var(--text)' }}>{line.replace(/^##\s/, '')}</p>
    }
    // # Heading
    if (/^#\s/.test(line)) {
      return <p key={i} className="font-bold text-lg mb-1" style={{ color: 'var(--text)' }}>{line.replace(/^#\s/, '')}</p>
    }
    // Empty line → spacer
    if (line.trim() === '') {
      return <div key={i} className="h-2" />
    }
    // Inline bold (**text**)
    const parts = line.split(/(\*\*[^*]+\*\*)/)
    const rendered = parts.map((part, j) =>
      /^\*\*[^*]+\*\*$/.test(part)
        ? <strong key={j}>{part.slice(2, -2)}</strong>
        : part
    )
    return <p key={i} className="leading-relaxed">{rendered}</p>
  })
}

// ── Kanban ────────────────────────────────────────────────────────────────────

const COLUMNS: { status: BidStatus; label: string; accent: string; accentBg: string }[] = [
  { status: 'WON',     label: 'Won',     accent: '#16a34a', accentBg: 'var(--highlight-green)' },
  { status: 'WAITING', label: 'Waiting', accent: '#c2410c', accentBg: '#fff7ed' },
  { status: 'LOST',    label: 'Lost',    accent: '#dc2626', accentBg: '#fef2f2' },
]

function ContractCard({ bid, onStatusChange }: { bid: Bid; onStatusChange: (id: string, status: BidStatus, lostBy?: number) => void }) {
  const [lostByInput, setLostByInput] = useState('')
  const [showLostInput, setShowLostInput] = useState(false)
  const date = new Date(bid.bidDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })

  return (
    <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="font-bold text-sm font-mono truncate" style={{ color: 'var(--text)' }}>{bid.partNumber}</p>
          {bid.description && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{bid.description}</p>}
        </div>
        {bid.status === 'WON' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" className="flex-shrink-0 mt-0.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
        {bid.status === 'WAITING' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c2410c" strokeWidth="2.5" className="flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        {bid.status === 'LOST' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" className="flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>}
      </div>
      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-faint)' }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
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
          {bid.lostBy != null && <span>Lost by: <span className="font-semibold" style={{ color: '#dc2626' }}>${fmt(bid.lostBy)}</span></span>}
        </div>
      )}
      {bid.status === 'WAITING' && (
        <div className="flex flex-col gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          {showLostInput ? (
            <div className="flex items-center gap-2">
              <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>Lost by</span>
              <div className="relative flex-shrink-0">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-faint)' }}>$</span>
                <input type="number" min="0" step="0.01" placeholder="0.00" value={lostByInput} onChange={e => setLostByInput(e.target.value)}
                  className="w-20 rounded-lg pl-5 pr-2 py-1.5 text-xs border outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
              </div>
              <button onClick={() => { onStatusChange(bid.id, 'LOST', parseFloat(lostByInput) || 0); setShowLostInput(false) }}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#fef2f2', color: '#dc2626' }}>Confirm</button>
              <button onClick={() => setShowLostInput(false)} className="flex-shrink-0 text-xs" style={{ color: 'var(--text-faint)' }}>Cancel</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => onStatusChange(bid.id, 'WON')}
                className="flex-1 rounded-lg py-1.5 text-xs font-semibold" style={{ background: 'var(--highlight-green)', color: '#16a34a' }}>Mark Won</button>
              <button onClick={() => setShowLostInput(true)}
                className="flex-1 rounded-lg py-1.5 text-xs font-semibold" style={{ background: '#fef2f2', color: '#dc2626' }}>Mark Lost</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = 'dashboard' | 'pipeline' | 'analytics' | 'top-parts' | 'agent'

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard',  label: 'Dashboard',  icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg> },
  { key: 'pipeline',   label: 'Pipeline',   icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="12" rx="1"/></svg> },
  { key: 'analytics',  label: 'Analytics',  icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { key: 'top-parts',  label: 'Top Parts',  icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg> },
  { key: 'agent',      label: 'Agent',      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M9 11V7a3 3 0 0 1 6 0v4"/><circle cx="9" cy="16" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="16" r="1" fill="currentColor" stroke="none"/><path d="M12 3v2"/><path d="M8 3l1 1.5"/><path d="M16 3l-1 1.5"/></svg> },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ContractsPage() {
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('dashboard')

  // Agent state
  const [agentMessages, setAgentMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [agentFollowUps, setAgentFollowUps] = useState<string[]>([])
  const [agentInput, setAgentInput] = useState('')
  const [agentLoading, setAgentLoading] = useState(false)

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

  const won = bids.filter(b => b.status === 'WON')
  const waiting = bids.filter(b => b.status === 'WAITING')
  const lost = bids.filter(b => b.status === 'LOST')
  const decided = won.length + lost.length
  const winRate = decided ? Math.round((won.length / decided) * 100) : 0
  const totalProfit = won.reduce((s, b) => s + b.unitProfit * b.quantity, 0)
  const pipelineValue = waiting.reduce((s, b) => s + b.unitSell * b.quantity, 0)

  const winRateData      = buildWinRate(bids)
  const supplierData     = buildSupplierWinRate(bids)
  const lostByData       = buildAvgLostBy(bids)
  const marginData       = buildMarginByMonth(bids)
  const markupRangeData  = buildMarkupWinRate(bids)
  const recentActivity   = buildRecentActivity(bids)
  const topPartsData     = buildTopParts(bids)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-faint)' }}>Contracts</span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      {/* Tab bar */}
      <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
        {TABS.map(t => {
          const active = tab === t.key
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap"
              style={{ color: active ? 'var(--text)' : 'var(--text-muted)' }}>
              {t.icon}{t.label}
              {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t" style={{ background: 'var(--highlight-blue-text)' }} />}
            </button>
          )
        })}
      </div>

      {loading && <div className="text-sm" style={{ color: 'var(--text-faint)' }}>Loading...</div>}
      {!loading && (
        <>
          {/* ── DASHBOARD ── */}
          {tab === 'dashboard' && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Win Rate',       value: `${winRate}%`,       sub: `${won.length} of ${decided} decided`,                    accent: '#16a34a' },
                  { label: 'Total Profit',   value: fmtK(totalProfit),   sub: `across ${won.length} won contracts`,                     accent: '#2563eb' },
                  { label: 'Pipeline Value', value: fmtK(pipelineValue), sub: `${waiting.length} bids pending`,                         accent: '#c2410c' },
                  { label: 'Total Bids',     value: String(bids.length), sub: `${won.length}W · ${waiting.length}P · ${lost.length}L`,  accent: 'var(--text)' },
                ].map(k => (
                  <div key={k.label} className="rounded-xl border p-4 flex flex-col gap-1" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                    <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>{k.label}</span>
                    <span className="text-2xl font-bold" style={{ color: k.accent }}>{k.value}</span>
                    <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{k.sub}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Win Rate Over Time</span>
                  <ResponsiveContainer width="100%" height={140}>
                    <AreaChart data={winRateData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <defs><linearGradient id="dg-wr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16a34a" stopOpacity={0.15}/><stop offset="95%" stopColor="#16a34a" stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} width={32} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                      <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`${v}%`, 'Win Rate']} />
                      <Area type="monotone" dataKey="rate" stroke="#16a34a" strokeWidth={2} fill="url(#dg-wr)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Recent Activity</span>
                  <div className="flex flex-col gap-2.5">
                    {recentActivity.slice(0, 7).map(bid => (
                      <div key={bid.id} className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: bid.status === 'WON' ? '#16a34a' : bid.status === 'WAITING' ? '#c2410c' : '#dc2626' }} />
                          <span className="font-mono truncate" style={{ color: 'var(--text)' }}>{bid.partNumber}</span>
                          <span className="truncate hidden sm:block" style={{ color: 'var(--text-faint)' }}>{bid.description}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-semibold" style={{ color: bid.status === 'WON' ? '#16a34a' : bid.status === 'WAITING' ? '#c2410c' : '#dc2626' }}>{bid.status}</span>
                          <span style={{ color: 'var(--text-faint)' }}>{new Date(bid.bidDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PIPELINE ── */}
          {tab === 'pipeline' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              {COLUMNS.map(col => {
                const colBids = bids.filter(b => b.status === col.status)
                return (
                  <div key={col.status} className="flex flex-col gap-3">
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: col.accentBg }}>
                      <span className="text-xs font-bold tracking-widest uppercase" style={{ color: col.accent }}>{col.label}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: col.accent, color: '#fff' }}>{colBids.length}</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {colBids.length === 0
                        ? <div className="rounded-xl border border-dashed p-6 text-center text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-faint)' }}>No {col.label.toLowerCase()} contracts</div>
                        : colBids.map(bid => <ContractCard key={bid.id} bid={bid} onStatusChange={handleStatusChange} />)
                      }
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── ANALYTICS ── */}
          {tab === 'analytics' && (
            <div className="flex flex-col gap-4">
              {/* Row 1: Win rate trend + Monthly gross margin */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                  <div>
                    <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Win Rate Over Time</span>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>% of bids won per week</p>
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={winRateData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <defs><linearGradient id="ag-wr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16a34a" stopOpacity={0.15}/><stop offset="95%" stopColor="#16a34a" stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} width={32} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                      <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`${v}%`, 'Win Rate']} />
                      <Area type="monotone" dataKey="rate" stroke="#16a34a" strokeWidth={2} fill="url(#ag-wr)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                  <div>
                    <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Monthly Gross Margin</span>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>Revenue, cost, and profit on won bids</p>
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={marginData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} width={44} tickFormatter={v => fmtK(v)} />
                      <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [fmtK(Number(v))]} />
                      <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} dot={{ r: 3, fill: '#2563eb' }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="cost"    stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="profit"  stroke="#16a34a" strokeWidth={2} dot={{ r: 3, fill: '#16a34a' }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4">{[['Revenue','#2563eb'],['Cost','#f59e0b'],['Profit','#16a34a']].map(([l,c])=><div key={l} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: c }}/><span className="text-xs" style={{ color: 'var(--text-faint)' }}>{l}</span></div>)}</div>
                </div>
              </div>

              {/* Row 2: Supplier win rate + Avg lost-by */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                  <div>
                    <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Supplier Win Rate</span>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>Which supplier quotes win you the most</p>
                  </div>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={supplierData} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid horizontal={false} stroke="var(--border)" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} width={55} />
                      <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`${v}%`, 'Win Rate']} />
                      <Bar dataKey="rate" barSize={18}
                        shape={(props: any) => <rect x={props.x} y={props.y} width={props.width} height={props.height} fill="#2563eb" fillOpacity={0.6 + props.index * 0.15} rx={4} />}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                  <div>
                    <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Avg Lost-By Amount</span>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>How close your losing bids are — lower is better</p>
                  </div>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={lostByData} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid horizontal={false} stroke="var(--border)" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} width={55} />
                      <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`$${v}`, 'Avg Lost By']} />
                      <Bar dataKey="avg" barSize={18}
                        shape={(props: any) => <rect x={props.x} y={props.y} width={props.width} height={props.height} fill="#dc2626" fillOpacity={0.65 + props.index * 0.1} rx={4} />}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Row 3: Markup sweet spot */}
              <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Win Rate by Markup Range</span>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>Find your pricing sweet spot — where you win most often</p>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={markupRangeData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="range" tick={{ fontSize: 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} width={32} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={(v: any, _: any, p: any) => [`${v}% win rate (${p.payload.total} bids)`, 'Rate']} />
                    <Bar dataKey="rate" barSize={36}
                      shape={(props: any) => {
                        const fill = props.rate >= 70 ? '#16a34a' : props.rate >= 40 ? '#2563eb' : '#dc2626'
                        return <rect x={props.x} y={props.y} width={props.width} height={props.height} fill={fill} fillOpacity={0.85} rx={4} />
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex gap-4">{[['≥70% win rate','#16a34a'],['40–69%','#2563eb'],['<40%','#dc2626']].map(([l,c])=><div key={l} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: c }}/><span className="text-xs" style={{ color: 'var(--text-faint)' }}>{l}</span></div>)}</div>
              </div>
            </div>
          )}

          {/* ── TOP PARTS ── */}
          {tab === 'top-parts' && (
            <div className="flex flex-col gap-3">
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Top 10 won bids ranked by total profit generated.</p>
              {topPartsData.map((bid, i) => (
                <div key={bid.id} className="rounded-xl border p-4 flex items-center gap-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                  <span className="text-2xl font-bold w-8 text-center flex-shrink-0"
                    style={{ color: i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : i === 2 ? '#c2410c' : 'var(--text-faint)' }}>
                    {i + 1}
                  </span>
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className="font-mono font-semibold text-sm" style={{ color: 'var(--text)' }}>{bid.partNumber}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{bid.description ?? '—'} · {bid.supplierName}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    <span className="text-lg font-bold" style={{ color: '#16a34a' }}>${fmt(bid.totalProfit)}</span>
                    <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{bid.quantity} units · {bid.markup}% markup</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── AGENT ── */}
          {tab === 'agent' && (
            <div className="flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--highlight-blue)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--highlight-blue-text)" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="10" rx="2"/>
                    <path d="M9 11V7a3 3 0 0 1 6 0v4"/>
                    <circle cx="9" cy="16" r="1" fill="currentColor" stroke="none"/>
                    <circle cx="15" cy="16" r="1" fill="currentColor" stroke="none"/>
                    <path d="M12 3v2"/><path d="M8 3l1 1.5"/><path d="M16 3l-1 1.5"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Sales Intelligence Agent</p>
                  <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Ask anything about your pipeline, pricing, or win rate</p>
                </div>
              </div>

              {/* Suggested prompts — only shown before first message */}
              {agentMessages.length === 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    'Why am I losing bids?',
                    'Which parts should I reprice?',
                    'Which supplier wins me the most?',
                    'What should I focus on this week?',
                  ].map(prompt => (
                    <button key={prompt} onClick={() => setAgentInput(prompt)}
                      className="text-left px-4 py-3 rounded-xl border text-sm transition-colors hover:opacity-80"
                      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* Message thread */}
              {agentMessages.length > 0 && (
                <div className="flex flex-col gap-4">
                  {agentMessages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                        style={{ background: msg.role === 'user' ? 'var(--highlight-blue)' : 'var(--bg-surface)', color: msg.role === 'user' ? 'var(--highlight-blue-text)' : 'var(--text-muted)', border: '1px solid var(--border)' }}>
                        {msg.role === 'user' ? 'Y' : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="10" rx="2"/>
                            <path d="M9 11V7a3 3 0 0 1 6 0v4"/>
                            <circle cx="9" cy="16" r="1" fill="currentColor" stroke="none"/>
                            <circle cx="15" cy="16" r="1" fill="currentColor" stroke="none"/>
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 max-w-[85%]">
                        <div className="rounded-xl px-4 py-3 text-sm"
                          style={{
                            background: msg.role === 'user' ? 'var(--highlight-blue)' : 'var(--bg-surface)',
                            color: msg.role === 'user' ? 'var(--highlight-blue-text)' : 'var(--text)',
                            border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                          }}>
                          {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
                        </div>
                      </div>
                    </div>
                  ))}
                  {agentLoading && (
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="10" rx="2"/>
                          <path d="M9 11V7a3 3 0 0 1 6 0v4"/>
                          <circle cx="9" cy="16" r="1" fill="currentColor" stroke="none"/>
                          <circle cx="15" cy="16" r="1" fill="currentColor" stroke="none"/>
                        </svg>
                      </div>
                      <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-1.5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--text-faint)', animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--text-faint)', animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--text-faint)', animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Follow-up suggestions */}
              {!agentLoading && agentFollowUps.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {agentFollowUps.map(q => (
                    <button key={q} onClick={() => setAgentInput(q)}
                      className="px-3 py-1.5 rounded-full border text-xs transition-opacity hover:opacity-70"
                      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <form
                onSubmit={async e => {
                  e.preventDefault()
                  const text = agentInput.trim()
                  if (!text || agentLoading) return
                  const next = [...agentMessages, { role: 'user' as const, content: text }]
                  setAgentMessages(next)
                  setAgentInput('')
                  setAgentFollowUps([])
                  setAgentLoading(true)
                  try {
                    const res = await fetch('/api/agent', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ messages: next }),
                    })
                    const data = await res.json()
                    setAgentMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
                    setAgentFollowUps(data.followUps ?? [])
                  } finally {
                    setAgentLoading(false)
                  }
                }}
                className="flex gap-2 items-end"
              >
                <textarea
                  rows={1}
                  value={agentInput}
                  onChange={e => setAgentInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit() } }}
                  placeholder="Ask about your pipeline, pricing, win rate..."
                  className="flex-1 rounded-xl border px-4 py-3 text-sm outline-none resize-none"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text)', minHeight: 48 }}
                />
                <button type="submit" disabled={!agentInput.trim() || agentLoading}
                  className="px-4 py-3 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-40"
                  style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', minHeight: 48 }}>
                  Send
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  )
}
