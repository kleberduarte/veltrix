import type { Role } from '@/types'

/** Rótulos dos perfis (alinhados ao backend). */
export const ROLE_LABELS: Record<Role, string> = {
  ADM: 'Adm Global',
  ADMIN_EMPRESA: 'Adm Empresa',
  VENDEDOR: 'Vendedor',
}

const VENDEDOR_FORBIDDEN_PREFIXES = [
  '/dashboard',
  '/products',
  '/relatorios',
  '/ordens-servico',
  '/parametros',
  '/usuarios',
  '/suporte',
]

export function defaultHomePath(role: string | undefined): string {
  if (role === 'VENDEDOR') return '/pdv'
  return '/dashboard'
}

function isReservedCompany(companyName?: string | null): boolean {
  const normalized = (companyName ?? '').trim().toLowerCase()
  return normalized === 'default' || normalized === 'sistema'
}

/** Regra de visibilidade/acesso da OS: default/sistema sempre; demais só com módulo de informática ativo. */
export function canAccessOrdemServicoByCompany(
  companyName?: string | null,
  moduloInformaticaAtivo?: boolean | null
): boolean {
  if (isReservedCompany(companyName)) return true
  return !!moduloInformaticaAtivo
}

/** Rotas do layout ERP que o vendedor não deve abrir (API já restringe). */
export function canAccessErpRoute(role: string | undefined, pathname: string): boolean {
  if (!role || role === 'ADM' || role === 'ADMIN_EMPRESA') return true
  if (role !== 'VENDEDOR') return true
  return !VENDEDOR_FORBIDDEN_PREFIXES.some(
    p => pathname === p || pathname.startsWith(`${p}/`)
  )
}
