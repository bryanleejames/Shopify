# FluxPay Backend API

Auth (JWT), wallets, transactions, bank transfers, premium subscriptions,
push notifications, Stripe webhooks, and the marketing waitlist for FluxPay.

Built with Node.js + TypeScript, Express 5, and SQLite (better-sqlite3).

## Quick start (development)

```bash
npm install          # or: bun install
cp .env.example .env # fill in values (JWT_SECRET, Stripe keys, ...)
npm run dev          # tsx watch — server on http://localhost:3001
```

The integration test suite hits a **live server on port 3001**:

```bash
PORT=3001 npx tsx src/index.ts   # start the server first
npm test                          # bun test — 78 tests / 215 assertions
```

## Configuration

All settings are environment variables (see `.env.example` for the full list
with comments). The most important ones:

| Variable | Purpose | Default |
|---|---|---|
| `NODE_ENV` | `production` on hosted deployments | — |
| `PORT` / `HOST` | listen address | `3001` / `0.0.0.0` |
| `DATABASE_PATH` | SQLite file path (persistent volume in containers) | `./fluxpay.db` |
| `JWT_SECRET` | **required in production** — long random string | dev default (refuses to start in prod) |
| `CORS_ORIGINS` | comma-separated allow-list; empty = allow all | — |
| `ENABLE_DEV_ENDPOINTS` | `true` force-enables `/dev/*` in production | off |
| `TRUST_PROXY` | `true` when behind a TLS-terminating proxy | false |

In **production** the server refuses to boot if `JWT_SECRET` is missing or
still the dev default, and the destructive `/dev/seed` endpoints are not
mounted unless explicitly enabled.

## Production deployment

### Docker (recommended)

```bash
docker build -t fluxpay-backend .
docker run -d --name fluxpay-api \
  -p 3001:3001 \
  -v fluxpay-data:/app/data \
  -e NODE_ENV=production \
  -e JWT_SECRET="$(openssl rand -hex 32)" \
  -e DATABASE_PATH=/app/data/fluxpay.db \
  -e STRIPE_SECRET_KEY=sk_live_... \
  -e STRIPE_WEBHOOK_SECRET=whsec_... \
  fluxpay-backend
```

- **Persistence**: SQLite lives at `DATABASE_PATH`. Mount a volume at
  `/app/data` (as above) so the database survives container restarts — this
  is the default `VOLUME` declared in the Dockerfile.
- **Build path**: `npm ci` → `npm run build` (tsc) → `node dist/index.js`.
- The schema is created/upgraded idempotently on every boot.

### Manual (Node 20+)

```bash
npm ci
npm run build        # compiles TypeScript → dist/
NODE_ENV=production JWT_SECRET=... DATABASE_PATH=/var/lib/fluxpay/fluxpay.db npm start
```

### Hosted platforms

- Any platform that runs a Docker image or a Node buildpack works
  (Fly.io, Railway, Render, Heroku, ECS, GCP Cloud Run, ...).
- Set the env vars above in the platform's settings — never in a committed file.
- For zero-downtime restarts the server handles `SIGTERM` gracefully
  (drains connections, closes the SQLite database, exits cleanly).

## API

Full endpoint documentation lives in [`API_SPEC.md`](./API_SPEC.md).

Key groups: `/auth`, `/profile`, `/wallet`, `/transactions`, `/users/search`,
`/subscription`, `/waitlist`, `/notifications`, `/webhooks/stripe`, `/health`.