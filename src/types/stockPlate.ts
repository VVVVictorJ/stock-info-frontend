/** GET /stock-plates 列表项（与后端 StockPlateResponse 对齐） */
export interface StockPlateListItem {
  id: number
  plate_code: string
  name: string
  created_at: string
  updated_at: string
}
