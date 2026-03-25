export interface LineItem {
  part_number: string
  description: string | null
  quantity: number | null
  unit_price: number | null
  lead_time_days: number | null
  notes: string | null
}

export interface SupplierResult {
  supplier: string
  line_items: LineItem[]
}

export interface ComparisonRow {
  part_number: string
  description: string | null
  suppliers: {
    [supplierName: string]: LineItem | null
  }
}

export interface RFQSession {
  id: string
  name: string
  createdAt: string
  quotes: SupplierResult[]
}
