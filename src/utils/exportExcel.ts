import * as XLSX from 'xlsx'

export interface ExportColumn<T> {
  key: keyof T
  header: string
}

interface ExportExcelOptions<T extends object> {
  data: T[]
  columns: ExportColumn<T>[]
  fileName: string
  sheetName?: string
}

export function exportToXlsx<T extends object>({
  data,
  columns,
  fileName,
  sheetName = 'Sheet1',
}: ExportExcelOptions<T>) {
  const rows = [
    columns.map(column => column.header),
    ...data.map(item =>
      columns.map(column => {
        const value = item[column.key]
        return value ?? ''
      })
    ),
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, fileName)
}
