import { NextRequest, NextResponse } from 'next/server'

// Rotas públicas que não exigem autenticação
const PUBLIC_PATHS = [
  '/login',
  '/acesso',
  '/api/auth',
]

// Prefixos de assets e internos do Next.js
const BYPASS_PREFIXES = ['/_next', '/favicon', '/api/auth', '/assets']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (BYPASS_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  const token = request.cookies.get('veltrix_token')?.value

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets/).*)',
  ],
}
