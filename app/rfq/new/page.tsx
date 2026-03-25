'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import QuoteInputPanel from '@/components/QuoteInputPanel'
import AnalyzeButton from '@/components/AnalyzeButton'
import ComparisonTable from '@/components/ComparisonTable'
import type { SupplierResult } from '@/types/quote'

interface PanelState {
  supplierName: string
  rawText: string
}

const EMPTY_PANEL: PanelState = { supplierName: '', rawText: '' }

export default function NewRFQPage() {
  const router = useRouter()
  const [sessionName, setSessionName] = useState('')
  const [panels, setPanels] = useState<PanelState[]>([
    { ...EMPTY_PANEL },
    { ...EMPTY_PANEL },
    { ...EMPTY_PANEL },
  ])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SupplierResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const filledPanels = panels.filter((p) => p.rawText.trim().length > 0)
  const canAnalyze = filledPanels.length >= 2

  function updatePanel(i: number, field: keyof PanelState, value: string) {
    setPanels((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: value }
      return next
    })
  }

  async function handleAnalyze() {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const quotes = panels
        .filter((p) => p.rawText.trim())
        .map((p, i) => ({
          supplier: p.supplierName.trim() || `Supplier ${String.fromCharCode(65 + i)}`,
          rawText: p.rawText,
        }))

      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotes }),
      })

      if (!res.ok) throw new Error('Extraction failed')
      const data = await res.json()
      setResults(data.results)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!results) return
    setSaving(true)

    try {
      const quotes = results.map((r, i) => ({
        supplier: r.supplier,
        rawText: panels[i]?.rawText ?? '',
        line_items: r.line_items,
      }))

      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sessionName.trim() || 'Untitled RFQ Session',
          quotes,
        }),
      })

      if (!res.ok) throw new Error('Save failed')
      const session = await res.json()
      setSaved(true)
      setTimeout(() => router.push(`/rfq/${session.id}`), 1000)
    } catch {
      setError('Failed to save session')
    } finally {
      setSaving(false)
    }
  }

  function handleCSV() {
    if (!results) return

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
    a.download = `${sessionName || 'rfq'}-comparison.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Session name */}
      <div className="flex flex-col gap-2">
        <label
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: '#64748b' }}
        >
          RFQ Session Name
        </label>
        <input
          type="text"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          placeholder="e.g. F-35 Bearing Order — Q2 2026"
          className="w-full rounded-lg px-4 py-3 text-sm border outline-none focus:border-blue-500 transition-colors"
          style={{ background: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }}
        />
      </div>

      {/* Quote panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {panels.map((panel, i) => (
          <QuoteInputPanel
            key={i}
            index={i}
            supplierName={panel.supplierName}
            rawText={panel.rawText}
            onSupplierChange={(v) => updatePanel(i, 'supplierName', v)}
            onTextChange={(v) => updatePanel(i, 'rawText', v)}
          />
        ))}
      </div>

      {/* Analyze button */}
      <AnalyzeButton onClick={handleAnalyze} loading={loading} disabled={!canAnalyze} />

      {error && (
        <div
          className="rounded-lg px-4 py-3 text-sm border"
          style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#dc2626' }}
        >
          {error}
        </div>
      )}

      {/* Results */}
      {results && (
        <ComparisonTable
          results={results}
          onSave={handleSave}
          onCSV={handleCSV}
          saving={saving}
          saved={saved}
        />
      )}
    </div>
  )
}
