'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { authService } from '@/services/authService'

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

export default function CompanyAccessPage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()

  const [loadingBrand, setLoadingBrand] = useState(true)
  const [brandError, setBrandError] = useState('')
  const [brand, setBrand] = useState<BrandInfo | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (!token) {
      setBrandError('Link inválido.')
      setLoadingBrand(false)
      return
    }
    authService.getCompanyAccessInfo(token)
      .then(setBrand)
      .catch(() => setBrandError('Link inválido ou expirado.'))
      .finally(() => setLoadingBrand(false))
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await authService.login(email.trim(), password) as {
        mustChangePassword?: boolean
        role?: string
      }
      if (data.mustChangePassword) {
        router.push('/primeiro-acesso')
        return
      }
      router.push(data.role === 'VENDEDOR' ? '/pdv' : '/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao autenticar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const primary = brand?.corPrimaria ?? '#2563eb'
  const secondary = brand?.corSecundaria ?? '#1e3a8a'
  const btnBg = brand?.corBotao ?? '#2563eb'
  const btnText = brand?.corBotaoTexto ?? '#ffffff'

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: `linear-gradient(135deg, ${secondary} 0%, ${primary} 100%)` }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="px-6 py-6 text-white" style={{ backgroundColor: secondary }}>
          {loadingBrand ? (
            <p className="text-sm text-white/80">Carregando empresa...</p>
          ) : brandError ? (
            <p className="text-sm text-red-200">{brandError}</p>
          ) : (
            <div className="flex items-center gap-3">
              {brand?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brand.logoUrl}
                  alt={brand.nomeEmpresa}
                  className="h-12 w-auto max-w-[140px] rounded-md bg-white/10 p-1 object-contain"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-white/15 flex items-center justify-center text-lg font-bold">
                  {(brand?.nomeEmpresa ?? '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-widest text-white/70">Acesso da empresa</p>
                <h1 className="text-xl font-bold leading-tight">{brand?.nomeEmpresa ?? 'Empresa'}</h1>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              className="input-field"
              placeholder="email@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Senha</label>
            <input
              type="password"
              required
              className="input-field"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !!brandError}
            className="w-full rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60"
            style={{ backgroundColor: btnBg, color: btnText }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <p className="text-center text-xs text-gray-500">
            Primeiro acesso da empresa?{' '}
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="font-semibold"
              style={{ color: primary }}
            >
              Use o onboarding aqui
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
