'use client'

interface Props {
  index: number
  supplierName: string
  rawText: string
  onSupplierChange: (value: string) => void
  onTextChange: (value: string) => void
}

const LABELS = ['SUPPLIER A', 'SUPPLIER B', 'SUPPLIER C']
const PLACEHOLDERS = [
  'Supplier name (e.g. Acme Defense)',
  'Supplier name (e.g. Patriot Parts)',
  'Supplier name (e.g. Eagle Supply Co.)',
]

export default function QuoteInputPanel({ index, supplierName, rawText, onSupplierChange, onTextChange }: Props) {
  return (
    <div
      className="flex flex-col gap-3 rounded-xl p-4 border"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      <div className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-faint)' }}>
        {LABELS[index]}
      </div>

      <input
        type="text"
        value={supplierName}
        onChange={(e) => onSupplierChange(e.target.value)}
        placeholder={PLACEHOLDERS[index]}
        className="w-full rounded-lg px-3 py-2 text-sm border outline-none transition-colors"
        style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
      />

      <div className="relative flex-1">
        <textarea
          value={rawText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Paste raw quote — email, PDF text, or table..."
          rows={12}
          className="w-full rounded-lg px-3 py-2 text-sm font-mono border outline-none transition-colors resize-none"
          style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
        />
        <span className="absolute bottom-2 right-3 text-xs" style={{ color: 'var(--text-faint)' }}>
          {rawText.length.toLocaleString()} chars
        </span>
      </div>
    </div>
  )
}
