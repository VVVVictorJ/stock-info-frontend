/** 导出按钮配置项 */
export interface ExportButtonConfigItem {
  id: number
  page_key: string
  name: string
  plate_codes: string[]
  sort_order: number
  created_at: string
  updated_at: string
}

/** 创建导出按钮配置请求 */
export interface CreateExportButtonConfigRequest {
  page_key: string
  name: string
  plate_codes: string[]
  sort_order?: number
}

/** 更新导出按钮配置请求 */
export interface UpdateExportButtonConfigRequest {
  page_key?: string
  name?: string
  plate_codes?: string[]
  sort_order?: number
}
