import { Suspense } from 'react';
import { RankingBoard } from '@/components/crew/RankingBoard';
import { CrewRankingSkeleton } from '@/components/crew/skeletons';

export default function CrewRankingPage() {
  return (
    <Suspense fallback={<CrewRankingSkeleton />}>
      <RankingBoard />
    </Suspense>
  );
}
