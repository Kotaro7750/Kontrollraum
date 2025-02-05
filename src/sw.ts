import { precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)

console.log('Hello from sw.ts')

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  console.log(`[Service Worker] Push had this data: "${event.data?.text()}"`);

  let title = 'Notification (no title)';
  let body = event.data?.text();

  if (event.data) {
    try {
      const dataJson = JSON.parse(event.data.text());

      title = dataJson.title ?? title;
      body = dataJson.body ?? body;
    } catch (err: unknown) {
      if (err instanceof SyntaxError) {
        console.error('Error parsing JSON', err);
      } else {
        console.error('Error parsing JSON', err);
      }
    }
  }


  const options = {
    body: body,
    icon: 'favicon.ico',
    badge: 'favicon.ico',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
