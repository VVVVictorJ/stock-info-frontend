import { http } from '@/utils/request'
import type { FetchSingleStockParams, SingleStockResponse } from '@/types/stock'

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


