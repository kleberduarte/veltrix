/**
 * Corrige URLs de logo comuns que chegam sem extensão.
 * Ex.: ".../assets/images/violeta." -> ".../assets/images/violeta.png"
 */
export function normalizeLogoUrl(raw: string | null | undefined): string {
  const value = (raw ?? '').trim()
  if (!value) return ''

  if (!/^https?:\/\//i.test(value)) return value

  try {
    const u = new URL(value)
    if (u.pathname.endsWith('.')) {
      u.pathname = `${u.pathname}png`
      return u.toString()
    }
    return value
  } catch {
    return value
  }
}
