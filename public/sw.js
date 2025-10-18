// Service Worker para notificações push
const CACHE_NAME = 'hospital-maintenance-v1';
const urlsToCache = [
  '/',
  '/notificacoes',
  '/icon-192x192.svg',
  '/badge-72x72.svg'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar requisições de rede
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retornar cache se disponível, senão buscar na rede
        return response || fetch(event.request);
      })
  );
});

// Receber notificações push
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  let notificationData = {};
  
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (error) {
      console.error('Error parsing push data:', error);
      notificationData = {
        title: 'Nova Notificação',
        body: 'Você tem uma nova notificação do sistema.',
        icon: '/icon-192x192.svg'
      };
    }
  }

  const options = {
    body: notificationData.body || 'Nova notificação disponível',
    icon: notificationData.icon || '/icon-192x192.svg',
    badge: notificationData.badge || '/badge-72x72.svg',
    tag: notificationData.tag || 'default',
    data: notificationData.data || {},
    actions: [
      {
        action: 'view',
        title: 'Ver Detalhes'
      },
      {
        action: 'dismiss',
        title: 'Dispensar'
      }
    ],
    requireInteraction: true,
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'Sistema de Manutenção',
      options
    )
  );
});

// Lidar com cliques na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/notificacoes';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Verificar se já existe uma janela aberta
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(urlToOpen);
          return;
        }
      }
      
      // Se não há janela aberta, abrir uma nova
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Lidar com fechamento da notificação
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
  
  // Opcional: registrar analytics ou outras ações
  // quando a notificação é fechada sem interação
});

// Sincronização em background
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Executar tarefas de sincronização em background
      syncNotifications()
    );
  }
});

// Função para sincronizar notificações em background
async function syncNotifications() {
  try {
    // Implementar lógica de sincronização se necessário
    console.log('Background sync executed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Lidar com mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});