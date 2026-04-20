'use client'

import Image from 'next/image'
import type { RefObject } from 'react'
import { useMemo } from 'react'
import { appAlert } from '@/lib/dialogs'
import type { Cliente, FormaPagamento } from '@/types'

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const FORMAS_BASE: { value: FormaPagamento; label: string }[] = [
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'DEBITO', label: 'Débito' },
  { value: 'PIX', label: 'Pix' },
  { value: 'CARTAO', label: 'Cartão' },
]

function iconFormaPagamento(f: FormaPagamento) {
  if (f === 'DINHEIRO') return '💵'
  if (f === 'DEBITO') return '🪪'
  if (f === 'PIX') return '📱'
  if (f === 'VOUCHER') return '🎫'
  return '💳'
}

const labelClass = 'block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1'
const fieldClass =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 sm:py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 min-h-[44px] sm:min-h-0'

type Props = {
  open: boolean
  onClose: () => void
  forma: FormaPagamento
  setForma: (f: FormaPagamento) => void
  parcelas: number
  setParcelas: (n: number) => void
  chavePix: string
  setChavePix: (s: string) => void
  desconto: string
  setDesconto: (s: string) => void
  cpfCliente: string
  setCpfCliente: (s: string) => void
  clienteBusca: string
  setClienteBusca: (s: string) => void
  clientesOpts: Cliente[]
  onBuscarClientes: () => void
  onSelectCliente: (c: Cliente) => void
  farmacia: boolean
  /** Ex.: módulo Fast Food — permite vale refeição (voucher). */
  fastFood: boolean
  showFarmLines: boolean
  setShowFarmLines: (v: boolean | ((prev: boolean) => boolean)) => void
  subtotalCart: number
  descontoNum: number
  total: number
  pixQrDataUrl: string | null
  pixQrError: string | null
  pixPayload: string | null
  finishing: boolean
  cartLength: number
  onFinalize: () => void
  cpfPagamentoRef: RefObject<HTMLInputElement>
  clienteModalInputRef: RefObject<HTMLInputElement>
}

export default function PdvPagamentoModal({
  open,
  onClose,
  forma,
  setForma,
  parcelas,
  setParcelas,
  chavePix,
  setChavePix,
  desconto,
  setDesconto,
  cpfCliente,
  setCpfCliente,
  clienteBusca,
  setClienteBusca,
  clientesOpts,
  onBuscarClientes,
  onSelectCliente,
  farmacia,
  fastFood,
  showFarmLines,
  setShowFarmLines,
  subtotalCart,
  descontoNum,
  total,
  pixQrDataUrl,
  pixQrError,
  pixPayload,
  finishing,
  cartLength,
  onFinalize,
  cpfPagamentoRef,
  clienteModalInputRef,
}: Props) {
  const formas = useMemo(() => {
    if (!fastFood) return FORMAS_BASE
    return [...FORMAS_BASE, { value: 'VOUCHER' as const, label: 'Vale refeição' }]
  }, [fastFood])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdv-modal-pagamento-titulo"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[min(92dvh,880px)] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200/80 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="shrink-0 flex items-center justify-between gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-4 py-3 sm:px-5">
          <h2 id="pdv-modal-pagamento-titulo" className="text-base sm:text-lg font-bold text-gray-900">
            Finalizar venda
            <span className="ml-2 text-xs font-semibold text-gray-400">(F10)</span>
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

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="grid gap-5 p-4 sm:p-6 md:grid-cols-2 md:gap-8">
            <div className="space-y-4 min-w-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Formas de pagamento</h3>
              <div className="grid grid-cols-2 gap-2">
                {formas.map(f => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setForma(f.value)}
                    className={[
                      'flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition-all min-h-[48px]',
                      forma === f.value
                        ? 'border-primary-500 bg-primary-50 text-primary-900 shadow-md shadow-primary-600/10 ring-2 ring-primary-500/25'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50/80',
                    ].join(' ')}
                  >
                    <span className="text-lg" aria-hidden>
                      {iconFormaPagamento(f.value)}
                    </span>
                    {f.label}
                  </button>
                ))}
              </div>

              {forma === 'CARTAO' && (
                <div>
                  <label className={labelClass}>Parcelas</label>
                  <select
                    value={parcelas}
                    onChange={e => setParcelas(Number(e.target.value))}
                    className={fieldClass}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>
                        {n}x de {fmt(total / n)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {forma === 'PIX' && (
                <div>
                  <label className={labelClass}>Chave Pix (opcional)</label>
                  <input value={chavePix} onChange={e => setChavePix(e.target.value)} className={fieldClass} placeholder="Parâmetros da empresa se vazio" />
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Desconto (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={desconto}
                    onChange={e => setDesconto(e.target.value)}
                    className={fieldClass}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className={labelClass}>CPF na nota (opcional)</label>
                  <input ref={cpfPagamentoRef} value={cpfCliente} onChange={e => setCpfCliente(e.target.value)} className={fieldClass} placeholder="000.000.000-00" />
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="pdv-cliente-busca-modal">
                  Cliente
                </label>
                <div className="flex gap-2">
                  <input
                    ref={clienteModalInputRef}
                    id="pdv-cliente-busca-modal"
                    value={clienteBusca}
                    onChange={e => setClienteBusca(e.target.value)}
                    className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 min-h-[44px]"
                    placeholder="Nome, e-mail ou telefone"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => void onBuscarClientes()}
                    className="shrink-0 rounded-xl border border-gray-200 bg-gray-100 px-3 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-200 min-h-[44px]"
                  >
                    Buscar
                  </button>
                </div>
                {clientesOpts.length > 0 && (
                  <div className="mt-2 max-h-36 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100 bg-white shadow-sm">
                    {clientesOpts.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onSelectCliente(c)}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-primary-50 transition-colors"
                      >
                        {c.nome} <span className="text-gray-400 text-xs">{c.telefone || c.email || ''}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {farmacia && (
                <button type="button" onClick={() => setShowFarmLines(s => !s)} className="text-sm font-medium text-amber-800 hover:underline">
                  {showFarmLines ? '▼' : '▶'} Lote / validade por item no cupom
                </button>
              )}
            </div>

            <div className="flex flex-col rounded-2xl border border-gray-200/90 bg-gradient-to-b from-gray-50/90 to-white p-4 sm:p-5 shadow-inner min-h-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Resumo da venda</h3>
              <div className="space-y-2.5 flex-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-numeric tabular-nums font-medium text-gray-900">{fmt(subtotalCart)}</span>
                </div>
                {descontoNum > 0 && (
                  <div className="flex justify-between text-amber-800">
                    <span>Desconto</span>
                    <span className="font-numeric tabular-nums font-semibold">− {fmt(descontoNum)}</span>
                  </div>
                )}
                <div className="my-3 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Total a pagar</span>
                  <span className="text-2xl sm:text-3xl font-bold font-numeric tabular-nums text-primary-700">{fmt(total)}</span>
                </div>
                {forma === 'PIX' && (
                  <div className="mt-4 rounded-xl border border-gray-200/90 bg-white/80 p-3 text-center">
                    {pixQrError && <p className="text-sm text-amber-900 mb-2">{pixQrError}</p>}
                    {pixQrDataUrl && !pixQrError && (
                      <>
                        <Image src={pixQrDataUrl} alt="QR Code para pagamento PIX" width={200} height={200} unoptimized className="mx-auto rounded-lg" />
                        {pixPayload && (
                          <button
                            type="button"
                            className="mt-3 w-full rounded-lg border border-primary-200 bg-primary-50 py-2 text-sm font-semibold text-primary-900 hover:bg-primary-100"
                            onClick={() =>
                              void navigator.clipboard.writeText(pixPayload).then(() =>
                                appAlert('Código PIX copiado para a área de transferência.', 'PIX')
                              )
                            }
                          >
                            Copiar código PIX (copia e cola)
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-5 space-y-2 pt-2 border-t border-gray-200/80">
                <button
                  type="button"
                  onClick={() => void onFinalize()}
                  disabled={finishing || cartLength === 0}
                  className="btn-primary w-full py-3.5 min-h-[52px] rounded-xl text-base font-bold shadow-lg shadow-primary-600/20"
                >
                  {finishing ? 'Confirmando…' : 'Confirmar pagamento'}
                </button>
                <button type="button" onClick={onClose} className="w-full rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Voltar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
