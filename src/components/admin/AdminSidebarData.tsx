import type { Role } from '@prisma/client';
import { AdminSidebar } from './AdminSidebar';
import { getCurrentDemoUser, listDemoUsers } from './demo-session';

const ROLE_LABELS: Record<Role, string> = {
  CITY_ADMIN: 'Admin de ciudad',
  MIRI_CENTRAL: 'Mirí Central',
  CREW: 'Crew',
  CLIENT: 'Cliente',
};

export async function AdminSidebarData() {
  const [user, users] = await Promise.all([getCurrentDemoUser(), listDemoUsers()]);
  const options = users.map((item) => ({
    email: item.email,
    name: item.name,
    roleLabel: ROLE_LABELS[item.role] ?? item.role,
  }));
  if (!options.some((option) => option.email === user.email)) {
    options.unshift({
      email: user.email,
      name: user.name,
      roleLabel: ROLE_LABELS[user.role] ?? user.role,
    });
  }
  return <AdminSidebar users={options} currentEmail={user.email} />;
}
