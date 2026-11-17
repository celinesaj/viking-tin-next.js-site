import { redirect } from 'next/navigation';
import { ensureValidAuthSession } from '@/lib/authServer';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await ensureValidAuthSession();

  if (!user.phone || !user.phone_verified_at) {
    redirect('/complete-phone');
  }

  return <>{children}</>;
}