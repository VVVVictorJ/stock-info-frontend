import { http } from '@/utils/request'
import type {
  ExportButtonConfigItem,
  CreateExportButtonConfigRequest,
  UpdateExportButtonConfigRequest,
} from '@/types/exportButtonConfig'

/** 获取导出按钮配置列表（支持按 page_key 过滤） */
export async function fetchExportButtonConfigs(pageKey?: string) {
  const params = pageKey ? { page_key: pageKey } : {}
  return http.get<ExportButtonConfigItem[]>('/export-button-config', { params })
}

/** 创建导出按钮配置 */
export async function createExportButtonConfig(data: CreateExportButtonConfigRequest) {
  return http.post<ExportButtonConfigItem>('/export-button-config', data)
}

/** 更新导出按钮配置 */
export async function updateExportButtonConfig(id: number, data: UpdateExportButtonConfigRequest) {
  return http.put<ExportButtonConfigItem>(`/export-button-config/${id}`, data)
}

/** 删除导出按钮配置 */
export async function deleteExportButtonConfig(id: number) {
  return http.delete(`/export-button-config/${id}`)
}
