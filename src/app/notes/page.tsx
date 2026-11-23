'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  Download,
  Eye,
  FileText,
} from 'lucide-react';
import { Resource } from '@/types';
import { MockStorageManager } from '@/lib/storage/mock-store';
import { SAMPLE_COURSES } from '@/lib/data/sample-data';
import { formatBytes, formatDate, triggerBrowserDownload, dataUrlToBlob, triggerBlobDownload } from '@/lib/utils';
import { getUploadedFile } from '@/lib/storage/file-storage';
import { useApp } from '@/lib/context/AppContext';
import ResourcePreviewModal from '@/components/resources/ResourcePreviewModal';

export default function NotesPage() {
  const { showToast } = useApp();
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);

  useEffect(() => {
    setResources(MockStorageManager.getResources());
    const handleUpdate = () => setResources(MockStorageManager.getResources());
    window.addEventListener('klu_resources_change', handleUpdate);
    return () => window.removeEventListener('klu_resources_change', handleUpdate);
  }, []);

  const notesList = useMemo(() => {
    let result = resources.filter(
      (r) =>
        r.category === 'Notes' ||
        r.category === 'Study Resources' ||
        r.category === 'Mathematics' ||
        (r.resource_type || '').toLowerCase().includes('note') ||
        (r.tags || []).some((t) => (t || '').toLowerCase().includes('note'))
    );

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.course_code.toLowerCase().includes(q)
      );
    }

    if (selectedCourse !== 'All') {
      result = result.filter((r) => r.course_code === selectedCourse);
    }

    if (selectedSemester !== 'All') {
      result = result.filter((r) => r.semester === selectedSemester);
    }

    return result;
  }, [resources, searchQuery, selectedCourse, selectedSemester]);

  const handleDownload = async (res: Resource) => {
    MockStorageManager.incrementDownload(res.id);

    // 1. Check IndexedDB/Memory store for authentic uploaded file
    const stored = (await getUploadedFile(res.id)) || (await getUploadedFile(res.file_name));
    if (stored) {
      if (stored instanceof Blob) {
        triggerBlobDownload(stored, res.file_name);
        showToast(`Downloaded ${res.file_name}`, 'success');
        return;
      } else if (typeof stored === 'string' && stored.startsWith('data:')) {
        triggerBlobDownload(dataUrlToBlob(stored), res.file_name);
        showToast(`Downloaded ${res.file_name}`, 'success');
        return;
      }
    }

    // 2. Check stored data URL
    const storedDataUrl = (await getUploadedFile(`${res.id}_data_url`)) || (await getUploadedFile(`${res.file_name}_data_url`));
    if (typeof storedDataUrl === 'string' && storedDataUrl.startsWith('data:')) {
      triggerBlobDownload(dataUrlToBlob(storedDataUrl), res.file_name);
      showToast(`Downloaded ${res.file_name}`, 'success');
      return;
    }

    const targetUrl = res.file_url || res.file_data_url;
    const ok = await triggerBrowserDownload(
      res.file_name,
      targetUrl,
      undefined,
      res.file_content_preview,
      {
        id: res.id,
        title: res.title,
        course: `${res.course_code} - ${res.course_name}`,
        description: res.description,
      }
    );
    if (ok) {
      showToast(`Downloaded ${res.file_name}`, 'success');
    } else {
      showToast('Original PDF unavailable. Please try again later.', 'error');
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-7 px-4 py-7 sm:px-8 sm:py-10 lg:px-12">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#C084FC] font-mono">
          Handwritten & Unit Summaries
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-1">
          Academic Notes & Study Resources
        </h1>
        <p className="text-xs sm:text-sm text-white/70 mt-1 font-normal">
          Handwritten classroom notes, unit summaries, exam question bank solutions, and formula cheatsheets.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-white/50" />
          <input
            type="text"
            placeholder="Search notes by subject or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 rounded-full border border-white/15 bg-[#131B2E] pl-11 pr-4 text-xs sm:text-sm text-white placeholder-white/50 focus:border-purple-500 focus:outline-none shadow-card"
          />
        </div>

        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="h-11 rounded-full border border-white/15 bg-[#131B2E] px-4 text-xs sm:text-sm text-white font-medium focus:border-purple-500 focus:outline-none shadow-card"
        >
          <option value="All" className="bg-[#131B2E] text-white">All Courses</option>
          {SAMPLE_COURSES.map((c) => (
            <option key={c.code} value={c.code} className="bg-[#131B2E] text-white">
              {c.code} — {c.name}
            </option>
          ))}
        </select>

        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          className="h-11 rounded-full border border-white/15 bg-[#131B2E] px-4 text-xs sm:text-sm text-white font-medium focus:border-purple-500 focus:outline-none shadow-card"
        >
          <option value="All" className="bg-[#131B2E] text-white">All Semesters</option>
          {['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'].map((s) => (
            <option key={s} value={s} className="bg-[#131B2E] text-white">
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {notesList.length === 0 ? (
          <div className="p-16 text-center rounded-[2.5rem] border border-dashed border-white/15 bg-[#131B2E]/50">
            <BookOpen className="h-12 w-12 text-white/30 mx-auto mb-3" />
            <p className="text-sm font-bold text-white">No study notes found</p>
            <p className="text-xs text-white/50 mt-1">Try broadening your search or resetting filters.</p>
          </div>
        ) : (
          notesList.map((note) => (
            <div
              key={note.id}
              className="p-6 rounded-[2rem] border border-white/10 bg-[#131B2E]/80 hover:border-purple-500/50 hover:bg-[#1A243B] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-card"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3.5 rounded-2xl bg-purple-500/15 text-[#D8B4FE] border border-purple-500/30 shrink-0">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-purple-500/15 text-[#D8B4FE] border border-purple-500/30">
                      {note.category}
                    </span>
                    <span className="font-mono text-xs font-bold text-white bg-white/10 px-2.5 py-0.5 rounded-full">
                      {note.course_code}
                    </span>
                    <span className="text-xs text-white/50">{note.semester}</span>
                  </div>
                  <Link
                    href={`/resource/${note.id}`}
                    className="block font-bold text-base text-white hover:text-[#D8B4FE] transition"
                  >
                    {note.title}
                  </Link>
                  <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">{note.description}</p>
                  <div className="flex items-center gap-3 text-[11px] text-white/40 pt-1 font-mono">
                    <span>Uploaded on {formatDate(note.created_at)}</span>
                    <span>•</span>
                    <span>{formatBytes(note.file_size)}</span>
                    <span>•</span>
                    <span>{note.downloads_count} downloads</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => setPreviewResource(note)}
                  className="px-4 py-2 rounded-full border border-white/20 text-xs font-bold text-white hover:bg-white/10 transition flex items-center gap-1.5"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => handleDownload(note)}
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs font-extrabold shadow-md shadow-indigo-500/25 transition flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {previewResource && (
        <ResourcePreviewModal
          isOpen={Boolean(previewResource)}
          onClose={() => setPreviewResource(null)}
          resource={previewResource}
        />
      )}
    </div>
  );
}
