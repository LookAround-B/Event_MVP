import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withRole, AuthenticatedRequest } from '@/lib/auth-middleware';
import { createAuditLog } from '@/lib/audit';
import { ApiResponse } from '@/types';

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { id } = req.query;
  const registrationId = id as string;

  if (req.method === 'GET') {
    try {
      const registration = await prisma.registration.findUnique({
        where: { id: registrationId },
        include: {
          rider: true,
          horse: true,
          event: true,
        },
      });

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: 'Registration not found',
          error: 'NOT_FOUND',
          statusCode: 404,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Registration retrieved successfully',
        statusCode: 200,
        data: registration,
      });
    } catch (error) {
      console.error('Registration GET error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve registration',
        error: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  }

  if (req.method === 'PUT') {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden', error: 'FORBIDDEN', statusCode: 403 });
    }
    try {
      const { paymentStatus } = req.body;

      if (paymentStatus && !['PAID', 'UNPAID', 'PARTIAL', 'CANCELLED'].includes(paymentStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: 'VALIDATION_ERROR',
          statusCode: 400,
          data: { paymentStatus: 'Invalid payment status' },
        });
      }

      // Get existing registration for audit
      const existingRegistration = await prisma.registration.findUnique({
        where: { id: registrationId },
      });

      if (!existingRegistration) {
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
          ...(paymentStatus && { paymentStatus }),
        },
        include: {
          rider: true,
          horse: true,
          event: true,
        },
      });

      // Create audit log if payment status changed
      if (paymentStatus && paymentStatus !== existingRegistration.paymentStatus && req.user?.id) {
        await createAuditLog({
          userId: req.user.id,
          action: 'Payment Status Changed',
          entity: 'Registration',
          entityId: registrationId,
          oldValues: { paymentStatus: existingRegistration.paymentStatus },
          newValues: { paymentStatus: registration.paymentStatus },
          changes: ['paymentStatus'],
          ipAddress: req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Registration updated successfully',
        statusCode: 200,
        data: registration,
      });
    } catch (error) {
      console.error('Registration PUT error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update registration',
        error: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  }

  if (req.method === 'DELETE') {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden', error: 'FORBIDDEN', statusCode: 403 });
    }
    try {
      await prisma.registration.delete({
        where: { id: registrationId },
      });

      return res.status(200).json({
        success: true,
        message: 'Registration deleted successfully',
        statusCode: 200,
      });
    } catch (error) {
      console.error('Registration DELETE error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete registration',
        error: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed',
    error: 'METHOD_NOT_ALLOWED',
    statusCode: 405,
  });
}

export default withRole('admin', 'club', 'rider')(handler);
