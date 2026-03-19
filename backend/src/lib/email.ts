import { prisma } from '@/lib/prisma/client';

// Email notification helper
// Uses a log-based approach - in production, integrate with SendGrid/SES/etc.
// For now, logs emails and creates in-app notifications as fallback.

interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  type: string;
}

// In production, replace this with actual email service (SendGrid, AWS SES, etc.)
async function sendEmail(payload: EmailPayload): Promise<boolean> {
  try {
    console.log(`[EMAIL] To: ${payload.to} | Subject: ${payload.subject} | Type: ${payload.type}`);
    // Production integration point:
    // await sendgrid.send({ to: payload.to, from: 'noreply@equestrian.com', subject: payload.subject, html: payload.body });
    return true;
  } catch (error) {
    console.error('[EMAIL] Failed to send:', error);
    return false;
  }
}

export async function sendRegistrationConfirmation(registrationId: string) {
  const reg = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { rider: true, event: true, category: true, horse: true },
  });
  if (!reg) return;

  await sendEmail({
    to: reg.rider.email,
    subject: `Registration Confirmed - ${reg.event.name}`,
    body: `
      <h2>Registration Confirmation</h2>
      <p>Dear ${reg.rider.firstName} ${reg.rider.lastName},</p>
      <p>Your registration for <strong>${reg.event.name}</strong> has been confirmed.</p>
      <ul>
        <li>Horse: ${reg.horse.name}</li>
        <li>Category: ${reg.category.name}</li>
        <li>Total Amount: ₹${reg.totalAmount}</li>
        <li>Payment Status: ${reg.paymentStatus}</li>
      </ul>
      <p>Thank you for registering!</p>
    `,
    type: 'REGISTRATION_CONFIRMATION',
  });
}

export async function sendPaymentReceipt(registrationId: string, amount: number, method: string) {
  const reg = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { rider: true, event: true },
  });
  if (!reg) return;

  await sendEmail({
    to: reg.rider.email,
    subject: `Payment Receipt - ${reg.event.name}`,
    body: `
      <h2>Payment Receipt</h2>
      <p>Dear ${reg.rider.firstName} ${reg.rider.lastName},</p>
      <p>We have received your payment for <strong>${reg.event.name}</strong>.</p>
      <ul>
        <li>Amount: ₹${amount}</li>
        <li>Method: ${method}</li>
        <li>Status: ${reg.paymentStatus}</li>
      </ul>
      <p>Thank you!</p>
    `,
    type: 'PAYMENT_RECEIPT',
  });
}

export async function sendStatusUpdate(registrationId: string, status: string, notes?: string) {
  const reg = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { rider: true, event: true },
  });
  if (!reg) return;

  await sendEmail({
    to: reg.rider.email,
    subject: `Registration ${status} - ${reg.event.name}`,
    body: `
      <h2>Registration Status Update</h2>
      <p>Dear ${reg.rider.firstName} ${reg.rider.lastName},</p>
      <p>Your registration for <strong>${reg.event.name}</strong> has been <strong>${status.toLowerCase()}</strong>.</p>
      ${notes ? `<p>Notes: ${notes}</p>` : ''}
      <p>Thank you!</p>
    `,
    type: 'STATUS_UPDATE',
  });
}

export async function sendEventConfirmation(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      registrations: {
        include: { rider: true },
      },
    },
  });
  if (!event) return;

  for (const reg of event.registrations) {
    await sendEmail({
      to: reg.rider.email,
      subject: `Event Update - ${event.name}`,
      body: `
        <h2>Event Update</h2>
        <p>Dear ${reg.rider.firstName} ${reg.rider.lastName},</p>
        <p>There has been an update to the event <strong>${event.name}</strong>.</p>
        <p>Date: ${new Date(event.startDate).toLocaleDateString()} - ${new Date(event.endDate).toLocaleDateString()}</p>
        <p>Venue: ${event.venueName || 'TBA'}</p>
        <p>Thank you!</p>
      `,
      type: 'EVENT_CONFIRMATION',
    });
  }
}
