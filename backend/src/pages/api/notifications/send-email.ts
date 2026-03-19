import type { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import { ApiResponse } from '@/types';
import { sendRegistrationConfirmation, sendPaymentReceipt, sendStatusUpdate, sendEventConfirmation } from '@/lib/email';

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      error: 'METHOD_NOT_ALLOWED',
      statusCode: 405,
    });
  }

  const { type, registrationId, eventId, amount, method, status, notes } = req.body;

  if (!type) {
    return res.status(400).json({
      success: false,
      message: 'Email type is required',
      error: 'VALIDATION_ERROR',
      statusCode: 400,
    });
  }

  try {
    switch (type) {
      case 'registration_confirmation':
        if (!registrationId) {
          return res.status(400).json({ success: false, message: 'registrationId required', error: 'VALIDATION_ERROR', statusCode: 400 });
        }
        await sendRegistrationConfirmation(registrationId);
        break;

      case 'payment_receipt':
        if (!registrationId) {
          return res.status(400).json({ success: false, message: 'registrationId required', error: 'VALIDATION_ERROR', statusCode: 400 });
        }
        await sendPaymentReceipt(registrationId, amount || 0, method || 'Unknown');
        break;

      case 'status_update':
        if (!registrationId || !status) {
          return res.status(400).json({ success: false, message: 'registrationId and status required', error: 'VALIDATION_ERROR', statusCode: 400 });
        }
        await sendStatusUpdate(registrationId, status, notes);
        break;

      case 'event_confirmation':
        if (!eventId) {
          return res.status(400).json({ success: false, message: 'eventId required', error: 'VALIDATION_ERROR', statusCode: 400 });
        }
        await sendEventConfirmation(eventId);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid type. Options: registration_confirmation, payment_receipt, status_update, event_confirmation',
          error: 'VALIDATION_ERROR',
          statusCode: 400,
        });
    }

    // Create in-app notification for tracking
    if (req.user?.id) {
      await prisma.notification.create({
        data: {
          userId: req.user.id,
          type: 'SYSTEM',
          title: 'Email Sent',
          message: `${type.replace(/_/g, ' ')} email sent successfully.`,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Email notification sent successfully',
      statusCode: 200,
    });
  } catch (error) {
    console.error('Email send error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: 'INTERNAL_ERROR',
      statusCode: 500,
    });
  }
}

export default withAuth(handler);
