export interface ConvertibleBondItem {
  bond_code: string
  bond_short_name: string
  stock_code: string
  stock_name: string
  issue_scale: number
  transfer_premium_ratio: number
  stock_price: number | null
  bond_price: number | null
}

export interface ConvertibleBondQueryResponse {
  data: ConvertibleBondItem[]
  total: number
}
