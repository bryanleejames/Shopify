# FluxPay — Backend API

Node.js + Express 5 + TypeScript REST API with SQLite (better-sqlite3) and Stripe integration.

## Setup

```bash
cd Backend
npm install --ignore-scripts   # better-sqlite3 native module
npm run build                  # tsc → dist/
npm start                      # node dist/index.js → port 3001
```

Or for development with hot-reload:

```bash
npm run dev                    # tsx watch src/index.ts
```

## Configuration

Create `.env` in the Backend directory:

```env
PORT=3001
JWT_SECRET=your-secret-here
DATABASE_PATH=./fluxpay.db
STRIPE_SECRET_KEY=sk_test_...   # optional, falls back to mock mode
```

## Project Structure

```
Backend/
├── src/
│   ├── index.ts                # Express app entry, route mounting
│   ├── db/
│   │   ├── database.ts         # SQLite connection (better-sqlite3)
│   │   └── schema.ts           # Table definitions + migrations
│   ├── routes/
│   │   ├── auth.ts             # signup, login, phone verify
│   │   ├── user.ts             # profile, search
│   │   ├── wallet.ts           # balance, limits
│   │   ├── transactions.ts     # send, request, accept, decline
│   │   ├── transfers.ts        # bank linking, instant/standard transfers
│   │   ├── subscription.ts     # premium tiers (Stripe)
│   │   ├── waitlist.ts         # marketing signups + welcome email
│   │   ├── webhooks.ts         # Stripe webhook receiver
│   │   └── dev.ts              # seed data
│   ├── services/
│   │   └── email.ts            # nodemailer welcome email sender
│   └── middleware/
│       └── auth.ts             # JWT verification middleware
├── dist/                       # Compiled JS output
└── package.json
```

## Key Features

- **JWT Authentication**: signup, login, phone code verification
- **Wallet**: balance, weekly spend, available balance
- **P2P Transactions**: send, request, accept, decline with pagination
- **Bank Transfers**: instant (1.5% fee) and free standard via Stripe Connect
- **Subscriptions**: premium tier ($4.99/mo) with Stripe payment links
- **Waitlist**: email collection with UPSERT logic + welcome email
- **Stripe Mock Mode**: auto-fallback when no API key configured
- **19+ integration tests**

## Dependencies

- `express` 5 — HTTP framework
- `better-sqlite3` — SQLite driver (requires native build)
- `jsonwebtoken` — JWT auth
- `stripe` — payment processing
- `nodemailer` — email transport
- `uuid` — ID generation
- `dotenv` — environment config
- `typescript`, `tsx` — dev tooling

## Note on Native Modules

`better-sqlite3` requires a native build. Use `npm install --ignore-scripts` if the build fails, then copy a pre-built binary from a working environment into `node_modules/better-sqlite3/build/`.
