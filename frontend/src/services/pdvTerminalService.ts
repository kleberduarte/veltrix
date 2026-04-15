import api from '@/lib/api'
import { PdvTerminal } from '@/types'
import type { StatusCaixa } from '@/types'

export type PdvTerminalPayload = {
  codigo: string
  nome: string
  ativo?: boolean
}

export const pdvTerminalService = {
  async getAll(): Promise<PdvTerminal[]> {
    const { data } = await api.get('/pdv-terminais')
    return data
  },

  /** Terminais ativos de uma empresa (Adm Global: qualquer ID; demais: só a própria). */
  async listByEmpresa(companyId: number): Promise<PdvTerminal[]> {
    const { data } = await api.get(`/pdv-terminais/empresa/${companyId}`)
    return data
  },

  async create(payload: PdvTerminalPayload): Promise<PdvTerminal> {
    const { data } = await api.post('/pdv-terminais', payload)
    return data
  },

  async update(id: number, payload: PdvTerminalPayload): Promise<PdvTerminal> {
    const { data } = await api.put(`/pdv-terminais/${id}`, payload)
    return data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/pdv-terminais/${id}`)
  },

  async heartbeat(id: number, statusCaixa?: StatusCaixa): Promise<void> {
    await api.post(`/pdv-terminais/${id}/heartbeat`, statusCaixa ? { statusCaixa } : {})
  },
}
