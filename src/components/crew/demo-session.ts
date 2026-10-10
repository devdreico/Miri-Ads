import { cookies } from 'next/headers';
import { db } from '@/lib/db';

export { DEMO_COOKIE, listDemoUsers } from '@/components/admin/demo-session';

const DEMO_CREW_EMAIL = 'ana.torres@miriads.com';

export interface CrewLite {
  id: string;
  handle: string;
  status: string;
  rating: number;
  score: number;
  routesCompleted: number;
  stopsCompleted: number;
  cityId: string;
  userId: string;
}

export interface CrewSession {
  user: { id: string; email: string; name: string };
  crew: CrewLite;
}

export async function getCurrentCrewUser(): Promise<CrewSession> {
  const store = await cookies();
  const email = store.get('miri_demo_user')?.value ?? DEMO_CREW_EMAIL;
  const withCrew = await db.user.findUnique({ where: { email }, include: { crew: true } });
  const sessionUser =
    withCrew ??
    (await db.user.findUnique({
      where: { email: DEMO_CREW_EMAIL },
      include: { crew: true },
    }));
  if (!sessionUser) throw new Error('No existe el usuario demo en la base de datos.');
  const crew =
    sessionUser.crew ?? (await db.crewProfile.findFirst({ orderBy: { score: 'desc' } }));
  if (!crew) throw new Error('No hay crews registradas en la ciudad.');
  return {
    user: { id: sessionUser.id, email: sessionUser.email, name: sessionUser.name },
    crew: {
      id: crew.id,
      handle: crew.handle,
      status: crew.status,
      rating: crew.rating,
      score: crew.score,
      routesCompleted: crew.routesCompleted,
      stopsCompleted: crew.stopsCompleted,
      cityId: crew.cityId,
      userId: crew.userId,
    },
  };
}
