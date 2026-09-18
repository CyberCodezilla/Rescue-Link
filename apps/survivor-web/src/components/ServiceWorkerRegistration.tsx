'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => {
          // Gracefully log SW registration failures in dev/restricted environments
          console.debug('[ServiceWorker] Registration failed:', err);
        });
    }
  }, []);

  return null;
}
