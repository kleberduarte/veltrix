'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { reportService } from '@/services/reportService'
import { DailyReport } from '@/types'
import { useRouter } from 'next/navigation'
import { getAuth, isAuthenticated } from '@/lib/auth'
import { defaultHomePath } from '@/lib/roleAccess'

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function DashboardPage() {
  const router = useRouter()
  const [report, setReport] = useState<DailyReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return }
    const r = getAuth()?.role
    if (r === 'VENDEDOR' || r === 'TOTEM') {
      router.replace(defaultHomePath(r))
      return
    }
    reportService.getDaily().then(setReport).finally(() => setLoading(false))
  }, [router])

  const cards = report ? [
    { label: 'Total Vendido',  value: fmt(report.totalSales),    color: 'bg-green-500',   icon: '💵' },
    { label: 'Pedidos',        value: String(report.totalOrders), color: 'bg-blue-500',    icon: '🧾' },
    { label: 'Ticket Médio',   value: fmt(report.averageTicket),  color: 'bg-purple-500',  icon: '📈' },
    { label: 'Saldo do Caixa', value: fmt(report.balance),        color: 'bg-orange-500',  icon: '💰' },
  ] : []

  return (
    <AppLayout title="Dashboard">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando...</div>
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <p className="text-sm text-gray-500 mb-1">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <h3 className="text-2xl font-bold text-gray-800">Resumo do Dia</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {cards.map(card => (
              <div key={card.label} className="card flex items-center gap-4">
                <div className={`${card.color} w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>
                  {card.icon}
                </div>
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-xl font-bold text-gray-800 mt-0.5">{card.value}</p>
                </div>
              </div>
            ))}
          </div>

          {report && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="card">
                <h4 className="font-semibold text-gray-700 mb-4">Fluxo de Caixa Hoje</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-green-600 font-medium">Entradas</span>
                    <span className="font-bold text-green-600">{fmt(report.totalIn)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-red-500 font-medium">Saídas</span>
                    <span className="font-bold text-red-500">{fmt(report.totalOut)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Saldo</span>
                    <span className={`font-bold text-lg ${report.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {fmt(report.balance)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card flex flex-col justify-center items-center gap-3">
                <span className="text-5xl">🛒</span>
                <p className="text-gray-500 text-sm">Ir para o PDV</p>
                <a href="/pdv" className="btn-primary">Abrir PDV</a>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: '/relatorios', label: 'Relatórios', icon: '📑' },
              { href: '/monitor-pdv', label: 'Monitor PDV', icon: '📡' },
              { href: '/parametros', label: 'Parâmetros', icon: '⚙️' },
              { href: '/suporte', label: 'Suporte', icon: '💬' },
            ].map(link => (
              <a
                key={link.href}
                href={link.href}
                className="card flex items-center gap-3 py-4 hover:border-primary-300 transition-colors"
              >
                <span className="text-2xl">{link.icon}</span>
                <span className="font-medium text-gray-800">{link.label}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  )
}
