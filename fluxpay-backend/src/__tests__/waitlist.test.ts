/**
 * FluxPay Waitlist Integration Tests (bun test)
 * Run: bun test
 */
import { describe, test, expect } from 'bun:test';
import { api, adminPath, ADMIN_API_KEY } from './helpers';

const TEST_EMAIL = `waitlist-${Date.now()}@fluxpay-test.com`;

describe('Waitlist', () => {
  test('POST signup with valid email', async () => {
    const r = await api('POST', '/waitlist', { email: TEST_EMAIL });
    expect(r.status).toBe(200);
    expect(r.body.success).toBe(true);
  });

  test('POST duplicate email (silent upsert)', async () => {
    const r = await api('POST', '/waitlist', { email: TEST_EMAIL });
    expect(r.status).toBe(200);
    expect(r.body.success).toBe(true);
  });

  test('POST missing email', async () => {
    const r = await api('POST', '/waitlist', {});
    expect(r.status).toBe(400);
    expect(r.body.error).toBeTruthy();
  });

  test('POST invalid email (no @)', async () => {
    const r = await api('POST', '/waitlist', { email: 'notanemail' });
    expect(r.status).toBe(400);
    expect(r.body.error).toBeTruthy();
  });

  test('POST case-insensitive dedup', async () => {
    const r = await api('POST', '/waitlist', { email: TEST_EMAIL.toUpperCase() });
    expect(r.status).toBe(200);
    expect(r.body.success).toBe(true);
  });

  test('POST whitespace trimming', async () => {
    const r = await api('POST', '/waitlist', { email: `  ${TEST_EMAIL}  ` });
    expect(r.status).toBe(200);
    expect(r.body.success).toBe(true);
  });

  test('POST custom source', async () => {
    const r = await api('POST', '/waitlist', { email: `src-${Date.now()}@test.com`, source: 'ios_app' });
    expect(r.status).toBe(200);
    expect(r.body.success).toBe(true);
  });

  test('POST empty string email', async () => {
    const r = await api('POST', '/waitlist', { email: '' });
    expect(r.status).toBe(400);
    expect(r.body.error).toBeTruthy();
  });

  // GET /waitlist (admin key required)
  test('GET without admin key', async () => {
    const r = await api('GET', '/waitlist');
    expect(r.status).toBe(401);
    expect(r.body.error).toContain('admin key');
  });

  test('GET with wrong admin key', async () => {
    const r = await api('GET', '/waitlist?key=wrong-key');
    expect(r.status).toBe(401);
  });

  test('GET with valid admin key via query', async () => {
    const r = await api('GET', adminPath('/waitlist'));
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.data)).toBe(true);
    expect(typeof r.body.total).toBe('number');
    expect(r.body.total).toBeGreaterThanOrEqual(2);
    // Verify our test email is in the list
    const found = r.body.data.find((e: any) => e.email === TEST_EMAIL.toLowerCase());
    expect(found).toBeTruthy();
  });

  test('GET with valid admin key via header', async () => {
    const r = await api('GET', '/waitlist', undefined, undefined, { 'x-admin-key': ADMIN_API_KEY });
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.data)).toBe(true);
  });

  test('GET with pagination', async () => {
    const r = await api('GET', adminPath('/waitlist?limit=1&offset=0'));
    expect(r.status).toBe(200);
    expect(r.body.data.length).toBeLessThanOrEqual(1);
    expect(r.body.limit).toBe(1);
    expect(r.body.offset).toBe(0);
  });
});
