import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase } from './setup-db.js';

test('place_order calculates subtotal, shipping, and updates inventory correctly', async () => {
  const db = await createTestDatabase();

  const cairoGovId = '11111111-0000-0000-0000-000000000001';
  const shampooId = '33333333-0000-0000-0000-000000000001'; // 350 EGP each, initial 50 stock

  // 1. Place order below free shipping threshold: 1 shampoo = 350 EGP + 50 shipping = 400 EGP
  const order1Res = await db.query(`
    SELECT public.place_order(
      $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb
    ) as result;
  `, [
    'أحمد علي',
    '01012345678',
    'ahmed@example.com',
    cairoGovId,
    'مدينة نصر',
    'شارع النصر، عمارة 15، شقة 3',
    'بجوار النادي الأهلي',
    'يرجى الاتصال قبل التسليم',
    JSON.stringify([{ product_id: shampooId, quantity: 1 }])
  ]);

  const res1 = order1Res.rows[0].result;
  assert.equal(res1.success, true);
  assert.ok(res1.order_number.startsWith('RV-'));
  assert.equal(Number(res1.subtotal), 350.00);
  assert.equal(Number(res1.shipping_fee), 50.00);
  assert.equal(Number(res1.total), 400.00);
  assert.equal(res1.customer_phone, '+201012345678');

  // Verify inventory deduction (50 - 1 = 49 available, 1 reserved)
  const invRes = await db.query('SELECT quantity_available, quantity_reserved FROM public.inventory WHERE product_id = $1;', [shampooId]);
  assert.equal(invRes.rows[0].quantity_available, 49);
  assert.equal(invRes.rows[0].quantity_reserved, 1);

  // 2. Place order meeting free shipping threshold (>= 1000 EGP)
  // 3 shampoos = 1050 EGP, shipping should be 0.00 EGP
  const order2Res = await db.query(`
    SELECT public.place_order(
      $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb
    ) as result;
  `, [
    'سارة محمود',
    '01198765432',
    'sara@example.com',
    cairoGovId,
    'المعادي',
    'شارع 9، فيلا 22',
    '',
    '',
    JSON.stringify([{ product_id: shampooId, quantity: 3 }])
  ]);

  const res2 = order2Res.rows[0].result;
  assert.equal(res2.success, true);
  assert.equal(Number(res2.subtotal), 1050.00);
  assert.equal(Number(res2.shipping_fee), 0.00, 'Orders >= 1000 EGP must have free shipping in Cairo');
  assert.equal(Number(res2.total), 1050.00);

  // Verify inventory deduction (49 - 3 = 46 available, 4 reserved)
  const invRes2 = await db.query('SELECT quantity_available, quantity_reserved FROM public.inventory WHERE product_id = $1;', [shampooId]);
  assert.equal(invRes2.rows[0].quantity_available, 46);
  assert.equal(invRes2.rows[0].quantity_reserved, 4);

  // 3. Test Insufficient Stock rejection
  await assert.rejects(
    async () => {
      await db.query(`
        SELECT public.place_order(
          $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb
        );
      `, [
        'طارق حسن',
        '01234567890',
        null,
        cairoGovId,
        'الدقي',
        'شارع التحرير عمارة 4',
        null,
        null,
        JSON.stringify([{ product_id: shampooId, quantity: 999 }]) // only 46 available
      ]);
    },
    /INSUFFICIENT_STOCK/,
    'Should reject order when requested quantity exceeds available stock'
  );

  await db.close();
});
