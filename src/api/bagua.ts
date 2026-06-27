import { http } from '@/utils/request'
import type { AlmanacResponse, HetuLookupResponse, LuoshuLookupResponse } from '@/types/bagua'

export function fetchHetuLookup() {
  return http.get<HetuLookupResponse>('/bagua/lookup/hetu')
}

export function fetchLuoshuStemLookup() {
  return http.get<LuoshuLookupResponse>('/bagua/lookup/luoshu-stem')
}

export function fetchLuoshuBranchLookup() {
  return http.get<LuoshuLookupResponse>('/bagua/lookup/luoshu-branch')
}

export function fetchAlmanac(year: string, month: string, day: string) {
  return http.get<AlmanacResponse>('/bagua/almanac', {
    params: { year, month, day },
  })
}
