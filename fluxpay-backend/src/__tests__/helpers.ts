/**
 * Shared test helpers for FluxPay bun integration tests
 * Run: bun test
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const ADMIN_KEY = process.env.ADMIN_API_KEY || 'fluxpay-admin-dev-key';

export async function api(method: string, path: string, body?: object, token?: string, extraHeaders?: Record<string, string>): Promise<{ status: number; body: any }> {
  const url = new URL(path, BASE_URL);
  const postData = body ? JSON.stringify(body) : undefined;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(postData ? { 'Content-Length': String(Buffer.byteLength(postData)) } : {}),
    ...(extraHeaders || {}),
  };

  const resp = await fetch(`${BASE_URL}${url.pathname}${url.search}`, {
    method,
    headers,
    body: postData,
  });

  const contentType = resp.headers.get('content-type') || '';
  let bodyData: any;
  if (contentType.includes('application/json')) {
    bodyData = await resp.json();
  } else {
    bodyData = await resp.text();
  }

  return { status: resp.status, body: bodyData };
}

export async function signup(email: string, password = 'testpass123', fullName = 'Test User'): Promise<{ token: string; userId: string }> {
  const r = await api('POST', '/auth/signup', { email, password, full_name: fullName });
  if (r.status !== 201) throw new Error(`Signup failed: ${r.status} ${JSON.stringify(r.body)}`);
  return { token: r.body.token, userId: r.body.user.id };
}

export async function login(email: string, password = 'testpass123'): Promise<string> {
  const r = await api('POST', '/auth/login', { email, password });
  if (r.status !== 200) throw new Error(`Login failed: ${r.status} ${JSON.stringify(r.body)}`);
  return r.body.token;
}

export function adminPath(path: string): string {
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}key=${ADMIN_KEY}`;
}

export { ADMIN_KEY as ADMIN_API_KEY };
