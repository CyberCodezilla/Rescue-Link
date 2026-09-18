'use client';

import dynamic from 'next/dynamic';
import { MapPlaceholder } from '@responder/components/ui/LoadingState';
import type { IncidentMapProps } from './IncidentMap';

export const IncidentMapClient = dynamic<IncidentMapProps>(
  () => import('./IncidentMap').then((mod) => mod.IncidentMap),
  { ssr: false, loading: () => <MapPlaceholder /> }
);
