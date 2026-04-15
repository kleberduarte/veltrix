import api from '@/lib/api'
import { FechamentoCaixaRow, ResumoDia } from '@/types'

export const fechamentoCaixaService = {
  async resumoHoje(): Promise<ResumoDia> {
    const { data } = await api.get('/fechamentos-caixa/resumo-hoje')
    return data
  },

  async fechar(payload: { terminalId?: number | null; valorInformadoDinheiro?: number | null }): Promise<FechamentoCaixaRow> {
    const { data } = await api.post('/fechamentos-caixa/fechar', payload)
    return data
  },

  async historico(): Promise<FechamentoCaixaRow[]> {
    const { data } = await api.get('/fechamentos-caixa/historico')
    return data
  },
}
