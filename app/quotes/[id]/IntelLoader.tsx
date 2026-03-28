'use client'

import { useEffect, useState } from 'react'
import NegotiationSummary from '@/components/NegotiationSummary'
import type { Intel } from '@/components/NegotiationSummary'
import type { SupplierResult } from '@/types/quote'

export default function IntelLoader({ results }: { results: SupplierResult[] }) {
  const [intel, setIntel] = useState<Intel | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results }),
    })
      .then((r) => r.json())
      .then((d) => setIntel(d))
      .catch(() => setIntel(null))
      .finally(() => setLoading(false))
  }, [])

  return <NegotiationSummary intel={intel} loading={loading} />
}
