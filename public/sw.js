// Bantay-AI Service Worker - Offline First PWA
const CACHE_NAME = 'bantay-ai-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline functionality
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/offline.html'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell resources');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[SW] Cache installation failed:', error);
      })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all clients
  event.waitUntil(self.clients.claim());
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          console.log('[SW] Serving from cache:', event.request.url);
          return response;
        }
        
        // Otherwise, fetch from network
        console.log('[SW] Fetching from network:', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            // Add to cache for future use
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch((error) => {
            console.error('[SW] Fetch failed:', error);
            
            // Return offline page for navigation requests
            if (event.request.destination === 'document') {
              return caches.match(OFFLINE_URL);
            }
            
            // Return a fallback response for other requests
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let notificationData = {
    title: '🚨 BANTAY-AI: EVACUATE NOW 🚨',
    body: 'Floodwater will reach your home in 40 minutes. Tap for details.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'flood-warning',
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: '/?alert=danger',
      threatType: 'flood',
      urgency: 'immediate'
    }
  };
  
  // Customize notification based on push data
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        ...pushData
      };
    } catch (error) {
      console.error('[SW] Error parsing push data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received');
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/?alert=danger';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Focus existing window
            client.focus();
            
            // Navigate to the appropriate route
            client.navigate(urlToOpen);
            return;
          }
        }
        
        // If no existing window, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync event (for future sensor data sync)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sensor-data-sync') {
    event.waitUntil(
      // Sync sensor data when back online
      syncSensorData()
    );
  }
});

// Helper function to sync sensor data
async function syncSensorData() {
  try {
    // This would sync any pending sensor data
    console.log('[SW] Syncing sensor data...');
    
    // In a real implementation, this would:
    // 1. Check local IndexedDB for pending data
    // 2. Sync with the server when online
    // 3. Clear pending data after successful sync
    
  } catch (error) {
    console.error('[SW] Sensor data sync failed:', error);
  }
}