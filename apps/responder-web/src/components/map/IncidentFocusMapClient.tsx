'use client';

import dynamic from 'next/dynamic';
import { MapPlaceholder } from '@responder/components/ui/LoadingState';
import type { IncidentFocusMapProps } from './IncidentFocusMap';

export const IncidentFocusMapClient = dynamic<IncidentFocusMapProps>(
  () => import('./IncidentFocusMap').then((mod) => mod.IncidentFocusMap),
  { ssr: false, loading: () => <MapPlaceholder /> }
);