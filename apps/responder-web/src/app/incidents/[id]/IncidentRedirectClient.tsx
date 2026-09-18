'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export function IncidentRedirectClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (params?.id) {
      router.replace(`/?incident=${encodeURIComponent(params.id)}`);
    } else {
      router.replace('/');
    }
  }, [params, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas text-ink-500 font-mono text-xs gap-3">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-action border-t-transparent" />
      <span>Redirecting to Command Center Tactical Dispatcher...</span>
    </div>
  );
}
