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
        background: disabled || loading ? 'var(--bg-surface)' : 'var(--btn-primary-bg)',
        color: disabled || loading ? 'var(--text-faint)' : 'var(--btn-primary-text)',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        border: '1px solid var(--border)',
      }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-3">
          <span className="inline-block w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--text-faint)', borderTopColor: 'transparent' }} />
          Analyzing & saving...
        </span>
      ) : (
        'Analyze Quotes'
      )}
    </button>
  )
}
