'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/services/authService'

type Mode = 'login' | 'register'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    codigoConvite: '',
  })

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'login') {
        const data = await authService.login(form.email, form.password) as {
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
      if (form.password !== form.confirmPassword) {
        setError('As senhas não conferem.')
        setLoading(false)
        return
      }
      const data = await authService.register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        codigoConvite: form.codigoConvite.trim(),
      }) as {
        mustChangePassword?: boolean
      }
      if (data.mustChangePassword) {
        router.push('/primeiro-acesso')
        return
      }
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao autenticar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 to-primary-700 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">Veltrix</h1>
        </div>

        <div className="card">
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${mode === 'login' ? 'bg-white shadow text-primary-700' : 'text-gray-500'}`}
              onClick={() => setMode('login')}
            >
              Entrar
            </button>
            <button
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${mode === 'register' ? 'bg-white shadow text-primary-700' : 'text-gray-500'}`}
              onClick={() => setMode('register')}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seu nome</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    required
                    className="input-field"
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código de convite</label>
                  <input
                    name="codigoConvite"
                    value={form.codigoConvite}
                    onChange={onChange}
                    required
                    className="input-field"
                    placeholder="Código enviado pelo administrador"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                required
                className="input-field"
                placeholder="email@empresa.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={onChange}
                required
                minLength={4}
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
                <input
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={onChange}
                  required
                  minLength={4}
                  className="input-field"
                  placeholder="Repita a senha"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
