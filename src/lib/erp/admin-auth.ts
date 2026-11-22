import type { ErpProfile } from './client';

export function isAdminProfile(profile: ErpProfile | null | undefined) {
  if (!profile?.rollNumber) return false;
  const allowed = (process.env.ADMIN_REGISTRATION_NUMBERS || '')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => /^\d{6,20}$/.test(value));
  return allowed.includes(profile.rollNumber);
}
