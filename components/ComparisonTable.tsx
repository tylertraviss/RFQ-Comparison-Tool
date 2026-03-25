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

export default function ComparisonTable({ results, onSave, onCSV, saving, saved }: Props) {
  const suppliers = results.map((r) => r.supplier)
  const rows = buildRows(results)
  const scores = computeBestValueScores(results)

  function minPriceSupplier(row: ComparisonRow): string | null {
    let min = Infinity
    let winner = null
    for (const s of suppliers) {
      const p = row.suppliers[s]?.unit_price
      if (p != null && p < min) { min = p; winner = s }
    }
    return winner
  }

  const minLeadScore = scores.reduce<string | null>((best, s) => {
    if (s.avgLeadTime == null) return best
    if (best === null) return s.supplier
    const bestAvg = scores.find(x => x.supplier === best)?.avgLeadTime ?? Infinity
    return s.avgLeadTime < bestAvg ? s.supplier : best
  }, null)

  const maxScore = Math.max(...scores.map((s) => s.score))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-base" style={{ color: '#0f172a' }}>
          Comparison Results
        </h2>
        <div className="flex gap-2">
          <button
            onClick={onSave}
            disabled={saving || saved}
            className="px-4 py-2 rounded-lg text-sm font-semibold border transition-colors"
            style={{
              background: saved ? '#f0fdf4' : '#ffffff',
              borderColor: saved ? '#86efac' : '#e2e8f0',
              color: saved ? '#16a34a' : '#0f172a',
            }}
          >
            {saved ? 'Saved ✓' : saving ? 'Saving...' : 'Save Session'}
          </button>
          <button
            onClick={onCSV}
            className="px-4 py-2 rounded-lg text-sm font-semibold border transition-colors"
            style={{ background: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: '#e2e8f0' }}>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th
                className="sticky left-0 px-4 py-3 text-left font-semibold text-xs tracking-widest uppercase"
                style={{ background: '#f8fafc', color: '#64748b', borderRight: '1px solid #e2e8f0' }}
              >
                Part #
              </th>
              <th
                className="px-4 py-3 text-left font-semibold text-xs tracking-widest uppercase"
                style={{ color: '#64748b' }}
              >
                Description
              </th>
              {suppliers.map((s) => (
                <th
                  key={s}
                  className="px-4 py-3 text-right font-semibold text-xs tracking-widest uppercase"
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
                  style={{
                    borderTop: '1px solid #e2e8f0',
                    background: i % 2 === 0 ? '#ffffff' : '#f8fafc',
                  }}
                >
                  <td
                    className="sticky left-0 px-4 py-3 font-mono text-xs font-semibold"
                    style={{
                      background: i % 2 === 0 ? '#ffffff' : '#f8fafc',
                      color: '#0f172a',
                      borderRight: '1px solid #e2e8f0',
                    }}
                  >
                    {row.part_number}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#475569' }}>
                    {row.description ?? <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  {suppliers.map((s) => {
                    const item = row.suppliers[s]
                    const isLowest = s === winner && item?.unit_price != null
                    return (
                      <td
                        key={s}
                        className="px-4 py-3 text-right font-mono"
                        style={{
                          background: isLowest ? '#f0fdf4' : 'transparent',
                          color: isLowest ? '#16a34a' : '#0f172a',
                          fontWeight: isLowest ? 700 : 400,
                        }}
                      >
                        {item?.unit_price != null
                          ? `$${item.unit_price.toFixed(2)}`
                          : <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                    )
                  })}
                </tr>
              )
            })}

            {/* Lead time row */}
            <tr style={{ borderTop: '2px solid #e2e8f0', background: '#f8fafc' }}>
              <td
                className="sticky left-0 px-4 py-3 text-xs font-semibold uppercase tracking-widest"
                style={{ background: '#f8fafc', color: '#64748b', borderRight: '1px solid #e2e8f0' }}
              >
                Lead Time
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: '#94a3b8' }}>Avg across items</td>
              {scores.map((s) => {
                const isFastest = s.supplier === minLeadScore && s.avgLeadTime != null
                return (
                  <td
                    key={s.supplier}
                    className="px-4 py-3 text-right font-mono text-sm"
                    style={{
                      background: isFastest ? '#eff6ff' : 'transparent',
                      color: isFastest ? '#2563eb' : '#0f172a',
                      fontWeight: isFastest ? 700 : 400,
                    }}
                  >
                    {s.avgLeadTime != null
                      ? `${Math.round(s.avgLeadTime)} days`
                      : <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                )
              })}
            </tr>

            {/* Best value row */}
            <tr style={{ borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <td
                className="sticky left-0 px-4 py-3 text-xs font-semibold uppercase tracking-widest"
                style={{ background: '#f8fafc', color: '#64748b', borderRight: '1px solid #e2e8f0' }}
              >
                Best Value
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: '#94a3b8' }}>Weighted score (0–100)</td>
              {scores.map((s) => {
                const isTop = s.score === maxScore
                return (
                  <td
                    key={s.supplier}
                    className="px-4 py-3 text-right font-mono font-bold text-sm"
                    style={{ color: isTop ? '#0f172a' : '#64748b' }}
                  >
                    <span
                      className="px-2 py-1 rounded-md text-xs"
                      style={{
                        background: isTop ? '#0f172a' : '#f1f5f9',
                        color: isTop ? '#ffffff' : '#64748b',
                      }}
                    >
                      {s.score} pts
                    </span>
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
