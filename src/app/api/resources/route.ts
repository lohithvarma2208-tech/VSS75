import { createHash } from 'node:crypto';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { getErpSession, SESSION_COOKIE } from '@/lib/erp/session';
import { getFileFromR2, isR2Configured, listJsonFromR2, putJsonInR2 } from '@/lib/r2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PREFIX = 'metadata/resources/';
const categories = ['Assignments', 'Programming', 'Lab Records', 'Lab Experiments', 'Mini Projects', 'Major Projects', 'DTIE Projects', 'Mathematics', 'Notes', 'Presentations', 'Reports', 'Study Resources', 'Other Academic Resources'] as const;
const fileTypes = ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xls', 'xlsx', 'zip', 'py', 'java', 'cpp', 'c', 'txt', 'png', 'jpg'] as const;

const resourceSchema = z.object({
  id: z.string().regex(/^res-user-\d{10,18}(?:-[a-z0-9]+)?$/i),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(1).max(2000),
  category: z.enum(categories),
  course_code: z.string().trim().min(2).max(30),
  course_name: z.string().trim().min(2).max(160),
  semester: z.string().trim().max(80),
  academic_year: z.string().trim().max(40),
  resource_type: z.string().trim().min(1).max(100),
  file_name: z.string().trim().min(1).max(200),
  file_url: z.string().min(1).max(1200),
  file_size: z.number().int().nonnegative().max(50 * 1024 * 1024),
  file_type: z.enum(fileTypes),
  file_content_preview: z.string().max(3000).optional(),
  department: z.string().max(200).optional(),
  author_id: z.string().max(100).optional(),
  author_name: z.string().min(1).max(200),
  author_username: z.string().max(100).optional(),
  author_avatar: z.string().max(1000).optional(),
  author_is_verified: z.boolean().optional(),
  is_anonymous: z.boolean(),
  tags: z.array(z.string().max(80)).max(15),
  likes_count: z.number().int().nonnegative().max(10_000_000),
  downloads_count: z.number().int().nonnegative().max(10_000_000),
  views_count: z.number().int().nonnegative().max(10_000_000),
  status: z.enum(['approved', 'pending', 'flagged', 'archived', 'rejected']),
  rejection_reason: z.string().max(500).optional(),
  is_pioneer: z.boolean().optional(),
  duplicate_of_id: z.string().max(100).optional(),
  duplicate_of_title: z.string().max(120).optional(),
  duplicate_of_author: z.string().max(200).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

type SharedResource = z.infer<typeof resourceSchema>;
type StoredResource = { owner: string; resource: SharedResource };

function ownerHash(registrationNumber: string) {
  return createHash('sha256').update(registrationNumber).digest('hex');
}

function metadataKey(id: string) {
  return `${PREFIX}${id}.json`;
}

function isR2ResourceUrl(value: string) {
  try {
    const url = new URL(value, 'https://klu-vss.vercel.app');
    const key = url.searchParams.get('key') || '';
    return url.pathname === '/api/r2/download' && key.startsWith('resources/') && !key.includes('..');
  } catch {
    return false;
  }
}

async function readStored(id: string): Promise<StoredResource | null> {
  try {
    const response = await getFileFromR2(metadataKey(id));
    if (!response.Body) return null;
    return JSON.parse(await response.Body.transformToString()) as StoredResource;
  } catch {
    return null;
  }
}

export async function GET() {
  if (!isR2Configured()) return NextResponse.json({ error: 'Shared resources are unavailable.' }, { status: 503 });
  try {
    const stored = await listJsonFromR2<StoredResource>(PREFIX);
    const parsed = stored
      .map((entry) => resourceSchema.safeParse(entry?.resource))
      .filter((entry): entry is { success: true; data: SharedResource } => entry.success)
      .map((entry) => entry.data)
      .filter((resource) => resource.status === 'approved')
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
    const seenFiles = new Set<string>();
    const resources = parsed.filter((resource) => {
      if (seenFiles.has(resource.file_url)) return false;
      seenFiles.add(resource.file_url);
      return true;
    });
    return NextResponse.json({ resources }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[Shared resources list]', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Could not load shared resources.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value ?? '';
  const profile = token ? await getErpSession(token).catch(() => null) : null;
  if (!profile) return NextResponse.json({ error: 'Sign in again before sharing.' }, { status: 401 });
  if (!isR2Configured()) return NextResponse.json({ error: 'Shared resources are unavailable.' }, { status: 503 });

  try {
    const body = await request.json();
    const input = z.array(resourceSchema).min(1).max(50).safeParse(body?.resources);
    if (!input.success) return NextResponse.json({ error: 'Invalid resource metadata.' }, { status: 400 });
    const owner = ownerHash(profile.rollNumber);
    const saved: string[] = [];

    for (const candidate of input.data) {
      if (!isR2ResourceUrl(candidate.file_url) || candidate.status !== 'approved') continue;
      const previous = await readStored(candidate.id);
      if (previous?.owner && previous.owner !== owner) continue;

      const anonymous = candidate.is_anonymous;
      const resource: SharedResource = {
        ...candidate,
        file_content_preview: candidate.file_content_preview?.slice(0, 3000),
        department: profile.department || candidate.department,
        author_id: anonymous ? undefined : `erp-${profile.rollNumber}`,
        author_name: anonymous ? 'Anonymous' : profile.name,
        author_username: anonymous ? undefined : profile.rollNumber,
        author_avatar: undefined,
        author_is_verified: anonymous ? undefined : true,
        status: 'approved',
        updated_at: new Date().toISOString(),
      };
      await putJsonInR2(metadataKey(resource.id), { owner, resource } satisfies StoredResource);
      saved.push(resource.id);
    }

    return NextResponse.json({ saved }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[Shared resources save]', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Could not publish this resource.' }, { status: 503 });
  }
}
