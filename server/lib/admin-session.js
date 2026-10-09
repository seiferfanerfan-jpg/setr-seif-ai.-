import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { ApiError } from './http.js';

const COOKIE_NAME = 'murshid_admin_session';
const SESSION_MS = 8 * 60 * 60 * 1000;
const SESSION_SECONDS = 8 * 60 * 60;

function getAdminConfig() {
  const password = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  if (
    !password || password.length < 12
    || !sessionSecret || Buffer.byteLength(sessionSecret, 'utf8') < 32
  ) {
    throw new ApiError(503, 'لوحة الإدارة غير مهيأة بعد. تواصل مع المسؤول.');
  }
  return { password, sessionSecret };
}

function signature(payload, sessionSecret, password) {
  return createHmac('sha256', sessionSecret)
    .update(payload, 'utf8')
    .update('\n', 'utf8')
    .update(password, 'utf8')
    .digest('base64url');
}

function cookieAttributes(request) {
  const isHttps = new URL(request.url).protocol === 'https:';
  return `Path=/api/admin; HttpOnly; SameSite=${isHttps ? 'None' : 'Lax'}${isHttps ? '; Secure' : ''}`;
}

export function verifyAdminPassword(candidate) {
  const { password } = getAdminConfig();
  if (typeof candidate !== 'string' || candidate.length > 512) return false;
  const expectedDigest = createHash('sha256').update(password, 'utf8').digest();
  const candidateDigest = createHash('sha256').update(candidate, 'utf8').digest();
  return timingSafeEqual(expectedDigest, candidateDigest);
}

export function createAdminCookie(request) {
  const { password, sessionSecret } = getAdminConfig();
  const payload = Buffer.from(JSON.stringify({ v: 1, exp: Date.now() + SESSION_MS }), 'utf8').toString('base64url');
  const token = `${payload}.${signature(payload, sessionSecret, password)}`;
  return `${COOKIE_NAME}=${token}; ${cookieAttributes(request)}; Max-Age=${SESSION_SECONDS}`;
}

function readCookie(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === COOKIE_NAME) return rest.join('=');
  }
  return '';
}

export function hasAdminSession(request) {
  const token = readCookie(request);
  if (!token) return false;
  const [payload, providedSignature, extra] = token.split('.');
  if (!payload || !providedSignature || extra !== undefined) return false;

  const { password, sessionSecret } = getAdminConfig();
  const expectedSignature = signature(payload, sessionSecret, password);
  const provided = Buffer.from(providedSignature, 'base64url');
  const expected = Buffer.from(expectedSignature, 'base64url');
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return false;

  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return claims.v === 1 && Number.isFinite(claims.exp) && claims.exp > Date.now();
  } catch {
    return false;
  }
}

export function clearAdminCookie(request) {
  return `${COOKIE_NAME}=; ${cookieAttributes(request)}; Max-Age=0`;
}
