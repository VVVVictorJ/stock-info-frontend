// 添加股票到观察表请求
export interface AddWatchlistRequest {
  stock_code: string
  stock_name?: string
}

// 观察表响应
export interface WatchlistResponse {
  id: number
  stock_code: string
  stock_name?: string
  created_at: string
  updated_at: string
}

// 检查观察状态响应
export interface CheckWatchlistResponse {
  is_watched: boolean
  stock_code: string
}

// 批量检查请求
export interface BatchCheckWatchlistRequest {
  stock_codes: string[]
}

// 批量检查响应
export interface BatchCheckWatchlistResponse {
  watched_codes: string[]
}
