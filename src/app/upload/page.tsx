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

export default function UploadPage() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const { currentUser, showToast } = useApp();
  const [academic, setAcademic] = useState<AcademicContext | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
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

  function chooseFile(next: File) {
    if (next.size > 50 * 1024 * 1024) { setError('Choose a file smaller than 50 MB.'); return; }
    const extension = next.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(extension)) { setError('That file type is not supported yet.'); return; }
    setError(''); setFile(next);

    // Read authentic binary as Data URL for direct PDF & Office document previews/downloads
    const reader = new FileReader();
    reader.onload = (e) => setFileDataUrl(e.target?.result as string);
    reader.readAsDataURL(next);

    if (!title) setTitle(next.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim());
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('');
    if (!currentUser) { setError('Sign in before sharing a resource.'); return; }
    if (!file) { setError('Add a file first.'); return; }
    if (!selectedCourse) { setError('No course is available for this semester. Change your semester in Settings.'); return; }
    if (title.trim().length < 3) { setError('Add a short title.'); return; }
    setSubmitting(true);

    let dataUrl = fileDataUrl;
    if (!dataUrl && typeof window !== 'undefined') {
      try {
        dataUrl = await new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve((r.result as string) || '');
          r.onerror = () => resolve('');
          r.readAsDataURL(file);
        });
      } catch {
        // fallback to blob url
      }
    }

    const objectUrl = typeof window !== 'undefined' ? URL.createObjectURL(file) : '';
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
      file_url: dataUrl || objectUrl || `/samples/${file.name}`,
      file_data_url: dataUrl || undefined,
      file_size: file.size,
      file_type: (ALLOWED_EXTENSIONS.includes(extension) ? extension : 'pdf') as ResourceFileType,
      file_content_preview: preview || undefined,
      author_id: currentUser.id,
      author_name: anonymous ? 'Anonymous' : currentUser.full_name,
      author_username: anonymous ? undefined : currentUser.username,
      author_is_verified: !anonymous && Boolean(currentUser.is_verified_student),
      is_anonymous: anonymous,
      tags: [selectedCourse.code, academic?.semester || currentUser.semester, inferred.category],
      status: 'approved',
    });

    // Store complete authentic file in IndexedDB & Memory Cache under multiple lookup keys
    await storeUploadedFile(created.id, file);
    await storeUploadedFile(file.name, file);
    if (created.file_name !== file.name) await storeUploadedFile(created.file_name, file);
    if (dataUrl) {
      await storeUploadedFile(`${created.id}_data_url`, dataUrl);
      await storeUploadedFile(`${file.name}_data_url`, dataUrl);
      if (created.file_name !== file.name) await storeUploadedFile(`${created.file_name}_data_url`, dataUrl);
    }

    setSubmitting(false);
    if (created.status === 'rejected') { setDuplicate(created); setError(created.rejection_reason || 'This file already exists.'); return; }
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
      {duplicate?.duplicate_of_id && <Link href={`/resource/${duplicate.duplicate_of_id}`} className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-violet-300">Open the existing resource <ArrowRight className="h-3 w-3" /></Link>}

      <form onSubmit={submit} className="mt-5 space-y-4">
        <section className="vss-card p-4 sm:p-5">
          <div className="flex items-center gap-3"><Step number="1" /><span><b className="block text-sm">Add your file</b><small className="text-[10px] text-white/30">PDF, document, slides, code or image · 50 MB max</small></span></div>
          <input ref={fileInput} type="file" className="hidden" accept=".pdf,.docx,.pptx,.zip,.py,.java,.cpp,.c,.txt,.png,.jpg,.jpeg" onChange={(event) => event.target.files?.[0] && chooseFile(event.target.files[0])} />
          {file ? <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.05] p-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-300 text-black"><FileText className="h-4 w-4" /></span><span className="min-w-0 flex-1"><b className="block truncate text-xs">{file.name}</b><small className="text-[9px] text-white/30">{formatBytes(file.size)}</small></span><button type="button" onClick={() => setFile(null)} className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.05] text-white/45"><X className="h-3.5 w-3.5" /></button></div> : <button type="button" onClick={() => fileInput.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); if (event.dataTransfer.files[0]) chooseFile(event.dataTransfer.files[0]); }} className={`mt-4 flex min-h-32 w-full flex-col items-center justify-center rounded-2xl border border-dashed p-5 transition ${dragging ? 'border-violet-300 bg-violet-400/10' : 'border-white/12 bg-white/[0.02] hover:bg-white/[0.04]'}`}><FileUp className="h-5 w-5 text-violet-300" /><b className="mt-3 text-xs">Choose a file</b><small className="mt-1 text-[9px] text-white/28">or drop it here</small></button>}
        </section>

        <section className="vss-card p-4 sm:p-5">
          <div className="flex items-center gap-3"><Step number="2" /><span><b className="block text-sm">Choose the course</b><small className="text-[10px] text-white/30">Only courses relevant to {academic.semester}</small></span></div>
          {courses.length ? <select value={selectedCourse?.code || ''} onChange={(event) => setCourseCode(event.target.value)} className="profile-input mt-4 appearance-none">{courses.map((course) => <option key={course.code} value={course.code} className="bg-[#17171a]">{course.code} · {course.name}</option>)}</select> : <div className="mt-4 rounded-2xl bg-amber-300/[0.06] p-4 text-[10px] leading-5 text-amber-100"><LockKeyhole className="mb-2 h-4 w-4" />No matching courses found. Select the correct semester in Settings.</div>}
        </section>

        <section className="vss-card p-4 sm:p-5">
          <div className="flex items-center gap-3"><Step number="3" /><span><b className="block text-sm">Name it</b><small className="text-[10px] text-white/30">A short title is enough</small></span></div>
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="profile-input mt-4" placeholder="e.g. Unit 3 revision notes" maxLength={120} />
          <textarea value={note} onChange={(event) => setNote(event.target.value)} className="profile-input mt-3 resize-none" rows={2} placeholder="Optional note for classmates" maxLength={400} />
          <button type="button" onClick={() => setAnonymous(!anonymous)} className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-white/[0.025] px-3 py-3 text-left"><span className={`grid h-5 w-5 place-items-center rounded-md border ${anonymous ? 'border-violet-400 bg-violet-400 text-black' : 'border-white/15'}`}>{anonymous && <CheckCircle2 className="h-3.5 w-3.5" />}</span><span><b className="block text-[10px]">Share anonymously</b><small className="text-[9px] text-white/28">Your badge progress still counts privately</small></span></button>
        </section>

        <div className="flex items-start gap-2 px-2 text-[9px] leading-4 text-white/28"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />By sharing, you confirm this is study material you are allowed to distribute. VSS automatically detects its type and prevents duplicates.</div>
        <button type="submit" disabled={submitting || !file || !selectedCourse} className="vss-button min-h-13 w-full disabled:cursor-not-allowed disabled:opacity-35">{submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Sharing…</> : <><BookOpenCheck className="h-4 w-4" /> Share resource <ArrowRight className="h-4 w-4" /></>}</button>
      </form>
    </main>
  );
}

function Step({ number }: { number: string }) { return <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/[0.055] font-mono text-[10px] font-bold text-violet-300">{number}</span>; }
