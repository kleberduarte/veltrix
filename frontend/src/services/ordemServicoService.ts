import api from '@/lib/api'
import { OrdemServico, StatusOrdemServico } from '@/types'

export type OrdemServicoPayload = {
  clienteId?: number
  nomeCliente: string
  telefoneCliente?: string
  contatoCliente?: string
  equipamento?: string
  marca?: string
  modelo?: string
  numeroSerie?: string
  acessorios?: string
  defeitoRelatado?: string
  diagnostico?: string
  servicoExecutado?: string
  tecnicoResponsavel?: string
  observacao?: string
  valorServico?: number | null
  desconto?: number | null
  dataPrevisaoEntrega?: string | null
}

export const ordemServicoService = {
  async getAll(status?: StatusOrdemServico): Promise<OrdemServico[]> {
    const { data } = await api.get('/ordens-servico', { params: status ? { status } : undefined })
    return data
  },

  async getById(id: number): Promise<OrdemServico> {
    const { data } = await api.get(`/ordens-servico/${id}`)
    return data
  },

  async create(payload: OrdemServicoPayload): Promise<OrdemServico> {
    const { data } = await api.post('/ordens-servico', payload)
    return data
  },

  async update(id: number, payload: OrdemServicoPayload): Promise<OrdemServico> {
    const { data } = await api.put(`/ordens-servico/${id}`, payload)
    return data
  },

  async updateStatus(id: number, status: StatusOrdemServico): Promise<OrdemServico> {
    const { data } = await api.patch(`/ordens-servico/${id}/status`, { status })
    return data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/ordens-servico/${id}`)
  },
}
