export interface HetuLookupCell {
  row_key: string
  col_key: string
  value: number
}

export interface HetuLookupResponse {
  matrix_code: string
  cells: HetuLookupCell[]
}

export type LuoshuLookupResponse = HetuLookupResponse

export interface AlmanacResponse {
  ganzhi_date: string
  year_stem: string
  year_branch: string
}
