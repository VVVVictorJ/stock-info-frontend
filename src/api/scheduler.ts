import request from '@/utils/request'

// 手动触发K线导入任务
export const triggerKlineImport = () =>
  request.post('/scheduler/trigger-kline-import')

// 手动触发盈利分析任务
export const triggerProfitAnalysis = () =>
  request.post('/scheduler/trigger-profit-analysis')

// 手动触发股票筛选任务
export const triggerStockFilter = () =>
  request.post('/scheduler/trigger-stock-filter')

// 手动触发 stock_table 同步任务
export const triggerStockTableSync = async () => {
  const startedAt = Date.now()
  const res = await request.post('/scheduler/trigger-stock-table-sync', undefined, { timeout: 60000 })
  return res
}

// 手动触发 stock_plate 同步任务
export const triggerStockPlateSync = async () => {
  const startedAt = Date.now()
  const res = await request.post('/scheduler/trigger-stock-plate-sync', undefined, { timeout: 300000 })
  return res
}

// 获取任务列表
export const getJobList = () =>
  request.get('/scheduler/jobs')

// 获取执行历史
export const getExecutionHistory = (params: any) =>
  request.get('/scheduler/history', { params })

// 获取历史详情
export const getExecutionDetail = (id: number) =>
  request.get(`/scheduler/history/${id}`)

// 获取最新执行记录
export const getLatestExecution = (jobName: string) =>
  request.get(`/scheduler/latest/${jobName}`)

