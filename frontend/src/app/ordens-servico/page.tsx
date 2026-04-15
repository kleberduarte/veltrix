'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { ordemServicoService, OrdemServicoPayload } from '@/services/ordemServicoService'
import { OrdemServico, StatusOrdemServico } from '@/types'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { appAlert, appConfirm } from '@/lib/dialogs'

const STATUS_ALL: StatusOrdemServico[] = [
  'ABERTA', 'EM_ANALISE', 'AGUARDANDO_APROVACAO', 'CONCLUIDA', 'ENTREGUE', 'CANCELADA',
]

const STATUS_LABEL: Record<StatusOrdemServico, string> = {
  ABERTA: 'Aberta',
  EM_ANALISE: 'Em análise',
  AGUARDANDO_APROVACAO: 'Aguardando aprovação',
  CONCLUIDA: 'Concluída',
  ENTREGUE: 'Entregue',
  CANCELADA: 'Cancelada',
}

function fmtMoney(n?: number | null) {
  if (n == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}

function emptyForm(): OrdemServicoPayload {
  return {
    nomeCliente: '',
    telefoneCliente: '',
    contatoCliente: '',
    equipamento: '',
    marca: '',
    modelo: '',
    numeroSerie: '',
    acessorios: '',
    defeitoRelatado: '',
    diagnostico: '',
    servicoExecutado: '',
    tecnicoResponsavel: '',
    observacao: '',
    valorServico: undefined,
    desconto: undefined,
    dataPrevisaoEntrega: undefined,
  }
}

function fromOs(os: OrdemServico): OrdemServicoPayload {
  return {
    clienteId: os.clienteId ?? undefined,
    nomeCliente: os.nomeCliente,
    telefoneCliente: os.telefoneCliente ?? undefined,
    contatoCliente: os.contatoCliente ?? undefined,
    equipamento: os.equipamento ?? undefined,
    marca: os.marca ?? undefined,
    modelo: os.modelo ?? undefined,
    numeroSerie: os.numeroSerie ?? undefined,
    acessorios: os.acessorios ?? undefined,
    defeitoRelatado: os.defeitoRelatado ?? undefined,
    diagnostico: os.diagnostico ?? undefined,
    servicoExecutado: os.servicoExecutado ?? undefined,
    tecnicoResponsavel: os.tecnicoResponsavel ?? undefined,
    observacao: os.observacao ?? undefined,
    valorServico: os.valorServico ?? undefined,
    desconto: os.desconto ?? undefined,
    dataPrevisaoEntrega: os.dataPrevisaoEntrega ?? undefined,
  }
}

export default function OrdensServicoPage() {
  const router = useRouter()
  const [list, setList] = useState<OrdemServico[]>([])
  const [filterStatus, setFilterStatus] = useState<StatusOrdemServico | ''>('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<OrdemServicoPayload>(emptyForm())
  const [editing, setEditing] = useState<OrdemServico | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return }
    load()
  }, [router, filterStatus])

  async function load() {
    setLoading(true)
    try {
      setList(await ordemServicoService.getAll(filterStatus || undefined))
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setError('')
    setShowModal(true)
  }

  function openEdit(os: OrdemServico) {
    setEditing(os)
    setForm(fromOs(os))
    setError('')
    setShowModal(true)
  }

  async function handleDelete(os: OrdemServico) {
    if (!(await appConfirm(`Excluir OS #${os.numeroOs}?`, 'Excluir ordem de serviço'))) return
    await ordemServicoService.remove(os.id)
    await load()
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...form, nomeCliente: form.nomeCliente.trim() }
      if (editing) await ordemServicoService.update(editing.id, payload)
      else await ordemServicoService.create(payload)
      setShowModal(false)
      await load()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } }
      setError(ax.response?.data?.error || 'Erro ao salvar OS')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(os: OrdemServico, novo: StatusOrdemServico) {
    if (novo === os.status) return
    try {
      await ordemServicoService.updateStatus(os.id, novo)
      await load()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } }
      await appAlert(ax.response?.data?.error || 'Transição de status inválida', 'Falha ao alterar status')
    }
  }

  return (
    <AppLayout title="Ordens de serviço">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Status</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as StatusOrdemServico | '')}
              className="input-field max-w-xs"
            >
              <option value="">Todos</option>
              {STATUS_ALL.map(s => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>
          <button type="button" onClick={openCreate} className="btn-primary">+ Nova OS</button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Carregando...</div>
        ) : list.length === 0 ? (
          <div className="card text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🔧</p>
            <p>Nenhuma ordem de serviço.</p>
            <button type="button" onClick={openCreate} className="btn-primary mt-4">Abrir primeira OS</button>
          </div>
        ) : (
          <div className="card overflow-hidden p-0 overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['OS', 'Cliente', 'Equipamento', 'Status', 'Total', 'Abertura', 'Ações'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list.map(os => (
                  <tr key={os.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-semibold text-gray-900">#{os.numeroOs}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{os.nomeCliente}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate" title={os.equipamento ?? ''}>{os.equipamento || '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={os.status}
                        onChange={e => handleStatusChange(os, e.target.value as StatusOrdemServico)}
                        className="input-field text-sm py-1.5 min-w-[160px]"
                      >
                        {STATUS_ALL.map(s => (
                          <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm">{fmtMoney(os.valorTotal)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(os.dataAbertura).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => openEdit(os)} className="text-primary-600 hover:text-primary-800 text-sm font-medium">Editar</button>
                        <button type="button" onClick={() => handleDelete(os)} className="text-red-500 hover:text-red-700 text-sm font-medium">Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">{editing ? `Editar OS #${editing.numeroOs}` : 'Nova ordem de serviço'}</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do cliente *</label>
                  <input value={form.nomeCliente} onChange={e => setForm({ ...form, nomeCliente: e.target.value })} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input value={form.telefoneCliente ?? ''} onChange={e => setForm({ ...form, telefoneCliente: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contato</label>
                  <input value={form.contatoCliente ?? ''} onChange={e => setForm({ ...form, contatoCliente: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID cliente (opcional)</label>
                  <input type="number" min={1} value={form.clienteId ?? ''} onChange={e => setForm({ ...form, clienteId: e.target.value ? Number(e.target.value) : undefined })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Previsão entrega</label>
                  <input type="date" value={form.dataPrevisaoEntrega?.slice(0, 10) ?? ''} onChange={e => setForm({ ...form, dataPrevisaoEntrega: e.target.value || undefined })} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Equipamento</label>
                  <input value={form.equipamento ?? ''} onChange={e => setForm({ ...form, equipamento: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                  <input value={form.marca ?? ''} onChange={e => setForm({ ...form, marca: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                  <input value={form.modelo ?? ''} onChange={e => setForm({ ...form, modelo: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nº série</label>
                  <input value={form.numeroSerie ?? ''} onChange={e => setForm({ ...form, numeroSerie: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Acessórios</label>
                  <input value={form.acessorios ?? ''} onChange={e => setForm({ ...form, acessorios: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Defeito relatado</label>
                <textarea value={form.defeitoRelatado ?? ''} onChange={e => setForm({ ...form, defeitoRelatado: e.target.value })} className="input-field min-h-[72px]" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico</label>
                <textarea value={form.diagnostico ?? ''} onChange={e => setForm({ ...form, diagnostico: e.target.value })} className="input-field min-h-[72px]" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Serviço executado</label>
                <textarea value={form.servicoExecutado ?? ''} onChange={e => setForm({ ...form, servicoExecutado: e.target.value })} className="input-field min-h-[72px]" rows={2} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Técnico</label>
                  <input value={form.tecnicoResponsavel ?? ''} onChange={e => setForm({ ...form, tecnicoResponsavel: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
                  <input value={form.observacao ?? ''} onChange={e => setForm({ ...form, observacao: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor serviço (R$)</label>
                  <input type="number" step="0.01" min="0" value={form.valorServico ?? ''} onChange={e => setForm({ ...form, valorServico: e.target.value ? Number(e.target.value) : undefined })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desconto (R$)</label>
                  <input type="number" step="0.01" min="0" value={form.desconto ?? ''} onChange={e => setForm({ ...form, desconto: e.target.value ? Number(e.target.value) : undefined })} className="input-field" />
                </div>
              </div>
              {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}
              <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-1">
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
