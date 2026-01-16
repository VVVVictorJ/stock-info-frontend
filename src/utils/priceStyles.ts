/**
 * 涨跌样式工具函数
 * 中国股市习惯：红涨绿跌
 */

/**
 * 判断是否是涨跌相关字段
 * @param key 字段名
 * @returns 是否是涨跌字段
 */
export function isPnField(key: string): boolean {
  return key === 'f170' || key === 'f191' || key === 'f137' || key === 'f50' || key === 'f168'
}

/**
 * 获取涨跌幅样式类（正负值判断）
 * @param value 数值
 * @returns CSS 类名
 */
export function getPnClass(value: unknown): string {
  const num = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(num)) return ''
  if (num > 0) return 'pn-pos'
  if (num < 0) return 'pn-neg'
  return ''
}

/**
 * 获取涨跌幅样式类（用于价格变化）
 * @param value 数值
 * @returns CSS 类名：positive（红色上涨）、negative（绿色下跌）
 */
export function getChangeClass(value: string | number): string {
  const num = Number(value)
  if (isNaN(num)) return ''
  if (num > 0) return 'positive'
  if (num < 0) return 'negative'
  return ''
}

/**
 * 涨跌状态信息
 */
export interface PriceTrendInfo {
  latest_price: string | number
  close_price?: string | number | null
}

/**
 * 计算涨跌状态文本
 * @param row 包含 latest_price 和 close_price 的对象
 * @returns 涨跌状态文本
 */
export function getPriceTrend(row: PriceTrendInfo): string {
  if (!row.close_price) return '→ 持平'

  const latestPrice = Number(row.latest_price)
  const closePrice = Number(row.close_price)

  if (isNaN(latestPrice) || isNaN(closePrice)) return '→ 持平'

  if (latestPrice > closePrice) return '↓ 下跌'
  if (latestPrice < closePrice) return '↑ 上涨'
  return '→ 持平'
}

/**
 * 获取涨跌状态样式类
 * @param row 包含 latest_price 和 close_price 的对象
 * @returns CSS 类名
 */
export function getPriceTrendClass(row: PriceTrendInfo): string {
  const trend = getPriceTrend(row)
  if (trend.includes('上涨')) return 'trend-up'
  if (trend.includes('下跌')) return 'trend-down'
  return 'trend-flat'
}

/**
 * 获取盈利等级样式类
 * @param grade 等级（A/B/C）
 * @returns CSS 类名
 */
export function getGradeClass(grade: string): string {
  if (grade === 'A') return 'grade-a'
  if (grade === 'B') return 'grade-b'
  return 'grade-c'
}
