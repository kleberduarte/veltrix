'use client'
import { useEffect, useMemo, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { reportService } from '@/services/reportService'
import { orderService } from '@/services/orderService'
import { DailyReport, Order } from '@/types'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default function RelatoriosPage() {
  const router = useRouter()
  const today = new Date()
  const [from, setFrom] = useState(toInputDate(today))
  const [to, setTo] = useState(toInputDate(today))
  const [daily, setDaily] = useState<DailyReport | null>(null)
  const [period, setPeriod] = useState<DailyReport | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPeriod, setLoadingPeriod] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const d = await reportService.getDaily()
        if (!cancelled) setDaily(d)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [router])

  useEffect(() => {
    if (!isAuthenticated()) return
    let cancelled = false
    ;(async () => {
      setLoadingPeriod(true)
      try {
        const [rep, ord] = await Promise.all([
          reportService.getPeriod(from, to),
          orderService.getAll({ from, to }),
        ])
        if (!cancelled) {
          setPeriod(rep)
          setOrders(ord)
        }
      } catch {
        if (!cancelled) {
          setPeriod(null)
          setOrders([])
        }
      } finally {
        if (!cancelled) setLoadingPeriod(false)
      }
    })()
    return () => { cancelled = true }
  }, [from, to])

  const totaisPorForma = useMemo(() => {
    const por: Record<string, number> = {}
    for (const o of orders) {
      const fp = o.formaPagamento || 'OUTROS'
      por[fp] = (por[fp] || 0) + o.total
    }
    return por
  }, [orders])

  function exportCsv() {
    const headers = ['id', 'data', 'total', 'formaPagamento', 'parcelas', 'desconto', 'subtotal', 'itens']
    const rows = orders.map(o => [
      o.id,
      o.createdAt,
      o.total,
      o.formaPagamento ?? '',
      o.parcelas ?? '',
      o.desconto ?? '',
      o.subtotal ?? '',
      o.items.map(i => `${i.productName}x${i.quantity}`).join('; '),
    ])
    const csv = [headers.join(';'), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `vendas-${from}-${to}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <AppLayout title="Relatórios">
      <div className="space-y-8">
        <p className="text-gray-500 text-sm">
          Resumo de <strong>hoje</strong> (API), período customizado com agregação no servidor e lista de pedidos filtrada (<code className="text-xs bg-gray-100 px-1 rounded">GET /reports/period</code>, <code className="text-xs bg-gray-100 px-1 rounded">GET /orders?from=&amp;to=</code>).
        </p>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Carregando...</div>
        ) : (
          <>
            {daily && (
              <div>
                <h2 className="text-sm font-semibold text-gray-600 mb-3">Hoje (dia corrente)</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="card border-l-4 border-green-500">
                    <p className="text-xs text-gray-500 uppercase">Vendas</p>
                    <p className="text-2xl font-bold text-gray-900">{fmt(daily.totalSales)}</p>
                  </div>
                  <div className="card border-l-4 border-blue-500">
                    <p className="text-xs text-gray-500 uppercase">Pedidos</p>
                    <p className="text-2xl font-bold">{daily.totalOrders}</p>
                  </div>
                  <div className="card border-l-4 border-purple-500">
                    <p className="text-xs text-gray-500 uppercase">Ticket médio</p>
                    <p className="text-2xl font-bold">{fmt(daily.averageTicket)}</p>
                  </div>
                  <div className="card border-l-4 border-orange-500">
                    <p className="text-xs text-gray-500 uppercase">Saldo caixa (lanç.)</p>
                    <p className="text-2xl font-bold">{fmt(daily.balance)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="card space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-end">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Período selecionado</h2>
                  <p className="text-sm text-gray-500">Totais calculados no servidor; tabela = pedidos do intervalo.</p>
                </div>
                <div className="flex flex-wrap gap-3 items-end">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">De</label>
                    <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input-field py-2" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Até</label>
                    <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input-field py-2" />
                  </div>
                  <button type="button" onClick={exportCsv} disabled={orders.length === 0} className="btn-primary py-2">
                    Exportar CSV
                  </button>
                </div>
              </div>

              {loadingPeriod ? (
                <p className="text-gray-400 text-sm">Atualizando período...</p>
              ) : period ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-lg bg-green-50 border border-green-100 p-3">
                    <p className="text-xs text-green-800">Vendas no período</p>
                    <p className="text-xl font-bold text-green-900">{fmt(period.totalSales)}</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                    <p className="text-xs text-blue-800">Pedidos</p>
                    <p className="text-xl font-bold">{period.totalOrders}</p>
                  </div>
                  <div className="rounded-lg bg-violet-50 border border-violet-100 p-3">
                    <p className="text-xs text-violet-800">Ticket médio</p>
                    <p className="text-xl font-bold">{fmt(period.averageTicket)}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
                    <p className="text-xs text-amber-900">Saldo caixa (lanç. no período)</p>
                    <p className="text-xl font-bold">{fmt(period.balance)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-amber-700 text-sm">Não foi possível carregar o período.</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm border-t border-gray-100 pt-4">
                <span><strong>{orders.length}</strong> pedido(s)</span>
                {Object.entries(totaisPorForma).map(([k, val]) => (
                  <span key={k}>{k}: <strong>{fmt(val)}</strong></span>
                ))}
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['#', 'Data', 'Total', 'Pagamento', 'Itens'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map(o => (
                      <tr key={o.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono">{o.id}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{new Date(o.createdAt).toLocaleString('pt-BR')}</td>
                        <td className="px-4 py-3 font-semibold">{fmt(o.total)}</td>
                        <td className="px-4 py-3">{o.formaPagamento || '—'} {o.parcelas && o.parcelas > 1 ? `${o.parcelas}x` : ''}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={o.items.map(i => i.productName).join(', ')}>
                          {o.items.length} item(ns)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {orders.length === 0 && !loadingPeriod && (
                  <p className="text-center text-gray-400 py-8">Nenhuma venda no período.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
