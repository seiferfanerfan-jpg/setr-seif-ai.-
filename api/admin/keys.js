import { getKeyPepper, getSql } from '../../server/lib/db.js';
import {
  ApiError,
  errorResponse,
  hasSameOrigin,
  jsonResponse,
  readJson,
} from '../../server/lib/http.js';
import { hasAdminSession } from '../../server/lib/admin-session.js';
import { decryptAccessKey } from '../../server/lib/key-crypto.js';

const RECORD_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function methodNotAllowed() {
  return jsonResponse({ error: 'طريقة الطلب غير مسموح بها.' }, 405, { Allow: 'GET, POST, DELETE' });
}

function validateRecordId(value) {
  if (typeof value !== 'string' || !RECORD_ID_PATTERN.test(value)) {
    throw new ApiError(400, 'معرّف السجل غير صحيح.');
  }
  return value;
}

export default {
  async fetch(request) {
    if (!['GET', 'POST', 'DELETE'].includes(request.method)) return methodNotAllowed();

    const origin = request.headers.get('origin');
    if (request.method !== 'GET' && !hasSameOrigin(request)) {
      return jsonResponse({ error: 'الطلب غير مسموح به.' }, 403);
    }
    if (request.method === 'GET' && origin && !hasSameOrigin(request)) {
      return jsonResponse({ error: 'الطلب غير مسموح به.' }, 403);
    }

    try {
      if (!hasAdminSession(request)) {
        return jsonResponse({ error: 'سجّل الدخول إلى لوحة الإدارة أولًا.' }, 401);
      }
      const sql = getSql();

      if (request.method === 'GET') {
        const rows = await sql`
          SELECT id, full_name, email, name_prefix, status, created_at,
                 encrypted_key IS NOT NULL AS key_available
          FROM public.access_key_records
          ORDER BY created_at DESC
          LIMIT 200
        `;
        const records = rows.map((row) => ({
          id: row.id,
          fullName: row.full_name,
          email: row.email,
          keyHint: `${row.name_prefix}••••••••.مرشد`,
          keyAvailable: Boolean(row.key_available),
          status: row.status,
          createdAt: new Date(row.created_at).toISOString(),
        }));
        return jsonResponse({ records });
      }

      if (request.method === 'POST') {
        const body = await readJson(request, 2048);
        if (body.action !== 'reveal') throw new ApiError(400, 'نوع الإجراء غير صحيح.');
        const id = validateRecordId(body.id);
        const rows = await sql`
          SELECT encrypted_key
          FROM public.access_key_records
          WHERE id = ${id}
          LIMIT 1
        `;
        if (!rows.length) return jsonResponse({ error: 'السجل غير موجود.' }, 404);
        if (!rows[0].encrypted_key) {
          return jsonResponse({ error: 'هذا مفتاح قديم حُفظت بصمته فقط، ولا يمكن استرجاع نصه.' }, 410);
        }
        const key = decryptAccessKey(rows[0].encrypted_key, getKeyPepper(), id);
        return jsonResponse(
          { key },
          200,
          { 'Cache-Control': 'no-store, max-age=0', Pragma: 'no-cache' },
        );
      }

      const body = await readJson(request, 2048);
      const id = validateRecordId(body.id);
      const deleted = await sql`
        DELETE FROM public.access_key_records
        WHERE id = ${id}
        RETURNING id
      `;
      if (!deleted.length) return jsonResponse({ error: 'السجل غير موجود.' }, 404);
      return jsonResponse({ ok: true });
    } catch (error) {
      return errorResponse(error);
    }
  },
};
