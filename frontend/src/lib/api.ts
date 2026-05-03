import axios, { type InternalAxiosRequestConfig } from 'axios'
import { getLogoutRedirectPath } from '@/lib/auth'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

/**
 * Rotas que são interceptadas pelo Next.js Route Handler (/api/auth/*).
 * O Route Handler seta o cookie HttpOnly com o JWT no domínio do frontend.
 */
const AUTH_PROXY_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/definir-senha-inicial',
  '/auth/switch-company',
  '/auth/trocar-senha',
  '/auth/primeira-senha-convite',
  '/auth/logout',
]

function isAuthProxyPath(url: string | undefined): boolean {
  if (!url) return false
  const path = url.startsWith('http') ? new URL(url).pathname : url.split('?')[0]
  return AUTH_PROXY_PATHS.includes(path)
}

/** Rotas sem JWT obrigatório (email-status, company-access). */
function isPublicAuthRequest(config: InternalAxiosRequestConfig): boolean {
  const raw = config.url || ''
  const path = raw.startsWith('http') ? new URL(raw).pathname : raw.split('?')[0]
  const method = (config.method || 'get').toLowerCase()
  if (method === 'post' && path === '/auth/email-status') return true
  if (method === 'get' && path.startsWith('/auth/company-access/')) return true
  return false
}

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  // Redireciona chamadas de auth pelo Next.js Route Handler (seta cookie HttpOnly)
  if (typeof window !== 'undefined' && isAuthProxyPath(config.url)) {
    config.baseURL = window.location.origin
    const path = (config.url || '').split('?')[0]
    config.url = `/api${path}`
    delete config.headers.Authorization
    return config
  }

  if (typeof window !== 'undefined') {
    if (isPublicAuthRequest(config)) {
      delete config.headers.Authorization
    } else {
      const token = localStorage.getItem('veltrix_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Propaga o traceId do backend para facilitar debugging
    const traceId = error.response?.headers?.['x-trace-id']
    if (traceId && error.response) {
      error.response.traceId = traceId
    }

    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const redirectPath = getLogoutRedirectPath()
      localStorage.removeItem('veltrix_token')
      localStorage.removeItem('veltrix_user')
      window.location.href = redirectPath
    }

    if (error.response?.status === 500) {
      console.error(`[API 500] traceId=${traceId ?? 'n/a'}`, error.config?.url)
    }

    return Promise.reject(error)
  }
)

export default api
