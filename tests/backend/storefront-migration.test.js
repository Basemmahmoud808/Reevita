import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase } from './setup-db.js';

test('Storefront seed & migration 000006: 24 catalogued SKUs, safe availability, profile provisioning', async () => {
  const db = await createTestDatabase();

  // 27 governorates with a rate each
  const govRes = await db.query('SELECT count(*) as count FROM public.governorates;');
  assert.equal(Number(govRes.rows[0].count), 27);
  const shipRes = await db.query('SELECT count(*) as count FROM public.shipping_rates;');
  assert.equal(Number(shipRes.rows[0].count), 27);

  // Catalogue: 6 product lines, 24 products, 24 available image files, 24 inventory rows
  const catRes = await db.query('SELECT count(*) as count FROM public.categories;');
  assert.equal(Number(catRes.rows[0].count), 6, 'Shampoo, body lotion, body butter, body splash, hair mist, shower gel');
  const prodRes = await db.query('SELECT count(*) as count FROM public.products;');
  assert.equal(Number(prodRes.rows[0].count), 24, '24 catalogued REEVITA SKUs');
  const imgRes = await db.query('SELECT count(*) as count FROM public.product_images;');
  assert.equal(Number(imgRes.rows[0].count), 24, 'Each product should reference an existing primary image');
  const invRes = await db.query('SELECT count(*) as count FROM public.inventory;');
  assert.equal(Number(invRes.rows[0].count), 24);

  const softGlow = await db.query(`
    SELECT c.name, c.name_ar, c.cover_image_url, c.is_published, c.purchase_ready,
      c.missing_products, count(cp.product_id)::int AS product_count
    FROM public.collections c
    LEFT JOIN public.collection_products cp ON cp.collection_id = c.id
    WHERE c.slug = 'soft-glow-bundle'
    GROUP BY c.id;
  `);
  assert.equal(softGlow.rows.length, 1, 'Soft & Glow collection should exist once');
  assert.equal(softGlow.rows[0].name, 'Soft & Glow Bundle');
  assert.equal(softGlow.rows[0].name_ar, 'باقة النعومة والإشراقة');
  assert.equal(softGlow.rows[0].cover_image_url, '/images/collections/soft-glow-bundle.webp');
  assert.equal(softGlow.rows[0].is_published, true);
  assert.equal(softGlow.rows[0].purchase_ready, false);
  assert.equal(Number(softGlow.rows[0].product_count), 0, 'Unconfirmed products must not be assigned');
  assert.deepEqual(softGlow.rows[0].missing_products, ['Shampoo Dove — 300 ml']);

  const completeCare = await db.query(`
    SELECT c.purchase_ready, c.missing_products, count(cp.product_id)::int AS product_count,
      sum(p.price * cp.quantity)::int AS bundle_total
    FROM public.collections c
    LEFT JOIN public.collection_products cp ON cp.collection_id = c.id
    LEFT JOIN public.products p ON p.id = cp.product_id
    WHERE c.slug = 'complete-care-bundle'
    GROUP BY c.id;
  `);
  assert.equal(completeCare.rows[0].purchase_ready, false);
  assert.deepEqual(completeCare.rows[0].missing_products, []);
  assert.equal(completeCare.rows[0].purchase_ready, true);
  assert.equal(Number(completeCare.rows[0].product_count), 9);
  assert.equal(Number(completeCare.rows[0].bundle_total), 2340);

  // Every image points to a local, audited WebP asset
  const badImages = await db.query(
    "SELECT count(*) as count FROM public.product_images WHERE image_url NOT LIKE '/images/products/%.webp';",
  );
  assert.equal(Number(badImages.rows[0].count), 0);

  // Availability status is readable by anon but never exposes quantities.
  await db.query(`UPDATE public.inventory SET quantity_available = 0 WHERE product_id = (
    SELECT product_id FROM public.inventory ORDER BY product_id LIMIT 1
  );`);
  await db.exec(`RESET ROLE; SET ROLE anon;`);
  const availability = await db.query('SELECT * FROM public.product_availability;');
  assert.equal(availability.rows.length, 24, 'Anon can read availability for active products');
  assert.ok(availability.rows.some(row => row.stock_status === 'out_of_stock'), 'Inventory changes update the public-safe status');
  assert.equal(
    Object.keys(availability.rows[0]).sort().join(','),
    'in_stock,product_id,stock_status',
    'Availability response must not leak quantity_available',
  );

  // Newsletter is insert-only for anon; reading is blocked
  await db.query("INSERT INTO public.newsletter_subscribers (email) VALUES ('vip@example.com');");
  await assert.rejects(
    () => db.query('SELECT count(*) as count FROM public.newsletter_subscribers;'),
    /permission denied for table newsletter_subscribers/,
    'Anon must not have SQL permission to read subscriber emails'
  );

  // Auth trigger auto-provisions a customer profile (back to superuser to seed auth.users)
  await db.exec('RESET ROLE;');
  await db.exec(`
    INSERT INTO auth.users (id, email, raw_user_meta_data)
    VALUES ('88888888-0000-0000-0000-000000000001', 'newcustomer@example.com',
            '{"full_name":"New Customer","phone":"+201012345678"}'::jsonb);
  `);
  const profile = await db.query(
    "SELECT full_name, phone, role FROM public.profiles WHERE id = '88888888-0000-0000-0000-000000000001';",
  );
  assert.equal(profile.rows.length, 1, 'Trigger must create a profile for new auth users');
  assert.equal(profile.rows[0].full_name, 'New Customer');
  assert.equal(profile.rows[0].role, 'customer', 'New users must never default to admin');

  await db.close();
});
