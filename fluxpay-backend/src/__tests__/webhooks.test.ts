/**
 * FluxPay Stripe Webhook Integration Tests (bun test)
 * Run: bun test
 */
import { describe, test, expect } from 'bun:test';
import { api, signup } from './helpers';

describe('Webhooks', () => {
  let token = '';
  const testEmail = `wh-${Date.now()}@fluxpay-test.com`;
  const TEST_CUSTOMER_ID = `cus_test_wh_${Date.now()}`;

  test('setup: create user with subscription', async () => {
    const s = await signup(testEmail);
    token = s.token;
    expect(token).toBeTruthy();

    const r = await api('POST', '/subscription/create', {
      stripe_customer_id: TEST_CUSTOMER_ID,
    }, token);
    expect(r.status === 200 || r.status === 201).toBe(true);
    expect(r.body.tier).toBe('premium');
  });

  test('invoice.paid activates premium', async () => {
    const r = await api('POST', '/webhooks/stripe', {
      type: 'invoice.paid',
      data: { object: { customer: TEST_CUSTOMER_ID } },
    });
    expect(r.status).toBe(200);
    expect(r.body.received).toBe(true);

    const sub = await api('GET', '/subscription', undefined, token);
    expect(sub.body.tier).toBe('premium');
    expect(sub.body.active).toBe(true);
    expect(sub.body.transfer_limit).toBe(10000);
    expect(sub.body.early_direct_deposit).toBe(true);
  });

  test('invoice.payment_failed marks past_due', async () => {
    const r = await api('POST', '/webhooks/stripe', {
      type: 'invoice.payment_failed',
      data: { object: { customer: TEST_CUSTOMER_ID } },
    });
    expect(r.status).toBe(200);
    expect(r.body.received).toBe(true);

    const sub = await api('GET', '/subscription', undefined, token);
    expect(sub.body.tier).toBe('premium'); // stays premium during grace period
    expect(sub.body.active).toBe(false);   // but inactive
  });

  test('customer.subscription.deleted downgrades to free', async () => {
    const r = await api('POST', '/webhooks/stripe', {
      type: 'customer.subscription.deleted',
      data: { object: { customer: TEST_CUSTOMER_ID } },
    });
    expect(r.status).toBe(200);
    expect(r.body.received).toBe(true);

    const sub = await api('GET', '/subscription', undefined, token);
    expect(sub.body.tier).toBe('free');
    expect(sub.body.active).toBe(false);
    expect(sub.body.transfer_limit).toBe(5000);
    expect(sub.body.early_direct_deposit).toBe(false);
  });

  test('non-matching customer ID ignored', async () => {
    const r = await api('POST', '/webhooks/stripe', {
      type: 'invoice.paid',
      data: { object: { customer: 'cus_nonexistent_99999' } },
    });
    expect(r.status).toBe(200);
    expect(r.body.received).toBe(true);
  });

  test('missing customer field ignored', async () => {
    const r = await api('POST', '/webhooks/stripe', {
      type: 'invoice.paid',
      data: { object: {} },
    });
    expect(r.status).toBe(200);
    expect(r.body.received).toBe(true);
  });

  test('unknown event type ignored', async () => {
    const r = await api('POST', '/webhooks/stripe', {
      type: 'charge.succeeded',
      data: { object: { id: 'ch_test' } },
    });
    expect(r.status).toBe(200);
    expect(r.body.received).toBe(true);
  });
});
