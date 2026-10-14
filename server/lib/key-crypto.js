import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';
import { ApiError } from './http.js';

const VERSION = 'v1';
const NONCE_BYTES = 12;
const TAG_BYTES = 16;

function deriveEncryptionKey(pepper) {
  if (typeof pepper !== 'string' || Buffer.byteLength(pepper, 'utf8') < 32) {
    throw new ApiError(503, 'خدمة المفاتيح غير جاهزة حاليًا. حاول لاحقًا.');
  }
  return createHmac('sha256', pepper)
    .update('murshid/access-key-encryption/v1', 'utf8')
    .digest();
}

function associatedData(recordId) {
  if (typeof recordId !== 'string' || !recordId) {
    throw new ApiError(400, 'معرّف السجل غير صحيح.');
  }
  return Buffer.from(`murshid-access-key:${VERSION}:${recordId}`, 'utf8');
}

export function encryptAccessKey(accessKey, pepper, recordId) {
  if (typeof accessKey !== 'string' || !accessKey) {
    throw new ApiError(500, 'تعذّر حفظ المفتاح بشكل آمن.');
  }

  const nonce = randomBytes(NONCE_BYTES);
  const cipher = createCipheriv('aes-256-gcm', deriveEncryptionKey(pepper), nonce);
  cipher.setAAD(associatedData(recordId));
  const ciphertext = Buffer.concat([cipher.update(accessKey, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    VERSION,
    nonce.toString('base64url'),
    tag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join('.');
}

export function decryptAccessKey(encryptedValue, pepper, recordId) {
  const encryptionKey = deriveEncryptionKey(pepper);
  const aad = associatedData(recordId);

  try {
    if (typeof encryptedValue !== 'string') throw new Error('Invalid payload');
    const [version, noncePart, tagPart, ciphertextPart, extra] = encryptedValue.split('.');
    if (!version || !noncePart || !tagPart || !ciphertextPart || extra !== undefined || version !== VERSION) {
      throw new Error('Invalid payload');
    }

    const nonce = Buffer.from(noncePart, 'base64url');
    const tag = Buffer.from(tagPart, 'base64url');
    const ciphertext = Buffer.from(ciphertextPart, 'base64url');
    if (nonce.length !== NONCE_BYTES || tag.length !== TAG_BYTES || ciphertext.length === 0) {
      throw new Error('Invalid payload');
    }

    const decipher = createDecipheriv('aes-256-gcm', encryptionKey, nonce);
    decipher.setAAD(aad);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    throw new ApiError(500, 'تعذّر عرض المفتاح.');
  }
}
