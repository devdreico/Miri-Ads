import { db } from '@/lib/db';
import { getCurrentCrewUser } from './demo-session';
import {
  RankingBoardClient,
  type AchievementDto,
  type RankingCrewDto,
} from './RankingBoardClient';

export async function RankingBoard() {
  const session = await getCurrentCrewUser();
  const crews = await db.crewProfile.findMany({
    orderBy: { score: 'desc' },
    include: { user: { select: { name: true } } },
  });
  const entries = await db.crewScore.findMany({
    where: { crewId: session.crew.id },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });

  const items: RankingCrewDto[] = crews.map((crew) => ({
    id: crew.id,
    handle: crew.handle,
    name: crew.user.name,
    score: crew.score,
    routesCompleted: crew.routesCompleted,
    stopsCompleted: crew.stopsCompleted,
    rating: crew.rating,
  }));

  const meItem = items.find((item) => item.id === session.crew.id);
  const me: RankingCrewDto = meItem ?? {
    id: session.crew.id,
    handle: session.crew.handle,
    name: session.user.name,
    score: session.crew.score,
    routesCompleted: session.crew.routesCompleted,
    stopsCompleted: session.crew.stopsCompleted,
    rating: session.crew.rating,
  };

  const achievements: AchievementDto[] = entries.map((entry) => ({
    id: entry.id,
    reason: entry.reason,
    points: entry.points,
    createdAt: entry.createdAt.toISOString(),
  }));

  return <RankingBoardClient crews={items} me={me} achievements={achievements} />;
}
