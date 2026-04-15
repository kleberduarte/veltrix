'use client'

import { useCallback, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { parametrosEmpresaService } from '@/services/parametrosEmpresaService'

const HEX = /^#[0-9A-Fa-f]{6}$/

const WHITE: [number, number, number] = [255, 255, 255]
const BLACK: [number, number, number] = [0, 0, 0]

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbCss(c: [number, number, number]) {
  return `${c[0]} ${c[1]} ${c[2]}`
}

function mix(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}

const PRIMARY_VAR_KEYS = ['50', '100', '200', '500', '600', '700', '800', '900'] as const

function clearPrimaryPalette(root: HTMLElement) {
  PRIMARY_VAR_KEYS.forEach(k => root.style.removeProperty(`--veltrix-primary-${k}`))
}

/** Escala Tailwind `primary-*` (RGB separados por espaço) a partir das cores da empresa. */
function aplicarPaletaPrimary(
  root: HTMLElement,
  corPrimaria: string | null | undefined,
  corSecundaria: string | null | undefined
) {
  const prim = corPrimaria && HEX.test(corPrimaria.trim()) ? hexToRgb(corPrimaria.trim()) : null
  const sec = corSecundaria && HEX.test(corSecundaria.trim()) ? hexToRgb(corSecundaria.trim()) : null

  if (!prim) {
    clearPrimaryPalette(root)
    return
  }

  const set = (k: (typeof PRIMARY_VAR_KEYS)[number], c: [number, number, number]) => {
    root.style.setProperty(`--veltrix-primary-${k}`, rgbCss(c))
  }

  set('50', mix(WHITE, prim, 0.07))
  set('100', mix(WHITE, prim, 0.14))
  set('200', mix(WHITE, prim, 0.28))
  set('500', mix(prim, WHITE, 0.1))
  set('600', prim)
  set('700', mix(prim, BLACK, 0.18))
  set('800', mix(prim, BLACK, 0.35))
  set('900', sec ?? mix(prim, BLACK, 0.55))
}

/**
 * Remove todas as sobrescritas inline de tema, fazendo o :root (defaults Veltrix) reassumir.
 * Usar quando a empresa não tem parametrização própria ou ao deslogar.
 */
function limparThemeInline(root: HTMLElement) {
  ;[
    '--veltrix-cor-primaria',
    '--veltrix-cor-secundaria',
    '--veltrix-cor-fundo',
    '--veltrix-cor-texto',
    '--veltrix-cor-botao',
    '--veltrix-cor-botao-texto',
  ].forEach(n => root.style.removeProperty(n))
  clearPrimaryPalette(root)
}

function aplicarCores(root: HTMLElement, p: Awaited<ReturnType<typeof parametrosEmpresaService.get>>) {
  if (!p) {
    // Sem parametrização → remove overrides inline; :root (defaults Veltrix) assume
    limparThemeInline(root)
    return
  }
  const set = (name: string, val?: string | null) => {
    if (val && HEX.test(val.trim())) root.style.setProperty(name, val.trim())
    else root.style.removeProperty(name)
  }
  set('--veltrix-cor-primaria', p.corPrimaria)
  set('--veltrix-cor-secundaria', p.corSecundaria)
  set('--veltrix-cor-fundo', p.corFundo)
  set('--veltrix-cor-texto', p.corTexto)
  set('--veltrix-cor-botao', p.corBotao)
  set('--veltrix-cor-botao-texto', p.corBotaoTexto)
  aplicarPaletaPrimary(root, p.corPrimaria, p.corSecundaria)
}

/** Aplica cores dos parâmetros da empresa ao documento (equivalente ao tema do legado por tenant). */
export default function EmpresaTheme({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const carregar = useCallback(async () => {
    const root = document.documentElement
    if (!isAuthenticated()) {
      aplicarCores(root, null)
      return
    }
    try {
      const p = await parametrosEmpresaService.get()
      aplicarCores(root, p)
    } catch {
      aplicarCores(root, null)
    }
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar, pathname])

  useEffect(() => {
    const onAuth = () => void carregar()
    window.addEventListener('veltrix-auth-changed', onAuth)
    return () => window.removeEventListener('veltrix-auth-changed', onAuth)
  }, [carregar])

  return <>{children}</>
}
