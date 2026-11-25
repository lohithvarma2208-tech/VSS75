'use client';

import type { Resource } from '@/types';
import { MockStorageManager } from '@/lib/storage/mock-store';

function isPublishable(resource: Resource) {
  if (!resource.id.startsWith('res-user-') || resource.status !== 'approved') return false;
  try {
    const url = new URL(resource.file_url, window.location.origin);
    return url.pathname === '/api/r2/download' && (url.searchParams.get('key') || '').startsWith('resources/');
  } catch {
    return false;
  }
}

export async function publishSharedResources(resources: Resource[]) {
  const publishable = resources.filter(isPublishable).map(({ file_data_url: _fileDataUrl, ...resource }) => resource);
  if (!publishable.length) return [];
  const response = await fetch('/api/resources', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resources: publishable }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Could not publish shared resources.');
  return Array.isArray(data.saved) ? data.saved as string[] : [];
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
