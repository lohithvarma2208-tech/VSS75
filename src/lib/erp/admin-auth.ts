import type { ErpProfile } from './client';

export const OFFICIAL_ADMIN_REGISTRATION_NUMBERS: string[] = ['2600032154', '2600031735'];

export function isAdminProfile(profile: ErpProfile | null | undefined): boolean {
  if (!profile?.rollNumber) return false;
  const cleanRoll = profile.rollNumber.trim();
  const envAllowed = (process.env.ADMIN_REGISTRATION_NUMBERS || '')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => /^\d{6,20}$/.test(value));

  const allowed = envAllowed.length > 0 ? envAllowed : OFFICIAL_ADMIN_REGISTRATION_NUMBERS;
  return allowed.includes(cleanRoll);
}
