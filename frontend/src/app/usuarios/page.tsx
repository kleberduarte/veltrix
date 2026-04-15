'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import {
  userService,
  CreateUserPayload,
  UpdateUserPayload,
  CreateUserResponse,
} from '@/services/userService'
import { pdvTerminalService } from '@/services/pdvTerminalService'
import { authService } from '@/services/authService'
import { AppUser, CompanyOption, PdvTerminal, Role } from '@/types'
import { useRouter } from 'next/navigation'
import { getAuth, isAuthenticated } from '@/lib/auth'
import { ROLE_LABELS } from '@/lib/roleAccess'
import { appAlert } from '@/lib/dialogs'

const baseRoles: { value: Role; label: string }[] = [
  { value: 'VENDEDOR', label: ROLE_LABELS.VENDEDOR },
  { value: 'ADMIN_EMPRESA', label: ROLE_LABELS.ADMIN_EMPRESA },
  { value: 'ADM', label: ROLE_LABELS.ADM },
]

function roleBadge(role: Role) {
  const label = ROLE_LABELS[role] ?? role
  const cls =
    role === 'ADM'
      ? 'bg-violet-100 text-violet-900 border-violet-200'
      : role === 'ADMIN_EMPRESA'
        ? 'bg-sky-100 text-sky-900 border-sky-200'
        : 'bg-emerald-100 text-emerald-900 border-emerald-200'
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>
  )
}

export default function UsuariosPage() {
  const router = useRouter()
  const [me, setMe] = useState<ReturnType<typeof getAuth>>(null)
  const [isAdm, setIsAdm] = useState(false)

  useEffect(() => {
    const auth = getAuth()
    setMe(auth)
    setIsAdm(auth?.role === 'ADM')
  }, [])

  const rolesOptions = useMemo(() => {
    if (isAdm) return [...baseRoles]
    return baseRoles.filter(r => r.value !== 'ADM')
  }, [isAdm])

  const [list, setList] = useState<AppUser[]>([])
  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [terminais, setTerminais] = useState<PdvTerminal[]>([])
  const [loading, setLoading] = useState(true)

  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<CreateUserPayload>({
    name: '',
    email: '',
    password: '',
    role: 'VENDEDOR',
    telefone: '',
    mustChangePassword: false,
    companyId: undefined,
    pdvTerminalId: undefined,
  })
  const [gerarSenhaAuto, setGerarSenhaAuto] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [senhaGerada, setSenhaGerada] = useState<string | null>(null)
  const [senhaGeradaSec, setSenhaGeradaSec] = useState(0)

  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<UpdateUserPayload & { name: string; email: string }>({
    name: '',
    email: '',
    role: 'VENDEDOR',
    password: '',
    telefone: '',
    companyId: undefined,
    pdvTerminalId: undefined,
    desvincularPdv: false,
    aplicarTelefone: true,
  })
  const [editTerminais, setEditTerminais] = useState<PdvTerminal[]>([])

  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteName, setDeleteName] = useState('')

  const [conviteUserId, setConviteUserId] = useState<number | ''>('')
  const [conviteCodigo, setConviteCodigo] = useState('')
  const [conviteNome, setConviteNome] = useState('')
  const [conviteEmpresaId, setConviteEmpresaId] = useState<number | null>(null)
  const [conviteSec, setConviteSec] = useState(0)
  const [conviteCopiado, setConviteCopiado] = useState(false)
  const [waPhone, setWaPhone] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [u, c] = await Promise.all([
        userService.list(),
        userService.listCompanies().catch(() => [] as CompanyOption[]),
      ])
      setList(u)
      setCompanies(c)
      setConviteEmpresaId(me?.companyId ?? null)
      setConviteNome(me?.companyName || '')
    } finally {
      setLoading(false)
    }
  }, [me?.companyId, me?.companyName])

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    if (getAuth()?.role === 'VENDEDOR') {
      router.replace('/pdv')
      return
    }
    void load()
  }, [router, load])

  useEffect(() => {
    if (!isAdm || !companies.length || createForm.companyId) return
    const uid = getAuth()?.companyId
    const match = uid && companies.some(c => c.id === uid)
    setCreateForm(f => ({ ...f, companyId: match ? uid : companies[0].id }))
  }, [isAdm, companies, createForm.companyId])

  const empresaAlvoCriacao = useMemo(() => {
    if (isAdm && createForm.companyId) return createForm.companyId
    return me?.companyId ?? undefined
  }, [isAdm, createForm.companyId, me?.companyId])

  useEffect(() => {
    if (!empresaAlvoCriacao) {
      setTerminais([])
      return
    }
    pdvTerminalService
      .listByEmpresa(empresaAlvoCriacao)
      .then(setTerminais)
      .catch(() => setTerminais([]))
  }, [empresaAlvoCriacao, showCreate])

  const editEmpresaId = useMemo(() => {
    if (editId == null) return null
    if (isAdm && editForm.companyId) return editForm.companyId
    const u = list.find(x => x.id === editId)
    return u?.companyId ?? null
  }, [editId, list, isAdm, editForm.companyId])

  useEffect(() => {
    if (!editEmpresaId || editId == null) {
      setEditTerminais([])
      return
    }
    pdvTerminalService
      .listByEmpresa(editEmpresaId)
      .then(setEditTerminais)
      .catch(() => setEditTerminais([]))
  }, [editEmpresaId, editId])

  useEffect(() => {
    if (!senhaGerada || senhaGeradaSec <= 0) return
    const t = window.setInterval(() => {
      setSenhaGeradaSec(s => {
        if (s <= 1) {
          setSenhaGerada(null)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => window.clearInterval(t)
  }, [senhaGerada, senhaGeradaSec])

  useEffect(() => {
    if (!conviteCodigo || conviteSec <= 0) return
    const t = window.setInterval(() => {
      setConviteSec(s => {
        if (s <= 1) {
          setConviteCodigo('')
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => window.clearInterval(t)
  }, [conviteCodigo, conviteSec])

  const filtrados = list

  const usuariosConvite = useMemo(() => {
    return list.filter(u => (u.telefone || '').trim().length > 0)
  }, [list])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload: CreateUserPayload = {
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        role: createForm.role,
        telefone: createForm.telefone?.trim() || undefined,
        mustChangePassword:
          createForm.role === 'VENDEDOR'
            ? gerarSenhaAuto
            : (gerarSenhaAuto ? true : createForm.mustChangePassword),
        companyId: isAdm ? createForm.companyId : undefined,
        pdvTerminalId: createForm.pdvTerminalId,
      }
      if (!gerarSenhaAuto) {
        if (!createForm.password || createForm.password.length < 4) {
          setError('Informe uma senha com pelo menos 4 caracteres ou marque senha automática.')
          setSaving(false)
          return
        }
        payload.password = createForm.password
      }
      const data = (await userService.create(payload)) as CreateUserResponse
      if (data.senhaTemporaria) {
        setSenhaGerada(data.senhaTemporaria)
        setSenhaGeradaSec(120)
      }
      setShowCreate(false)
      setCreateForm({
        name: '',
        email: '',
        password: '',
        role: 'VENDEDOR',
        telefone: '',
        mustChangePassword: false,
        companyId: isAdm ? createForm.companyId : undefined,
        pdvTerminalId: undefined,
      })
      setGerarSenhaAuto(true)
      await load()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } }
      setError(ax.response?.data?.error || 'Erro ao criar usuário')
    } finally {
      setSaving(false)
    }
  }

  function openEdit(u: AppUser) {
    setEditId(u.id)
    setEditForm({
      name: u.name,
      email: u.email,
      role: u.role,
      password: '',
      telefone: u.telefone ?? '',
      companyId: isAdm ? u.companyId : undefined,
      pdvTerminalId: u.pdvTerminalId ?? undefined,
      desvincularPdv: false,
      aplicarTelefone: true,
    })
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault()
    if (editId == null) return
    setSaving(true)
    setError('')
    try {
      const payload: UpdateUserPayload = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        role: editForm.role,
        password: editForm.password?.trim() || undefined,
        telefone: editForm.telefone?.trim() || null,
        aplicarTelefone: true,
        companyId: isAdm ? editForm.companyId : undefined,
        pdvTerminalId: editForm.desvincularPdv ? null : editForm.pdvTerminalId,
        desvincularPdv: editForm.desvincularPdv,
      }
      await userService.update(editId, payload)
      setEditId(null)
      await load()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } }
      setError(ax.response?.data?.error || 'Erro ao atualizar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (deleteId == null) return
    setSaving(true)
    try {
      await userService.remove(deleteId)
      setDeleteId(null)
      await load()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } }
      await appAlert(ax.response?.data?.error || 'Erro ao excluir', 'Falha ao excluir')
    } finally {
      setSaving(false)
    }
  }

  async function gerarConvite() {
    try {
      const data = await authService.regeneratePdvInvite()
      setConviteCodigo(data.codigo ?? '')
      setConviteNome(data.companyName || me?.companyName || '')
      setConviteEmpresaId(data.companyId ?? me?.companyId ?? null)
      setConviteSec(60)
    } catch {
      await appAlert('Não foi possível gerar o código.', 'Falha ao gerar convite')
    }
  }

  async function openWhatsAppConvite() {
    if (!conviteCodigo) {
      await appAlert('Gere o código de convite antes de enviar.', 'Convite não gerado')
      return
    }
    const d = onlyDigits(waPhone)
    if (d.length < 10) {
      await appAlert('Informe um celular com DDD.', 'Telefone inválido')
      return
    }
    const eid = conviteEmpresaId ?? me?.companyId ?? 0
    const text = textoConvite(eid, conviteNome, conviteCodigo)
    const phone = d.length >= 10 && d.length <= 11 && !d.startsWith('55') ? '55' + d : d
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
  }

  async function copiarConvite() {
    if (!conviteCodigo) return
    try {
      await navigator.clipboard.writeText(conviteCodigo)
      setConviteCopiado(true)
      window.setTimeout(() => setConviteCopiado(false), 1800)
    } catch {
      await appAlert('Não foi possível copiar automaticamente. Copie manualmente.', 'Falha ao copiar')
    }
  }

  function copiarSenha() {
    if (senhaGerada) navigator.clipboard.writeText(senhaGerada).catch(() => {})
  }

  return (
    <AppLayout title="Usuários">
      <div className="space-y-8 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Equipe e permissões</h2>
            <p className="text-sm text-gray-500 mt-1">
              Cadastro, edição e vínculo com empresa e terminal PDV — alinhado ao sistema legado.
            </p>
          </div>
          <button type="button" onClick={() => { setError(''); setShowCreate(true) }} className="btn-primary shrink-0">
            + Novo usuário
          </button>
        </div>

        {senhaGerada && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">Senha provisória gerada — copie e envie com segurança.</span>
              <span className="text-xs text-amber-800">{senhaGeradaSec > 0 ? `Ocultando em ${senhaGeradaSec}s` : ''}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <code className="rounded-lg bg-white px-3 py-2 font-mono text-base border border-amber-200">{senhaGerada}</code>
              <button type="button" onClick={copiarSenha} className="btn-secondary text-sm">
                Copiar
              </button>
            </div>
          </div>
        )}

        <section className="card p-4 sm:p-5 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">Código de convite PDV</h3>
          <p className="text-xs text-gray-500">
            Gere um código para novos vendedores se cadastrarem na tela de login da empresa atual.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-gray-600 mb-1">Usuário (apenas para preencher WhatsApp)</label>
              <select
                value={conviteUserId === '' ? '' : String(conviteUserId)}
                onChange={e => {
                  const id = e.target.value ? Number(e.target.value) : ''
                  setConviteUserId(id)
                  if (typeof id === 'number') {
                    const u = usuariosConvite.find(x => x.id === id)
                    setWaPhone(u?.telefone || '')
                  } else {
                    setWaPhone('')
                  }
                }}
                className="input-field w-full"
              >
                <option value="">— Ninguém (digite o WhatsApp) —</option>
                {usuariosConvite.map(u => (
                  <option key={u.id} value={u.id}>
                    @{u.name} — {u.telefone}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" onClick={() => void gerarConvite()} className="btn-secondary">
              Gerar código
            </button>
          </div>
          {conviteCodigo && (
            <div className="rounded-xl border border-primary-200 bg-gradient-to-r from-primary-50 to-white px-3 py-3 sm:px-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-700">Código de convite ativo</p>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="rounded-md bg-white border border-primary-200 px-2.5 py-1 font-mono text-sm font-bold text-primary-900">
                      {conviteCodigo}
                    </code>
                    <span className="text-xs text-amber-700">{conviteSec > 0 ? `expira em ${conviteSec}s` : ''}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void copiarConvite()}
                  className="rounded-lg border border-primary-200 bg-white px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-50 transition-colors"
                >
                  {conviteCopiado ? 'Copiado!' : 'Copiar código'}
                </button>
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">WhatsApp (opcional)</label>
              <input
                value={waPhone}
                onChange={e => setWaPhone(e.target.value)}
                className="input-field"
                placeholder="DDD + número"
              />
            </div>
            <button type="button" onClick={() => void openWhatsAppConvite()} className="btn-primary bg-emerald-600 hover:bg-emerald-700 border-0">
              Enviar por WhatsApp
            </button>
          </div>
        </section>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Carregando…</div>
        ) : filtrados.length === 0 ? (
          <div className="card text-center py-16 text-gray-400">Nenhum usuário encontrado.</div>
        ) : (
          <div className="card overflow-hidden p-0 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Nome', 'E-mail', 'Telefone', 'Perfil', 'Empresa', 'PDV', 'Cadastro', 'Ações'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtrados.map(u => {
                    const isMe = u.email === me?.email
                    return (
                      <tr key={u.id} className="hover:bg-gray-50/80">
                        <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{u.telefone || '—'}</td>
                        <td className="px-4 py-3">{roleBadge(u.role)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {u.companyName ? (
                            <span>
                              <span className="font-medium">{u.companyName}</span>
                              <span className="text-gray-400 text-xs ml-1">#{u.companyId}</span>
                            </span>
                          ) : (
                            <span className="text-gray-500">#{u.companyId}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-700">
                          {u.pdvTerminalCodigo ? (
                            <span title="Terminal PDV">{u.pdvTerminalCodigo}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {u.createdAt ? new Date(u.createdAt).toLocaleString('pt-BR') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {!isMe ? (
                            <div className="flex flex-wrap gap-2">
                              <button type="button" onClick={() => openEdit(u)} className="text-sm font-medium text-primary-700 hover:underline">
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteId(u.id)
                                  setDeleteName(u.name)
                                }}
                                className="text-sm font-medium text-red-600 hover:underline"
                              >
                                Excluir
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Você</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8 ring-1 ring-gray-200/80">
              <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Novo usuário</h3>
                <button type="button" onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
                  ×
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-5 space-y-4">
                {isAdm && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                    <select
                      value={createForm.companyId ?? ''}
                      onChange={e =>
                        setCreateForm({
                          ...createForm,
                          companyId: e.target.value ? Number(e.target.value) : undefined,
                          pdvTerminalId: undefined,
                        })
                      }
                      className="input-field"
                      required
                    >
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Adm Global pode vincular o usuário a qualquer empresa.</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input
                    value={createForm.name}
                    onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail (login)</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
                  <select
                    value={createForm.role}
                    onChange={e => setCreateForm({ ...createForm, role: e.target.value as Role })}
                    className="input-field"
                  >
                    {rolesOptions.map(r => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Terminal PDV (opcional)</label>
                  <select
                    value={createForm.pdvTerminalId ?? ''}
                    onChange={e =>
                      setCreateForm({
                        ...createForm,
                        pdvTerminalId: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="input-field"
                  >
                    <option value="">— Nenhum —</option>
                    {terminais.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.codigo} — {t.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input
                    value={createForm.telefone}
                    onChange={e => setCreateForm({ ...createForm, telefone: e.target.value })}
                    className="input-field"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={gerarSenhaAuto}
                    onChange={e => setGerarSenhaAuto(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600"
                  />
                  Gerar senha automática e exigir troca no 1º acesso
                </label>
                {!gerarSenhaAuto && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Senha inicial</label>
                    <input
                      type="password"
                      value={createForm.password}
                      onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                      minLength={4}
                      className="input-field"
                    />
                  </div>
                )}
                {!gerarSenhaAuto && createForm.role !== 'VENDEDOR' && (
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={!!createForm.mustChangePassword}
                      onChange={e => setCreateForm({ ...createForm, mustChangePassword: e.target.checked })}
                      className="rounded border-gray-300 text-primary-600"
                    />
                    Forçar troca de senha no primeiro acesso
                  </label>
                )}
                {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-100">{error}</div>}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1">
                    {saving ? 'Salvando…' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {editId != null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg ring-1 ring-gray-200/80">
              <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Editar usuário</h3>
                <button type="button" onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
                  ×
                </button>
              </div>
              <form onSubmit={handleEditSave} className="p-5 space-y-4">
                {isAdm && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                    <select
                      value={editForm.companyId ?? ''}
                      onChange={e =>
                        setEditForm({
                          ...editForm,
                          companyId: e.target.value ? Number(e.target.value) : undefined,
                          pdvTerminalId: undefined,
                        })
                      }
                      className="input-field"
                    >
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
                  <select
                    value={editForm.role}
                    onChange={e => setEditForm({ ...editForm, role: e.target.value as Role })}
                    className="input-field"
                  >
                    {rolesOptions.map(r => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Terminal PDV</label>
                  <select
                    value={editForm.desvincularPdv ? '' : editForm.pdvTerminalId ?? ''}
                    onChange={e => {
                      const v = e.target.value
                      setEditForm({
                        ...editForm,
                        desvincularPdv: false,
                        pdvTerminalId: v ? Number(v) : undefined,
                      })
                    }}
                    disabled={editForm.desvincularPdv}
                    className="input-field"
                  >
                    <option value="">— Nenhum —</option>
                    {editTerminais.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.codigo} — {t.nome}
                      </option>
                    ))}
                  </select>
                  <label className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={editForm.desvincularPdv}
                      onChange={e =>
                        setEditForm({
                          ...editForm,
                          desvincularPdv: e.target.checked,
                          pdvTerminalId: e.target.checked ? undefined : editForm.pdvTerminalId,
                        })
                      }
                    />
                    Desvincular terminal PDV
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input
                    value={editForm.telefone ?? ''}
                    onChange={e => setEditForm({ ...editForm, telefone: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha (opcional)</label>
                  <input
                    type="password"
                    value={editForm.password ?? ''}
                    onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                    className="input-field"
                    placeholder="Deixe em branco para manter"
                  />
                </div>
                {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setEditId(null)} className="btn-secondary flex-1">
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1">
                    {saving ? 'Salvando…' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteId != null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={() => setDeleteId(null)}>
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
              <p className="text-gray-800">
                Excluir <strong>{deleteName}</strong>? Pedidos vinculados ao usuário serão reatribuídos a outro usuário da mesma empresa.
              </p>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setDeleteId(null)} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="button" onClick={() => void handleDelete()} disabled={saving} className="flex-1 rounded-lg bg-red-600 text-white py-2.5 font-medium hover:bg-red-700">
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

function onlyDigits(s: string) {
  return s.replace(/\D/g, '')
}

function textoConvite(empresaId: number, nomeEmpresa: string, codigo: string) {
  const origin =
    typeof window !== 'undefined' && window.location?.origin && window.location.protocol !== 'file:'
      ? window.location.origin
      : ''
  const loginHint = origin ? `${origin}/login — use «Criar conta».` : 'Acesse o login do sistema.'
  return (
    `Olá! Segue o convite para criar seu acesso ao PDV:\n\n` +
    `Empresa: ${nomeEmpresa || '—'}\nID da empresa: ${empresaId}\nCódigo: ${codigo}\n\n` +
    loginHint
  )
}
