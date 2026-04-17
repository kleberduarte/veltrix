/** Favicon padrão Veltrix (app/icon.svg). */
export const DEFAULT_FAVICON_HREF = '/icon.svg'

/**
 * Atualiza ícones do documento (favicon e apple-touch) para o logo da empresa ou o padrão.
 * Usado na página /acesso/[token] e no EmpresaTheme após login.
 */
export function setDocumentFavicon(logoUrl: string | null | undefined): void {
  if (typeof document === 'undefined') return
  const href = logoUrl?.trim() ? logoUrl.trim() : DEFAULT_FAVICON_HREF

  const applyType = (el: HTMLLinkElement) => {
    if (/\.svg($|\?)/i.test(href)) el.type = 'image/svg+xml'
    else if (/\.png($|\?)/i.test(href)) el.type = 'image/png'
    else el.removeAttribute('type')
  }

  const iconLinks = document.querySelectorAll(
    'link[rel="icon"], link[rel="shortcut icon"]',
  )
  if (iconLinks.length === 0) {
    const el = document.createElement('link')
    el.rel = 'icon'
    el.href = href
    applyType(el)
    document.head.appendChild(el)
  } else {
    iconLinks.forEach((node) => {
      const el = node as HTMLLinkElement
      el.href = href
      applyType(el)
    })
  }

  let apple = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null
  if (!apple) {
    apple = document.createElement('link')
    apple.rel = 'apple-touch-icon'
    document.head.appendChild(apple)
  }
  apple.href = href
  applyType(apple)
}
