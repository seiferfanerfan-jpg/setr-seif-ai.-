import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdminCookie, hasAdminSession, verifyAdminPassword } from '../server/lib/admin-session.js';
import { ApiError, hasSameOrigin, readJson } from '../server/lib/http.js';
import { digestAccessKey, firstFourLetters, generateAccessKey, normalizeName } from '../server/lib/key.js';
import accessKeysApi from '../api/access-keys.js';

function withAdminEnvironment(callback) {
  const previousPassword = process.env.ADMIN_PASSWORD;
  const previousSecret = process.env.ADMIN_SESSION_SECRET;
  process.env.ADMIN_PASSWORD = 'unit-test-admin-password';
  process.env.ADMIN_SESSION_SECRET = 'session-secret-for-unit-tests-0001';
  try {
    callback();
  } finally {
    if (previousPassword === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = previousPassword;
    if (previousSecret === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = previousSecret;
  }
}

test('normalizes names and takes the first four letters, skipping spaces and marks', () => {
  const name = normalizeName('  سَيْف   عرفان  ');
  assert.equal(name, 'سَيْف عرفان');
  assert.equal(firstFourLetters(name), 'سيفع');
});

test('generates a unique-looking key with the name prefix and required suffix', () => {
  const first = generateAccessKey('Seif Erfan');
  const second = generateAccessKey('Seif Erfan');
  assert.equal(first.prefix, 'Seif');
  assert.match(first.key, /^Seif-[A-Za-z0-9_-]{43}\.مرشد$/u);
  assert.notEqual(first.key, second.key);
  assert.match(digestAccessKey(first.key, 'a'.repeat(40)), /^[0-9a-f]{64}$/u);
  assert.notEqual(digestAccessKey(first.key, 'a'.repeat(40)), digestAccessKey(first.key, 'b'.repeat(40)));
});

test('creates a signed HTTPS admin cookie that validates and rejects tampering', () => {
  withAdminEnvironment(() => {
    const loginRequest = new Request('https://murshid.example/api/admin/login', { method: 'POST' });
    const cookie = createAdminCookie(loginRequest);
    assert.match(cookie, /HttpOnly/u);
    assert.match(cookie, /SameSite=None/u);
    assert.match(cookie, /; Secure/u);
    assert.match(cookie, /Path=\/api\/admin/u);
    assert.equal(verifyAdminPassword('unit-test-admin-password'), true);
    assert.equal(verifyAdminPassword('incorrect-password'), false);

    const cookiePair = cookie.split(';', 1)[0];
    const validRequest = new Request('https://murshid.example/api/admin/keys', {
      headers: { cookie: cookiePair },
    });
    assert.equal(hasAdminSession(validRequest), true);

    const [name, token] = cookiePair.split('=');
    const [payload, signature] = token.split('.');
    const alteredSignature = `${signature[0] === 'A' ? 'B' : 'A'}${signature.slice(1)}`;
    const tamperedRequest = new Request('https://murshid.example/api/admin/keys', {
      headers: { cookie: `${name}=${payload}.${alteredSignature}` },
    });
    assert.equal(hasAdminSession(tamperedRequest), false);
  });
});

test('uses separate local-only cookie attributes for plain HTTP development', () => {
  withAdminEnvironment(() => {
    const cookie = createAdminCookie(new Request('http://localhost:3000/api/admin/login'));
    assert.match(cookie, /SameSite=Lax/u);
    assert.doesNotMatch(cookie, /; Secure/u);
  });
});

test('validates request origin and parses JSON with a bounded body', async () => {
  const request = new Request('https://murshid.example/api/access-keys', {
    method: 'POST',
    headers: {
      origin: 'https://murshid.example',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ name: 'Seif', email: 'seif@example.com' }),
  });
  assert.equal(hasSameOrigin(request), true);
  assert.deepEqual(await readJson(request), { name: 'Seif', email: 'seif@example.com' });

  const crossOrigin = new Request('https://murshid.example/api/access-keys', {
    method: 'POST',
    headers: { origin: 'https://attacker.example', 'content-type': 'application/json' },
    body: '{}',
  });
  assert.equal(hasSameOrigin(crossOrigin), false);

  const wrongContentType = new Request('https://murshid.example/api/access-keys', {
    method: 'POST',
    body: '{}',
  });
  await assert.rejects(readJson(wrongContentType), (error) => error instanceof ApiError && error.status === 415);
});

test('rejects non-string name and email before touching the database', async () => {
  const request = new Request('https://murshid.example/api/access-keys', {
    method: 'POST',
    headers: {
      origin: 'https://murshid.example',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ name: {}, email: ['person@example.com'], consent: true }),
  });
  const response = await accessKeysApi.fetch(request);
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /الاسم والبريد/u);
});
