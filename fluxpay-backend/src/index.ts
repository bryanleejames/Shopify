import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { initializeSchema } from './db/schema';
import { closeDb } from './db/database';
import {
  validateConfig,
  getPort,
  getHost,
  getCorsOrigins,
  getTrustProxy,
  isDevEndpointsEnabled,
} from './config';
import authRoutes from './routes/auth';
import userRoutes, { searchRouter } from './routes/user';
import walletRoutes from './routes/wallet';
import transactionRoutes from './routes/transactions';
import transferRoutes from './routes/transfers';
import devRoutes from './routes/dev';
import subscriptionRoutes from './routes/subscription';
import waitlistRoutes from './routes/waitlist';
import webhookRoutes from './routes/webhooks';
import notificationRoutes from './routes/notifications';

// Fail fast on fatal misconfiguration (e.g. missing JWT_SECRET in production)
validateConfig();

const app = express();
const PORT = getPort();
const HOST = getHost();

// Initialize database schema on startup (survives restarts — schema is idempotent)
initializeSchema();

// Trust the first proxy hop when the platform routes TLS to us
app.set('trust proxy', getTrustProxy());

// CORS — restrict to an allow-list when CORS_ORIGINS is set
const corsOrigins = getCorsOrigins();
app.use(cors(corsOrigins ? { origin: corsOrigins, credentials: true } : {}));

// Webhook routes need raw body BEFORE JSON parser (Stripe signature verification)
app.use('/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/profile', userRoutes);        // iOS: GET /profile
app.use('/user', userRoutes);           // backwards compat: GET /user/profile
app.use('/wallet', walletRoutes);
app.use('/wallet', transferRoutes);      // Bank linking & transfers
app.use('/transactions', transactionRoutes);
app.use('/users/search', searchRouter);  // iOS: GET /users/search?q=
if (isDevEndpointsEnabled()) {
  app.use('/dev', devRoutes);            // Dev/test endpoints (disabled in production)
  console.log('[FluxPay API] Dev endpoints enabled');
} else {
  console.log('[FluxPay API] Dev endpoints DISABLED (production)');
}
app.use('/subscription', subscriptionRoutes);  // Subscription management
app.use('/waitlist', waitlistRoutes);            // Marketing waitlist signup
app.use('/notifications', notificationRoutes);   // Push notification registration & history

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'fluxpay-api', version: '1.0.0' });
});

// JSON 404 for unknown routes
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Last-resort error handler
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[FluxPay API] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log(`[FluxPay API] Server running on http://${HOST}:${PORT}`);
  console.log(`[FluxPay API] Health check: http://${HOST}:${PORT}/health`);
});

// Graceful shutdown — close the HTTP server and the SQLite database so
// hosted restarts (SIGTERM) leave no corrupt or half-written state.
let shuttingDown = false;
function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[FluxPay API] Received ${signal} — shutting down gracefully`);
  server.close(() => {
    try {
      closeDb();
    } finally {
      console.log('[FluxPay API] Shutdown complete');
      process.exit(0);
    }
  });
  // Force exit if connections refuse to drain
  setTimeout(() => {
    console.error('[FluxPay API] Forced exit after shutdown timeout');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('[FluxPay API] Uncaught exception:', err);
  shutdown('uncaughtException');
});

export { app, server };