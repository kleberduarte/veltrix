'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { pdvTerminalService } from '@/services/pdvTerminalService'
import { PdvTerminal } from '@/types'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'

function fmtHb(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR')
}

function isOnline(ultimoHeartbeat?: string | null) {
  if (!ultimoHeartbeat) return false
  const ts = new Date(ultimoHeartbeat).getTime()
  if (Number.isNaN(ts)) return false
  return Date.now() - ts <= 60_000
}

function connectionBadge(online: boolean) {
  if (online) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
        Conectado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
      Offline
    </span>
  )
}

function caixaBadge(status: PdvTerminal['statusCaixa']) {
  if (status === 'FECHADO') {
    return <span className="inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800">Fechado</span>
  }
  if (status === 'PAUSADO') {
    return <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">Pausado</span>
  }
  if (status === 'OCUPADO') {
    return <span className="inline-flex rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-900">Em uso</span>
  }
  return <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Livre</span>
}

export default function MonitorPdvPage() {
  const router = useRouter()
  const [list, setList] = useState<PdvTerminal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return }
    let cancelled = false
    async function tick() {
      try {
        const data = await pdvTerminalService.getAll()
        if (!cancelled) setList(data)
      } catch {
        if (!cancelled) setList([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    tick()
    const id = window.setInterval(tick, 5000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [router])

  return (
    <AppLayout title="Monitor de PDVs">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Atualização a cada 5s. Cada venda finalizada no PDV registra operador e horário neste terminal; o heartbeat do PDV
          também mantém o status em tempo quase real.
        </p>
        {loading && list.length === 0 ? (
          <p className="text-gray-400">Carregando...</p>
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Código', 'Nome', 'Conexão', 'Status caixa', 'Ativo', 'Último operador', 'Última atividade'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-sm">{t.codigo}</td>
                    <td className="px-6 py-4 font-medium">{t.nome}</td>
                    <td className="px-6 py-4">{connectionBadge(isOnline(t.ultimoHeartbeat))}</td>
                    <td className="px-6 py-4">{caixaBadge(t.statusCaixa)}</td>
                    <td className="px-6 py-4">{t.ativo ? 'Sim' : 'Não'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{t.ultimoOperador || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{fmtHb(t.ultimoHeartbeat)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.length === 0 && !loading && (
              <p className="text-center text-gray-400 py-12">Nenhum terminal cadastrado.</p>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
