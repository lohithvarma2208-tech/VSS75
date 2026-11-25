'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  Download,
  Eye,
} from 'lucide-react';
import { Resource } from '@/types';
import { MockStorageManager } from '@/lib/storage/mock-store';
import { loadSharedResources } from '@/lib/resources/client';
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
    let mounted = true;
    setResources(MockStorageManager.getResources());
    loadSharedResources()
      .then((items) => {
        if (mounted && Array.isArray(items) && items.length > 0) {
          setResources(items);
        }
      })
      .catch(() => {});
    const handleUpdate = () => {
      if (mounted) setResources(MockStorageManager.getResources());
    };
    window.addEventListener('klu_resources_change', handleUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('klu_resources_change', handleUpdate);
    };
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
    <div className="mx-auto max-w-6xl space-y-7 px-4 py-8 sm:px-7 sm:py-12">
      {/* Header */}
      <div>
        <p className="vss-kicker">Course materials</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Academic Notes & Study Resources
        </h1>
        <p className="mt-2 max-w-2xl text-xs sm:text-sm text-white/50 leading-relaxed font-normal">
          Verified lecture notes, handwritten unit summaries, and exam problem solutions shared across KL University.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-white/35" />
          <input
            type="text"
            placeholder="Search notes by subject or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 rounded-2xl border border-white/[0.08] bg-[#121214] pl-11 pr-4 text-xs sm:text-sm text-white placeholder-white/30 focus:border-violet-400/50 focus:outline-none transition"
          />
        </div>

        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="h-11 rounded-2xl border border-white/[0.08] bg-[#121214] px-4 text-xs sm:text-sm text-white/80 focus:border-violet-400/50 focus:outline-none transition"
        >
          <option value="All" className="bg-[#121214] text-white">All Courses</option>
          {SAMPLE_COURSES.map((c) => (
            <option key={c.code} value={c.code} className="bg-[#121214] text-white">
              {c.code} — {c.name}
            </option>
          ))}
        </select>

        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          className="h-11 rounded-2xl border border-white/[0.08] bg-[#121214] px-4 text-xs sm:text-sm text-white/80 focus:border-violet-400/50 focus:outline-none transition"
        >
          <option value="All" className="bg-[#121214] text-white">All Semesters</option>
          {['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'].map((s) => (
            <option key={s} value={s} className="bg-[#121214] text-white">
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Notes List */}
      <div>
        {notesList.length === 0 ? (
          <div className="vss-card p-14 text-center">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.05] text-white/40">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">No study notes shared yet</h3>
            <p className="mt-1.5 text-xs text-white/45 max-w-md mx-auto leading-relaxed">
              Be the first to share clean lecture notes, unit summaries, or exam question bank solutions for your courses.
            </p>
            <Link href="/upload" className="vss-button mt-6 inline-flex">
              Share Notes
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {notesList.map((note) => (
              <div
                key={note.id}
                className="vss-card vss-card-hover p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/[0.055] text-[10px] font-black uppercase text-violet-300">
                    {note.file_type || 'PDF'}
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-violet-300">
                        {note.course_code}
                      </span>
                      <span className="text-white/20">•</span>
                      <span className="text-[11px] text-white/50">{note.semester}</span>
                      <span className="text-white/20">•</span>
                      <span className="text-[11px] text-white/40">{note.category}</span>
                    </div>
                    <Link
                      href={`/resource/${note.id}`}
                      className="block font-bold text-sm sm:text-base text-white/90 hover:text-white transition truncate"
                    >
                      {note.title}
                    </Link>
                    <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">{note.description}</p>
                    <div className="flex items-center gap-3 text-[10px] text-white/35 pt-1 font-mono">
                      <span>{formatDate(note.created_at)}</span>
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
                    className="px-4 py-2 rounded-full border border-white/10 bg-white/[0.04] text-xs font-bold text-white/80 hover:bg-white/10 transition flex items-center gap-1.5"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={() => handleDownload(note)}
                    className="vss-button px-4 py-2 text-xs font-bold"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
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
