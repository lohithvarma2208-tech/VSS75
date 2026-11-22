'use client';

import { useState } from 'react';

export default function SignOutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function signOut() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/auth/erp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      if (!response.ok) throw new Error('Sign-out failed');
      window.location.replace('/auth/login');
    } catch {
      setError('Could not sign out. Please try again.');
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={signOut} disabled={busy} className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10 disabled:opacity-50">
        {busy ? 'Signing out…' : 'Sign out of ERP profile'}
      </button>
      {error && <p role="alert" className="text-sm text-rose-200">{error}</p>}
    </div>
  );
}
