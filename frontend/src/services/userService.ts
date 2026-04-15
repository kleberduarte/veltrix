import api from '@/lib/api'
import { AppUser, CompanyOption, Role } from '@/types'

export type CreateUserPayload = {
  name: string
  email: string
  password?: string
  role: Role
  telefone?: string
  mustChangePassword?: boolean
  companyId?: number
  pdvTerminalId?: number
}

export type UpdateUserPayload = {
  name?: string
  email?: string
  role?: Role
  password?: string | null
  telefone?: string | null
  companyId?: number
  pdvTerminalId?: number | null
  desvincularPdv?: boolean
  aplicarTelefone?: boolean
}

export type CreateUserResponse = AppUser & {
  senhaTemporaria?: string | null
  companyName?: string | null
}

export const userService = {
  async listCompanies(): Promise<CompanyOption[]> {
    const { data } = await api.get('/auth/companies')
    return data
  },

  async list(): Promise<AppUser[]> {
    const { data } = await api.get('/auth/users')
    return data
  },

  async create(payload: CreateUserPayload): Promise<CreateUserResponse> {
    const { data } = await api.post('/auth/users', payload)
    return data
  },

  async update(id: number, payload: UpdateUserPayload): Promise<AppUser> {
    const { data } = await api.put(`/auth/users/${id}`, payload)
    return data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/auth/users/${id}`)
  },
}
