import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { LanguageProvider } from '@/i18n/LanguageContext';

export const metadata: Metadata = {
  title: 'RescueLink | Disaster Distress SOS Client',
  description: 'Panic-resilient offline-capable emergency beacon and rescue response tracker.',
  applicationName: 'RescueLink Survivor',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'RescueLink SOS',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0d14',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="dark" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ServiceWorkerRegistration />
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}