import axios from 'axios'
import { getLogoutRedirectPath } from '@/lib/auth'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

function pathFromRequestUrl(url: string | undefined): string {
  if (!url) return ''
  try {
    return url.startsWith('http') ? new URL(url).pathname : url.split('?')[0]
  } catch {
    return url.split('?')[0]
  }
}

function relPathWithSearch(url: string | undefined): string {
  if (!url) return ''
  try {
    if (url.startsWith('http')) {
      const u = new URL(url)
      return u.pathname + u.search
    }
  } catch {
    /* continua como relativo */
  }
  return url.startsWith('/') ? url : `/${url}`
}

function isAuthProxyPath(url: string | undefined): boolean {
  return pathFromRequestUrl(url).startsWith('/auth/')
}

/** Rotas sem JWT obrigatório (email-status, company-access). */
function isPublicAuthPath(path: string, method: string): boolean {
  const m = method.toLowerCase()
  if (m === 'post' && path === '/auth/email-status') return true
  if (m === 'get' && path.startsWith('/auth/company-access/')) return true
  return false
}

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  const isBrowser = typeof window !== 'undefined'
  const originalUrl = config.url || ''
  const authPath = pathFromRequestUrl(originalUrl)
  const method = config.method || 'get'

  // No browser, toda rota /auth/* passa pelo Route Handler /api/auth/* (evita 404 no Next quando
  // NEXT_PUBLIC_API_URL está ausente ou inválida e evita CORS quando a API é outro host).
  if (isBrowser && isAuthProxyPath(originalUrl)) {
    config.baseURL = ''
    config.url = `/api${relPathWithSearch(originalUrl)}`
    if (isPublicAuthPath(authPath, method)) {
      delete config.headers.Authorization
    } else {
      const token = localStorage.getItem('veltrix_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      } else {
        delete config.headers.Authorization
      }
    }
    return config
  }

  if (isBrowser) {
    if (isPublicAuthPath(authPath, method)) {
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
