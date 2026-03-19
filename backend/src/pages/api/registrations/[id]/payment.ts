import type { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import { createAuditLog } from '@/lib/audit';
import { sendPaymentReceipt } from '@/lib/email';
import { ApiResponse } from '@/types';

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

  const { id } = req.query;
  const registrationId = id as string;
  const { paymentMethod, paymentRef, paymentNotes, amount } = req.body;

  if (!paymentMethod) {
    return res.status(400).json({
      success: false,
      message: 'Payment method is required',
      error: 'VALIDATION_ERROR',
      statusCode: 400,
    });
  }

  const validMethods = ['CARD', 'BANK_TRANSFER', 'CHEQUE', 'UPI', 'CASH'];
  if (!validMethods.includes(paymentMethod)) {
    return res.status(400).json({
      success: false,
      message: `Invalid payment method. Must be one of: ${validMethods.join(', ')}`,
      error: 'VALIDATION_ERROR',
      statusCode: 400,
    });
  }

  try {
    const existing = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { event: true },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
        error: 'NOT_FOUND',
        statusCode: 404,
      });
    }

    const paymentAmount = amount ? parseFloat(amount) : existing.totalAmount;
    const newStatus = paymentAmount >= existing.totalAmount ? 'PAID' : 'PARTIAL';

    // Update registration payment info
    const registration = await prisma.registration.update({
      where: { id: registrationId },
      data: {
        paymentMethod,
        paymentRef,
        paymentNotes,
        paymentStatus: newStatus,
      },
      include: {
        rider: true,
        horse: true,
        event: true,
        category: true,
      },
    });

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        registrationId,
        amount: paymentAmount,
        gstAmount: existing.gstAmount,
        totalAmount: paymentAmount,
        status: newStatus,
        paymentMethod,
        referenceNumber: paymentRef,
        notes: paymentNotes,
      },
    });

    // Notify the user
    if (existing.userId) {
      await prisma.notification.create({
        data: {
          userId: existing.userId,
          type: 'PAYMENT_RECEIVED',
          title: 'Payment Recorded',
          message: `Payment of ₹${paymentAmount} recorded for ${existing.event.name} via ${paymentMethod}.`,
          link: `/registrations`,
        },
      });
    }

    // Send email receipt
    await sendPaymentReceipt(registrationId, paymentAmount, paymentMethod);

    // Audit log
    if (req.user?.id) {
      await createAuditLog({
        userId: req.user.id,
        action: 'Payment Recorded',
        entity: 'Registration',
        entityId: registrationId,
        oldValues: { paymentStatus: existing.paymentStatus },
        newValues: { paymentStatus: newStatus, paymentMethod, paymentRef },
        changes: ['paymentStatus', 'paymentMethod'],
        ipAddress: req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment recorded successfully',
      statusCode: 200,
      data: { registration, transaction },
    });
  } catch (error) {
    console.error('Payment recording error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record payment',
      error: 'INTERNAL_ERROR',
      statusCode: 500,
    });
  }
}

export default withAuth(handler);
