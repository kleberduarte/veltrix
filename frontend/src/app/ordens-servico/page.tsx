'use client'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import AppLayout from '@/components/layout/AppLayout'
import OsComboboxField from '@/components/ordem-servico/OsComboboxField'
import OrdemServicoPrintDocument from '@/components/ordem-servico/OrdemServicoPrintDocument'
import { ordemServicoService, OrdemServicoPayload } from '@/services/ordemServicoService'
import { parametrosEmpresaService } from '@/services/parametrosEmpresaService'
import { OrdemServico, ParametroEmpresa, StatusOrdemServico } from '@/types'
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
  const [parametro, setParametro] = useState<ParametroEmpresa | null>(null)
  const [printOs, setPrintOs] = useState<OrdemServico | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return }
    load()
  }, [router, filterStatus])

  useEffect(() => {
    parametrosEmpresaService.get().then(setParametro).catch(() => setParametro(null))
  }, [])

  useEffect(() => {
    if (!printOs) return
    const timer = window.setTimeout(() => window.print(), 200)
    const onAfterPrint = () => setPrintOs(null)
    window.addEventListener('afterprint', onAfterPrint)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('afterprint', onAfterPrint)
    }
  }, [printOs])

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
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setPrintOs(os)}
                          className="text-slate-600 hover:text-slate-900 text-sm font-medium"
                        >
                          Imprimir
                        </button>
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

      {printOs &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="os-print-layer" aria-hidden>
            <OrdemServicoPrintDocument os={printOs} empresa={parametro} />
          </div>,
          document.body,
        )}

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
                  <OsComboboxField
                    label="Nome do cliente *"
                    campo="nomeCliente"
                    value={form.nomeCliente}
                    onChange={v => setForm({ ...form, nomeCliente: v })}
                    required
                  />
                </div>
                <OsComboboxField
                  label="Telefone"
                  campo="telefoneCliente"
                  value={form.telefoneCliente ?? ''}
                  onChange={v => setForm({ ...form, telefoneCliente: v })}
                />
                <OsComboboxField
                  label="Contato"
                  campo="contatoCliente"
                  value={form.contatoCliente ?? ''}
                  onChange={v => setForm({ ...form, contatoCliente: v })}
                />
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
                <OsComboboxField
                  label="Equipamento"
                  campo="equipamento"
                  value={form.equipamento ?? ''}
                  onChange={v => setForm({ ...form, equipamento: v })}
                />
                <OsComboboxField
                  label="Marca"
                  campo="marca"
                  value={form.marca ?? ''}
                  onChange={v => setForm({ ...form, marca: v })}
                />
                <OsComboboxField
                  label="Modelo"
                  campo="modelo"
                  value={form.modelo ?? ''}
                  onChange={v => setForm({ ...form, modelo: v })}
                />
                <OsComboboxField
                  label="Nº série"
                  campo="numeroSerie"
                  value={form.numeroSerie ?? ''}
                  onChange={v => setForm({ ...form, numeroSerie: v })}
                />
                <div className="sm:col-span-2">
                  <OsComboboxField
                    label="Acessórios"
                    campo="acessorios"
                    value={form.acessorios ?? ''}
                    onChange={v => setForm({ ...form, acessorios: v })}
                    multiline
                    rows={2}
                  />
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
                <OsComboboxField
                  label="Técnico"
                  campo="tecnicoResponsavel"
                  value={form.tecnicoResponsavel ?? ''}
                  onChange={v => setForm({ ...form, tecnicoResponsavel: v })}
                />
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
              <div className="flex flex-wrap gap-3 pt-2 sticky bottom-0 bg-white pb-1">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 min-w-[120px]">Cancelar</button>
                {editing && (
                  <button
                    type="button"
                    onClick={() => {
                      const os = editing
                      setShowModal(false)
                      setPrintOs(os)
                    }}
                    className="btn-secondary flex-1 min-w-[120px]"
                  >
                    Imprimir
                  </button>
                )}
                <button type="submit" disabled={saving} className="btn-primary flex-1 min-w-[120px]">{saving ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
