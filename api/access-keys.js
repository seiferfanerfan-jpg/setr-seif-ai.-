import { randomUUID } from 'node:crypto';
import {
  getClientAddress,
  getKeyPepper,
  getSql,
  hitRateLimit,
  hmacHex,
} from '../server/lib/db.js';
import {
  ApiError,
  errorResponse,
  hasSameOrigin,
  jsonResponse,
  methodGuard,
  readJson,
} from '../server/lib/http.js';
import { digestAccessKey, firstFourLetters, generateAccessKey, normalizeName } from '../server/lib/key.js';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function validateRequest(body) {
  if (typeof body.website === 'string' && body.website.trim()) {
    throw new ApiError(400, 'تعذّرت معالجة الطلب.');
  }
  if (typeof body.name !== 'string' || typeof body.email !== 'string') {
    throw new ApiError(400, 'اكتب الاسم والبريد الإلكتروني كنصّين صالحين.');
  }

  const name = normalizeName(body.name);
  const email = normalizeEmail(body.email);
  if (Array.from(name).length < 2 || Array.from(name).length > 120) {
    throw new ApiError(400, 'اكتب اسمًا من حرفين إلى 120 حرفًا.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(email) || email.length > 254) {
    throw new ApiError(400, 'اكتب بريدًا إلكترونيًا صحيحًا.');
  }
  if (body.consent !== true) {
    throw new ApiError(400, 'وافق على إشعار الخصوصية قبل توليد المفتاح.');
  }

  const prefix = firstFourLetters(name);
  if (!/\p{L}/u.test(prefix)) throw new ApiError(400, 'اكتب اسمًا يحتوي على حروف.');
  return { name, email, prefix };
}

export default {
  async fetch(request) {
    const methodError = methodGuard(request, 'POST');
    if (methodError) return methodError;
    if (!hasSameOrigin(request)) return jsonResponse({ error: 'الطلب غير مسموح به.' }, 403);

    try {
      const body = await readJson(request);
      const { name, email, prefix } = validateRequest(body);
      const pepper = getKeyPepper();
      const address = getClientAddress(request);
      const addressFingerprint = hmacHex(`key-generation-ip:${address}`, pepper);
      const emailFingerprint = hmacHex(`key-generation-email:${email}`, pepper);

      const ipLimited = await hitRateLimit({
        scope: 'key_generation_ip',
        fingerprint: addressFingerprint,
        limit: 5,
        windowSeconds: 3600,
      });
      const emailLimited = await hitRateLimit({
        scope: 'key_generation_email',
        fingerprint: emailFingerprint,
        limit: 2,
        windowSeconds: 86400,
      });
      if (ipLimited || emailLimited) {
        return jsonResponse({ error: 'وصلت للحد المؤقت لطلبات المفاتيح. حاول لاحقًا.' }, 429);
      }

      const { key } = generateAccessKey(name);
      const keyDigest = digestAccessKey(key, pepper);
      const sql = getSql();
      await sql`
        INSERT INTO public.access_key_records
          (id, full_name, email, name_prefix, key_digest, consent_at)
        VALUES
          (${randomUUID()}, ${name}, ${email}, ${prefix}, ${keyDigest}, now())
      `;

      return jsonResponse({ key }, 201, { 'Referrer-Policy': 'no-referrer' });
    } catch (error) {
      return errorResponse(error);
    }
  },
};
