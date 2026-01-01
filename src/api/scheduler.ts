import request from '@/utils/request'

// 手动触发K线导入任务
export const triggerKlineImport = () =>
  request.post('/scheduler/trigger-kline-import')

// 手动触发盈利分析任务
export const triggerProfitAnalysis = () =>
  request.post('/scheduler/trigger-profit-analysis')

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

