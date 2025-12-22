// 单股数据结构：根据 backend/asset/sample_single_stock.json 推导
export interface SingleStockData {
  f57: string   // 代码
  f58: string   // 名称
  f43: number   // 最新价
  f170: number  // 涨跌幅
  f50: number   // 量比
  f162: number  // 市盈率-动态
  f167: number  // 市净率
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


