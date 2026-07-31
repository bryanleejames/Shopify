/**
 * FluxPay Auth Integration Test
 *
 * Tests the full auth flow: signup, login, profile access, wallet balance.
 * Run with: npm test
 */
import http from 'http';

const BASE_URL = process.env.API_URL || 'http://localhost:3001';

function request(method: string, path: string, body?: object, token?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const postData = body ? JSON.stringify(body) : undefined;

    const options: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

// Test email with timestamp to avoid conflicts
const testEmail = `test-${Date.now()}@fluxpay-test.com`;
const testPassword = 'testpass123';
const testName = 'Test User';

let authToken = '';
let userId = '';

async function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string) {
    if (condition) {
      console.log(`  ✓ ${name}`);
      passed++;
    } else {
      console.log(`  ✗ ${name}`);
      failed++;
    }
  }

  console.log('\n🔐 FluxPay Auth Integration Tests\n');
  console.log(`Test email: ${testEmail}\n`);

  // --- Test 1: Health Check ---
  console.log('1. Health Check');
  try {
    const health = await request('GET', '/health');
    assert(health.status === 200 && health.body.status === 'ok', 'GET /health returns 200 and status ok');
  } catch (e: any) {
    assert(false, `GET /health — ${e.message}`);
  }

  // --- Test 2: Signup ---
  console.log('\n2. User Signup');
  try {
    const signup = await request('POST', '/auth/signup', {
      email: testEmail,
      password: testPassword,
      full_name: testName,
    });
    assert(signup.status === 201, `POST /auth/signup returns 201 (got ${signup.status})`);
    assert(!!signup.body.token, 'Response includes token');
    assert(signup.body.user?.email === testEmail.toLowerCase(), 'Response includes correct email');
    assert(signup.body.user?.full_name === testName, 'Response includes full_name');
    assert(!!signup.body.user?.id, 'Response includes user id');
    authToken = signup.body.token;
    userId = signup.body.user.id;
  } catch (e: any) {
    assert(false, `POST /auth/signup — ${e.message}`);
  }

  // --- Test 3: Duplicate signup ---
  console.log('\n3. Duplicate Signup Rejection');
  try {
    const dup = await request('POST', '/auth/signup', {
      email: testEmail,
      password: testPassword,
      full_name: testName,
    });
    assert(dup.status === 409, `POST /auth/signup duplicate returns 409 (got ${dup.status})`);
  } catch (e: any) {
    assert(false, `POST /auth/signup duplicate — ${e.message}`);
  }

  // --- Test 4: Login ---
  console.log('\n4. User Login');
  try {
    const login = await request('POST', '/auth/login', {
      email: testEmail,
      password: testPassword,
    });
    assert(login.status === 200, `POST /auth/login returns 200 (got ${login.status})`);
    assert(!!login.body.token, 'Login response includes token');
    authToken = login.body.token;
  } catch (e: any) {
    assert(false, `POST /auth/login — ${e.message}`);
  }

  // --- Test 5: Login with wrong password ---
  console.log('\n5. Login with Wrong Password');
  try {
    const badLogin = await request('POST', '/auth/login', {
      email: testEmail,
      password: 'wrongpassword',
    });
    assert(badLogin.status === 401, `POST /auth/login wrong password returns 401 (got ${badLogin.status})`);
  } catch (e: any) {
    assert(false, `POST /auth/login wrong password — ${e.message}`);
  }

  // --- Test 6: Get Profile ---
  console.log('\n6. Get User Profile');
  try {
    const profile = await request('GET', '/user/profile', undefined, authToken);
    assert(profile.status === 200, `GET /user/profile returns 200 (got ${profile.status})`);
    assert(profile.body.email === testEmail.toLowerCase(), 'Profile email matches');
    assert(profile.body.full_name === testName, 'Profile full_name matches');
    assert(profile.body.id === userId, 'Profile id matches');
  } catch (e: any) {
    assert(false, `GET /user/profile — ${e.message}`);
  }

  // --- Test 7: Profile without auth ---
  console.log('\n7. Profile Without Auth Token');
  try {
    const noAuth = await request('GET', '/user/profile');
    assert(noAuth.status === 401, `GET /user/profile without token returns 401 (got ${noAuth.status})`);
  } catch (e: any) {
    assert(false, `GET /user/profile without token — ${e.message}`);
  }

  // --- Test 8: Get Wallet Balance ---
  console.log('\n8. Get Wallet Balance');
  try {
    const wallet = await request('GET', '/wallet/balance', undefined, authToken);
    assert(wallet.status === 200, `GET /wallet/balance returns 200 (got ${wallet.status})`);
    assert(typeof wallet.body.balance === 'number', 'Wallet has a balance field');
    assert(wallet.body.balance === 0, `New wallet balance is 0 (got ${wallet.body.balance})`);
    assert(wallet.body.currency === 'USD', 'Wallet currency is USD');
  } catch (e: any) {
    assert(false, `GET /wallet/balance — ${e.message}`);
  }

  // --- Summary ---
  console.log('\n═══════════════════════════════');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();