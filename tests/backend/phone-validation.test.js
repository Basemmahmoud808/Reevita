import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase } from './setup-db.js';

test('normalize_egyptian_phone validates and formats correctly', async () => {
  const db = await createTestDatabase();

  const validCases = [
    { input: '01012345678', expected: '+201012345678' },
    { input: '01123456789', expected: '+201123456789' },
    { input: '01234567890', expected: '+201234567890' },
    { input: '01555555555', expected: '+201555555555' },
    { input: '+201012345678', expected: '+201012345678' },
    { input: '00201012345678', expected: '+201012345678' },
    { input: ' 010-1234-5678 ', expected: '+201012345678' },
    { input: '(011) 98765432', expected: '+201198765432' },
  ];

  for (const { input, expected } of validCases) {
    const res = await db.query(`SELECT public.normalize_egyptian_phone($1) as phone;`, [input]);
    assert.equal(res.rows[0].phone, expected, `Phone "${input}" should normalize to "${expected}"`);
  }

  const invalidCases = [
    '01312345678', // 013 is landline (Banha), not mobile
    '0101234567',  // only 9 digits
    '010123456789', // 12 digits
    'not-a-number',
    '0222334455',  // Cairo landline
  ];

  for (const input of invalidCases) {
    await assert.rejects(
      async () => {
        await db.query(`SELECT public.normalize_egyptian_phone($1);`, [input]);
      },
      /INVALID_PHONE/,
      `Phone "${input}" should be rejected as invalid Egyptian mobile`
    );
  }

  await db.close();
});
