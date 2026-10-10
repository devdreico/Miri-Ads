import { Suspense } from 'react';
import { EvidenceBoard } from '@/components/admin/EvidenceBoard';
import { EvidenceBoardSkeleton } from '@/components/admin/skeletons';

type EvidenciasPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function EvidenciasPage({ searchParams }: EvidenciasPageProps) {
  return (
    <Suspense fallback={<EvidenceBoardSkeleton />}>
      <EvidenceBoard searchParams={searchParams} />
    </Suspense>
  );
}
