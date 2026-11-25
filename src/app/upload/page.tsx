'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle, ArrowRight, BookOpenCheck, CheckCircle2, FileText,
  FileUp, GraduationCap, Loader2, LockKeyhole, ShieldCheck, X,
} from 'lucide-react';
import type { Resource, ResourceCategory, ResourceFileType, StudentCourse } from '@/types';
import { MockStorageManager } from '@/lib/storage/mock-store';
import { storeUploadedFile } from '@/lib/storage/file-storage';
import { useApp } from '@/lib/context/AppContext';
import { formatBytes } from '@/lib/utils';
import { publishSharedResources } from '@/lib/resources/client';
import { computeFileSha256, checkFileHashOnServer } from '@/lib/resources/hash';
import {
  ACADEMIC_CONTEXT_EVENT, getRelevantCourses, readAcademicContext,
  type AcademicContext,
} from '@/lib/academic-context';

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xls', 'xlsx', 'zip', 'py', 'java', 'cpp', 'c', 'txt', 'png', 'jpg'];

function inferResource(file: File, title: string, course: StudentCourse) {
  const text = `${file.name} ${title} ${course.name}`.toLowerCase();
  const extension = file.name.split('.').pop()?.toLowerCase() || 'pdf';
  if (['py', 'java', 'cpp', 'c', 'zip'].includes(extension) || /code|program|algorithm/.test(text)) return { category: 'Programming' as ResourceCategory, type: 'Code & Practice' };
  if (/lab|experiment|observation/.test(text)) return { category: 'Lab Records' as ResourceCategory, type: 'Lab Material' };
  if (/assignment|worksheet|problem set/.test(text)) return { category: 'Assignments' as ResourceCategory, type: 'Assignment Reference' };
  if (/project|prototype|dtie/.test(text)) return { category: 'Mini Projects' as ResourceCategory, type: 'Project Reference' };
  if (/presentation|slides|ppt/.test(text)) return { category: 'Presentations' as ResourceCategory, type: 'Presentation' };
  return { category: 'Notes' as ResourceCategory, type: 'Study Notes' };
}

async function uploadToR2Storage(file: File, resourceId: string, authorId?: string): Promise<string | null> {
  try {
    const authHeaders: Record<string, string> = authorId ? { 'x-vss-author-id': authorId } : {};
    if (file.size <= 4.5 * 1024 * 1024) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('resourceId', resourceId);
      const res = await fetch('/api/r2/upload', {
        method: 'POST',
        headers: authHeaders,
        body: formData,
      });
      if (res.ok) {
        const json = await res.json();
        if (json.ok && json.url) return json.url;
      }
      const failure = await res.json().catch(() => ({}));
      throw new Error(failure.error || 'The file could not be uploaded.');
    } else {
      const presignRes = await fetch('/api/r2/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || 'application/pdf',
          fileSize: file.size,
          resourceId,
        }),
      });
      if (presignRes.ok) {
        const { uploadUrl, finalUrl } = await presignRes.json();
        if (uploadUrl && finalUrl) {
          const putRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type || 'application/pdf' },
            body: file,
          });
          if (putRes.ok) return finalUrl;
          throw new Error('Cloudflare rejected the file upload. Please retry.');
        }
      }
      const failure = await presignRes.json().catch(() => ({}));
      throw new Error(failure.error || 'The upload link could not be created.');
    }
  } catch (err) {
    console.warn('[R2 Upload] Upload failed', err);
    throw err instanceof Error ? err : new Error('Upload failed. Please try again.');
  }
  throw new Error('Upload failed. Please try again.');
}

export default function UploadPage() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const { currentUser, showToast } = useApp();
  const [academic, setAcademic] = useState<AcademicContext | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string>('');
  const [hashing, setHashing] = useState(false);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [duplicate, setDuplicate] = useState<Resource | null>(null);

  useEffect(() => {
    const sync = () => setAcademic(readAcademicContext(currentUser));
    sync(); window.addEventListener(ACADEMIC_CONTEXT_EVENT, sync);
    return () => window.removeEventListener(ACADEMIC_CONTEXT_EVENT, sync);
  }, [currentUser]);

  const courses = useMemo(() => academic ? getRelevantCourses(currentUser, academic.semester) : [], [academic, currentUser]);
  const selectedCourse = courses.find((item) => item.code === courseCode) || courses[0];

  useEffect(() => {
    if (courses.length && !courses.some((item) => item.code === courseCode)) setCourseCode(courses[0].code);
  }, [courses, courseCode]);

  async function chooseFile(next: File) {
    if (next.size > 4 * 1024 * 1024) { setError('Choose a file smaller than 4 MB.'); return; }
    const extension = next.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(extension)) { setError('That file type is not supported yet.'); return; }
    setError(''); setDuplicate(null); setFile(next);

    if (!title) setTitle(next.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim());

    // Pre-upload cryptographic hash verification
    setHashing(true);
    try {
      const hash = await computeFileSha256(next);
      setFileHash(hash);

      // 1. Check local storage
      const localMatch = MockStorageManager.findResourceByHash(hash);
      if (localMatch) {
        setError(`Duplicate document detected (SHA-256: ${hash.slice(0, 12)}…). This file was already shared as "${localMatch.title}" for ${localMatch.course_code}. Duplicate uploads are prevented.`);
        setDuplicate(localMatch);
        return;
      }

      // 2. Check server storage
      const serverCheck = await checkFileHashOnServer(hash);
      if (serverCheck.exists && serverCheck.resource) {
        setError(`Duplicate document detected (SHA-256: ${hash.slice(0, 12)}…). This file was already shared as "${serverCheck.resource.title}" for ${serverCheck.resource.course_code}. Duplicate uploads are prevented.`);
        setDuplicate({
          id: serverCheck.resource.id,
          title: serverCheck.resource.title,
          course_code: serverCheck.resource.course_code,
          duplicate_of_id: serverCheck.resource.id,
        } as Resource);
      }
    } catch (e) {
      console.warn('Failed to compute file hash', e);
    } finally {
      setHashing(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('');
    if (!currentUser) { setError('Sign in before sharing a resource.'); return; }
    if (!file) { setError('Add a file first.'); return; }
    if (!selectedCourse) { setError('No course is available for this semester. Change your semester in Settings.'); return; }
    if (title.trim().length < 3) { setError('Add a short title.'); return; }
    setSubmitting(true);

    // Compute or re-verify file hash before ANY upload to R2
    let hash = fileHash;
    if (!hash) {
      try {
        hash = await computeFileSha256(file);
        setFileHash(hash);
      } catch {
        setError('Could not verify file integrity. Please re-select the file.');
        setSubmitting(false);
        return;
      }
    }

    // Pre-upload duplicate check: Local and Remote
    const localMatch = MockStorageManager.findResourceByHash(hash);
    if (localMatch) {
      setError(`Duplicate document detected (SHA-256: ${hash.slice(0, 12)}…). This file was already shared as "${localMatch.title}" for ${localMatch.course_code}. Duplicate uploads are prevented.`);
      setDuplicate(localMatch);
      setSubmitting(false);
      return;
    }

    const serverCheck = await checkFileHashOnServer(hash);
    if (serverCheck.exists && serverCheck.resource) {
      setError(`Duplicate document detected (SHA-256: ${hash.slice(0, 12)}…). This file was already shared as "${serverCheck.resource.title}" for ${serverCheck.resource.course_code}. Duplicate uploads are prevented.`);
      setDuplicate({
        id: serverCheck.resource.id,
        title: serverCheck.resource.title,
        course_code: serverCheck.resource.course_code,
        duplicate_of_id: serverCheck.resource.id,
      } as Resource);
      setSubmitting(false);
      return;
    }

    const inferred = inferResource(file, title, selectedCourse);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    let preview = '';
    if (file.type.startsWith('text/') || ['py', 'java', 'cpp', 'c', 'txt'].includes(extension)) {
      preview = (await file.text()).slice(0, 3000);
    } else if (extension === 'pdf') {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
        const arrayBuf = await file.arrayBuffer();
        const doc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuf), isEvalSupported: false }).promise;
        let extracted = '';
        for (let i = 1; i <= Math.min(doc.numPages, 3); i++) {
          const page = await doc.getPage(i);
          const content = await page.getTextContent();
          extracted += content.items.map((it: any) => it.str).join(' ') + '\n';
        }
        preview = extracted.trim().slice(0, 3000);
      } catch (e) {
        console.warn('PDF text extraction fallback', e);
      }
    }

    const pendingResourceId = `res-${Date.now()}`;
    // Attempt persistent Cloudflare R2 upload for multi-device global access
    let r2Url: string;
    try {
      r2Url = await uploadToR2Storage(file, pendingResourceId, currentUser?.id) || '';
      if (!r2Url) throw new Error('Upload failed. Please try again.');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Upload failed. Please try again.');
      setSubmitting(false);
      return;
    }

    const authorRoll = currentUser.student_id || currentUser.username || currentUser.id;
    const authorEmail = currentUser.email || currentUser.university_email || `${authorRoll}@kluniversity.in`;

    const created = MockStorageManager.addResource({
      title: title.trim(),
      description: note.trim() || `Student-shared ${inferred.type.toLowerCase()} for ${selectedCourse.name}.`,
      category: inferred.category,
      course_code: selectedCourse.code,
      course_name: selectedCourse.name,
      semester: academic?.semester || currentUser.semester,
      academic_year: academic?.academicYear || currentUser.academic_year || '',
      resource_type: inferred.type,
      file_name: file.name,
      file_url: r2Url,
      file_size: file.size,
      file_type: (ALLOWED_EXTENSIONS.includes(extension) ? extension : 'pdf') as ResourceFileType,
      file_content_preview: preview || undefined,
      file_hash: hash,
      author_id: currentUser.id,
      author_name: anonymous ? 'Anonymous' : currentUser.full_name,
      author_username: anonymous ? undefined : currentUser.username,
      author_is_verified: !anonymous && Boolean(currentUser.is_verified_student),
      is_anonymous: anonymous,
      // Admin security audit: True author is captured on every upload
      real_author_id: currentUser.id,
      real_author_name: currentUser.full_name,
      real_author_username: currentUser.username,
      real_author_email: authorEmail,
      tags: [selectedCourse.code, academic?.semester || currentUser.semester, inferred.category],
      status: 'approved',
    });

    // Keep a local cache for instant same-device preview; R2 remains the source of truth.
    await storeUploadedFile(created.id, file);
    await storeUploadedFile(file.name, file);
    if (created.file_name !== file.name) await storeUploadedFile(created.file_name, file);

    if (created.status === 'rejected') { setSubmitting(false); setDuplicate(created); setError(created.rejection_reason || 'This file already exists.'); return; }
    try {
      const saved = await publishSharedResources([created], authorRoll);
      if (!saved.includes(created.id)) throw new Error('The shared record was not saved.');
    } catch (failure) {
      setSubmitting(false);
      setError(failure instanceof Error ? `${failure.message} Refresh this page to retry.` : 'The file uploaded, but publishing failed. Refresh to retry.');
      return;
    }
    setSubmitting(false);
    showToast('Resource shared with your course community', 'success');
    router.push(`/resource/${created.id}`);
  }

  if (!academic) return null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-7 sm:px-7 sm:py-11">
      <div className="flex items-start justify-between gap-4">
        <div><p className="vss-kicker">Contribute</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-0.045em]">Share a resource</h1><p className="mt-2 text-xs leading-5 text-white/38">Three quick details. VSS handles the rest.</p></div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-400 text-black"><FileUp className="h-5 w-5" /></span>
      </div>

      <div className="mt-7 flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
        <GraduationCap className="h-4 w-4 shrink-0 text-violet-300" />
        <span className="min-w-0 flex-1"><b className="block text-[11px]">{academic.semester}</b><small className="block truncate text-[9px] text-white/30">{courses.length} relevant courses · {academic.source === 'erp' ? 'Synced from ERP' : 'Student preference'}</small></span>
        <Link href="/settings" className="text-[10px] font-bold text-violet-300">Change</Link>
      </div>

      {error && <div className="mt-5 flex items-start gap-2 rounded-2xl border border-rose-400/20 bg-rose-400/[0.08] p-3.5 text-xs leading-5 text-rose-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
      {(duplicate?.duplicate_of_id || duplicate?.id) && (
        <div className="mt-2">
          <Link href={`/resource/${duplicate.duplicate_of_id || duplicate.id}`} className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-300 hover:text-violet-200">
            Open the existing pioneer resource <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      <form onSubmit={submit} className="mt-5 space-y-4">
        <section className="vss-card p-4 sm:p-5">
          <div className="flex items-center gap-3"><Step number="1" /><span><b className="block text-sm">Add your file</b><small className="text-[10px] text-white/30">PDF, document, slides, code or image · 4 MB max · Auto-hashed for integrity</small></span></div>
          <input ref={fileInput} type="file" className="hidden" accept=".pdf,.docx,.pptx,.zip,.py,.java,.cpp,.c,.txt,.png,.jpg,.jpeg" onChange={(event) => event.target.files?.[0] && chooseFile(event.target.files[0])} />
          {file ? (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.05] p-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-300 text-black">
                <FileText className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <b className="block truncate text-xs">{file.name}</b>
                <small className="block truncate text-[9px] text-white/40 font-mono">
                  {formatBytes(file.size)}
                  {fileHash ? ` · SHA-256: ${fileHash.slice(0, 12)}…` : hashing ? ' · Verifying hash…' : ''}
                </small>
              </span>
              {hashing && <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />}
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setFileHash('');
                  setDuplicate(null);
                  setError('');
                }}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.05] text-white/45 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => { event.preventDefault(); setDragging(false); if (event.dataTransfer.files[0]) chooseFile(event.dataTransfer.files[0]); }}
              className={`mt-4 flex min-h-32 w-full flex-col items-center justify-center rounded-2xl border border-dashed p-5 transition ${dragging ? 'border-violet-300 bg-violet-400/10' : 'border-white/12 bg-white/[0.02] hover:bg-white/[0.04]'}`}
            >
              <FileUp className="h-5 w-5 text-violet-300" />
              <b className="mt-3 text-xs">Choose a file</b>
              <small className="mt-1 text-[9px] text-white/28">or drop it here</small>
            </button>
          )}
        </section>

        <section className="vss-card p-4 sm:p-5">
          <div className="flex items-center gap-3"><Step number="2" /><span><b className="block text-sm">Choose the course</b><small className="text-[10px] text-white/30">Only courses relevant to {academic.semester}</small></span></div>
          {courses.length ? <select value={selectedCourse?.code || ''} onChange={(event) => setCourseCode(event.target.value)} className="profile-input mt-4 appearance-none">{courses.map((course) => <option key={course.code} value={course.code} className="bg-[#17171a]">{course.code} · {course.name}</option>)}</select> : <div className="mt-4 rounded-2xl bg-amber-300/[0.06] p-4 text-[10px] leading-5 text-amber-100"><LockKeyhole className="mb-2 h-4 w-4" />No matching courses found. Select the correct semester in Settings.</div>}
        </section>

        <section className="vss-card p-4 sm:p-5">
          <div className="flex items-center gap-3"><Step number="3" /><span><b className="block text-sm">Name it</b><small className="text-[10px] text-white/30">A short title is enough</small></span></div>
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="profile-input mt-4" placeholder="e.g. Unit 3 revision notes" maxLength={120} />
          <textarea value={note} onChange={(event) => setNote(event.target.value)} className="profile-input mt-3 resize-none" rows={2} placeholder="Optional note for classmates" maxLength={400} />
          <button type="button" onClick={() => setAnonymous(!anonymous)} className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-white/[0.025] px-3 py-3 text-left"><span className={`grid h-5 w-5 place-items-center rounded-md border ${anonymous ? 'border-violet-400 bg-violet-400 text-black' : 'border-white/15'}`}>{anonymous && <CheckCircle2 className="h-3.5 w-3.5" />}</span><span><b className="block text-[10px]">Share anonymously</b><small className="text-[9px] text-white/28">Classmates see Anonymous. Admin security records apply.</small></span></button>
        </section>

        <div className="flex items-start gap-2 px-2 text-[9px] leading-4 text-white/28"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />By sharing, you confirm this is study material you are allowed to distribute. VSS hashes files to prevent duplicate uploads and protect storage.</div>
        <button type="submit" disabled={submitting || hashing || !file || !selectedCourse || Boolean(duplicate)} className="vss-button min-h-13 w-full disabled:cursor-not-allowed disabled:opacity-35">{submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Sharing…</> : <><BookOpenCheck className="h-4 w-4" /> Share resource <ArrowRight className="h-4 w-4" /></>}</button>
      </form>
    </main>
  );
}

function Step({ number }: { number: string }) { return <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/[0.055] font-mono text-[10px] font-bold text-violet-300">{number}</span>; }
