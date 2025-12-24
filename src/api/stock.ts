import { http } from '@/utils/request'
import type { FetchSingleStockParams, SingleStockResponse } from '@/types/stock'
import type { FetchCatchRaiseStockParams, CatchRaiseStockResponse, FetchCatchRaiseStockParamParams } from '@/types/stock'

/**
 * 查询单只股票信息
 * GET /api/stock
 * query: code, source(em|ak), raw_only
 */
export async function fetchSingleStock(params: FetchSingleStockParams) {
  return http.get<SingleStockResponse>('/stock', {
    params,
  })
}


export async function fetchCatchRaiseStock(params: FetchCatchRaiseStockParams) {
  return http.get<CatchRaiseStockResponse>('/stock/filtered', {
    params: { ...params, _t: Date.now() } as any,
  })
}

// 自定义参数版本（后端路径：/stock/filtered/param）
export async function fetchCatchRaiseStockParam(params: FetchCatchRaiseStockParamParams) {
  return http.get<CatchRaiseStockResponse>('/stock/filtered/param', {
    params: { ...params, _t: Date.now() } as any,
  })
}
