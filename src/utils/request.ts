import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'

// 基础响应结构（可根据后端返回结构调整）
export interface ApiResponse<Data = unknown> {
  code: number
  message: string
  data: Data
}

// 统一的错误对象
export interface HttpError {
  status?: number
  code?: number
  message: string
  url?: string
}

const DEFAULT_TIMEOUT_MS = Number(import.meta.env.VITE_REQUEST_TIMEOUT ?? 15000)

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api'

const httpClient: AxiosInstance = axios.create({
  baseURL,
  timeout: DEFAULT_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
})

// 请求拦截器：附加 Token 等
httpClient.interceptors.request.use(
  (config) => {
    // 可接入 Pinia/LocalStorage 获取 token
    const token = undefined
    if (token) {
      config.headers = config.headers ?? {}
      ;(config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(normalizeError(error))
)

// 响应拦截器：统一处理后端返回与错误
httpClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // 如后端不使用 {code, message, data} 格式，可直接 return response.data
    const payload = response.data as any
    if (payload && typeof payload === 'object' && 'code' in payload) {
      if (payload.code === 0 || payload.code === 200) {
        return payload.data as any
      }
      return Promise.reject({
        status: response.status,
        code: payload.code,
        message: payload.message ?? '请求失败',
        url: response.config?.url,
      } satisfies HttpError)
    }
    // 非约定结构，直接返回
    return response.data as any
  },
  (error) => Promise.reject(normalizeError(error))
)

function normalizeError(err: any): HttpError {
  // Axios 错误
  if (err?.isAxiosError) {
    const status = err?.response?.status
    const message =
      err?.response?.data?.message ??
      err?.message ??
      (status ? `HTTP ${status}` : '网络错误')
    const url = err?.config?.url
    return { status, message, url }
  }
  // 其他错误
  return {
    message: err?.message ?? '未知错误',
  }
}

// 轻量 HTTP 方法封装（带类型）
export const http = {
  get<T = unknown>(url: string, config?: AxiosRequestConfig) {
    return httpClient.get<any, T>(url, config)
  },
  post<T = unknown, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig) {
    return httpClient.post<any, T>(url, body, config)
  },
  put<T = unknown, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig) {
    return httpClient.put<any, T>(url, body, config)
  },
  patch<T = unknown, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig) {
    return httpClient.patch<any, T>(url, body, config)
  },
  delete<T = unknown>(url: string, config?: AxiosRequestConfig) {
    return httpClient.delete<any, T>(url, config)
  },
}

export default httpClient


