import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase } from './setup-db.js';

test('Concurrency & Race Condition: Only 1 order succeeds when 2 buyers order the last remaining piece', async () => {
  const db = await createTestDatabase();

  const cairoGovId = '11111111-0000-0000-0000-000000000001';
  const serumId = '33333333-0000-0000-0000-000000000009'; // Anti-Aging Serum

  // Set stock to exactly 1 piece
  await db.query(`
    UPDATE public.inventory
    SET quantity_available = 1, quantity_reserved = 0
    WHERE product_id = $1;
  `, [serumId]);

  // Order function wrapper
  const placeSerumOrder = async (name, phone) => {
    return db.query(`
      SELECT public.place_order(
        $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb
      ) as result;
    `, [
      name,
      phone,
      'test@example.com',
      cairoGovId,
      'القاهرة',
      'شارع المعز رقم 10',
      '',
      '',
      JSON.stringify([{ product_id: serumId, quantity: 1 }])
    ]);
  };

  // Launch two order attempts simultaneously for the last item
  const [attempt1, attempt2] = await Promise.allSettled([
    placeSerumOrder('المشتري الأول', '01011111111'),
    placeSerumOrder('المشتري الثاني', '01022222222')
  ]);

  const fulfilled = [attempt1, attempt2].filter(r => r.status === 'fulfilled');
  const rejected = [attempt1, attempt2].filter(r => r.status === 'rejected');

  assert.equal(fulfilled.length, 1, 'Exactly one order must succeed when only 1 item was in stock');
  assert.equal(rejected.length, 1, 'Exactly one order must be rejected');

  assert.match(
    rejected[0].reason.message,
    /INSUFFICIENT_STOCK/,
    'Rejected order must fail with INSUFFICIENT_STOCK error'
  );

  // Check inventory state in DB
  const invRes = await db.query(
    'SELECT quantity_available, quantity_reserved FROM public.inventory WHERE product_id = $1;',
    [serumId]
  );
  assert.equal(invRes.rows[0].quantity_available, 0, 'Available stock must be 0');
  assert.equal(invRes.rows[0].quantity_reserved, 1, 'Reserved stock must be 1');

  // Verify that only 1 order was recorded
  const ordersRes = await db.query(
    `SELECT count(*) as count FROM public.orders o
     JOIN public.order_items oi ON oi.order_id = o.id
     WHERE oi.product_id = $1;`,
    [serumId]
  );
  assert.equal(Number(ordersRes.rows[0].count), 1, 'Exactly 1 order row should exist for this product');

  await db.close();
});
