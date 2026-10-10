import { db } from '@/lib/db';
import { CrewRankingBars, type CrewRankingDto } from './CrewRankingBars';

export async function CrewRanking() {
  const crews = await db.crewProfile.findMany({
    orderBy: { score: 'desc' },
    take: 3,
    include: { user: { select: { name: true } } },
  });

  const items: CrewRankingDto[] = crews.map((crew) => ({
    id: crew.id,
    handle: crew.handle,
    name: crew.user.name,
    score: crew.score,
    routesCompleted: crew.routesCompleted,
    stopsCompleted: crew.stopsCompleted,
    rating: crew.rating,
  }));

  return <CrewRankingBars crews={items} />;
}
