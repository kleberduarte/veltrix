import api from '@/lib/api'
import { Cliente } from '@/types'

/** Payload alinhado ao backend: nome, e-mail, telefone e CPF obrigatórios (CPF só dígitos). */
export type ClientePayload = {
  nome: string
  email: string
  telefone: string
  cpf: string
  /** 8 dígitos, sem hífen; omitir se endereço só em texto ou vazio. */
  cep?: string
  endereco?: string
}

export const clienteService = {
  async getAll(q?: string): Promise<Cliente[]> {
    const { data } = await api.get('/clientes', { params: q ? { q } : undefined })
    return data
  },

  async getById(id: number): Promise<Cliente> {
    const { data } = await api.get(`/clientes/${id}`)
    return data
  },

  async create(payload: ClientePayload): Promise<Cliente> {
    const { data } = await api.post('/clientes', payload)
    return data
  },

  async update(id: number, payload: ClientePayload): Promise<Cliente> {
    const { data } = await api.put(`/clientes/${id}`, payload)
    return data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/clientes/${id}`)
  },

  async regenerarConvite(id: number): Promise<{ codigo: string }> {
    const { data } = await api.post(`/clientes/${id}/regenerar-convite`)
    return data
  },
}
