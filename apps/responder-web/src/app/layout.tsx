import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { AuthProvider } from '@/context/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';

export const metadata: Metadata = {
  title: 'Rescue-Link | Tactical Operations Command',
  description: 'Incident triage and responder coordination command center.',
};

export const viewport: Viewport = {
  themeColor: '#0B0F19',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-canvas text-ink-900 min-h-screen">
        <AuthProvider>
          <ServiceWorkerRegistration />
          <AuthModal />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
