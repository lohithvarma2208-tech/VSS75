'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Mail,
  User,
  Lock,
  Sparkles,
  ArrowRight,
  Shuffle,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Gift,
} from 'lucide-react';
import { useApp } from '@/lib/context/AppContext';
import { generateUserCodeName } from '@/lib/data/academic-heads';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';
import { MockStorageManager } from '@/lib/storage/mock-store';



export default function RegisterPage() {
  const router = useRouter();
  const { setCurrentUser, showToast } = useApp();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [semester, setSemester] = useState('Sem 4');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [referralStatus, setReferralStatus] = useState<{ valid: boolean; label?: string } | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
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

  const allowedDomain = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || 'kluniversity.in';

  // Live operational code name derived from username
  const liveCodeName = generateUserCodeName(username || 'anonymous');

  const handleRandomizeHandle = () => {
    const prefixes = ['student', 'scholar', 'peer', 'learner', 'cadet', 'coder'];
    const num = Math.floor(1000 + Math.random() * 9000);
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    setUsername(`${prefix}_${num}`);
    setError('');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const isKluDomain = cleanEmail.endsWith('@kluniversity.in') || cleanEmail.endsWith('@klu.ac.in');
    if (!isKluDomain) {
      setError(`Please use your official university email ending in @kluniversity.in or @klu.ac.in`);
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      const codeName = generateUserCodeName(cleanUsername);

      const newUser = {
        id: `usr-${Date.now()}`,
        username: cleanUsername,
        full_name: codeName,
        code_name: codeName,
        email: cleanEmail,
        department,
        semester,
        role: 'student' as const,
        is_verified_student: true,
        university_email: cleanEmail,
        verified_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      setCurrentUser(newUser);
      MockStorageManager.saveRegisteredUser(newUser);

      // Apply referral code if provided
      if (referralCode.trim()) {
        const cleanRef = referralCode.trim().toUpperCase();
        const refResult = MockStorageManager.applyReferralCode(cleanRef, cleanEmail, cleanUsername);
        if (refResult.success) {
          MockStorageManager.recordSecurityAuditLog({
            event: 'REFERRAL_CODE_APPLIED',
            masked_erp_id: cleanEmail,
            ip_address: '127.0.0.1 (Vercel Client)',
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser Client',
            status: 'SUCCESS',
            details: `Scholar registration applied referral code [${cleanRef}]: ${refResult.referral?.label || ''}`,
          });
        }
      }

      MockStorageManager.recordSecurityAuditLog({
        event: 'LOGIN_SUCCESS',
        masked_erp_id: cleanEmail,
        ip_address: '127.0.0.1 (Vercel Client)',
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser Client',
        status: 'SUCCESS',
        details: `Scholar registered and session created for @${cleanUsername}.`,
      });

      // Flag to display the Benefits Announcement modal strictly AFTER landing on dashboard
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('vss_show_benefits_ad', 'true');
      }

      setIsLoading(false);
      showToast('🎉 Account initialized! Welcome to Virtual Student Space.', 'success');
      router.push('/dashboard');
    }, 450);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Ambient atmospheric glows */}
      <div className="absolute top-1/4 -left-20 w-[450px] h-[450px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-lg space-y-6 relative z-10">
        {/* Brand Monogram & Title */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group select-none">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white flex items-center justify-center font-black text-xl shadow-[0_0_25px_rgba(139,92,246,0.4)] group-hover:scale-105 transition-transform">
              VSS
            </div>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-[#D8B4FE] text-[10px] font-mono font-bold tracking-wider">
            <Sparkles className="h-3 w-3 text-[#38BDF8]" />
            <span>ANONYMOUS SCHOLAR ENROLLMENT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Initialize Scholar Account
          </h1>
          <p className="text-xs text-white/60 font-medium max-w-md mx-auto">
            Join the KL University Virtual Student Space (VSS) Academic Knowledge Network
          </p>
        </div>

        {/* 100% Privacy & Security Guarantee Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#131B2E] to-cyan-950/40 border border-purple-500/30 text-white text-xs flex items-start gap-3 backdrop-blur-md shadow-lg">
          <ShieldCheck className="h-5 w-5 text-[#38BDF8] shrink-0 mt-0.5" />
          <div className="leading-relaxed text-[11px] space-y-1">
            <div className="flex items-center gap-2">
              <strong className="text-white font-bold">100% Student Anonymity Shield:</strong>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-[#38BDF8] border border-cyan-500/30">
                Zero Identity Exposure
              </span>
            </div>
            <p className="text-white/70">
              Your real name and university roll number are never revealed to peers. You share notes, submit assignments, and compete on leaderboards strictly under your unique handle and operational code name.
            </p>
          </div>
        </div>

        {/* Main Glassmorphic Card */}
        <div className="rounded-[2.5rem] border border-white/10 bg-[#131B2E]/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6 text-white">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Unique Anonymous Handle Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-white/90">
                  Unique Anonymous Handle
                </label>
                <button
                  type="button"
                  onClick={handleRandomizeHandle}
                  className="text-[11px] font-mono text-[#D8B4FE] hover:text-[#38BDF8] font-bold flex items-center gap-1 transition"
                  title="Randomize handle"
                >
                  <Shuffle className="h-3 w-3" />
                  <span>Randomize Handle</span>
                </button>
              </div>

              <div className="relative">
                <div className="absolute left-3.5 top-3 text-[#38BDF8] font-bold text-xs select-none">
                  @
                </div>
                <input
                  type="text"
                  placeholder="e.g. 2300030001 or student_handle"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-11 rounded-2xl border border-white/15 bg-[#0B0F19] pl-9 pr-24 text-xs sm:text-sm text-white placeholder-white/40 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 font-mono transition"
                  required
                />
                <div className="absolute right-3 top-2.5">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-purple-500/20 text-[#D8B4FE] border border-purple-500/30">
                    [{liveCodeName}]
                  </span>
                </div>
              </div>

              
            </div>

            {/* University Email */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-white/90">
                  Campus Institutional Email
                </label>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  ✓ Verified Domain: @{allowedDomain}
                </span>
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-white/40" />
                <input
                  type="email"
                  placeholder={`scholar@${allowedDomain}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 rounded-2xl border border-white/15 bg-[#0B0F19] pl-10 pr-3 text-xs sm:text-sm text-white placeholder-white/40 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 font-mono transition"
                  required
                />
              </div>
              <p className="text-[10px] text-white/40">
                Used solely for institutional authentication. Your email is kept strictly confidential.
              </p>
            </div>

            {/* Department & Semester Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white/90">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full h-11 rounded-2xl border border-white/15 bg-[#0B0F19] px-3.5 text-xs text-white font-medium focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition"
                >
                  <option value="CSE" className="bg-[#0B0F19] text-white">CSE • Computer Science</option>
                  <option value="AI&DS" className="bg-[#0B0F19] text-white">AI&DS • Artificial Intel</option>
                  <option value="ECE" className="bg-[#0B0F19] text-white">ECE • Electronics</option>
                  <option value="CS&IT" className="bg-[#0B0F19] text-white">CS&IT • Info Tech</option>
                  <option value="ME" className="bg-[#0B0F19] text-white">ME • Mechanical</option>
                  <option value="BT" className="bg-[#0B0F19] text-white">BT • Biotechnology</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white/90">
                  Semester / Term
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full h-11 rounded-2xl border border-white/15 bg-[#0B0F19] px-3.5 text-xs text-white font-medium focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition"
                >
                  <optgroup label="Bi-Sem Track">
                    {['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'].map((s) => (
                      <option key={s} value={s} className="bg-[#0B0F19] text-white">
                        {s}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Tri-Sem PBL Track">
                    {['Tri-Sem 1 (T1)', 'Tri-Sem 2 (T2)', 'Tri-Sem 3 (T3)', 'Tri-Sem 4 (T4)'].map((s) => (
                      <option key={s} value={s} className="bg-[#0B0F19] text-white">
                        {s}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Referral / Invite Code Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-white/90 flex items-center gap-1.5">
                  <Gift className="h-3.5 w-3.5 text-purple-400" />
                  <span>Referral / Invite Code (Optional)</span>
                </label>
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
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. KLU-ELITE-2026 or DEEPTHANUSH-VIP"
                  value={referralCode}
                  onChange={(e) => {
                    const clean = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
                    setReferralCode(clean);
                    if (clean.length > 2) {
                      const check = MockStorageManager.validateReferralCode(clean);
                      setReferralStatus(check.valid ? { valid: true, label: check.label } : { valid: false });
                    } else {
                      setReferralStatus(null);
                    }
                  }}
                  className="w-full h-11 rounded-2xl border border-white/15 bg-[#0B0F19] px-3.5 text-xs sm:text-sm text-white placeholder-white/40 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 font-mono transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white/90">
                Independent Platform Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-white/40" />
                <input
                  type="password"
                  placeholder="Create strong independent password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 rounded-2xl border border-white/15 bg-[#0B0F19] pl-10 pr-3 text-xs sm:text-sm text-white placeholder-white/40 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 font-mono transition"
                  required
                />
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-amber-300/80 pt-0.5">
                <Sparkles className="h-3 w-3 text-amber-400 shrink-0" />
                <span>Do NOT enter your ERP password. Keep this password unique to VSS.</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <span>Initializing Scholar Identity...</span>
              ) : (
                <>
                  <span>Create Anonymous Scholar Account</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Login / Admin */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs text-white/60">
            <div>
              Already have a scholar persona?{' '}
              <Link
                href="/auth/login"
                className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#D8B4FE] to-[#38BDF8] hover:underline ml-1"
              >
                Sign In to VSS ➔
              </Link>
            </div>
            <Link
              href="/admin"
              className="font-mono text-[11px] text-white/40 hover:text-white/70 hover:underline"
            >
              Admin Access
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
