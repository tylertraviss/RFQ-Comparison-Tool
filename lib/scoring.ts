import type { SupplierResult } from '@/types/quote'

export interface SupplierScore {
  supplier: string
  score: number
  avgPrice: number | null
  avgLeadTime: number | null
}

export function computeBestValueScores(quotes: SupplierResult[]): SupplierScore[] {
  const results: SupplierScore[] = quotes.map((q) => {
    const prices = q.line_items
      .map((li) => li.unit_price)
      .filter((p): p is number => p !== null)
    const leads = q.line_items
      .map((li) => li.lead_time_days)
      .filter((l): l is number => l !== null)

    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : null
    const avgLeadTime = leads.length > 0 ? leads.reduce((a, b) => a + b, 0) / leads.length : null

    return { supplier: q.supplier, score: 0, avgPrice, avgLeadTime }
  })

  const prices = results.map((r) => r.avgPrice).filter((p): p is number => p !== null)
  const leads = results.map((r) => r.avgLeadTime).filter((l): l is number => l !== null)

  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const minLead = Math.min(...leads)
  const maxLead = Math.max(...leads)

  return results.map((r) => {
    let priceScore = 50
    let leadScore = 50

    if (r.avgPrice !== null && maxPrice !== minPrice) {
      priceScore = ((maxPrice - r.avgPrice) / (maxPrice - minPrice)) * 100
    } else if (r.avgPrice !== null) {
      priceScore = 100
    }

    if (r.avgLeadTime !== null && maxLead !== minLead) {
      leadScore = ((maxLead - r.avgLeadTime) / (maxLead - minLead)) * 100
    } else if (r.avgLeadTime !== null) {
      leadScore = 100
    }

    const score = Math.round(priceScore * 0.6 + leadScore * 0.4)
    return { ...r, score }
  })
}
