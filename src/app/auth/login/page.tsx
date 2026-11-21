'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  GraduationCap,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '@/lib/context/AppContext';
import { MockStorageManager } from '@/lib/storage/mock-store';
import { DEMO_USERS } from '@/lib/data/sample-data';
import { generateUserCodeName } from '@/lib/data/academic-heads';
import BackgroundVideo from '@/components/common/BackgroundVideo';

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser, showToast } = useApp();

  const [erpId, setErpId] = useState('2300030042');
  const [erpPassword, setErpPassword] = useState('KLU@ERP2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleErpLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanId = erpId.trim();
    if (!cleanId) {
      setErrorMessage('Please enter your KL ERP ID (University Roll Number).');
      return;
    }
    if (!erpPassword) {
      setErrorMessage('Please enter your ERP Password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Find matching demo user or auto-provision student profile
      let matched = DEMO_USERS.find(
        (u) =>
          u.username === cleanId.toLowerCase() ||
          u.email.startsWith(cleanId) ||
          (cleanId === '2300030042' && u.username === 'shadow_scholar_01') ||
          (cleanId === '2400030018' && u.username === 'neural_viper_x') ||
          (cleanId === '2200030099' && u.username === 'provost_zero')
      );

      if (!matched) {
        // Dynamic provision based on ERP ID with guaranteed student anonymity
        const generatedHandle = `scholar_${cleanId.slice(-4)}`;
        const codeName = generateUserCodeName(generatedHandle);

        matched = {
          id: `usr-erp-${cleanId}`,
          username: generatedHandle,
          full_name: codeName,
          code_name: codeName,
          email: `${cleanId}@kluniversity.in`,
          department: cleanId.startsWith('24') ? 'AI&DS' : cleanId.startsWith('22') ? 'ECE' : 'CSE',
          semester: cleanId.startsWith('26') ? 'Tri-Sem 1 (T1)' : cleanId.startsWith('25') ? 'Sem 3' : 'Sem 4',
          role: 'student',
          is_verified_student: true,
          university_email: `${cleanId}@kluniversity.in`,
          verified_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };
      }

      MockStorageManager.setCurrentUser(matched);
      setCurrentUser(matched);

      // Flag to display the Active Scholar Privileges Announcement (Ad) strictly AFTER landing on dashboard
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('vss_show_benefits_ad', 'true');
      }

      setIsLoading(false);
      showToast(`Authenticated via KL ERP! Signed in as @${matched.username}`, 'success');
      router.push('/dashboard');
    }, 450);
  };

  const handleQuickFill = (id: string, pass: string) => {
    setErpId(id);
    setErpPassword(pass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background "The Vault of Knowledge" - Cinematic Master Loop */}
      <BackgroundVideo src="/videos/vault-of-knowledge.mp4" opacity={0.85} overlayStyle="obsidian" />

      {/* Ambient atmospheric glows */}
      <div className="absolute top-1/4 -left-20 w-[450px] h-[450px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Monogram & Heading */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group select-none">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white flex items-center justify-center font-black text-xl shadow-[0_0_25px_rgba(139,92,246,0.4)] group-hover:scale-105 transition-transform">
              VSS
            </div>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-[#D8B4FE] text-[10px] font-mono font-bold tracking-wider">
            <Sparkles className="h-3 w-3 text-[#38BDF8]" />
            <span>KL UNIVERSITY ERP PORTAL AUTHENTICATION</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            KL ERP Credential Sign In
          </h1>
          <p className="text-xs text-white/60 font-medium">
            Virtual Student Space (VSS) Academic Knowledge Network
          </p>
        </div>

        {/* Student Privacy & Anonymity Shield Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#131B2E] to-cyan-950/40 border border-purple-500/30 text-white text-xs flex items-start gap-3 backdrop-blur-md shadow-lg">
          <ShieldCheck className="h-5 w-5 text-[#38BDF8] shrink-0 mt-0.5" />
          <div className="leading-relaxed text-[11px] space-y-0.5">
            <div className="flex items-center gap-2">
              <strong className="text-white font-bold">100% Student Privacy Shield:</strong>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-[#38BDF8] border border-cyan-500/30">
                ERP ID Masked
              </span>
            </div>
            <p className="text-white/70">
              You log in using your official KL ERP ID, but your real roll number and name are masked on the platform. All your public activity is protected under your anonymous code name.
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="rounded-[2.5rem] border border-white/10 bg-[#131B2E]/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-5 text-white">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleErpLogin} className="space-y-4">
            {/* KL ERP ID Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-white/90">
                  KL ERP ID / Student ID
                </label>
                <span className="text-[10px] font-mono text-[#38BDF8]">
                  e.g. 2300030042
                </span>
              </div>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  value={erpId}
                  onChange={(e) => {
                    setErpId(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="Enter your 10-digit KL ERP ID"
                  className="w-full h-11 rounded-2xl border border-white/15 bg-[#0B0F19] pl-10 pr-3 text-xs sm:text-sm text-white placeholder-white/40 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 font-mono transition"
                  required
                />
              </div>
            </div>

            {/* ERP Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-white/90">
                  ERP Password
                </label>
                <span className="text-[10px] font-mono text-purple-300">
                  Institutional Password
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={erpPassword}
                  onChange={(e) => {
                    setErpPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="Enter your KL ERP password"
                  className="w-full h-11 rounded-2xl border border-white/15 bg-[#0B0F19] pl-10 pr-10 text-xs sm:text-sm text-white placeholder-white/40 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 font-mono transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-white/40 hover:text-white transition"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Quick Demo Fill Buttons */}
            <div className="pt-1 space-y-1.5">
              <span className="text-[10px] font-mono text-white/40 block">
                Quick Test Credentials (KL ERP Demo IDs):
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('2300030042', 'KLU@ERP2026!')}
                  className={`p-2 rounded-xl border text-center transition ${
                    erpId === '2300030042'
                      ? 'bg-purple-500/25 border-purple-400 text-white font-bold'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <span className="block text-[11px] font-mono font-bold">2300030042</span>
                  <span className="block text-[9px] text-[#38BDF8]">Y23 CSE</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('2400030018', 'KLU@ERP2026!')}
                  className={`p-2 rounded-xl border text-center transition ${
                    erpId === '2400030018'
                      ? 'bg-purple-500/25 border-purple-400 text-white font-bold'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <span className="block text-[11px] font-mono font-bold">2400030018</span>
                  <span className="block text-[9px] text-[#38BDF8]">Y24 AI&DS</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('2200030099', 'Admin@ERP2026!')}
                  className={`p-2 rounded-xl border text-center transition ${
                    erpId === '2200030099'
                      ? 'bg-purple-500/25 border-purple-400 text-white font-bold'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <span className="block text-[11px] font-mono font-bold">2200030099</span>
                  <span className="block text-[9px] text-[#38BDF8]">Y22 Admin</span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 group mt-2"
            >
              {isLoading ? (
                <span>Verifying KL ERP Credentials...</span>
              ) : (
                <>
                  <span>Sign In with KL ERP</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Register */}
          <div className="text-center pt-2 border-t border-white/10 text-xs text-white/60">
            First time on Virtual Student Space?{' '}
            <Link
              href="/auth/register"
              className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#D8B4FE] to-[#38BDF8] hover:underline ml-1"
            >
              Register Anonymous Profile ➔
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
