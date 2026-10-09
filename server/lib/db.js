import { createHmac } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { ApiError } from './http.js';

let cachedConnectionString = '';
let cachedSql = null;

export function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new ApiError(503, 'خدمة إصدار المفاتيح غير جاهزة حاليًا. حاول لاحقًا.');
  }
  if (cachedSql && cachedConnectionString === connectionString) return cachedSql;

  try {
    cachedSql = neon(connectionString);
    cachedConnectionString = connectionString;
    return cachedSql;
  } catch {
    throw new ApiError(503, 'خدمة إصدار المفاتيح غير جاهزة حاليًا. حاول لاحقًا.');
  }
}

export function getKeyPepper() {
  const pepper = process.env.ACCESS_KEY_PEPPER;
  if (!pepper || Buffer.byteLength(pepper, 'utf8') < 32) {
    throw new ApiError(503, 'خدمة إصدار المفاتيح غير جاهزة حاليًا. حاول لاحقًا.');
  }
  return pepper;
}

export function hmacHex(value, secret) {
  return createHmac('sha256', secret).update(value, 'utf8').digest('hex');
}

export function getClientAddress(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const address = forwarded?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')?.trim()
    || 'unknown';
  return address.slice(0, 100);
}

export async function hitRateLimit({ scope, fingerprint, limit, windowSeconds }) {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO public.request_rate_limits AS current_window
      (scope, fingerprint, window_started_at, request_count)
    VALUES (${scope}, ${fingerprint}, now(), 1)
    ON CONFLICT (scope, fingerprint)
    DO UPDATE SET
      window_started_at = CASE
        WHEN current_window.window_started_at <= now() - make_interval(secs => ${windowSeconds})
          THEN now()
        ELSE current_window.window_started_at
      END,
      request_count = CASE
        WHEN current_window.window_started_at <= now() - make_interval(secs => ${windowSeconds})
          THEN 1
        ELSE current_window.request_count + 1
      END
    RETURNING request_count
  `;
  return Number(rows[0]?.request_count ?? limit + 1) > limit;
}
