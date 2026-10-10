/**
 * FluxPay Auth Integration Tests (bun test)
 * Run: bun test
 */
import { describe, test, expect, beforeAll } from 'bun:test';
import { api, signup, login } from './helpers';

const TEST_EMAIL = `auth-${Date.now()}@fluxpay-test.com`;
let token = '';
let userId = '';

describe('Auth', () => {
  test('health check', async () => {
    const r = await api('GET', '/health');
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('ok');
  });

  test('signup', async () => {
    const r = await api('POST', '/auth/signup', {
      email: TEST_EMAIL,
      password: 'testpass123',
      full_name: 'Auth Tester',
    });
    expect(r.status).toBe(201);
    expect(r.body.token).toBeTruthy();
    expect(r.body.user.email).toBe(TEST_EMAIL.toLowerCase());
    expect(r.body.user.full_name).toBe('Auth Tester');
    expect(r.body.user.id).toBeTruthy();
    token = r.body.token;
    userId = r.body.user.id;
  });

  test('duplicate signup rejected', async () => {
    const r = await api('POST', '/auth/signup', {
      email: TEST_EMAIL,
      password: 'testpass123',
      full_name: 'Auth Tester',
    });
    expect(r.status).toBe(409);
  });

  test('login', async () => {
    const r = await api('POST', '/auth/login', {
      email: TEST_EMAIL,
      password: 'testpass123',
    });
    expect(r.status).toBe(200);
    expect(r.body.token).toBeTruthy();
    token = r.body.token;
  });

  test('login wrong password', async () => {
    const r = await api('POST', '/auth/login', {
      email: TEST_EMAIL,
      password: 'wrongpassword',
    });
    expect(r.status).toBe(401);
  });

  test('get profile', async () => {
    const r = await api('GET', '/profile', undefined, token);
    expect(r.status).toBe(200);
    expect(r.body.email).toBe(TEST_EMAIL.toLowerCase());
    expect(r.body.display_name).toBe('Auth Tester');
    expect(r.body.id).toBe(userId);
  });

  test('profile without auth', async () => {
    const r = await api('GET', '/profile');
    expect(r.status).toBe(401);
  });

  test('wallet balance', async () => {
    const r = await api('GET', '/wallet/balance', undefined, token);
    expect(r.status).toBe(200);
    expect(typeof r.body.balance).toBe('number');
    expect(r.body.currency).toBe('USD');
  });
});
