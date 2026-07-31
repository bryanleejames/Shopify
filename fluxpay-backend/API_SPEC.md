# FluxPay Backend API Specification

**Base URL**: `http://localhost:3001` (dev)

## Authentication
- `POST /auth/signup` — email/password signup
- `POST /auth/login` — email/password login
- `POST /auth/request-code` — request 6-digit phone code
- `POST /auth/verify-code` — verify code, auto-create user

## Profile
- `GET /profile` — current user profile
- `PUT /profile` — update `{ display_name?, avatar_url? }`

## Wallet
- `GET /wallet` — balance, weekly_spent, available_balance, bank_accounts[], subscription_tier, transfer_limit, early_direct_deposit, stripe_account_id

## Bank Accounts
- `POST /wallet/link-bank` — create Stripe Connect account + link bank
- `GET /wallet/bank-accounts` — list linked banks

## Transfers
- `POST /wallet/instant-transfer` — 1.5% fee `{ amount, bank_account_id }`
- `POST /wallet/standard-transfer` — free (1-3 days) `{ amount, bank_account_id }`

## Transactions
- `GET /transactions?limit=20&offset=0` — paginated list
- `GET /transactions/pending` — pending requests sent TO current user
- `GET /transactions/:id` — single detail
- `POST /transactions/send` — send money
- `POST /transactions/request` — request money
- `POST /transactions/:id/accept` — accept pending request
- `POST /transactions/:id/decline` — decline pending request

## Subscriptions
- `GET /subscription` — current subscription status (+ `payment_link`)
- `POST /subscription/create` — upgrade to premium (+ `payment_link`)
- `POST /subscription/cancel` — cancel/revert to free

## Stripe Integration
- **Mock mode** when `STRIPE_SECRET_KEY` is not set or is `'mock'`
- To enable live mode: set `STRIPE_SECRET_KEY=sk_live_...` in `.env`
- Payment link for subscriptions: `https://buy.stripe.com/aFa9AS3bDcc6cY07Uf8EM0h`

## Search
- `GET /users/search?q=` — search users

## Dev
- `POST /dev/seed` — create 3 test users with sample transactions

## Health
- `GET /health` — `{ status, service, version }`