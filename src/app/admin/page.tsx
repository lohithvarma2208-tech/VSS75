import { cookies } from 'next/headers';
import { getErpSession, SESSION_COOKIE } from '@/lib/erp/session';
import { isAdminProfile } from '@/lib/erp/admin-auth';
import AdminDashboard from './AdminDashboard';
import AdminUnlockGate from './AdminUnlockGate';

export const dynamic = 'force-dynamic';

const VALID_PASSKEYS = ['VSS75@ADMIN', 'DEEPTHANUSH@ADMIN', 'ADMIN-CORE-75'];

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value ?? '';
  const adminPasskey = cookieStore.get('vss_admin_passkey')?.value ?? '';
  const profile = token ? await getErpSession(token).catch(() => null) : null;

  const isServerAdmin = isAdminProfile(profile);
  const isPasskeyAdmin = VALID_PASSKEYS.includes(adminPasskey);

  if (!isServerAdmin && !isPasskeyAdmin) {
    return (
      <AdminUnlockGate
        hasErpSession={Boolean(profile)}
        erpUserRoll={profile?.rollNumber}
      />
    );
  }

  const administrator = {
    name: profile?.name || 'Chief Administrator',
    registrationNumber: profile?.rollNumber || (isPasskeyAdmin ? 'VSS75-SUPERADMIN' : 'ADMIN-ROOT'),
  };

  return <AdminDashboard administrator={administrator} isPasskeyMode={isPasskeyAdmin} />;
}
