'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  ServerOff,
  CheckCircle2,
  BookOpen,
  Search,
  Filter,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  RefreshCw,
} from 'lucide-react';
import { KLU_COURSES, KLU_BRANCHES, KLUCourse } from '@/lib/data/klu-courses';
import { MockStorageManager } from '@/lib/storage/mock-store';
import { useApp } from '@/lib/context/AppContext';

interface ManualCourseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  erpId?: string;
}

export default function ManualCourseSyncModal({
  isOpen,
  onClose,
  erpId = '2300030042',
}: ManualCourseSyncModalProps) {
  const router = useRouter();
  const { setCurrentUser, showToast } = useApp();

  const [selectedBranch, setSelectedBranch] = useState<string>('CSE');
  const [selectedBatch, setSelectedBatch] = useState<string>('Y23');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([
    '23CS2101',
    '23CS2202',
    '23CS2103',
  ]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filter courses based on branch and search
  const filteredCourses = useMemo(() => {
    let list = KLU_COURSES;
    if (selectedBranch !== 'All') {
      list = list.filter(
        (c) => c.department === selectedBranch || c.department === 'All'
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.acronym.toLowerCase().includes(q)
      );
    }
    return list.slice(0, 30);
  }, [selectedBranch, searchQuery]);

  if (!isOpen) return null;

  const toggleCourse = (code: string) => {
    if (selectedCourses.includes(code)) {
      setSelectedCourses(selectedCourses.filter((c) => c !== code));
    } else {
      setSelectedCourses([...selectedCourses, code]);
    }
  };

  const handleSyncSubmit = () => {
    if (selectedCourses.length === 0) {
      showToast('Please select at least one course to sync.', 'error');
      return;
    }

    setIsSyncing(true);

    setTimeout(() => {
      // Create or update current user with manually synced courses
      let existingUser = MockStorageManager.getCurrentUser();
      if (!existingUser) {
        existingUser = {
          id: `usr-erp-${erpId}`,
          username: `scholar_${erpId.slice(-4)}`,
          full_name: `[SHADOW_SCHOLAR_${erpId.slice(-2)}]`,
          code_name: `[SHADOW_SCHOLAR_${erpId.slice(-2)}]`,
          email: `${erpId}@kluniversity.in`,
          department: selectedBranch,
          semester: selectedBatch === 'Y26' ? 'Tri-Sem 1' : selectedBatch === 'Y25' ? 'Sem 3' : 'Sem 5',
          role: 'student',
          is_verified_student: true,
          university_email: `${erpId}@kluniversity.in`,
          student_id: erpId,
          enrolled_courses: selectedCourses,
          created_at: new Date().toISOString(),
        };
      } else {
        existingUser.enrolled_courses = selectedCourses;
        existingUser.department = selectedBranch;
      }

      MockStorageManager.setCurrentUser(existingUser);
      setCurrentUser(existingUser);

      // Record defensive audit log for manual fallback
      MockStorageManager.recordSecurityAuditLog({
        event: 'MANUAL_COURSE_SYNC',
        masked_erp_id: `${erpId.slice(0, 2)}****${erpId.slice(-4)}`,
        ip_address: '127.0.0.1 (Local Client)',
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser Client',
        status: 'SUCCESS',
        details: `Manual course sync fallback executed while ERP offline. ${selectedCourses.length} course(s) mapped: [${selectedCourses.join(', ')}].`,
      });

      setIsSyncing(false);
      showToast(
        `Manual Course Sync Complete! ${selectedCourses.length} courses enrolled.`,
        'success'
      );
      onClose();
      router.push('/dashboard');
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-[2.5rem] bg-[#0D1527] border border-amber-500/40 shadow-2xl p-6 sm:p-8 flex flex-col max-h-[90vh] text-white overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-amber-500/15 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <ServerOff className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ERP Gateway Offline Fallback
                </span>
                <span className="text-xs font-mono text-white/50">
                  ID: {erpId.slice(0, 2)}****{erpId.slice(-4)}
                </span>
              </div>
              <h2 className="text-lg font-black text-white mt-0.5">
                Manual Course Synchronization
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="my-4 p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/70 leading-relaxed flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 text-[#38BDF8] shrink-0 mt-0.5" />
          <span>
            When university ERP servers are unreachable or undergoing scheduled maintenance, you can manually select and sync your active course catalogue. Your dashboard and resource hubs will adapt immediately.
          </span>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-[11px] font-bold text-white/60 mb-1">
              Academic Department
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full h-10 rounded-xl bg-[#070A11] border border-white/15 px-3 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
            >
              <option value="All" className="bg-[#0B0F19]">
                All Departments
              </option>
              {KLU_BRANCHES.map((b) => (
                <option key={b.key} value={b.key} className="bg-[#0B0F19]">
                  {b.key} — {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-white/60 mb-1">
              Academic Batch / Track
            </label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full h-10 rounded-xl bg-[#070A11] border border-white/15 px-3 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
            >
              <option value="Y26">Y26 (Honours PBL Tri-Semesters)</option>
              <option value="Y25">Y25 (Semester 3 / 4)</option>
              <option value="Y24">Y24 (Semester 5 / 6)</option>
              <option value="Y23">Y23 (Semester 7 / 8)</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by course code or subject name (e.g. 23CS2101, Java, Maths)..."
            className="w-full h-10 rounded-xl bg-[#070A11] border border-white/15 pl-10 pr-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-amber-400 font-mono"
          />
        </div>

        {/* Selected Tray */}
        <div className="mb-3 p-3 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between text-[11px] mb-2 font-mono">
            <span className="text-white/60">Selected Courses ({selectedCourses.length}):</span>
            <button
              onClick={() => setSelectedCourses([])}
              className="text-amber-400 hover:underline"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
            {selectedCourses.length === 0 ? (
              <span className="text-xs text-white/40 italic">
                No courses selected. Check courses from the list below.
              </span>
            ) : (
              selectedCourses.map((code) => (
                <span
                  key={code}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-mono font-bold"
                >
                  <span>{code}</span>
                  <button
                    onClick={() => toggleCourse(code)}
                    className="hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Course List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-56">
          {filteredCourses.map((c) => {
            const isSelected = selectedCourses.includes(c.code);
            return (
              <div
                key={c.code}
                onClick={() => toggleCourse(c.code)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-400/50 text-white'
                    : 'bg-[#070A11]/60 border-white/10 hover:border-white/20 text-white/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-5 w-5 rounded-md border flex items-center justify-center ${
                      isSelected
                        ? 'bg-amber-500 border-amber-400 text-black'
                        : 'border-white/30'
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-amber-300">
                        {c.code}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-white/60 font-mono">
                        {c.category}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-white/90 line-clamp-1">
                      {c.name}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-white/40">
                  {c.department}
                </span>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 mt-3 border-t border-white/10 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-white/20 text-xs font-bold text-white hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSyncSubmit}
            disabled={isSyncing || selectedCourses.length === 0}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Syncing Courses...</span>
              </>
            ) : (
              <>
                <span>Sync {selectedCourses.length} Courses & Proceed</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
