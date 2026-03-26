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
        partMap.set(item.part_number, { part_number: item.part_number, description: item.description, suppliers: {} })
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
    let min = Infinity, winner = null
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
      <h2 className="font-semibold text-base" style={{ color: 'var(--text)' }}>
        Comparison Results
      </h2>

      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
              <th
                className="sticky left-0 px-4 py-3 text-left text-xs font-semibold tracking-widest uppercase"
                style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', borderRight: '1px solid var(--border)' }}
              >
                Part #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                Description
              </th>
              {suppliers.map((s) => (
                <th key={s} className="px-4 py-3 text-right text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const winner = minPriceSupplier(row)
              const rowBg = i % 2 === 0 ? 'var(--bg)' : 'var(--row-alt)'
              return (
                <tr key={row.part_number} style={{ borderTop: '1px solid var(--border)', background: rowBg }}>
                  <td
                    className="sticky left-0 px-4 py-3 font-mono text-xs font-semibold"
                    style={{ background: rowBg, color: 'var(--text)', borderRight: '1px solid var(--border)' }}
                  >
                    {row.part_number}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                    {row.description ?? <span style={{ color: 'var(--text-faint)' }}>—</span>}
                  </td>
                  {suppliers.map((s) => {
                    const item = row.suppliers[s]
                    const isLowest = s === winner && item?.unit_price != null
                    return (
                      <td
                        key={s}
                        className="px-4 py-3 text-right font-mono"
                        style={{
                          background: isLowest ? 'var(--highlight-green)' : 'transparent',
                          color: isLowest ? 'var(--highlight-green-text)' : 'var(--text)',
                          fontWeight: isLowest ? 700 : 400,
                        }}
                      >
                        {item?.unit_price != null ? `$${item.unit_price.toFixed(2)}` : <span style={{ color: 'var(--text-faint)' }}>—</span>}
                      </td>
                    )
                  })}
                </tr>
              )
            })}

            <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--bg-surface)' }}>
              <td className="sticky left-0 px-4 py-3 text-xs font-semibold uppercase tracking-widest" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', borderRight: '1px solid var(--border)' }}>
                Lead Time
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-faint)' }}>Avg across items</td>
              {scores.map((s) => {
                const isFastest = s.supplier === minLeadScore && s.avgLeadTime != null
                return (
                  <td key={s.supplier} className="px-4 py-3 text-right font-mono text-sm" style={{ background: isFastest ? 'var(--highlight-blue)' : 'transparent', color: isFastest ? 'var(--highlight-blue-text)' : 'var(--text)', fontWeight: isFastest ? 700 : 400 }}>
                    {s.avgLeadTime != null ? `${Math.round(s.avgLeadTime)} days` : <span style={{ color: 'var(--text-faint)' }}>—</span>}
                  </td>
                )
              })}
            </tr>

            <tr style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
              <td className="sticky left-0 px-4 py-3 text-xs font-semibold uppercase tracking-widest" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', borderRight: '1px solid var(--border)' }}>
                Best Value
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-faint)' }}>Weighted score (0–100)</td>
              {scores.map((s) => {
                const isTop = s.score === maxScore
                return (
                  <td key={s.supplier} className="px-4 py-3 text-right font-mono font-bold text-sm" style={{ color: isTop ? 'var(--text)' : 'var(--text-muted)' }}>
                    <span className="px-2 py-1 rounded-md text-xs" style={{ background: isTop ? 'var(--btn-primary-bg)' : 'var(--bg-surface)', color: isTop ? 'var(--btn-primary-text)' : 'var(--text-muted)' }}>
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
