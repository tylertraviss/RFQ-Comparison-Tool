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
      className="w-full py-3 rounded-lg font-semibold text-sm tracking-wide transition-all"
      style={{
        background: disabled || loading ? '#e2e8f0' : '#0f172a',
        color: disabled || loading ? '#94a3b8' : '#ffffff',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
      }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-3">
          <span className="inline-block w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          Extracting line items...
        </span>
      ) : (
        'Analyze Quotes'
      )}
    </button>
  )
}
