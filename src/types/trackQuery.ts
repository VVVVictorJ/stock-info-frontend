// 追踪查询请求参数
export interface TrackQueryRequest {
  trade_date: string
  min_occurrences?: number
}

// 出现次数统计
export interface OccurrenceStats {
  days_3: number
  days_7: number
  days_14: number
}

// 追踪查询数据项
export interface TrackQueryItem {
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
  occurrence_stats: OccurrenceStats
  tag: string
  plates: Array<{
    plate_code: string
    name: string
  }>
}

// 追踪查询响应
export interface TrackQueryResponse {
  data: TrackQueryItem[]
  total: number
}

// 追踪明细查询请求参数
export interface TrackDetailRequest {
  stock_code: string
  trade_date: string
  track_days: number
}

// 追踪明细查询数据项
export interface TrackDetailItem {
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

// 追踪明细查询响应
export interface TrackDetailResponse {
  data: TrackDetailItem[]
  total: number
}
