'use client'
import { useEffect, useState } from 'react'
import { fechamentoCaixaService } from '@/services/fechamentoCaixaService'
import { ResumoDia } from '@/types'

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

type Props = {
  open: boolean
  onClose: () => void
  terminalId: number | ''
}

export default function PdvModalFechamentoCaixa({ open, onClose, terminalId }: Props) {
  const [resumo, setResumo] = useState<ResumoDia | null>(null)
  const [loading, setLoading] = useState(false)
  const [valorCaixa, setValorCaixa] = useState('')
  const [fechando, setFechando] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!open) return
    setErr('')
    setValorCaixa('')
    setLoading(true)
    fechamentoCaixaService
      .resumoHoje()
      .then(setResumo)
      .catch(() => setResumo(null))
      .finally(() => setLoading(false))
  }, [open])

  async function handleFechar() {
    setFechando(true)
    setErr('')
    try {
      await fechamentoCaixaService.fechar({
        terminalId: terminalId === '' ? undefined : terminalId,
        valorInformadoDinheiro: valorCaixa.trim() ? Number(valorCaixa.replace(',', '.')) : undefined,
      })
      onClose()
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { error?: string } } }
      setErr(ax.response?.data?.error || 'Erro ao fechar caixa')
    } finally {
      setFechando(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdv-modal-caixa-titulo"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200 p-5 sm:p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 mb-4">
          <h2 id="pdv-modal-caixa-titulo" className="text-lg font-bold text-gray-900">
            Fechamento de caixa (Alt+F)
          </h2>
          <button type="button" className="text-2xl text-gray-400 hover:text-gray-700 leading-none" onClick={onClose}>
            ×
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">Resumo do dia atual (operador logado).</p>

        {loading ? (
          <p className="text-gray-400 py-6">Carregando…</p>
        ) : resumo ? (
          <div className="rounded-xl border border-gray-100 bg-gray-50/80 divide-y divide-gray-100 text-sm mb-4">
            <div className="flex justify-between px-3 py-2">
              <span>Qtd. vendas</span>
              <span className="font-numeric font-semibold">{resumo.quantidadeVendas}</span>
            </div>
            <div className="flex justify-between px-3 py-2">
              <span>Total dinheiro</span>
              <span className="font-numeric">{fmt(resumo.totalDinheiro)}</span>
            </div>
            <div className="flex justify-between px-3 py-2">
              <span>Total cartão (crédito)</span>
              <span className="font-numeric">{fmt(resumo.totalCartao)}</span>
            </div>
            <div className="flex justify-between px-3 py-2">
              <span>Total débito</span>
              <span className="font-numeric">{fmt(resumo.totalDebito ?? 0)}</span>
            </div>
            <div className="flex justify-between px-3 py-2">
              <span>Total PIX</span>
              <span className="font-numeric">{fmt(resumo.totalPix)}</span>
            </div>
            <div className="flex justify-between px-3 py-2 font-bold text-gray-900">
              <span>Total geral</span>
              <span className="font-numeric">{fmt(resumo.totalGeral)}</span>
            </div>
            {resumo.jaFechado && (
              <p className="px-3 py-2 text-amber-800 text-xs bg-amber-50">Caixa já fechado hoje.</p>
            )}
          </div>
        ) : (
          <p className="text-red-600 text-sm mb-4">Não foi possível carregar o resumo.</p>
        )}

        <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
          Valor em dinheiro contado no caixa (opcional)
        </label>
        <input
          value={valorCaixa}
          onChange={e => setValorCaixa(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm mb-2"
          placeholder="ex: 150,00"
          inputMode="decimal"
        />
        <p className="text-xs text-gray-500 mb-4">Se informado, o sistema calcula sobra/falta em relação ao dinheiro.</p>

        {err && <p className="text-sm text-red-600 mb-3">{err}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleFechar()}
            disabled={fechando || loading || resumo?.jaFechado}
            className="flex-1 btn-primary rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {fechando ? 'Confirmando…' : 'Confirmar fechamento'}
          </button>
        </div>
      </div>
    </div>
  )
}
