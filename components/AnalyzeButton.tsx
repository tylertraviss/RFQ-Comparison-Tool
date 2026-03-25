'use client'

interface Props {
  onClick: () => void
  loading: boolean
  disabled: boolean
}

export default function AnalyzeButton({ onClick, loading, disabled }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full py-4 rounded-lg font-bold text-base tracking-widest uppercase transition-all"
      style={{
        background: disabled || loading ? '#1e293b' : '#2563eb',
        color: disabled || loading ? '#64748b' : '#ffffff',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
      }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-3">
          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Extracting line items...
        </span>
      ) : (
        '⚡ ANALYZE QUOTES'
      )}
    </button>
  )
}
