/**
 * 根据当前页面协议和域名构建 WebSocket URL
 * - 开发环境 (localhost): 直接连接后端端口 8000
 * - 生产环境 (Nginx 代理): 使用相同域名的 ws/wss
 */
export function getWebSocketUrl(path: string): string {
  const { protocol, hostname, port } = window.location

  // 开发环境：直接连接后端
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `ws://${hostname}:8000${path}`
  }

  // 生产环境：通过 Nginx 代理
  const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:'
  const wsPort = port ? `:${port}` : ''
  return `${wsProtocol}//${hostname}${wsPort}${path}`
}
