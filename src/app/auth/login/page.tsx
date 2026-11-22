import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getErpSession, SESSION_COOKIE } from '@/lib/erp/session';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  const sessionId = cookies().get(SESSION_COOKIE)?.value;
  if (sessionId && await getErpSession(sessionId)) redirect('/auth/erp/profile');
  return <LoginForm />;
}
