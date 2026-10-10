/**
 * FluxPay Push Notification Infrastructure Tests (bun test)
 * Tests device token registration, notification history, read/read-all,
 * and transaction-event triggers (send/request/accept/decline).
 * Run: bun test
 */
import { describe, test, expect, beforeAll } from 'bun:test';
import { api } from './helpers';

let aliceToken = '';
let bobToken = '';
let bobId = '';
let carolToken = '';
let carolId = '';

describe('Push Notifications', () => {
  beforeAll(async () => {
    await api('POST', '/dev/seed');

    aliceToken = (await api('POST', '/auth/login', {
      email: 'alice@fluxpay.demo', password: 'password123',
    })).body.token;

    bobToken = (await api('POST', '/auth/login', {
      email: 'bob@fluxpay.demo', password: 'password123',
    })).body.token;

    carolToken = (await api('POST', '/auth/login', {
      email: 'carol@fluxpay.demo', password: 'password123',
    })).body.token;

    bobId = (await api('GET', '/users/search?q=Bob')).body.data[0]?.id;
    carolId = (await api('GET', '/users/search?q=Carol')).body.data[0]?.id;
  });

  // --- Device token registration ---
  test('register device token (new)', async () => {
    const r = await api('POST', '/notifications/register', {
      token: 'ios-device-token-bob-0001', platform: 'ios',
    }, bobToken);
    expect(r.status).toBe(201);
    expect(r.body.registered).toBe(true);
    expect(r.body.platform).toBe('ios');
  });

  test('re-register same token returns 200 (idempotent)', async () => {
    const r = await api('POST', '/notifications/register', {
      token: 'ios-device-token-bob-0001', platform: 'ios',
    }, bobToken);
    expect(r.status).toBe(200);
    expect(r.body.registered).toBe(true);
  });

  test('register token defaults platform to ios', async () => {
    const r = await api('POST', '/notifications/register', {
      token: 'ios-device-token-carol-0002',
    }, carolToken);
    expect(r.status).toBe(201);
    expect(r.body.platform).toBe('ios');
  });

  test('register token with android platform', async () => {
    const r = await api('POST', '/notifications/register', {
      token: 'android-device-token-bob-0003', platform: 'android',
    }, bobToken);
    expect(r.status).toBe(201);
    expect(r.body.platform).toBe('android');
  });

  test('register missing token returns 400', async () => {
    const r = await api('POST', '/notifications/register', {}, bobToken);
    expect(r.status).toBe(400);
  });

  test('register empty token returns 400', async () => {
    const r = await api('POST', '/notifications/register', { token: '   ' }, bobToken);
    expect(r.status).toBe(400);
  });

  test('register without auth returns 401', async () => {
    const r = await api('POST', '/notifications/register', { token: 'x' });
    expect(r.status).toBe(401);
  });

  test('unregister device token', async () => {
    const r = await api('POST', '/notifications/unregister', {
      token: 'android-device-token-bob-0003',
    }, bobToken);
    expect(r.status).toBe(200);
    expect(r.body.unregistered).toBe(true);
  });

  test('unregister non-existent token returns unregistered=false', async () => {
    const r = await api('POST', '/notifications/unregister', {
      token: 'does-not-exist-token',
    }, bobToken);
    expect(r.status).toBe(200);
    expect(r.body.unregistered).toBe(false);
  });

  test('unregister without auth returns 401', async () => {
    const r = await api('POST', '/notifications/unregister', { token: 'x' });
    expect(r.status).toBe(401);
  });

  // --- Notification history ---
  test('list notifications requires auth', async () => {
    const r = await api('GET', '/notifications');
    expect(r.status).toBe(401);
  });

  test('list notifications returns paginated shape', async () => {
    const r = await api('GET', '/notifications', undefined, bobToken);
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.data)).toBe(true);
    expect(typeof r.body.total).toBe('number');
    expect(typeof r.body.has_more).toBe('boolean');
  });

  // --- Transaction event triggers ---
  test('send money creates notification for recipient', async () => {
    const before = await api('GET', '/notifications', undefined, bobToken);
    const beforeTotal = before.body.total;

    await api('POST', '/transactions/send', {
      amount: 10, currency: 'USD', recipient_id: bobId, note: 'push test',
    }, aliceToken);

    const after = await api('GET', '/notifications', undefined, bobToken);
    expect(after.body.total).toBe(beforeTotal + 1);
    const latest = after.body.data[0];
    expect(latest.title).toBe('Money received');
    expect(latest.body).toContain('10');
    expect(latest.type).toBe('transaction_received');
    expect(latest.data).toBeTruthy();
    expect(latest.read).toBe(false);
  });

  test('request money creates notification for target', async () => {
    const before = await api('GET', '/notifications', undefined, carolToken);
    const beforeTotal = before.body.total;

    await api('POST', '/transactions/request', {
      amount: 15, currency: 'USD', from_user_id: carolId, note: 'push request',
    }, aliceToken);

    const after = await api('GET', '/notifications', undefined, carolToken);
    expect(after.body.total).toBe(beforeTotal + 1);
    const latest = after.body.data[0];
    expect(latest.title).toBe('Payment request');
    expect(latest.type).toBe('request_received');
    expect(latest.body).toContain('15');
  });

  test('decline request creates notification for requester', async () => {
    const req = await api('POST', '/transactions/request', {
      amount: 5, currency: 'USD', from_user_id: carolId,
    }, aliceToken);

    const before = await api('GET', '/notifications', undefined, aliceToken);
    const beforeTotal = before.body.total;

    await api('POST', `/transactions/${req.body.id}/decline`, {}, carolToken);

    const after = await api('GET', '/notifications', undefined, aliceToken);
    expect(after.body.total).toBe(beforeTotal + 1);
    const latest = after.body.data[0];
    expect(latest.title).toBe('Request declined');
    expect(latest.type).toBe('request_declined');
  });

  test('accept request creates notification for requester', async () => {
    // Bob requests $7 from Carol (Carol will accept)
    const req = await api('POST', '/transactions/request', {
      amount: 7, currency: 'USD', from_user_id: carolId,
    }, bobToken);

    const before = await api('GET', '/notifications', undefined, bobToken);
    const beforeTotal = before.body.total;

    await api('POST', `/transactions/${req.body.id}/accept`, {}, carolToken);

    const after = await api('GET', '/notifications', undefined, bobToken);
    expect(after.body.total).toBe(beforeTotal + 1);
    const latest = after.body.data[0];
    expect(latest.title).toBe('Request accepted');
    expect(latest.type).toBe('request_accepted');
  });

  // --- Read / read-all ---
  test('mark single notification read', async () => {
    const list = await api('GET', '/notifications', undefined, bobToken);
    const first = list.body.data[0];
    expect(first).toBeTruthy();

    const r = await api('POST', `/notifications/${first.id}/read`, {}, bobToken);
    expect(r.status).toBe(200);
    expect(r.body.read).toBe(true);

    const after = await api('GET', '/notifications', undefined, bobToken);
    const updated = after.body.data.find((n: any) => n.id === first.id);
    expect(updated.read).toBe(true);
  });

  test('mark non-existent notification read returns 404', async () => {
    const r = await api('POST', '/notifications/00000000-0000-0000-0000-000000000000/read', {}, bobToken);
    expect(r.status).toBe(404);
  });

  test('mark all notifications read', async () => {
    const r = await api('POST', '/notifications/read-all', {}, bobToken);
    expect(r.status).toBe(200);
    expect(typeof r.body.updated).toBe('number');

    const after = await api('GET', '/notifications', undefined, bobToken);
    const unread = after.body.data.filter((n: any) => n.read === false);
    expect(unread.length).toBe(0);
  });
});
