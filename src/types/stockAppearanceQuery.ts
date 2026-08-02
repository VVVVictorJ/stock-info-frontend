// 历史出现查询请求参数
export interface StockAppearanceQueryRequest {
  stock_code?: string
  stock_name?: string
  plate_code?: string
  page: number
  page_size: number
}

// 历史出现查询数据项
export interface StockAppearanceQueryItem {
  stock_code: string
  stock_name: string
  latest_price: string
  close_price: string | null
  change_pct: string
  volume_ratio: string
  turnover_rate: string
  bid_ask_ratio: string
  main_force_inflow: string
  created_at: string
  plates: Array<{
    plate_code: string
    name: string
  }>
}

// 历史出现查询响应
export interface StockAppearanceQueryResponse {
  data: StockAppearanceQueryItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
}
