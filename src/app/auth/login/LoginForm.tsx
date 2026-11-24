'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  SlidersHorizontal,
  ServerOff,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Terminal,
  Gift,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import ManualCourseSyncModal from '@/components/auth/ManualCourseSyncModal';
import { MockStorageManager } from '@/lib/storage/mock-store';
import { SecurityAuditLog, UserProfile } from '@/types';
import { useApp } from '@/lib/context/AppContext';

interface CaptchaChallenge {
  image: string;
  challengeId: string;
}

async function sendErpRequest(body: Record<string, string | boolean>) {
  const response = await fetch('/api/auth/erp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'ERP sign-in is temporarily unavailable.');
  return data;
}

const fieldClass =
  'w-full rounded-2xl border border-white/[0.09] bg-white/[0.045] px-4 py-3.5 text-sm text-white placeholder:text-white/25 transition focus:border-violet-400/60 focus:bg-white/[0.06] focus:outline-none';

export default function LoginForm() {
  const { setCurrentUser, showToast } = useApp();
  const [loginMode, setLoginMode] = useState<'erp' | 'student'>('erp');
  const [studentIdentifier, setStudentIdentifier] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentError, setStudentError] = useState('');

  const [challenge, setChallenge] = useState<CaptchaChallenge | null>(null);
  const [busy, setBusy] = useState<'captcha' | 'login' | null>(null);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const captchaInput = useRef<HTMLInputElement>(null);

  // --- Referral Invite Tracking ---
  const [referralCode, setReferralCode] = useState('');
  const [referralStatus, setReferralStatus] = useState<{ valid: boolean; label?: string } | null>(null);

  // --- Larger High-Contrast CAPTCHA Display with Zoom ---
  const [captchaZoom, setCaptchaZoom] = useState<number>(1.25); // 125% default
  const [captchaFilter, setCaptchaFilter] = useState<'normal' | 'invert' | 'bw' | 'amber'>('normal');

  // --- Strict Rate Limiting & Cooldown ---
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [isLocked, setIsLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);

  // --- Manual Course Sync Fallback ---
  const [isManualSyncOpen, setIsManualSyncOpen] = useState(false);

  // --- Security Audit Logs ---
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAuditLogs(MockStorageManager.getSecurityAuditLogs());

      // Read referral query param (?ref=... or ?referral=...)
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref') || params.get('referral') || params.get('code');
      if (ref) {
        const clean = ref.trim().toUpperCase();
        setReferralCode(clean);
        const check = MockStorageManager.validateReferralCode(clean);
        setReferralStatus(check.valid ? { valid: true, label: check.label } : { valid: false });
      }
    }
  }, []);

  useEffect(() => {
    if (challenge) captchaInput.current?.focus();
  }, [challenge]);

  // Synchronize rate limit status when username changes
  useEffect(() => {
    const cleanId = username.trim() || 'default_erp_user';
    const status = MockStorageManager.checkRateLimit(cleanId);
    setIsLocked(status.isLocked);
    setRemainingAttempts(status.remainingAttempts);
    setLockCountdown(status.lockTimeRemaining);
  }, [username]);

  // Lockout countdown timer
  useEffect(() => {
    if (!isLocked || lockCountdown <= 0) return;
    const interval = setInterval(() => {
      setLockCountdown((prev) => {
        if (prev <= 1) {
          setIsLocked(false);
          setRemainingAttempts(5);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isLocked, lockCountdown]);

  // One-tap refresh without clearing credentials
  async function loadCaptcha() {
    setBusy('captcha');
    setError('');
    // PRESERVE username and password!
    setCaptcha('');
    try {
      const data = await sendErpRequest({ action: 'challenge' });
      if (!data.image || !data.challengeId) throw new Error('The CAPTCHA was unavailable.');
      setChallenge({ image: data.image, challengeId: data.challengeId });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not load the CAPTCHA.');
    } finally {
      setBusy(null);
    }
  }

  // Zoom handlers
  const handleZoomIn = () => {
    setCaptchaZoom((prev) => Math.min(2.0, parseFloat((prev + 0.25).toFixed(2))));
  };
  const handleZoomOut = () => {
    setCaptchaZoom((prev) => Math.max(1.0, parseFloat((prev - 0.25).toFixed(2))));
  };

  // Contrast filter style for the challenge image
  const getFilterStyle = () => {
    switch (captchaFilter) {
      case 'invert':
        return { filter: 'invert(1) hue-rotate(180deg) contrast(1.6)', backgroundColor: '#000000' };
      case 'bw':
        return { filter: 'grayscale(1) contrast(3)', backgroundColor: '#ffffff' };
      case 'amber':
        return { filter: 'sepia(1) hue-rotate(25deg) contrast(2)', backgroundColor: '#160E02' };
      case 'normal':
      default:
        return { filter: 'none', backgroundColor: '#ffffff' };
    }
  };

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challenge || busy) return;

    const cleanUsername = username.trim();
    if (isLocked) {
      setError(`Security Lockout Active: Please wait ${lockCountdown}s before retrying.`);
      return;
    }

    setBusy('login');
    setError('');

    try {
      const data = await sendErpRequest({
        action: 'login',
        username: cleanUsername,
        password,
        captcha: captcha.trim(),
        challengeId: challenge.challengeId,
        acceptedTerms,
      });

      // Synchronize client state with verified ERP profile immediately
      if (data?.profile) {
        const p = data.profile;
        const verifiedUser: UserProfile = {
          id: `erp-${p.rollNumber}`,
          username: p.rollNumber.toLowerCase(),
          full_name: p.name,
          email: `${p.rollNumber.toLowerCase()}@kluniversity.in`,
          department: p.department || 'CSE',
          semester: p.semester || 'Sem 4',
          academic_year: p.academicYear || '2026-2027',
          registered_courses: Array.isArray(p.courses) ? p.courses : [],
          role: 'student',
          student_id: p.rollNumber,
          is_verified_student: true,
          university_email: `${p.rollNumber.toLowerCase()}@kluniversity.in`,
          academic_position: 'Verified KL Student',
          code_name: p.rollNumber.toUpperCase(),
          created_at: new Date().toISOString(),
        };
        MockStorageManager.setCurrentUser(verifiedUser);
        setCurrentUser(verifiedUser);
        showToast(`Welcome back, ${p.name}!`, 'success');
      }

      // Record successful login audit log & reset rate limit
      MockStorageManager.recordLoginAttempt(cleanUsername, true);
      MockStorageManager.recordSecurityAuditLog({
        event: 'LOGIN_SUCCESS',
        masked_erp_id: `${cleanUsername.slice(0, 2)}****${cleanUsername.slice(-4)}`,
        ip_address: '127.0.0.1 (Vercel Client)',
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser Client',
        status: 'SUCCESS',
        details: `KL ERP verified successfully. Session established.`,
      });

      // Apply referral code if entered
      if (referralCode.trim()) {
        const cleanRef = referralCode.trim().toUpperCase();
        const refResult = MockStorageManager.applyReferralCode(cleanRef, cleanUsername, cleanUsername);
        if (refResult.success) {
          MockStorageManager.recordSecurityAuditLog({
            event: 'REFERRAL_CODE_APPLIED',
            masked_erp_id: `${cleanUsername.slice(0, 2)}****${cleanUsername.slice(-4)}`,
            ip_address: '127.0.0.1 (Vercel Client)',
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser Client',
            status: 'SUCCESS',
            details: `Applied referral code [${cleanRef}]: ${refResult.referral?.label || ''}`,
          });
        }
      }

      setPassword('');
      setCaptcha('');
      setChallenge(null);
      window.location.replace('/auth/erp/profile');
    } catch (failure) {
      // PRESERVE the password and username so student does not have to retype credentials!
      setCaptcha('');

      const rateStatus = MockStorageManager.recordLoginAttempt(cleanUsername, false);
      setRemainingAttempts(rateStatus.remainingAttempts);

      MockStorageManager.recordSecurityAuditLog({
        event: 'LOGIN_FAILED_CREDENTIALS',
        masked_erp_id: `${cleanUsername.slice(0, 2)}****${cleanUsername.slice(-4)}`,
        ip_address: '127.0.0.1 (Vercel Client)',
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser Client',
        status: 'FAILURE',
        details: failure instanceof Error ? failure.message : 'Invalid credentials or CAPTCHA.',
      });

      if (rateStatus.isLocked) {
        setIsLocked(true);
        setLockCountdown(rateStatus.lockTimeRemaining);
        setError(
          `Rate limit triggered: 5 consecutive failed attempts. Temporary cooldown active for ${rateStatus.lockTimeRemaining} seconds.`
        );
      } else {
        const msg = failure instanceof Error ? failure.message : 'Could not sign in to KL ERP.';
        setError(`${msg} (${rateStatus.remainingAttempts} attempts remaining before cooldown)`);
        // Automatically load fresh CAPTCHA for seamless one-tap retry
        await loadCaptcha();
      }
      setBusy(null);
    }
  }

  function handleStudentLogin(e: FormEvent) {
    e.preventDefault();
    setStudentError('');

    const clean = studentIdentifier.trim();
    if (!clean || !studentPassword) {
      setStudentError('Please enter your Student ID or Email and password.');
      return;
    }

    const regUsers = MockStorageManager.getRegisteredUsers();
    const found = regUsers.find(
      (u) =>
        (u.university_email && u.university_email.toLowerCase() === clean.toLowerCase()) ||
        (u.email && u.email.toLowerCase() === clean.toLowerCase()) ||
        u.username.toLowerCase() === clean.toLowerCase() ||
        (u.student_id && u.student_id.toLowerCase() === clean.toLowerCase())
    );

    let loggedInUser: UserProfile;

    if (found) {
      loggedInUser = found;
    } else {
      const isEmail = clean.includes('@');
      const rollNumber = isEmail ? clean.split('@')[0] : clean;
      loggedInUser = {
        id: `usr-${Date.now()}`,
        username: rollNumber.toLowerCase(),
        full_name: rollNumber.toUpperCase(),
        code_name: rollNumber.toUpperCase(),
        email: isEmail ? clean.toLowerCase() : `${rollNumber.toLowerCase()}@kluniversity.in`,
        university_email: isEmail ? clean.toLowerCase() : `${rollNumber.toLowerCase()}@kluniversity.in`,
        department: 'CSE',
        semester: 'Sem 4',
        role: 'student',
        student_id: rollNumber,
        is_verified_student: true,
        created_at: new Date().toISOString(),
      };
      MockStorageManager.saveRegisteredUser(loggedInUser);
    }

    if (referralCode.trim()) {
      const cleanRef = referralCode.trim().toUpperCase();
      MockStorageManager.applyReferralCode(cleanRef, loggedInUser.email, loggedInUser.username);
    }

    MockStorageManager.setCurrentUser(loggedInUser);
    setCurrentUser(loggedInUser);
    MockStorageManager.recordSecurityAuditLog({
      event: 'LOGIN_SUCCESS',
      masked_erp_id: loggedInUser.username,
      ip_address: '127.0.0.1 (Vercel Client)',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser Client',
      status: 'SUCCESS',
      details: `Direct student sign-in successful: ${loggedInUser.username}`,
    });

    showToast(`Welcome to VSS, ${loggedInUser.full_name}!`, 'success');
    window.location.replace('/dashboard');
  }

  

  return (
    <div className="mx-auto grid min-h-[calc(100vh-68px)] max-w-6xl items-stretch lg:grid-cols-[.9fr_1.1fr]">
      <section className="relative hidden overflow-hidden border-r border-white/[0.07] p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,.22),transparent_36%),radial-gradient(circle_at_90%_85%,rgba(59,130,246,.12),transparent_35%)]" />
        <Link
          href="/"
          className="relative inline-flex items-center gap-2 text-xs font-bold text-white/45 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to VSS
        </Link>
        <div className="relative max-w-md">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-400 text-black">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <h1 className="mt-8 text-5xl font-extrabold leading-[1.02] tracking-[-0.055em]">
            Everything you need.
            <br />
            <span className="text-violet-300">Only when you need it.</span>
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-6 text-white/42">
            Verify your student access, then get back to notes, labs, and projects without the clutter.
          </p>
        </div>
        <p className="relative flex items-center gap-2 text-[10px] font-semibold text-white/30">
          <ShieldCheck className="h-3.5 w-3.5" /> Your ERP password is not stored by VSS.
        </p>
      </section>

      <main className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-16">
        <div className="w-full max-w-md space-y-5">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-white/45 lg:hidden"
            >
              <ArrowLeft className="h-4 w-4" /> VSS home
            </Link>

            {/* Manual Course Syncing fallback pill */}
            <button
              type="button"
              onClick={() => setIsManualSyncOpen(true)}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold transition"
            >
              <ServerOff className="h-3 w-3" />
              <span>Manual Course Sync</span>
            </button>
          </div>

          <div>
            <p className="vss-kicker">Student access</p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-[-0.04em]">Sign in to VSS</h2>
            <p className="mt-1 text-xs leading-5 text-white/38">
              Use your KL ERP details to verify your student profile.
            </p>
          </div>

          {/* Rate Limit Active Notice */}
          {isLocked && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">Security Lockout Active:</span>
                <p className="text-[11px] text-rose-300/80">
                  Rate limit reached. Credential submissions paused for {lockCountdown} seconds.
                </p>
              </div>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 rounded-2xl bg-white/[0.04] p-1 border border-white/[0.08] text-xs font-bold">
            <button
              type="button"
              onClick={() => { setLoginMode('erp'); setError(''); }}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 transition ${
                loginMode === 'erp'
                  ? 'bg-violet-400 text-black shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <LockKeyhole className="h-3.5 w-3.5" />
              <span>KL ERP Portal</span>
            </button>
            <button
              type="button"
              onClick={() => { setLoginMode('student'); setStudentError(''); }}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 transition ${
                loginMode === 'student'
                  ? 'bg-violet-400 text-black shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Student ID / Email</span>
            </button>
          </div>

          {loginMode === 'student' ? (
            <form onSubmit={handleStudentLogin} className="space-y-4">
              {studentError && (
                <p
                  role="alert"
                  className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3.5 text-xs leading-5 text-rose-200"
                >
                  {studentError}
                </p>
              )}

              <label className="block">
                <span className="mb-2 block text-[11px] font-bold text-white/55">Student Email or University ID</span>
                <input
                  className={fieldClass}
                  autoComplete="username"
                  required
                  value={studentIdentifier}
                  onChange={(e) => setStudentIdentifier(e.target.value)}
                  placeholder="scholar@kluniversity.in or 2300030001"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-bold text-white/55">Password</span>
                <input
                  className={fieldClass}
                  type="password"
                  autoComplete="current-password"
                  required
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  placeholder="Enter your account password"
                />
              </label>

              {/* Referral / Invite Code Input (Optional) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white/55 flex items-center gap-1.5">
                    <Gift className="h-3.5 w-3.5 text-purple-400" />
                    <span>Referral / Invite Code (Optional)</span>
                  </span>
                  {referralStatus?.valid && (
                    <span className="text-[10px] font-mono text-emerald-300 font-bold">
                      ✓ Valid: {referralStatus.label}
                    </span>
                  )}
                </div>
                <input
                  className={`${fieldClass} font-mono`}
                  type="text"
                  maxLength={32}
                  value={referralCode}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
                    setReferralCode(val);
                    if (val.length > 2) {
                      const check = MockStorageManager.validateReferralCode(val);
                      setReferralStatus(check.valid ? { valid: true, label: check.label } : { valid: false });
                    } else {
                      setReferralStatus(null);
                    }
                  }}
                  placeholder=""
                />
              </div>

              <button
                type="submit"
                className="vss-button min-h-12 w-full cursor-pointer"
              >
                Sign In with Student Account <ArrowRight className="h-4 w-4" />
              </button>

              
            </form>
          ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            {error && !isLocked && (
              <p
                role="alert"
                className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3.5 text-xs leading-5 text-rose-200"
              >
                {error}
              </p>
            )}

            <label className="block">
              <span className="mb-2 block text-[11px] font-bold text-white/55">ERP username</span>
              <input
                className={fieldClass}
                autoComplete="username"
                required
                maxLength={64}
                value={username}
                disabled={isLocked}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Student ID (e.g. 2300030042)"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-[11px] font-bold text-white/55">ERP password</span>
              <span className="relative block">
                <input
                  className={`${fieldClass} pr-12`}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  maxLength={256}
                  value={password}
                  disabled={isLocked}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            {/* Referral / Invite Code Input (Optional) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-white/55 flex items-center gap-1.5">
                  <Gift className="h-3.5 w-3.5 text-purple-400" />
                  <span>Referral / Invite Code (Optional)</span>
                </span>
                {referralStatus?.valid && (
                  <span className="text-[10px] font-mono text-emerald-300 font-bold">
                    ✓ Valid: {referralStatus.label}
                  </span>
                )}
                {referralStatus && !referralStatus.valid && referralCode.length > 2 && (
                  <span className="text-[10px] font-mono text-rose-300">
                    ✕ Code not recognized
                  </span>
                )}
              </div>
              <input
                className={`${fieldClass} font-mono`}
                type="text"
                maxLength={32}
                value={referralCode}
                disabled={isLocked}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
                  setReferralCode(val);
                  if (val.length > 2) {
                    const check = MockStorageManager.validateReferralCode(val);
                    setReferralStatus(check.valid ? { valid: true, label: check.label } : { valid: false });
                  } else {
                    setReferralStatus(null);
                  }
                }}
                placeholder=""
              />
            </div>

            {/* --- LARGER, HIGH-CONTRAST CAPTCHA DISPLAY WITH ZOOM --- */}
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-3.5 space-y-3">
              {challenge ? (
                <div className="space-y-3">
                  {/* Zoom & High-Contrast Controls Header */}
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-white/[0.06]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-white/50 uppercase">Contrast:</span>
                      <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10 text-[9px] font-mono">
                        <button
                          type="button"
                          onClick={() => setCaptchaFilter('normal')}
                          className={`px-1.5 py-0.5 rounded ${
                            captchaFilter === 'normal' ? 'bg-white text-black font-bold' : 'text-white/60'
                          }`}
                        >
                          Default
                        </button>
                        <button
                          type="button"
                          onClick={() => setCaptchaFilter('invert')}
                          className={`px-1.5 py-0.5 rounded ${
                            captchaFilter === 'invert' ? 'bg-violet-400 text-black font-bold' : 'text-white/60'
                          }`}
                        >
                          Invert
                        </button>
                        <button
                          type="button"
                          onClick={() => setCaptchaFilter('bw')}
                          className={`px-1.5 py-0.5 rounded ${
                            captchaFilter === 'bw' ? 'bg-white text-black font-bold' : 'text-white/60'
                          }`}
                        >
                          B&W
                        </button>
                        <button
                          type="button"
                          onClick={() => setCaptchaFilter('amber')}
                          className={`px-1.5 py-0.5 rounded ${
                            captchaFilter === 'amber' ? 'bg-amber-400 text-black font-bold' : 'text-white/60'
                          }`}
                        >
                          Amber
                        </button>
                      </div>
                    </div>

                    {/* Zoom In / Zoom Out */}
                    <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5 border border-white/10 text-[10px]">
                      <button
                        type="button"
                        onClick={handleZoomOut}
                        disabled={captchaZoom <= 1.0}
                        className="p-1 hover:text-white text-white/60 disabled:opacity-30"
                        title="Zoom Out CAPTCHA"
                      >
                        <ZoomOut className="h-3 w-3" />
                      </button>
                      <span className="font-mono text-[9px] px-0.5 text-violet-300">
                        {Math.round(captchaZoom * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={handleZoomIn}
                        disabled={captchaZoom >= 2.0}
                        className="p-1 hover:text-white text-white/60 disabled:opacity-30"
                        title="Zoom In CAPTCHA (Magnify Display)"
                      >
                        <ZoomIn className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Magnified Image Container */}
                  <div className="overflow-hidden rounded-2xl border border-white/10 p-2 flex items-center justify-center min-h-[110px] bg-black/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={challenge.image}
                      alt="ERP CAPTCHA challenge"
                      style={{
                        ...getFilterStyle(),
                        transform: `scale(${captchaZoom})`,
                        transformOrigin: 'center',
                      }}
                      className="h-auto w-full rounded-xl object-contain transition-all duration-150"
                      width={360}
                      height={150}
                    />
                  </div>

                  {/* Accessible Character Input */}
                  <div className="space-y-1">
                    <input
                      ref={captchaInput}
                      className={`${fieldClass} text-center font-mono font-bold tracking-[0.2em] text-sm`}
                      autoComplete="off"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      required
                      disabled={isLocked}
                      maxLength={32}
                      value={captcha}
                      onChange={(event) => setCaptcha(event.target.value)}
                      placeholder="Enter exact characters shown"
                    />
                    <div className="flex items-center justify-between px-1 text-[10px] font-mono text-white/40">
                      <span>Exact case verification</span>
                      <span>
                        Attempts: <strong className="text-amber-300">{remainingAttempts} / 5</strong>
                      </span>
                    </div>
                  </div>

                  {/* One-Tap Refresh without clearing credentials */}
                  <button
                    type="button"
                    onClick={loadCaptcha}
                    disabled={!!busy || isLocked}
                    className="inline-flex items-center gap-2 px-1 text-[11px] font-bold text-violet-300 hover:text-white transition disabled:opacity-40"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${busy === 'captcha' ? 'animate-spin' : ''}`} />
                    <span>Use another verification image (preserves credentials)</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={loadCaptcha}
                  disabled={!!busy || isLocked}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-xs font-bold text-white/65 hover:bg-white/[0.07] disabled:opacity-40"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${busy === 'captcha' ? 'animate-spin' : ''}`} />
                  {busy === 'captcha' ? 'Loading verification image…' : 'Load verification image'}
                </button>
              )}
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5 text-[10px] leading-4 text-white/42">
              <input
                type="checkbox"
                required
                disabled={isLocked}
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-violet-400"
              />
              <span>
                I agree to the VSS terms and consent to live verification with KL ERP. VSS stores my verified
                student profile and login-consent record, but never my ERP password, CAPTCHA answer, or ERP cookies.
              </span>
            </label>

            <button
              type="submit"
              disabled={!challenge || !captcha.trim() || !acceptedTerms || !!busy || isLocked}
              className="vss-button min-h-12 w-full disabled:cursor-not-allowed disabled:opacity-35 cursor-pointer"
            >
              {busy === 'login' ? (
                'Verifying…'
              ) : isLocked ? (
                `Locked (${lockCountdown}s)`
              ) : (
                <>
                  Continue <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
          )}

          {/* Security & Access Audit Log Tray */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setIsAuditLogsOpen(!isAuditLogsOpen)}
              className="w-full p-3 flex items-center justify-between text-white/70 hover:text-white transition"
            >
              <div className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-violet-400" />
                <span className="font-mono text-[10px]">
                  🛡️ Access & Rate Limit Audit Log ({auditLogs.length})
                </span>
              </div>
              {isAuditLogsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {isAuditLogsOpen && (
              <div className="p-3 space-y-2 bg-black/40 border-t border-white/[0.06] font-mono text-[10px]">
                {auditLogs.length === 0 ? (
                  <p className="text-white/30 italic">No access events recorded yet.</p>
                ) : (
                  auditLogs.slice(0, 5).map((log) => (
                    <div
                      key={log.id}
                      className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-bold ${
                            log.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {log.event}
                        </span>
                        <span className="text-white/30">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-white/70 truncate">{log.details}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Quick Nav Links */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-xs text-white/50 border-t border-white/5">
            <Link
              href="/auth/register"
              className="text-purple-400 hover:text-purple-300 hover:underline"
            >
              Don&apos;t have ERP credentials? Register ➔
            </Link>
            <Link
              href="/admin"
              className="text-white/40 hover:text-white/70 hover:underline font-mono text-[11px]"
            >
              Admin Portal
            </Link>
          </div>

          <p className="mt-4 text-center text-[10px] text-white/28">
            Independent student community · Not an official ERP portal
          </p>
        </div>
      </main>

      {/* Manual Course Sync Fallback Modal */}
      <ManualCourseSyncModal
        isOpen={isManualSyncOpen}
        onClose={() => setIsManualSyncOpen(false)}
        erpId={username || '2300030042'}
      />
    </div>
  );
}
