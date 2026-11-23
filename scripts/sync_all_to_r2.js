const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const client = new S3Client({
  region: 'auto',
  endpoint: 'https://5a11468c61e056a30c59255a6478a5e2.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '26967347e25e50bef9688e19cf5130b7',
    secretAccessKey: 'a9a1926f20522b577bc8dec0ce1d943e866d3ee8e445903271293b82da6d5779',
  },
});

const BUCKET = 'klu-vss-files';

function getMime(name) {
  const ext = name.split('.').pop().toLowerCase();
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'java') return 'text/x-java-source;charset=utf-8';
  if (ext === 'py') return 'text/x-python;charset=utf-8';
  if (ext === 'v') return 'text/x-verilog;charset=utf-8';
  return 'application/octet-stream';
}

async function syncAll() {
  const dir = path.join(__dirname, '..', 'public', 'samples');
  const files = fs.readdirSync(dir);
  console.log(`Found ${files.length} sample files in public/samples. Syncing to Cloudflare R2 bucket "${BUCKET}"...`);

  for (const f of files) {
    const filePath = path.join(dir, f);
    const bytes = fs.readFileSync(filePath);
    const mime = getMime(f);

    // Upload under samples/<file_name>
    await client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: `samples/${f}`,
        Body: bytes,
        ContentType: mime,
      })
    );

    // Also upload under <file_name> directly for root fallback lookups
    await client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: f,
        Body: bytes,
        ContentType: mime,
      })
    );

    console.log(`✓ Synced to R2: samples/${f} & ${f} (${bytes.length} bytes, ${mime})`);
  }

  console.log('Successfully synced all sample files to Cloudflare R2!');
}

syncAll().catch(console.error);
