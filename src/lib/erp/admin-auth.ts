import type { ErpProfile } from './client';

export const OFFICIAL_ADMIN_REGISTRATION_NUMBERS: string[] = ['2600032154', '2600031735'];
export const VALID_ADMIN_PASSKEYS: string[] = ['VSS75@ADMIN', 'DEEPTHANUSH@ADMIN', 'ADMIN-CORE-75'];

export function isValidAdminPasskey(passkey: string | undefined | null): boolean {
  if (!passkey) return false;
  const clean = passkey.trim();
  const envAllowed = (process.env.ADMIN_REGISTRATION_NUMBERS || '')
    .split(',')
    .map((v) => v.trim())
    .filter((v) => /^\d{6,20}$/.test(v));
  const allowed = envAllowed.length > 0 ? envAllowed : OFFICIAL_ADMIN_REGISTRATION_NUMBERS;
  return VALID_ADMIN_PASSKEYS.includes(clean) || allowed.includes(clean);
}

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
