import { cookies } from 'next/headers';
import Link from 'next/link';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { getErpSession, SESSION_COOKIE } from '@/lib/erp/session';
import { isAdminProfile } from '@/lib/erp/admin-auth';
import AdminDashboard from './AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? '';
  const profile = token ? await getErpSession(token).catch(() => null) : null;

  if (!profile) return <AccessState icon={LockKeyhole} title="Admin sign-in required" message="Sign in with an authorized ERP account to continue." action="Sign in" href="/auth/login" />;
  if (!isAdminProfile(profile)) return <AccessState icon={ShieldCheck} title="Access denied" message="This verified ERP account is not on the server-side administrator allowlist." action="Back to VSS" href="/" />;

  return <AdminDashboard administrator={{ name: profile.name, registrationNumber: profile.rollNumber }} />;
}

function AccessState({ icon: Icon, title, message, action, href }: { icon: typeof LockKeyhole; title: string; message: string; action: string; href: string }) {
  return <main className="mx-auto max-w-lg px-5 py-20 text-center"><div className="vss-card p-8"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.05] text-violet-300"><Icon className="h-5 w-5" /></span><h1 className="mt-5 text-xl font-extrabold">{title}</h1><p className="mt-2 text-xs leading-5 text-white/38">{message}</p><Link href={href} className="vss-button mt-6">{action}</Link></div></main>;
}
