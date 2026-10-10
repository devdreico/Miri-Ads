'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Badge, GlassPanel } from '@/components/ui';
import { setDemoUser } from '@/lib/actions/admin';

interface NavItem {
  href: string;
  label: string;
  hint: string;
  icon: 'grid' | 'camera' | 'route' | 'pin' | 'box';
}

interface DemoOption {
  email: string;
  name: string;
  roleLabel: string;
}

export interface AdminSidebarProps {
  users: DemoOption[];
  currentEmail: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Dashboard', hint: 'KPIs y ciclo', icon: 'grid' },
  { href: '/admin/evidencias', label: 'Evidencias', hint: 'Revisión anti-fraude', icon: 'camera' },
  { href: '/admin/rutas', label: 'Rutas', hint: 'Crews y paradas', icon: 'route' },
  { href: '/admin/puntos', label: 'Puntos y zonas', hint: 'Inventario físico', icon: 'pin' },
  { href: '/admin/insumos', label: 'Insumos', hint: 'Stock y asignación', icon: 'box' },
];

const ICON_PATHS: Record<NavItem['icon'], string[]> = {
  grid: ['M4 4h7v7H4z', 'M13 4h7v7h-7z', 'M4 13h7v7H4z', 'M13 13h7v7h-7z'],
  camera: ['M4 8h3l2-3h6l2 3h3v11H4z', 'M12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z'],
  route: ['M6 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M18 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M9 16h5a4 4 0 0 0 0-8H10a4 4 0 0 0 0 8'],
  pin: ['M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z', 'M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
  box: ['M4 8l8-4 8 4v8l-8 4-8-4z', 'M4 8l8 4 8-4', 'M12 12v8'],
};

function NavIcon({ name }: { name: NavItem['icon'] }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4 shrink-0" aria-hidden="true">
      {ICON_PATHS[name].map((d) => (
        <path key={d} d={d} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

function DemoSwitcher({
  users,
  currentEmail,
  id,
}: {
  users: DemoOption[];
  currentEmail: string;
  id: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-gray-500">
          Usuario demo
        </span>
        <Badge tone="neutral" className="px-2 py-0.5 text-[9px]">
          modo demo · sin login
        </Badge>
      </div>
      <select
        id={id}
        value={currentEmail}
        disabled={isPending}
        onChange={(event) => {
          const email = event.target.value;
          startTransition(async () => {
            const result = await setDemoUser(email);
            if (result.ok) router.refresh();
          });
        }}
        className="w-full rounded-lg border border-white/12 bg-ink/70 px-3 py-2 text-sm text-paper outline-none transition-colors hover:border-aqua/40 focus-visible:border-aqua disabled:opacity-60"
      >
        {users.map((user) => (
          <option key={user.email} value={user.email} className="bg-ink text-paper">
            {user.name} · {user.roleLabel}
          </option>
        ))}
      </select>
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1.5">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
              isActive ? 'text-aqua' : 'text-gray-400 hover:bg-white/6 hover:text-paper'
            }`}
          >
            {isActive ? (
              <motion.span
                layoutId="admin-nav-active"
                className="absolute inset-0 rounded-xl border border-aqua/35 bg-aqua/10"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            ) : null}
            <span className="relative z-10 flex items-center gap-3">
              <NavIcon name={item.icon} />
              <span className="flex flex-col">
                <span className="font-medium leading-tight">{item.label}</span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-gray-500">
                  {item.hint}
                </span>
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebar({ users, currentEmail }: AdminSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col gap-6 border-r border-white/8 bg-ink-raised/70 p-5 backdrop-blur-xl lg:flex">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo/miri-ads-logo.png" alt="Miri Ads" width={132} height={122} className="h-9 w-auto" priority />
          <span className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Ciudad</span>
        </Link>
        <NavList />
        <div className="mt-auto">
          <DemoSwitcher users={users} currentEmail={currentEmail} id="demo-user-desktop" />
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/8 bg-ink-raised/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo/miri-ads-logo.png" alt="Miri Ads" width={110} height={101} className="h-8 w-auto" />
        </Link>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 bg-white/6 text-paper"
        >
          <span className="flex flex-col gap-1.5">
            <span className="block h-px w-5 bg-current" />
            <span className="block h-px w-5 bg-current" />
            <span className="block h-px w-5 bg-current" />
          </span>
        </button>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="admin-mobile-nav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <button
              type="button"
              aria-label="Cerrar menú de navegación"
              onClick={() => setOpen(false)}
              className="absolute inset-0 h-full w-full bg-ink/80 backdrop-blur-sm"
            />
            <GlassPanel className="absolute inset-x-3 top-16 z-10 flex flex-col gap-5 p-5" intensity={1.4}>
              <NavList onNavigate={() => setOpen(false)} />
              <DemoSwitcher users={users} currentEmail={currentEmail} id="demo-user-mobile" />
            </GlassPanel>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
