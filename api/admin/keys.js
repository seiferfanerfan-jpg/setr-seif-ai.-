import { getSql } from '../../server/lib/db.js';
import {
  ApiError,
  errorResponse,
  hasSameOrigin,
  jsonResponse,
  readJson,
} from '../../server/lib/http.js';
import { hasAdminSession } from '../../server/lib/admin-session.js';

function methodNotAllowed() {
  return jsonResponse({ error: 'طريقة الطلب غير مسموح بها.' }, 405, { Allow: 'GET, DELETE' });
}

export default {
  async fetch(request) {
    if (request.method !== 'GET' && request.method !== 'DELETE') return methodNotAllowed();
    const origin = request.headers.get('origin');
    if ((request.method === 'DELETE' || origin) && !hasSameOrigin(request)) {
      return jsonResponse({ error: 'الطلب غير مسموح به.' }, 403);
    }

    try {
      if (!hasAdminSession(request)) return jsonResponse({ error: 'سجّل الدخول إلى لوحة الإدارة أولًا.' }, 401);
      const sql = getSql();

      if (request.method === 'GET') {
        const rows = await sql`
          SELECT id, full_name, email, name_prefix, status, created_at
          FROM public.access_key_records
          ORDER BY created_at DESC
          LIMIT 200
        `;
        const records = rows.map((row) => ({
          id: row.id,
          fullName: row.full_name,
          email: row.email,
          keyHint: `${row.name_prefix}••••••••.مرشد`,
          status: row.status,
          createdAt: new Date(row.created_at).toISOString(),
        }));
        return jsonResponse({ records });
      }

      if (!hasSameOrigin(request)) return jsonResponse({ error: 'الطلب غير مسموح به.' }, 403);
      const body = await readJson(request, 2048);
      const id = typeof body.id === 'string' ? body.id : '';
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(id)) {
        throw new ApiError(400, 'معرّف السجل غير صحيح.');
      }
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
