/**
 * 股票代码导出图片：Canvas 2D 直接绘制
 * 不经过 DOM 截图（SVG foreignObject），规避光栅化环境差异，
 * 渲染结果像素级可控，零第三方库依赖
 */

const SCALE = 2
const WIDTH = 880
const PADDING = 24
const GAP = 12
const COLS = 8
const CELL_HEIGHT = 40
const OUTER_RADIUS = 12
const CELL_RADIUS = 8
const BG_COLOR = '#0d1117'
const CELL_BG = '#161b22'
const CELL_BORDER = '#30363d'
const TEXT_COLOR = '#e6edf3'

function drawStockCodes(codes: string[]): HTMLCanvasElement {
  const rows = Math.ceil(codes.length / COLS)
  const height = PADDING * 2 + rows * CELL_HEIGHT + (rows - 1) * GAP

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH * SCALE
  canvas.height = height * SCALE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas 2d context unavailable')
  ctx.scale(SCALE, SCALE)

  // 外容器：深色圆角底
  ctx.fillStyle = BG_COLOR
  ctx.beginPath()
  ctx.roundRect(0, 0, WIDTH, height, OUTER_RADIUS)
  ctx.fill()

  // 格子：背景 + 边框 + 居中文字
  const cellWidth = (WIDTH - PADDING * 2 - GAP * (COLS - 1)) / COLS
  ctx.font = "600 16px 'Courier New', monospace"
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineWidth = 1

  codes.forEach((code, i) => {
    const col = i % COLS
    const row = Math.floor(i / COLS)
    const x = PADDING + col * (cellWidth + GAP)
    const y = PADDING + row * (CELL_HEIGHT + GAP)

    ctx.fillStyle = CELL_BG
    ctx.strokeStyle = CELL_BORDER
    ctx.beginPath()
    ctx.roundRect(x, y, cellWidth, CELL_HEIGHT, CELL_RADIUS)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = TEXT_COLOR
    ctx.fillText(code, x + cellWidth / 2, y + CELL_HEIGHT / 2 + 1)
  })

  return canvas
}

/**
 * 将股票代码列表绘制为 PNG Blob
 * 先等字体就绪，避免 fillText 字体回退
 */
export async function generateStockCodesBlob(codes: string[]): Promise<Blob | null> {
  await document.fonts.ready
  const canvas = drawStockCodes(codes)
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'))
}

/**
 * 通过动态 <a download> 触发 PNG 下载，文件名：stocks-YYYYMMDD-HHmmss.png
 */
export function downloadPngBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const t = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  a.href = url
  a.download = `stocks-${t.getFullYear()}${p(t.getMonth() + 1)}${p(t.getDate())}-${p(t.getHours())}${p(t.getMinutes())}${p(t.getSeconds())}.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** 剪贴板图片写入能力检测（需 HTTPS 或 localhost 环境） */
export function supportsImageClipboard(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.clipboard && typeof window.ClipboardItem !== 'undefined'
}

/**
 * 将 PNG 写入系统剪贴板
 * 接收 Promise<Blob> 而非 Blob：ClipboardItem 需在用户手势的同步上下文中构造，
 * 其值允许传入 Promise（Safari 15+ 兼容写法，避免 await 后丢失用户激活状态）
 */
export async function writeImageToClipboard(blobPromise: Promise<Blob | null>): Promise<boolean> {
  if (!supportsImageClipboard()) return false
  try {
    const item = new ClipboardItem({
      'image/png': blobPromise.then((blob) => {
        if (!blob) throw new Error('empty blob')
        return blob
      }),
    })
    await navigator.clipboard.write([item])
    return true
  } catch {
    return false
  }
}
