import { createHmac, createHash } from 'crypto';
import { createReadStream } from 'fs';
import { stat, unlink } from 'fs/promises';
import { request as httpsRequest } from 'node:https';
import { request as httpRequest } from 'node:http';

export function isS3Enabled() {
  return Boolean(
    process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
  );
}

function hmac(key: Buffer | string, data: string) {
  return createHmac('sha256', key).update(data, 'utf8').digest();
}

function sha256Hex(data: string) {
  return createHash('sha256').update(data, 'utf8').digest('hex');
}

function amzTimestamp(date = new Date()) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
}

export async function putS3Object(key: string, filePath: string, contentType: string) {
  const bucket = String(process.env.S3_BUCKET);
  const accessKey = String(process.env.S3_ACCESS_KEY_ID);
  const secret = String(process.env.S3_SECRET_ACCESS_KEY);
  const region = process.env.S3_REGION || 'auto';
  const endpoint = (process.env.S3_ENDPOINT || '').replace(/\/$/, '');
  const payloadHash = 'UNSIGNED-PAYLOAD';
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');

  let host: string;
  let canonicalUri: string;
  let url: string;
  if (endpoint) {
    host = new URL(endpoint).host;
    canonicalUri = `/${bucket}/${encodedKey}`;
    url = `${endpoint}/${bucket}/${encodedKey}`;
  } else {
    host = `${bucket}.s3.${region}.amazonaws.com`;
    canonicalUri = `/${encodedKey}`;
    url = `https://${host}/${encodedKey}`;
  }

  const fileStat = await stat(filePath);
  const amzDate = amzTimestamp();
  const dateStamp = amzDate.slice(0, 8);
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const canonicalRequest = ['PUT', canonicalUri, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, sha256Hex(canonicalRequest)].join('\n');
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${secret}`, dateStamp), region), 's3'), 'aws4_request');
  const signature = createHmac('sha256', signingKey).update(stringToSign, 'utf8').digest('hex');
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const parsed = new URL(url);
  const requester = parsed.protocol === 'http:' ? httpRequest : httpsRequest;

  await new Promise<void>((resolve, reject) => {
    const req = requester(
      parsed,
      {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(fileStat.size),
          Host: host,
          'x-amz-content-sha256': payloadHash,
          'x-amz-date': amzDate,
          Authorization: authorization,
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk as Buffer));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
            return;
          }
          reject(new Error(`העלאה לענן נכשלה (${res.statusCode || 0})`));
        });
      }
    );
    req.on('error', reject);
    createReadStream(filePath).pipe(req);
  });

  const publicBase = (process.env.S3_PUBLIC_BASE_URL || '').replace(/\/$/, '');
  return publicBase ? `${publicBase}/${encodedKey}` : url;
}

export async function removeLocalCopy(filePath: string) {
  await unlink(filePath).catch(() => undefined);
}
