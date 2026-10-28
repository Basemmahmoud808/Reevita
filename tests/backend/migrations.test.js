import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase } from './setup-db.js';

test('Database Migrations and Seed apply cleanly from scratch', async () => {
  const db = await createTestDatabase();

  // Verify Governorates count = 27
  const govRes = await db.query('SELECT count(*) as count FROM public.governorates;');
  assert.equal(Number(govRes.rows[0].count), 27, 'Should have exactly 27 Egyptian governorates');

  // Verify Shipping rates count = 27
  const shipRes = await db.query('SELECT count(*) as count FROM public.shipping_rates;');
  assert.equal(Number(shipRes.rows[0].count), 27, 'Should have shipping rates for all 27 governorates');

  // Verify Categories
  const catRes = await db.query('SELECT count(*) as count FROM public.categories;');
  assert.equal(Number(catRes.rows[0].count), 6, 'Should have 6 product lines');

  // Verify Products
  const prodRes = await db.query('SELECT count(*) as count FROM public.products;');
  assert.equal(Number(prodRes.rows[0].count), 14, 'Should have the 14 real REEVITA SKUs');

  // Verify Inventory rows match products
  const invRes = await db.query('SELECT count(*) as count FROM public.inventory;');
  assert.equal(Number(invRes.rows[0].count), 14, 'Every product should have an inventory record');

  // Verify Site Settings
  const settingsRes = await db.query('SELECT count(*) as count FROM public.site_settings;');
  assert.ok(Number(settingsRes.rows[0].count) >= 3, 'Should have initial site settings');

  await db.close();
});
