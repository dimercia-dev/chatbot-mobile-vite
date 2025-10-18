  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open('chatbot-cache').then((cache) => {
        return cache.addAll([
          '/',
          '/index.html',
          '/styles.css',
          '/app.js',
          '/favicon.ico',
          '/icons/winnachat.png',
          '/icons/winnachat512x515.png'
        ]);
      })
    );
  });

  self.addEventListener('fetch', (event) => {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  });
