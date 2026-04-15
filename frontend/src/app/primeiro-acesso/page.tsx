'use client'
import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login')
      return
    }
    const u = getAuth()
    if (!u?.mustChangePassword) router.replace('/dashboard')
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (novaSenha.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (novaSenha !== confirma) {
      setError('A confirmação não coincide com a nova senha.')
      return
    }
    setLoading(true)
    try {
      await authService.changePassword(senhaAtual, novaSenha)
      router.replace('/dashboard')
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } }
      setError(ax.response?.data?.error || 'Não foi possível alterar a senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 to-primary-700 px-4">
      <div className="w-full max-w-md card">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Definir nova senha</h1>
        <p className="text-sm text-gray-500 mb-6">
          Sua conta exige troca de senha antes de continuar (primeiro acesso ou política da empresa).
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha atual</label>
            <input type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} required className="input-field" autoComplete="current-password" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
            <input type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} required minLength={6} className="input-field" autoComplete="new-password" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
            <input type="password" value={confirma} onChange={e => setConfirma(e.target.value)} required minLength={6} className="input-field" autoComplete="new-password" />
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
