import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchExportButtonConfigs } from '@/api/exportButtonConfig'
import { fetchStockPlatesList } from '@/api/stock'
import {
  generateStockCodesBlob,
  downloadPngBlob,
  supportsImageClipboard,
  writeImageToClipboard,
} from '@/utils/exportImage'
import type { ExportButtonConfigItem } from '@/types/exportButtonConfig'
import type { StockPlateListItem } from '@/types/stockPlate'

interface StockItemWithPlates {
  stock_code: string
  plates?: Array<{ plate_code: string; name: string }>
}

/** 昨日涨停板块名称（用于模糊匹配 plate_code） */
const ZRZT_PLATE_NAME = '昨日涨停_含一字'
/** 昨日涨停导出文件名后缀 */
const ZRZT_SUFFIX = '-zrzt'

export function useExportButtonConfigs(pageKey?: string) {
  const configs = ref<ExportButtonConfigItem[]>([])
  const plateOptions = ref<StockPlateListItem[]>([])
  const exporting = ref(false)
  const zrztPlateCode = ref<string | null>(null)

  /** 加载配置列表 */
  async function loadConfigs() {
    try {
      // #region agent log
      fetch('http://127.0.0.1:7672/ingest/011d9284-7d9e-4eb5-bf6b-c54e4138f97a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'004cd7'},body:JSON.stringify({sessionId:'004cd7',location:'useExportButtonConfigs.ts:31',message:'loadConfigs entry',data:{pageKey},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      const res = await fetchExportButtonConfigs(pageKey)
      // #region agent log
      fetch('http://127.0.0.1:7672/ingest/011d9284-7d9e-4eb5-bf6b-c54e4138f97a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'004cd7'},body:JSON.stringify({sessionId:'004cd7',location:'useExportButtonConfigs.ts:33',message:'loadConfigs success',data:{pageKey,count:res?.length,isArray:Array.isArray(res),first:res?.[0]},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      configs.value = res
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7672/ingest/011d9284-7d9e-4eb5-bf6b-c54e4138f97a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'004cd7'},body:JSON.stringify({sessionId:'004cd7',location:'useExportButtonConfigs.ts:36',message:'loadConfigs error',data:{pageKey,error:String(err)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      console.error('Failed to load export button configs:', err)
    }
  }

  /** 加载板块选项并查找昨日涨停的 plate_code */
  async function loadPlateOptions() {
    try {
      // #region agent log
      fetch('http://127.0.0.1:7672/ingest/011d9284-7d9e-4eb5-bf6b-c54e4138f97a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'004cd7'},body:JSON.stringify({sessionId:'004cd7',location:'useExportButtonConfigs.ts:40',message:'loadPlateOptions entry',data:{},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      const res = await fetchStockPlatesList()
      // #region agent log
      fetch('http://127.0.0.1:7672/ingest/011d9284-7d9e-4eb5-bf6b-c54e4138f97a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'004cd7'},body:JSON.stringify({sessionId:'004cd7',location:'useExportButtonConfigs.ts:42',message:'loadPlateOptions success',data:{count:res?.length,isArray:Array.isArray(res),first:res?.[0],names:res?.slice(0,5).map((p:any)=>p.name)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      plateOptions.value = res
      const zrzt = plateOptions.value.find((p) => p.name.includes(ZRZT_PLATE_NAME))
      zrztPlateCode.value = zrzt?.plate_code ?? null
      // #region agent log
      fetch('http://127.0.0.1:7672/ingest/011d9284-7d9e-4eb5-bf6b-c54e4138f97a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'004cd7'},body:JSON.stringify({sessionId:'004cd7',location:'useExportButtonConfigs.ts:45',message:'zrztPlateCode result',data:{zrztFound:!!zrzt,zrztPlateCode:zrztPlateCode.value,zrztName:zrzt?.name},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7672/ingest/011d9284-7d9e-4eb5-bf6b-c54e4138f97a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'004cd7'},body:JSON.stringify({sessionId:'004cd7',location:'useExportButtonConfigs.ts:48',message:'loadPlateOptions error',data:{error:String(err)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      console.error('Failed to load stock plates:', err)
    }
  }

  /** 按板块代码过滤股票 */
  function filterByPlates<T extends StockItemWithPlates>(data: T[], plateCodes: string[]): T[] {
    if (plateCodes.length === 0) return data
    const set = new Set(plateCodes)
    return data.filter((item) => (item.plates || []).some((p) => set.has(p.plate_code)))
  }

  /** 执行导出 */
  async function doExport(codes: string[], suffix: string) {
    if (codes.length === 0) {
      ElMessage.warning('暂无可导出的股票代码')
      return
    }
    if (exporting.value) return

    exporting.value = true
    try {
      const blobPromise = generateStockCodesBlob(codes)
      const clipboardPromise = supportsImageClipboard()
        ? writeImageToClipboard(blobPromise)
        : Promise.resolve(false)

      const blob = await blobPromise
      if (!blob) throw new Error('canvas toBlob returned null')

      downloadPngBlob(blob, suffix)

      const copied = await clipboardPromise
      if (copied) {
        ElMessage.success('图片已下载并复制到剪贴板')
      } else {
        ElMessage.warning('图片已下载（当前浏览器不支持复制图片到剪贴板）')
      }
    } catch (err) {
      console.error('[export-image]', err)
      ElMessage.error('图片生成失败，请重试')
    } finally {
      exporting.value = false
    }
  }

  /** 导出昨日涨停 */
  async function exportZrzt<T extends StockItemWithPlates>(data: T[]) {
    if (!zrztPlateCode.value) {
      ElMessage.warning('未找到"昨日涨停_含一字"板块，请先在配置页面确认板块数据')
      return
    }
    const filtered = filterByPlates(data, [zrztPlateCode.value])
    const codes = filtered.map((item) => item.stock_code)
    await doExport(codes, ZRZT_SUFFIX)
  }

  /** 按配置导出 */
  async function exportByConfig<T extends StockItemWithPlates>(data: T[], config: ExportButtonConfigItem) {
    const filtered = filterByPlates(data, config.plate_codes)
    const codes = filtered.map((item) => item.stock_code)
    await doExport(codes, `-${config.name}`)
  }

  onMounted(() => {
    loadConfigs()
    loadPlateOptions()
  })

  return {
    configs,
    plateOptions,
    exporting,
    zrztPlateCode,
    loadConfigs,
    loadPlateOptions,
    filterByPlates,
    exportZrzt,
    exportByConfig,
  }
}
