/**
 * SHA-256 Hashing and Integrity Verification for VSS Documents
 * Ensures duplicate detection before any storage or Cloudflare R2 upload.
 */

export async function computeFileSha256(file: File | Blob): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Node.js fallback if executed in Node runtime
  try {
    const nodeCrypto = await import('node:crypto');
    const buffer = Buffer.from(await file.arrayBuffer());
    return nodeCrypto.createHash('sha256').update(buffer).digest('hex');
  } catch {
    throw new Error('Cryptographic hashing is not supported in this environment.');
  }
}

export interface HashCheckResult {
  exists: boolean;
  resource?: {
    id: string;
    title: string;
    course_code: string;
    course_name?: string;
    file_name: string;
    author_name?: string;
    created_at?: string;
  };
}

export async function checkFileHashOnServer(hash: string): Promise<HashCheckResult> {
  if (!hash || hash.length < 32) return { exists: false };
  try {
    const response = await fetch(`/api/resources?hash=${encodeURIComponent(hash)}`, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!response.ok) return { exists: false };
    const data = await response.json();
    return {
      exists: Boolean(data.exists),
      resource: data.resource,
    };
  } catch {
    return { exists: false };
  }
}
