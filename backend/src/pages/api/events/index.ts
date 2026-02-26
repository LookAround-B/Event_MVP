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
              { venueName: { contains: search as string, mode: 'insensitive' as 'insensitive' } },
              { description: { contains: search as string, mode: 'insensitive' as 'insensitive' } },
            ],
          }
        : {};

      const [events, total] = await Promise.all([
        prisma.event.findMany({
          where,
          skip,
          take: limitNum,
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            description: true,
            venueName: true,
            createdAt: true,
            _count: {
              select: { registrations: true },
            },
          },
          orderBy: { startDate: 'asc' },
        }),
        prisma.event.count({ where }),
      ]);

      return res.status(200).json({
        success: true,
        message: 'Events retrieved successfully',
        statusCode: 200,
        data: {
          events: events.map(e => ({
            ...e,
            registrationCount: e._count.registrations,
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
      console.error('Events GET error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve events',
        error: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  }

  if (method === 'POST') {
    try {
      const { name, date, location, description, capacity } = req.body;

      const validation = validateInput({
        name: { type: 'string', required: true, min: 1, max: 255 },
        date: { type: 'string', required: true },
        location: { type: 'string', required: true, min: 1, max: 255 },
        description: { type: 'string', required: false, max: 1000 },
        capacity: { type: 'number', required: true, min: 1 },
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

      const event = await prisma.event.create({
        data: {
          name,
          date: new Date(date),
          location,
          description,
          capacity,
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Event created successfully',
        statusCode: 201,
        data: event,
      });
    } catch (error) {
      console.error('Events POST error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create event',
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
