import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'

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

interface ExportRowsOptions {
  rows: Array<Array<string | number | null | undefined>>
  fileName: string
  sheetName?: string
  mergeFirstRowToColumn?: number
  centerFirstRow?: boolean
}

export function exportRowsToXlsx({
  rows,
  fileName,
  sheetName = 'Sheet1',
  mergeFirstRowToColumn,
  centerFirstRow = false,
}: ExportRowsOptions) {
  const worksheet = XLSX.utils.aoa_to_sheet(rows)

  if (typeof mergeFirstRowToColumn === 'number' && mergeFirstRowToColumn >= 1) {
    worksheet['!merges'] = [
      {
        s: { r: 0, c: 0 },
        e: { r: 0, c: mergeFirstRowToColumn - 1 },
      },
    ]
  }

  if (centerFirstRow && worksheet.A1) {
    worksheet.A1.s = {
      alignment: {
        horizontal: 'center',
        vertical: 'center',
      },
      font: {
        bold: true,
      },
    }
  }

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, fileName)
}

interface StockListExportOptions {
  stocks: Array<{ stock_name: string; stock_code: string }>
  date: string
  fileName: string
}

const TOTAL_COLUMNS = 11
const ROWS_PER_PAGE = 67
const DATA_ROWS = ROWS_PER_PAGE - 1
const STOCKS_PER_PAGE = DATA_ROWS * TOTAL_COLUMNS

export async function exportStockListToXlsx({ stocks, date, fileName }: StockListExportOptions) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('股票列表')

  worksheet.columns = Array.from({ length: TOTAL_COLUMNS }, () => ({ width: 10.87 }))

  for (let pageStart = 0; pageStart < stocks.length; pageStart += STOCKS_PER_PAGE) {
    const dateRow = worksheet.addRow([date])
    worksheet.mergeCells(dateRow.number, 1, dateRow.number, TOTAL_COLUMNS)
    dateRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
    dateRow.getCell(1).font = { bold: true, size: 6 }

    for (let r = 0; r < DATA_ROWS; r++) {
      const rowData: string[] = []
      for (let c = 0; c < TOTAL_COLUMNS; c++) {
        const globalIdx = pageStart + r * TOTAL_COLUMNS + c
        const seq = pageStart + c * DATA_ROWS + r + 1
        const item = stocks[globalIdx]
        if (item) {
          rowData.push(`${seq} ${item.stock_name} ${item.stock_code}`)
        } else {
          rowData.push('')
        }
      }
      const dataRow = worksheet.addRow(rowData)
      dataRow.font = { size: 6 }
    }

    if (pageStart + STOCKS_PER_PAGE < stocks.length) {
      const lastDataRowNum = worksheet.rowCount
      worksheet.getRow(lastDataRowNum).addPageBreak()
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}
