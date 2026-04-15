'use client'

import { useEffect, useState, type SVGProps } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { authService } from '@/services/authService'
import { getAuth } from '@/lib/auth'
import { useParametro } from '@/lib/parametroContext'
import type { Role } from '@/types'
import { canAccessOrdemServicoByCompany } from '@/lib/roleAccess'

const iconClass = 'h-5 w-5 shrink-0'

function IChart(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconClass} aria-hidden {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  )
}

function ICart(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconClass} aria-hidden {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    </svg>
  )
}

function ICube(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconClass} aria-hidden {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  )
}

function IBanknotes(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconClass} aria-hidden {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m0-10.5H21" />
    </svg>
  )
}

function IDocument(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconClass} aria-hidden {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}

function IUser(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconClass} aria-hidden {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )
}

function IWrench(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconClass} aria-hidden {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655-5.653a2.548 2.548 0 0 1-.722-1.443 2.545 2.545 0 0 1 .722-1.443L9.58 3.08a2.548 2.548 0 0 1 1.443-.722 2.545 2.545 0 0 1 1.443.722l2.496 3.03" />
    </svg>
  )
}

function IDesktop(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconClass} aria-hidden {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
    </svg>
  )
}

function ISignal(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconClass} aria-hidden {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 5.304a3.75 3.75 0 0 0 0-5.304m-7.425 7.425a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788" />
    </svg>
  )
}

function ICog(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconClass} aria-hidden {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

function IUsers(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconClass} aria-hidden {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  )
}

function IChat(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconClass} aria-hidden {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334v6.322c0 1.091-.756 2.012-1.764 2.216a48.108 48.108 0 0 1-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  )
}

function ILogout(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconClass} aria-hidden {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
    </svg>
  )
}

const nav: {
  href: string
  label: string
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element
  /** Se definido, só esses perfis veem o item (omitido = todos). */
  roles?: Role[]
}[] = [
  { href: '/dashboard', label: 'Dashboard', Icon: IChart, roles: ['ADM', 'ADMIN_EMPRESA'] },
  { href: '/pdv', label: 'PDV', Icon: ICart },
  { href: '/products', label: 'Produtos', Icon: ICube, roles: ['ADM', 'ADMIN_EMPRESA'] },
  { href: '/cash', label: 'Caixa', Icon: IBanknotes },
  { href: '/relatorios', label: 'Relatórios', Icon: IDocument, roles: ['ADM', 'ADMIN_EMPRESA'] },
  { href: '/clientes', label: 'Clientes', Icon: IUser },
  { href: '/ordens-servico', label: 'Ordens de serviço', Icon: IWrench, roles: ['ADM', 'ADMIN_EMPRESA'] },
  { href: '/terminais-pdv', label: 'Terminais PDV', Icon: IDesktop },
  { href: '/monitor-pdv', label: 'Monitor PDV', Icon: ISignal },
  { href: '/parametros', label: 'Parâmetros', Icon: ICog, roles: ['ADM', 'ADMIN_EMPRESA'] },
  { href: '/usuarios', label: 'Usuários', Icon: IUsers, roles: ['ADM', 'ADMIN_EMPRESA'] },
  { href: '/suporte', label: 'Suporte', Icon: IChat, roles: ['ADM', 'ADMIN_EMPRESA'] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [auth, setAuth] = useState<ReturnType<typeof getAuth>>(null)
  const parametro = useParametro()
  const role = auth?.role as Role | undefined
  const companyName = auth?.companyName ?? parametro?.nomeEmpresa ?? 'Veltrix'
  const logoUrl = parametro?.logoUrl
  const osEnabled = canAccessOrdemServicoByCompany(companyName, parametro?.moduloInformaticaAtivo)
  const visibleNav = nav.filter(item => {
    if (item.href === '/ordens-servico' && !osEnabled) return false
    return !item.roles || (role && item.roles.includes(role))
  })

  useEffect(() => {
    const syncAuth = () => setAuth(getAuth())
    syncAuth()
    window.addEventListener('veltrix-auth-changed', syncAuth)
    return () => window.removeEventListener('veltrix-auth-changed', syncAuth)
  }, [])

  function handleLogout() {
    authService.logout()
    router.push('/login')
  }

  return (
    <aside className="flex w-64 min-h-screen flex-col border-r border-white/10 bg-gradient-to-b from-slate-950 via-primary-900 to-[#0f172a] text-white shadow-[4px_0_24px_-8px_rgba(15,23,42,0.45)]">
      <div className="border-b border-white/10 px-5 py-5 flex flex-col items-center gap-2">
        {logoUrl ? (
          <div className="w-full flex items-center justify-center rounded-xl bg-white/10 px-3 py-3 ring-1 ring-white/10 backdrop-blur-sm">
            <img
              src={logoUrl}
              alt={companyName}
              className="max-h-12 max-w-full w-auto object-contain drop-shadow-sm"
            />
          </div>
        ) : (
          <div className="w-full flex items-center gap-3 rounded-xl bg-white/10 px-3 py-3 ring-1 ring-white/10">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-500/80 text-white font-bold text-base shadow-inner">
              {companyName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white leading-tight">{companyName}</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-primary-100/55 mt-0.5">ERP &amp; PDV</p>
            </div>
          </div>
        )}
        {logoUrl && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-100/50">ERP &amp; PDV</p>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4" aria-label="Menu principal">
        {visibleNav.map(({ href, label, Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={[
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                active
                  ? 'bg-white/[0.12] text-white'
                  : 'text-primary-100/80 hover:bg-white/[0.06] hover:text-white',
              ].join(' ')}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 h-7 w-0.5 -translate-y-1/2 rounded-full bg-primary-500 shadow-[0_0_12px_rgba(59,130,246,0.45)]"
                  aria-hidden
                />
              )}
              <span
                className={[
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                  active ? 'bg-white/15 text-white' : 'bg-white/0 text-primary-200 group-hover:bg-white/10 group-hover:text-white',
                ].join(' ')}
              >
                <Icon className="!h-[1.15rem] !w-[1.15rem]" />
              </span>
              <span className="truncate">{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        <button
          type="button"
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-primary-100/75 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/0 text-primary-200 transition-colors group-hover:bg-white/10 group-hover:text-white">
            <ILogout className="!h-[1.15rem] !w-[1.15rem]" />
          </span>
          Sair
        </button>
      </div>
    </aside>
  )
}
