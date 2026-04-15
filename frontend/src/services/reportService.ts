import api from '@/lib/api'
import { DailyReport } from '@/types'

export const reportService = {
  async getDaily(): Promise<DailyReport> {
    const { data } = await api.get('/reports/daily')
    return data
  },

  /** Soma vendas e caixa no intervalo [from, to] (datas ISO yyyy-MM-dd). */
  async getPeriod(from: string, to: string): Promise<DailyReport> {
    const { data } = await api.get('/reports/period', { params: { from, to } })
    return data
  },
}
