'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { SupplierResult, ComparisonRow } from '@/types/quote'
import { computeBestValueScores } from '@/lib/scoring'

interface Props {
  results: SupplierResult[]
  onSave: () => void
  onCSV: () => void
  saving: boolean
  saved: boolean
}

interface BidTarget {
  part: ComparisonRow
  supplier: string
  unitCost: number
  leadTime: number | null
}

function buildRows(results: SupplierResult[]): ComparisonRow[] {
  const partMap = new Map<string, ComparisonRow>()
  for (const { supplier, line_items } of results) {
    for (const item of line_items) {
      if (!partMap.has(item.part_number)) {
        partMap.set(item.part_number, { part_number: item.part_number, description: item.description, suppliers: {} })
      }
      partMap.get(item.part_number)!.suppliers[supplier] = item
    }
  }
  return Array.from(partMap.values())
}

const SUPPLIER_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#8b5cf6']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg border px-4 py-3 text-sm flex flex-col gap-1"
      style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
    >
      <p className="font-semibold font-mono text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.fill }} />
          <span style={{ color: 'var(--text-muted)' }}>{entry.name}:</span>
          <span className="font-semibold">${entry.value?.toFixed(2)}</span>
        </p>
      ))}
    </div>
  )
}

function BidModal({ target, onClose }: { target: BidTarget; onClose: () => void }) {
  const [markup, setMarkup] = useState(18)
  const [leadTime, setLeadTime] = useState(String(target.leadTime ?? ''))
  const [qty, setQty] = useState('1')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    setSubmitting(true)
    await fetch('/api/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partNumber: target.part.part_number,
        description: target.part.description ?? null,
        supplierName: target.supplier,
        unitCost: target.unitCost,
        unitSell: unitSell,
        unitProfit: unitProfit,
        quantity: qtyNum,
        leadTimeDays: parseInt(leadTime) || null,
        markup,
        status: 'WAITING',
      }),
    })
    setSubmitting(false)
    setSubmitted(true)
  }

  const unitCost = target.unitCost
  const unitSell = unitCost * (1 + markup / 100)
  const unitProfit = unitSell - unitCost
  const qtyNum = Math.max(1, parseInt(qty) || 1)
  const totalCost = unitCost * qtyNum
  const totalSell = unitSell * qtyNum
  const totalProfit = unitProfit * qtyNum

  // Scale green from muted (low markup) to vivid (high markup)
  const greenIntensity = Math.round(100 + (markup / 30) * 155) // 100–255
  const profitColor = `rgb(0, ${greenIntensity}, ${Math.round(greenIntensity * 0.3)})`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border flex flex-col gap-0 overflow-hidden"
        style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-bold text-base" style={{ color: 'var(--text)' }}>Set your markup percentage</h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Industry standard is 15–20% · {target.supplier} · {target.part.description ?? target.part.part_number}
              </p>
            </div>
            <button onClick={onClose} className="text-xl leading-none" style={{ color: 'var(--text-faint)' }}>×</button>
          </div>
        </div>

        {/* Markup + Profit */}
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          {/* Slider card */}
          <div
            className="rounded-xl p-5 flex flex-col items-center gap-4"
            style={{ background: 'var(--highlight-blue)' }}
          >
            <span className="text-4xl font-bold" style={{ color: 'var(--highlight-blue-text)' }}>
              {markup}%
            </span>
            <input
              type="range"
              min={0}
              max={30}
              value={markup}
              onChange={(e) => setMarkup(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="w-full flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>0%</span><span>30%</span>
            </div>
          </div>

          {/* Profit preview card */}
          <div
            className="rounded-xl p-5 flex flex-col gap-3 border"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <p className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
              <span>↗</span> Profit Preview
            </p>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Cost:</span>
                <div className="flex flex-col items-end">
                  <span style={{ color: 'var(--text)' }}>${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span className="text-xs" style={{ color: 'var(--text-faint)' }}>${unitCost.toFixed(2)}/unit</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Sale:</span>
                <div className="flex flex-col items-end">
                  <span style={{ color: 'var(--text)' }}>${totalSell.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span className="text-xs" style={{ color: 'var(--text-faint)' }}>${unitSell.toFixed(2)}/unit</span>
                </div>
              </div>
              <div className="flex justify-between font-bold border-t pt-2" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--text)' }}>Profit:</span>
                <div className="flex flex-col items-end">
                  <span style={{ color: profitColor }}>${totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span className="text-xs" style={{ color: 'var(--text-faint)' }}>${unitProfit.toFixed(2)}/unit</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lead time + Quantity */}
        <div className="px-6 pb-5 border-t pt-5 grid grid-cols-2 gap-4" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--text)' }}>Confirm lead time</h3>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              {target.leadTime ? `Supplier quoted ${target.leadTime} days` : 'No lead time in quote'}
            </p>
            <div className="rounded-xl p-4 flex items-center justify-center gap-3" style={{ background: 'var(--highlight-blue)' }}>
              <input
                type="number"
                min={1}
                value={leadTime}
                onChange={(e) => setLeadTime(e.target.value)}
                className="w-20 rounded-lg px-3 py-2 text-xl font-bold text-center border outline-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--highlight-blue-text)', color: 'var(--text)' }}
              />
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>days</span>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--text)' }}>Quantity</h3>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Units you intend to buy</p>
            <div className="rounded-xl p-4 flex items-center justify-center gap-3" style={{ background: 'var(--highlight-blue)' }}>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-20 rounded-lg px-3 py-2 text-xl font-bold text-center border outline-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--highlight-blue-text)', color: 'var(--text)' }}
              />
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>EA</span>
            </div>
          </div>
        </div>

        {/* Bid summary */}
        <div className="px-6 pb-6">
          <div
            className="rounded-xl p-5 flex flex-col gap-4"
            style={{ background: 'var(--highlight-blue)' }}
          >
            <p className="text-sm font-bold text-center flex items-center justify-center gap-1.5" style={{ color: 'var(--highlight-blue-text)' }}>
              <span>↗</span> Bid Summary for DLA
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'BUY FOR', value: `$${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: `$${unitCost.toFixed(2)}/unit`, color: 'var(--text)' },
                { label: 'SELL FOR', value: `$${totalSell.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: `$${unitSell.toFixed(2)}/unit`, color: 'var(--text)' },
                { label: 'YOU MAKE', value: `$${totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: `${markup}% margin`, color: profitColor },
              ].map(({ label, value, sub, color }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--highlight-blue-text)' }}>{label}</span>
                  <span className="text-lg font-bold" style={{ color }}>{value}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              Based on {target.supplier} quote{leadTime ? ` · ${leadTime} day delivery` : ''}
            </p>
            <button
              onClick={handleSubmit}
              disabled={submitting || submitted}
              className="w-full rounded-xl py-3 font-bold text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: submitted ? '#16a34a' : 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
            >
              {submitted ? '✓ Bid submitted — tracking in Contracts' : submitting ? 'Submitting...' : 'Submit Bid to DLA →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ComparisonTable({ results, onSave, onCSV, saving, saved }: Props) {
  const suppliers = results.map((r) => r.supplier)
  const rows = buildRows(results)
  const scores = computeBestValueScores(results)
  const [bidTarget, setBidTarget] = useState<BidTarget | null>(null)
  const [sortBy, setSortBy] = useState<'price' | 'alpha' | 'spread'>('price')

  function lowestSupplier(row: ComparisonRow): string | null {
    let min = Infinity, winner = null
    for (const s of suppliers) {
      const p = row.suppliers[s]?.unit_price
      if (p != null && p < min) { min = p; winner = s }
    }
    return winner
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Section header */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-faint)' }}>
          Comparison Results
        </span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        <div className="flex items-center gap-1">
          {([['price', 'Price'], ['alpha', 'A–Z'], ['spread', 'Spread']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className="text-xs px-2.5 py-1 rounded-md font-semibold transition-colors"
              style={{
                background: sortBy === key ? 'var(--highlight-blue)' : 'transparent',
                color: sortBy === key ? 'var(--highlight-blue-text)' : 'var(--text-faint)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* One mini chart per part */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...rows].sort((a, b) => {
          const avgPrice = (row: ComparisonRow) => {
            const prices = suppliers.map(s => row.suppliers[s]?.unit_price).filter((p): p is number => p != null)
            return prices.length ? prices.reduce((s, p) => s + p, 0) / prices.length : 0
          }
          const spread = (row: ComparisonRow) => {
            const prices = suppliers.map(s => row.suppliers[s]?.unit_price).filter((p): p is number => p != null)
            return prices.length > 1 ? Math.max(...prices) - Math.min(...prices) : 0
          }
          if (sortBy === 'price') return avgPrice(b) - avgPrice(a)
          if (sortBy === 'alpha') return (a.description ?? a.part_number).localeCompare(b.description ?? b.part_number)
          return spread(b) - spread(a)
        }).map((row) => {
          const lowest = lowestSupplier(row)
          const chartData = suppliers
            .filter((s) => row.suppliers[s]?.unit_price != null)
            .map((s, i) => ({
              supplier: s,
              price: row.suppliers[s]!.unit_price,
              fill: lowest === s ? '#16a34a' : SUPPLIER_COLORS[i % SUPPLIER_COLORS.length],
            }))

          return (
            <div
              key={row.part_number}
              className="rounded-xl border p-4 flex flex-col gap-2"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }} title={row.description ?? row.part_number}>
                {row.description ?? row.part_number}
              </p>
              <p className="text-xs font-mono" style={{ color: 'var(--text-faint)' }}>{row.part_number}</p>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={chartData} barCategoryGap="30%" margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="supplier"
                    tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `$${v}`}
                    tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--border)', opacity: 0.4 }} />
                  <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Bid buttons per supplier */}
              <div className="flex flex-col gap-1 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                {chartData.map((entry) => (
                  <button
                    key={entry.supplier}
                    onClick={() => setBidTarget({
                      part: row,
                      supplier: entry.supplier,
                      unitCost: entry.price as number,
                      leadTime: row.suppliers[entry.supplier]?.lead_time_days ?? null,
                    })}
                    className="w-full rounded-lg py-1.5 px-3 text-xs font-semibold flex items-center gap-1.5 transition-all group border"
                    style={{ color: 'var(--text-muted)', borderColor: 'var(--border)', background: 'transparent' }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'var(--highlight-blue)'
                      ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--highlight-blue-text)'
                      ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--highlight-blue-text)'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                      ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
                      ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: entry.fill }} />
                    <span>{entry.supplier}</span>
                    <span className="ml-auto border rounded px-1.5 py-0.5 transition-all group-hover:font-semibold" style={{ borderColor: 'inherit' }}>Bid →</span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {bidTarget && <BidModal target={bidTarget} onClose={() => setBidTarget(null)} />}

      {/* Save / Export row */}
      {!saved && (
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onCSV}
            className="px-4 py-2 rounded-lg text-sm font-semibold border transition-opacity hover:opacity-70"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            Export CSV
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
          >
            {saving ? 'Saving...' : 'Save Session →'}
          </button>
        </div>
      )}

      {saved && (
        <p className="text-sm font-semibold" style={{ color: '#16a34a' }}>✓ Session saved</p>
      )}
    </div>
  )
}
