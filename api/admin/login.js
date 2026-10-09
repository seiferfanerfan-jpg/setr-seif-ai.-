import {
  getClientAddress,
  getKeyPepper,
  hitRateLimit,
  hmacHex,
} from '../../server/lib/db.js';
import {
  ApiError,
  errorResponse,
  hasSameOrigin,
  jsonResponse,
  methodGuard,
  readJson,
} from '../../server/lib/http.js';
import { createAdminCookie, verifyAdminPassword } from '../../server/lib/admin-session.js';

export default {
  async fetch(request) {
    const methodError = methodGuard(request, 'POST');
    if (methodError) return methodError;
    if (!hasSameOrigin(request)) return jsonResponse({ error: 'الطلب غير مسموح به.' }, 403);

    try {
      const body = await readJson(request, 4096);
      const password = typeof body.password === 'string' ? body.password : '';
      if (!password || password.length > 512) {
        throw new ApiError(400, 'اكتب كلمة المرور.');
      }

      const pepper = getKeyPepper();
      const fingerprint = hmacHex(`admin-login:${getClientAddress(request)}`, pepper);
      const isLimited = await hitRateLimit({
        scope: 'admin_login_ip',
        fingerprint,
        limit: 5,
        windowSeconds: 900,
      });
      if (isLimited) {
        return jsonResponse({ error: 'محاولات كثيرة. حاول تسجيل الدخول بعد قليل.' }, 429);
      }

      if (!verifyAdminPassword(password)) {
        return jsonResponse({ error: 'كلمة المرور غير صحيحة.' }, 401);
      }

      return jsonResponse(
        { ok: true },
        200,
        { 'Set-Cookie': createAdminCookie(request) },
      );
    } catch (error) {
      return errorResponse(error);
    }
  },
};
