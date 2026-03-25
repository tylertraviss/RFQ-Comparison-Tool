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

export default function QuoteInputPanel({
  index,
  supplierName,
  rawText,
  onSupplierChange,
  onTextChange,
}: Props) {
  return (
    <div
      className="flex flex-col gap-3 rounded-xl p-4 border"
      style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}
    >
      <div
        className="text-xs font-semibold tracking-widest uppercase"
        style={{ color: '#94a3b8' }}
      >
        {LABELS[index]}
      </div>

      <input
        type="text"
        value={supplierName}
        onChange={(e) => onSupplierChange(e.target.value)}
        placeholder={PLACEHOLDERS[index]}
        className="w-full rounded-lg px-3 py-2 text-sm border outline-none focus:border-slate-400 transition-colors"
        style={{
          background: '#ffffff',
          borderColor: '#e2e8f0',
          color: '#0f172a',
        }}
      />

      <div className="relative flex-1">
        <textarea
          value={rawText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Paste raw quote — email, PDF text, or table..."
          rows={12}
          className="w-full rounded-lg px-3 py-2 text-sm font-mono border outline-none focus:border-slate-400 transition-colors resize-none"
          style={{
            background: '#ffffff',
            borderColor: '#e2e8f0',
            color: '#0f172a',
          }}
        />
        <span
          className="absolute bottom-2 right-3 text-xs"
          style={{ color: '#94a3b8' }}
        >
          {rawText.length.toLocaleString()} chars
        </span>
      </div>
    </div>
  )
}
