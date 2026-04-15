'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAuth } from '@/lib/auth'
import { authService } from '@/services/authService'
import { useParametro } from '@/lib/parametroContext'

export default function Header({ title }: { title: string }) {
  const router = useRouter()
  const parametro = useParametro()
  const [user, setUser] = useState<ReturnType<typeof getAuth>>(null)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const initials = useMemo(() => {
    if (!user?.name) return 'US'
    const parts = user.name.trim().split(' ').filter(Boolean)
    return parts.slice(0, 2).map(p => p[0]).join('').toUpperCase()
  }, [user?.name])

  const companyName = parametro?.nomeEmpresa || user?.companyName || 'Veltrix'

  function goToAccount() {
    setOpen(false)
    if (user?.role === 'ADM' || user?.role === 'ADMIN_EMPRESA') {
      router.push('/usuarios')
      return
    }
    router.push('/dashboard')
  }

  function handleLogout() {
    setOpen(false)
    authService.logout()
    router.push('/login')
  }

  useEffect(() => {
    const syncAuth = () => setUser(getAuth())
    syncAuth()
    window.addEventListener('veltrix-auth-changed', syncAuth)
    return () => window.removeEventListener('veltrix-auth-changed', syncAuth)
  }, [])

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!menuRef.current) return
      const target = event.target as Node
      if (!menuRef.current.contains(target)) setOpen(false)
    }
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [])

  return (
    <header className="relative z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      {user && (
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            className="inline-flex items-center gap-3 rounded-2xl border border-primary-200 bg-white px-3 py-2 shadow-sm transition-all hover:border-primary-300 hover:shadow"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--veltrix-cor-primaria)] text-white text-lg font-bold">
              {initials}
            </span>
            <svg
              className={`h-5 w-5 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.511a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>

          <div
            className={`absolute right-0 z-50 mt-3 w-[320px] rounded-2xl border border-gray-200 bg-white shadow-xl transition-all duration-150 ${open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-1 pointer-events-none'}`}
            role="menu"
          >
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">Perfil pessoal</p>
              <div className="mt-3 rounded-xl bg-gray-100 px-3 py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {parametro?.logoUrl ? (
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white border border-gray-200 overflow-hidden">
                      <img src={parametro.logoUrl} alt={companyName} className="h-full w-full object-contain" />
                    </span>
                  ) : (
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[color:var(--veltrix-cor-primaria)] text-white text-lg font-bold">
                      {initials}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-base font-medium text-slate-600">{user.name}</p>
                    <p className="truncate text-sm text-slate-500">{companyName}</p>
                  </div>
                </div>
                <span className="text-primary-500 text-xl" aria-hidden>✓</span>
              </div>

              <button
                type="button"
                onClick={goToAccount}
                className="mt-4 text-left text-lg font-semibold text-primary-600 hover:text-primary-700"
                role="menuitem"
              >
                Minha conta
              </button>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-5 py-3 text-left text-slate-500 hover:bg-slate-50 rounded-b-2xl"
              role="menuitem"
            >
              Sair
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
