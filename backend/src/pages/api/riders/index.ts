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
      const { page = '1', limit = '10', search = '' } = req.query;
      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));
      const skip = (pageNum - 1) * limitNum;

      const where = search
        ? {
            OR: [
              { firstName: { contains: search as string, mode: 'insensitive' as 'insensitive' } },
              { lastName: { contains: search as string, mode: 'insensitive' as 'insensitive' } },
              { email: { contains: search as string, mode: 'insensitive' as 'insensitive' } },
            ],
          }
        : {};

      const [riders, total] = await Promise.all([
        prisma.rider.findMany({
          where,
          skip,
          take: limitNum,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            mobile: true,
            gender: true,
            createdAt: true,
            _count: {
              select: { registrations: true },
            },
          },
          orderBy: { lastName: 'asc' },
        }),
        prisma.rider.count({ where }),
      ]);

      return res.status(200).json({
        success: true,
        message: 'Riders retrieved successfully',
        statusCode: 200,
        data: {
          riders: riders.map(r => ({
            ...r,
            registrationCount: r._count.registrations,
          })),
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      console.error('Riders GET error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve riders',
        error: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  }

  if (method === 'POST') {
    try {
      const { firstName, lastName, email, phone, level } = req.body;

      const validation = validateInput({
        firstName: { type: 'string', required: true, min: 1, max: 100 },
        lastName: { type: 'string', required: true, min: 1, max: 100 },
        email: { type: 'string', required: true },
        phone: { type: 'string', required: false, max: 20 },
        level: { type: 'string', required: true, enum: ['beginner', 'intermediate', 'advanced', 'professional'] },
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

      const existing = await prisma.rider.findUnique({
        where: { email },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Rider with this email already exists',
          error: 'DUPLICATE_EMAIL',
          statusCode: 409,
        });
      }

      const rider = await prisma.rider.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          level,
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Rider created successfully',
        statusCode: 201,
        data: rider,
      });
    } catch (error) {
      console.error('Riders POST error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create rider',
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
