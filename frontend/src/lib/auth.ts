export interface AuthUser {
  name: string
  email: string
  companyId: number
  companyName: string
  accessToken?: string | null
  token: string
  role?: string
  mustChangePassword?: boolean
  /** Cadastro com código PDV sem senha no login — só define senha nesta tela (sem senha provisória). */
  inviteSelfRegistration?: boolean
  pdvTerminalId?: number | null
  pdvTerminalCodigo?: string | null
}

export function saveAuth(user: AuthUser) {
  localStorage.setItem('veltrix_token', user.token)
  localStorage.setItem('veltrix_user', JSON.stringify(user))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('veltrix-auth-changed'))
  }
}

export function getAuth(): AuthUser | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('veltrix_user')
  return raw ? JSON.parse(raw) : null
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('veltrix_token')
}

export function removeAuth() {
  localStorage.removeItem('veltrix_token')
  localStorage.removeItem('veltrix_user')
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem('veltrix_me_synced')
    } catch {
      /* ignore */
    }
  }
}

export function getLogoutRedirectPath(user?: AuthUser | null): string {
  const current = user ?? getAuth()
  const token = current?.accessToken?.trim()
  const companyName = (current?.companyName ?? '').trim().toLowerCase()
  const isDefaultCompany = companyName === 'default' || companyName === 'sistema'
  return token && !isDefaultCompany ? `/acesso/${token}` : '/login'
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

export function mustChangePasswordNow(): boolean {
  return !!getAuth()?.mustChangePassword
}

export function updateStoredUser(partial: Partial<AuthUser>) {
  const cur = getAuth()
  if (!cur) return
  saveAuth({ ...cur, ...partial })
}
