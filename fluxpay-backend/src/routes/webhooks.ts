import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { isMockMode } from '../services/stripe';
import Stripe from 'stripe';

const router = Router();

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// POST /webhooks/stripe — handle Stripe subscription lifecycle events
// No auth — called by Stripe directly. Signature verification handles security.
router.post('/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const body = req.body; // raw Buffer from express.raw()

  let event: Stripe.Event;

  // --- Parse event ---
  try {
    if (STRIPE_WEBHOOK_SECRET && sig) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
        apiVersion: '2025-02-24.acacia' as any,
      });
      event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
      console.log('[Stripe Webhook] Verified event:', event.type);
    } else if (!isMockMode()) {
      event = JSON.parse(body.toString()) as Stripe.Event;
      console.log('[Stripe Webhook] Unverified event (no webhook secret):', event.type);
    } else {
      event = typeof body === 'string' ? JSON.parse(body) : body;
      console.log('[Stripe Webhook] Mock event:', event.type);
    }
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
    return;
  }

  // --- Handle event ---
  try {
    switch (event.type) {
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as unknown as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as unknown as Stripe.Invoice);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as unknown as Stripe.Subscription);
        break;

      default:
        console.log('[Stripe Webhook] Unhandled event type:', event.type);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('[Stripe Webhook] Error handling event:', error);
    res.status(500).json({ error: 'Webhook handler error' });
  }
});

// --- Helpers ---

function findUserByCustomerId(customerId: string) {
  const db = getDb();
  return db.prepare(
    'SELECT user_id, tier FROM subscriptions WHERE stripe_customer_id = ?'
  ).get(customerId) as { user_id: string; tier: string } | undefined;
}

function activatePremium(customerId: string) {
  const db = getDb();
  db.prepare(`
    UPDATE subscriptions SET active = 1, tier = 'premium',
      early_direct_deposit = 1, transfer_limit = 10000,
      updated_at = datetime('now')
    WHERE stripe_customer_id = ?
  `).run(customerId);
}

function downgradeToFree(customerId: string) {
  const db = getDb();
  db.prepare(`
    UPDATE subscriptions SET tier = 'free', active = 0,
      early_direct_deposit = 0, transfer_limit = 5000,
      stripe_subscription_id = NULL, stripe_customer_id = NULL,
      updated_at = datetime('now')
    WHERE stripe_customer_id = ?
  `).run(customerId);
}

function markPastDue(customerId: string) {
  const db = getDb();
  db.prepare(`
    UPDATE subscriptions SET active = 0, updated_at = datetime('now')
    WHERE stripe_customer_id = ?
  `).run(customerId);
}

// --- Event Handlers ---

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = (invoice as any).customer as string | undefined;
  if (!customerId) {
    console.log('[Stripe Webhook] invoice.paid without customer, ignoring');
    return;
  }

  const sub = findUserByCustomerId(customerId);
  if (!sub) {
    console.log('[Stripe Webhook] No local subscription found for Stripe customer:', customerId);
    return;
  }

  activatePremium(customerId);
  console.log('[Stripe Webhook] invoice.paid → premium activated for user:', sub.user_id);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = (invoice as any).customer as string | undefined;
  if (!customerId) return;

  const sub = findUserByCustomerId(customerId);
  if (!sub) return;

  markPastDue(customerId);
  console.log('[Stripe Webhook] invoice.payment_failed → marked past_due for user:', sub.user_id);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = (subscription as any).customer as string | undefined;
  if (!customerId) return;

  const sub = findUserByCustomerId(customerId);
  if (!sub) return;

  downgradeToFree(customerId);
  console.log('[Stripe Webhook] customer.subscription.deleted → downgraded to free for user:', sub.user_id);
}

export default router;
