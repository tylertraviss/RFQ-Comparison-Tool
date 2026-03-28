'use client'

import { useState } from 'react'

interface Props {
  bullet: string
  context: string // e.g. "recommendation", "vulnerabilities", "countermeasures"
  accent: string
}

export default function BulletDetail({ bullet, context, accent }: Props) {
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleOpen() {
    setOpen((o) => {
      if (!o && !detail) fetchDetail()
      return !o
    })
  }

  async function fetchDetail() {
    setLoading(true)
    try {
      const res = await fetch('/api/brief-detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bullet, context }),
      })
      const data = await res.json()
      setDetail(data.detail)
    } catch {
      setDetail('Could not load detail.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <span className="flex flex-col gap-1 w-full">
      <span className="inline-flex items-center gap-1.5">
        <span>{bullet}</span>
        <button
          onClick={handleOpen}
          className="flex-shrink-0 rounded-full transition-opacity hover:opacity-70"
          style={{ color: accent }}
          aria-label="Learn more"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </span>

      {open && (
        <span
          className="ml-5 text-xs rounded-lg px-3 py-2 leading-relaxed block"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accent, borderTopColor: 'transparent' }} />
              Loading...
            </span>
          ) : detail}
        </span>
      )}
    </span>
  )
}
