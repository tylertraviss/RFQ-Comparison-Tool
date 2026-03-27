'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, ScatterChart, Scatter,
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
function fmtK(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${fmt(n)}`
}

const TOOLTIP_STYLE = {
  contentStyle: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: 'var(--text-muted)' },
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
  }))
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
  }))
}

function buildPartsCatalog(bids: Bid[]) {
  const m: Record<string, { partNumber: string; description: string | null; won: number; total: number; profits: number[]; markups: number[] }> = {}
  for (const bid of bids) {
    if (!m[bid.partNumber]) m[bid.partNumber] = { partNumber: bid.partNumber, description: bid.description, won: 0, total: 0, profits: [], markups: [] }
    m[bid.partNumber].total++
    m[bid.partNumber].markups.push(bid.markup)
    if (bid.status === 'WON') { m[bid.partNumber].won++; m[bid.partNumber].profits.push(bid.unitProfit) }
  }
  return Object.values(m).map(p => ({
    partNumber: p.partNumber,
    description: p.description,
    winRate: Math.round((p.won / p.total) * 100),
    bids: p.total,
    wins: p.won,
    avgProfit: p.profits.length ? parseFloat((p.profits.reduce((a, b) => a + b, 0) / p.profits.length).toFixed(2)) : null,
    avgMarkup: parseFloat((p.markups.reduce((a, b) => a + b, 0) / p.markups.length).toFixed(1)),
  })).sort((a, b) => b.winRate - a.winRate)
}

function buildMarginAnalysis(bids: Bid[]) {
  return bids.filter(b => b.status !== 'WAITING').map(b => ({
    markup: b.markup,
    won: b.status === 'WON' ? 1 : 0,
    label: b.partNumber,
    status: b.status,
  }))
}

function buildPnL(bids: Bid[]) {
  const m: Record<string, { revenue: number; cost: number }> = {}
  for (const bid of bids.filter(b => b.status === 'WON')) {
    const month = new Date(bid.bidDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    if (!m[month]) m[month] = { revenue: 0, cost: 0 }
    m[month].revenue += bid.unitSell * bid.quantity
    m[month].cost += bid.unitCost * bid.quantity
  }
  return Object.entries(m)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([month, v]) => ({ month, revenue: parseFloat(v.revenue.toFixed(2)), cost: parseFloat(v.cost.toFixed(2)), profit: parseFloat((v.revenue - v.cost).toFixed(2)) }))
}

function buildTimeline(bids: Bid[]) {
  return [...bids].sort((a, b) => new Date(b.bidDate).getTime() - new Date(a.bidDate).getTime())
}

function buildLeaderboard(bids: Bid[]) {
  return bids.filter(b => b.status === 'WON')
    .map(b => ({ ...b, totalProfit: b.unitProfit * b.quantity }))
    .sort((a, b) => b.totalProfit - a.totalProfit)
    .slice(0, 10)
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

type Tab = 'dashboard' | 'kanban' | 'charts' | 'catalog' | 'margin' | 'pnl' | 'timeline' | 'leaderboard'

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard',   label: 'Dashboard',      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg> },
  { key: 'kanban',      label: 'Kanban',          icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="12" rx="1"/></svg> },
  { key: 'charts',      label: 'Charts',          icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { key: 'catalog',     label: 'Parts Catalog',   icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
  { key: 'margin',      label: 'Margin Analysis', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
  { key: 'pnl',         label: 'P&L',             icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/></svg> },
  { key: 'timeline',    label: 'Timeline',        icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="17" y1="12" x2="3" y2="12"/><line x1="17" y1="6" x2="3" y2="6"/><line x1="17" y1="18" x2="3" y2="18"/><circle cx="21" cy="6" r="1" fill="currentColor"/><circle cx="21" cy="12" r="1" fill="currentColor"/><circle cx="21" cy="18" r="1" fill="currentColor"/></svg> },
  { key: 'leaderboard', label: 'Leaderboard',     icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg> },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ContractsPage() {
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('dashboard')

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
  const winRate = bids.length ? Math.round((won.length / bids.filter(b => b.status !== 'WAITING').length) * 100) : 0
  const totalProfit = won.reduce((s, b) => s + b.unitProfit * b.quantity, 0)
  const pipelineValue = waiting.reduce((s, b) => s + b.unitSell * b.quantity, 0)

  const winRateData = buildWinRate(bids)
  const pipelineData = buildPipeline(bids)
  const supplierData = buildSupplierWinRate(bids)
  const lostByData = buildAvgLostBy(bids)
  const catalogData = buildPartsCatalog(bids)
  const marginData = buildMarginAnalysis(bids)
  const pnlData = buildPnL(bids)
  const timelineData = buildTimeline(bids)
  const leaderboardData = buildLeaderboard(bids)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-faint)' }}>Contracts</span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      {/* Tab bar */}
      <div className="flex border-b overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
        {TABS.map(t => {
          const active = tab === t.key
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap flex-shrink-0"
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
              {/* KPI row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Win Rate',       value: `${winRate}%`,         sub: `${won.length} of ${won.length + lost.length} decided`, accent: '#16a34a' },
                  { label: 'Total Profit',   value: fmtK(totalProfit),     sub: `across ${won.length} won contracts`,                   accent: '#2563eb' },
                  { label: 'Pipeline Value', value: fmtK(pipelineValue),   sub: `${waiting.length} bids pending`,                       accent: '#c2410c' },
                  { label: 'Total Bids',     value: String(bids.length),   sub: `${won.length}W · ${waiting.length}P · ${lost.length}L`, accent: 'var(--text)' },
                ].map(k => (
                  <div key={k.label} className="rounded-xl border p-4 flex flex-col gap-1" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                    <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>{k.label}</span>
                    <span className="text-2xl font-bold" style={{ color: k.accent }}>{k.value}</span>
                    <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{k.sub}</span>
                  </div>
                ))}
              </div>
              {/* Win rate + recent */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Win Rate Over Time</span>
                  <ResponsiveContainer width="100%" height={140}>
                    <AreaChart data={winRateData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <defs><linearGradient id="dg-wr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16a34a" stopOpacity={0.15}/><stop offset="95%" stopColor="#16a34a" stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} width={32} tickFormatter={v => `${v}%`} domain={[0,100]} />
                      <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`${v}%`, 'Win Rate']} />
                      <Area type="monotone" dataKey="rate" stroke="#16a34a" strokeWidth={2} fill="url(#dg-wr)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Recent Activity</span>
                  <div className="flex flex-col gap-2">
                    {timelineData.slice(0, 6).map(bid => (
                      <div key={bid.id} className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: bid.status === 'WON' ? '#16a34a' : bid.status === 'WAITING' ? '#c2410c' : '#dc2626' }} />
                          <span className="font-mono truncate" style={{ color: 'var(--text)' }}>{bid.partNumber}</span>
                        </div>
                        <span style={{ color: 'var(--text-faint)' }}>{new Date(bid.bidDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── KANBAN ── */}
          {tab === 'kanban' && (
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

          {/* ── CHARTS ── */}
          {tab === 'charts' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <div><span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Win Rate Over Time</span><p className="text-xs" style={{ color: 'var(--text-faint)' }}>% of bids won per week</p></div>
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={winRateData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs><linearGradient id="cg-wr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16a34a" stopOpacity={0.15}/><stop offset="95%" stopColor="#16a34a" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} width={32} tickFormatter={v => `${v}%`} domain={[0,100]} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`${v}%`, 'Win Rate']} />
                    <Area type="monotone" dataKey="rate" stroke="#16a34a" strokeWidth={2} fill="url(#cg-wr)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <div><span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Pipeline Value</span><p className="text-xs" style={{ color: 'var(--text-faint)' }}>Won / Waiting / Lost by week</p></div>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={pipelineData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={12}>
                    <CartesianGrid vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} width={40} tickFormatter={v => fmtK(v)} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [fmtK(Number(v))]} />
                    <Bar dataKey="won" stackId="a" fill="#16a34a" /><Bar dataKey="waiting" stackId="a" fill="#f59e0b" /><Bar dataKey="lost" stackId="a" fill="#dc2626" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex gap-4">{[['Won','#16a34a'],['Waiting','#f59e0b'],['Lost','#dc2626']].map(([l,c])=><div key={l} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: c }}/><span className="text-xs" style={{ color: 'var(--text-faint)' }}>{l}</span></div>)}</div>
              </div>
              <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <div><span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Avg Lost-By Amount</span><p className="text-xs" style={{ color: 'var(--text-faint)' }}>How close your losing bids are</p></div>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={lostByData} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid horizontal={false} stroke="var(--border)" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} width={55} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`$${v}`, 'Avg Lost By']} />
                    <Bar dataKey="avg" fill="#dc2626" radius={[0,4,4,0]} barSize={18}>{lostByData.map((_,i)=><Cell key={i} fill="#dc2626" fillOpacity={0.7+i*0.1}/>)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <div><span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Supplier Win Rate</span><p className="text-xs" style={{ color: 'var(--text-faint)' }}>Which supplier wins you the most</p></div>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={supplierData} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid horizontal={false} stroke="var(--border)" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} domain={[0,100]} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} width={55} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`${v}%`, 'Win Rate']} />
                    <Bar dataKey="rate" radius={[0,4,4,0]} barSize={18}>{supplierData.map((_,i)=><Cell key={i} fill="#2563eb" fillOpacity={0.6+i*0.15}/>)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── PARTS CATALOG ── */}
          {tab === 'catalog' && (
            <div className="flex flex-col gap-3">
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                      {['Part Number', 'Description', 'Bids', 'Wins', 'Win Rate', 'Avg Profit/Unit', 'Avg Markup'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {catalogData.map((p, i) => (
                      <tr key={p.partNumber} style={{ borderBottom: i < catalogData.length - 1 ? '1px solid var(--border)' : undefined, background: 'var(--bg)' }}>
                        <td className="px-4 py-3 font-mono font-semibold text-xs" style={{ color: 'var(--text)' }}>{p.partNumber}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{p.description ?? '—'}</td>
                        <td className="px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text)' }}>{p.bids}</td>
                        <td className="px-4 py-3 text-xs font-semibold" style={{ color: '#16a34a' }}>{p.wins}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)', maxWidth: 60 }}>
                              <div className="h-full rounded-full" style={{ width: `${p.winRate}%`, background: p.winRate >= 60 ? '#16a34a' : p.winRate >= 30 ? '#f59e0b' : '#dc2626' }} />
                            </div>
                            <span className="text-xs font-semibold" style={{ color: p.winRate >= 60 ? '#16a34a' : p.winRate >= 30 ? '#f59e0b' : '#dc2626' }}>{p.winRate}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text)' }}>{p.avgProfit != null ? `$${fmt(p.avgProfit)}` : '—'}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{p.avgMarkup}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── MARGIN ANALYSIS ── */}
          {tab === 'margin' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <div><span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Markup % vs Outcome</span><p className="text-xs" style={{ color: 'var(--text-faint)' }}>Each dot is a bid — find your winning markup sweet spot</p></div>
                <ResponsiveContainer width="100%" height={280}>
                  <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid stroke="var(--border)" />
                    <XAxis type="number" dataKey="markup" name="Markup" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} label={{ value: 'Markup %', position: 'insideBottom', offset: -4, fontSize: 11, fill: 'var(--text-faint)' }} />
                    <YAxis type="number" dataKey="won" name="Outcome" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} ticks={[0, 1]} tickFormatter={v => v === 1 ? 'Won' : 'Lost'} width={36} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={(v: any, name: string) => [name === 'Markup' ? `${v}%` : v === 1 ? 'Won' : 'Lost', name]} />
                    <Scatter data={marginData}>
                      {marginData.map((d, i) => <Cell key={i} fill={d.status === 'WON' ? '#16a34a' : '#dc2626'} fillOpacity={0.7} />)}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
                <div className="flex gap-4">{[['Won','#16a34a'],['Lost','#dc2626']].map(([l,c])=><div key={l} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: c }}/><span className="text-xs" style={{ color: 'var(--text-faint)' }}>{l}</span></div>)}</div>
              </div>
              <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Win Rate by Markup Range</span>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={(() => {
                    const ranges: Record<string, { won: number; total: number }> = { '0–15%': {won:0,total:0}, '16–18%': {won:0,total:0}, '19–20%': {won:0,total:0}, '21–25%': {won:0,total:0}, '26–30%': {won:0,total:0} }
                    for (const d of marginData) {
                      const key = d.markup <= 15 ? '0–15%' : d.markup <= 18 ? '16–18%' : d.markup <= 20 ? '19–20%' : d.markup <= 25 ? '21–25%' : '26–30%'
                      ranges[key].total++
                      if (d.won) ranges[key].won++
                    }
                    return Object.entries(ranges).filter(([,v]) => v.total > 0).map(([range, v]) => ({ range, rate: Math.round((v.won/v.total)*100) }))
                  })()} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="range" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} width={32} tickFormatter={v => `${v}%`} domain={[0,100]} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`${v}%`, 'Win Rate']} />
                    <Bar dataKey="rate" radius={[4,4,0,0]} barSize={28}>{[0,1,2,3,4].map(i=><Cell key={i} fill="#2563eb" fillOpacity={0.6+i*0.1}/>)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── P&L ── */}
          {tab === 'pnl' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Revenue', value: fmtK(won.reduce((s,b) => s + b.unitSell * b.quantity, 0)), color: '#2563eb' },
                  { label: 'Total Cost',    value: fmtK(won.reduce((s,b) => s + b.unitCost * b.quantity, 0)), color: '#f59e0b' },
                  { label: 'Total Profit',  value: fmtK(totalProfit), color: '#16a34a' },
                ].map(k => (
                  <div key={k.label} className="rounded-xl border p-4 flex flex-col gap-1" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                    <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>{k.label}</span>
                    <span className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Monthly Revenue / Cost / Profit</span>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={pnlData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="30%">
                    <CartesianGrid vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} width={44} tickFormatter={v => fmtK(v)} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [fmtK(Number(v))]} />
                    <Bar dataKey="revenue" fill="#2563eb" radius={[4,4,0,0]} barSize={18} />
                    <Bar dataKey="cost" fill="#f59e0b" radius={[4,4,0,0]} barSize={18} />
                    <Bar dataKey="profit" fill="#16a34a" radius={[4,4,0,0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex gap-4">{[['Revenue','#2563eb'],['Cost','#f59e0b'],['Profit','#16a34a']].map(([l,c])=><div key={l} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: c }}/><span className="text-xs" style={{ color: 'var(--text-faint)' }}>{l}</span></div>)}</div>
              </div>
            </div>
          )}

          {/* ── TIMELINE ── */}
          {tab === 'timeline' && (
            <div className="flex flex-col gap-0 relative">
              <div className="absolute left-[19px] top-0 bottom-0 w-px" style={{ background: 'var(--border)' }} />
              {timelineData.map((bid, i) => (
                <div key={bid.id} className="flex gap-4 pb-5 relative">
                  <div className="w-10 flex-shrink-0 flex items-start justify-center pt-1">
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center z-10" style={{ background: 'var(--bg)', borderColor: bid.status === 'WON' ? '#16a34a' : bid.status === 'WAITING' ? '#c2410c' : '#dc2626' }}>
                      <div className="w-2 h-2 rounded-full" style={{ background: bid.status === 'WON' ? '#16a34a' : bid.status === 'WAITING' ? '#c2410c' : '#dc2626' }} />
                    </div>
                  </div>
                  <div className="flex-1 rounded-xl border p-3 flex items-start justify-between gap-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-mono font-semibold text-sm" style={{ color: 'var(--text)' }}>{bid.partNumber}</span>
                      {bid.description && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{bid.description}</span>}
                      <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{bid.supplierName}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: bid.status === 'WON' ? 'var(--highlight-green)' : bid.status === 'WAITING' ? '#fff7ed' : '#fef2f2', color: bid.status === 'WON' ? '#16a34a' : bid.status === 'WAITING' ? '#c2410c' : '#dc2626' }}>
                        {bid.status}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{new Date(bid.bidDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── LEADERBOARD ── */}
          {tab === 'leaderboard' && (
            <div className="flex flex-col gap-3">
              {leaderboardData.map((bid, i) => (
                <div key={bid.id} className="rounded-xl border p-4 flex items-center gap-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                  <span className="text-2xl font-bold w-8 text-center flex-shrink-0" style={{ color: i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : i === 2 ? '#c2410c' : 'var(--text-faint)' }}>
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
        </>
      )}
    </div>
  )
}
