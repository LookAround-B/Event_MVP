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
              { name: { contains: search as string, mode: 'insensitive' as 'insensitive' } },
              { color: { contains: search as string, mode: 'insensitive' as 'insensitive' } },
              { gender: { contains: search as string, mode: 'insensitive' as 'insensitive' } },
            ],
          }
        : {};

      const [horses, total] = await Promise.all([
        prisma.horse.findMany({
          where,
          skip,
          take: limitNum,
          select: {
            id: true,
            name: true,
            color: true,
            gender: true,
            yearOfBirth: true,
            passportNumber: true,
            createdAt: true,
            _count: {
              select: { registrations: true },
            },
          },
          orderBy: { name: 'asc' },
        }),
        prisma.horse.count({ where }),
      ]);

      return res.status(200).json({
        success: true,
        message: 'Horses retrieved successfully',
        statusCode: 200,
        data: {
          horses: horses.map(h => ({
            ...h,
            registrationCount: h.registrations.length,
            registrations: undefined,
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
      console.error('Horses GET error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve horses',
        error: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  }

  if (method === 'POST') {
    try {
      const { name, breed, age, color, height } = req.body;

      const validation = validateInput({
        name: { type: 'string', required: true, min: 1, max: 100 },
        breed: { type: 'string', required: true, min: 1, max: 100 },
        age: { type: 'number', required: true, min: 0 },
        color: { type: 'string', required: false, max: 100 },
        height: { type: 'number', required: false, min: 0 },
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

      const horse = await prisma.horse.create({
        data: {
          name,
          breed,
          age,
          color,
          height,
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Horse created successfully',
        statusCode: 201,
        data: horse,
      });
    } catch (error) {
      console.error('Horses POST error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create horse',
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
