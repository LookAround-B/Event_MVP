import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withAuth } from '@/lib/auth-middleware';
import { ApiResponse } from '@/types';

async function handler(
  req: NextApiRequest,
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

export default withAuth(handler);
