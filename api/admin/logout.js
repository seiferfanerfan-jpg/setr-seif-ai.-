import {
  errorResponse,
  hasSameOrigin,
  jsonResponse,
  methodGuard,
} from '../../server/lib/http.js';
import { clearAdminCookie } from '../../server/lib/admin-session.js';

export default {
  async fetch(request) {
    const methodError = methodGuard(request, 'POST');
    if (methodError) return methodError;
    if (!hasSameOrigin(request)) return jsonResponse({ error: 'الطلب غير مسموح به.' }, 403);

    try {
      return jsonResponse({ ok: true }, 200, { 'Set-Cookie': clearAdminCookie(request) });
    } catch (error) {
      return errorResponse(error);
    }
  },
};
