import { Suspense } from 'react';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { CrewTopbarData } from '@/components/crew/CrewTopbarData';
import { CrewTopbarSkeleton } from '@/components/crew/skeletons';

export const metadata: Metadata = {
  title: "Miri Crew",
  robots: { index: false, follow: false },
};

export default function CrewLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<CrewTopbarSkeleton />}>
        <CrewTopbarData />
      </Suspense>
      <main className="mx-auto w-full max-w-5xl px-4 pb-20 pt-6 sm:px-6">{children}</main>
    </div>
  );
}
