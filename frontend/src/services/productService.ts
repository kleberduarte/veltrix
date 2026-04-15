import api from '@/lib/api'
import { Product, TipoProduto, TipoControle } from '@/types'

export type ProductPayload = {
  name: string
  price: number
  stock: number
  codigoProduto?: string
  gtinEan?: string
  descricao?: string
  categoria?: string
  estoqueMinimo?: number
  tipo?: TipoProduto
  tipoControle?: TipoControle
  exigeReceita?: boolean
  exigeLote?: boolean
  exigeValidade?: boolean
  registroMs?: string
  pmc?: number | null
}

export const productService = {
  async getAll(): Promise<Product[]> {
    const { data } = await api.get('/products')
    return data
  },

  async create(payload: ProductPayload): Promise<Product> {
    const { data } = await api.post('/products', payload)
    return data
  },

  async update(id: number, payload: ProductPayload): Promise<Product> {
    const { data } = await api.put(`/products/${id}`, payload)
    return data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/products/${id}`)
  },

  async removeAll(): Promise<void> {
    await api.delete('/products')
  },
}
