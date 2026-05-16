export interface PlateStockItem {
  stock_code: string
  stock_name: string
}

export interface PlateStatisticsRequest {
  trade_date: string
}

export interface PlateStatisticsItem {
  plate_code: string
  plate_name: string
  stock_count: number
  stocks: PlateStockItem[]
}

export interface PlateStatisticsResponse {
  trade_date: string
  total_stock_count: number
  classified_stock_count: number
  unclassified_count: number
  plate_count: number
  data: PlateStatisticsItem[]
}
