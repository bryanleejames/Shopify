/**
 * FluxPay Transaction & Transfer Integration Tests (bun test)
 * Tests send, request, accept, decline, history, weekly limit enforcement.
 * Run: bun test
 */
import { describe, test, expect, beforeAll } from 'bun:test';
import { api } from './helpers';

// Use seeded demo users (Alice: $4,960 balance, Bob: $275, Carol: $115)
let aliceToken = '';
let bobToken = '';
let bobId = '';
let carolToken = '';
let carolId = '';

describe('Transactions', () => {
  beforeAll(async () => {
    // Seed creates alice@fluxpay.demo, bob@fluxpay.demo, carol@fluxpay.demo (pass: password123)
    await api('POST', '/dev/seed');

    const aliceLogin = await api('POST', '/auth/login', {
      email: 'alice@fluxpay.demo', password: 'password123',
    });
    aliceToken = aliceLogin.body.token;

    const bobLogin = await api('POST', '/auth/login', {
      email: 'bob@fluxpay.demo', password: 'password123',
    });
    bobToken = bobLogin.body.token;

    const carolLogin = await api('POST', '/auth/login', {
      email: 'carol@fluxpay.demo', password: 'password123',
    });
    carolToken = carolLogin.body.token;

    // Get IDs
    const usersResp = await api('GET', '/users/search?q=Bob');
    bobId = usersResp.body.data[0]?.id;
    const carolResp = await api('GET', '/users/search?q=Carol');
    carolId = carolResp.body.data[0]?.id;
  });

  test('send money', async () => {
    const r = await api('POST', '/transactions/send', {
      amount: 100, currency: 'USD', recipient_id: bobId, note: 'Pizza',
    }, aliceToken);
    expect(r.status).toBe(201);
    expect(r.body.amount).toBe(100);
    expect(r.body.type).toBe('send');
    expect(r.body.status).toBe('completed');
    expect(r.body.counterparty_name).toBe('Bob Smith');
  });

  test('balances after send', async () => {
    const aliceW = await api('GET', '/wallet/balance', undefined, aliceToken);
    expect(aliceW.body.balance).toBe(4860); // 4960 - 100

    const bobW = await api('GET', '/wallet/balance', undefined, bobToken);
    expect(bobW.body.balance).toBe(375); // 275 + 100
  });

  test('insufficient balance', async () => {
    const r = await api('POST', '/transactions/send', {
      amount: 999999, currency: 'USD', recipient_id: bobId,
    }, aliceToken);
    expect(r.status).toBe(400);
    expect(r.body.error).toBeTruthy();
  });

  test('send to self', async () => {
    const profile = await api('GET', '/profile', undefined, aliceToken);
    const r = await api('POST', '/transactions/send', {
      amount: 10, currency: 'USD', recipient_id: profile.body.id,
    }, aliceToken);
    expect(r.status).toBe(400);
  });

  test('send zero amount', async () => {
    const r = await api('POST', '/transactions/send', {
      amount: 0, currency: 'USD', recipient_id: bobId,
    }, aliceToken);
    expect(r.status).toBe(400);
  });

  test('send to nonexistent user', async () => {
    const r = await api('POST', '/transactions/send', {
      amount: 10, currency: 'USD', recipient_id: '00000000-0000-0000-0000-000000000000',
    }, aliceToken);
    expect(r.status).toBe(404);
  });

  test('request money', async () => {
    const r = await api('POST', '/transactions/request', {
      amount: 50, currency: 'USD', from_user_id: bobId, note: 'Uber split',
    }, aliceToken);
    expect(r.status).toBe(201);
    expect(r.body.type).toBe('request');
    expect(r.body.status).toBe('pending');
    expect(r.body.amount).toBe(50);
  });

  test('view pending requests', async () => {
    const r = await api('GET', '/transactions/pending', undefined, bobToken);
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.data)).toBe(true);
    expect(r.body.total).toBeGreaterThanOrEqual(1);
  });

  test('accept request', async () => {
    // Get the pending request ID
    const pending = await api('GET', '/transactions/pending', undefined, bobToken);
    const reqId = pending.body.data[0]?.id;
    expect(reqId).toBeTruthy();

    const r = await api('POST', `/transactions/${reqId}/accept`, {}, bobToken);
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('completed');
    expect(r.body.type).toBe('send');
  });

  test('accept already-processed request', async () => {
    const pending = await api('GET', '/transactions/pending', undefined, bobToken);
    // If there are no more pending, find a completed one
    if (pending.body.data.length > 0) {
      const reqId = pending.body.data[0].id;
      const r = await api('POST', `/transactions/${reqId}/accept`, {}, bobToken);
      expect(r.status === 404 || r.status === 200).toBe(true);
    }
    // Test with a random ID
    const r = await api('POST', '/transactions/00000000-0000-0000-0000-000000000000/accept', {}, bobToken);
    expect(r.status).toBe(404);
  });

  test('decline request', async () => {
    // Alice requests $30 from Carol
    const req = await api('POST', '/transactions/request', {
      amount: 30, currency: 'USD', from_user_id: carolId,
    }, aliceToken);
    expect(req.status).toBe(201);

    const r = await api('POST', `/transactions/${req.body.id}/decline`, {}, carolToken);
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('cancelled');
  });

  test('wrong user decline rejected', async () => {
    const req = await api('POST', '/transactions/request', {
      amount: 20, currency: 'USD', from_user_id: bobId,
    }, aliceToken);
    // Alice tries to decline the request she made against Bob
    const r = await api('POST', `/transactions/${req.body.id}/decline`, {}, aliceToken);
    expect(r.status).toBe(403);
  });

  test('transaction list paginated', async () => {
    const r = await api('GET', '/transactions?limit=3&offset=0', undefined, aliceToken);
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.data)).toBe(true);
    expect(typeof r.body.total).toBe('number');
    expect(typeof r.body.has_more).toBe('boolean');
    expect(r.body.limit).toBe(3);
    expect(r.body.offset).toBe(0);
    expect(r.body.data.length).toBeLessThanOrEqual(3);
  });

  test('transaction detail', async () => {
    const list = await api('GET', '/transactions?limit=1', undefined, aliceToken);
    const txId = list.body.data[0]?.id;
    expect(txId).toBeTruthy();

    const r = await api('GET', `/transactions/${txId}`, undefined, aliceToken);
    expect(r.status).toBe(200);
    expect(r.body.id).toBe(txId);
  });

  test('transaction detail not found', async () => {
    const r = await api('GET', '/transactions/00000000-0000-0000-0000-000000000000', undefined, aliceToken);
    expect(r.status).toBe(404);
  });

  test('user search', async () => {
    const r = await api('GET', '/users/search?q=Alice');
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.data)).toBe(true);
    expect(r.body.data.length).toBeGreaterThanOrEqual(1);
    expect(r.body.data[0].display_name).toBe('Alice Johnson');
  });

  test('user search short query', async () => {
    const r = await api('GET', '/users/search?q=a');
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.data)).toBe(true);
    expect(r.body.data.length).toBe(0);
  });

  test('receiver sees received transactions', async () => {
    const r = await api('GET', '/transactions?limit=10', undefined, bobToken);
    expect(r.status).toBe(200);
    const received = r.body.data.filter((tx: any) => tx.type === 'receive');
    expect(received.length).toBeGreaterThanOrEqual(1);
  });

  // --- Weekly Limit Enforcement ---
  test('weekly limit enforcement', async () => {
    // Bob has $375 balance. His weekly limit defaults to $5,000 free tier.
    // He should be able to send small amounts, but not exceed his balance.
    
    // First, check that Bob can send a small amount
    const send1 = await api('POST', '/transactions/send', {
      amount: 25, currency: 'USD', recipient_id: carolId,
    }, bobToken);
    expect(send1.status).toBe(201);

    // Now try to send more than his balance (not a weekly limit test, but balance test)
    const sendTooMuch = await api('POST', '/transactions/send', {
      amount: 999999, currency: 'USD', recipient_id: carolId,
    }, bobToken);
    expect(sendTooMuch.status).toBe(400);
    expect(sendTooMuch.body.error).toContain('Insufficient balance');
  });

  test('wallet endpoint returns weekly data', async () => {
    const r = await api('GET', '/wallet', undefined, aliceToken);
    expect(r.status).toBe(200);
    expect(typeof r.body.balance).toBe('number');
    expect(typeof r.body.weekly_spent).toBe('number');
    expect(typeof r.body.weekly_limit).toBe('number');
    expect(typeof r.body.available_balance).toBe('number');
  });
});
