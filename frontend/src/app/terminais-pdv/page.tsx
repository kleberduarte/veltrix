'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { pdvTerminalService, PdvTerminalPayload } from '@/services/pdvTerminalService'
import { PdvTerminal } from '@/types'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { appConfirm } from '@/lib/dialogs'

const empty: PdvTerminalPayload = { codigo: '', nome: '', ativo: true }

function fmtHeartbeat(iso?: string | null) {
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
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
        <span aria-hidden>🟢</span> Conectado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700">
      <span aria-hidden>⚫</span> Offline
    </span>
  )
}

function caixaBadge(status: PdvTerminal['statusCaixa']) {
  if (status === 'FECHADO') {
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-800"><span aria-hidden>🔒</span> Fechado</span>
  }
  if (status === 'PAUSADO') {
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900"><span aria-hidden>⏸️</span> Pausado</span>
  }
  if (status === 'OCUPADO') {
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-900"><span aria-hidden>🧾</span> Em uso</span>
  }
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800"><span aria-hidden>✅</span> Livre</span>
}

export default function TerminaisPdvPage() {
  const router = useRouter()
  const [list, setList] = useState<PdvTerminal[]>([])
  const [loading, setLoading] = useState(true)
  const [connectionFilter, setConnectionFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE'>('ALL')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState<PdvTerminal | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return }
    load()
  }, [router])

  useEffect(() => {
    const t = window.setInterval(() => { void load() }, 15000)
    return () => window.clearInterval(t)
  }, [])

  async function load() {
    setLoading(true)
    try {
      setList(await pdvTerminalService.getAll())
    } finally {
      setLoading(false)
    }
  }

  const filteredList = list.filter(t => {
    const online = isOnline(t.ultimoHeartbeat)
    if (connectionFilter === 'ONLINE') return online
    if (connectionFilter === 'OFFLINE') return !online
    return true
  })

  function openCreate() {
    setEditing(null)
    setForm(empty)
    setError('')
    setShowModal(true)
  }

  function openEdit(t: PdvTerminal) {
    setEditing(t)
    setForm({ codigo: t.codigo, nome: t.nome, ativo: t.ativo })
    setError('')
    setShowModal(true)
  }

  async function handleDelete(t: PdvTerminal) {
    if (!(await appConfirm(`Remover terminal "${t.nome}"?`, 'Excluir terminal'))) return
    await pdvTerminalService.remove(t.id)
    await load()
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editing) await pdvTerminalService.update(editing.id, form)
      else await pdvTerminalService.create(form)
      setShowModal(false)
      await load()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } }
      setError(ax.response?.data?.error || 'Erro ao salvar terminal')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout title="Terminais PDV">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-gray-500 text-sm">Cadastro de pontos de venda e status de caixa.</p>
          <div className="flex items-center gap-2">
            <select
              value={connectionFilter}
              onChange={e => setConnectionFilter(e.target.value as 'ALL' | 'ONLINE' | 'OFFLINE')}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700"
            >
              <option value="ALL">Todos</option>
              <option value="ONLINE">Conectado</option>
              <option value="OFFLINE">Offline</option>
            </select>
            <button type="button" onClick={openCreate} className="btn-primary">+ Novo terminal</button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Carregando...</div>
        ) : filteredList.length === 0 ? (
          <div className="card text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🖥️</p>
            <p>{connectionFilter === 'OFFLINE' ? 'Nenhum terminal offline no momento.' : connectionFilter === 'ONLINE' ? 'Nenhum terminal conectado no momento.' : 'Nenhum terminal cadastrado.'}</p>
            {connectionFilter === 'ALL' && (
              <button type="button" onClick={openCreate} className="btn-primary mt-4">Cadastrar terminal</button>
            )}
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Terminal', 'Conexão', 'Status do PDV', 'Último heartbeat', 'Ações'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredList.map(t => {
                  const online = isOnline(t.ultimoHeartbeat)
                  return (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-700 ring-1 ring-primary-100">🖥️</span>
                        <div>
                          <p className="font-medium text-gray-800">{t.nome}</p>
                          <p className="font-mono text-xs text-gray-500">{t.codigo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {connectionBadge(online)}
                    </td>
                    <td className="px-6 py-4">
                      {caixaBadge(t.statusCaixa)}
                      {!t.ativo && <span className="ml-2 text-xs text-red-600">(inativo)</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{fmtHeartbeat(t.ultimoHeartbeat)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => openEdit(t)} className="text-primary-600 hover:text-primary-800 text-sm font-medium">Editar</button>
                        <button type="button" onClick={() => handleDelete(t)} className="text-red-500 hover:text-red-700 text-sm font-medium">Remover</button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">{editing ? 'Editar terminal' : 'Novo terminal'}</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                <input value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} required className="input-field font-mono" disabled={!!editing} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required className="input-field" />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.ativo !== false} onChange={e => setForm({ ...form, ativo: e.target.checked })} className="rounded border-gray-300 text-primary-600" />
                Ativo
              </label>
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
