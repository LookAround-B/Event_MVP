import type { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withRole, AuthenticatedRequest } from '@/lib/auth-middleware';
import { createAuditLog } from '@/lib/audit';
import { sendStatusUpdate } from '@/lib/email';
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
  const { action, rejectionNotes } = req.body;

  if (!action || !['APPROVED', 'REJECTED'].includes(action)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid action. Must be APPROVED or REJECTED',
      error: 'VALIDATION_ERROR',
      statusCode: 400,
    });
  }

  if (action === 'REJECTED' && !rejectionNotes) {
    return res.status(400).json({
      success: false,
      message: 'Rejection notes are required when rejecting',
      error: 'VALIDATION_ERROR',
      statusCode: 400,
    });
  }

  try {
    const existing = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { rider: true, event: true },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
        error: 'NOT_FOUND',
        statusCode: 404,
      });
    }

    const registration = await prisma.registration.update({
      where: { id: registrationId },
      data: {
        approvalStatus: action,
        approvedBy: req.user?.id,
        approvedAt: new Date(),
        ...(action === 'REJECTED' && { rejectionNotes }),
      },
      include: {
        rider: true,
        horse: true,
        event: true,
        category: true,
      },
    });

    // Create notification for the rider's user
    if (existing.userId) {
      await prisma.notification.create({
        data: {
          userId: existing.userId,
          type: action === 'APPROVED' ? 'REGISTRATION_APPROVED' : 'REGISTRATION_REJECTED',
          title: action === 'APPROVED' ? 'Registration Approved' : 'Registration Rejected',
          message: action === 'APPROVED'
            ? `Your registration for ${existing.event.name} has been approved.`
            : `Your registration for ${existing.event.name} has been rejected. Reason: ${rejectionNotes}`,
          link: `/registrations`,
        },
      });
    }

    // Audit log
    if (req.user?.id) {
      await createAuditLog({
        userId: req.user.id,
        action: `Registration ${action}`,
        entity: 'Registration',
        entityId: registrationId,
        oldValues: { approvalStatus: existing.approvalStatus },
        newValues: { approvalStatus: action, rejectionNotes },
        changes: ['approvalStatus'],
        ipAddress: req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      });
    }

    // Send email notification
    await sendStatusUpdate(registrationId, action, rejectionNotes);

    return res.status(200).json({
      success: true,
      message: `Registration ${action.toLowerCase()} successfully`,
      statusCode: 200,
      data: registration,
    });
  } catch (error) {
    console.error('Registration approval error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process approval',
      error: 'INTERNAL_ERROR',
      statusCode: 500,
    });
  }
}

export default withRole('admin')(handler);
