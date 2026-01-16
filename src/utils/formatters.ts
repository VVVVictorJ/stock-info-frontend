/**
 * 格式化工具函数
 */

/**
 * 格式化数字，保留两位小数
 * @param value 数值
 * @returns 格式化后的字符串
 */
export function formatNumber(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '-'
  const num = Number(value)
  if (isNaN(num)) return String(value)
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * 格式化日期时间
 * @param value 日期字符串
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-'
  try {
    const date = new Date(value)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return value
  }
}

/**
 * 格式化数字为千分位
 * @param value 数值
 * @returns 格式化后的千分位字符串
 */
export function formatThousand(value: unknown): string {
  const num = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(num)) return String(value ?? '')
  return new Intl.NumberFormat('en-US').format(num)
}

/**
 * 格式化时长（毫秒转可读字符串）
 * @param ms 毫秒数
 * @returns 格式化后的时长字符串
 */
export function formatDuration(ms?: number): string {
  if (!ms) return '-'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}min`
}
