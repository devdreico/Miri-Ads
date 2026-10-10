import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebarData } from '@/components/admin/AdminSidebarData';
import { AdminChromeSkeleton, AdminHeaderSkeleton } from '@/components/admin/skeletons';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<AdminChromeSkeleton />}>
        <AdminSidebarData />
      </Suspense>
      <div className="lg:pl-60">
        <Suspense fallback={<AdminHeaderSkeleton />}>
          <AdminHeader />
        </Suspense>
        <main className="px-4 pb-20 pt-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
