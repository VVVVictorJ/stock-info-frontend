// 单股数据结构：根据 backend/asset/sample_single_stock.json 推导
export interface SingleStockData {
  f57: string   // 代码
  f58: string   // 名称
  f43: number   // 最新价
  f170: number  // 涨跌幅
  f50: number   // 量比
  f168: number  // 换手率
  f191: number  // 委比
  f137: number  // 主力净流入
}

export interface SingleStockResponse {
  source: 'em' | 'ak' | string
  code: string
  data: SingleStockData
}

export interface FetchSingleStockParams {
  code: string
  source?: 'em' | 'ak'
  raw_only?: boolean
}

// 涨停筛选接口的行结构（后端返回中文列，使用索引类型以便动态渲染）
export type CatchRaiseStockData = {
  f57: string   // 代码
  f58: string   // 名称
  f43: number   // 最新价
  f170: number  // 涨跌幅
  f50: number   // 量比
  f168: number  // 换手率
  f191: number  // 委比
  f137: number  // 主力净流入
}

export interface CatchRaiseStockResponse {
  count: number
  items: CatchRaiseStockData[]
}

// 自定义参数过滤接口的查询参数
export interface FetchCatchRaiseStockParamParams {
  pct_min?: number
  pct_max?: number
  lb_min?: number
  hs_min?: number
  wb_min?: number
  concurrency?: number
  limit?: number
  pz?: number
}

export interface FetchCatchRaiseStockParams {
  concurrency?: number
  limit?: number
  pz?: number
}
