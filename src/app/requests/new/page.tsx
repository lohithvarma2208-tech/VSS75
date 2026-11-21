'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileQuestion,
  Search,
  Check,
  ChevronDown,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Calendar,
  Lock,
  Tag,
  BookOpen,
} from 'lucide-react';
import { ResourceCategory, ResourceRequest } from '@/types';
import { MockStorageManager } from '@/lib/storage/mock-store';
import { KLU_COURSES, KLUCourse, searchKLUCourses } from '@/lib/data/klu-courses';
import { useApp } from '@/lib/context/AppContext';
import SmartMatchSuggestions from '@/components/requests/SmartMatchSuggestions';

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

const PROGRAMMES = ['B.Tech', 'M.Tech', 'BCA', 'MCA', 'BBA', 'MBA'];

const SEMESTERS = [
  'Sem 1',
  'Sem 2',
  'Sem 3',
  'Sem 4',
  'Sem 5',
  'Sem 6',
  'Sem 7',
  'Sem 8',
  'Tri-Sem 1 (T1)',
  'Tri-Sem 2 (T2)',
  'Tri-Sem 3 (T3)',
  'Tri-Sem 4 (T4)',
  'Tri-Sem 5 (T5)',
  'Tri-Sem 6 (T6)',
];

const RESOURCE_TYPES = [
  'Unit Notes',
  'Lab Experiment / Code',
  'Lab Record',
  'Assignment Solution / Reference',
  'Question Papers (In-Sem / End-Sem)',
  'DTIE Project Portfolio / Report',
  'Seminar Presentation / PPT',
  'Mini Project Documentation',
  'Formula Sheet / Cheat Sheet',
  'Textbook Reference Solution',
  'Other Academic Resource',
];

const FORMATS = [
  'Any Format',
  'PDF',
  'PPTX / Presentation',
  'DOCX / Word',
  'Source Code (.java, .py, .cpp, .c)',
  'ZIP Archive',
  'Images / Scanned Notes',
];

export default function CreateRequestPage() {
  const router = useRouter();
  const { currentUser, showToast } = useApp();

  // Required Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [programme, setProgramme] = useState('B.Tech');
  const [semester, setSemester] = useState('Sem 4');
  const [category, setCategory] = useState<ResourceCategory>('Notes');
  const [resourceType, setResourceType] = useState('Unit Notes');

  // Course Selector State (loading dynamically from KLU_COURSES database)
  const [selectedCourse, setSelectedCourse] = useState<KLUCourse | null>(null);
  const [courseCode, setCourseCode] = useState('23CS2101');
  const [courseName, setCourseName] = useState('Data Structures and Algorithms');
  const [courseSearch, setCourseSearch] = useState('');
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
  const courseDropdownRef = useRef<HTMLDivElement>(null);

  // Optional Fields
  const [moduleNumber, setModuleNumber] = useState('');
  const [topic, setTopic] = useState('');
  const [assignmentNumber, setAssignmentNumber] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [preferredFormat, setPreferredFormat] = useState('PDF');
  const [tagsInput, setTagsInput] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Close course dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (courseDropdownRef.current && !courseDropdownRef.current.contains(e.target as Node)) {
        setIsCourseDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter courses from real KLU course catalogue
  const filteredCourses = useMemo(() => {
    if (!courseSearch.trim()) {
      return KLU_COURSES.slice(0, 15);
    }
    return searchKLUCourses(courseSearch, 20);
  }, [courseSearch]);

  const handleSelectCourse = (course: KLUCourse) => {
    setSelectedCourse(course);
    setCourseCode(course.code);
    setCourseName(course.name);
    if (course.semester) {
      setSemester(course.semester);
    }
    setIsCourseDropdownOpen(false);
    setCourseSearch('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title.trim()) {
      setErrorMessage('Please enter a descriptive request title.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Please provide context or details for what you need.');
      return;
    }
    if (!courseCode.trim() || !courseName.trim()) {
      setErrorMessage('Please select a valid academic course from the catalogue.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Process tags
      const rawTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const computedTags = Array.from(
        new Set([
          courseCode,
          category,
          programme,
          ...(moduleNumber ? [moduleNumber] : []),
          ...rawTags,
        ])
      );

      const newRequest = MockStorageManager.addResourceRequest({
        user_id: currentUser?.id || 'usr-student-01',
        title: title.trim(),
        description: description.trim(),
        programme,
        course_code: courseCode.trim(),
        course_name: courseName.trim(),
        semester,
        category,
        resource_type: resourceType,
        module_number: moduleNumber.trim() || undefined,
        topic: topic.trim() || undefined,
        assignment_number: assignmentNumber.trim() || undefined,
        academic_year: academicYear,
        preferred_format: preferredFormat === 'Any Format' ? undefined : preferredFormat,
        tags: computedTags,
        deadline: deadline || undefined,
        is_anonymous: isAnonymous,
        requester_name: currentUser?.code_name || `@${currentUser?.username || 'anonymous'}`,
        requester_username: currentUser?.username || 'anonymous',
        requester_avatar: currentUser?.avatar_url,
        requester_department: currentUser?.department || 'CSE',
        requester_is_verified: currentUser?.is_verified_student || false,
      });

      showToast('Resource request created successfully!', 'success');
      router.push(`/requests/${newRequest.id}`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Failed to publish request. Please verify fields and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-6 sm:px-12 lg:px-16 py-10 max-w-4xl mx-auto space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/requests"
          className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-[#D8B4FE] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Requests Feed</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-3 py-1 rounded-full bg-purple-500/15 text-[#D8B4FE] text-[10px] font-mono font-bold tracking-wider border border-purple-500/30">
            NEW REQUEST
          </span>
          <span className="text-xs text-white/50">Student-to-Student Resource Sharing</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Request an Academic Resource
        </h1>
        <p className="text-xs sm:text-sm text-white/70 mt-1 max-w-2xl font-normal">
          Can&apos;t find notes, experiment code, or previous question papers? Ask your KL University classmates and peer mentors for help.
        </p>
      </div>

      {/* SMART MATCHES CALLOUT: Live matching against VSS Library */}
      <SmartMatchSuggestions
        courseCode={courseCode}
        courseName={courseName}
        topic={topic}
        title={title}
        category={category}
      />

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* REQUEST FORM */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-[2.5rem] border border-white/10 bg-[#131B2E]/70 p-6 sm:p-9 space-y-6 shadow-card backdrop-blur-md">
          <h2 className="text-base sm:text-lg font-black text-white border-b border-white/10 pb-3 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#38BDF8]" />
            <span>1. What resource do you need?</span>
          </h2>

          {/* Request Title */}
          <div>
            <label className="block text-xs font-bold text-white mb-1.5">
              Request Title <span className="text-[#D8B4FE]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='e.g. "Does anyone have Module 3 Maths notes for 23MT2001?" or "Need Java Lab Experiment 7"'
              className="w-full bg-[#0B0F19] border border-white/15 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition"
            />
            <p className="text-[11px] text-white/40 mt-1">
              Be specific about the module, experiment, or question paper year.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-white mb-1.5">
              Detailed Description <span className="text-[#D8B4FE]">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain specifically what you are looking for, which derivations/topics are required, and when your exam or lab review is scheduled..."
              className="w-full bg-[#0B0F19] border border-white/15 rounded-2xl p-4 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition resize-none"
            />
          </div>

          {/* Searchable Course Selector (Using real KLU_COURSES) */}
          <div className="relative" ref={courseDropdownRef}>
            <label className="block text-xs font-bold text-white mb-1.5">
              Course / Subject <span className="text-[#D8B4FE]">*</span> (Selected from official KLU catalogue)
            </label>
            <div
              onClick={() => setIsCourseDropdownOpen(!isCourseDropdownOpen)}
              className="w-full bg-[#0B0F19] border border-white/15 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white flex items-center justify-between cursor-pointer hover:border-purple-500/50 transition"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-[#D8B4FE] font-mono font-bold text-xs">
                  {courseCode}
                </span>
                <span className="truncate">{courseName}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-white/50 shrink-0" />
            </div>

            {/* Dropdown Menu */}
            {isCourseDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0D1527] border border-white/20 rounded-2xl shadow-2xl z-30 p-3 space-y-2 max-h-72 flex flex-col">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
                  <input
                    type="text"
                    autoFocus
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    placeholder="Search by code (23CS...) or course name..."
                    className="w-full bg-white/5 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="overflow-y-auto space-y-1 pr-1 custom-scrollbar flex-1">
                  {filteredCourses.map((c) => (
                    <div
                      key={c.code}
                      onClick={() => handleSelectCourse(c)}
                      className={`p-2.5 rounded-xl cursor-pointer text-xs transition flex items-center justify-between ${
                        courseCode === c.code
                          ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white font-bold'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <span className="font-mono font-bold mr-2">[{c.code}]</span>
                        <span>{c.name}</span>
                      </div>
                      <span className="text-[10px] opacity-75 shrink-0">{c.department}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Programme & Semester Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white mb-1.5">
                Programme <span className="text-[#D8B4FE]">*</span>
              </label>
              <select
                value={programme}
                onChange={(e) => setProgramme(e.target.value)}
                className="w-full bg-[#0B0F19] border border-white/15 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
              >
                {PROGRAMMES.map((p) => (
                  <option key={p} value={p} className="bg-[#0B0F19]">
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-white mb-1.5">
                Semester / Academic Term <span className="text-[#D8B4FE]">*</span>
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full bg-[#0B0F19] border border-white/15 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
              >
                {SEMESTERS.map((s) => (
                  <option key={s} value={s} className="bg-[#0B0F19]">
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category & Resource Type Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white mb-1.5">
                Resource Category <span className="text-[#D8B4FE]">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-[#0B0F19] border border-white/15 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-[#0B0F19]">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-white mb-1.5">
                Resource Type <span className="text-[#D8B4FE]">*</span>
              </label>
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                className="w-full bg-[#0B0F19] border border-white/15 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
              >
                {RESOURCE_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-[#0B0F19]">
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 2. OPTIONAL TARGETING & METADATA */}
        <div className="rounded-[2.5rem] border border-white/10 bg-[#131B2E]/70 p-6 sm:p-9 space-y-6 shadow-card backdrop-blur-md">
          <h2 className="text-base sm:text-lg font-black text-white border-b border-white/10 pb-3 flex items-center gap-2">
            <Tag className="h-5 w-5 text-sky-400" />
            <span>2. Optional Specifics &amp; Targeting</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                Module Number
              </label>
              <input
                type="text"
                value={moduleNumber}
                onChange={(e) => setModuleNumber(e.target.value)}
                placeholder="e.g. Module 3, Unit 2"
                className="w-full bg-[#0B0F19] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                Topic Name
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. AVL Trees, DTIE Phase 3"
                className="w-full bg-[#0B0F19] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                Assignment / Lab Exp #
              </label>
              <input
                type="text"
                value={assignmentNumber}
                onChange={(e) => setAssignmentNumber(e.target.value)}
                placeholder="e.g. Lab Exp 7, Assignment 2"
                className="w-full bg-[#0B0F19] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                Preferred File Format
              </label>
              <select
                value={preferredFormat}
                onChange={(e) => setPreferredFormat(e.target.value)}
                className="w-full bg-[#0B0F19] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {FORMATS.map((f) => (
                  <option key={f} value={f} className="bg-[#0B0F19]">
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                Academic Year
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="e.g. 2025-2026"
                className="w-full bg-[#0B0F19] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                Need By / Deadline (Optional)
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-[#0B0F19] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">
              Custom Tags (Comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. RecurrenceRelations, InSem2, PughMatrix, GraphTheory"
              className="w-full bg-[#0B0F19] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Anonymous Option */}
          <div className="pt-2 flex items-center gap-3">
            <input
              type="checkbox"
              id="anonymous-check"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-[#0B0F19] text-purple-500 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="anonymous-check" className="text-xs text-white/80 cursor-pointer">
              Post anonymously (Hides your name and avatar from classmates)
            </label>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <Link
            href="/requests"
            className="px-6 py-3 rounded-full text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-indigo-500/30 transition active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <span>Publishing Request...</span>
            ) : (
              <>
                <FileQuestion className="h-4 w-4" />
                <span>Publish Resource Request ➔</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
