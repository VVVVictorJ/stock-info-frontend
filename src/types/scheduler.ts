// 任务信息
export interface JobInfo {
  name: string
  displayName: string
  description: string
  schedule: string
  enabled: boolean
}

// 任务执行历史
export interface JobExecutionHistory {
  id: number
  jobName: string
  status: string
  startedAt: string
  completedAt?: string
  totalCount: number
  successCount: number
  failedCount: number
  skippedCount: number
  details?: any
  errorMessage?: string
  durationMs?: number
}

// 触发响应（K线导入）
export interface TriggerKlineResponse {
  success: boolean
  message: string
  totalStocks: number
  successCount: number
  failedCount: number
  details: StockDetail[]
}

// 股票详情
export interface StockDetail {
  stockCode: string
  importedCount: number
  success: boolean
  error?: string
}

// 触发响应（盈利分析）
export interface TriggerProfitAnalysisResponse {
  success: boolean
  message: string
  totalSnapshots: number
  analyzedCount: number
  skippedCount: number
  noKlineCount: number
  details: SnapshotDetail[]
}

// 快照详情
export interface SnapshotDetail {
  stockCode: string
  stockName: string
  profitRate: number
  success: boolean
  error?: string
}

// 历史查询参数
export interface HistoryQueryParams {
  jobName?: string
  status?: string
  page?: number
  pageSize?: number
}

// 历史查询响应
export interface HistoryQueryResponse {
  total: number
  page: number
  pageSize: number
  items: JobExecutionHistory[]
}

