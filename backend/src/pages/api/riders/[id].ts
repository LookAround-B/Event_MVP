import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withAuth } from '@/lib/auth-middleware';
import { validateInput } from '@/lib/validation';
import { ApiResponse } from '@/types';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { id } = req.query;
  const riderId = id as string;

  if (req.method === 'GET') {
    try {
      const rider = await prisma.rider.findUnique({
        where: { id: riderId },
        include: {
          registrations: {
            include: {
              event: true,
              horse: true,
            },
          },
        },
      });

      if (!rider) {
        return res.status(404).json({
          success: false,
          message: 'Rider not found',
          error: 'NOT_FOUND',
          statusCode: 404,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Rider retrieved successfully',
        statusCode: 200,
        data: rider,
      });
    } catch (error) {
      console.error('Rider GET error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve rider',
        error: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { firstName, lastName, email, mobile, gender, dob, aadhaarNumber } = req.body;

      const validation = validateInput({
        firstName: { type: 'string', required: false, min: 1, max: 100 },
        lastName: { type: 'string', required: false, min: 1, max: 100 },
        email: { type: 'string', required: false },
        mobile: { type: 'string', required: false, max: 20 },
        gender: { type: 'string', required: false, max: 50 },
        dob: { type: 'string', required: false },
        aadhaarNumber: { type: 'string', required: false, max: 100 },
      }, req.body);

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: 'VALIDATION_ERROR',
          statusCode: 400,
          data: validation.errors,
        });
      }

      const rider = await prisma.rider.update({
        where: { id: riderId },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(email && { email }),
          ...(mobile !== undefined && { mobile }),
          ...(gender && { gender }),
          ...(dob && { dob: new Date(dob) }),
          ...(aadhaarNumber && { aadhaarNumber }),
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Rider updated successfully',
        statusCode: 200,
        data: rider,
      });
    } catch (error) {
      console.error('Rider PUT error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update rider',
        error: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.rider.delete({
        where: { id: riderId },
      });

      return res.status(200).json({
        success: true,
        message: 'Rider deleted successfully',
        statusCode: 200,
      });
    } catch (error) {
      console.error('Rider DELETE error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete rider',
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
