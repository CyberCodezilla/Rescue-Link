'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'development') {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) {
            reg.unregister();
          }
        });
        if ('caches' in window) {
          caches.keys().then((names) => {
            for (const name of names) caches.delete(name);
          });
        }
      } else {
        navigator.serviceWorker
          .register('/sw.js')
          .catch((err) => {
            console.debug('[ServiceWorker] Registration failed:', err);
          });
      }
    }
  }, []);

  return null;
}
