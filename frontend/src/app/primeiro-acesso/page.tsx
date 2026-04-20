'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/services/authService'
import { getAuth, isAuthenticated } from '@/lib/auth'
import { defaultHomePath } from '@/lib/roleAccess'

export default function PrimeiroAcessoPage() {
  const router = useRouter()
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [showSenhaAtual, setShowSenhaAtual] = useState(false)
  const [showNovaSenha, setShowNovaSenha] = useState(false)
  const [showConfirma, setShowConfirma] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  /** null = ainda não leu o auth no cliente (evita flash convite → provisória). */
  const [inviteOnly, setInviteOnly] = useState<boolean | null>(null)
  const fieldClassName =
    'w-full h-14 rounded-[14px] border border-slate-300/70 bg-slate-50/80 px-4 pl-12 pr-12 text-base text-slate-700 placeholder:text-slate-400 transition-all duration-150 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-0'
  const floatingLabelClassName =
    'pointer-events-none absolute left-3 -top-[7px] z-10 bg-slate-50 px-1 text-xs font-normal leading-none text-slate-500'

  const syncModeFromAuth = useCallback(() => {
    if (!isAuthenticated()) {
      router.replace('/login')
      return
    }
    const u = getAuth()
    if (!u?.mustChangePassword) {
      router.replace('/dashboard')
      return
    }
    setInviteOnly(!!u.inviteSelfRegistration)
  }, [router])

  useEffect(() => {
    syncModeFromAuth()
  }, [syncModeFromAuth])

  useEffect(() => {
    const onAuth = () => syncModeFromAuth()
    window.addEventListener('veltrix-auth-changed', onAuth)
    return () => window.removeEventListener('veltrix-auth-changed', onAuth)
  }, [syncModeFromAuth])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (inviteOnly === null) return
    setError('')
    if (novaSenha.length < 8) {
      setError('A nova senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (novaSenha !== confirma) {
      setError('A confirmação não coincide com a nova senha.')
      return
    }
    if (!inviteOnly && !senhaAtual) {
      setError('Informe a senha provisória ou atual.')
      return
    }
    setLoading(true)
    try {
      if (inviteOnly) {
        await authService.definirPrimeiraSenhaConvite(novaSenha)
      } else {
        await authService.changePassword(senhaAtual, novaSenha)
      }
      const role = getAuth()?.role
      router.replace(defaultHomePath(role))
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } }
      setError(ax.response?.data?.error || 'Não foi possível alterar a senha.')
    } finally {
      setLoading(false)
    }
  }

  if (inviteOnly === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 to-primary-700 px-4">
        <div className="w-full max-w-md card py-12 text-center text-sm text-gray-500">Carregando…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 to-primary-700 px-4">
      <div className="w-full max-w-md card">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Definir nova senha</h1>
        {inviteOnly ? (
          <p className="text-sm text-gray-500 mb-6">
            Você entrou com <strong className="font-medium text-gray-700">código de convite</strong>. Defina abaixo a senha que usará no PDV (mínimo 8 caracteres).
          </p>
        ) : (
          <p className="text-sm text-gray-500 mb-6">
            Informe a <strong className="font-medium text-gray-700">senha provisória</strong> enviada pelo administrador e escolha a nova senha de acesso.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!inviteOnly && (
            <div className="relative">
              <label className={floatingLabelClassName}>Senha provisória ou atual</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V7.875a4.125 4.125 0 1 0-8.25 0V10.5M6.75 10.5h10.5a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5H6.75a1.5 1.5 0 0 1-1.5-1.5v-6a1.5 1.5 0 0 1 1.5-1.5Z" />
                  </svg>
                </span>
                <input
                  type={showSenhaAtual ? 'text' : 'password'}
                  value={senhaAtual}
                  onChange={e => setSenhaAtual(e.target.value)}
                  required={!inviteOnly}
                  className={fieldClassName}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowSenhaAtual(v => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600"
                  aria-label={showSenhaAtual ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showSenhaAtual ? (
                    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m3 3 18 18M10.584 10.587A2 2 0 0 0 13.413 13.4M9.88 5.09A10.94 10.94 0 0 1 12 4.875c4.804 0 8.775 3.379 9.692 7.875a10.467 10.467 0 0 1-2.116 4.236M6.229 6.228A10.45 10.45 0 0 0 2.308 12.75c.462 2.265 1.624 4.282 3.242 5.79A10.92 10.92 0 0 0 12 20.625c1.857 0 3.611-.463 5.149-1.282" />
                    </svg>
                  ) : (
                    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12S5.25 5.25 12 5.25 21.75 12 21.75 12 18.75 18.75 12 18.75 2.25 12 2.25 12Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}
          <div className="relative">
            <label className={floatingLabelClassName}>{inviteOnly ? 'Senha de acesso' : 'Nova senha'}</label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V7.875a4.125 4.125 0 1 0-8.25 0V10.5M6.75 10.5h10.5a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5H6.75a1.5 1.5 0 0 1-1.5-1.5v-6a1.5 1.5 0 0 1 1.5-1.5Z" />
                </svg>
              </span>
              <input
                type={showNovaSenha ? 'text' : 'password'}
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
                required
                minLength={6}
                className={fieldClassName}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNovaSenha(v => !v)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600"
                aria-label={showNovaSenha ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showNovaSenha ? (
                  <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m3 3 18 18M10.584 10.587A2 2 0 0 0 13.413 13.4M9.88 5.09A10.94 10.94 0 0 1 12 4.875c4.804 0 8.775 3.379 9.692 7.875a10.467 10.467 0 0 1-2.116 4.236M6.229 6.228A10.45 10.45 0 0 0 2.308 12.75c.462 2.265 1.624 4.282 3.242 5.79A10.92 10.92 0 0 0 12 20.625c1.857 0 3.611-.463 5.149-1.282" />
                  </svg>
                ) : (
                  <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12S5.25 5.25 12 5.25 21.75 12 21.75 12 18.75 18.75 12 18.75 2.25 12 2.25 12Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className="relative">
            <label className={floatingLabelClassName}>Confirmar senha</label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V7.875a4.125 4.125 0 1 0-8.25 0V10.5M6.75 10.5h10.5a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5H6.75a1.5 1.5 0 0 1-1.5-1.5v-6a1.5 1.5 0 0 1 1.5-1.5Z" />
                </svg>
              </span>
              <input
                type={showConfirma ? 'text' : 'password'}
                value={confirma}
                onChange={e => setConfirma(e.target.value)}
                required
                minLength={6}
                className={fieldClassName}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirma(v => !v)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600"
                aria-label={showConfirma ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showConfirma ? (
                  <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m3 3 18 18M10.584 10.587A2 2 0 0 0 13.413 13.4M9.88 5.09A10.94 10.94 0 0 1 12 4.875c4.804 0 8.775 3.379 9.692 7.875a10.467 10.467 0 0 1-2.116 4.236M6.229 6.228A10.45 10.45 0 0 0 2.308 12.75c.462 2.265 1.624 4.282 3.242 5.79A10.92 10.92 0 0 0 12 20.625c1.857 0 3.611-.463 5.149-1.282" />
                  </svg>
                ) : (
                  <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12S5.25 5.25 12 5.25 21.75 12 21.75 12 18.75 18.75 12 18.75 2.25 12 2.25 12Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Salvando...' : 'Salvar e entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
