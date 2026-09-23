import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';

/**
 * Push notification service.
 *
 * Production mode uses Firebase Cloud Messaging (FCM) HTTP v1 API when
 * FIREBASE_PROJECT_ID + FIREBASE_SERVICE_ACCOUNT (or FCM_SERVER_KEY legacy)
 * are configured. Dev mode (no credentials) logs to console instead of
 * making real network calls — safe for local development and tests.
 */

interface PushPayload {
  title: string;
  body: string;
  type?: string;
  data?: Record<string, string>;
}

interface DeviceTokenRow {
  token: string;
  platform: string;
}

function isFcmConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID ||
    process.env.FCM_SERVER_KEY ||
    process.env.FIREBASE_SERVICE_ACCOUNT
  );
}

/**
 * Register a device token for a user. Idempotent — re-registering the same
 * token simply updates the timestamp/platform. Returns true if newly inserted.
 */
export function registerDeviceToken(userId: string, token: string, platform = 'ios'): boolean {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM device_tokens WHERE token = ?').get(token) as
    | { id: string }
    | undefined;

  if (existing) {
    // Re-bind token to this user (device ownership transfer / re-login)
    db.prepare(
      'UPDATE device_tokens SET user_id = ?, platform = ?, updated_at = datetime(\'now\') WHERE token = ?'
    ).run(userId, platform, token);
    return false;
  }

  db.prepare(
    `INSERT INTO device_tokens (id, user_id, token, platform)
     VALUES (?, ?, ?, ?)`
  ).run(uuidv4(), userId, token, platform);
  return true;
}

/**
 * Remove a device token (logout / opt-out). Returns true if a row was removed.
 */
export function unregisterDeviceToken(userId: string, token: string): boolean {
  const db = getDb();
  const result = db.prepare(
    'DELETE FROM device_tokens WHERE user_id = ? AND token = ?'
  ).run(userId, token);
  return result.changes > 0;
}

/**
 * Persist a notification row AND attempt push delivery.
 *
 * The row is always written (in-app notification history). Push delivery to
 * each registered device token follows; in dev mode it logs instead of
 * calling FCM.
 */
export async function sendPushNotification(
  userId: string,
  payload: PushPayload
): Promise<void> {
  const db = getDb();

  // 1. Persist to notifications table (in-app history)
  db.prepare(
    `INSERT INTO notifications (id, user_id, title, body, type, data)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    uuidv4(),
    userId,
    payload.title,
    payload.body,
    payload.type || 'general',
    payload.data ? JSON.stringify(payload.data) : null
  );

  // 2. Look up the user's registered device tokens
  const tokens = db.prepare(
    'SELECT token, platform FROM device_tokens WHERE user_id = ?'
  ).all(userId) as DeviceTokenRow[];

  if (tokens.length === 0) {
    console.log(`[Push] No device tokens for user ${userId} — notification stored only`);
    return;
  }

  // 3. Deliver to each device
  for (const device of tokens) {
    await deliverToDevice(device.token, device.platform, payload);
  }
}

async function deliverToDevice(
  token: string,
  platform: string,
  payload: PushPayload
): Promise<void> {
  if (!isFcmConfigured()) {
    // Dev mode: log to console instead of calling FCM
    console.log(
      `[Push][DEV] Would send push to ${platform} token ${token.slice(0, 12)}... ` +
      `— "${payload.title}: ${payload.body}"`
    );
    return;
  }

  try {
    await sendViaFcm(token, platform, payload);
    console.log(`[Push] Delivered to ${platform} token ${token.slice(0, 12)}...`);
  } catch (err) {
    console.error(`[Push] FCM delivery failed for token ${token.slice(0, 12)}...:`, err);
  }
}

/**
 * Send via Firebase Cloud Messaging.
 *
 * Supports both:
 *  - FCM HTTP v1 (OAuth2 service account) when FIREBASE_SERVICE_ACCOUNT +
 *    FIREBASE_PROJECT_ID are set.
 *  - Legacy FCM server key when FCM_SERVER_KEY is set.
 */
async function sendViaFcm(
  token: string,
  platform: string,
  payload: PushPayload
): Promise<void> {
  const legacyKey = process.env.FCM_SERVER_KEY;

  if (legacyKey) {
    const res = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${legacyKey}`,
      },
      body: JSON.stringify({
        to: token,
        notification: { title: payload.title, body: payload.body },
        data: payload.data || {},
      }),
    });
    if (!res.ok) {
      throw new Error(`FCM legacy API returned ${res.status}: ${await res.text()}`);
    }
    return;
  }

  // HTTP v1 with service account OAuth2
  const projectId = process.env.FIREBASE_PROJECT_ID!;
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);
  const accessToken = await getAccessToken(serviceAccount);

  const url =
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
  const message = platform === 'android'
    ? {
        token,
        notification: { title: payload.title, body: payload.body },
        data: payload.data || {},
      }
    : {
        token,
        notification: { title: payload.title, body: payload.body },
        data: payload.data || {},
      };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    throw new Error(`FCM v1 API returned ${res.status}: ${await res.text()}`);
  }
}

/** Minimal OAuth2 JWT for FCM HTTP v1 (service account). */
async function getAccessToken(serviceAccount: {
  client_email: string;
  private_key: string;
  token_uri?: string;
}): Promise<string> {
  const tokenUri =
    serviceAccount.token_uri || 'https://oauth2.googleapis.com/token';
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: tokenUri,
    iat: now,
    exp: now + 3600,
  };

  const enc = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');
  const signatureInput = `${enc(header)}.${enc(claim)}`;

  const { createPrivateKey } = await import('node:crypto');
  const key = createPrivateKey(serviceAccount.private_key);
  const { createSign } = await import('node:crypto');
  const signer = createSign('RSA-SHA256');
  signer.update(signatureInput);
  signer.end();
  const signature = signer.sign(key).toString('base64url');
  const assertion = `${signatureInput}.${signature}`;

  const res = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!res.ok) {
    throw new Error(`OAuth token exchange failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

/**
 * Mark a notification as read. Returns true if a row was updated.
 */
export function markNotificationRead(
  userId: string,
  notificationId: string
): boolean {
  const db = getDb();
  const result = db.prepare(
    'UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?'
  ).run(notificationId, userId);
  return result.changes > 0;
}

/**
 * Mark all of a user's notifications as read.
 */
export function markAllNotificationsRead(userId: string): number {
  const db = getDb();
  const result = db.prepare(
    'UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0'
  ).run(userId);
  return result.changes;
}
