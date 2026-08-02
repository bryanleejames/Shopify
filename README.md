# FluxPay

**Send, receive, and manage money instantly from your iPhone.**

FluxPay is a modern fintech platform combining peer-to-peer payments, a digital wallet, and optional banking features (direct deposit, debit card, savings) in one seamless iOS experience — no fees for basic transfers.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FluxPay                              │
│                                                             │
│  ┌──────────────┐    ┌─────────────────┐    ┌────────────┐ │
│  │  iOS App     │    │  Backend API    │    │  Website   │ │
│  │  (SwiftUI)   │◄──►│  (Node/Express) │    │  (TanStack)│ │
│  │  port: n/a   │    │  port: 3001     │    │  port: 3000│ │
│  └──────────────┘    └───────┬─────────┘    └────────────┘ │
│                              │                              │
│                     ┌────────▼────────┐                    │
│                     │    SQLite DB     │                    │
│                     │  (better-sqlite) │                    │
│                     └────────┬────────┘                    │
│                              │                              │
│                     ┌────────▼────────┐                    │
│                     │  Stripe (test)  │                    │
│                     │  Payments/Subs  │                    │
│                     └─────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

| Component | Stack | Location |
|-----------|-------|----------|
| **iOS App** | SwiftUI 5.9+, iOS 17+, MVVM + @Observable | `FluxPay/FluxPay/` |
| **Backend API** | Node.js, Express 5, TypeScript, SQLite | `Backend/` |
| **Marketing Site** | TanStack Start (React + Vite + Tailwind v4) | `/home/team/shared/site/` |
| **Email** | AgentMail (ctomail.io) — `fluxpay-306778a9@ctomail.io` | |

---

## Quick Start

### Backend API

```bash
cd Backend
npm install --ignore-scripts   # better-sqlite3 needs native build
npm run build                  # tsc → dist/
npm start                      # node dist/index.js → :3001
```

The backend runs on **port 3001** and serves the REST API. See [Backend/API_SPEC.md](Backend/API_SPEC.md) for all endpoints.

**Requirements:** Node.js 18+, npm. A `.env` file with `JWT_SECRET` and `STRIPE_SECRET_KEY` (optional — falls back to mock mode).

### iOS App

Open `FluxPay/FluxPay.xcodeproj` in Xcode 15+ and run on iOS 17+ simulator. The app points at `http://localhost:3001` for API calls.

See [FluxPay/README.md](FluxPay/README.md) for detailed setup.

### Marketing Website

```bash
cd /home/team/shared/site
bun install
bun run publish              # builds & deploys to port 3000
```

The site is published at `https://ae1696fd259524c3a44e01d70ca577b0.ctonew.app`.

---

## Backend API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/signup` | Email/password signup |
| POST | `/auth/login` | Email/password login |
| POST | `/auth/request-code` | Request phone verification code |
| POST | `/auth/verify-code` | Verify 6-digit code |
| GET | `/profile` | Current user profile |
| PUT | `/profile` | Update display name / avatar |
| GET | `/wallet` | Balance, limits, bank accounts, subscription |
| GET | `/transactions` | Paginated transaction list |
| GET | `/transactions/pending` | Incoming requests |
| POST | `/transactions/send` | Send money |
| POST | `/transactions/request` | Request money |
| POST | `/transactions/:id/accept` | Accept request |
| POST | `/transactions/:id/decline` | Decline request |
| POST | `/wallet/link-bank` | Link bank account (Stripe Connect) |
| GET | `/wallet/bank-accounts` | List linked banks |
| POST | `/wallet/instant-transfer` | Instant transfer (1.5% fee) |
| POST | `/wallet/standard-transfer` | Free transfer (1-3 days) |
| GET | `/subscription` | Subscription status |
| POST | `/subscription/create` | Upgrade to premium |
| POST | `/subscription/cancel` | Cancel premium |
| GET | `/users/search?q=` | Search users by email/phone/name |
| POST | `/waitlist` | Join waitlist (sends welcome email on first signup) |
| GET | `/waitlist?key=` | Admin: view waitlist entries |
| POST | `/dev/seed` | Seed 3 test users with transactions |
| GET | `/health` | Health check |

Full spec: [Backend/API_SPEC.md](Backend/API_SPEC.md).

---

## Stripe Configuration

The backend supports two modes:

- **Live mode**: Set `STRIPE_SECRET_KEY=sk_test_...` or `sk_live_...` in `Backend/.env`
- **Mock mode**: Leave `STRIPE_SECRET_KEY` empty or unset — all Stripe operations are simulated

**Graceful degradation**: If Stripe Connect is not enabled on the account, bank linking and transfers fall back to mock data automatically.

**Payment link** (premium subscription): `https://buy.stripe.com/aFa9AS3bDcc6c6Y07Uf8EM0h`

---

## Admin Access

### Waitlist Dashboard
- **URL**: `https://ae1696fd259524c3a44e01d70ca577b0.ctonew.app/admin`
- **Admin Key**: `fluxpay-admin-2026`
- Displays all waitlist signups with email, source, and date

### API (GET /waitlist)
```bash
curl "http://localhost:3001/waitlist?key=fluxpay-admin-2026"
```

---

## Email (Welcome Emails)

New waitlist signups receive a welcome email from `fluxpay-306778a9@ctomail.io` (AgentMail).

The backend uses `nodemailer` with a configurable transport:
- **Development**: Stream transport (logs to console)
- **Production**: Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` in `Backend/.env`

---

## Testing

```bash
# Backend tests
cd Backend && npm test

# Seed test data (3 users with transactions)
curl -X POST http://localhost:3001/dev/seed

# Waitlist test
curl -X POST http://localhost:3001/waitlist \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com"}'
```

---

## Current Limitations

- **No Apple Pay integration** — planned for future
- **No push notifications** — planned for future
- **Backend deployed locally only** — no production hosting configured
- **No CI/CD pipeline**
- **Email is dev-only** — stream transport logs to console; SMTP creds needed for production
- **iOS app requires backend restart** after code changes to backend

---

## Project Status (August 2026)

| Feature | Status |
|---------|--------|
| iOS SwiftUI App (4-tab, MVVM) | ✅ Complete |
| Backend REST API (19+ endpoints) | ✅ Complete |
| JWT Auth (signup/login/verify) | ✅ Complete |
| Wallet & Transactions | ✅ Complete |
| Bank Linking & Transfers | ✅ Complete |
| Premium Subscriptions (Stripe) | ✅ Complete |
| Face ID / Biometric Auth | ✅ Complete |
| App Icon (all iOS sizes) | ✅ Complete |
| Marketing Website | ✅ Live |
| Waitlist with Email Storage | ✅ Live |
| Welcome Email on Signup | ✅ Complete |
| Admin Dashboard (/admin) | ✅ Live |
| Keychain Token Storage | ✅ Complete |
| Apple Pay | ❌ Future |
| Push Notifications | ❌ Future |
| Production Deployment | ❌ Future |
