'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import {
  userService,
  CreateUserPayload,
  UpdateUserPayload,
  CreateUserResponse,
} from '@/services/userService'
import { authService } from '@/services/authService'
import { AppUser, CompanyOption, Role } from '@/types'
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
  })
  const [gerarSenhaAuto, setGerarSenhaAuto] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [senhaGerada, setSenhaGerada] = useState<string | null>(null)
  const [senhaGeradaSec, setSenhaGeradaSec] = useState(0)
  const [senhaCopiada, setSenhaCopiada] = useState(false)

  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<UpdateUserPayload & { name: string; email: string }>({
    name: '',
    email: '',
    role: 'VENDEDOR',
    password: '',
    telefone: '',
    companyId: undefined,
    aplicarTelefone: true,
  })

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
      const auth = getAuth()
      setMe(auth)
      const [u, c] = await Promise.all([
        userService.list(),
        userService.listCompanies().catch(() => [] as CompanyOption[]),
      ])
      setList(u)
      setCompanies(c)
      setConviteEmpresaId(auth?.companyId ?? null)
      setConviteNome(auth?.companyName || '')
      try {
        const inv = await authService.getPdvInvite()
        if (inv.codigo) {
          setConviteCodigo(inv.codigo)
          setConviteNome(inv.companyName || auth?.companyName || '')
          setConviteEmpresaId(inv.companyId ?? auth?.companyId ?? null)
          setConviteSec(0)
        } else {
          setConviteCodigo('')
        }
      } catch {
        setConviteCodigo('')
      }
    } finally {
      setLoading(false)
    }
  }, [])

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
    const onAuth = () => void load()
    window.addEventListener('veltrix-auth-changed', onAuth)
    return () => window.removeEventListener('veltrix-auth-changed', onAuth)
  }, [load])

  useEffect(() => {
    if (!isAdm || !companies.length || createForm.companyId) return
    const uid = getAuth()?.companyId
    const match = uid && companies.some(c => c.id === uid)
    setCreateForm(f => ({ ...f, companyId: match ? uid : companies[0].id }))
  }, [isAdm, companies, createForm.companyId])

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
        setSenhaCopiada(false)
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

  async function copiarSenha() {
    if (!senhaGerada) return
    try {
      await navigator.clipboard.writeText(senhaGerada)
      setSenhaCopiada(true)
      window.setTimeout(() => setSenhaCopiada(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <AppLayout title="Usuários">
      <div className="space-y-8 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Equipe e permissões</h2>
            <p className="text-sm text-gray-500 mt-1">
              Cadastro e edição de usuários com vínculo de empresa.
            </p>
          </div>
          <button type="button" onClick={() => { setError(''); setShowCreate(true) }} className="btn-primary shrink-0">
            + Novo usuário
          </button>
        </div>

        {senhaGerada && (
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-900/[0.06] ring-1 ring-slate-900/5">
            <div
              className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary-500 via-primary-600 to-primary-800"
              aria-hidden
            />
            <div className="relative pl-5 pr-4 py-5 sm:pl-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3.5 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/15 to-primary-700/10 text-primary-700 ring-1 ring-primary-600/10">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" aria-hidden>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-[15px] font-semibold tracking-tight text-slate-900">Senha provisória gerada</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-[13px]">
                      Copie agora e envie por um canal seguro. A senha some desta tela automaticamente.
                    </p>
                  </div>
                </div>
                {senhaGeradaSec > 0 && (
                  <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold tabular-nums text-slate-600 ring-1 ring-slate-200/80">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-40" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-500" />
                    </span>
                    Oculta em {senhaGeradaSec}s
                  </span>
                )}
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <div className="min-w-0 flex-1 rounded-xl bg-slate-50/90 px-4 py-3.5 font-mono text-[15px] font-medium tracking-wide text-slate-900 shadow-inner ring-1 ring-inset ring-slate-200/90 sm:text-base">
                  {senhaGerada}
                </div>
                <button
                  type="button"
                  onClick={() => void copiarSenha()}
                  className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition-all sm:min-w-[7.5rem] ${
                    senhaCopiada
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                      : 'bg-primary-600 text-white shadow-lg shadow-primary-600/20 hover:bg-primary-700 hover:shadow-primary-700/25'
                  }`}
                >
                  {senhaCopiada ? (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      Copiado
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 opacity-90" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                      </svg>
                      Copiar
                    </>
                  )}
                </button>
              </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input
                    value={createForm.telefone}
                    onChange={e => setCreateForm({ ...createForm, telefone: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="rounded-xl border border-primary-200 bg-gradient-to-r from-primary-50 to-white px-3 py-3 sm:px-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-700">Senha inicial</p>
                      <p className="mt-1 text-sm font-medium text-gray-800">Gerar senha automática e exigir troca no 1º acesso</p>
                    </div>
                    <label className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-primary-700">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={gerarSenhaAuto}
                        onClick={() => setGerarSenhaAuto(v => !v)}
                        className={[
                          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                          gerarSenhaAuto ? 'bg-primary-600' : 'bg-gray-300',
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                            gerarSenhaAuto ? 'translate-x-4' : 'translate-x-0.5',
                          ].join(' ')}
                        />
                      </button>
                      {gerarSenhaAuto ? 'Ativo' : 'Inativo'}
                    </label>
                  </div>
                </div>
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
