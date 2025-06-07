const CACHE_NAME = 'phantom-identity-v1.0.0';
const STATIC_CACHE_NAME = 'phantom-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'phantom-dynamic-v1.0.0';

// Arquivos essenciais para cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/style.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// URLs que devem ser sempre da rede
const NETWORK_ONLY = [
  '/api/',
  '/socket.io/'
];

// URLs que podem funcionar offline
const CACHE_FIRST = [
  '/icons/',
  '/screenshots/',
  'https://cdnjs.cloudflare.com/',
  'https://fonts.googleapis.com/',
  'https://fonts.gstatic.com/'
];

// Instalar Service Worker
self.addEventListener('install', event => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cacheando arquivos estáticos...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Arquivos estáticos cacheados com sucesso!');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Erro ao cachear arquivos estáticos:', error);
      })
  );
});

// Ativar Service Worker
self.addEventListener('activate', event => {
  console.log('[SW] Ativando Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('[SW] Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker ativado!');
        return self.clients.claim();
      })
  );
});

// Interceptar requisições
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições não-HTTP
  if (!request.url.startsWith('http')) {
    return;
  }

  // Socket.IO e API sempre da rede
  if (NETWORK_ONLY.some(pattern => request.url.includes(pattern))) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // Resposta offline para API
          if (request.url.includes('/api/')) {
            return new Response(
              JSON.stringify({ 
                error: 'Offline', 
                message: 'Aplicação em modo offline' 
              }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }
          return new Response('Offline', { status: 503 });
        })
    );
    return;
  }

  // Estratégia Cache First para recursos estáticos
  if (CACHE_FIRST.some(pattern => request.url.includes(pattern))) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(request)
            .then(fetchResponse => {
              const responseClone = fetchResponse.clone();
              caches.open(DYNAMIC_CACHE_NAME)
                .then(cache => {
                  cache.put(request, responseClone);
                });
              return fetchResponse;
            });
        })
    );
    return;
  }

  // Estratégia Network First para páginas
  event.respondWith(
    fetch(request)
      .then(response => {
        // Se é uma página HTML, cachear para uso offline
        if (request.headers.get('accept').includes('text/html')) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE_NAME)
            .then(cache => {
              cache.put(request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // Fallback para cache se offline
        return caches.match(request)
          .then(response => {
            if (response) {
              return response;
            }
            
            // Fallback para página principal se for navegação
            if (request.headers.get('accept').includes('text/html')) {
              return caches.match('/');
            }
            
            // Resposta offline genérica
            return new Response('Conteúdo não disponível offline', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Notificações Push
self.addEventListener('push', event => {
  console.log('[SW] Push recebido:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Notificação do Phantom Identity',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Abrir App',
        icon: '/icons/action-explore.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icons/action-close.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Phantom Identity', options)
  );
});

// Clique em notificação
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notificação clicada:', event);
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Apenas fecha a notificação
  } else {
    // Clique no corpo da notificação
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then(clientList => {
          if (clientList.length > 0) {
            return clientList[0].focus();
          }
          return clients.openWindow('/');
        })
    );
  }
});

// Sincronização em background
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Sincronizar dados quando voltar online
      syncData()
    );
  }
});

// Função para sincronizar dados
async function syncData() {
  try {
    console.log('[SW] Sincronizando dados...');
    
    // Buscar dados pendentes no IndexedDB
    const pendingData = await getPendingData();
    
    if (pendingData.length > 0) {
      for (const data of pendingData) {
        await fetch('/api/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
      }
      
      // Limpar dados pendentes após sincronização
      await clearPendingData();
      console.log('[SW] Dados sincronizados com sucesso!');
    }
  } catch (error) {
    console.error('[SW] Erro na sincronização:', error);
  }
}

// Funções auxiliares para IndexedDB (simuladas)
async function getPendingData() {
  // Implementar busca no IndexedDB
  return [];
}

async function clearPendingData() {
  // Implementar limpeza no IndexedDB
}

// Atualização da aplicação
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Log de informações do SW
console.log('[SW] Service Worker carregado - Phantom Identity System'); 