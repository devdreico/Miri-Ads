import type { Role } from '@prisma/client';
import { listDemoUsers } from '@/components/admin/demo-session';
import { getCurrentCrewUser } from './demo-session';
import { CrewTopbar, type CrewDemoOption } from './CrewTopbar';

const ROLE_LABELS: Record<Role, string> = {
  CITY_ADMIN: 'Admin de ciudad',
  MIRI_CENTRAL: 'Mirí Central',
  CREW: 'Crew',
  CLIENT: 'Cliente',
};

export async function CrewTopbarData() {
  const [session, users] = await Promise.all([getCurrentCrewUser(), listDemoUsers()]);
  const options: CrewDemoOption[] = users.map((item) => ({
    email: item.email,
    name: item.name,
    roleLabel: ROLE_LABELS[item.role] ?? item.role,
  }));
  if (!options.some((option) => option.email === session.user.email)) {
    options.unshift({
      email: session.user.email,
      name: session.user.name,
      roleLabel: 'Crew',
    });
  }
  return (
    <CrewTopbar
      users={options}
      currentEmail={session.user.email}
      userName={session.user.name}
    />
  );
}
