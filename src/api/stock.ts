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
import type {
  DynamicBacktrackRequest,
  DynamicBacktrackResponse,
  DynamicBacktrackDetailRequest,
} from '@/types/dynamicBacktrack'
import type {
  AddWatchlistRequest,
  WatchlistResponse,
  CheckWatchlistResponse,
  BatchCheckWatchlistRequest,
  BatchCheckWatchlistResponse,
} from '@/types/stockWatchlist'
import type {
  WatchlistQueryRequest,
  WatchlistQueryResponse,
  WatchlistDetailRequest,
  WatchlistDetailResponse,
  WatchlistKlineRequest,
  WatchlistKlineResponse,
  WatchlistFillKlineRequest,
  WatchlistFillKlineResponse,
} from '@/types/watchlistQuery'
import type { ConvertibleBondQueryResponse } from '../types/convertibleBondQuery'
import type { PlateStatisticsRequest, PlateStatisticsResponse } from '@/types/basicDataAnalysis'

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

// 动态回溯查询（后端路径：/stock-dynamic-backtrack）
export async function fetchDynamicBacktrack(params: DynamicBacktrackRequest) {
  return http.post<DynamicBacktrackResponse>('/stock-dynamic-backtrack', params)
}

// 动态回溯明细查询（后端路径：/stock-dynamic-backtrack/detail）
export async function fetchDynamicBacktrackDetail(params: DynamicBacktrackDetailRequest) {
  return http.post<TrackDetailResponse>('/stock-dynamic-backtrack/detail', params)
}

// 添加股票到观察表（后端路径：/stock-watchlist）
export async function addToWatchlist(params: AddWatchlistRequest) {
  return http.post<WatchlistResponse>('/stock-watchlist', params)
}

// 从观察表移除股票（后端路径：/stock-watchlist/:stock_code）
export async function removeFromWatchlist(stockCode: string) {
  return http.delete(`/stock-watchlist/${stockCode}`)
}

// 检查股票是否在观察表中（后端路径：/stock-watchlist/check/:stock_code）
export async function checkWatchlist(stockCode: string) {
  return http.get<CheckWatchlistResponse>(`/stock-watchlist/check/${stockCode}`)
}

// 批量检查股票是否在观察表中（后端路径：/stock-watchlist/batch-check）
export async function batchCheckWatchlist(params: BatchCheckWatchlistRequest) {
  return http.post<BatchCheckWatchlistResponse>('/stock-watchlist/batch-check', params)
}

// 获取所有观察的股票（后端路径：/stock-watchlist）
export async function listWatchlist() {
  return http.get<WatchlistResponse[]>('/stock-watchlist')
}

// 观察表查询（后端路径：/stock-watchlist-query）
export async function fetchWatchlistQuery(params: WatchlistQueryRequest) {
  return http.post<WatchlistQueryResponse>('/stock-watchlist-query', params)
}

// 观察表明细查询（后端路径：/stock-watchlist-query/detail）
export async function fetchWatchlistDetail(params: WatchlistDetailRequest) {
  return http.post<WatchlistDetailResponse>('/stock-watchlist-query/detail', params)
}

// 观察表K线查询（后端路径：/stock-watchlist-query/kline）
export async function fetchWatchlistKline(params: WatchlistKlineRequest) {
  return http.post<WatchlistKlineResponse>('/stock-watchlist-query/kline', params)
}

// 补齐观察表K线数据（后端路径：/stock-watchlist-query/fill-klines）
export async function fillWatchlistKlines(params: WatchlistFillKlineRequest = {}) {
  return http.post<WatchlistFillKlineResponse>('/stock-watchlist-query/fill-klines', params)
}

// 可转债筛选查询（后端路径：/convertible-bond-query；东方财富侧可能较慢）
export async function fetchConvertibleBondQuery() {
  return http.post<ConvertibleBondQueryResponse>('/convertible-bond-query', {}, { timeout: 90000 })
}

// 板块数据统计（后端路径：/basic-data-analysis/plate-statistics）
export async function fetchPlateStatistics(params: PlateStatisticsRequest) {
  return http.post<PlateStatisticsResponse>('/basic-data-analysis/plate-statistics', params)
}
