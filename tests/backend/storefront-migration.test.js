import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase } from './setup-db.js';

test('Storefront seed & migration 000006: 14 real SKUs, availability view, profile provisioning', async () => {
  const db = await createTestDatabase();

  // 27 governorates with a rate each
  const govRes = await db.query('SELECT count(*) as count FROM public.governorates;');
  assert.equal(Number(govRes.rows[0].count), 27);
  const shipRes = await db.query('SELECT count(*) as count FROM public.shipping_rates;');
  assert.equal(Number(shipRes.rows[0].count), 27);

  // Catalogue: 5 product lines, 14 products, 28 images, 14 inventory rows
  const catRes = await db.query('SELECT count(*) as count FROM public.categories;');
  assert.equal(Number(catRes.rows[0].count), 5, 'Body lotion, body butter, body splash, hair mist, shampoo');
  const prodRes = await db.query('SELECT count(*) as count FROM public.products;');
  assert.equal(Number(prodRes.rows[0].count), 14, '14 real REEVITA SKUs');
  const imgRes = await db.query('SELECT count(*) as count FROM public.product_images;');
  assert.equal(Number(imgRes.rows[0].count), 28, 'Primary + detail image for every SKU');
  const invRes = await db.query('SELECT count(*) as count FROM public.inventory;');
  assert.equal(Number(invRes.rows[0].count), 14);

  // Every image points to a local, audited WebP asset
  const badImages = await db.query(
    "SELECT count(*) as count FROM public.product_images WHERE image_url NOT LIKE '/images/products/%.webp';",
  );
  assert.equal(Number(badImages.rows[0].count), 0);

  // Availability view is readable by anon but never exposes quantities
  await db.exec(`RESET ROLE; SET ROLE anon;`);
  const availability = await db.query('SELECT * FROM public.product_availability;');
  assert.equal(availability.rows.length, 14, 'Anon can read availability for active products');
  assert.equal(
    Object.keys(availability.rows[0]).sort().join(','),
    'in_stock,product_id,stock_status',
    'Availability view must not leak quantity_available',
  );

  // Newsletter is insert-only for anon; reading is blocked
  await db.query("INSERT INTO public.newsletter_subscribers (email) VALUES ('vip@example.com');");
  const newsletterRead = await db.query('SELECT count(*) as count FROM public.newsletter_subscribers;');
  assert.equal(Number(newsletterRead.rows[0].count), 0, 'Anon must not read subscriber emails');

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
