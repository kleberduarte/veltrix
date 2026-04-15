'use client'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Sidebar from './Sidebar'
import Header from './Header'
import { getAuth, getToken, isAuthenticated } from '@/lib/auth'
import { authService } from '@/services/authService'
import { canAccessErpRoute, defaultHomePath } from '@/lib/roleAccess'
import { ParametroProvider } from '@/lib/parametroContext'

export default function AppLayout({
  children,
  title,
  fullBleed,
  standalonePdv,
}: {
  children: React.ReactNode
  title: string
  /** Remove padding so pages (e.g. PDV) can use full viewport width */
  fullBleed?: boolean
  /** PDV em tela cheia: sem menu lateral nem barra do ERP (como frente de caixa dedicada) */
  standalonePdv?: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated()) return
    const u = getAuth()
    if (u?.mustChangePassword && pathname !== '/primeiro-acesso') {
      router.replace('/primeiro-acesso')
      return
    }
    if (standalonePdv) return
    if (u?.role && !canAccessErpRoute(u.role, pathname)) {
      router.replace(defaultHomePath(u.role))
    }
  }, [pathname, router, standalonePdv])

  useEffect(() => {
    if (!isAuthenticated() || pathname === '/primeiro-acesso') return
    if (typeof window === 'undefined' || sessionStorage.getItem('veltrix_me_synced')) return
    const token = getToken()
    if (!token) return
    authService.me()
      .then(me => {
        authService.syncAuthFromMe(me, token)
        sessionStorage.setItem('veltrix_me_synced', '1')
        if (me.mustChangePassword && pathname !== '/primeiro-acesso') {
          router.replace('/primeiro-acesso')
        }
      })
      .catch(() => {})
  }, [pathname, router])

  if (standalonePdv) {
    return (
      <div className="min-h-dvh h-dvh bg-gray-50 flex flex-col overflow-hidden">
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden p-0">{children}</main>
      </div>
    )
  }

  return (
    <ParametroProvider>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title={title} />
          <main
            className={`flex-1 min-h-0 ${fullBleed ? 'flex flex-col overflow-y-auto overflow-x-hidden xl:overflow-hidden p-0' : 'overflow-y-auto p-8'}`}
          >
            {children}
          </main>
        </div>
      </div>
    </ParametroProvider>
  )
}
