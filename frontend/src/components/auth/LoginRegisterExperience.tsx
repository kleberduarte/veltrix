'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/services/authService'

export type LoginBrand = {
  nomeEmpresa: string
  logoUrl?: string | null
  corPrimaria: string
  corSecundaria: string
  corBotao: string
  corBotaoTexto: string
}

type Mode = 'login' | 'firstAccess'

type Props = {
  /** `/login` global — cores primary Tailwind. `/acesso/[token]` — cores da empresa. */
  variant?: 'global' | 'company'
  brand?: LoginBrand | null
  /** Enquanto carrega branding no acesso por link */
  brandLoading?: boolean
  brandError?: string
}

export default function LoginRegisterExperience({
  variant = 'global',
  brand = null,
  brandLoading = false,
  brandError = '',
}: Props) {
  const router = useRouter()
  const brandPanelRef = useRef<HTMLElement | null>(null)
  const [logoTilt, setLogoTilt] = useState({ rx: 0, ry: 0 })
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [companyCardLogoError, setCompanyCardLogoError] = useState(false)
  const [brandBackdropLogoError, setBrandBackdropLogoError] = useState(false)
  const [mode, setMode] = useState<Mode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [registerPromptOpen, setRegisterPromptOpen] = useState(false)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    codigoConvite: '',
  })

  const isCompany = variant === 'company' && brand
  const primary = brand?.corPrimaria ?? '#2563eb'
  const secondary = brand?.corSecundaria ?? '#1e3a8a'
  const btnBg = brand?.corBotao ?? ''
  const btnText = brand?.corBotaoTexto ?? '#ffffff'

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    const next =
      name === 'codigoConvite' ? value.toUpperCase().replace(/[^A-Z0-9]/g, '') : value
    setForm({ ...form, [name]: next })
    setError('')
  }

  function goToLoginTab() {
    setMode('login')
    setError('')
    setForm(f => ({ ...f, password: '' }))
  }

  function goToFirstAccessTab() {
    setMode('firstAccess')
    setError('')
    setRegisterPromptOpen(false)
  }

  useEffect(() => {
    if (!registerPromptOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRegisterPromptOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [registerPromptOpen])

  useEffect(() => {
    setCompanyCardLogoError(false)
    setBrandBackdropLogoError(false)
  }, [brand?.logoUrl])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
    const onChange = () => setPrefersReducedMotion(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const handleBrandPanelMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (prefersReducedMotion || !brandPanelRef.current) return
      const r = brandPanelRef.current.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      setLogoTilt({ ry: x * 14, rx: -y * 12 })
    },
    [prefersReducedMotion],
  )

  const handleBrandPanelLeave = useCallback(() => {
    setLogoTilt({ rx: 0, ry: 0 })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'firstAccess') {
        const data = (await authService.register({
          name: form.name.trim(),
          email: form.email.trim(),
          codigoConvite: form.codigoConvite.trim(),
        })) as {
          mustChangePassword?: boolean
          role?: string
        }
        if (data.mustChangePassword) {
          router.push('/primeiro-acesso')
          return
        }
        router.push(data.role === 'VENDEDOR' ? '/pdv' : '/dashboard')
        return
      }

      const email = form.email.trim()
      if (!email) {
        setError('Informe seu e-mail.')
        setLoading(false)
        return
      }
      if (!form.password) {
        setError('Informe sua senha.')
        setLoading(false)
        return
      }

      const status = await authService.getEmailStatus(email)
      if (!status.exists) {
        setRegisterPromptOpen(true)
        setLoading(false)
        return
      }

      const data = (await authService.login(email, form.password)) as {
        mustChangePassword?: boolean
        role?: string
      }
      if (data.mustChangePassword) {
        router.push('/primeiro-acesso')
        return
      }
      router.push(data.role === 'VENDEDOR' ? '/pdv' : '/dashboard')
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { error?: string } } }
      const msg = ax.response?.data?.error
      if (msg === 'Invalid credentials' || ax.response?.status === 401) {
        setError('E-mail ou senha incorretos.')
      } else {
        setError(msg || 'Não foi possível entrar. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  const submitLabel =
    mode === 'firstAccess'
      ? loading
        ? 'Aguarde...'
        : 'Criar conta e continuar'
      : loading
        ? 'Aguarde...'
        : 'Entrar'

  const primaryBtnStyle =
    isCompany && btnBg
      ? { backgroundColor: btnBg, color: btnText }
      : undefined

  if (variant === 'company' && brandLoading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100/95 via-gray-50 to-slate-200/40 px-4">
        <div className="w-full max-w-md rounded-[1.65rem] border border-white/70 bg-white/90 p-10 text-center shadow-[0_24px_64px_-12px_rgba(15,23,42,0.14)] backdrop-blur-xl">
          <div
            className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: `${primary} transparent ${primary} ${primary}` }}
          />
          <p className="text-gray-500 text-sm">Carregando acesso da empresa…</p>
        </div>
      </div>
    )
  }

  if (variant === 'company' && brandError) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100/95 via-gray-50 to-slate-200/40 px-4">
        <div className="w-full max-w-md space-y-4 rounded-[1.65rem] border border-red-200/80 bg-white/95 p-8 text-center shadow-[0_24px_64px_-12px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <p className="text-red-700 text-sm">{brandError}</p>
          <button type="button" onClick={() => router.push('/login')} className="btn-primary w-full py-3">
            Ir para o login Veltrix
          </button>
        </div>
      </div>
    )
  }

  const fieldClassName =
    'w-full rounded-xl border border-slate-200/90 bg-slate-50/60 px-4 py-3.5 text-base text-slate-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)] placeholder:text-slate-400 transition-all duration-200 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/12'

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-100/95 via-gray-50 to-slate-200/40">
      {registerPromptOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="register-prompt-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[3px] transition-opacity"
            onClick={() => setRegisterPromptOpen(false)}
            aria-label="Fechar"
          />
          <div className="relative w-full max-w-[440px]">
            <div className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/95 shadow-2xl shadow-slate-900/20 ring-1 ring-slate-900/5 backdrop-blur-xl">
              <div
                className="relative px-6 py-8 text-center text-white"
                style={
                  isCompany
                    ? { background: `linear-gradient(135deg, ${secondary} 0%, ${primary} 100%)` }
                    : undefined
                }
              >
                {!isCompany && (
                  <>
                    <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" aria-hidden />
                    <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-primary-400/20 blur-2xl" aria-hidden />
                  </>
                )}
                {isCompany && (
                  <>
                    <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" aria-hidden />
                    <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" aria-hidden />
                  </>
                )}
                <div
                  className={`relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner ring-1 ring-white/25 ${
                    isCompany ? 'bg-white/15' : 'bg-white/15'
                  }`}
                >
                  <svg className="h-8 w-8 text-white/95" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                    />
                  </svg>
                </div>
                <h3 id="register-prompt-title" className="text-lg font-bold tracking-tight sm:text-xl">
                  E-mail não encontrado
                </h3>
                <p className="mt-2 text-sm text-white/85 leading-relaxed">
                  Não há cadastro para este endereço na base do Veltrix.
                </p>
                <p className="relative mt-4 rounded-xl bg-black/20 px-3 py-2.5 text-sm font-medium text-white ring-1 ring-white/15 backdrop-blur-sm">
                  {form.email.trim() || '—'}
                </p>
              </div>
              <div className="space-y-5 px-6 py-6 sm:px-7">
                <p className="text-center text-[15px] font-medium leading-snug text-slate-800">
                  Deseja ir para o cadastro com código de convite?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRegisterPromptOpen(false)}
                    className="rounded-xl border border-slate-200/90 bg-slate-50/80 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 hover:shadow"
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    onClick={() => goToFirstAccessTab()}
                    className={
                      isCompany && btnBg
                        ? 'rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-95'
                        : 'rounded-xl bg-primary-600 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-600/30 transition hover:bg-primary-700 hover:shadow-primary-700/35'
                    }
                    style={isCompany && btnBg ? { backgroundColor: btnBg, boxShadow: `0 10px 15px -3px ${btnBg}44` } : undefined}
                  >
                    Sim, cadastrar
                  </button>
                </div>
                <p className="text-center text-xs leading-relaxed text-slate-400">
                  Use o <span className="font-medium text-slate-500">Código de convite (PDV)</span> enviado pelo administrador{isCompany ? ' da empresa' : ''}.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto grid min-h-screen max-w-[1400px] grid-cols-1 lg:grid-cols-[1.12fr_1fr]">
        <section
          ref={isCompany && brand ? brandPanelRef : undefined}
          onMouseMove={isCompany && brand ? handleBrandPanelMove : undefined}
          onMouseLeave={isCompany && brand ? handleBrandPanelLeave : undefined}
          className={
            isCompany
              ? 'relative hidden overflow-hidden lg:flex'
              : 'relative hidden overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 lg:flex'
          }
          style={
            isCompany && brand
              ? { background: `linear-gradient(135deg, ${secondary} 0%, ${primary} 100%)` }
              : undefined
          }
        >
          {!isCompany && (
            <>
              <div className="absolute -left-24 -top-20 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
              <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-primary-900/30 blur-3xl" />
            </>
          )}
          {isCompany && (
            <>
              <div className="absolute -left-24 -top-20 z-0 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
              <div className="absolute bottom-10 right-10 z-0 h-72 w-72 rounded-full bg-black/20 blur-3xl" />
            </>
          )}
          {isCompany && brand && (
            <div
              className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
              aria-hidden
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_70%_at_50%_45%,transparent_0%,rgba(0,0,0,0.22)_100%)]" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/25" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_58%_52%_at_50%_42%,rgba(255,255,255,0.12)_0%,transparent_62%)]" />
              {brand.logoUrl && !brandBackdropLogoError ? (
                <div className="absolute inset-0 flex items-center justify-center px-8 py-12 sm:px-12">
                  <div
                    className="relative flex h-[min(52vh,400px)] w-[min(92%,540px)] items-center justify-center [transform-style:preserve-3d]"
                    style={
                      prefersReducedMotion
                        ? undefined
                        : {
                            transform: `perspective(960px) rotateX(${logoTilt.rx}deg) rotateY(${logoTilt.ry}deg) translateZ(36px)`,
                            transition: 'transform 0.14s ease-out',
                          }
                    }
                  >
                    <div
                      className="absolute inset-0 flex items-center justify-center opacity-[0.06] blur-3xl scale-[1.15]"
                      aria-hidden
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={brand.logoUrl}
                        alt=""
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="relative h-full w-full opacity-[0.14] [mask-image:radial-gradient(ellipse_68%_68%_at_50%_50%,#000_18%,transparent_72%)] [-webkit-mask-image:radial-gradient(ellipse_68%_68%_at_50%_50%,#000_18%,transparent_72%)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={brand.logoUrl}
                        alt=""
                        className="h-full w-full object-contain [filter:drop-shadow(0_8px_32px_rgba(0,0,0,0.15))_drop-shadow(0_0_1px_rgba(255,255,255,0.15))]"
                        onError={() => setBrandBackdropLogoError(true)}
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
          <div className="relative z-10 flex h-full w-full flex-col justify-between p-10 xl:p-14 text-white">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-white shadow-sm backdrop-blur">
              <span className="text-lg font-bold">V</span>
              <span className="text-sm font-semibold tracking-wide">Veltrix</span>
            </div>

            {isCompany && brand ? (
              <>
                <div className="flex-1" aria-hidden />
                <div />
              </>
            ) : (
              <div className="max-w-xl pb-8">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Plataforma ERP + PDV</p>
                <h1 className="text-4xl font-extrabold leading-tight xl:text-5xl">
                  Gestão moderna para vendas, atendimento e operação.
                </h1>
                <p className="mt-5 max-w-lg text-lg text-white/85">
                  Centralize produtos, clientes e pedidos em uma experiência fluida e preparada para crescimento.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="relative flex items-center justify-center px-5 py-10 sm:px-8 lg:py-12">
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden"
            aria-hidden
          >
            <div className="absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-primary-500/8 blur-3xl" />
            <div className="absolute -left-20 bottom-1/3 h-64 w-64 rounded-full bg-slate-400/20 blur-3xl" />
          </div>
          <div className="relative w-full max-w-md rounded-[1.65rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_64px_-12px_rgba(15,23,42,0.14),0_0_0_1px_rgba(15,23,42,0.04)] backdrop-blur-xl sm:p-8">
            <div className="mb-7 flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                {isCompany && (
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-slate-400">
                    Acesso da empresa
                  </p>
                )}
                <h2 className="text-[1.65rem] font-bold tracking-tight text-slate-900 sm:text-[1.75rem]">
                  {mode === 'login' ? 'Entrar na conta' : 'Primeiro acesso'}
                </h2>
                {isCompany && brand && (
                  <p className="text-sm font-medium text-slate-500 truncate">{brand.nomeEmpresa}</p>
                )}
              </div>
              {isCompany && brand?.logoUrl && !companyCardLogoError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brand.logoUrl}
                  alt={brand.nomeEmpresa}
                  className="h-12 w-auto max-w-[100px] shrink-0 rounded-xl border border-slate-200/80 bg-white object-contain p-1.5 shadow-sm ring-1 ring-slate-900/5"
                  onError={() => setCompanyCardLogoError(true)}
                />
              ) : (
                <span
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ring-1 ring-inset ${
                    isCompany
                      ? 'bg-slate-100/90 text-slate-600 ring-slate-200/80'
                      : 'bg-primary-50 text-primary-700 ring-primary-200/60'
                  }`}
                >
                  Veltrix
                </span>
              )}
            </div>

            <div className="mb-7 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100/90 p-1 ring-1 ring-slate-200/60">
              <button
                type="button"
                className={`rounded-[0.65rem] py-2.5 text-sm font-semibold transition-all duration-200 ${
                  mode === 'login'
                    ? 'bg-white text-primary-700 shadow-md shadow-slate-900/8 ring-1 ring-slate-200/70'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                onClick={goToLoginTab}
              >
                Entrar
              </button>
              <button
                type="button"
                className={`rounded-[0.65rem] py-2.5 text-sm font-semibold transition-all duration-200 ${
                  mode === 'firstAccess'
                    ? 'bg-white shadow-md shadow-slate-900/8 ring-1 ring-slate-200/70'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                style={
                  mode === 'firstAccess' && isCompany
                    ? { color: primary }
                    : mode === 'firstAccess'
                      ? { color: 'var(--veltrix-cor-primaria, #2563eb)' }
                      : undefined
                }
                onClick={goToFirstAccessTab}
              >
                Primeiro acesso
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'firstAccess' && (
                <>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Seu nome</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={onChange}
                      required
                      className={fieldClassName}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Código de convite (PDV)
                    </label>
                    <input
                      name="codigoConvite"
                      value={form.codigoConvite}
                      onChange={onChange}
                      required
                      className={fieldClassName}
                      placeholder="Código de convite (PDV)"
                      autoComplete="off"
                    />
                  </div>
                </>
              )}

              {(mode === 'firstAccess' || mode === 'login') && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">E-mail</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={onChange}
                    required
                    className={fieldClassName}
                    placeholder="email@empresa.com"
                    autoComplete="email"
                  />
                </div>
              )}

              {mode === 'login' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Senha</label>
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={onChange}
                    required
                    minLength={4}
                    className={fieldClassName}
                    placeholder="Digite sua senha de acesso"
                    autoComplete="current-password"
                  />
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-red-200/90 bg-red-50/90 px-4 py-3 text-sm text-red-800 shadow-sm backdrop-blur-sm">
                  {error}
                </div>
              )}

              {isCompany && btnBg ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 w-full rounded-xl py-3.5 text-base font-semibold shadow-lg shadow-slate-900/10 transition-all duration-200 hover:brightness-[1.03] active:scale-[0.99] disabled:opacity-60 disabled:active:scale-100"
                  style={primaryBtnStyle}
                >
                  {submitLabel}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary mt-1 w-full rounded-xl py-3.5 text-base shadow-lg shadow-primary-600/20 transition-all duration-200 hover:shadow-xl hover:shadow-primary-600/25 active:scale-[0.99] disabled:active:scale-100"
                >
                  {submitLabel}
                </button>
              )}
            </form>

            {isCompany && (
              <p className="mt-7 text-center text-xs text-slate-400">
                Acesso global?{' '}
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') window.location.assign('/login')
                  }}
                  className="font-semibold text-primary-600 underline-offset-2 transition-colors hover:text-primary-700 hover:underline"
                >
                  Login Veltrix
                </button>
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
