import { Fragment } from 'react'
import { CartItem } from '@/types'

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const num = 'font-numeric tabular-nums'

type Props = {
  nomeEmpresa: string
  cart: CartItem[]
  subtotal: number
  desconto: number
  total: number
  loading?: boolean
  farmacia?: boolean
  showFarmLines?: boolean
  onRemoveLine: (productId: number) => void
  setCartLote: (productId: number, field: 'loteCodigo' | 'loteValidade', value: string) => void
}

export default function PdvCupomThermal({
  nomeEmpresa,
  cart,
  subtotal,
  desconto,
  total,
  loading,
  farmacia,
  showFarmLines,
  onRemoveLine,
  setCartLote,
}: Props) {
  return (
    <div
      className="flex flex-col h-full min-h-[min(280px,45vh)] lg:min-h-0 rounded-2xl overflow-hidden bg-white shadow-[0_10px_34px_-12px_rgba(15,23,42,0.24)] ring-1 ring-slate-900/5"
      aria-label="Cupom fiscal — pré-visualização"
    >
      <header className="shrink-0 relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-primary-700 via-primary-700 to-primary-900 px-4 py-4 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_120%_at_0%_0%,rgba(255,255,255,0.14),transparent)]" />
        <div className="relative text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/55">Documento auxiliar</p>
          <h3 className="mt-1 text-base font-bold tracking-[0.2em] text-white sm:text-lg">CUPOM FISCAL</h3>
          <p className="mt-2 text-sm font-semibold tabular-nums text-white/95 sm:text-base">{nomeEmpresa}</p>
        </div>
      </header>

      <div className="flex flex-col flex-1 min-h-0 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/40 px-2 pb-3 pt-2 text-gray-900 sm:px-3">
        {/* Mesmo grid para cabeçalho e linhas — evita desalinhamento entre table e grid */}
        <div
          className="grid grid-cols-[2rem_2.25rem_minmax(0,1fr)_2.5rem_4.5rem_4.75rem_2.75rem] gap-x-2 items-center border-b border-dashed border-slate-300/90 px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:grid-cols-[2.25rem_2.5rem_minmax(0,1fr)_2.75rem_5rem_5rem_3rem] sm:text-[11px]"
          aria-hidden
        >
          <span className="text-left">It</span>
          <span className="text-left">Cód</span>
          <span className="min-w-0 pl-0.5 text-left">Descrição</span>
          <span className={`text-right ${num}`}>Qtd</span>
          <span className={`text-right ${num}`}>Unit.</span>
          <span className={`text-right ${num}`}>Total</span>
          <span className="text-center">Ação</span>
        </div>

        <div className="flex-1 min-h-[5rem] overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y">
          {loading ? (
            <p className="text-center text-slate-500 py-10 text-sm">Carregando…</p>
          ) : cart.length === 0 ? (
            <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-dashed border-slate-300 bg-white/80 px-4 py-8 text-center">
              <p className="text-2xl leading-none text-slate-300" aria-hidden>
                🧾
              </p>
              <p className="mt-2 text-sm font-medium text-slate-500">Nenhum item na venda</p>
              <p className="mt-1 text-xs text-slate-400">Adicione produtos para visualizar o cupom.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {cart.map((item, idx) => {
                const lineTot = item.product.price * item.quantity
                return (
                  <Fragment key={item.product.id}>
                    <li>
                      <div
                        className="group grid grid-cols-[2rem_2.25rem_minmax(0,1fr)_2.5rem_4.5rem_4.75rem_2.75rem] gap-x-2 items-center px-2 py-2.5 text-[0.8125rem] transition-colors hover:bg-primary-50/60 sm:grid-cols-[2.25rem_2.5rem_minmax(0,1fr)_2.75rem_5rem_5rem_3rem] sm:text-sm"
                      >
                        <span className={`text-slate-500 ${num} text-xs`}>{idx + 1}</span>
                        <span className={`text-slate-600 ${num} text-xs`}>{item.product.id}</span>
                        <span
                          className="min-w-0 truncate font-semibold text-slate-900"
                          title={item.product.name}
                        >
                          {item.product.name}
                        </span>
                        <span className={`text-right text-slate-800 ${num}`}>{item.quantity}</span>
                        <span className={`text-right text-slate-600 ${num}`}>{fmt(item.product.price)}</span>
                        <span className={`text-right font-bold text-primary-700 ${num}`}>{fmt(lineTot)}</span>
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => onRemoveLine(item.product.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-slate-400 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            title="Remover linha"
                            aria-label="Remover item"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {farmacia && showFarmLines && (
                        <div className="border-b border-slate-100 bg-amber-50/90 px-2 py-2 sm:py-1.5">
                          <div className="flex flex-wrap items-center gap-2 text-[0.7rem] text-amber-950">
                            <span className="font-medium">Lote / validade:</span>
                            <input
                              className="w-28 rounded-lg border border-amber-200/80 bg-white px-2 py-1 text-[0.7rem] shadow-sm"
                              placeholder="Lote"
                              value={item.loteCodigo ?? ''}
                              onChange={e => setCartLote(item.product.id, 'loteCodigo', e.target.value)}
                            />
                            <input
                              type="date"
                              className="rounded-lg border border-amber-200/80 bg-white px-2 py-1 text-[0.7rem] shadow-sm"
                              value={item.loteValidade?.slice(0, 10) ?? ''}
                              onChange={e => setCartLote(item.product.id, 'loteValidade', e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </li>
                  </Fragment>
                )
              })}
            </ul>
          )}
        </div>

        <footer className="shrink-0 mt-auto space-y-2 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-[0_-1px_0_rgba(15,23,42,0.02)] sm:px-4">
          <div className="flex justify-between text-sm text-slate-600">
            <span className="font-medium">Subtotal</span>
            <span className={`${num} font-medium text-slate-900`}>{fmt(subtotal)}</span>
          </div>
          {desconto > 0 && (
            <div className="flex justify-between text-sm text-amber-800">
              <span className="font-medium">Desconto</span>
              <span className={`${num} font-semibold`}>− {fmt(desconto)}</span>
            </div>
          )}
          <div className="flex justify-between items-center border-t border-slate-200 pt-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total</span>
            <span className={`${num} rounded-lg bg-primary-50 px-2.5 py-1 text-xl font-bold tracking-tight text-primary-700 sm:text-2xl`}>
              {fmt(total)}
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}
