/**
 * Upload local (LocalStorageService sem public-base-url) grava URL relativa /files/... na API.
 * Componentes de imagem exigem URL absoluta — prefixamos com NEXT_PUBLIC_API_URL.
 */
export function absolutizeProductImageUrlIfRelative(raw: string): string {
  const u = raw.trim()
  if (!u) return ''
  if (/^https?:\/\//i.test(u)) return u
  if (u.startsWith('/files/')) {
    const base = (process.env.NEXT_PUBLIC_API_URL ?? '').trim().replace(/\/$/, '')
    return base ? `${base}${u}` : u
  }
  return u
}

/** URL utilizável em <img> / next/image; null se vazio ou /files/ sem base configurada. */
export function resolveProductImageUrl(url: string | null | undefined): string | null {
  const u = url?.trim()
  if (!u) return null
  if (/^https?:\/\//i.test(u)) return u
  if (u.startsWith('/files/')) {
    const base = (process.env.NEXT_PUBLIC_API_URL ?? '').trim().replace(/\/$/, '')
    return base ? `${base}${u}` : null
  }
  return null
}
