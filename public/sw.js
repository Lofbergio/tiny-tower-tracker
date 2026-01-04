// Minimal service worker for PWA installability
// Not focused on offline functionality - just enables "Add to Home Screen"

self.addEventListener('install', event => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim())
})

// Pass through all fetch requests to the network
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request))
})
