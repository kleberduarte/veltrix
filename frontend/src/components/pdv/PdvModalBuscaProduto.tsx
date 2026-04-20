'use client'
import { useEffect, useMemo, useState } from 'react'
import ProductThumb from '@/components/product/ProductThumb'
import { Product } from '@/types'

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

type Props = {
  open: boolean
  onClose: () => void
  products: Product[]
  loading: boolean
  onPick: (p: Product) => void
}

export default function PdvModalBuscaProduto({ open, onClose, products, loading, onPick }: Props) {
  const [q, setQ] = useState('')

  useEffect(() => {
    if (open) setQ('')
  }, [open])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return products
    const byNum = /^\d+$/.test(s) ? Number(s) : null
    return products.filter(p => {
      if (byNum !== null && p.id === byNum) return true
      return p.name.toLowerCase().includes(s)
    })
  }, [products, q])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdv-modal-f8-titulo"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[min(88dvh,720px)] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200/80 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="shrink-0 flex items-center justify-between gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-4 py-3 sm:px-5">
          <h2 id="pdv-modal-f8-titulo" className="text-base sm:text-lg font-bold text-gray-900">
            Pesquisar produto (F8)
          </h2>
          <button
            type="button"
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 text-xl leading-none"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        <div className="p-4 space-y-3 border-b border-gray-100">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-3 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/35 min-h-[48px]"
            placeholder="Nome ou código interno do produto…"
            autoFocus
            autoComplete="off"
          />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4">
          {loading ? (
            <p className="text-center text-gray-500 py-8">Carregando produtos…</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Nenhum produto encontrado</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                  <th className="pb-2 w-14 font-semibold">
                    <span className="sr-only">Foto</span>
                  </th>
                  <th className="pb-2 font-semibold">Cód</th>
                  <th className="pb-2 font-semibold">Nome</th>
                  <th className="pb-2 font-semibold text-right">Preço</th>
                  <th className="pb-2 font-semibold w-24">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.slice(0, 200).map(p => (
                  <tr key={p.id} className="hover:bg-primary-50/50">
                    <td className="py-2 align-middle">
                      <ProductThumb imagemUrl={p.imagemUrl} size={36} />
                    </td>
                    <td className="py-2 font-mono text-xs text-gray-600">{p.id}</td>
                    <td className="py-2 font-medium text-gray-900">{p.name}</td>
                    <td className="py-2 text-right font-numeric tabular-nums text-primary-700 font-semibold">{fmt(p.price)}</td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => {
                          onPick(p)
                          onClose()
                        }}
                        className="rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-3 py-1.5"
                      >
                        Incluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
