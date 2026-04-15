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
    <div className="min-h-screen bg-[#f3f4f6]">
      <div className="mx-auto grid min-h-screen max-w-[1400px] grid-cols-1 lg:grid-cols-[1.12fr_1fr]">
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 lg:flex">
          <div className="absolute -left-24 -top-20 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-primary-900/30 blur-3xl" />
          <div className="relative z-10 flex h-full w-full flex-col justify-between p-10 xl:p-14">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-white shadow-sm backdrop-blur">
              <span className="text-lg font-bold">V</span>
              <span className="text-sm font-semibold tracking-wide">Veltrix</span>
            </div>
            <div className="max-w-xl pb-8">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Plataforma ERP + PDV</p>
              <h1 className="text-4xl font-extrabold leading-tight text-white xl:text-5xl">
                Gestao moderna para vendas, atendimento e operacao.
              </h1>
              <p className="mt-5 max-w-lg text-lg text-white/85">
                Centralize produtos, clientes e pedidos em uma experiencia fluida e preparada para crescimento.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-md rounded-3xl border border-gray-200/80 bg-white p-6 shadow-xl sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">{mode === 'login' ? 'Entrar na conta' : 'Criar conta'}</h2>
              <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">Veltrix</span>
            </div>

            <div className="mb-6 grid grid-cols-2 rounded-xl bg-gray-100 p-1">
              <button
                type="button"
                className={`py-2.5 ${mode === 'login' ? 'bg-white shadow-sm text-primary-700' : 'text-gray-500'}`}
                onClick={() => setMode('login')}
              >
                Entrar
              </button>
              <button
                type="button"
                className={`py-2.5 ${mode === 'register' ? 'bg-white shadow-sm text-primary-700' : 'text-gray-500'}`}
                onClick={() => setMode('register')}
              >
                Criar conta
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Seu nome</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={onChange}
                      required
                      className="input-field"
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Codigo de convite</label>
                    <input
                      name="codigoConvite"
                      value={form.codigoConvite}
                      onChange={onChange}
                      required
                      className="input-field"
                      placeholder="Codigo enviado pelo administrador"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
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
                <label className="mb-1 block text-sm font-medium text-gray-700">Senha</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={onChange}
                  required
                  minLength={4}
                  className="input-field"
                  placeholder="Digite sua senha"
                />
              </div>

              {mode === 'register' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Confirmar senha</label>
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
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                {loading ? 'Aguarde...' : mode === 'login' ? 'Continuar' : 'Criar conta'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}
