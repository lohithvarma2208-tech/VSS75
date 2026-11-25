'use client';

import type { Resource } from '@/types';
import { MockStorageManager } from '@/lib/storage/mock-store';

function isPublishable(resource: Resource) {
  if (!resource.id.startsWith('res-user-') || resource.status !== 'approved') return false;
  if (!resource.file_url) return false;
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const url = new URL(resource.file_url, base);
    const key = url.searchParams.get('key') || url.pathname;
    return key.includes('resources/');
  } catch {
    return false;
  }
}

export async function publishSharedResources(resources: Resource[], authorId?: string) {
  const publishable = resources.filter(isPublishable).map(({ file_data_url: _fileDataUrl, ...resource }) => resource);
  if (!publishable.length) return [];
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authorId) {
    headers['x-vss-author-id'] = authorId;
  }
  const response = await fetch('/api/resources', {
    method: 'POST',
    headers,
    body: JSON.stringify({ resources: publishable }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Could not publish shared resources.');
  return Array.isArray(data.saved) ? (data.saved as string[]) : [];
}

export async function loadSharedResources() {
  const response = await fetch('/api/resources', { cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Could not load shared resources.');
  const resources = Array.isArray(data.resources) ? data.resources as Resource[] : [];
  MockStorageManager.mergeSharedResources(resources);
  return resources;
}

export async function syncSharedResources(_publishLocal = false) {
  return loadSharedResources();
}
