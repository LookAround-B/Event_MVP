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
      const { eventId, riderId, horseId, categoryId } = req.body;

      const validation = validateInput({
        eventId: { type: 'string', required: true },
        riderId: { type: 'string', required: true },
        horseId: { type: 'string', required: true },
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
          horseId,
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

      // Fetch category to get price
      const category = await prisma.eventCategory.findUnique({
        where: { id: categoryId },
        select: { id: true, name: true, price: true },
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found',
          error: 'NOT_FOUND',
          statusCode: 404,
        });
      }

      // Default GST rates (CGST: 9%, SGST: 9%, IGST: 18%)
      const CGST_RATE = 9;
      const SGST_RATE = 9;
      const IGST_RATE = 18;

      // Calculate amounts
      const eventAmount = category.price || 0;
      const stableAmount = 0; // Can be configured later
      const subtotal = eventAmount + stableAmount;
      
      // Use IGST by default (18%)
      const gstAmount = Math.round((subtotal * IGST_RATE) / 100);
      const totalAmount = subtotal + gstAmount;

      const registration = await prisma.registration.create({
        data: {
          eventId,
          riderId,
          horseId,
          categoryId,
          paymentStatus: 'UNPAID',
          eventAmount,
          stableAmount,
          gstAmount,
          totalAmount,
        },
        include: {
          rider: true,
          horse: true,
          event: true,
          category: true,
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
