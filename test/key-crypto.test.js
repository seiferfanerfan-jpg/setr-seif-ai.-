import assert from 'node:assert/strict';
import test from 'node:test';
import { decryptAccessKey, encryptAccessKey } from '../server/lib/key-crypto.js';

const pepper = `test-pepper-${'x'.repeat(40)}`;
const recordId = '2bf13a48-e885-4ad5-b25a-478e72ee524c';
const accessKey = 'SEIF-random-test-token.مرشد';

test('encrypted access keys round-trip without storing plaintext', () => {
  const encrypted = encryptAccessKey(accessKey, pepper, recordId);
  assert.notEqual(encrypted, accessKey);
  assert.equal(encrypted.includes(accessKey), false);
  assert.equal(decryptAccessKey(encrypted, pepper, recordId), accessKey);
});

test('encrypted access keys are bound to their record ID', () => {
  const encrypted = encryptAccessKey(accessKey, pepper, recordId);
  assert.throws(() => decryptAccessKey(encrypted, pepper, 'different-record-id'), /تعذّر عرض المفتاح/u);
});

test('encrypted access keys reject tampered ciphertext', () => {
  const encrypted = encryptAccessKey(accessKey, pepper, recordId);
  const parts = encrypted.split('.');
  parts[3] = `${parts[3][0] === 'A' ? 'B' : 'A'}${parts[3].slice(1)}`;
  assert.throws(() => decryptAccessKey(parts.join('.'), pepper, recordId), /تعذّر عرض المفتاح/u);
});
