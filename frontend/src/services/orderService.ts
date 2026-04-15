import api from '@/lib/api'
import { FormaPagamento, Order } from '@/types'

export type OrderLinePayload = {
  productId: number
  quantity: number
  loteCodigo?: string
  loteValidade?: string
  receitaTipo?: string
  receitaNumero?: string
  receitaPrescritor?: string
  receitaData?: string
}

export type CreateOrderPayload = {
  items: OrderLinePayload[]
  formaPagamento?: FormaPagamento
  parcelas?: number
  chavePix?: string
  cpfCliente?: string
  clienteId?: number
  desconto?: number
  terminalId?: number
}

export const orderService = {
  async getAll(params?: { from?: string; to?: string }): Promise<Order[]> {
    const { data } = await api.get('/orders', {
      params: params?.from && params?.to ? { from: params.from, to: params.to } : undefined,
    })
    return data
  },

  async create(payload: CreateOrderPayload): Promise<Order> {
    const { data } = await api.post('/orders', payload)
    return data
  },
}
