import { Fragment } from 'react'
import { CartItem } from '@/types'

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const num = 'font-numeric tabular-nums'

/** Larguras alinhadas entre cabeçalho e linhas — descrição com mínimo para não sobrepor textos. */
const CUPOM_ROW_GRID =
  'grid gap-x-2 grid-cols-[1.5rem_2.25rem_minmax(7.5rem,1fr)_2.25rem_4.5rem_4.5rem_2.75rem] sm:grid-cols-[1.75rem_2.5rem_minmax(9rem,1fr)_2.5rem_5rem_5rem_3rem]'

const HEADER_CELL =
  'text-[9px] font-bold uppercase leading-tight tracking-wide text-slate-500 sm:text-[10px] sm:tracking-wider'

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
  /** Cabeçalho sólido (ex.: cor primária do totem). Sem isso, mantém o gradiente do PDV. */
  headerSolidColor?: string
  /** Texto do cabeçalho sobre `headerSolidColor` (padrão: branco). */
  headerForeground?: string
  /** Destaque do valor total (totem / quiosque): pill rosa + texto vermelho forte. */
  kioskTotalHighlight?: boolean
  /**
   * Modo totem / touch: lista em cards (sem grade larga), sem scroll horizontal
   * e barras de rolagem ocultas (gesto de arrastar continua funcionando).
   */
  touchKiosk?: boolean
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
  headerSolidColor,
  headerForeground,
  kioskTotalHighlight,
  touchKiosk,
}: Props) {
  const hf = headerForeground ?? '#ffffff'
  const headerStyle = headerSolidColor
    ? { backgroundColor: headerSolidColor, color: hf }
    : undefined

  const listScrollClass =
    cart.length > 0
      ? 'scrollbar-touch-none overflow-y-auto overscroll-y-contain touch-pan-y'
      : 'overflow-hidden'

  return (
    <div
      className={`flex h-full flex-col rounded-2xl overflow-hidden bg-white shadow-[0_10px_34px_-12px_rgba(15,23,42,0.24)] ring-1 ring-slate-900/5 ${
        touchKiosk ? 'min-h-0' : 'min-h-[min(280px,45vh)] lg:min-h-0'
      }`}
      aria-label="Cupom fiscal — pré-visualização"
    >
      <header
        className={
          headerSolidColor
            ? 'shrink-0 rounded-t-2xl px-4 py-4'
            : 'shrink-0 relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-primary-700 via-primary-700 to-primary-900 px-4 py-4 text-white'
        }
        style={headerStyle}
      >
        {!headerSolidColor ? (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_120%_at_0%_0%,rgba(255,255,255,0.14),transparent)]" />
        ) : null}
        <div className={`relative text-center ${headerSolidColor ? '' : 'text-white'}`}>
          <p
            className={`text-[10px] font-semibold uppercase tracking-[0.32em] ${headerSolidColor ? '' : 'text-white/55'}`}
            style={headerSolidColor ? { color: hf, opacity: 0.92 } : undefined}
          >
            Documento auxiliar
          </p>
          <h3
            className={`mt-1 text-base font-bold tracking-[0.22em] sm:text-lg ${headerSolidColor ? '' : 'text-white'}`}
            style={headerSolidColor ? { color: hf } : undefined}
          >
            CUPOM FISCAL
          </h3>
          <p
            className={`mt-2 text-sm font-semibold tabular-nums sm:text-base ${headerSolidColor ? '' : 'text-white/95'}`}
            style={headerSolidColor ? { color: hf } : undefined}
          >
            {nomeEmpresa}
          </p>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-white via-slate-50/50 to-slate-100/40 pb-3 pt-2 text-gray-900">
        {touchKiosk ? (
          <>
            <p className="shrink-0 px-3 pb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Itens do pedido
            </p>
            <div className={`min-h-0 flex-1 px-2 sm:px-3 ${listScrollClass}`}>
              {loading ? (
                <p className="py-12 text-center text-sm text-slate-500">Carregando…</p>
              ) : cart.length === 0 ? (
                <div className="flex min-h-[11rem] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300/90 bg-slate-50/60 px-5 py-8 text-center">
                  <span className="text-4xl leading-none text-slate-400" aria-hidden>
                    🧾
                  </span>
                  <p className="mt-4 text-base font-semibold leading-snug text-slate-700">
                    Nenhum item na venda
                  </p>
                  <p className="mt-2 max-w-[18rem] text-sm leading-relaxed text-slate-500">
                    Toque nos produtos ao lado para montar seu pedido.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2.5 pb-1">
                  {cart.map((item, idx) => {
                    const lineTot = item.product.price * item.quantity
                    return (
                      <Fragment key={item.product.id}>
                        <li className="rounded-2xl border border-slate-200/95 bg-white p-3 shadow-sm">
                          <div className="flex gap-3">
                            <span
                              className={`mt-0.5 flex h-7 min-w-[1.5rem] items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500 ${num}`}
                            >
                              {idx + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[15px] font-semibold leading-snug text-slate-900">
                                {item.product.name}
                              </p>
                              <p className={`mt-1 text-xs text-slate-500 ${num}`}>
                                Cód. {item.product.id} · {item.quantity} × {fmt(item.product.price)}
                              </p>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-2">
                              <span className={`text-base font-bold text-primary-700 ${num}`}>{fmt(lineTot)}</span>
                              <button
                                type="button"
                                onClick={() => onRemoveLine(item.product.id)}
                                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition active:bg-red-50 active:text-red-600"
                                title="Remover item"
                                aria-label="Remover item"
                              >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          {farmacia && showFarmLines && (
                            <div className="mt-3 rounded-xl bg-amber-50/95 px-2 py-2">
                              <div className="flex flex-wrap items-center gap-2 text-[0.75rem] text-amber-950">
                                <span className="font-medium">Lote / validade:</span>
                                <input
                                  className="min-h-[40px] flex-1 rounded-lg border border-amber-200/80 bg-white px-2 py-2 text-[0.75rem] shadow-sm sm:max-w-[9rem]"
                                  placeholder="Lote"
                                  value={item.loteCodigo ?? ''}
                                  onChange={e => setCartLote(item.product.id, 'loteCodigo', e.target.value)}
                                />
                                <input
                                  type="date"
                                  className="min-h-[40px] rounded-lg border border-amber-200/80 bg-white px-2 py-2 text-[0.75rem] shadow-sm"
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
          </>
        ) : (
          <>
            {/* PDV: grade alinhada + scroll horizontal só se o painel for estreito */}
            <div className="flex min-h-0 flex-1 flex-col overflow-x-auto px-1 sm:px-3 scrollbar-touch-none">
              <div className="flex min-h-0 w-full min-w-[28rem] flex-1 flex-col">
                <div
                  className={`${CUPOM_ROW_GRID} shrink-0 items-center border-b border-dashed border-slate-300/90 px-2 py-2.5`}
                  aria-hidden
                >
                  <span className={`${HEADER_CELL} text-left`}>IT</span>
                  <span className={`${HEADER_CELL} text-left`}>CÓD</span>
                  <span className={`${HEADER_CELL} min-w-0 text-left`}>DESCRIÇÃO</span>
                  <span className={`${HEADER_CELL} text-right ${num}`}>QTD</span>
                  <span className={`${HEADER_CELL} text-right ${num}`}>UNIT.</span>
                  <span className={`${HEADER_CELL} text-right ${num}`}>TOTAL</span>
                  <span className={`${HEADER_CELL} text-center`}>AÇÃO</span>
                </div>

                <div className="min-h-[5rem] flex-1 overflow-y-auto overscroll-y-contain touch-pan-y">
                  {loading ? (
                    <p className="py-10 text-center text-sm text-slate-500">Carregando…</p>
                  ) : cart.length === 0 ? (
                    <div className="mx-auto mt-6 max-w-sm rounded-2xl border-2 border-dashed border-slate-300/90 bg-slate-50/50 px-4 py-10 text-center">
                      <p className="text-3xl leading-none text-slate-400" aria-hidden>
                        🧾
                      </p>
                      <p className="mt-3 text-sm font-semibold text-slate-600">Nenhum item na venda</p>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                        Adicione produtos para visualizar o cupom.
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {cart.map((item, idx) => {
                        const lineTot = item.product.price * item.quantity
                        return (
                          <Fragment key={item.product.id}>
                            <li>
                              <div
                                className={`group ${CUPOM_ROW_GRID} items-center px-2 py-2.5 text-[0.8125rem] transition-colors hover:bg-primary-50/60 sm:text-sm`}
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
              </div>
            </div>
          </>
        )}

        <footer className="mt-auto shrink-0 space-y-2 rounded-xl border border-slate-200/90 bg-white px-3 py-3 shadow-sm sm:mx-3 sm:px-4">
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
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">TOTAL</span>
            <span
              className={`${num} text-xl font-bold tracking-tight sm:text-2xl ${
                kioskTotalHighlight
                  ? 'rounded-full bg-rose-100 px-3 py-1.5 text-red-600'
                  : 'rounded-lg bg-primary-50 px-2.5 py-1 text-primary-700'
              }`}
            >
              {fmt(total)}
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}
