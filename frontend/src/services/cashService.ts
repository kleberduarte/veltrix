import api from '@/lib/api'
import { CashFlow } from '@/types'

export const cashService = {
  async getAll(): Promise<CashFlow[]> {
    const { data } = await api.get('/cash')
    return data
  },

  async create(payload: { type: string; amount: number; description?: string }): Promise<CashFlow> {
    const { data } = await api.post('/cash', payload)
    return data
  },
}
