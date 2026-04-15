'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { authService } from '@/services/authService'

type Step = 'loading' | 'form' | 'invalid' | 'success'

type BrandInfo = {
  companyId: number
  companyName: string
  nomeEmpresa: string
  logoUrl?: string | null
  corPrimaria: string
  corSecundaria: string
  corBotao: string
  corBotaoTexto: string
}

function formatTelefone(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2)  return d.length ? `(${d}` : ''
  if (d.length <= 6)  return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
}

export default function OnboardingPage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()

  const [step, setStep] = useState<Step>('loading')
  const [brand, setBrand] = useState<BrandInfo | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    telefone: '',
    password: '',
    confirmPassword: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) { setStep('invalid'); return }
    authService.getOnboardingInfo(token)
      .then(info => { setBrand(info); setStep('form') })
      .catch(() => setStep('invalid'))
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError('As senhas não conferem.')
      return
    }
    if (form.password.length < 4) {
      setError('A senha deve ter pelo menos 4 caracteres.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await authService.registerViaOnboarding(token, {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        telefone: form.telefone.trim() || undefined,
      })
      setStep('success')
      setTimeout(() => router.push('/dashboard'), 2500)
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } }
      setError(ax.response?.data?.error || 'Erro ao criar conta. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  // Cores da empresa (ou defaults)
  const primary   = brand?.corPrimaria   ?? '#2563eb'
  const secondary = brand?.corSecundaria ?? '#1e3a8a'
  const btnBg     = brand?.corBotao      ?? '#2563eb'
  const btnText   = brand?.corBotaoTexto ?? '#ffffff'

  // Gera uma versão "light" da cor primária para o fundo do header do card
  const headerStyle = {
    background: `linear-gradient(135deg, ${secondary} 0%, ${primary} 100%)`,
  }
  const btnStyle = { backgroundColor: btnBg, color: btnText }

  const logoUrl   = brand?.logoUrl
  const initials  = (brand?.nomeEmpresa ?? brand?.companyName ?? '?')
    .split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: `linear-gradient(135deg, ${secondary}ee 0%, ${primary}cc 100%)` }}
    >
      <div className="w-full max-w-md">

        {/* ── Loading ── */}
        {step === 'loading' && (
          <div className="bg-white rounded-2xl shadow-2xl p-10 text-center">
            <div
              className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
              style={{ borderColor: `${primary} transparent ${primary} ${primary}` }}
            />
            <p className="text-gray-500 text-sm">Validando link de acesso…</p>
          </div>
        )}

        {/* ── Inválido ── */}
        {step === 'invalid' && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Link inválido ou expirado</h2>
            <p className="text-gray-500 text-sm">
              Este link já foi utilizado ou não existe.<br />
              Solicite um novo link ao administrador do sistema.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full mt-2 rounded-xl py-2.5 text-sm font-semibold transition-colors"
              style={btnStyle}
            >
              Ir para o login
            </button>
          </div>
        )}

        {/* ── Sucesso ── */}
        {step === 'success' && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center space-y-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
              style={{ backgroundColor: `${primary}22` }}
            >
              <svg className="w-7 h-7" style={{ color: primary }} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Conta criada com sucesso!</h2>
            <p className="text-gray-500 text-sm">
              Bem-vindo(a) a <strong>{brand?.nomeEmpresa ?? brand?.companyName}</strong>.<br />
              Redirecionando para o painel…
            </p>
            <div
              className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto"
              style={{ borderColor: `${primary} transparent ${primary} ${primary}` }}
            />
          </div>
        )}

        {/* ── Formulário ── */}
        {step === 'form' && (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

            {/* Cabeçalho com branding */}
            <div className="px-6 py-6" style={headerStyle}>
              <div className="flex items-center gap-4 mb-3">
                {logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-12 w-auto max-w-[120px] rounded-lg object-contain bg-white/10 p-1"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center text-lg font-bold shadow"
                    style={{ backgroundColor: `${btnBg}33`, color: btnText, border: '1px solid rgba(255,255,255,0.2)' }}
                  >
                    {initials}
                  </div>
                )}
                <div>
                  <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">
                    Você foi convidado para
                  </p>
                  <h2 className="text-white text-xl font-bold leading-tight">
                    {brand?.nomeEmpresa ?? brand?.companyName}
                  </h2>
                </div>
              </div>
              <p className="text-white/70 text-sm">
                Crie sua conta de administrador para acessar o sistema.
              </p>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  className="input-field"
                  placeholder="Ex.: João Silva"
                  autoComplete="name"
                />
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  className="input-field"
                  placeholder="email@empresa.com"
                  autoComplete="email"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone / WhatsApp <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="tel"
                  value={form.telefone}
                  onChange={e => setForm({ ...form, telefone: formatTelefone(e.target.value) })}
                  className="input-field"
                  placeholder="(00) 00000-0000"
                  autoComplete="tel"
                  inputMode="tel"
                />
              </div>

              {/* Senha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={4}
                  className="input-field"
                  placeholder="Mínimo 4 caracteres"
                  autoComplete="new-password"
                />
              </div>

              {/* Confirmar senha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha *</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  required
                  minLength={4}
                  className="input-field"
                  placeholder="Repita a senha"
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl py-2.5 text-sm font-semibold shadow-sm transition-opacity disabled:opacity-60"
                style={btnStyle}
              >
                {saving ? 'Criando conta…' : 'Criar conta e entrar'}
              </button>

              <p className="text-center text-xs text-gray-400 pt-1">
                Já tem conta?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="font-medium hover:underline"
                  style={{ color: primary }}
                >
                  Fazer login
                </button>
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
