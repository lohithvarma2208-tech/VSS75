import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
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
  expiresInSeconds = 3600
): Promise<string> {
  const client = getR2Client();
  if (!client) {
    throw new Error('Cloudflare R2 is not configured. Missing credentials.');
  }

  const cleanKey = key.replace(/^\/+/, '');
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: cleanKey,
    ResponseContentDisposition: fileName ? `attachment; filename="${fileName}"` : undefined,
  });

  return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}
