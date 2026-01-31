// 动态回溯查询请求参数
export interface DynamicBacktrackRequest {
  trade_date: string
  trade_days: number
  min_occurrences: number
}

// 动态回溯查询数据项
export interface DynamicBacktrackItem {
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
  occurrence_count: number
  plates: Array<{
    plate_code: string
    name: string
  }>
}

// 动态回溯查询响应
export interface DynamicBacktrackResponse {
  data: DynamicBacktrackItem[]
  total: number
}

// 动态回溯明细查询请求参数
export interface DynamicBacktrackDetailRequest {
  stock_code: string
  trade_date: string
  trade_days: number
}

// 动态回溯明细查询响应类型（从 trackQuery 导入）
// 注意：实际使用时请从 '@/types/trackQuery' 导入 TrackDetailItem 和 TrackDetailResponse
