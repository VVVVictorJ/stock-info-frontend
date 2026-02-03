// 观察表查询请求参数
export interface WatchlistQueryRequest {
  plate_codes?: string[]
  change_pct_min?: number | null
  change_pct_max?: number | null
  volume_ratio_min?: number | null
  volume_ratio_max?: number | null
  turnover_rate_min?: number | null
  turnover_rate_max?: number | null
  bid_ask_ratio_min?: number | null
  bid_ask_ratio_max?: number | null
  main_force_inflow_min?: number | null
  main_force_inflow_max?: number | null
  stock_code_filter?: string | null
}

// 观察表查询数据项
export interface WatchlistQueryItem {
  stock_code: string
  stock_name: string | null
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

// 观察表查询响应
export interface WatchlistQueryResponse {
  data: WatchlistQueryItem[]
  total: number
}

// 观察表明细查询请求参数
export interface WatchlistDetailRequest {
  stock_code: string
}

// 观察表明细查询数据项
export interface WatchlistDetailItem {
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

// 观察表明细查询响应
export interface WatchlistDetailResponse {
  data: WatchlistDetailItem[]
  total: number
}

// 观察表K线查询请求参数
export interface WatchlistKlineRequest {
  stock_code: string
}

// 观察表K线查询数据项
export interface WatchlistKlineItem {
  stock_code: string
  trade_date: string
  open_price: string
  high_price: string
  low_price: string
  close_price: string
  volume: number
  amount: string
}

// 观察表K线查询响应
export interface WatchlistKlineResponse {
  data: WatchlistKlineItem[]
  total: number
  start_date: string | null
  end_date: string
}

// 补齐观察表K线数据请求
export interface WatchlistFillKlineRequest {
  // 可以为空
}

// 股票补齐K线数据详情
export interface StockFillKlineDetail {
  stock_code: string
  imported_count: number
  success: boolean
  error: string | null
}

// 补齐观察表K线数据响应
export interface WatchlistFillKlineResponse {
  total_stocks: number
  success_count: number
  failed_count: number
  skipped_count: number
  stock_details: StockFillKlineDetail[]
}
