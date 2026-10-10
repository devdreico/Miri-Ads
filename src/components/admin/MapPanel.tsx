'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui';
import type { MapViewProps, MapPoint, MapZone } from './MapView';

export type { MapPoint, MapZone };

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full min-h-[280px]" />,
});

export function MapPanel(props: MapViewProps) {
  return <MapView {...props} />;
}
