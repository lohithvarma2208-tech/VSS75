import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID || '';
const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_SECRET_ACCESS_KEY || '';
const bucketName = process.env.R2_BUCKET_NAME || process.env.CLOUDFLARE_R2_BUCKET || 'klu-vss-files';
const publicDomain = (process.env.R2_PUBLIC_DOMAIN || '').replace(/\/$/, '');

let s3Instance: S3Client | null = null;

export function isR2Configured(): boolean {
  return Boolean(accountId && accessKeyId && secretAccessKey && bucketName);
}

export function getR2Client(): S3Client | null {
  if (!isR2Configured()) return null;
  if (!s3Instance) {
    s3Instance = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return s3Instance;
}

export function getR2BucketName(): string {
  return bucketName;
}

export function getR2PublicDomain(): string {
  return publicDomain;
}

export async function uploadFileToR2(
  fileBuffer: Buffer | Uint8Array,
  key: string,
  contentType: string
): Promise<{ key: string; url: string; size: number }> {
  const client = getR2Client();
  if (!client) {
    throw new Error('Cloudflare R2 is not configured. Missing credentials.');
  }

  const cleanKey = key.replace(/^\/+/, '');
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cleanKey,
    Body: fileBuffer,
    ContentType: contentType,
  });

  await client.send(command);

  const url = publicDomain
    ? `${publicDomain}/${cleanKey}`
    : `/api/r2/download?key=${encodeURIComponent(cleanKey)}`;

  return {
    key: cleanKey,
    url,
    size: fileBuffer.length,
  };
}

export async function getFileFromR2(key: string) {
  const client = getR2Client();
  if (!client) {
    throw new Error('Cloudflare R2 is not configured. Missing credentials.');
  }

  const cleanKey = key.replace(/^\/+/, '');
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: cleanKey,
  });

  return await client.send(command);
}

export async function deleteFileFromR2(key: string): Promise<boolean> {
  const client = getR2Client();
  if (!client) return false;
  try {
    const cleanKey = key.replace(/^\/+/, '');
    await client.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: cleanKey,
    }));
    return true;
  } catch (err) {
    console.warn(`[R2] Failed deleting ${key}:`, err);
    return false;
  }
}

export async function putJsonInR2(key: string, value: unknown) {
  const client = getR2Client();
  if (!client) throw new Error('Cloudflare R2 is not configured. Missing credentials.');
  await client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: key.replace(/^\/+/, ''),
    Body: JSON.stringify(value),
    ContentType: 'application/json; charset=utf-8',
    CacheControl: 'no-store',
  }));
}

export async function listJsonFromR2<T>(prefix: string): Promise<T[]> {
  const client = getR2Client();
  if (!client) throw new Error('Cloudflare R2 is not configured. Missing credentials.');
  const records: T[] = [];
  let continuationToken: string | undefined;

  do {
    const page = await client.send(new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix.replace(/^\/+/, ''),
      ContinuationToken: continuationToken,
      MaxKeys: 500,
    }));
    const objects = (page.Contents || []).filter((item) => item.Key?.endsWith('.json'));
    const values = await Promise.all(objects.map(async (item) => {
      try {
        const response = await client.send(new GetObjectCommand({ Bucket: bucketName, Key: item.Key! }));
        if (!response.Body) return null;
        return JSON.parse(await response.Body.transformToString()) as T;
      } catch {
        return null;
      }
    }));
    for (const value of values) {
      if (value !== null) records.push(value as T);
    }
    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuationToken && records.length < 2500);

  return records;
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 3600
): Promise<{ uploadUrl: string; key: string; finalUrl: string }> {
  const client = getR2Client();
  if (!client) {
    throw new Error('Cloudflare R2 is not configured. Missing credentials.');
  }

  const cleanKey = key.replace(/^\/+/, '');
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cleanKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  const finalUrl = publicDomain
    ? `${publicDomain}/${cleanKey}`
    : `/api/r2/download?key=${encodeURIComponent(cleanKey)}`;

  return {
    uploadUrl,
    key: cleanKey,
    finalUrl,
  };
}

export async function getPresignedDownloadUrl(
  key: string,
  fileName?: string,
  expiresInSeconds = 300,
  disposition: 'attachment' | 'inline' = 'attachment'
): Promise<string> {
  const client = getR2Client();
  if (!client) {
    throw new Error('Cloudflare R2 is not configured. Missing credentials.');
  }

  const cleanKey = key.replace(/^\/+/, '');
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: cleanKey,
    ResponseContentDisposition: fileName
      ? `${disposition}; filename="${fileName.replace(/[\r\n"\\]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
      : disposition,
  });

  return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}
