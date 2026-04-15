'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { clienteService, ClientePayload } from '@/services/clienteService'
import { Cliente } from '@/types'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { appConfirm } from '@/lib/dialogs'
import {
  formatCpfDisplay,
  formatPhoneBrDisplay,
  isValidCpfDigits,
  onlyDigits,
  parseApiFieldErrors,
  type ApiFieldErrors,
} from '@/lib/brDocuments'
import { consultarCep, formatCepMask } from '@/lib/viacep'

type FormState = {
  nome: string
  email: string
  telefone: string
  cpf: string
  /** Texto livre sem ViaCEP */
  enderecoSemCep: boolean
  cepDisplay: string
  cepOk: boolean
  cepErro: string | null
  loadingCep: boolean
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
  enderecoManual: string
}

function buildEnderecoCep(f: FormState): string {
  const d = onlyDigits(f.cepDisplay)
  let line1 = (f.logradouro || '').trim()
  const num = (f.numero || '').trim()
  if (num) line1 = line1 ? `${line1}, ${num}` : num
  const comp = (f.complemento || '').trim()
  if (comp) line1 = line1 ? `${line1} - ${comp}` : comp
  const lines: string[] = []
  if (line1) lines.push(line1)
  const b = (f.bairro || '').trim()
  if (b) lines.push(b)
  const city = (f.cidade || '').trim()
  const uf = (f.uf || '').trim()
  if (city || uf) lines.push([city, uf].filter(Boolean).join('/'))
  lines.push(`CEP: ${formatCepMask(d)}`)
  return lines.join('\n')
}

const emptyForm = (): FormState => ({
  nome: '',
  email: '',
  telefone: '',
  cpf: '',
  enderecoSemCep: false,
  cepDisplay: '',
  cepOk: false,
  cepErro: null,
  loadingCep: false,
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  enderecoManual: '',
})

function fmtCpfCell(cpf: string | undefined | null): string {
  if (!cpf) return '—'
  const d = onlyDigits(cpf)
  return d.length === 11 ? formatCpfDisplay(d) : cpf
}

function fmtPhoneCell(tel: string | undefined | null): string {
  if (!tel) return ''
  const d = onlyDigits(tel)
  return d.length >= 8 ? formatPhoneBrDisplay(d) : String(tel).trim()
}

function IconPhone({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
      />
    </svg>
  )
}

function IconMail({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    </svg>
  )
}

function IconPencil({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
      />
    </svg>
  )
}

function IconKey({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
      />
    </svg>
  )
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  )
}

export default function ClientesPage() {
  const router = useRouter()
  const [list, setList] = useState<Cliente[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [editing, setEditing] = useState<Cliente | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<ApiFieldErrors>({})
  const [conviteMsg, setConviteMsg] = useState('')

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    load()
  }, [router])

  useEffect(() => {
    if (!showModal || !editing) return
    const d = onlyDigits(editing.cep || '')
    if (d.length !== 8) return
    let cancelled = false
    ;(async () => {
      const data = await consultarCep(d)
      if (cancelled) return
      setForm(f => ({
        ...f,
        cepOk: !!data,
        cepErro: data ? null : 'CEP não encontrado na base dos Correios.',
        logradouro: data?.logradouro ?? '',
        bairro: data?.bairro ?? '',
        cidade: data?.localidade ?? '',
        uf: data?.uf ?? '',
      }))
    })()
    return () => {
      cancelled = true
    }
  }, [showModal, editing?.id, editing?.cep])

  async function load() {
    setLoading(true)
    try {
      setList(await clienteService.getAll(q.trim() || undefined))
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setError('')
    setFieldErrors({})
    setShowModal(true)
  }

  function openEdit(c: Cliente) {
    setEditing(c)
    const cepD = onlyDigits(c.cep || '')
    if (cepD.length === 8) {
      setForm({
        ...emptyForm(),
        nome: c.nome,
        email: (c.email || '').trim(),
        telefone: formatPhoneBrDisplay(onlyDigits(c.telefone || '')),
        cpf: formatCpfDisplay(onlyDigits(c.cpf || '')),
        enderecoSemCep: false,
        cepDisplay: formatCepMask(cepD),
        cepOk: false,
        cepErro: null,
      })
    } else {
      setForm({
        ...emptyForm(),
        nome: c.nome,
        email: (c.email || '').trim(),
        telefone: formatPhoneBrDisplay(onlyDigits(c.telefone || '')),
        cpf: formatCpfDisplay(onlyDigits(c.cpf || '')),
        enderecoSemCep: true,
        enderecoManual: c.endereco || '',
      })
    }
    setError('')
    setFieldErrors({})
    setShowModal(true)
  }

  async function handleDelete(c: Cliente) {
    if (!(await appConfirm(`Remover cliente "${c.nome}"?`, 'Excluir cliente'))) return
    await clienteService.remove(c.id)
    await load()
  }

  async function buscarCepClick() {
    const d = onlyDigits(form.cepDisplay)
    setForm(f => ({ ...f, cepErro: null, loadingCep: true, cepOk: false }))
    if (d.length !== 8) {
      setForm(f => ({
        ...f,
        loadingCep: false,
        cepOk: false,
        cepErro: 'Informe os 8 dígitos do CEP.',
        logradouro: '',
        bairro: '',
        cidade: '',
        uf: '',
      }))
      return
    }
    const data = await consultarCep(d)
    setForm(f => ({
      ...f,
      loadingCep: false,
      cepOk: !!data,
      cepErro: data ? null : 'CEP não encontrado na base dos Correios.',
      cepDisplay: formatCepMask(d),
      logradouro: data?.logradouro ?? '',
      bairro: data?.bairro ?? '',
      cidade: data?.localidade ?? '',
      uf: data?.uf ?? '',
    }))
  }

  function validateLocal(): string | null {
    const nome = form.nome.trim()
    if (nome.length < 3) return 'Nome deve ter no mínimo 3 caracteres.'
    if (!form.email.trim()) return 'E-mail é obrigatório.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'E-mail inválido.'
    const telDigits = onlyDigits(form.telefone)
    if (telDigits.length < 8) return 'Telefone deve ter no mínimo 8 dígitos.'
    const cpfD = onlyDigits(form.cpf)
    if (cpfD.length !== 11) return 'CPF deve ter 11 dígitos.'
    if (!isValidCpfDigits(cpfD)) return 'CPF inválido.'

    if (form.enderecoSemCep) {
      const t = form.enderecoManual.trim()
      if (t.length > 0 && t.length < 10) return 'Endereço livre: mínimo 10 caracteres ou deixe vazio.'
    } else {
      const d = onlyDigits(form.cepDisplay)
      if (d.length === 0) {
        // endereço opcional
      } else {
        if (d.length !== 8) return 'CEP deve ter 8 dígitos.'
        if (!form.cepOk) return 'Clique em Buscar para validar o CEP.'
        if (!form.numero.trim()) return 'Informe o número do endereço.'
        if (buildEnderecoCep(form).trim().length < 10) return 'Complete o endereço retornado pelo CEP.'
      }
    }
    return null
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setFieldErrors({})
    const localErr = validateLocal()
    if (localErr) {
      setError(localErr)
      setSaving(false)
      return
    }

    const payload: ClientePayload = {
      nome: form.nome.trim(),
      email: form.email.trim().toLowerCase(),
      telefone: form.telefone.trim(),
      cpf: onlyDigits(form.cpf),
    }

    if (form.enderecoSemCep) {
      payload.endereco = form.enderecoManual.trim() || undefined
    } else {
      const d = onlyDigits(form.cepDisplay)
      if (d.length === 8 && form.cepOk) {
        payload.cep = d
        payload.endereco = buildEnderecoCep(form)
      } else {
        payload.endereco = undefined
      }
    }

    try {
      if (editing) await clienteService.update(editing.id, payload)
      else await clienteService.create(payload)
      setShowModal(false)
      await load()
    } catch (err: unknown) {
      const { message, fields } = parseApiFieldErrors(err)
      setFieldErrors(fields)
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleRegenerar(id: number) {
    setConviteMsg('')
    try {
      const { codigo } = await clienteService.regenerarConvite(id)
      setConviteMsg(`Novo código PDV: ${codigo}`)
      await load()
    } catch {
      setConviteMsg('Não foi possível regenerar o convite.')
    }
  }

  function fieldClass(
    name: keyof ApiFieldErrors | 'nome' | 'email' | 'telefone' | 'cpf' | 'endereco' | 'cep' | 'numero',
  ) {
    return fieldErrors[name as string]
      ? 'input-field border-red-400 ring-1 ring-red-300 focus:ring-red-400'
      : 'input-field'
  }

  const cepDigits = onlyDigits(form.cepDisplay)
  const showCepFields = !form.enderecoSemCep && cepDigits.length === 8 && form.cepOk

  return (
    <AppLayout title="Clientes">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
          <div className="flex gap-2 flex-1 max-w-md">
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load()}
              className="input-field flex-1"
              placeholder="Buscar nome, e-mail, telefone, CPF, CEP ou código PDV..."
            />
            <button type="button" onClick={() => load()} className="btn-secondary px-4">
              Buscar
            </button>
          </div>
          <button onClick={openCreate} className="btn-primary">
            + Novo Cliente
          </button>
        </div>

        {conviteMsg && (
          <div className="bg-primary-50 text-primary-900 text-sm px-4 py-3 rounded-lg border border-primary-200">
            {conviteMsg}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400">Carregando...</div>
        ) : list.length === 0 ? (
          <div className="card text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">👤</p>
            <p>Nenhum cliente encontrado.</p>
            <button onClick={openCreate} className="btn-primary mt-4">
              Cadastrar cliente
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden ring-1 ring-black/[0.03]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gradient-to-b from-gray-50 to-gray-50/90 backdrop-blur-sm">
                  <tr>
                    <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Cliente
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      CPF
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Contato
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Convite PDV
                    </th>
                    <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {list.map(c => {
                    const phone = fmtPhoneCell(c.telefone)
                    const email = (c.email || '').trim()
                    const hasContact = phone || email
                    return (
                      <tr
                        key={c.id}
                        className="group transition-colors hover:bg-primary-50/35"
                      >
                        <td className="px-5 py-4 align-top">
                          <p className="font-semibold text-gray-900 leading-snug">{c.nome}</p>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <span className="inline-flex items-center rounded-lg bg-slate-100 border border-slate-200/80 px-2.5 py-1 font-mono text-xs font-medium text-slate-800 tabular-nums">
                            {fmtCpfCell(c.cpf)}
                          </span>
                        </td>
                        <td className="px-5 py-4 align-top">
                          {!hasContact ? (
                            <span className="text-sm text-gray-400">—</span>
                          ) : (
                            <div className="flex flex-col gap-1.5 max-w-md">
                              {phone && (
                                <span className="inline-flex items-center gap-2 text-sm text-gray-800">
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-500 shadow-sm">
                                    <IconPhone className="h-3.5 w-3.5" />
                                  </span>
                                  <span className="tabular-nums">{phone}</span>
                                </span>
                              )}
                              {email && (
                                <span className="inline-flex items-start gap-2 text-sm text-gray-600">
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-500 shadow-sm mt-0.5">
                                    <IconMail className="h-3.5 w-3.5" />
                                  </span>
                                  <span className="break-all leading-snug">{email}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 align-top">
                          {c.codigoConvitePdv ? (
                            <span className="inline-flex items-center rounded-lg border border-amber-200/90 bg-amber-50 px-2.5 py-1 font-mono text-xs font-semibold tracking-wide text-amber-950">
                              {c.codigoConvitePdv}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEdit(c)}
                              title="Editar cliente"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-primary-700 shadow-sm transition hover:border-primary-200 hover:bg-primary-50"
                            >
                              <IconPencil className="h-3.5 w-3.5" />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRegenerar(c.id)}
                              title="Gerar novo convite PDV"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200/80 bg-amber-50/80 px-2.5 py-1.5 text-xs font-medium text-amber-900 shadow-sm transition hover:bg-amber-100"
                            >
                              <IconKey className="h-3.5 w-3.5" />
                              Convite
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(c)}
                              title="Remover cliente"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 shadow-sm transition hover:border-red-200 hover:bg-red-50"
                            >
                              <IconTrash className="h-3.5 w-3.5" />
                              Remover
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">{editing ? 'Editar Cliente' : 'Novo Cliente'}</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  value={form.nome}
                  onChange={e => setForm({ ...form, nome: e.target.value })}
                  className={fieldClass('nome')}
                  minLength={3}
                  maxLength={200}
                  autoComplete="name"
                  required
                />
                {fieldErrors.nome && <p className="text-xs text-red-600 mt-1">{fieldErrors.nome}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className={fieldClass('email')}
                    autoComplete="email"
                    required
                  />
                  {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                  <input
                    value={form.telefone}
                    onChange={e => setForm({ ...form, telefone: formatPhoneBrDisplay(onlyDigits(e.target.value)) })}
                    className={fieldClass('telefone')}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="(00) 00000-0000"
                    required
                  />
                  {fieldErrors.telefone && <p className="text-xs text-red-600 mt-1">{fieldErrors.telefone}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF *</label>
                <input
                  value={form.cpf}
                  onChange={e => setForm({ ...form, cpf: formatCpfDisplay(onlyDigits(e.target.value)) })}
                  className={fieldClass('cpf')}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="000.000.000-00"
                  required
                />
                {fieldErrors.cpf && <p className="text-xs text-red-600 mt-1">{fieldErrors.cpf}</p>}
              </div>

              <div className="border border-gray-100 rounded-lg p-4 space-y-3 bg-gray-50/80">
                <div className="flex items-center gap-2">
                  <input
                    id="enderecoSemCep"
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={form.enderecoSemCep}
                    onChange={e => {
                      const v = e.target.checked
                      setForm(f => ({
                        ...f,
                        enderecoSemCep: v,
                        ...(v
                          ? {
                              cepOk: false,
                              cepErro: null,
                              loadingCep: false,
                            }
                          : {}),
                      }))
                    }}
                  />
                  <label htmlFor="enderecoSemCep" className="text-sm text-gray-700 cursor-pointer">
                    Endereço em texto livre (sem busca por CEP)
                  </label>
                </div>

                {form.enderecoSemCep ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                    <textarea
                      value={form.enderecoManual}
                      onChange={e => setForm({ ...form, enderecoManual: e.target.value })}
                      className={`${fieldClass('endereco')} min-h-[96px]`}
                      rows={3}
                      placeholder="Rua, número, bairro, cidade... (mín. 10 caracteres se preenchido)"
                    />
                    {fieldErrors.endereco && <p className="text-xs text-red-600 mt-1">{fieldErrors.endereco}</p>}
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          value={form.cepDisplay}
                          onChange={e => {
                            const v = formatCepMask(onlyDigits(e.target.value))
                            setForm(f => ({
                              ...f,
                              cepDisplay: v,
                              cepOk: false,
                              cepErro: null,
                            }))
                          }}
                          className={fieldClass('cep')}
                          inputMode="numeric"
                          autoComplete="postal-code"
                          placeholder="00000-000"
                          maxLength={9}
                        />
                        <button
                          type="button"
                          onClick={buscarCepClick}
                          disabled={form.loadingCep}
                          className="btn-secondary px-4 whitespace-nowrap shrink-0"
                        >
                          {form.loadingCep ? 'Buscando...' : 'Buscar'}
                        </button>
                      </div>
                      {form.cepErro && <p className="text-xs text-amber-700 mt-1">{form.cepErro}</p>}
                      {fieldErrors.cep && <p className="text-xs text-red-600 mt-1">{fieldErrors.cep}</p>}
                      <p className="text-xs text-gray-500 mt-1">
                        Deixe em branco se não for informar endereço. Após buscar, confira os dados e informe o número.
                      </p>
                    </div>

                    {showCepFields && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Logradouro</label>
                          <input
                            value={form.logradouro}
                            onChange={e => setForm({ ...form, logradouro: e.target.value })}
                            className="input-field"
                            autoComplete="street-address"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Número *</label>
                          <input
                            value={form.numero}
                            onChange={e => setForm({ ...form, numero: e.target.value })}
                            className={fieldClass('numero')}
                            inputMode="numeric"
                            autoComplete="off"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                          <input
                            value={form.complemento}
                            onChange={e => setForm({ ...form, complemento: e.target.value })}
                            className="input-field"
                            autoComplete="off"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                          <input
                            value={form.bairro}
                            onChange={e => setForm({ ...form, bairro: e.target.value })}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                          <input
                            value={form.cidade}
                            onChange={e => setForm({ ...form, cidade: e.target.value })}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
                          <input
                            value={form.uf}
                            onChange={e =>
                              setForm({ ...form, uf: e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) })
                            }
                            className="input-field"
                            maxLength={2}
                            placeholder="SP"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
