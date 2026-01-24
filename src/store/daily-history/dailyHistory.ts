import { defineStore } from 'pinia'
import type { TradeDateQueryItem, TradeDateQueryResponse } from '@/types/tradeDateQuery'

const recordKeySeparator = '__'

function buildRecordKey(item: TradeDateQueryItem): string {
  return `${item.stock_code}${recordKeySeparator}${item.created_at}`
}

function areKeysSame(currentKeys: string[], previousKeys: string[]): boolean {
  if (currentKeys.length !== previousKeys.length) return false
  const previousSet = new Set(previousKeys)
  return currentKeys.every(key => previousSet.has(key))
}

export const useDailyHistoryStore = defineStore('dailyHistory', {
  state: () => ({
    lastItems: [] as TradeDateQueryItem[],
    lastKeys: [] as string[],
    lastResponse: null as TradeDateQueryResponse | null,
    newRecordKeys: [] as string[],
  }),
  actions: {
    reset() {
      this.lastItems = []
      this.lastKeys = []
      this.lastResponse = null
      this.newRecordKeys = []
    },
    updateWithResults(items: TradeDateQueryItem[], response: TradeDateQueryResponse | null) {
      const currentKeys = items.map(buildRecordKey)

      if (this.lastKeys.length === 0) {
        this.lastItems = items
        this.lastKeys = currentKeys
        this.lastResponse = response
        this.newRecordKeys = []
        return { hasChanges: true, newKeys: [] }
      }

      if (areKeysSame(currentKeys, this.lastKeys)) {
        this.newRecordKeys = []
        return { hasChanges: false, newKeys: [] }
      }

      const previousSet = new Set(this.lastKeys)
      const newKeys = currentKeys.filter(key => !previousSet.has(key))
      this.lastItems = items
      this.lastKeys = currentKeys
      this.lastResponse = response
      this.newRecordKeys = newKeys
      return { hasChanges: true, newKeys }
    },
  },
})
