import { createHmac, randomBytes } from 'node:crypto';

export function normalizeName(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/\s+/gu, ' ')
    .trim();
}

export function firstFourLetters(name) {
  const withoutMarks = name.normalize('NFKC').replace(/\p{M}/gu, '');
  const letters = Array.from(withoutMarks).filter((character) => /\p{L}/u.test(character));
  return letters.slice(0, 4).join('') || Array.from(name).slice(0, 4).join('');
}

export function generateAccessKey(name) {
  const prefix = firstFourLetters(name);
  const randomPart = randomBytes(32).toString('base64url');
  return {
    prefix,
    key: `${prefix}-${randomPart}.مرشد`,
  };
}

export function digestAccessKey(key, pepper) {
  return createHmac('sha256', pepper).update(key, 'utf8').digest('hex');
}
