'use client'

import ComparisonTable from '@/components/ComparisonTable'
import type { SupplierResult } from '@/types/quote'

interface Props {
  results: SupplierResult[]
  sessionName: string
}

export default function ComparisonTableServer({ results, sessionName }: Props) {
  function handleCSV() {
    const suppliers = results.map((r) => r.supplier)
    const allParts = new Set(results.flatMap((r) => r.line_items.map((li) => li.part_number)))

    const header = ['Part #', 'Description', ...suppliers].join(',')
    const rows = Array.from(allParts).map((part) => {
      const desc = results
        .flatMap((r) => r.line_items)
        .find((li) => li.part_number === part)?.description ?? ''
      const prices = suppliers.map((s) => {
        const item = results
          .find((r) => r.supplier === s)
          ?.line_items.find((li) => li.part_number === part)
        return item?.unit_price != null ? `$${item.unit_price}` : ''
      })
      return [part, desc, ...prices].map((v) => `"${v}"`).join(',')
    })

    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${sessionName}-comparison.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <ComparisonTable
      results={results}
      onSave={() => {}}
      onCSV={handleCSV}
      saving={false}
      saved={true}
    />
  )
}
