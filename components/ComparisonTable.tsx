'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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

export default function ComparisonTable({ results }: Props) {
  const suppliers = results.map((r) => r.supplier)
  const rows = buildRows(results)
  const scores = computeBestValueScores(results)

  // Build chart data — one entry per part number, sorted by max price descending
  const chartData = rows.map((row) => {
    const entry: Record<string, any> = {
      part: row.description ?? row.part_number,
      description: row.description,
    }
    suppliers.forEach((s) => {
      entry[s] = row.suppliers[s]?.unit_price ?? null
    })
    return entry
  }).sort((a, b) => {
    const maxA = Math.max(...suppliers.map((s) => a[s] ?? 0))
    const maxB = Math.max(...suppliers.map((s) => b[s] ?? 0))
    return maxB - maxA
  })

  // Find lowest price supplier per part for coloring
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
      <h2 className="font-semibold text-base" style={{ color: 'var(--text)' }}>
        Comparison Results
      </h2>

      {/* Grouped bar chart */}
      <div
        className="rounded-xl border p-6"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--text-faint)' }}>
          Unit Price by Part Number
        </p>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} barCategoryGap="25%" barGap={4}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="part"
              tick={{ fontSize: 11, fontFamily: 'monospace', fill: 'var(--text-muted)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `$${v}`}
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              axisLine={false}
              tickLine={false}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--border)', opacity: 0.4 }} />
            <Legend
              wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)', paddingTop: 16 }}
            />
            {suppliers.map((s, i) => (
              <Bar key={s} dataKey={s} fill={SUPPLIER_COLORS[i % SUPPLIER_COLORS.length]} radius={[4, 4, 0, 0]}>
                {chartData.map((entry, j) => {
                  const row = rows[j]
                  const isLowest = lowestSupplier(row) === s && entry[s] != null
                  return (
                    <Cell
                      key={j}
                      fill={isLowest ? '#16a34a' : SUPPLIER_COLORS[i % SUPPLIER_COLORS.length]}
                    />
                  )
                })}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs mt-2" style={{ color: 'var(--text-faint)' }}>
          Green bar = lowest price for that part
        </p>
      </div>

      {/* Best value scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scores.map((s, i) => {
          const maxScore = Math.max(...scores.map((x) => x.score))
          const isTop = s.score === maxScore
          return (
            <div
              key={s.supplier}
              className="rounded-xl border px-5 py-4 flex items-center justify-between"
              style={{
                background: isTop ? 'var(--highlight-blue)' : 'var(--bg-surface)',
                borderColor: isTop ? 'var(--highlight-blue-text)' : 'var(--border)',
              }}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                  {s.supplier}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Avg ${s.avgPrice?.toFixed(2) ?? '—'} · {s.avgLeadTime ? `${Math.round(s.avgLeadTime)}d` : '—'}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xl font-bold" style={{ color: isTop ? 'var(--highlight-blue-text)' : 'var(--text)' }}>
                  {s.score}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-faint)' }}>best value</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
