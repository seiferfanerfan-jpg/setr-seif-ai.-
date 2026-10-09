export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function jsonResponse(payload, status = 200, extraHeaders = {}) {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, max-age=0',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  });
  for (const [name, value] of Object.entries(extraHeaders)) headers.set(name, value);
  return new Response(JSON.stringify(payload), { status, headers });
}

export function methodGuard(request, allowedMethod) {
  if (request.method === allowedMethod) return null;
  return jsonResponse(
    { error: 'طريقة الطلب غير مسموح بها.' },
    405,
    { Allow: allowedMethod },
  );
}

export function hasSameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function readJson(request, maxBytes = 8192) {
  const contentType = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json') {
    throw new ApiError(415, 'أرسل البيانات بصيغة JSON من النموذج الرسمي.');
  }

  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > maxBytes) throw new ApiError(413, 'حجم الطلب أكبر من المسموح.');

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBytes) {
    throw new ApiError(413, 'حجم الطلب أكبر من المسموح.');
  }

  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new ApiError(400, 'تعذّرت قراءة البيانات المرسلة.');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError(400, 'صيغة البيانات غير صحيحة.');
  }
  return value;
}

export function errorResponse(error) {
  if (error instanceof ApiError) return jsonResponse({ error: error.message }, error.status);
  return jsonResponse({ error: 'حصلت مشكلة مؤقتة. حاول مرة تانية بعد شوية.' }, 500);
}
