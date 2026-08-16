// 每日统计：单个日期的去重股票支数
export interface DailyStockCountItem {
  date: string
  count: number
}

// 每日统计查询参数（YYYY-MM-DD）
export interface DailyStockCountQuery {
  start: string
  end: string
}
