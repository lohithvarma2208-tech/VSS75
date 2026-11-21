'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  FileCheck,
  AlertCircle,
  ShieldCheck,
  X,
  ArrowUpRight,
  Search,
  Check,
  ChevronDown,
  Sparkles,
  BookOpen,
  Filter,
} from 'lucide-react';
import { Resource, ResourceCategory, ResourceFileType } from '@/types';
import { MockStorageManager } from '@/lib/storage/mock-store';
import {
  KLU_COURSES,
  KLUCourse,
  KLU_BRANCHES,
  KLU_BATCH_CONFIGS,
  AcademicBatchConfig,
  getTermsForBatchTrack,
} from '@/lib/data/klu-courses';
import { useApp } from '@/lib/context/AppContext';
import { formatBytes } from '@/lib/utils';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';

const CATEGORIES: ResourceCategory[] = [
  'Assignments',
  'Programming',
  'Lab Records',
  'Lab Experiments',
  'DTIE Projects',
  'Notes',
  'Mini Projects',
  'Major Projects',
  'Mathematics',
  'Presentations',
  'Reports',
  'Study Resources',
  'Other Academic Resources',
];

const SEMESTERS = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'];

export default function UploadPage() {
  const router = useRouter();
  const { currentUser, showToast, openVerifyModal } = useApp();

  const [weeklyUploadCount, setWeeklyUploadCount] = useState(0);
  const [rejectedDuplicate, setRejectedDuplicate] = useState<Resource | null>(null);

  useEffect(() => {
    if (currentUser) {
      setWeeklyUploadCount(
        MockStorageManager.getWeeklyUploadCount(currentUser.id, currentUser.full_name, currentUser.username)
      );
    }
  }, [currentUser]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // Batch & Delivery Track State based on KLU 2025/2026 Academic Regulations
  const [selectedBatchConfigId, setSelectedBatchConfigId] = useState<string>('y26-pbl');

  const currentBatchConfig = useMemo(() => {
    return (
      KLU_BATCH_CONFIGS.find((b) => b.id === selectedBatchConfigId) ||
      KLU_BATCH_CONFIGS[0]
    );
  }, [selectedBatchConfigId]);

  const availableTerms = useMemo(() => {
    return currentBatchConfig.terms;
  }, [currentBatchConfig]);

  const [courseCode, setCourseCode] = useState('26UC1137');
  const [courseName, setCourseName] = useState('Design Thinking for Innovation & Entrepreneurship');
  const [semester, setSemester] = useState('Tri-Sem 1 (T1)');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [category, setCategory] = useState<ResourceCategory>('DTIE Projects');
  const [resourceType, setResourceType] = useState('DTIE Portfolio / Report');
  const [tags, setTags] = useState('26UC1137, DTIE, Y26, Innovation');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [confirmedPermission, setConfirmedPermission] = useState(false);
  const [confirmedEducational, setConfirmedEducational] = useState(false);

  // Search & filter state for official KLU courses
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('All');
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleBatchConfigChange = (configId: string) => {
    setSelectedBatchConfigId(configId);
    const cfg = KLU_BATCH_CONFIGS.find((b) => b.id === configId);
    if (cfg) {
      setAcademicYear(cfg.academicYear);
      setSemester(cfg.terms[0]);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCourseDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCourses = useMemo(() => {
    let list = KLU_COURSES;

    // Filter by selected batch
    if (currentBatchConfig.batch === 'Y26') {
      list = list.filter((c) => c.batch === 'Y26');
    } else if (currentBatchConfig.batch === 'Y25') {
      list = list.filter((c) => c.batch === 'Y25');
    } else if (currentBatchConfig.batch === 'Y24') {
      list = list.filter((c) => c.batch === 'Y24');
    }

    // Filter by selected track (Honours PBL vs Regular)
    list = list.filter((c) => c.mode === currentBatchConfig.track);

    if (selectedBranch !== 'All') {
      list = list.filter((c) => c.department === selectedBranch);
    }

    if (courseSearch.trim()) {
      const q = courseSearch.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.acronym.toLowerCase().includes(q) ||
          c.department.toLowerCase().includes(q)
      );
    }

    return list.slice(0, 35);
  }, [currentBatchConfig, selectedBranch, courseSearch]);

  const handleSelectCourse = (c: KLUCourse) => {
    setCourseCode(c.code);
    setCourseName(c.name);
    setSemester(c.semester);
    setAcademicYear(
      c.code.startsWith('26') ? '2026-2027' : c.code.startsWith('25') ? '2025-2026' : '2024-2025'
    );

    // Intelligent category suggestion
    if (c.code.includes('UC1137') || c.name.toLowerCase().includes('design thinking')) {
      setCategory('DTIE Projects');
      setResourceType('DTIE Report / Prototype');
    } else if (c.category === 'BSC' || c.name.toLowerCase().includes('mathematics')) {
      setCategory('Mathematics');
      setResourceType('Handwritten Notes / Solved PYQs');
    } else if (
      c.name.toLowerCase().includes('programming') ||
      c.name.toLowerCase().includes('java') ||
      c.name.toLowerCase().includes('python') ||
      c.name.toLowerCase().includes('data structures')
    ) {
      setCategory('Programming');
      setResourceType('Source Code / Lab Solution');
    } else if (c.name.toLowerCase().includes('lab') || c.category === 'PCC') {
      setCategory('Lab Records');
      setResourceType('Lab Record with Observations');
    }

    setTags(
      [c.code, c.acronym, c.department, c.category, c.code.startsWith('26') ? 'Y26' : 'Y25']
        .filter(Boolean)
        .join(', ')
    );
    setIsCourseDropdownOpen(false);
  };

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [fileContentPreview, setFileContentPreview] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const processFile = (selectedFile: File) => {
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (selectedFile.size > MAX_SIZE) {
      setErrorMessage('File size exceeds the 50MB maximum campus limit.');
      return;
    }
    setErrorMessage('');
    setFile(selectedFile);

    if (
      selectedFile.type.startsWith('text/') ||
      selectedFile.name.endsWith('.py') ||
      selectedFile.name.endsWith('.java') ||
      selectedFile.name.endsWith('.cpp') ||
      selectedFile.name.endsWith('.c') ||
      selectedFile.name.endsWith('.v')
    ) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setFileContentPreview(text.slice(0, 3000));
      };
      reader.readAsText(selectedFile);
    } else {
      setFileContentPreview(
        `[${selectedFile.name}] (${formatBytes(selectedFile.size)})\nVoluntarily uploaded academic material to Virtual Student Space.`
      );
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || title.length < 5) {
      setErrorMessage('Please provide a title with at least 5 characters.');
      return;
    }
    if (!description.trim() || description.length < 20) {
      setErrorMessage('Please describe the resource with at least 20 characters of academic context.');
      return;
    }
    if (!file) {
      setErrorMessage('Please select or drag-and-drop a file to upload.');
      return;
    }
    if (!confirmedPermission) {
      setErrorMessage('You must confirm that you have permission to share this resource.');
      return;
    }
    if (!confirmedEducational) {
      setErrorMessage('You must acknowledge this material is shared solely for study reference.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    let prog = 0;
    const interval = setInterval(() => {
      prog += 25;
      setUploadProgress(prog);
      if (prog >= 100) {
        clearInterval(interval);
        finalizeUpload();
      }
    }, 150);
  };

  const finalizeUpload = () => {
    const ext = file?.name.split('.').pop()?.toLowerCase() || 'pdf';
    const tagArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const created = MockStorageManager.addResource({
      title: title.trim(),
      description: description.trim(),
      category,
      course_code: courseCode.trim().toUpperCase(),
      course_name: courseName.trim(),
      semester,
      academic_year: academicYear.trim(),
      resource_type: resourceType.trim(),
      file_name: file?.name || 'resource.pdf',
      file_url: `/samples/${file?.name}`,
      file_size: file?.size || 1024,
      file_type: (['pdf', 'docx', 'pptx', 'zip', 'py', 'java', 'cpp', 'c', 'txt'].includes(ext)
        ? ext
        : 'pdf') as ResourceFileType,
      file_content_preview: fileContentPreview,
      author_id: currentUser?.id,
      author_name: isAnonymous ? 'Anonymous' : currentUser?.code_name || `@${currentUser?.username || 'anonymous'}`,
      author_username: isAnonymous ? undefined : currentUser?.username || 'anonymous',
      author_is_verified: isAnonymous ? false : (currentUser?.is_verified_student ?? false),
      is_anonymous: isAnonymous,
      tags: tagArray.length > 0 ? tagArray : [courseCode, category],
      status: 'approved',
    });

    setIsSubmitting(false);

    // If an identical duplicate is detected, eliminate the duplicate submission!
    if (created.status === 'rejected') {
      setRejectedDuplicate(created);
      showToast('Duplicate Eliminated: This identical work was already published by a pioneer student.', 'error');
      return;
    }

    if (currentUser) {
      setWeeklyUploadCount(
        MockStorageManager.getWeeklyUploadCount(currentUser.id, currentUser.full_name, currentUser.username)
      );
    }

    showToast('Pioneer Resource Approved! (+1 towards unlocking PDF Studio)', 'success');
    router.push(`/resource/${created.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-12 py-12 space-y-8">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#C084FC] font-mono">
          Contribute to Campus
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-1">
          Share Academic Work
        </h1>
        <p className="text-xs sm:text-sm text-white/70 mt-1 font-normal">
          Upload your completed assignments, lab records, DTIE innovation documentation, or revision notes.
        </p>
      </div>

      {/* Weekly PDF Studio Progress Strip */}
      <div className="p-5 rounded-[2rem] bg-gradient-to-r from-purple-950/40 via-[#131B2E] to-blue-950/40 border border-purple-500/30 backdrop-blur-md shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#38BDF8]" />
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Weekly Contributor Reward
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-[#D8B4FE] text-[10px] font-mono font-bold">
              PDF Studio Pro
            </span>
          </div>
          <p className="text-xs text-white/70">
            Post at least <strong>5 original materials each week</strong> to unlock the complete in-browser PDF Studio.
          </p>
        </div>

        <div className="w-full sm:w-60 space-y-1.5 shrink-0 bg-[#0B0F19]/60 p-3 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-white/60">This Week:</span>
            <span className="font-bold text-[#D8B4FE]">
              {weeklyUploadCount} / 5 Uploads
            </span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#8B5CF6] via-[#6366F1] to-[#38BDF8] rounded-full transition-all"
              style={{ width: `${Math.min(100, (weeklyUploadCount / 5) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-white/40">
            <span>{Math.min(100, Math.round((weeklyUploadCount / 5) * 100))}% Complete</span>
            <span>{weeklyUploadCount >= 5 ? '✓ Studio Unlocked' : `${5 - weeklyUploadCount} more needed`}</span>
          </div>
        </div>
      </div>

      {/* Pioneer Attribution & Duplicate Shield Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-[#0D1527] to-purple-950/40 border border-cyan-500/30 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 shrink-0 mt-0.5">
            <ShieldCheck className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5">
                🛡️ Pioneer Attribution & Duplicate Elimination Shield
              </h3>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-[#38BDF8] border border-cyan-500/30">
                Pioneer Protected
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-white/70 leading-relaxed">
              Every distinct academic assignment, lab, or project you post (including your 2nd, 3rd, 4th, and 5th distinct works) is approved and counts toward your 5 weekly uploads for PDF Studio. When an identical copy of already-published work is detected, only the duplicate is eliminated, preserving 100% attribution for the original student pioneer.
            </p>
          </div>
        </div>
      </div>

      {/* Duplicate Rejection Banner */}
      {rejectedDuplicate && (
        <div className="p-6 rounded-[2rem] bg-rose-950/40 border border-rose-500/50 backdrop-blur-xl shadow-2xl space-y-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400">
                Integrity Engine · Duplicate Eliminated
              </span>
              <h3 className="text-lg font-extrabold text-white">
                Identical Duplicate Eliminated — Pioneer Work Already Exists
              </h3>
              <p className="text-xs text-rose-200/90 leading-relaxed font-normal">
                {rejectedDuplicate.rejection_reason}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0B0F19] border border-white/10 text-xs space-y-2">
            <div className="flex items-center justify-between text-white/60">
              <span>Original Pioneer Student:</span>
              <span className="font-bold text-white font-mono">@{rejectedDuplicate.duplicate_of_author}</span>
            </div>
            <div className="flex items-center justify-between text-white/60">
              <span>Existing Resource Title:</span>
              <span className="font-bold text-[#D8B4FE]">{rejectedDuplicate.duplicate_of_title}</span>
            </div>
            <p className="text-[11px] text-white/50 pt-1">
              💡 <em>Virtual Student Space enforces Pioneer Protection: Every unique work you post (including your 2nd, 3rd, 4th, and 5th distinct assignments) is approved and counts toward unlocking PDF Studio. Only identical duplicate copies of already-published work are eliminated.</em>
            </p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            {rejectedDuplicate.duplicate_of_id && (
              <Link
                href={`/resource/${rejectedDuplicate.duplicate_of_id}`}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
              >
                View Existing Pioneer Work ➔
              </Link>
            )}
            <button
              type="button"
              onClick={() => setRejectedDuplicate(null)}
              className="px-5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-bold text-xs transition"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-bold">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Course & Metadata Card */}
        <div className="rounded-[2rem] border border-white/10 bg-[#131B2E]/80 p-6 sm:p-8 shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xs font-bold text-[#D8B4FE] uppercase tracking-wider font-mono">
                01. Academic Batch & Course Classification
              </h2>
              <p className="text-[11px] text-white/60 mt-0.5">
                Select your academic batch regulation and official curriculum track.
              </p>
            </div>
            <span className="text-[10px] text-[#D8B4FE] font-mono font-bold bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full shrink-0">
              290+ Accredited Courses
            </span>
          </div>

          {/* Academic Batch & Delivery Track Selector (KLU Regulations) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-white/90">
                Academic Batch & Track Regulation
              </label>
              <span className="text-[10px] text-[#f59e0b] font-mono font-bold">
                {currentBatchConfig.termPrefix === 'Tri-Sem' ? 'Tri-Sem Track · 12 Terms Total' : 'Bi-Sem Track · 8 Terms Total'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {KLU_BATCH_CONFIGS.map((cfg) => {
                const isSelected = selectedBatchConfigId === cfg.id;
                return (
                  <button
                    key={cfg.id}
                    type="button"
                    onClick={() => handleBatchConfigChange(cfg.id)}
                    className={`text-left p-3 rounded-2xl border transition-all relative ${
                      isSelected
                        ? 'bg-purple-500/15 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                        : 'bg-[#0B0F19] border-white/10 hover:border-purple-500/30 text-white/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-xs font-black tracking-tight ${isSelected ? 'text-[#D8B4FE]' : 'text-white'}`}>
                        {cfg.title}
                      </span>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-[#38BDF8] shrink-0 mt-0.5" />
                      )}
                    </div>
                    <p className="text-[10px] text-white/60 mt-1 line-clamp-2">
                      {cfg.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/80">
                        {cfg.termPrefix === 'Tri-Sem' ? 'Tri-Sem' : 'Bi-Sem'}
                      </span>
                      <span className="text-[9px] font-mono text-[#f59e0b]">
                        {cfg.academicYear}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Regulation Explanation Banner */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white/70 space-y-1">
              <p className="text-white font-bold flex items-center gap-1.5 text-xs text-[#D8B4FE]">
                <Sparkles className="h-3.5 w-3.5 text-[#38BDF8]" /> KL University Academic Regulation Architecture
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-white/70 font-mono">
                <div>
                  <strong className="text-white">● 2025 Academic Batch:</strong> Regular follows <strong>Bi-Sem</strong> (8 terms total), whereas Honours PBL follows <strong>Tri-Sem</strong> (12 terms total).
                </div>
                <div>
                  <strong className="text-white">● 2026 Academic Batch:</strong> Both Regular and Honours PBL follow <strong>Tri-Sem</strong> (12 terms total).
                </div>
              </div>
            </div>
          </div>

          {/* Course Search & Official Curriculum Selector */}
          <div className="space-y-3 pt-2 border-t border-white/10" ref={dropdownRef}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="block text-xs font-bold text-white/90">
                Official Course Search ({currentBatchConfig.title})
              </label>

              {/* Branch quick filter */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/50 font-mono">Branch:</span>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/15 bg-[#0B0F19] text-white/80 focus:border-purple-500 focus:outline-none"
                >
                  <option value="All">All Branches</option>
                  {KLU_BRANCHES.map((br) => (
                    <option key={br.key} value={br.key}>
                      {br.key} — {br.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Input for courses */}
            <div className="relative">
              <div className="relative flex items-center">
                <Search className="absolute left-4 h-4 w-4 text-white/40 pointer-events-none" />
                <input
                  type="text"
                  placeholder={`Search ${currentBatchConfig.batch} ${currentBatchConfig.track} courses by code (26UC1137), acronym (DTIE), or title...`}
                  value={courseSearch}
                  onFocus={() => setIsCourseDropdownOpen(true)}
                  onChange={(e) => {
                    setCourseSearch(e.target.value);
                    setIsCourseDropdownOpen(true);
                  }}
                  className="w-full h-11 pl-11 pr-24 rounded-full border border-white/20 bg-[#0B0F19] text-xs text-white placeholder-white/40 focus:border-purple-500 focus:outline-none font-medium"
                />
                <button
                  type="button"
                  onClick={() => setIsCourseDropdownOpen(!isCourseDropdownOpen)}
                  className="absolute right-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-bold text-[#D8B4FE] flex items-center gap-1 transition"
                >
                  <span>Browse</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>

              {/* Course Autocomplete Dropdown */}
              {isCourseDropdownOpen && (
                <div className="absolute left-0 right-0 mt-2 max-h-72 overflow-y-auto rounded-2xl bg-[#0D1527] border border-white/20 shadow-2xl py-2 z-50 divide-y divide-white/5">
                  <div className="px-4 py-2 text-[10px] font-mono text-[#D8B4FE] uppercase tracking-wider flex justify-between">
                    <span>Matching {currentBatchConfig.title} Courses ({filteredCourses.length})</span>
                    <span>Click to auto-fill</span>
                  </div>

                  {filteredCourses.length === 0 ? (
                    <div className="p-4 text-center text-xs text-white/50">
                      No matching courses found in {currentBatchConfig.title}. You can enter custom course details below or switch the batch.
                    </div>
                  ) : (
                    filteredCourses.map((c) => {
                      const isSelected = courseCode === c.code;
                      return (
                        <div
                          key={`${c.code}-${c.mode}-${c.term}`}
                          onClick={() => handleSelectCourse(c)}
                          className={`p-3 px-4 hover:bg-white/10 cursor-pointer transition flex items-center justify-between gap-3 ${
                            isSelected ? 'bg-purple-500/15 border-l-2 border-purple-500' : ''
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-black text-[#38BDF8]">
                                {c.code}
                              </span>
                              {c.acronym && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/80 font-mono font-bold">
                                  {c.acronym}
                                </span>
                              )}
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f59e0b]/20 text-[#f59e0b] font-bold">
                                {c.department}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/60 font-mono">
                                {c.mode}
                              </span>
                              <span className="text-[10px] text-white/50 font-mono">
                                {c.semester} · {c.credits} Cr
                              </span>
                            </div>
                            <p className="text-xs text-white font-medium truncate mt-0.5">
                              {c.name}
                            </p>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-[#38BDF8] shrink-0" />}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Highlighted Selected Course Pill Card */}
            <div className="flex items-center justify-between gap-3 p-3 px-4 rounded-xl bg-[#0B0F19] border border-purple-500/30">
              <div className="flex items-center gap-2.5 min-w-0">
                <BookOpen className="h-4 w-4 text-[#38BDF8] shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-[#38BDF8] font-mono">{courseCode}</span>
                    <span className="text-xs text-white font-bold truncate">{courseName}</span>
                  </div>
                  <p className="text-[10px] text-white/60 font-mono mt-0.5">
                    Target: <strong className="text-white">{semester}</strong> · Regulation: <strong className="text-[#D8B4FE]">{currentBatchConfig.title}</strong> ({currentBatchConfig.termPrefix === 'Tri-Sem' ? 'Tri-Sem' : 'Bi-Sem'})
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-[#D8B4FE] uppercase shrink-0 font-mono">
                Active
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-white/80 mb-1.5">
                Course Code (Editable)
              </label>
              <input
                type="text"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="e.g. 26UC1137 or 26SC1101"
                className="w-full h-11 rounded-full border border-white/15 bg-[#0B0F19] px-4 text-xs text-white focus:border-purple-500 focus:outline-none font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 mb-1.5">
                Course Full Name (Editable)
              </label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g. Design Thinking for Innovation & Entrepreneurship"
                className="w-full h-11 rounded-full border border-white/15 bg-[#0B0F19] px-4 text-xs text-white focus:border-purple-500 focus:outline-none font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 mb-1.5 flex items-center justify-between">
                <span>{currentBatchConfig.termPrefix === 'Tri-Sem' ? 'Tri-Sem' : 'Bi-Sem'}</span>
                <span className="text-[10px] text-[#D8B4FE] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/15">
                  {currentBatchConfig.termPrefix === 'Tri-Sem' ? 'Tri-Sem' : 'Bi-Sem'}
                </span>
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full h-11 rounded-full border border-white/15 bg-[#0B0F19] px-4 text-xs text-white focus:border-purple-500 focus:outline-none font-medium"
              >
                {availableTerms.map((s) => (
                  <option key={s} value={s} className="bg-[#0B0F19] text-white">
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 mb-1.5">
                Academic Year
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2024-2025"
                className="w-full h-11 rounded-full border border-white/15 bg-[#0B0F19] px-4 text-xs text-white focus:border-purple-500 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 mb-1.5">
                Resource Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ResourceCategory)}
                className="w-full h-11 rounded-full border border-white/15 bg-[#0B0F19] px-4 text-xs text-white focus:border-purple-500 focus:outline-none font-medium"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#0B0F19] text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 mb-1.5">
                Resource Type
              </label>
              <input
                type="text"
                placeholder="e.g. Lab Record, Assignment 2, Unit 3 Notes"
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                className="w-full h-11 rounded-full border border-white/15 bg-[#0B0F19] px-4 text-xs text-white focus:border-purple-500 focus:outline-none font-medium"
                required
              />
            </div>
          </div>
        </div>

        {/* Title & Academic Details Card */}
        <div className="rounded-[2rem] border border-white/10 bg-[#131B2E]/80 p-6 sm:p-8 shadow-card space-y-4">
          <h2 className="text-xs font-bold text-[#D8B4FE] uppercase tracking-wider font-mono">
            02. Resource Details
          </h2>

          <div>
            <label className="block text-xs font-bold text-white/80 mb-1.5">
              Resource Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Experiment 6: Red-Black Tree Implementation and Balance Analysis"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-11 rounded-full border border-white/15 bg-[#0B0F19] px-4 text-xs sm:text-sm text-white focus:border-purple-500 focus:outline-none font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-white/80 mb-1.5">
              Description & Learning Approach *
            </label>
            <textarea
              rows={4}
              placeholder="Provide context on how you solved it, key algorithmic decisions, experimental observations, or study tips..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-2xl border border-white/15 bg-[#0B0F19] p-4 text-xs sm:text-sm text-white focus:border-purple-500 focus:outline-none font-medium leading-relaxed"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-white/80 mb-1.5">
              Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Trees, Algorithms, 23CS2101, C++, Lab Record"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full h-11 rounded-full border border-white/15 bg-[#0B0F19] px-4 text-xs text-white focus:border-purple-500 focus:outline-none font-medium"
            />
          </div>
        </div>

        {/* File Drag and Drop Zone */}
        <div className="rounded-[2rem] border border-white/10 bg-[#131B2E]/80 p-6 sm:p-8 shadow-card space-y-4">
          <h2 className="text-xs font-bold text-[#D8B4FE] uppercase tracking-wider font-mono">
            03. File Attachment
          </h2>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-3xl p-8 text-center transition cursor-pointer ${
              isDragging
                ? 'border-purple-500 bg-purple-500/10'
                : file
                ? 'border-purple-500 bg-purple-500/5'
                : 'border-white/20 hover:border-purple-500/60 bg-[#0B0F19]/60'
            }`}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processFile(e.target.files[0]);
                }
              }}
            />

            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileCheck className="h-10 w-10 text-[#38BDF8]" />
                <p className="text-sm font-bold text-white">{file.name}</p>
                <p className="text-xs text-white/60">{formatBytes(file.size)}</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setFileContentPreview('');
                  }}
                  className="mt-2 text-xs text-rose-400 hover:underline flex items-center gap-1 font-bold"
                >
                  <X className="h-3.5 w-3.5" /> Remove file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <UploadCloud className="h-10 w-10 text-white/40" />
                <p className="text-sm font-bold text-white">
                  Drag and drop your academic document here
                </p>
                <p className="text-xs text-white/50 max-w-sm">
                  Supported formats: PDF, DOCX, PPTX, Java, Python, C, C++, Verilog, TXT, ZIP (up to 50MB)
                </p>
                <span className="mt-2 inline-block px-5 py-2 bg-white/10 border border-white/15 rounded-full text-xs font-bold text-white hover:bg-white/20 transition">
                  Browse Files
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Permissions & Integrity Commitments */}
        <div className="rounded-[2rem] border border-white/10 bg-[#131B2E]/80 p-6 sm:p-8 shadow-card space-y-4">
          <h2 className="text-xs font-bold text-[#D8B4FE] uppercase tracking-wider font-mono flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-[#38BDF8]" />
            <span>04. Academic Integrity & Ethics</span>
          </h2>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmedPermission}
                onChange={(e) => setConfirmedPermission(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/30 text-purple-500 focus:ring-purple-500"
              />
              <span className="text-xs text-white/80 leading-relaxed font-medium">
                <strong className="text-white">Permission:</strong> I confirm that I am the author of this submission or have full authorization to share it with the campus community.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmedEducational}
                onChange={(e) => setConfirmedEducational(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/30 text-purple-500 focus:ring-purple-500"
              />
              <span className="text-xs text-white/80 leading-relaxed font-medium">
                <strong className="text-white">Peer Reference:</strong> I understand this material is shared solely for peer study reference, and is not intended to facilitate plagiarism or academic misconduct.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-white/10">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/30 text-purple-500 focus:ring-purple-500"
              />
              <span className="text-xs text-white/60 leading-relaxed font-medium">
                Post anonymously (your name will be hidden from public view; identity is securely preserved for administrative compliance).
              </span>
            </label>

            {/* Contributor Verification Status */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-white/70 font-mono text-[11px]">Author Verification Status:</span>
              {currentUser?.is_verified_student ? (
                <VerifiedBadge size="xs" />
              ) : (
                <button
                  type="button"
                  onClick={openVerifyModal}
                  className="text-[10px] font-mono text-[#f59e0b] hover:text-[#D8B4FE] hover:underline flex items-center gap-1 font-bold"
                >
                  <span>Verify your student email for verified author badge</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar when submitting */}
        {isSubmitting && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-white">
              <span>Uploading to Virtual Student Space...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#8B5CF6] via-[#6366F1] to-[#38BDF8] transition-all duration-150"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 rounded-full border border-white/20 text-xs font-bold text-white hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Uploading...' : 'Publish Academic Resource ↗'}
          </button>
        </div>
      </form>
    </div>
  );
}
