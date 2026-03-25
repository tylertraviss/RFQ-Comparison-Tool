'use client'

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
        partMap.set(item.part_number, {
          part_number: item.part_number,
          description: item.description,
          suppliers: {},
        })
      }
      partMap.get(item.part_number)!.suppliers[supplier] = item
    }
  }

  return Array.from(partMap.values())
}

function fmt(val: number | null | undefined, prefix = '') {
  if (val == null) return <span style={{ color: '#64748b' }}>—</span>
  return `${prefix}${val.toLocaleString()}`
}

export default function ComparisonTable({ results, onSave, onCSV, saving, saved }: Props) {
  const suppliers = results.map((r) => r.supplier)
  const rows = buildRows(results)
  const scores = computeBestValueScores(results)

  // Per-row: find min price index and min lead time index
  function minPriceSupplier(row: ComparisonRow): string | null {
    let min = Infinity
    let winner = null
    for (const s of suppliers) {
      const p = row.suppliers[s]?.unit_price
      if (p != null && p < min) { min = p; winner = s }
    }
    return winner
  }

  // Lead time: use per-supplier average since it's a session-level metric
  const minLeadScore = scores.reduce<string | null>((best, s) => {
    if (s.avgLeadTime == null) return best
    if (best === null) return s.supplier
    const bestAvg = scores.find(x => x.supplier === best)?.avgLeadTime ?? Infinity
    return s.avgLeadTime < bestAvg ? s.supplier : best
  }, null)

  const maxScore = Math.max(...scores.map((s) => s.score))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: '#64748b' }}
        >
          Comparison Results
        </span>
        <div className="flex gap-2">
          <button
            onClick={onSave}
            disabled={saving || saved}
            className="px-4 py-2 rounded text-sm font-semibold border transition-colors"
            style={{
              background: saved ? '#16a34a22' : '#111827',
              borderColor: saved ? '#16a34a' : '#1e293b',
              color: saved ? '#16a34a' : '#f1f5f9',
            }}
          >
            {saved ? 'Session saved ✓' : saving ? 'Saving...' : '💾 Save'}
          </button>
          <button
            onClick={onCSV}
            className="px-4 py-2 rounded text-sm font-semibold border transition-colors"
            style={{ background: '#111827', borderColor: '#1e293b', color: '#f1f5f9' }}
          >
            CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border" style={{ borderColor: '#1e293b' }}>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ background: '#0a0e1a' }}>
              <th
                className="sticky left-0 px-4 py-3 text-left font-semibold tracking-widest uppercase text-xs"
                style={{ background: '#0a0e1a', color: '#64748b', borderRight: '1px solid #1e293b' }}
              >
                Part #
              </th>
              <th
                className="px-4 py-3 text-left font-semibold tracking-widest uppercase text-xs"
                style={{ color: '#64748b' }}
              >
                Description
              </th>
              {suppliers.map((s) => (
                <th
                  key={s}
                  className="px-4 py-3 text-right font-semibold tracking-widest uppercase text-xs"
                  style={{ color: '#64748b' }}
                >
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const winner = minPriceSupplier(row)
              return (
                <tr
                  key={row.part_number}
                  style={{ borderTop: '1px solid #1e293b', background: i % 2 === 0 ? '#111827' : '#0f172a' }}
                >
                  <td
                    className="sticky left-0 px-4 py-3 font-mono text-xs font-semibold"
                    style={{
                      background: i % 2 === 0 ? '#111827' : '#0f172a',
                      color: '#f1f5f9',
                      borderRight: '1px solid #1e293b',
                    }}
                  >
                    {row.part_number}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#94a3b8' }}>
                    {row.description ?? <span style={{ color: '#64748b' }}>—</span>}
                  </td>
                  {suppliers.map((s) => {
                    const item = row.suppliers[s]
                    const isLowest = s === winner && item?.unit_price != null
                    return (
                      <td
                        key={s}
                        className="px-4 py-3 text-right font-mono"
                        style={{
                          background: isLowest ? '#16a34a' : 'transparent',
                          color: isLowest ? '#ffffff' : '#f1f5f9',
                          fontWeight: isLowest ? 700 : 400,
                        }}
                      >
                        {item?.unit_price != null
                          ? `$${item.unit_price.toFixed(2)}`
                          : <span style={{ color: '#64748b' }}>—</span>}
                      </td>
                    )
                  })}
                </tr>
              )
            })}

            {/* Lead time row */}
            <tr style={{ borderTop: '2px solid #1e293b', background: '#0a0e1a' }}>
              <td
                className="sticky left-0 px-4 py-3 text-xs font-semibold uppercase tracking-widest"
                style={{ background: '#0a0e1a', color: '#64748b', borderRight: '1px solid #1e293b' }}
              >
                Lead Time
              </td>
              <td style={{ color: '#64748b' }} className="px-4 py-3 text-xs">Avg across items</td>
              {scores.map((s) => {
                const isFastest = s.supplier === minLeadScore && s.avgLeadTime != null
                return (
                  <td
                    key={s.supplier}
                    className="px-4 py-3 text-right font-mono text-sm"
                    style={{
                      background: isFastest ? '#0284c7' : 'transparent',
                      color: isFastest ? '#ffffff' : '#f1f5f9',
                      fontWeight: isFastest ? 700 : 400,
                    }}
                  >
                    {s.avgLeadTime != null
                      ? `${Math.round(s.avgLeadTime)} days`
                      : <span style={{ color: '#64748b' }}>—</span>}
                  </td>
                )
              })}
            </tr>

            {/* Best value score row */}
            <tr style={{ borderTop: '1px solid #1e293b', background: '#0a0e1a' }}>
              <td
                className="sticky left-0 px-4 py-3 text-xs font-semibold uppercase tracking-widest"
                style={{ background: '#0a0e1a', color: '#64748b', borderRight: '1px solid #1e293b' }}
              >
                Best Value
              </td>
              <td style={{ color: '#64748b' }} className="px-4 py-3 text-xs">Weighted score (0–100)</td>
              {scores.map((s) => {
                const isTop = s.score === maxScore
                return (
                  <td
                    key={s.supplier}
                    className="px-4 py-3 text-right font-mono font-bold text-sm"
                    style={{
                      color: isTop ? '#2563eb' : '#f1f5f9',
                    }}
                  >
                    {s.score} pts
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
