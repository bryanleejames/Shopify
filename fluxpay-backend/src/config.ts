/**
 * Central environment configuration with production safety guards.
 *
 * All server settings are read through this module so the backend is
 * fully configurable via environment variables (see .env.example).
 */
const DEV_JWT_SECRET = 'fluxpay-dev-jwt-secret-change-in-production';

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function getPort(): number {
  return parseInt(process.env.PORT || '3001', 10);
}

export function getHost(): string {
  return process.env.HOST || '0.0.0.0';
}

export function getDatabasePath(): string {
  return process.env.DATABASE_PATH || './fluxpay.db';
}

/**
 * JWT signing secret. In production a missing value (or the dev default)
 * is a hard failure — a predictable secret would let anyone forge tokens.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || '';
  if (isProduction() && (!secret || secret === DEV_JWT_SECRET)) {
    throw new Error(
      'FATAL: JWT_SECRET must be set to a strong random value in production.',
    );
  }
  return secret || DEV_JWT_SECRET;
}

/**
 * Dev/test endpoints (/dev/*) are enabled outside production and can be
 * force-enabled with ENABLE_DEV_ENDPOINTS=true. They are NEVER enabled by
 * default in production.
 */
export function isDevEndpointsEnabled(): boolean {
  if (process.env.ENABLE_DEV_ENDPOINTS !== undefined) {
    return process.env.ENABLE_DEV_ENDPOINTS === 'true';
  }
  return !isProduction();
}

/** Comma-separated allow-list of CORS origins. Absent/empty => allow all (dev default). */
export function getCorsOrigins(): string[] | undefined {
  const raw = process.env.CORS_ORIGINS;
  if (!raw) return undefined;
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Should Express trust the first hop when behind a reverse proxy? */
export function getTrustProxy(): boolean | number {
  const raw = process.env.TRUST_PROXY;
  if (raw === undefined || raw === '') return false;
  return raw === 'true' ? 1 : false;
}

/** Validates the full configuration at boot; throws on fatal misconfiguration. */
export function validateConfig(): void {
  getJwtSecret();
  if (isProduction()) {
    console.log('[Config] Running in production mode');
  }
}