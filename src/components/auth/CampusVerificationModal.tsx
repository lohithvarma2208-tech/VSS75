'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  X,
  Mail,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  AlertCircle,
  School,
  Lock,
} from 'lucide-react';
import { useApp } from '@/lib/context/AppContext';
import { MockStorageManager } from '@/lib/storage/mock-store';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';

export function CampusVerificationModal() {
  const { currentUser, isVerifyModalOpen, closeVerifyModal, showToast } = useApp();

  const [step, setStep] = useState<'input' | 'otp' | 'success'>('input');
  const [email, setEmail] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes

  // Auto-fill existing or preset email when opened
  useEffect(() => {
    if (isVerifyModalOpen) {
      if (currentUser?.university_email) {
        setEmail(currentUser.university_email);
      } else if (currentUser?.email && currentUser.email.includes('@kluniversity.in')) {
        setEmail(currentUser.email);
      } else {
        setEmail('scholar@kluniversity.in');
      }
      setErrorMessage(null);
      setOtpInput('');
      if (currentUser?.is_verified_student) {
        setStep('success');
      } else {
        setStep('input');
      }
    }
  }, [isVerifyModalOpen, currentUser]);

  // Countdown timer when on OTP step
  useEffect(() => {
    if (step !== 'otp' || countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, countdown]);

  if (!isVerifyModalOpen) return null;

  const handleSendOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const res = MockStorageManager.sendVerificationOtp(email);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.message);
      return;
    }

    setGeneratedOtp(res.otp || null);
    setCountdown(300);
    setStep('otp');
    showToast(`Verification code sent to ${email}`, 'success');
  };

  const handleVerifyOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const res = MockStorageManager.verifyInstitutionalOtp(email, otpInput);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.message);
      return;
    }

    setStep('success');
    showToast('Student identity verified successfully!', 'success');
  };

  const handleUnverify = () => {
    MockStorageManager.unverifyCurrentUser();
    setStep('input');
    setOtpInput('');
    setGeneratedOtp(null);
    showToast('Verified badge reset for demo testing', 'info');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-[#0D1527] border border-purple-500/40 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] p-6 sm:p-8 overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-purple-500/20 to-transparent blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeVerifyModal}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="h-12 w-12 rounded-2xl bg-purple-500/15 border border-purple-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.25)]">
            <ShieldCheck className="h-6 w-6 text-[#38BDF8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-tight">
                Campus Student Verification
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-[#D8B4FE]">
                KLEF Trust
              </span>
            </div>
            <p className="text-xs text-white/60">
              Confirm your official institutional identity with institutional email OTP
            </p>
          </div>
        </div>

        {/* STEP 1: Enter University Email */}
        {step === 'input' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/80 space-y-2">
              <div className="flex items-center gap-2 text-[#D8B4FE] font-bold">
                <School className="h-4 w-4 shrink-0 text-[#38BDF8]" />
                <span>Eligibility Requirements:</span>
              </div>
              <p className="text-[11px] text-white/70 leading-relaxed">
                Enter your official KL University student email ID ending with{' '}
                <strong className="text-white font-mono">@kluniversity.in</strong> or{' '}
                <strong className="text-white font-mono">@klu.ac.in</strong>. A 6-digit One-Time
                Passcode (OTP) will be generated.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-white/50 font-mono">Quick Demo Fill:</span>
                <button
                  type="button"
                  onClick={() => setEmail('scholar@kluniversity.in')}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-sky-500/15 text-[#38BDF8] hover:bg-sky-500/25 transition-colors border border-sky-500/30"
                >
                  scholar@kluniversity.in
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white/90">
                Official KL University Email
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 h-4 w-4 text-white/40 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="e.g. scholar@kluniversity.in"
                  className="w-full h-12 rounded-2xl bg-[#070A11] border border-white/15 pl-11 pr-4 text-xs text-white focus:border-purple-500 focus:outline-none font-mono"
                  required
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="w-full h-12 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating Verification Code...
                </>
              ) : (
                <>
                  <span>Send 6-Digit Verification Code</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Enter 6-Digit OTP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-[#D8B4FE]">
                <span className="font-bold flex items-center gap-1.5">
                  <KeyRound className="h-4 w-4 text-[#38BDF8]" /> OTP Dispatched
                </span>
                <span className="font-bold text-[#f59e0b]">Expires in: {formatTime(countdown)}</span>
              </div>
              <p className="text-[11px] text-white/80">
                Verification code sent to <strong className="text-white font-mono">{email}</strong>.
              </p>

              {/* Demo Mode Instant Auto-Fill Helper */}
              {generatedOtp && (
                <div className="pt-1 border-t border-white/10 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-[#D8B4FE] font-mono">
                    Demo OTP: <strong className="text-white font-black tracking-widest">{generatedOtp}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpInput(generatedOtp);
                      setErrorMessage(null);
                    }}
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white transition-colors"
                  >
                    Auto-Fill OTP
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white/90">
                Enter 6-Digit Passcode
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpInput}
                onChange={(e) => {
                  setOtpInput(e.target.value.replace(/\D/g, ''));
                  setErrorMessage(null);
                }}
                placeholder="• • • • • •"
                className="w-full h-14 rounded-2xl bg-[#070A11] border border-white/20 text-center text-2xl font-mono font-black tracking-[0.5em] text-[#38BDF8] focus:border-purple-500 focus:outline-none"
                autoFocus
                required
              />
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-white/60">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="hover:text-white underline text-[11px]"
              >
                Change Email Address
              </button>
              <button
                type="button"
                onClick={handleSendOtp}
                className="text-[#D8B4FE] hover:text-[#38BDF8] hover:underline font-mono text-[11px] flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="h-3 w-3" /> Resend OTP
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || otpInput.length !== 6}
              className="w-full h-12 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Verifying Identity...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Verify & Activate Verified Badge</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 3: Verified Success Screen */}
        {step === 'success' && (
          <div className="space-y-5 text-center py-2">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-purple-500/20 border-2 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.4)] animate-in zoom-in duration-300">
              <CheckCircle2 className="h-8 w-8 text-[#38BDF8]" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white tracking-tight">
                Official KLEF Identity Confirmed!
              </h3>
              <p className="text-xs text-white/70 mt-1 max-w-sm mx-auto">
                Your campus registration has been authenticated. The official Verified Student badge is now active on your profile.
              </p>
            </div>

            {/* Badge Preview Card */}
            <div className="p-4 rounded-2xl bg-white/5 border border-purple-500/40 text-left space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-white/50 uppercase">Active Status</span>
                <VerifiedBadge size="sm" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-white/50 block">University Email:</span>
                  <span className="text-white font-bold truncate block">
                    {currentUser?.university_email || email}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-white/50 block">Operational Code:</span>
                  <span className="text-[#38BDF8] font-bold block">
                    [{currentUser?.code_name || 'SHADOW_SCHOLAR_01'}]
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-white/10 text-[10px] text-[#D8B4FE] font-mono flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#38BDF8]" />
                <span>Verified badge unlocks trusted author attribution across all courses.</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleUnverify}
                className="text-xs text-rose-400 hover:text-rose-300 hover:underline font-mono"
              >
                Reset Verification (Demo Test)
              </button>
              <button
                type="button"
                onClick={closeVerifyModal}
                className="px-6 h-11 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/30 cursor-pointer"
              >
                Close & Return
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
