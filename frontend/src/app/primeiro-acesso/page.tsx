'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/services/authService'
import { getAuth, isAuthenticated } from '@/lib/auth'

export default function PrimeiroAcessoPage() {
  const router = useRouter()
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  /** null = ainda não leu o auth no cliente (evita flash convite → provisória). */
  const [inviteOnly, setInviteOnly] = useState<boolean | null>(null)

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
    if (novaSenha.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.')
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
      router.replace(role === 'VENDEDOR' ? '/pdv' : '/dashboard')
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
            Você entrou com <strong className="font-medium text-gray-700">código de convite</strong>. Defina abaixo a senha que usará no PDV (mínimo 6 caracteres).
          </p>
        ) : (
          <p className="text-sm text-gray-500 mb-6">
            Informe a <strong className="font-medium text-gray-700">senha provisória</strong> enviada pelo administrador e escolha a nova senha de acesso.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!inviteOnly && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha provisória ou atual</label>
              <input
                type="password"
                value={senhaAtual}
                onChange={e => setSenhaAtual(e.target.value)}
                required={!inviteOnly}
                className="input-field"
                autoComplete="current-password"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{inviteOnly ? 'Senha de acesso' : 'Nova senha'}</label>
            <input
              type="password"
              value={novaSenha}
              onChange={e => setNovaSenha(e.target.value)}
              required
              minLength={6}
              className="input-field"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
            <input
              type="password"
              value={confirma}
              onChange={e => setConfirma(e.target.value)}
              required
              minLength={6}
              className="input-field"
              autoComplete="new-password"
            />
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
