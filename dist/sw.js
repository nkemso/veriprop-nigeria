// VeriProp Nigeria — Service Worker
// Provides offline support, caching, and push notifications

const CACHE_NAME = 'veriprop-v1.0.0'
const OFFLINE_URL = '/offline.html'

const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
]

// Install: cache critical assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Pre-caching critical assets')
      return cache.addAll(PRECACHE_URLS)
    }).then(() => self.skipWaiting())
  )
})

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    ).then(() => {
      console.log('[SW] Active — controlling all clients')
      return self.clients.claim()
    })
  )
})

// Fetch: Network-first with cache fallback
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and external requests
  if (request.method !== 'GET') return
  if (url.origin !== self.location.origin && !url.hostname.includes('unsplash')) return

  // API requests: network only (never cache)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ success: false, message: 'You are offline. Please check your connection.' }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    )
    return
  }

  // Images: cache first
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
          }
          return response
        }).catch(() => cached)
      })
    )
    return
  }

  // HTML/JS/CSS: network first, cache fallback
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        }
        return response
      })
      .catch(async () => {
        const cached = await caches.match(request)
        if (cached) return cached
        // For navigation requests, return offline page
        if (request.mode === 'navigate') {
          const offlinePage = await caches.match(OFFLINE_URL)
          if (offlinePage) return offlinePage
        }
        return new Response('Offline — VeriProp Nigeria', { status: 503 })
      })
  )
})

// Push Notifications
self.addEventListener('push', event => {
  const data = event.data?.json() || {}
  const options = {
    body: data.body || 'You have a new notification from VeriProp Nigeria',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-96.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/', dateOfArrival: Date.now() },
    actions: [
      { action: 'view', title: 'View Now', icon: '/icons/icon-72.png' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    tag: data.tag || 'veriprop-notification',
    renotify: true,
  }

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'VeriProp Nigeria 🏠',
      options
    )
  )
})

// Notification click
self.addEventListener('notificationclick', event => {
  event.notification.close()
  if (event.action === 'dismiss') return

  const urlToOpen = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        const client = clientList.find(c => c.url.includes(self.location.origin))
        if (client) { client.focus(); client.navigate(urlToOpen) }
        else clients.openWindow(urlToOpen)
      })
  )
})

// Background sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncOfflineActions())
  }
})

async function syncOfflineActions() {
  // Replay any offline form submissions when connection restored
  console.log('[SW] Background sync: replaying offline actions')
}
