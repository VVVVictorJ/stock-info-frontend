/** 单月 K（与后端 DailyKlineResponse 对齐，数值多为 JSON 字符串） */
export interface MonthlyKlineBar {
  stock_code: string
  trade_date: string
  open_price: string
  high_price: string
  low_price: string
  close_price: string
  volume: number
  amount: string
}

export interface PlateBrief {
  plate_code: string
  name: string
}

/** 月线 MA5×MA20 刚上穿筛选（可选锚定年月、板块） */
export interface MonthlyMaCrossRequest {
  anchor_year?: number
  anchor_month?: number
  /** 与后端 `filter_plate_codes`：匹配任一板块才参与扫描 */
  filter_plate_codes?: string[]
}

export interface MonthlyMaCrossItem {
  stock_code: string
  stock_name: string
  latest_price: string
  plates: PlateBrief[]
  ma5_current?: string
  ma20_current?: string
  ma5_prev?: string
  ma20_prev?: string
}

export interface SkippedStock {
  stock_code: string
  stock_name: string
  plates: PlateBrief[]
  reason: string
}

export interface MonthlyMaCrossResponse {
  items: MonthlyMaCrossItem[]
  skipped: SkippedStock[]
}

/** `/multi-level-filter/daily-ma-cross-after-monthly`：月线扫描 + 日线在刚上穿；`daily_refinement` 中的 MA 为日线口径 */
export interface DailyAfterMonthlyMaCrossResponse {
  monthly: MonthlyMaCrossResponse
  daily_refinement: MonthlyMaCrossResponse
}

export interface MonthlyKlineQueryRequest {
  stock_code: string
}

export interface MonthlyKlineQueryResponse {
  stock_code: string
  stock_name: string
  total_count: number
  parse_errors?: string[]
  klines: MonthlyKlineBar[]
}
