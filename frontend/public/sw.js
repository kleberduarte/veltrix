const CACHE_NAME = 'veltrix-pwa-v2'
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/login',
  '/offline.html',
  '/manifest.webmanifest',
  '/pwa-icon?size=192',
  '/pwa-icon?size=512',
  '/apple-touch-icon',
]

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/assets/') ||
    url.pathname === '/manifest.webmanifest' ||
    url.pathname === '/offline.html' ||
    url.pathname === '/apple-touch-icon' ||
    url.pathname === '/icon.svg' ||
    url.pathname === '/favicon.ico' ||
    url.pathname.startsWith('/pwa-icon')
  )
}

async function networkFirst(request, fallbackPath) {
  const cache = await caches.open(CACHE_NAME)
  try {
    const response = await fetch(request)
    if (response && response.status === 200) {
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    if (fallbackPath) {
      const fallback = await caches.match(fallbackPath)
      if (fallback) return fallback
    }
    throw new Error('network-failed')
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response && response.status === 200) {
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, response.clone())
  }
  return response
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  const isHttp = url.protocol === 'http:' || url.protocol === 'https:'
  if (!isHttp) return

  // APIs ficam network-first para evitar dados antigos/sensíveis.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(event.request))
    return
  }

  // Navegação: tenta rede e, se offline, entrega fallback.
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, '/offline.html'))
    return
  }

  // Assets estáticos: cache-first para melhor desempenho.
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(event.request))
    return
  }

  // Demais GET: rede com fallback em cache.
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request)),
  )
})
