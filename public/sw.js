// ZapFlow Service Worker — Soporte offline básico + notificaciones PWA
const CACHE_NAME = 'zapflow-v1'
const STATIC_ASSETS = [
  '/',
  '/zapflow-icon-192.png',
  '/zapflow-icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  )
  self.clients.claim()
})

// Network-first para el dashboard (siempre datos frescos)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Skip no-GET, API calls, Supabase, etc.
  if (
    event.request.method !== 'GET' ||
    url.hostname.includes('supabase') ||
    url.pathname.startsWith('/api/') ||
    url.protocol === 'chrome-extension:'
  ) {
    return
  }

  // Network first con fallback a cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone))
        }
        return response
      })
      .catch(() => caches.match(event.request))
  )
})

// Notificaciones push (pedidos nuevos)
self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || '🔔 ZapFlow', {
      body: data.body || 'Nuevo evento en tu negocio',
      icon: '/zapflow-icon-192.png',
      badge: '/zapflow-icon-192.png',
      vibrate: [100, 50, 100, 50, 200],
      tag: 'zapflow-order',
      renotify: true,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow('/dashboard')
    })
  )
})
