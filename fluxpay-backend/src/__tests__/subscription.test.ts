/**
 * FluxPay Subscription Integration Tests (bun test)
 * Run: bun test
 */
import { describe, test, expect } from 'bun:test';
import { api, signup } from './helpers';

describe('Subscription', () => {
  let token = '';
  const testEmail = `sub-${Date.now()}@fluxpay-test.com`;

  test('setup: create user', async () => {
    const s = await signup(testEmail);
    token = s.token;
    expect(token).toBeTruthy();
  });

  test('GET default subscription (free tier)', async () => {
    const r = await api('GET', '/subscription', undefined, token);
    expect(r.status).toBe(200);
    expect(r.body.tier).toBe('free');
    expect(r.body.transfer_limit).toBe(5000);
    expect(r.body.active).toBe(false);
    expect(r.body.early_direct_deposit).toBe(false);
    expect(r.body.payment_link).toMatch(/^https:\/\/buy\.stripe\.com\//);
  });

  test('POST create premium subscription', async () => {
    const r = await api('POST', '/subscription/create', {}, token);
    expect(r.status === 200 || r.status === 201).toBe(true);
    expect(r.body.tier).toBe('premium');
    expect(r.body.active).toBe(true);
    expect(r.body.transfer_limit).toBe(10000);
    expect(r.body.early_direct_deposit).toBe(true);
  });

  test('GET subscription after create', async () => {
    const r = await api('GET', '/subscription', undefined, token);
    expect(r.status).toBe(200);
    expect(r.body.tier).toBe('premium');
    expect(r.body.active).toBe(true);
    expect(r.body.transfer_limit).toBe(10000);
    expect(r.body.created_at).toBeTruthy();
  });

  test('POST duplicate create rejected', async () => {
    const r = await api('POST', '/subscription/create', {}, token);
    expect(r.status).toBe(400);
    expect(r.body.error).toBeTruthy();
  });

  test('POST cancel premium', async () => {
    const r = await api('POST', '/subscription/cancel', {}, token);
    expect(r.status).toBe(200);
    expect(r.body.tier).toBe('free');
    expect(r.body.active).toBe(false);
    expect(r.body.transfer_limit).toBe(5000);
    expect(r.body.early_direct_deposit).toBe(false);
  });

  test('GET after cancel', async () => {
    const r = await api('GET', '/subscription', undefined, token);
    expect(r.status).toBe(200);
    expect(r.body.tier).toBe('free');
    expect(r.body.active).toBe(false);
  });

  test('POST cancel when already free', async () => {
    const r = await api('POST', '/subscription/cancel', {}, token);
    expect(r.status).toBe(400);
  });

  test('POST re-upgrade after cancel', async () => {
    const r = await api('POST', '/subscription/create', {}, token);
    expect(r.status === 200 || r.status === 201).toBe(true);
    expect(r.body.tier).toBe('premium');
    expect(r.body.active).toBe(true);
    expect(r.body.transfer_limit).toBe(10000);
  });

  test('subscription without auth', async () => {
    const getR = await api('GET', '/subscription');
    expect(getR.status).toBe(401);

    const createR = await api('POST', '/subscription/create', {});
    expect(createR.status).toBe(401);

    const cancelR = await api('POST', '/subscription/cancel', {});
    expect(cancelR.status).toBe(401);
  });

  test('create with stripe customer ID', async () => {
    // Cancel current sub first
    await api('POST', '/subscription/cancel', {}, token);

    const stripeCustId = `cus_create_${Date.now()}`;
    const r = await api('POST', '/subscription/create', {
      stripe_customer_id: stripeCustId,
      stripe_subscription_id: 'sub_test_12345',
    }, token);
    expect(r.status === 200 || r.status === 201).toBe(true);
    expect(r.body.tier).toBe('premium');

    const sub = await api('GET', '/subscription', undefined, token);
    expect(sub.body.tier).toBe('premium');
  });
});
