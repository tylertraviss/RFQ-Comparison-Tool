'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import QuoteInputPanel from '@/components/QuoteInputPanel'
import AnalyzeButton from '@/components/AnalyzeButton'
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

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Extraction failed')

      // Save session immediately — no manual save step needed
      setSaving(true)
      const saveRes = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sessionName.trim() || 'Untitled RFQ Session',
          quotes: data.results.map((r: SupplierResult, i: number) => ({
            supplier: r.supplier,
            rawText: panels[i]?.rawText ?? '',
            line_items: r.line_items,
          })),
        }),
      })
      if (saveRes.ok) {
        const session = await saveRes.json()
        setSaved(true)
        router.push(`/quotes/${session.id}`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
      setSaving(false)
    }
  }

  // ── Input view ────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <label
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
          RFQ Session Name
        </label>
        <input
          type="text"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          placeholder="e.g. F-35 Bearing Order — Q2 2026"
          className="w-full rounded-lg px-4 py-3 text-sm border outline-none transition-colors"
          style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
        />
      </div>

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

      <AnalyzeButton onClick={handleAnalyze} loading={loading || saving} disabled={!canAnalyze} />

      {error && (
        <div
          className="rounded-lg px-4 py-3 text-sm border"
          style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#dc2626' }}
        >
          {error}
        </div>
      )}
    </div>
  )
}
