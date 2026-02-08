import { http } from '@/utils/request'
import type {
  TrendPredictionRequest,
  TrendPredictionResponse,
  TrendHistoryRequest,
  TrendHistoryResponse,
  TrendDetailResponse,
} from '@/types/aiAnalysis'

// 发起趋势预测分析（后端路径：/ai-analysis/trend-prediction）
export async function fetchTrendPrediction(params: TrendPredictionRequest) {
  return http.post<TrendPredictionResponse>('/ai-analysis/trend-prediction', params, { timeout: 120000 })
}

// 查询历史分析记录（后端路径：/ai-analysis/trend-prediction/history）
export async function fetchTrendHistory(params: TrendHistoryRequest = {}) {
  return http.get<TrendHistoryResponse>('/ai-analysis/trend-prediction/history', {
    params,
  })
}

// 查询分析详情（后端路径：/ai-analysis/trend-prediction/:id）
export async function fetchTrendDetail(id: number) {
  return http.get<TrendDetailResponse>(`/ai-analysis/trend-prediction/${id}`)
}
