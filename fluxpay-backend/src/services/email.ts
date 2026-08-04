import nodemailer from 'nodemailer';

const FROM_ADDRESS = process.env.MAIL_FROM || 'FluxPay <fluxpay@ctomail.io>';

interface WelcomeEmailOptions {
  to: string;
}

// Create transporter based on available config
function createTransporter() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpPort) {
    console.log(`[Email] Using SMTP transport: ${smtpHost}:${smtpPort}`);
    return nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort, 10),
      secure: smtpPort === '465',
      auth: smtpUser ? { user: smtpUser, pass: smtpPass || '' } : undefined,
    });
  }

  // Development fallback: log emails to console via stream transport
  console.log('[Email] No SMTP configured — emails will be logged to console via stream transport');
  return nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
    newline: 'unix',
  });
}

const transporter = createTransporter();

/**
 * Send a welcome email to a new waitlist signup.
 * Uses SMTP when configured, otherwise logs to console.
 */
export async function sendWelcomeEmail({ to }: WelcomeEmailOptions): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from: FROM_ADDRESS,
      to,
      subject: '⚡ Welcome to the FluxPay Waitlist!',
      html: buildWelcomeHtml(to),
      text: buildWelcomeText(to),
    });

    // If stream transport, log the raw message
    if ('message' in info && info.message) {
      const msg = info.message.toString();
      console.log(`[Email] Welcome email sent to ${to}:\n${msg.substring(0, 200)}...`);
    } else {
      console.log(`[Email] Welcome email sent to ${to}: ${info.messageId}`);
    }

    return true;
  } catch (error) {
    console.error(`[Email] Failed to send welcome email to ${to}:`, error);
    return false;
  }
}

function buildWelcomeText(to: string): string {
  return `Welcome to FluxPay, ${to}!

You're officially on the FluxPay waitlist — we'll let you know the moment early access opens up.

Here's what you can look forward to:
- Instant peer-to-peer payments
- Free standard transfers to your bank
- No-fee digital wallet
- Premium features like early direct deposit

We're building the fastest way to move money on iOS, and you'll be among the first to experience it.

Stay tuned!
— The FluxPay Team

https://fluxpay.app`;
}

function buildWelcomeHtml(to: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <tr>
      <td style="padding:40px 40px 24px;text-align:center;">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:#1A73E8;border-radius:12px;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <h1 style="margin:20px 0 8px;font-size:24px;font-weight:700;color:#111827;">You're on the list! ⚡</h1>
        <p style="margin:0;font-size:16px;color:#6b7280;">Thanks for joining the FluxPay waitlist. We're building something fast.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 40px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td style="padding:16px;border-bottom:1px solid #f3f4f6;">
              <div style="display:flex;align-items:center;gap:12px;">
                <span style="font-size:20px;">💸</span>
                <span style="font-size:15px;color:#374151;">Instant peer-to-peer payments</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px;border-bottom:1px solid #f3f4f6;">
              <div style="display:flex;align-items:center;gap:12px;">
                <span style="font-size:20px;">🏦</span>
                <span style="font-size:15px;color:#374151;">Free standard bank transfers</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px;border-bottom:1px solid #f3f4f6;">
              <div style="display:flex;align-items:center;gap:12px;">
                <span style="font-size:20px;">🔐</span>
                <span style="font-size:15px;color:#374151;">No-fee digital wallet with Face ID</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px;">
              <div style="display:flex;align-items:center;gap:12px;">
                <span style="font-size:20px;">⚡</span>
                <span style="font-size:15px;color:#374151;">Early direct deposit & premium perks</span>
              </div>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
          We'll email you the moment early access opens — you'll be among the first to experience the fastest way to move money on iOS.
        </p>
        <div style="text-align:center;">
          <a href="https://ae1696fd259524c3a44e01d70ca577b0.ctonew.app" style="display:inline-block;padding:12px 32px;background:#1A73E8;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">Visit FluxPay</a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">FluxPay &mdash; Money, instantly.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
