import type { Role } from '@prisma/client';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

export const DEMO_COOKIE = 'miri_demo_user';
export const DEMO_DEFAULT_EMAIL = 'admin.lima@miriads.com';

export interface DemoUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  crewId: string | null;
  cityId: string | null;
}

interface UserLinks {
  id: string;
  email: string;
  name: string;
  role: Role;
  crew: { id: string; cityId: string } | null;
  adminOf: { id: string } | null;
}

const linkInclude = {
  crew: { select: { id: true, cityId: true } },
  adminOf: { select: { id: true } },
};

function toDemoUser(user: UserLinks): DemoUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    crewId: user.crew?.id ?? null,
    cityId: user.adminOf?.id ?? user.crew?.cityId ?? null,
  };
}

export async function listDemoUsers(): Promise<DemoUser[]> {
  const users = await db.user.findMany({
    where: { role: { in: ['CITY_ADMIN', 'MIRI_CENTRAL', 'CREW'] } },
    include: linkInclude,
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  });
  return users.map(toDemoUser);
}

export async function getCurrentDemoUser(
  fallbackEmail: string = DEMO_DEFAULT_EMAIL,
): Promise<DemoUser> {
  const store = await cookies();
  const email = store.get(DEMO_COOKIE)?.value ?? fallbackEmail;
  const found = await db.user.findUnique({ where: { email }, include: linkInclude });
  if (found) return toDemoUser(found);
  const fallback = await db.user.findUnique({ where: { email: fallbackEmail }, include: linkInclude });
  if (fallback) return toDemoUser(fallback);
  throw new Error('No existe el usuario demo en la base de datos.');
}

export async function resolveCityId(preferred?: string | null): Promise<string | null> {
  if (preferred) {
    const city = await db.city.findUnique({ where: { id: preferred }, select: { id: true } });
    if (city) return city.id;
  }
  const user = await getCurrentDemoUser();
  if (user.cityId) {
    const city = await db.city.findUnique({ where: { id: user.cityId }, select: { id: true } });
    if (city) return city.id;
  }
  const lima = await db.city.findUnique({ where: { slug: 'lima' }, select: { id: true } });
  if (lima) return lima.id;
  const first = await db.city.findFirst({ select: { id: true } });
  return first?.id ?? null;
}

export async function resolveReviewerId(): Promise<string | null> {
  const user = await getCurrentDemoUser();
  if (user.role === 'CITY_ADMIN' || user.role === 'MIRI_CENTRAL') return user.id;
  const admin = await db.user.findFirst({
    where: { role: 'CITY_ADMIN' },
    select: { id: true },
    orderBy: { name: 'asc' },
  });
  return admin?.id ?? null;
}
