import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getErpSession, SESSION_COOKIE } from '@/lib/erp/session';
import SignOutButton from './SignOutButton';

export default async function ErpProfilePage() {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  const profile = id ? await getErpSession(id) : null;
  if (!profile) redirect('/auth/login');

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-16">
      <section className="space-y-5 rounded-3xl border border-white/10 bg-[#131B2E] p-6 sm:p-8 text-white">
        <h1 className="text-2xl font-bold">Your KL ERP profile</h1>
        <dl className="divide-y divide-white/10">
          <div className="py-3">
            <dt className="text-sm text-white/65">Name</dt>
            <dd className="font-semibold">{profile.name}</dd>
          </div>
          <div className="py-3">
            <dt className="text-sm text-white/65">Roll number</dt>
            <dd className="font-semibold">{profile.rollNumber}</dd>
          </div>
          {profile.department && (
            <div className="py-3">
              <dt className="text-sm text-white/65">Department</dt>
              <dd className="font-semibold">{profile.department}</dd>
            </div>
          )}
        </dl>
        <SignOutButton />
      </section>
    </main>
  );
}
