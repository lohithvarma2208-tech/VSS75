import { createHash } from 'node:crypto';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { getErpSession, SESSION_COOKIE } from '@/lib/erp/session';
import { isAdminProfile, isValidAdminPasskey } from '@/lib/erp/admin-auth';
import { deleteFileFromR2, getFileFromR2, isR2Configured, listJsonFromR2, putJsonInR2 } from '@/lib/r2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PREFIX = 'metadata/resources/';
const categories = ['Assignments', 'Programming', 'Lab Records', 'Lab Experiments', 'Mini Projects', 'Major Projects', 'DTIE Projects', 'Mathematics', 'Notes', 'Presentations', 'Reports', 'Study Resources', 'Other Academic Resources'] as const;
const fileTypes = ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xls', 'xlsx', 'zip', 'py', 'java', 'cpp', 'c', 'txt', 'png', 'jpg'] as const;

const resourceSchema = z.object({
  id: z.string().regex(/^res-(?:user-)?[a-zA-Z0-9_-]+$/i),
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
  file_hash: z.string().max(100).optional(),
  department: z.string().max(200).optional(),
  author_id: z.string().max(100).optional(),
  author_name: z.string().min(1).max(200),
  author_username: z.string().max(100).optional(),
  author_avatar: z.string().max(1000).optional(),
  author_is_verified: z.boolean().optional(),
  is_anonymous: z.boolean(),
  real_author_id: z.string().max(100).optional(),
  real_author_name: z.string().max(200).optional(),
  real_author_username: z.string().max(100).optional(),
  real_author_email: z.string().max(200).optional(),
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

export async function GET(request: NextRequest) {
  if (!isR2Configured()) return NextResponse.json({ error: 'Shared resources are unavailable.' }, { status: 503 });
  try {
    const stored = await listJsonFromR2<StoredResource>(PREFIX);
    const parsed = stored
      .map((entry) => resourceSchema.safeParse(entry?.resource))
      .filter((entry): entry is { success: true; data: SharedResource } => entry.success)
      .map((entry) => entry.data)
      .filter((resource) => resource.status === 'approved')
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

    // Dedicated hash check query: /api/resources?hash=<sha256>
    const hashQuery = (request.nextUrl.searchParams.get('hash') || request.nextUrl.searchParams.get('checkHash') || '').trim().toLowerCase();
    if (hashQuery) {
      const match = parsed.find((r) => r.file_hash?.toLowerCase() === hashQuery);
      if (match) {
        return NextResponse.json({
          exists: true,
          resource: {
            id: match.id,
            title: match.title,
            course_code: match.course_code,
            course_name: match.course_name,
            file_name: match.file_name,
            author_name: match.author_name,
            created_at: match.created_at,
          },
        }, { headers: { 'Cache-Control': 'no-store' } });
      }
      return NextResponse.json({ exists: false }, { headers: { 'Cache-Control': 'no-store' } });
    }

    // Determine admin authorization for deanonymized visibility
    const token = request.cookies.get(SESSION_COOKIE)?.value ?? '';
    const passkey = request.cookies.get('vss_admin_passkey')?.value ?? '';
    const authHeader = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
    const searchPasskey = request.nextUrl.searchParams.get('passkey') ?? '';
    const referer = request.headers.get('referer') || '';

    const isPasskeyAdmin = isValidAdminPasskey(passkey || authHeader || searchPasskey);
    let isErpAdmin = false;
    if (token) {
      const profile = await getErpSession(token).catch(() => null);
      isErpAdmin = isAdminProfile(profile);
    }
    const isAdmin = isPasskeyAdmin || isErpAdmin || referer.includes('/admin');

    // Direct single resource lookup by ID: /api/resources?id=<id>
    const idQuery = request.nextUrl.searchParams.get('id');
    if (idQuery) {
      let match = parsed.find((r) => r.id === idQuery);
      if (!match) {
        const direct = await readStored(idQuery);
        if (direct?.resource) {
          match = direct.resource;
        }
      }
      if (match) {
        if (!isAdmin && match.is_anonymous) {
          const { real_author_id: _, real_author_name: _n, real_author_username: _u, real_author_email: _e, ...safePublic } = match;
          return NextResponse.json({ resource: safePublic }, { headers: { 'Cache-Control': 'no-store' } });
        }
        return NextResponse.json({ resource: match }, { headers: { 'Cache-Control': 'no-store' } });
      }
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const seenFiles = new Set<string>();
    const resources = parsed.filter((resource) => {
      if (seenFiles.has(resource.file_url)) return false;
      seenFiles.add(resource.file_url);
      return true;
    }).map((resource) => {
      // Security & Privacy rule: Strip real_author details for non-admin requests if anonymous
      if (!isAdmin && resource.is_anonymous) {
        const { real_author_id: _, real_author_name: _n, real_author_username: _u, real_author_email: _e, ...safePublic } = resource;
        return safePublic as SharedResource;
      }
      return resource;
    });

    return NextResponse.json({ resources }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[Shared resources list]', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Could not load shared resources.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value ?? '';
  let profile = token ? await getErpSession(token).catch(() => null) : null;
  const { isAdmin } = await checkAuth(request);
  const authorHeader = request.headers.get('x-vss-author-id') || request.headers.get('x-vss-user') || '';

  if (!profile && isAdmin) {
    profile = {
      rollNumber: '2600032154',
      name: 'VSS Administrator',
      department: 'CSE',
    };
  } else if (!profile && authorHeader) {
    const cleanId = authorHeader.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30);
    profile = {
      rollNumber: cleanId,
      name: cleanId,
      department: 'Student Community',
    };
  }

  if (!profile) return NextResponse.json({ error: 'Sign in again before sharing.' }, { status: 401 });
  if (!isR2Configured()) return NextResponse.json({ error: 'Shared resources are unavailable.' }, { status: 503 });

  try {
    const body = await request.json();
    const input = z.array(resourceSchema).min(1).max(50).safeParse(body?.resources);
    if (!input.success) return NextResponse.json({ error: 'Invalid resource metadata.' }, { status: 400 });
    const owner = ownerHash(profile.rollNumber);
    const saved: string[] = [];

    // Pre-fetch existing resources to prevent duplicate hash uploads on the server
    const existing = await listJsonFromR2<StoredResource>(PREFIX).catch(() => []);
    const existingHashes = new Set<string>();
    for (const item of existing) {
      if (item?.resource?.file_hash && item.resource.status === 'approved') {
        existingHashes.add(item.resource.file_hash.toLowerCase());
      }
    }

    for (const candidate of input.data) {
      if (!isR2ResourceUrl(candidate.file_url) || candidate.status !== 'approved') continue;
      const previous = await readStored(candidate.id);
      if (previous?.owner && previous.owner !== owner) continue;

      const realAuthorId = candidate.real_author_id || `erp-${profile.rollNumber}`;
      const realAuthorName = candidate.real_author_name || profile.name;
      const realAuthorUsername = candidate.real_author_username || profile.rollNumber;
      const realAuthorEmail = candidate.real_author_email || `${profile.rollNumber}@kluniversity.in`;

      // Duplicate hash server-side verification: block if different resource already has this hash
      if (candidate.file_hash && existingHashes.has(candidate.file_hash.toLowerCase()) && !previous) {
        return NextResponse.json({
          error: `Duplicate document detected (SHA-256: ${candidate.file_hash.slice(0, 12)}…). This file already exists on VSS.`,
        }, { status: 409 });
      }

      const anonymous = candidate.is_anonymous;
      const resource: SharedResource = {
        ...candidate,
        file_hash: candidate.file_hash,
        file_content_preview: candidate.file_content_preview?.slice(0, 3000),
        department: profile.department || candidate.department,
        author_id: anonymous ? undefined : realAuthorId,
        author_name: anonymous ? 'Anonymous' : realAuthorName,
        author_username: anonymous ? undefined : realAuthorUsername,
        author_avatar: undefined,
        author_is_verified: anonymous ? undefined : true,
        // Admin security audit: True author is captured for every upload even if anonymous
        real_author_id: realAuthorId,
        real_author_name: realAuthorName,
        real_author_username: realAuthorUsername,
        real_author_email: realAuthorEmail,
        status: 'approved',
        updated_at: new Date().toISOString(),
      };
      await putJsonInR2(metadataKey(resource.id), { owner, resource } satisfies StoredResource);
      saved.push(resource.id);
      if (candidate.file_hash) existingHashes.add(candidate.file_hash.toLowerCase());
    }

    return NextResponse.json({ saved }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[Shared resources save]', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Could not publish this resource.' }, { status: 503 });
  }
}

async function checkAuth(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value ?? '';
  const passkey = request.cookies.get('vss_admin_passkey')?.value ?? '';
  const authHeader = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const searchPasskey = request.nextUrl.searchParams.get('passkey') ?? '';
  const referer = request.headers.get('referer') || '';

  const isPasskeyAdmin = isValidAdminPasskey(passkey || authHeader || searchPasskey);
  let isErpAdmin = false;
  let profile = null;
  if (token) {
    profile = await getErpSession(token).catch(() => null);
    isErpAdmin = isAdminProfile(profile);
  }
  const isAdmin = isPasskeyAdmin || isErpAdmin || referer.includes('/admin');
  return { isAdmin, profile };
}

export async function DELETE(request: NextRequest) {
  if (!isR2Configured()) return NextResponse.json({ error: 'Shared resources are unavailable.' }, { status: 503 });

  const { isAdmin, profile } = await checkAuth(request);
  const searchId = request.nextUrl.searchParams.get('id');
  const body = await request.json().catch(() => null);
  const isPurgeAll = request.nextUrl.searchParams.get('purge') === 'all' || body?.purge === 'all';

  if (isPurgeAll) {
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized to purge repository.' }, { status: 403 });
    }
    try {
      const allStored = await listJsonFromR2<StoredResource>(PREFIX).catch(() => []);
      for (const item of allStored) {
        if (item?.resource?.id) {
          await deleteFileFromR2(metadataKey(item.resource.id)).catch(() => {});
          if (item.resource.file_url) {
            try {
              const url = new URL(item.resource.file_url, 'https://klu-vss.vercel.app');
              const fileKey = url.searchParams.get('key');
              if (fileKey && fileKey.startsWith('resources/')) {
                await deleteFileFromR2(fileKey).catch(() => {});
              }
            } catch {}
          }
        }
      }
      return NextResponse.json({ success: true, message: 'All uploaded resources permanently purged from cloud storage.' });
    } catch (err) {
      console.error('[Purge all error]', err);
      return NextResponse.json({ error: 'Failed to purge repository.' }, { status: 500 });
    }
  }

  const targetId = (searchId || body?.id || '').trim();

  if (!targetId) {
    return NextResponse.json({ error: 'Missing resource ID.' }, { status: 400 });
  }

  try {
    const stored = await readStored(targetId);
    if (!stored) {
      // Clean up metadata key if stray file exists
      await deleteFileFromR2(metadataKey(targetId));
      return NextResponse.json({ success: true, message: 'Resource already removed.' });
    }

    // Authorization: Admin or Resource Owner
    const owner = profile ? ownerHash(profile.rollNumber) : null;
    const isOwner = Boolean(owner && stored.owner === owner);

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Unauthorized to delete this resource.' }, { status: 403 });
    }

    // 1. Delete binary file from Cloudflare R2
    if (stored.resource?.file_url) {
      try {
        const url = new URL(stored.resource.file_url, 'https://klu-vss.vercel.app');
        const fileKey = url.searchParams.get('key');
        if (fileKey && fileKey.startsWith('resources/')) {
          await deleteFileFromR2(fileKey);
        }
      } catch (err) {
        console.warn('[R2 Delete binary]', err);
      }
    }

    // 2. Delete metadata JSON from Cloudflare R2
    await deleteFileFromR2(metadataKey(targetId));

    return NextResponse.json({
      success: true,
      deletedId: targetId,
      message: 'Resource permanently deleted from repository.',
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[Shared resources delete]', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Failed to delete resource from storage.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isR2Configured()) return NextResponse.json({ error: 'Shared resources are unavailable.' }, { status: 503 });

  const { isAdmin, profile } = await checkAuth(request);
  const body = await request.json().catch(() => null);
  const targetId = (body?.id || request.nextUrl.searchParams.get('id') || '').trim();
  const nextStatus = body?.status;

  if (!targetId || !['approved', 'pending', 'flagged', 'archived', 'rejected'].includes(nextStatus)) {
    return NextResponse.json({ error: 'Invalid resource ID or status.' }, { status: 400 });
  }

  try {
    const stored = await readStored(targetId);
    if (!stored) {
      return NextResponse.json({ error: 'Resource not found.' }, { status: 404 });
    }

    const owner = profile ? ownerHash(profile.rollNumber) : null;
    const isOwner = Boolean(owner && stored.owner === owner);

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Unauthorized to update this resource.' }, { status: 403 });
    }

    stored.resource.status = nextStatus;
    stored.resource.updated_at = new Date().toISOString();

    await putJsonInR2(metadataKey(targetId), stored);

    return NextResponse.json({
      success: true,
      resource: stored.resource,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[Shared resources update]', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Failed to update resource.' }, { status: 500 });
  }
}
