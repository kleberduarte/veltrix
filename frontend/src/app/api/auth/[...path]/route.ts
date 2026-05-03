import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

// Endpoints de auth que retornam token JWT e devem receber o cookie
const TOKEN_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/definir-senha-inicial',
  '/auth/switch-company',
  '/auth/trocar-senha',
  '/auth/primeira-senha-convite',
]

async function handler(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = '/auth/' + params.path.join('/')
  const backendUrl = BACKEND_URL.replace(/\/$/, '') + path

  // Logout: limpa cookie e encaminha para o backend
  if (path === '/auth/logout') {
    const cookieStore = cookies()
    const token = cookieStore.get('veltrix_token')?.value
    if (token) {
      await fetch(backendUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      }).catch(() => {/* ignora falha na blacklist */})
    }
    const response = NextResponse.json({}, { status: 204 })
    response.cookies.set('veltrix_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })
    return response
  }

  // Encaminha a requisição ao backend
  const body = request.method !== 'GET' && request.method !== 'HEAD'
    ? await request.text()
    : undefined

  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  const cookieStore = cookies()
  const existingToken = cookieStore.get('veltrix_token')?.value
  if (existingToken) {
    headers['Authorization'] = `Bearer ${existingToken}`
  }

  const backendResponse = await fetch(backendUrl, {
    method: request.method,
    headers,
    body,
  })

  const data = await backendResponse.json().catch(() => null)
  const response = NextResponse.json(data, { status: backendResponse.status })

  // Se o endpoint retorna token, set cookie HttpOnly no domínio do Next.js
  if (TOKEN_ENDPOINTS.includes(path) && data?.token) {
    const maxAge = data.token
      ? Math.floor((parseJwtExpiry(data.token) - Date.now()) / 1000)
      : 3600
    response.cookies.set('veltrix_token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAge > 0 ? maxAge : 3600,
    })
  }

  return response
}

function parseJwtExpiry(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return (payload.exp ?? 0) * 1000
  } catch {
    return Date.now() + 3600_000
  }
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const DELETE = handler
