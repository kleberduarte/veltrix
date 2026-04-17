'use client'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { parametrosEmpresaService, ParametroEmpresaPayload } from '@/services/parametrosEmpresaService'
import { CompanyOption, ParametroEmpresa, Segmento } from '@/types'
import { useRouter } from 'next/navigation'
import { getAuth, isAuthenticated } from '@/lib/auth'
import { appConfirm } from '@/lib/dialogs'
import { authService } from '@/services/authService'
import { userService } from '@/services/userService'
import {
  formatCnpjDisplay,
  formatPhoneBrDisplay,
  isValidCnpjDigits,
  onlyDigits,
  parseApiFieldErrors,
  type ApiFieldErrors,
} from '@/lib/brDocuments'

const NOME_MIN = 3
const NOME_MAX = 200
const MSG_MAX = 500
const URL_MAX = 2048
const PIX_MAX = 77
const END_OS_MAX = 2000
const TERMOS_MAX = 20000

const HEX6 = /^#([0-9A-Fa-f]{6})$/
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isReservedCompany(company: CompanyOption): boolean {
  if (company.systemDefault) return true
  const n = (company.name ?? '').trim().toLowerCase()
  return n === 'default' || n === 'sistema'
}

function segLabel(s: Segmento) {
  switch (s) {
    case 'FARMACIA':
      return 'Farmácia'
    case 'INFORMATICA':
      return 'Informática'
    default:
      return 'Geral'
  }
}

function segDesc(s: Segmento) {
  switch (s) {
    case 'FARMACIA':
      return 'Lote, validade, controlados e referências PMC.'
    case 'INFORMATICA':
      return 'Ordens de serviço e termos para assistência.'
    default:
      return 'Varejo e serviços sem regras específicas de segmento.'
  }
}

function normalizarNome(n: string) {
  return n.trim().replace(/\s+/g, ' ')
}

function formFromParametros(p: ParametroEmpresa | null): ParametroEmpresaPayload {
  if (!p) {
    return {
      nomeEmpresa: '',
      segmento: 'GERAL',
      farmaciaPmcModo: 'ALERTA',
      moduloFarmaciaAtivo: false,
      farmaciaLoteValidadeObrigatorio: false,
      farmaciaControladosAtivo: false,
      farmaciaAntimicrobianosAtivo: false,
      farmaciaPmcAtivo: false,
      moduloInformaticaAtivo: false,
    }
  }
  return {
    nomeEmpresa: p.nomeEmpresa ?? '',
    logoUrl: p.logoUrl ?? '',
    mensagemBoasVindas: p.mensagemBoasVindas ?? '',
    corPrimaria: p.corPrimaria ?? '#2563eb',
    corSecundaria: p.corSecundaria ?? '#1e3a8a',
    corFundo: p.corFundo ?? '#f9fafb',
    corTexto: p.corTexto ?? '#111827',
    corBotao: p.corBotao ?? '#2563eb',
    corBotaoTexto: p.corBotaoTexto ?? '#ffffff',
    chavePix: p.chavePix ?? '',
    suporteEmail: p.suporteEmail ?? '',
    suporteWhatsapp: p.suporteWhatsapp ?? '',
    segmento: (p.segmento as Segmento) || 'GERAL',
    moduloFarmaciaAtivo: !!p.moduloFarmaciaAtivo,
    farmaciaLoteValidadeObrigatorio: !!p.farmaciaLoteValidadeObrigatorio,
    farmaciaControladosAtivo: !!p.farmaciaControladosAtivo,
    farmaciaAntimicrobianosAtivo: !!p.farmaciaAntimicrobianosAtivo,
    farmaciaPmcAtivo: !!p.farmaciaPmcAtivo,
    farmaciaPmcModo: p.farmaciaPmcModo === 'BLOQUEIO' ? 'BLOQUEIO' : 'ALERTA',
    moduloInformaticaAtivo: !!p.moduloInformaticaAtivo,
    cnpj: p.cnpj ? formatCnpjDisplay(p.cnpj) : '',
    inscricaoMunicipal: p.inscricaoMunicipal ?? '',
    telefoneComercial: p.telefoneComercial ? formatPhoneBrDisplay(onlyDigits(p.telefoneComercial)) : '',
    fax: p.fax ?? '',
    emailComercial: p.emailComercial ?? '',
    enderecoLinha1Os: p.enderecoLinha1Os ?? '',
    cidadeUfOs: p.cidadeUfOs ?? '',
    textoTermosOs: p.textoTermosOs ?? '',
  }
}

function telefoneBrOk(s: string): boolean {
  if (!s.trim()) return true
  let d = onlyDigits(s)
  if (d.length === 13 && d.startsWith('55')) d = d.slice(2)
  return d.length >= 10 && d.length <= 11
}

function Section({
  id,
  icon,
  title,
  subtitle,
  children,
}: {
  id?: string
  icon: ReactNode
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-sm ring-1 ring-black/[0.03]"
    >
      <div className="flex gap-3 mb-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 border border-primary-100">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

function fieldWrap(
  field: string,
  fieldErrors: ApiFieldErrors,
  className = '',
): string {
  return fieldErrors[field]
    ? `${className} border-red-400 ring-1 ring-red-300 focus:ring-red-400`.trim()
    : className
}

export default function ParametrosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<ApiFieldErrors>({})
  const [form, setForm] = useState<ParametroEmpresaPayload>({
    nomeEmpresa: '',
    segmento: 'GERAL',
    farmaciaPmcModo: 'ALERTA',
    moduloFarmaciaAtivo: false,
    farmaciaLoteValidadeObrigatorio: false,
    farmaciaControladosAtivo: false,
    farmaciaAntimicrobianosAtivo: false,
    farmaciaPmcAtivo: false,
    moduloInformaticaAtivo: false,
  })
  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [currentCompanyId, setCurrentCompanyId] = useState<number | null>(null)
  const [newCompanyName, setNewCompanyName] = useState('')
  const [switching, setSwitching] = useState(false)
  const [creatingCo, setCreatingCo] = useState(false)
  const [empresaErr, setEmpresaErr] = useState('')
  /** Código PDV exibido após criar empresa (copiável). */
  const [empresaPdvCodeHighlight, setEmpresaPdvCodeHighlight] = useState<string | null>(null)
  const [isAdm, setIsAdm] = useState(false)
  const [deleteCompanyId, setDeleteCompanyId] = useState<number | null>(null)
  const [deleteCompanyName, setDeleteCompanyName] = useState('')
  const [deletingCompany, setDeletingCompany] = useState(false)
  const [accessCopied, setAccessCopied] = useState<number | null>(null)
  const [reloading, setReloading] = useState(false)
  const [companySearch, setCompanySearch] = useState('')
  const [initialFormSnapshot, setInitialFormSnapshot] = useState('')

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    setIsAdm(getAuth()?.role === 'ADM')
    ;(async () => {
      setLoading(true)
      try {
        const list = await userService.listCompanies().catch(() => [] as CompanyOption[])
        setCompanies(list)

        const defaultCo = list.find(isReservedCompany) ?? null
        const currentId = getAuth()?.companyId ?? null

        // Mantém a empresa do JWT (admin de tenant único não deve ser trocado para "default").
        setCurrentCompanyId(currentId ?? defaultCo?.id ?? null)

        const p = await parametrosEmpresaService.get()
        const next = formFromParametros(p)
        setForm(next)
        setInitialFormSnapshot(JSON.stringify(next))
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  async function refreshParametrosFromApi() {
    const p = await parametrosEmpresaService.get()
    const next = formFromParametros(p)
    setForm(next)
    setInitialFormSnapshot(JSON.stringify(next))
  }

  async function reloadCurrentCompanyParams() {
    if (hasUnsavedChanges) {
      const ok = await appConfirm(
        'Existem alteracoes nao salvas. Deseja descartar e recarregar os parametros?',
        'Descartar alteracoes',
      )
      if (!ok) return
    }
    setReloading(true)
    setError('')
    setFieldErrors({})
    setSuccess(false)
    try {
      await refreshParametrosFromApi()
    } catch {
      setError('Nao foi possivel recarregar os parametros desta empresa.')
    } finally {
      setReloading(false)
    }
  }

  async function handleSwitchCompany(companyId: number) {
    if (currentCompanyId === companyId) return
    if (hasUnsavedChanges) {
      const ok = await appConfirm(
        'Existem alteracoes nao salvas. Deseja trocar de empresa e descartar essas alteracoes?',
        'Trocar empresa',
      )
      if (!ok) return
    }
    setSwitching(true)
    setEmpresaErr('')
    try {
      await authService.switchCompany(companyId)
      setCurrentCompanyId(companyId)
      await refreshParametrosFromApi()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } }
      setEmpresaErr(ax.response?.data?.error || 'Não foi possível trocar de empresa.')
    } finally {
      setSwitching(false)
    }
  }

  async function handleCreateCompany() {
    const n = newCompanyName.trim()
    if (n.length < 2) {
      setEmpresaErr('Informe pelo menos 2 caracteres no nome da nova empresa.')
      return
    }
    setCreatingCo(true)
    setEmpresaErr('')
    setEmpresaPdvCodeHighlight(null)
    try {
      const c = await authService.createCompany(n)
      setNewCompanyName('')
      setCompanies(await userService.listCompanies())
      await authService.switchCompany(c.id)
      setCurrentCompanyId(c.id)
      await refreshParametrosFromApi()
      if (c.pdvInviteCode) setEmpresaPdvCodeHighlight(c.pdvInviteCode)
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } }
      setEmpresaErr(ax.response?.data?.error || 'Não foi possível criar a empresa.')
    } finally {
      setCreatingCo(false)
    }
  }

  async function confirmDeleteCompany() {
    if (!deleteCompanyId) return
    setDeletingCompany(true)
    setEmpresaErr('')
    try {
      await authService.deleteCompany(deleteCompanyId)
      const updatedList = await userService.listCompanies()
      setCompanies(updatedList)
      if (currentCompanyId === deleteCompanyId) {
        const fallback = updatedList.find(isReservedCompany) ?? updatedList[0] ?? null
        if (fallback) {
          await authService.switchCompany(fallback.id)
          setCurrentCompanyId(fallback.id)
          await refreshParametrosFromApi()
        }
      }
      setDeleteCompanyId(null)
      setDeleteCompanyName('')
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } }
      setEmpresaErr(ax.response?.data?.error || 'Não foi possível excluir a empresa.')
      setDeleteCompanyId(null)
    } finally {
      setDeletingCompany(false)
    }
  }

  function buildAccessLink(token: string) {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/acesso/${token}`
  }

  async function copyAccessLink(company: CompanyOption) {
    if (!company.accessToken) return
    try {
      await navigator.clipboard.writeText(buildAccessLink(company.accessToken))
      setAccessCopied(company.id)
      window.setTimeout(() => setAccessCopied(null), 2000)
    } catch {
      setEmpresaErr('Não foi possível copiar automaticamente.')
    }
  }

  function validateLocal(): ApiFieldErrors {
    const e: ApiFieldErrors = {}
    const nome = normalizarNome(form.nomeEmpresa ?? '')
    if (nome.length < NOME_MIN || nome.length > NOME_MAX) {
      e.nomeEmpresa = `Nome da empresa: entre ${NOME_MIN} e ${NOME_MAX} caracteres.`
    }
    const logo = (form.logoUrl ?? '').trim()
    if (logo) {
      if (logo.length > URL_MAX) e.logoUrl = `URL muito longa (máx. ${URL_MAX}).`
      else if (!/^https?:\/\//i.test(logo)) e.logoUrl = 'Informe uma URL http ou https válida.'
    }
    const msg = form.mensagemBoasVindas ?? ''
    if (msg.length > MSG_MAX) e.mensagemBoasVindas = `Máximo ${MSG_MAX} caracteres.`
    for (const key of ['corPrimaria', 'corSecundaria', 'corFundo', 'corTexto', 'corBotao', 'corBotaoTexto'] as const) {
      const v = (form[key] ?? '').trim()
      if (v && !HEX6.test(v)) e[key] = 'Use o formato #RRGGBB (ex.: #2563eb).'
    }
    const pix = (form.chavePix ?? '').trim()
    if (pix.length > PIX_MAX) e.chavePix = `Chave PIX: máximo ${PIX_MAX} caracteres.`
    const se = (form.suporteEmail ?? '').trim()
    if (se && (!EMAIL_OK.test(se) || se.length > 255)) e.suporteEmail = 'E-mail inválido.'
    const ec = (form.emailComercial ?? '').trim()
    if (ec && (!EMAIL_OK.test(ec) || ec.length > 255)) e.emailComercial = 'E-mail inválido.'
    // suporteWhatsapp: texto livre, máx 32 chars (regra do legado)
    const sw = (form.suporteWhatsapp ?? '').trim()
    if (sw.length > 32) e.suporteWhatsapp = 'WhatsApp de suporte: máximo 32 caracteres.'
    if (!telefoneBrOk(form.telefoneComercial ?? '')) e.telefoneComercial = 'Telefone: 10 ou 11 dígitos (DDD), ou +55.'
    const cnpjD = onlyDigits(form.cnpj ?? '')
    if (cnpjD.length > 0 && (cnpjD.length !== 14 || !isValidCnpjDigits(cnpjD))) {
      e.cnpj = 'CNPJ inválido (14 dígitos e dígitos verificadores).'
    }
    if (form.moduloFarmaciaAtivo && form.farmaciaPmcAtivo) {
      const m = form.farmaciaPmcModo ?? 'ALERTA'
      if (m !== 'ALERTA' && m !== 'BLOQUEIO') e.farmaciaPmcModo = 'Escolha ALERTA ou BLOQUEIO.'
    }
    const eos = form.enderecoLinha1Os ?? ''
    if (eos.length > END_OS_MAX) e.enderecoLinha1Os = `Máximo ${END_OS_MAX} caracteres.`
    const termos = form.textoTermosOs ?? ''
    if (termos.length > TERMOS_MAX) e.textoTermosOs = `Máximo ${TERMOS_MAX} caracteres.`
    return e
  }

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)
    setFieldErrors({})
    const local = validateLocal()
    if (Object.keys(local).length > 0) {
      setFieldErrors(local)
      setError('Corrija os campos destacados.')
      setSaving(false)
      return
    }
    const payload: ParametroEmpresaPayload = {
      ...form,
      nomeEmpresa: normalizarNome(form.nomeEmpresa ?? ''),
      cnpj: onlyDigits(form.cnpj ?? '') || undefined,
      telefoneComercial: (form.telefoneComercial ?? '').trim() || undefined,
    }
    try {
      const saved = await parametrosEmpresaService.save(payload)
      setSuccess(true)
      window.setTimeout(() => setSuccess(false), 5000)
      if (saved) {
        const next = formFromParametros(saved)
        setForm(next)
        setInitialFormSnapshot(JSON.stringify(next))
        window.dispatchEvent(new Event('veltrix-auth-changed'))
      }
    } catch (err: unknown) {
      const { message, fields } = parseApiFieldErrors(err)
      setFieldErrors(fields)
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  function setCor(field: keyof ParametroEmpresaPayload, hex: string) {
    const v = hex.startsWith('#') ? hex : `#${hex}`
    setForm(f => ({ ...f, [field]: v.slice(0, 7) }))
  }

  function scrollToSection(id: string) {
    if (typeof window === 'undefined') return
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const farmaciaOff = !form.moduloFarmaciaAtivo
  const pmcOff = farmaciaOff || !form.farmaciaPmcAtivo
  const segmentoAtual = form.segmento ?? 'GERAL'
  const showFarmaciaModule = segmentoAtual !== 'INFORMATICA'
  const showInformaticaModule = segmentoAtual !== 'FARMACIA'
  const activeCompany = companies.find(c => c.id === currentCompanyId) ?? null
  /** ADM global: sempre vê lista, busca e troca de empresas, independente da empresa ativa no JWT. */
  const showEmpresasManagement = isAdm
  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(form) !== initialFormSnapshot,
    [form, initialFormSnapshot],
  )
  const orderedCompanies = useMemo(() => {
    const defaultCo = companies.find(isReservedCompany) ?? null
    return defaultCo ? [defaultCo, ...companies.filter(c => c.id !== defaultCo.id)] : companies
  }, [companies])
  const filteredCompanies = useMemo(() => {
    const q = companySearch.trim().toLowerCase()
    if (!q) return orderedCompanies
    return orderedCompanies.filter((c) => (c.name ?? '').toLowerCase().includes(q))
  }, [orderedCompanies, companySearch])
  const sectionLinks = useMemo(() => {
    const base: { id: string; label: string }[] = []
    if (showEmpresasManagement) base.push({ id: 'sec-empresas', label: 'Empresas' })
    base.push(
      { id: 'sec-identidade', label: 'Identidade' },
      { id: 'sec-tema', label: 'Aparencia' },
      { id: 'sec-comercial', label: 'Comercial' },
      { id: 'sec-segmento', label: 'Segmento' },
    )
    if (showFarmaciaModule) base.push({ id: 'sec-farmacia', label: 'Farmacia' })
    if (showInformaticaModule) base.push({ id: 'sec-informatica', label: 'Informatica / OS' })
    return base
  }, [showEmpresasManagement, showFarmaciaModule, showInformaticaModule])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        if (!saving && !reloading) {
          const formEl = document.getElementById('parametros-form') as HTMLFormElement | null
          formEl?.requestSubmit()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [reloading, saving])

  if (loading) {
    return (
      <AppLayout title="Parâmetros">
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Parâmetros da empresa">
      <div className="max-w-4xl mx-auto pb-24">
        <header className="mb-6 space-y-4">
          <div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-white via-primary-50/40 to-white p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Parâmetros da empresa</h1>
                <p className="text-gray-600 mt-1 max-w-2xl">
                  Configure identidade visual, suporte, segmento e modulos em um unico painel, com validacoes automaticas.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <p className="text-gray-500">Empresa ativa</p>
                  <p className="font-semibold text-gray-800 truncate">{activeCompany?.name ?? 'Nao selecionada'}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <p className="text-gray-500">Segmento</p>
                  <p className="font-semibold text-gray-800">{segLabel(form.segmento ?? 'GERAL')}</p>
                </div>
                {form.moduloFarmaciaAtivo && (
                  <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                    <p className="text-gray-500">Farmacia</p>
                    <p className="font-semibold text-emerald-700">Ativo</p>
                  </div>
                )}
                {form.moduloInformaticaAtivo && (
                  <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                    <p className="text-gray-500">Informatica / OS</p>
                    <p className="font-semibold text-emerald-700">Ativo</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {sectionLinks.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-primary-200 hover:bg-primary-50 transition"
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>

        <form id="parametros-form" onSubmit={handleSave} className="space-y-6">

          {/* ── Empresas (somente ADM na empresa default / sistema) ── */}
          {showEmpresasManagement && (
          <section id="sec-empresas" className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-sm ring-1 ring-black/[0.03]">
            {/* Cabeçalho + form inline de nova empresa */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-gray-900">Empresas</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Selecione uma empresa para editar seus parâmetros.
                  {switching && <span className="ml-2 text-primary-600 animate-pulse">Alternando…</span>}
                </p>
              </div>
              {isAdm && (
                <div className="flex gap-2 items-center shrink-0">
                  <input
                    className="input-field w-44 text-sm"
                    placeholder="Nome da empresa"
                    value={newCompanyName}
                    onChange={e => setNewCompanyName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void handleCreateCompany() } }}
                  />
                  <button
                    type="button"
                    disabled={creatingCo || newCompanyName.trim().length < 2}
                    onClick={() => void handleCreateCompany()}
                    className="btn-primary text-sm whitespace-nowrap"
                  >
                    {creatingCo ? '…' : '+ Nova'}
                  </button>
                </div>
              )}
            </div>

            {empresaErr && <p className="text-sm text-red-600 mb-3">{empresaErr}</p>}
            {empresaPdvCodeHighlight && (
              <div className="mb-4 flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Convite PDV (vendedor no login)</p>
                  <p className="mt-1 text-sm text-emerald-900">
                    Empresa criada. Informe este código em <strong>Primeiro acesso</strong> na tela de login.
                  </p>
                  <code className="mt-2 inline-block rounded-lg bg-white px-3 py-2 font-mono text-base font-semibold text-emerald-950 ring-1 ring-emerald-200">
                    {empresaPdvCodeHighlight}
                  </code>
                </div>
                <button
                  type="button"
                  className="shrink-0 self-start rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 sm:self-center"
                  onClick={() => void navigator.clipboard.writeText(empresaPdvCodeHighlight)}
                >
                  Copiar código
                </button>
              </div>
            )}

            <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
              <input
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                className="input-field max-w-sm"
                placeholder="Buscar empresa..."
              />
              <p className="text-xs text-gray-500">
                {filteredCompanies.length} de {orderedCompanies.length} empresa(s)
              </p>
            </div>

            {/* Lista unificada */}
            {filteredCompanies.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Nenhuma empresa encontrada para esta busca.</p>
            ) : (
              <div className="max-h-[520px] overflow-y-auto pr-1">
                <ul className="space-y-2">
                  {filteredCompanies.map(c => {
                    const isActive = c.id === currentCompanyId
                    const isDefaultCo = isReservedCompany(c)
                    return (
                      <li
                        key={c.id}
                        className={[
                          'rounded-2xl border transition-all',
                          isActive
                            ? 'border-primary-200 bg-primary-50/60 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300',
                        ].join(' ')}
                      >
                        {/* Linha principal */}
                        <div className="flex items-start gap-3 px-4 py-4">
                          {/* Seleção + nome */}
                          <button
                            type="button"
                            disabled={switching}
                            onClick={() => void handleSwitchCompany(c.id)}
                            className={[
                              'flex flex-1 items-start gap-3 min-w-0 text-left',
                              switching && !isActive ? 'opacity-50 cursor-not-allowed' : '',
                            ].join(' ')}
                          >
                            <span className={[
                              'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                              isActive ? 'border-primary-600 bg-primary-600' : 'border-gray-300 bg-white',
                            ].join(' ')}>
                              {isActive && (
                                <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="currentColor">
                                  <path d="M10.28 2.28L4.5 8.06 1.72 5.28a1 1 0 00-1.44 1.44l3.5 3.5a1 1 0 001.44 0l6.5-6.5a1 1 0 00-1.44-1.44z" />
                                </svg>
                              )}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-gray-900 truncate">{c.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {isActive ? 'Empresa selecionada para edição' : 'Clique para selecionar'}
                              </p>
                            </div>
                          </button>

                          {/* Badges + ações */}
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                            {isDefaultCo && (
                              <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500 ring-1 ring-gray-200">
                                Default
                              </span>
                            )}
                            {isActive && (
                              <span className="inline-flex rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700">
                                Ativa
                              </span>
                            )}
                            </div>

                            {/* Excluir (ADM, não-Default) */}
                            {isAdm && !isDefaultCo && (
                              <div className="flex items-center gap-2 flex-wrap justify-end">
                                <button
                                  type="button"
                                  onClick={() => { setDeleteCompanyId(c.id); setDeleteCompanyName(c.name) }}
                                  className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
                                >
                                  Excluir
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Links em layout mais legível */}
                        {isAdm && !isDefaultCo && (
                          <div className="px-4 pb-4">
                            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 space-y-3">
                              {c.accessToken && (
                                <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5">
                                  <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <p className="text-[11px] uppercase tracking-wide text-gray-500">Link de acesso da empresa</p>
                                    <button
                                      type="button"
                                      onClick={() => void copyAccessLink(c)}
                                      className={[
                                        'rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-colors',
                                        accessCopied === c.id
                                          ? 'border-green-200 bg-green-50 text-green-700'
                                          : 'border-primary-200 bg-white text-primary-700 hover:bg-primary-50',
                                      ].join(' ')}
                                    >
                                      {accessCopied === c.id ? 'Copiado' : 'Copiar'}
                                    </button>
                                  </div>
                                  <p className="text-xs text-gray-700 font-mono break-all">{buildAccessLink(c.accessToken)}</p>
                                  <p className="text-xs text-gray-500 mt-2">
                                    Login, primeiro acesso e convite PDV usam este endereço. Administradores e vendedores são criados pelo painel ou pelo código de convite.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </section>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 px-4 py-3 text-sm">
              Parâmetros salvos com sucesso.
            </div>
          )}

          <Section
            id="sec-identidade"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12M3 9h12M3 15h12"
                />
              </svg>
            }
            title="Identidade"
            subtitle="Nome exibido no PDV e mensagens; URL do logo para catálogo e telas públicas."
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da empresa *</label>
                <input
                  value={form.nomeEmpresa ?? ''}
                  onChange={e => setForm({ ...form, nomeEmpresa: e.target.value })}
                  className={fieldWrap('nomeEmpresa', fieldErrors, 'input-field')}
                  minLength={NOME_MIN}
                  maxLength={NOME_MAX}
                  autoComplete="organization"
                />
                {fieldErrors.nomeEmpresa && <p className="text-xs text-red-600 mt-1">{fieldErrors.nomeEmpresa}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL do logo</label>
                <input
                  value={form.logoUrl ?? ''}
                  onChange={e => setForm({ ...form, logoUrl: e.target.value })}
                  className={fieldWrap('logoUrl', fieldErrors, 'input-field')}
                  placeholder="https://..."
                  inputMode="url"
                />
                {fieldErrors.logoUrl && <p className="text-xs text-red-600 mt-1">{fieldErrors.logoUrl}</p>}
                {(form.logoUrl ?? '').match(/^https?:\/\//i) && (
                  <div className="mt-2 flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.logoUrl ?? ''}
                      alt="Preview do logo"
                      className="h-12 w-auto max-w-[160px] rounded border border-gray-200 bg-gray-50 object-contain p-1"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                      onLoad={e => { (e.currentTarget as HTMLImageElement).style.display = '' }}
                    />
                    <span className="text-xs text-gray-400">Preview do logo</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem de boas-vindas</label>
                <textarea
                  value={form.mensagemBoasVindas ?? ''}
                  onChange={e => setForm({ ...form, mensagemBoasVindas: e.target.value })}
                  className={fieldWrap('mensagemBoasVindas', fieldErrors, 'input-field min-h-[88px]')}
                  rows={3}
                  maxLength={MSG_MAX}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {(form.mensagemBoasVindas ?? '').length}/{MSG_MAX} caracteres
                </p>
                {fieldErrors.mensagemBoasVindas && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.mensagemBoasVindas}</p>
                )}
              </div>
            </div>
          </Section>

          <Section
            id="sec-tema"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125a1.125 1.125 0 001.125-1.125v-5.25a1.125 1.125 0 00-1.125-1.125h-7.218m-3.75 3.75v-3.75m0 0h3.75m-3.75 0H9.375"
                />
              </svg>
            }
            title="Aparência (tema)"
            subtitle="Cores em hexadecimal de 6 dígitos (#RRGGBB), usadas no PDV e áreas personalizadas."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(
                [
                  ['corPrimaria', 'Primária'],
                  ['corSecundaria', 'Secundária'],
                  ['corFundo', 'Fundo'],
                  ['corTexto', 'Texto'],
                  ['corBotao', 'Botão'],
                  ['corBotaoTexto', 'Texto do botão'],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={(form[key] as string)?.match(/^#[0-9A-Fa-f]{6}$/) ? (form[key] as string) : '#2563eb'}
                      onChange={e => setCor(key, e.target.value)}
                      className="h-11 w-14 rounded-lg border border-gray-200 cursor-pointer shrink-0"
                    />
                    <input
                      value={form[key] as string}
                      onChange={e => setCor(key, e.target.value)}
                      className={fieldWrap(key, fieldErrors, 'input-field font-mono text-sm flex-1')}
                      placeholder="#RRGGBB"
                      maxLength={7}
                    />
                  </div>
                  {fieldErrors[key] && <p className="text-xs text-red-600 mt-1">{fieldErrors[key]}</p>}
                </div>
              ))}
            </div>
          </Section>

          <Section
            id="sec-comercial"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 18.75a60.07 60.07 0 0115.797 2.074c1.227.256 2.457-.491 2.457-1.49V8.476a1.125 1.125 0 00-1.227-1.11l-5.786.722a60.104 60.104 0 00-15.797 2.074 1.125 1.125 0 00-.66 1.085v9.15c0 .927.63 1.748 1.527 1.91z"
                />
              </svg>
            }
            title="Comercial e suporte"
            subtitle="Chave PIX para recebimento no PDV; contatos de suporte na área do cliente."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Chave PIX</label>
                <input
                  value={form.chavePix ?? ''}
                  onChange={e => setForm({ ...form, chavePix: e.target.value })}
                  className={fieldWrap('chavePix', fieldErrors, 'input-field')}
                  maxLength={PIX_MAX}
                  placeholder="E-mail, CPF/CNPJ, telefone ou EVP"
                />
                <p className="text-xs text-gray-400 mt-1">Máximo {PIX_MAX} caracteres (regra BACEN).</p>
                {fieldErrors.chavePix && <p className="text-xs text-red-600 mt-1">{fieldErrors.chavePix}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail suporte</label>
                <input
                  type="email"
                  value={form.suporteEmail ?? ''}
                  onChange={e => setForm({ ...form, suporteEmail: e.target.value })}
                  className={fieldWrap('suporteEmail', fieldErrors, 'input-field')}
                />
                {fieldErrors.suporteEmail && <p className="text-xs text-red-600 mt-1">{fieldErrors.suporteEmail}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp suporte</label>
                <input
                  value={form.suporteWhatsapp ?? ''}
                  onChange={e => setForm({ ...form, suporteWhatsapp: e.target.value })}
                  className={fieldWrap('suporteWhatsapp', fieldErrors, 'input-field')}
                  maxLength={32}
                  placeholder="DDD + número, ex: 11999998888"
                />
                <p className="text-xs text-gray-400 mt-1">Máximo 32 caracteres.</p>
                {fieldErrors.suporteWhatsapp && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.suporteWhatsapp}</p>
                )}
              </div>
            </div>
          </Section>

          <Section
            id="sec-segmento"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 17.25a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                />
              </svg>
            }
            title="Segmento"
            subtitle="Define o contexto de negócio; os módulos abaixo podem ser ligados conforme a operação."
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['GERAL', 'FARMACIA', 'INFORMATICA'] as Segmento[]).map(s => {
                const active = form.segmento === s
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm({ ...form, segmento: s })}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      active
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{segLabel(s)}</p>
                    <p className="text-xs text-gray-500 mt-1">{segDesc(s)}</p>
                  </button>
                )
              })}
            </div>
          </Section>

          {showFarmaciaModule && (
          <Section
            id="sec-farmacia"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
                />
              </svg>
            }
            title="Módulo farmácia"
            subtitle="Ative o ramo e configure lote, controlados, antimicrobianos e PMC."
          >
            <label className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={!!form.moduloFarmaciaAtivo}
                onChange={e => setForm({ ...form, moduloFarmaciaAtivo: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
              />
              <span className="text-sm font-medium text-gray-800">Ativar módulo farmácia</span>
            </label>
            <div
              className={`space-y-3 pl-1 ${farmaciaOff ? 'opacity-45 pointer-events-none' : ''}`}
              aria-disabled={farmaciaOff}
            >
              {(
                [
                  ['farmaciaLoteValidadeObrigatorio', 'Lote e validade obrigatórios na venda'],
                  ['farmaciaControladosAtivo', 'Medicamentos controlados'],
                  ['farmaciaAntimicrobianosAtivo', 'Antimicrobianos'],
                  ['farmaciaPmcAtivo', 'PMC (Preço Máximo ao Consumidor)'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={!!form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  {label}
                </label>
              ))}
              <div className={pmcOff ? 'opacity-45 pointer-events-none' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modo PMC</label>
                <select
                  value={form.farmaciaPmcModo ?? 'ALERTA'}
                  onChange={e => setForm({ ...form, farmaciaPmcModo: e.target.value })}
                  className={fieldWrap('farmaciaPmcModo', fieldErrors, 'input-field max-w-xs')}
                  disabled={pmcOff}
                >
                  <option value="ALERTA">ALERTA — avisa quando acima do PMC</option>
                  <option value="BLOQUEIO">BLOQUEIO — impede venda acima do PMC</option>
                </select>
                {fieldErrors.farmaciaPmcModo && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.farmaciaPmcModo}</p>
                )}
              </div>
            </div>
          </Section>
          )}

          {showInformaticaModule && (
          <Section
            id="sec-informatica"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.81-.811A3 3 0 0115 18.25v-1.007M15 21H9v-4.5a3 3 0 013-3h0a3 3 0 013 3V21zm-6-9a3 3 0 116 0 3 3 0 01-6 0zM6.75 9a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0z"
                />
              </svg>
            }
            title="Módulo informática (OS)"
            subtitle="Dados da empresa em ordens de serviço: CNPJ, contatos e termos."
          >
            <label className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={!!form.moduloInformaticaAtivo}
                onChange={e => setForm({ ...form, moduloInformaticaAtivo: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
              />
              <span className="text-sm font-medium text-gray-800">Ativar assistência técnica / OS</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                <input
                  value={form.cnpj ?? ''}
                  onChange={e => setForm({ ...form, cnpj: formatCnpjDisplay(onlyDigits(e.target.value)) })}
                  className={fieldWrap('cnpj', fieldErrors, 'input-field font-mono')}
                  inputMode="numeric"
                  placeholder="00.000.000/0000-00"
                />
                {fieldErrors.cnpj && <p className="text-xs text-red-600 mt-1">{fieldErrors.cnpj}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inscrição municipal</label>
                <input
                  value={form.inscricaoMunicipal ?? ''}
                  onChange={e => setForm({ ...form, inscricaoMunicipal: e.target.value })}
                  className={fieldWrap('inscricaoMunicipal', fieldErrors, 'input-field')}
                  maxLength={40}
                />
                {fieldErrors.inscricaoMunicipal && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.inscricaoMunicipal}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone comercial</label>
                <input
                  value={form.telefoneComercial ?? ''}
                  onChange={e =>
                    setForm({ ...form, telefoneComercial: formatPhoneBrDisplay(onlyDigits(e.target.value)) })
                  }
                  className={fieldWrap('telefoneComercial', fieldErrors, 'input-field')}
                  inputMode="tel"
                  placeholder="(00) 00000-0000"
                />
                {fieldErrors.telefoneComercial && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.telefoneComercial}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fax</label>
                <input
                  value={form.fax ?? ''}
                  onChange={e => setForm({ ...form, fax: e.target.value })}
                  className={fieldWrap('fax', fieldErrors, 'input-field')}
                  maxLength={40}
                  placeholder="(00) 0000-0000"
                />
                {fieldErrors.fax && <p className="text-xs text-red-600 mt-1">{fieldErrors.fax}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail comercial</label>
                <input
                  type="email"
                  value={form.emailComercial ?? ''}
                  onChange={e => setForm({ ...form, emailComercial: e.target.value })}
                  className={fieldWrap('emailComercial', fieldErrors, 'input-field')}
                />
                {fieldErrors.emailComercial && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.emailComercial}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço (logradouro, nº, bairro — impresso na OS)
                </label>
                <input
                  value={form.enderecoLinha1Os ?? ''}
                  onChange={e => setForm({ ...form, enderecoLinha1Os: e.target.value })}
                  className={fieldWrap('enderecoLinha1Os', fieldErrors, 'input-field')}
                  maxLength={500}
                  placeholder="Ex.: AV. EXEMPLO, 129 - CENTRO"
                  autoComplete="street-address"
                />
                {fieldErrors.enderecoLinha1Os && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.enderecoLinha1Os}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cidade / UF</label>
                <input
                  value={form.cidadeUfOs ?? ''}
                  onChange={e => setForm({ ...form, cidadeUfOs: e.target.value })}
                  className={fieldWrap('cidadeUfOs', fieldErrors, 'input-field')}
                  maxLength={200}
                  placeholder="Ex.: CARAPICUIBA - SP"
                />
                {fieldErrors.cidadeUfOs && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.cidadeUfOs}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Texto de termos / observações legais (rodapé da OS)</label>
                <textarea
                  value={form.textoTermosOs ?? ''}
                  onChange={e => setForm({ ...form, textoTermosOs: e.target.value })}
                  className={fieldWrap('textoTermosOs', fieldErrors, 'input-field min-h-[120px]')}
                  rows={5}
                  maxLength={TERMOS_MAX}
                  placeholder="Deixe em branco para usar o texto padrão do sistema na impressão."
                />
                <p className="text-xs text-gray-400 mt-1">{(form.textoTermosOs ?? '').length}/{TERMOS_MAX}</p>
                {fieldErrors.textoTermosOs && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.textoTermosOs}</p>
                )}
              </div>
            </div>
          </Section>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3">{error}</div>
          )}

          <div className="sticky bottom-0 left-0 right-0 pt-4 pb-2 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur px-4 py-3 shadow-sm flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
              <div className="text-xs">
                <p className="text-gray-500">Dica: use os atalhos acima para navegar rapido entre as secoes.</p>
                <p className={`${hasUnsavedChanges ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {hasUnsavedChanges ? 'Existem alteracoes pendentes.' : 'Sem alteracoes pendentes.'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void reloadCurrentCompanyParams()}
                  disabled={saving || reloading}
                  className="btn-secondary"
                >
                  {reloading ? 'Recarregando...' : 'Recarregar'}
                </button>
                <button type="submit" disabled={saving || reloading} className="btn-primary min-w-[200px]">
                  {saving ? 'Salvando...' : hasUnsavedChanges ? 'Salvar parametros' : 'Salvar (sem alteracoes)'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Modal de confirmação de exclusão de empresa */}
      {deleteCompanyId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Excluir empresa</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Tem certeza que deseja excluir <strong>{deleteCompanyName}</strong>?
                  Esta ação é <strong>irreversível</strong> e apagará todos os dados da empresa
                  (produtos, pedidos, clientes, usuários, etc.).
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                disabled={deletingCompany}
                onClick={() => { setDeleteCompanyId(null); setDeleteCompanyName('') }}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deletingCompany}
                onClick={() => void confirmDeleteCompany()}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {deletingCompany ? 'Excluindo…' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
