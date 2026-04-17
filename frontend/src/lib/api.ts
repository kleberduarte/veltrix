import axios, { type InternalAxiosRequestConfig } from 'axios'
import { getLogoutRedirectPath } from '@/lib/auth'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

/** Rotas que devem ir sem JWT (login, cadastro, checagem de e-mail), mesmo com token antigo no localStorage. */
function isPublicAuthRequest(config: InternalAxiosRequestConfig): boolean {
  const raw = config.url || ''
  const path = raw.startsWith('http') ? new URL(raw).pathname : raw.split('?')[0]
  const method = (config.method || 'get').toLowerCase()

  if (
    method === 'post' &&
    ['/auth/login', '/auth/register', '/auth/email-status', '/auth/definir-senha-inicial'].includes(path)
  ) {
    return true
  }
  if (method === 'get' && path.startsWith('/auth/company-access/')) return true
  return false
}

api.interceptors.request.use((config) => {
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
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const redirectPath = getLogoutRedirectPath()
      localStorage.removeItem('veltrix_token')
      localStorage.removeItem('veltrix_user')
      window.location.href = redirectPath
    }
    return Promise.reject(error)
  }
)

export default api
