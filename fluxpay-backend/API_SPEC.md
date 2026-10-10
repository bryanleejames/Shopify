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
  - Accepts optional `stripe_customer_id` and `stripe_subscription_id` for webhook linking
- `POST /subscription/cancel` — cancel/revert to free

## Stripe Webhooks
- `POST /webhooks/stripe` — receives raw body (no JSON parsing), verifies `stripe-signature` header
- Requires `STRIPE_WEBHOOK_SECRET` in `.env` for signature verification (falls back to unverified parsing without it)
- Events handled:
  - `invoice.paid` → activates premium tier ($10K limit, early direct deposit)
  - `invoice.payment_failed` → marks subscription past_due (deactivates, keeps tier for grace period)
  - `customer.subscription.deleted` → downgrades to free tier ($5K limit)
- User lookup: uses `stripe_customer_id` stored in subscriptions table
- The `stripe_customer_id` must be stored when creating the subscription via `POST /subscription/create`

## Stripe Integration
- **Mock mode** when `STRIPE_SECRET_KEY` is not set or is `''` (empty)
- **Live mode** when `STRIPE_SECRET_KEY` is set in `.env` (e.g., `sk_test_...` or `sk_live_...`)
- **Graceful fallback**: If Stripe Connect is not enabled on the account, bank linking and transfers fall back to mock data automatically — no code changes needed
- Payment link for subscriptions: `https://buy.stripe.com/aFa9AS3bDcc6cY07Uf8EM0h`
- Instant transfers: 1.5% fee, deducted from wallet balance
- Standard transfers: free, 1-3 business days

## Stripe Modes Tested (2026-08-01)
- ✅ **Live test key** (`sk_test_...`) — server initializes `[Stripe] Initialized with live API key`, Connect falls back gracefully
- ✅ **Mock mode** (`STRIPE_SECRET_KEY=` empty) — server initializes `[Stripe] Running in MOCK mode`, all operations simulated
- ✅ **Live→Mock→Live transition** — restarting with different keys switches modes correctly

## Search
- `GET /users/search?q=` — search users

## Push Notifications
- `POST /notifications/register` — register a device push token `{ token, platform? }` (auth required; `platform` defaults to `ios`)
- `POST /notifications/unregister` — remove a device token `{ token }` (auth required)
- `GET /notifications?limit=20&offset=0` — paginated notification history for the current user (auth required)
- `POST /notifications/:id/read` — mark a single notification as read (auth required)
- `POST /notifications/read-all` — mark all notifications as read (auth required)

Notification types emitted automatically on transaction events:
- `transaction_received` — recipient notified when money is sent to them
- `request_received` — target notified when someone requests money from them
- `request_accepted` — requester notified when their request is accepted/paid
- `request_declined` — requester notified when their request is declined

Delivery: uses Firebase Cloud Messaging (FCM) when `FCM_SERVER_KEY` (legacy) or `FIREBASE_PROJECT_ID` + `FIREBASE_SERVICE_ACCOUNT` (HTTP v1) are configured; otherwise logs to console (dev mode).

## Dev
- `POST /dev/seed` — create 3 test users with sample transactions

## Health
- `GET /health` — `{ status, service, version }`

## Testing
Run the full integration test suite:
```bash
bun test
```

The test suite uses real HTTP requests against the running dev server (port 3001). Each suite is self-contained — it creates its own test users and cleans up after itself. Suites: auth, waitlist, subscription, webhooks, transactions, notifications.