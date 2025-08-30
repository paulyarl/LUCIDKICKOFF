self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return
  
  event.respondWith((async () => {
    try { 
      return await fetch(request) 
    } catch {
      return caches.match(request) || new Response("Offline", { status: 503 })
    }
  })())
})
