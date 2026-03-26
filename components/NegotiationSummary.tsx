'use client'

import BulletDetail from '@/components/BulletDetail'

export interface Intel {
  recommendation: string[]
  vulnerabilities: string[]
  countermeasures: string[]
}

interface Props {
  intel: Intel | null
  loading: boolean
}

const PANELS = [
  {
    key: 'recommendation' as const,
    label: 'RECOMMENDATION',
    sublabel: 'Award decision',
    accent: 'var(--highlight-green-text)',
    accentBg: 'var(--highlight-green)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  {
    key: 'vulnerabilities' as const,
    label: 'VULNERABILITIES',
    sublabel: 'Risk assessment',
    accent: '#f59e0b',
    accentBg: '#fffbeb',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    key: 'countermeasures' as const,
    label: 'COUNTERMEASURES',
    sublabel: 'Negotiation tactics',
    accent: 'var(--highlight-blue-text)',
    accentBg: 'var(--highlight-blue)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
]

function Card({
  label, sublabel, accent, accentBg, icon, bullets,
}: {
  label: string
  sublabel: string
  accent: string
  accentBg: string
  icon: React.ReactNode
  bullets: string[] | null
}) {
  return (
    <div
      className="flex flex-col gap-2 rounded-xl border p-4"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-2">
        <span
          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: accentBg, color: accent }}
        >
          {icon}
        </span>
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: accent }}>
          {label}
        </span>
      </div>

      {bullets === null ? (
        <div className="flex flex-col gap-1.5">
          {[90, 75, 55].map((w) => (
            <div key={w} className="h-2 rounded animate-pulse" style={{ width: `${w}%`, background: 'var(--border)' }} />
          ))}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: accent }} />
              <BulletDetail bullet={b} context={label.toLowerCase()} accent={accent} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function NegotiationSummary({ intel, loading }: Props) {
  if (!loading && !intel) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-faint)' }}>
          Procurement Intelligence Brief
        </span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        {loading && <span className="text-xs" style={{ color: 'var(--text-faint)' }}>Analyzing...</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PANELS.map((panel) => (
          <Card
            key={panel.key}
            label={panel.label}
            sublabel={panel.sublabel}
            accent={panel.accent}
            accentBg={panel.accentBg}
            icon={panel.icon}
            bullets={loading ? null : (intel?.[panel.key] ?? [])}
          />
        ))}
      </div>
    </div>
  )
}
