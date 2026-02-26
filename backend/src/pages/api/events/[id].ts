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
  const eventId = id as string;

  if (req.method === 'GET') {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          registrations: {
            include: {
              rider: true,
              horse: true,
            },
          },
        },
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
          error: 'NOT_FOUND',
          statusCode: 404,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Event retrieved successfully',
        statusCode: 200,
        data: event,
      });
    } catch (error) {
      console.error('Event GET error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve event',
        error: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { name, startDate, endDate, venueName, description, eventType } = req.body;

      const validation = validateInput({
        name: { type: 'string', required: false, min: 1, max: 255 },
        startDate: { type: 'string', required: false },
        endDate: { type: 'string', required: false },
        venueName: { type: 'string', required: false, min: 1, max: 255 },
        description: { type: 'string', required: false, max: 1000 },
        eventType: { type: 'string', required: false, min: 1, max: 100 },
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

      const event = await prisma.event.update({
        where: { id: eventId },
        data: {
          ...(name && { name }),
          ...(startDate && { startDate: new Date(startDate) }),
          ...(endDate && { endDate: new Date(endDate) }),
          ...(venueName && { venueName }),
          ...(description !== undefined && { description }),
          ...(eventType && { eventType }),
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Event updated successfully',
        statusCode: 200,
        data: event,
      });
    } catch (error) {
      console.error('Event PUT error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update event',
        error: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.event.delete({
        where: { id: eventId },
      });

      return res.status(200).json({
        success: true,
        message: 'Event deleted successfully',
        statusCode: 200,
      });
    } catch (error) {
      console.error('Event DELETE error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete event',
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
