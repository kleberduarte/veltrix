import api from '@/lib/api'
import { ProdutoLote } from '@/types'

export type ProdutoLotePayload = {
  productId: number
  codigoLote: string
  validade?: string | null
  quantidadeAtual: number
}

export const produtoLoteService = {
  async findByProduto(productId: number): Promise<ProdutoLote[]> {
    const { data } = await api.get(`/produto-lotes/produto/${productId}`)
    return data
  },

  async create(payload: ProdutoLotePayload): Promise<ProdutoLote> {
    const { data } = await api.post('/produto-lotes', payload)
    return data
  },

  async update(id: number, payload: ProdutoLotePayload): Promise<ProdutoLote> {
    const { data } = await api.put(`/produto-lotes/${id}`, payload)
    return data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/produto-lotes/${id}`)
  },
}
