export interface ConvertibleBondItem {
  bond_code: string
  bond_short_name: string
  stock_code: string
  stock_name: string
  issue_scale: number
  transfer_premium_ratio: number
  stock_price: number | null
  bond_price: number | null
  /** DELIST_DATE 非空且距「最后交易日」在 [0,3] 个日历日内 */
  near_last_trading_day?: boolean
}

export interface ConvertibleBondQueryResponse {
  data: ConvertibleBondItem[]
  total: number
}
