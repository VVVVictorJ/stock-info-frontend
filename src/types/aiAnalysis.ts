// ==================== AI 趋势分析相关类型 ====================

// 趋势预测请求
export interface TrendPredictionRequest {
  stock_code: string
}

// 趋势预测响应
export interface TrendPredictionResponse {
  id: number
  stock_code: string
  stock_name: string | null
  model_name: string
  status: string
  response_json: AiAnalysisResult | null
  signal_count: number | null
  kline_start_date: string | null
  kline_end_date: string | null
  error_message: string | null
  duration_ms: number | null
  created_at: string
}

// AI 分析结果 JSON 结构
export interface AiAnalysisResult {
  overview: AnalysisOverview
  signal_evaluations: SignalEvaluation[]
  current_diagnosis: CurrentDiagnosis
  risk_warnings: string[]
}

// 概览
export interface AnalysisOverview {
  stock_name: string
  signal_count: number
  analysis_period: string
  data_completeness: DataCompleteness
}

// 数据完整性
export interface DataCompleteness {
  earliest_signal_date: string
  history_trading_days: number
  is_sufficient: boolean
  trend_coverage_days: number
}

// 信号评估
export interface SignalEvaluation {
  signal_index: number
  datetime: string
  indicators: SignalIndicators
  trend_phase: string
  time_quality: string
  is_valid: boolean
  kline_pattern: string
  actual_change_pct: number
  volume_assessment: string
  key_level: string
  rating: string
  rating_reason: string
  action_suggestion: string
}

// 信号指标
export interface SignalIndicators {
  change_pct: number
  volume_ratio: number
  turnover_rate: number
  bid_ask_ratio: number
}

// 当前趋势诊断
export interface CurrentDiagnosis {
  status: string
  support_level: number
  resistance_level: number
  ma5: number
  ma20: number
  has_new_signal: boolean
  action_suggestion: string
}

// ==================== 历史记录相关 ====================

// 历史记录查询请求
export interface TrendHistoryRequest {
  stock_code?: string
  page_size?: number
  page?: number
}

// 历史记录列表项
export interface TrendHistoryItem {
  id: number
  stock_code: string
  stock_name: string | null
  model_name: string
  status: string
  signal_count: number | null
  kline_start_date: string | null
  kline_end_date: string | null
  duration_ms: number | null
  created_at: string
}

// 历史记录响应
export interface TrendHistoryResponse {
  data: TrendHistoryItem[]
  total: number
}

// 详情响应（与 TrendPredictionResponse 相同）
export type TrendDetailResponse = TrendPredictionResponse
