import { http } from '@/utils/request'
import type { FetchSingleStockParams, SingleStockResponse } from '@/types/stock'
import type { FetchCatchRaiseStockParams, CatchRaiseStockResponse, FetchCatchRaiseStockParamParams } from '@/types/stock'
import type {
  TradeDateQueryRequest,
  TradeDateQueryResponse,
  TradeDatePlateRefreshRequest,
  TradeDatePlateRefreshResponse,
} from '@/types/tradeDateQuery'
import type { PriceCompareRequest, PriceCompareResponse } from '@/types/priceCompare'
import type {
  TrackQueryRequest,
  TrackQueryResponse,
  TrackDetailRequest,
  TrackDetailResponse,
} from '@/types/trackQuery'

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

// 交易日查询（后端路径：/stock-trade-date-query）
export async function fetchTradeDateQuery(params: TradeDateQueryRequest) {
  return http.post<TradeDateQueryResponse>('/stock-trade-date-query', params)
}

// 交易日板块补全（后端路径：/stock-trade-date-query/refresh-plates）
export async function refreshTradeDatePlates(params: TradeDatePlateRefreshRequest) {
  return http.post<TradeDatePlateRefreshResponse>('/stock-trade-date-query/refresh-plates', params)
}

// 价格对比查询（后端路径：/stock-price-compare）
export async function fetchPriceCompare(params: PriceCompareRequest) {
  return http.post<PriceCompareResponse>('/stock-price-compare', params)
}

// 追踪查询（后端路径：/stock-track-query）
export async function fetchTrackQuery(params: TrackQueryRequest) {
  return http.post<TrackQueryResponse>('/stock-track-query', params)
}

// 追踪明细查询（后端路径：/stock-track-query/detail）
export async function fetchTrackDetail(params: TrackDetailRequest) {
  return http.post<TrackDetailResponse>('/stock-track-query/detail', params)
}
