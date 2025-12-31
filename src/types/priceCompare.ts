// 价格对比查询请求参数
export interface PriceCompareRequest {
  trade_date: string
  page: number
  page_size: number
}

// 价格对比查询数据项
export interface PriceCompareItem {
  stock_code: string
  stock_name: string
  latest_price: string
  open_price: string
  high_price: string
  low_price: string
  close_price: string
  grade: string
  created_at: string
}

// 价格对比查询响应
export interface PriceCompareResponse {
  data: PriceCompareItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
  snapshot_date: string | null
  trade_date: string | null
}

