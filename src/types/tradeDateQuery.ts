// 交易日查询请求参数
export interface TradeDateQueryRequest {
  trade_date: string
  page: number
  page_size: number
}

// 交易日查询数据项
export interface TradeDateQueryItem {
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

// 交易日查询响应
export interface TradeDateQueryResponse {
  data: TradeDateQueryItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// 补全板块请求参数
export interface TradeDatePlateRefreshRequest {
  trade_date: string
}

// 补全板块响应
export interface TradeDatePlateRefreshResponse {
  total_count: number
  missing_count: number
  stock_table_inserted: number
  plate_inserted: number
  plate_updated: number
  relation_inserted: number
  failed_count: number
}

