'use client'

import { useEffect, useState } from 'react'

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

export default function ContractsPage() {
  const [bids, setBids] = useState<Bid[]>([])
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-faint)' }}>
          Contracts
        </span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      {loading ? (
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
      )}
    </div>
  )
}
