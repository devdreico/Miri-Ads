import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteNav } from '@/components/layout/SiteNav';

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      <div className="relative z-10">{children}</div>
      <SiteFooter />
    </>
  );
}
