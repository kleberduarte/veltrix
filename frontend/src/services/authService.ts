import api from '@/lib/api'
import { saveAuth, removeAuth, AuthUser, getAuth, getLogoutRedirectPath } from '@/lib/auth'

export type MeResponse = {
  userId: number
  name: string
  email: string
  companyId: number
  companyName: string
  accessToken?: string | null
  role: string
  mustChangePassword?: boolean
  inviteSelfRegistration?: boolean
  telefone?: string | null
  pdvTerminalId?: number | null
  pdvTerminalCodigo?: string | null
}

export type RegisterPayload = {
  name: string
  email: string
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
    const inviteFlag =
      me.inviteSelfRegistration === true
        ? true
        : me.inviteSelfRegistration === false
          ? false
          : !!getAuth()?.inviteSelfRegistration

    const u: AuthUser = {
      name: me.name,
      email: me.email,
      companyId: me.companyId,
      companyName: me.companyName,
      accessToken: me.accessToken ?? null,
      token,
      role: me.role,
      mustChangePassword: !!me.mustChangePassword,
      inviteSelfRegistration: inviteFlag,
      pdvTerminalId: me.pdvTerminalId ?? null,
      pdvTerminalCodigo: me.pdvTerminalCodigo ?? null,
    }
    saveAuth(u)
  },

  async getEmailStatus(email: string): Promise<{ exists: boolean; requiresPasswordSetup: boolean }> {
    const { data } = await api.post('/auth/email-status', { email })
    return data
  },

  /** Usuário com mustChangePassword: troca senha provisória pela definitiva sem JWT prévio. */
  async setupInitialPassword(email: string, senhaProvisoria: string, novaSenha: string) {
    const { data } = await api.post('/auth/definir-senha-inicial', {
      email,
      senhaProvisoria,
      novaSenha,
    })
    saveAuth({
      name: data.name,
      email: data.email,
      companyId: data.companyId,
      companyName: data.companyName,
      accessToken: data.accessToken ?? null,
      token: data.token,
      role: data.role,
      mustChangePassword: !!data.mustChangePassword,
    })
    if (typeof window !== 'undefined') sessionStorage.removeItem('veltrix_me_synced')
    try {
      const { data: me } = await api.get<MeResponse>('/auth/me')
      this.syncAuthFromMe(me, data.token)
      if (typeof window !== 'undefined') sessionStorage.setItem('veltrix_me_synced', '1')
    } catch {
      /* AppLayout pode sincronizar depois */
    }
    return data
  },

  async login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password })
    saveAuth({
      name: data.name,
      email: data.email,
      companyId: data.companyId,
      companyName: data.companyName,
      accessToken: data.accessToken ?? null,
      token: data.token,
      role: data.role,
      mustChangePassword: !!data.mustChangePassword,
    })
    if (typeof window !== 'undefined') sessionStorage.removeItem('veltrix_me_synced')
    try {
      const { data: me } = await api.get<MeResponse>('/auth/me')
      this.syncAuthFromMe(me, data.token)
      if (typeof window !== 'undefined') sessionStorage.setItem('veltrix_me_synced', '1')
    } catch {
      /* AppLayout pode sincronizar depois */
    }
    return data
  },

  async register(payload: RegisterPayload) {
    const { data } = await api.post('/auth/register', payload)
    saveAuth({
      name: data.name,
      email: data.email,
      companyId: data.companyId,
      companyName: data.companyName,
      accessToken: data.accessToken ?? null,
      token: data.token,
      role: data.role,
      mustChangePassword: !!data.mustChangePassword,
      inviteSelfRegistration: !!(data as { inviteSelfRegistration?: boolean }).inviteSelfRegistration,
    })
    if (typeof window !== 'undefined') sessionStorage.removeItem('veltrix_me_synced')
    try {
      const { data: me } = await api.get<MeResponse>('/auth/me')
      this.syncAuthFromMe(me, data.token)
      if (typeof window !== 'undefined') sessionStorage.setItem('veltrix_me_synced', '1')
    } catch {
      /* ignore */
    }
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
      accessToken: data.accessToken ?? null,
      token: data.token,
      role: data.role,
      mustChangePassword: !!data.mustChangePassword,
      inviteSelfRegistration: !!(data as { inviteSelfRegistration?: boolean }).inviteSelfRegistration,
    })
    if (typeof window !== 'undefined') sessionStorage.removeItem('veltrix_me_synced')
    try {
      const { data: me } = await api.get<MeResponse>('/auth/me')
      this.syncAuthFromMe(me, data.token)
      if (typeof window !== 'undefined') sessionStorage.setItem('veltrix_me_synced', '1')
    } catch {
      /* ignore */
    }
    return data
  },

  /** Primeiro acesso após cadastro só com código de convite PDV (sem senha no formulário). */
  async definirPrimeiraSenhaConvite(novaSenha: string) {
    const { data } = await api.post('/auth/primeira-senha-convite', { novaSenha })
    saveAuth({
      name: data.name,
      email: data.email,
      companyId: data.companyId,
      companyName: data.companyName,
      accessToken: data.accessToken ?? null,
      token: data.token,
      role: data.role,
      mustChangePassword: !!data.mustChangePassword,
      inviteSelfRegistration: !!(data as { inviteSelfRegistration?: boolean }).inviteSelfRegistration,
    })
    if (typeof window !== 'undefined') sessionStorage.removeItem('veltrix_me_synced')
    try {
      const { data: me } = await api.get<MeResponse>('/auth/me')
      this.syncAuthFromMe(me, data.token)
      if (typeof window !== 'undefined') sessionStorage.setItem('veltrix_me_synced', '1')
    } catch {
      /* ignore */
    }
    return data
  },

  logout(): string {
    const redirectPath = getLogoutRedirectPath()
    removeAuth()
    return redirectPath
  },

  /** Alterna o tenant (empresa) no JWT — Adm Global pode escolher qualquer empresa; demais só a própria. */
  async switchCompany(companyId: number) {
    const { data } = await api.post('/auth/switch-company', { companyId })
    saveAuth({
      name: data.name,
      email: data.email,
      companyId: data.companyId,
      companyName: data.companyName,
      accessToken: data.accessToken ?? null,
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
  async createCompany(name: string): Promise<{
    id: number
    name: string
    accessToken?: string
    pdvInviteCode?: string | null
  }> {
    const { data } = await api.post('/auth/companies', { name })
    return data
  },

  /** Busca informações públicas da empresa pelo link exclusivo de acesso (sem autenticação). */
  async getCompanyAccessInfo(token: string): Promise<{
    companyId: number
    companyName: string
    nomeEmpresa: string
    logoUrl?: string | null
    corPrimaria: string
    corSecundaria: string
    corBotao: string
    corBotaoTexto: string
  }> {
    const { data } = await api.get(`/auth/company-access/${token}`)
    return data
  },
}
