import api from '@/lib/api'
import { saveAuth, removeAuth, AuthUser } from '@/lib/auth'

export type MeResponse = {
  userId: number
  name: string
  email: string
  companyId: number
  companyName: string
  role: string
  mustChangePassword?: boolean
  telefone?: string | null
}

export type RegisterPayload = {
  name: string
  email: string
  password: string
  codigoConvite: string
}

export type PdvInviteResponse = {
  companyId: number
  companyName: string
  codigo: string | null
}

export const authService = {
  /** Sessão atual (requer JWT). */
  async me(): Promise<MeResponse> {
    const { data } = await api.get('/auth/me')
    return data
  },

  /** Sincroniza dados do usuário no localStorage após /auth/me. */
  syncAuthFromMe(me: MeResponse, token: string) {
    const u: AuthUser = {
      name: me.name,
      email: me.email,
      companyId: me.companyId,
      companyName: me.companyName,
      token,
      role: me.role,
      mustChangePassword: !!me.mustChangePassword,
    }
    saveAuth(u)
  },

  async login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password })
    saveAuth({
      name: data.name,
      email: data.email,
      companyId: data.companyId,
      companyName: data.companyName,
      token: data.token,
      role: data.role,
      mustChangePassword: !!data.mustChangePassword,
    })
    if (typeof window !== 'undefined') sessionStorage.removeItem('veltrix_me_synced')
    return data
  },

  async register(payload: RegisterPayload) {
    const { data } = await api.post('/auth/register', payload)
    saveAuth({
      name: data.name,
      email: data.email,
      companyId: data.companyId,
      companyName: data.companyName,
      token: data.token,
      role: data.role,
      mustChangePassword: !!data.mustChangePassword,
    })
    if (typeof window !== 'undefined') sessionStorage.removeItem('veltrix_me_synced')
    return data
  },

  async getPdvInvite(): Promise<PdvInviteResponse> {
    const { data } = await api.get('/auth/pdv-invite')
    return data
  },

  async regeneratePdvInvite(): Promise<PdvInviteResponse> {
    const { data } = await api.post('/auth/pdv-invite')
    return data
  },

  async changePassword(senhaAtual: string, novaSenha: string) {
    const { data } = await api.post('/auth/trocar-senha', { senhaAtual, novaSenha })
    saveAuth({
      name: data.name,
      email: data.email,
      companyId: data.companyId,
      companyName: data.companyName,
      token: data.token,
      role: data.role,
      mustChangePassword: !!data.mustChangePassword,
    })
    if (typeof window !== 'undefined') sessionStorage.removeItem('veltrix_me_synced')
    return data
  },

  logout() {
    removeAuth()
  },

  /** Alterna o tenant (empresa) no JWT — Adm Global pode escolher qualquer empresa; demais só a própria. */
  async switchCompany(companyId: number) {
    const { data } = await api.post('/auth/switch-company', { companyId })
    saveAuth({
      name: data.name,
      email: data.email,
      companyId: data.companyId,
      companyName: data.companyName,
      token: data.token,
      role: data.role,
      mustChangePassword: !!data.mustChangePassword,
    })
    if (typeof window !== 'undefined') sessionStorage.removeItem('veltrix_me_synced')
    return data
  },

  /** Exclui uma empresa e todos os seus dados (somente Adm Global). */
  async deleteCompany(id: number): Promise<void> {
    await api.delete(`/auth/companies/${id}`)
  },

  /** Cadastra nova empresa (somente Adm Global). */
  async createCompany(name: string): Promise<{ id: number; name: string; onboardingToken?: string }> {
    const { data } = await api.post('/auth/companies', { name })
    return data
  },

  /** Retorna o token de onboarding de uma empresa (somente Adm Global). */
  async getCompanyOnboarding(companyId: number): Promise<{ id: number; name: string; onboardingToken?: string }> {
    const { data } = await api.get(`/auth/companies/${companyId}/onboarding`)
    return data
  },

  /** Regenera o token de onboarding de uma empresa (somente Adm Global). */
  async regenerateOnboarding(companyId: number): Promise<{ id: number; name: string; onboardingToken?: string }> {
    const { data } = await api.post(`/auth/companies/${companyId}/onboarding`)
    return data
  },

  /** Busca informações públicas da empresa pelo token de onboarding (sem autenticação). */
  async getOnboardingInfo(token: string): Promise<{
    companyId: number
    companyName: string
    nomeEmpresa: string
    logoUrl?: string | null
    corPrimaria: string
    corSecundaria: string
    corBotao: string
    corBotaoTexto: string
  }> {
    const { data } = await api.get(`/auth/onboarding/${token}`)
    return data
  },

  /** Registra o ADMIN_EMPRESA via link de onboarding (sem autenticação). */
  async registerViaOnboarding(token: string, payload: { name: string; email: string; password: string; telefone?: string }) {
    const { data } = await api.post(`/auth/onboarding/${token}`, payload)
    saveAuth({
      name: data.name,
      email: data.email,
      companyId: data.companyId,
      companyName: data.companyName,
      token: data.token,
      role: data.role,
      mustChangePassword: !!data.mustChangePassword,
    })
    if (typeof window !== 'undefined') sessionStorage.removeItem('veltrix_me_synced')
    return data
  },
}
