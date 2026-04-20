'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { cashService } from '@/services/cashService'
import { fechamentoCaixaService } from '@/services/fechamentoCaixaService'
import { pdvTerminalService } from '@/services/pdvTerminalService'
import { CashFlow, FechamentoCaixaRow, ResumoDia, PdvTerminal } from '@/types'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR')
}

export default function CashPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<CashFlow[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ type: 'IN', amount: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [resumo, setResumo] = useState<ResumoDia | null>(null)
  const [loadingResumo, setLoadingResumo] = useState(true)
  const [historicoFech, setHistoricoFech] = useState<FechamentoCaixaRow[]>([])
  const [terminais, setTerminais] = useState<PdvTerminal[]>([])
  const [fecharTerminalId, setFecharTerminalId] = useState<string>('')
  const [fecharValor, setFecharValor] = useState('')
  const [fechando, setFechando] = useState(false)
  const [fechamentoError, setFechamentoError] = useState('')

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return }
    load()
    loadFechamento()
  }, [router])

  async function load() {
    setLoading(true)
    try { setEntries(await cashService.getAll()) }
    finally { setLoading(false) }
  }

  async function loadFechamento() {
    setLoadingResumo(true)
    setFechamentoError('')
    try {
      const [r, h, t] = await Promise.all([
        fechamentoCaixaService.resumoHoje(),
        fechamentoCaixaService.historico(),
        pdvTerminalService.getAll().catch(() => [] as PdvTerminal[]),
      ])
      setResumo(r)
      setHistoricoFech(h)
      setTerminais(t)
    } catch {
      setResumo(null)
    } finally {
      setLoadingResumo(false)
    }
  }

  async function handleFecharCaixa(e: React.FormEvent) {
    e.preventDefault()
    setFechando(true)
    setFechamentoError('')
    try {
      await fechamentoCaixaService.fechar({
        terminalId: fecharTerminalId ? Number(fecharTerminalId) : undefined,
        valorInformadoDinheiro: fecharValor ? Number(fecharValor) : undefined,
      })
      setFecharValor('')
      await loadFechamento()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } }
      setFechamentoError(ax.response?.data?.error || 'Erro ao fechar caixa')
    } finally {
      setFechando(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await cashService.create({ type: form.type, amount: Number(form.amount), description: form.description || undefined })
      setShowModal(false)
      setForm({ type: 'IN', amount: '', description: '' })
      await load()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar lançamento')
    } finally {
      setSaving(false)
    }
  }

  const totalIn  = entries.filter(e => e.type === 'IN').reduce((s, e) => s + e.amount, 0)
  const totalOut = entries.filter(e => e.type === 'OUT').reduce((s, e) => s + e.amount, 0)

  return (
    <AppLayout title="Caixa">
      <div className="space-y-6">
        <section className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Fechamento do dia (vendas)</h2>
          <p className="text-sm text-gray-500">Consolida pedidos do dia por forma de pagamento e registra o fechamento, como no sistema-cadastro.</p>
          {loadingResumo ? (
            <p className="text-gray-400">Carregando resumo...</p>
          ) : resumo ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Vendas</p>
                  <p className="text-xl font-bold text-gray-900">{resumo.quantidadeVendas}</p>
                </div>
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="text-xs text-green-800">Dinheiro</p>
                  <p className="text-xl font-bold text-green-800">{fmt(resumo.totalDinheiro)}</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="text-xs text-blue-800">Cartão (crédito)</p>
                  <p className="text-xl font-bold text-blue-800">{fmt(resumo.totalCartao)}</p>
                </div>
                <div className="rounded-lg bg-sky-50 p-3">
                  <p className="text-xs text-sky-800">Débito</p>
                  <p className="text-xl font-bold text-sky-800">{fmt(resumo.totalDebito)}</p>
                </div>
                <div className="rounded-lg bg-violet-50 p-3">
                  <p className="text-xs text-violet-800">Pix</p>
                  <p className="text-xl font-bold text-violet-800">{fmt(resumo.totalPix)}</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-3">
                  <p className="text-xs text-amber-900">Vale refeição</p>
                  <p className="text-xl font-bold text-amber-900">{fmt(resumo.totalVoucher ?? 0)}</p>
                </div>
              </div>
              <p className="text-sm">
                <span className="font-semibold text-gray-700">Total geral: </span>
                {fmt(resumo.totalGeral)}
                {resumo.jaFechado && (
                  <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">Caixa já fechado hoje</span>
                )}
              </p>
              {!resumo.jaFechado && (
                <form onSubmit={handleFecharCaixa} className="flex flex-col sm:flex-row flex-wrap gap-3 items-end border-t border-gray-100 pt-4">
                  <div className="min-w-[180px]">
                    <label className="block text-xs text-gray-600 mb-1">Terminal PDV (opcional)</label>
                    <select value={fecharTerminalId} onChange={e => setFecharTerminalId(e.target.value)} className="input-field py-2">
                      <option value="">—</option>
                      {terminais.map(t => (
                        <option key={t.id} value={t.id}>{t.codigo} — {t.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div className="min-w-[140px]">
                    <label className="block text-xs text-gray-600 mb-1">Dinheiro conferido (R$)</label>
                    <input type="number" step="0.01" min="0" value={fecharValor} onChange={e => setFecharValor(e.target.value)} className="input-field py-2" placeholder="Opcional" />
                  </div>
                  <button type="submit" disabled={fechando} className="btn-primary">{fechando ? 'Fechando...' : 'Fechar caixa do dia'}</button>
                </form>
              )}
              {fechamentoError && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{fechamentoError}</div>}
              {historicoFech.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Histórico de fechamentos</h3>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {['Data', 'Operador', 'Vendas', 'Total', 'Dif. dinheiro'].map(h => (
                            <th key={h} className="text-left px-3 py-2 font-medium text-gray-600">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {historicoFech.slice(0, 8).map(row => (
                          <tr key={row.id}>
                            <td className="px-3 py-2 whitespace-nowrap">{new Date(row.dataFechamento).toLocaleString('pt-BR')}</td>
                            <td className="px-3 py-2">{row.nomeOperador || '—'}</td>
                            <td className="px-3 py-2">{row.quantidadeVendas}</td>
                            <td className="px-3 py-2">{fmt(row.totalGeral)}</td>
                            <td className="px-3 py-2">{fmt(row.diferencaDinheiro)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-400 text-sm">Não foi possível carregar o resumo do dia.</p>
          )}
        </section>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card border-l-4 border-green-500">
            <p className="text-sm text-gray-500">Total de Entradas</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{fmt(totalIn)}</p>
          </div>
          <div className="card border-l-4 border-red-400">
            <p className="text-sm text-gray-500">Total de Saídas</p>
            <p className="text-2xl font-bold text-red-500 mt-1">{fmt(totalOut)}</p>
          </div>
          <div className="card border-l-4 border-primary-500">
            <p className="text-sm text-gray-500">Saldo</p>
            <p className={`text-2xl font-bold mt-1 ${totalIn - totalOut >= 0 ? 'text-primary-600' : 'text-red-500'}`}>
              {fmt(totalIn - totalOut)}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-gray-500">{entries.length} lançamento(s)</p>
          <button onClick={() => { setShowModal(true); setError('') }} className="btn-primary">
            + Novo Lançamento
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Carregando...</div>
        ) : entries.length === 0 ? (
          <div className="card text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">💰</p>
            <p>Nenhum lançamento ainda.</p>
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Data', 'Tipo', 'Descrição', 'Valor'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">{fmtDate(e.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${e.type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {e.type === 'IN' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{e.description || '—'}</td>
                    <td className={`px-6 py-4 font-bold ${e.type === 'IN' ? 'text-green-600' : 'text-red-500'}`}>
                      {e.type === 'IN' ? '+' : '-'} {fmt(e.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Novo Lançamento</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <div className="flex gap-3">
                  {['IN', 'OUT'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({...form, type: t})}
                      className={`flex-1 py-3 rounded-lg font-semibold border-2 transition-all ${
                        form.type === t
                          ? t === 'IN' ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-400 bg-red-50 text-red-600'
                          : 'border-gray-200 text-gray-500'
                      }`}
                    >
                      {t === 'IN' ? '+ Entrada' : '- Saída'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                <input type="number" step="0.01" min="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required className="input-field" placeholder="0,00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
                <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" placeholder="Ex: Aluguel, fornecedor..." />
              </div>
              {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
