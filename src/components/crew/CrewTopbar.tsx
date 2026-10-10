'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Badge, GlassPanel } from '@/components/ui';
import { setDemoUser } from '@/lib/actions/admin';

export interface CrewDemoOption {
  email: string;
  name: string;
  roleLabel: string;
}

export function CrewTopbar({
  users,
  currentEmail,
  userName,
}: {
  users: CrewDemoOption[];
  currentEmail: string;
  userName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const switcher = (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-gray-500">
        Usuario demo
      </span>
      <select
        aria-label="Seleccionar usuario demo"
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

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-ink-raised/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/crew" className="flex items-center gap-3">
          <Image src="/logo/miri-ads-logo.png" alt="Miri Ads" width={120} height={111} className="h-8 w-auto" priority />
          <span className="hidden text-[10px] uppercase tracking-[0.22em] text-gray-500 sm:inline">
            Miri Crew
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Badge tone="neutral" className="hidden sm:inline-flex">
            modo demo · sin login
          </Badge>
          <Link
            href="/crew/ranking"
            className={`inline-flex h-9 items-center rounded-lg border px-3 text-xs font-medium transition-colors ${
              pathname.startsWith('/crew/ranking')
                ? 'border-aqua/50 bg-aqua/10 text-aqua'
                : 'border-white/12 bg-white/5 text-gray-300 hover:border-aqua/40 hover:text-aqua'
            }`}
          >
            Ranking
          </Link>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label="Abrir selector de usuario demo"
            className="flex h-9 items-center gap-2 rounded-lg border border-white/12 bg-white/5 px-3 text-xs font-medium text-paper lg:hidden"
          >
            {userName.split(' ')[0]}
            <span className="text-[10px] text-gray-500">▾</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden lg:hidden"
          >
            <GlassPanel className="mx-4 mb-3 p-4 sm:mx-6" intensity={1.2}>
              {switcher}
            </GlassPanel>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="hidden px-4 pb-3 sm:px-6 lg:block">
        <div className="ml-auto w-72">{switcher}</div>
      </div>
    </header>
  );
}
