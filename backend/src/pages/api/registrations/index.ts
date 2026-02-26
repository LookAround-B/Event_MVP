import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withAuth } from '@/lib/auth-middleware';
import { validateInput } from '@/lib/validation';
import { ApiResponse } from '@/types';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { method } = req;

  if (method === 'GET') {
    try {
      const { page = '1', limit = '10', eventId, status } = req.query;
      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));
      const skip = (pageNum - 1) * limitNum;

      const where = {
        ...(eventId && { eventId: eventId as string }),
        ...(status && { paymentStatus: status as 'PAID' | 'UNPAID' | 'PARTIAL' | 'CANCELLED' }),
      };

      const [registrations, total] = await Promise.all([
        prisma.registration.findMany({
          where,
          skip,
          take: limitNum,
          include: {
            rider: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            horse: {
              select: { id: true, name: true, color: true, gender: true },
            },
            event: {
              select: { id: true, name: true, startDate: true, endDate: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.registration.count({ where }),
      ]);

      return res.status(200).json({
        success: true,
        message: 'Registrations retrieved successfully',
        statusCode: 200,
        data: {
          registrations,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      console.error('Registrations GET error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve registrations',
        error: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  }

  if (method === 'POST') {
    try {
      const { eventId, riderId, horseid, categoryId } = req.body;

      const validation = validateInput({
        eventId: { type: 'string', required: true },
        riderId: { type: 'string', required: true },
        horseid: { type: 'string', required: true },
        categoryId: { type: 'string', required: true },
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

      // Check if registration already exists
      const existing = await prisma.registration.findFirst({
        where: {
          eventId,
          riderId,
          horseid,
        },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Registration already exists',
          error: 'DUPLICATE_REGISTRATION',
          statusCode: 409,
        });
      }

      const registration = await prisma.registration.create({
        data: {
          eventId,
          riderId,
          horseid,
          categoryId,
          paymentStatus: 'UNPAID',
          eventAmount: 0,
          stableAmount: 0,
          gstAmount: 0,
          totalAmount: 0,
        },
        include: {
          rider: true,
          horse: true,
          event: true,
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Registration created successfully',
        statusCode: 201,
        data: registration,
      });
    } catch (error) {
      console.error('Registrations POST error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create registration',
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
