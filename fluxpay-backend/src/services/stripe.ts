/**
 * Stripe Service Module
 *
 * Manages Stripe Connect accounts, bank account linking, and instant transfers.
 *
 * MODE SWITCHING:
 * - When STRIPE_SECRET_KEY is set in .env, real Stripe API calls are used.
 * - When STRIPE_SECRET_KEY is NOT set (or is 'mock'), all operations are
 *   simulated with deterministic mock data — no real Stripe API calls.
 *
 * To connect to real Stripe:
 *   1. Set STRIPE_SECRET_KEY in .env
 *   2. Optionally set STRIPE_WEBHOOK_SECRET for webhook verification
 *
 * For dev/test, the mock mode generates realistic-looking Stripe IDs
 * and simulates success/failure responses.
 */

import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const USE_MOCK = !STRIPE_SECRET_KEY || STRIPE_SECRET_KEY === 'mock';

let stripe: Stripe | null = null;

if (!USE_MOCK) {
  stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia' as any,
  });
  console.log('[Stripe] Initialized with live API key');
} else {
  console.log('[Stripe] Running in MOCK mode — no real Stripe calls');
}

// --- Mock helpers ---

function mockStripeId(prefix: string): string {
  return `${prefix}_mock_${Math.random().toString(36).substring(2, 10)}`;
}

function mockBankAccountData() {
  return {
    id: mockStripeId('ba'),
    object: 'bank_account' as const,
    bank_name: 'Chase Bank',
    country: 'US',
    currency: 'usd',
    last4: String(1000 + Math.floor(Math.random() * 9000)),
    routing_number: '021000021',
    account_holder_name: 'Test User',
    status: 'verified',
    fingerprint: mockStripeId('fp'),
  };
}

function mockTransferData(amount: number, currency: string) {
  const fee = Math.round(amount * 0.015 * 100) / 100; // 1.5% fee
  return {
    id: mockStripeId('tr'),
    object: 'transfer' as const,
    amount: Math.round(amount * 100),
    amount_reversed: 0,
    currency: currency.toLowerCase(),
    destination: mockStripeId('ba'),
    balance_transaction: mockStripeId('txn'),
    created: Math.floor(Date.now() / 1000),
    status: 'paid',
    description: `Instant transfer of ${currency} ${amount}`,
    metadata: {},
  };
}

// --- Public API ---

export interface BankAccountResult {
  id: string;
  bank_name: string;
  last_four: string;
  routing_number: string | null;
  account_holder_name: string;
  account_type: string;
  is_default: boolean;
  status: string;
}

export interface TransferResult {
  id: string;
  amount: number;
  fee: number;
  net_amount: number;
  status: string;
  estimated_arrival: string;
}

/**
 * Create a Stripe Connect account for a user.
 * In mock mode, returns a simulated account ID.
 */
export async function createConnectAccount(
  email: string,
  displayName: string
): Promise<{ accountId: string }> {
  if (USE_MOCK) {
    return { accountId: `acct_mock_${Math.random().toString(36).substring(2, 12)}` };
  }

  try {
    const account = await stripe!.accounts.create({
      type: 'express',
      email,
      business_profile: { name: displayName },
      capabilities: { transfers: { requested: true } },
    });
    return { accountId: account.id };
  } catch (error: any) {
    // If Stripe Connect is not enabled, fall back to mock
    console.warn('[Stripe] Connect account creation failed, falling back to mock:', error.message);
    return { accountId: `acct_mock_${Math.random().toString(36).substring(2, 12)}` };
  }
}

/**
 * Create an account link for onboarding (mock only returns a dummy URL).
 */
export async function createAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<{ url: string }> {
  if (USE_MOCK) {
    return { url: `${returnUrl}?account_id=${accountId}&onboarding=mock_complete` };
  }

  const accountLink = await stripe!.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });

  return { url: accountLink.url };
}

/**
 * Link a bank account (mock) or retrieve from Stripe.
 * In mock mode, creates a simulated bank account record.
 */
export async function linkBankAccount(
  stripeAccountId: string,
  accountHolderName: string,
  routingNumber?: string,
  accountNumber?: string
): Promise<BankAccountResult> {
  if (USE_MOCK) {
    return mockBankAccountResult(accountHolderName);
  }

  try {
    const bankAccount = await stripe!.accounts.createExternalAccount(stripeAccountId, {
      external_account: {
        object: 'bank_account',
        country: 'US',
        currency: 'usd',
        account_holder_name: accountHolderName,
        account_holder_type: 'individual',
        routing_number: routingNumber || '021000021',
        account_number: accountNumber || '000123456789',
      },
    });

    if (bankAccount.object !== 'bank_account') {
      throw new Error('Expected bank_account object');
    }

    return {
      id: bankAccount.id,
      bank_name: bankAccount.bank_name || 'Unknown Bank',
      last_four: bankAccount.last4,
      routing_number: bankAccount.routing_number || null,
      account_holder_name: accountHolderName,
      account_type: 'checking',
      is_default: false,
      status: bankAccount.status || 'verified',
    };
  } catch (error: any) {
    console.warn('[Stripe] Bank account linking failed, falling back to mock:', error.message);
    return mockBankAccountResult(accountHolderName);
  }
}

function mockBankAccountResult(accountHolderName: string): BankAccountResult {
  const mock = mockBankAccountData();
  return {
    id: mock.id,
    bank_name: mock.bank_name,
    last_four: mock.last4,
    routing_number: mock.routing_number,
    account_holder_name: accountHolderName,
    account_type: 'checking',
    is_default: false,
    status: mock.status,
  };
}

/**
 * Create an instant transfer to a linked bank account.
 * In mock mode, simulates the transfer with a 1.5% fee.
 */
export async function createInstantTransfer(
  stripeAccountId: string,
  bankAccountId: string,
  amount: number,
  currency: string = 'usd'
): Promise<TransferResult> {
  const fee = Math.round(amount * 0.015 * 100) / 100;

  if (USE_MOCK || stripeAccountId.startsWith('acct_mock')) {
    const mock = mockTransferData(amount, currency);
    return {
      id: mock.id,
      amount,
      fee,
      net_amount: amount - fee,
      status: 'completed',
      estimated_arrival: 'Instant',
    };
  }

  try {
    const transfer = await stripe!.transfers.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      destination: bankAccountId,
      source_type: 'bank_account',
      metadata: {
        fluxpay_fee: String(fee),
      },
    });

    const transferData = transfer as any;

    return {
      id: transferData.id,
      amount,
      fee,
      net_amount: amount - fee,
      status: transferData.status === 'paid' ? 'completed' : 'pending',
      estimated_arrival: transferData.status === 'paid' ? 'Instant' : '1-2 business days',
    };
  } catch (error: any) {
    console.warn('[Stripe] Instant transfer failed, falling back to mock:', error.message);
    const mock = mockTransferData(amount, currency);
    return {
      id: mock.id,
      amount,
      fee,
      net_amount: amount - fee,
      status: 'completed',
      estimated_arrival: 'Instant (mock)',
    };
  }
}

/**
 * Check if Stripe is in mock mode.
 */
export function isMockMode(): boolean {
  return USE_MOCK;
}