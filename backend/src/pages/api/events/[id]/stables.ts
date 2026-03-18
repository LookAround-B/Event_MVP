import type { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withPermission, AuthenticatedRequest } from '@/lib/auth-middleware';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id: eventId } = req.query;

  if (!eventId || typeof eventId !== 'string') {
    return res.status(400).json({ success: false, message: 'Event ID is required', statusCode: 400 });
  }

  // Verify event exists
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true, name: true } });
  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found', statusCode: 404 });
  }

  if (req.method === 'GET') {
    try {
      const stables = await prisma.stable.findMany({
        where: { eventId },
        select: {
          id: true,
          eId: true,
          number: true,
          capacity: true,
          pricePerStable: true,
          isAvailable: true,
          venueId: true,
          createdAt: true,
          _count: { select: { bookings: true } },
        },
        orderBy: { number: 'asc' },
      });

      return res.status(200).json({
        success: true,
        message: 'Stables retrieved successfully',
        statusCode: 200,
        data: {
          event: { id: event.id, name: event.name },
          stables: stables.map(s => ({
            ...s,
            bookingCount: s._count.bookings,
            _count: undefined,
          })),
        },
      });
    } catch (error) {
      console.error('Stables GET error:', error);
      return res.status(500).json({ success: false, message: 'Failed to retrieve stables', statusCode: 500 });
    }
  }

  if (req.method === 'POST') {
    try {
      const { number, capacity, pricePerStable, isAvailable, venueId } = req.body;

      if (!number || typeof number !== 'string' || !number.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Stable number/name is required',
          statusCode: 400,
        });
      }

      const stable = await prisma.stable.create({
        data: {
          number: number.trim(),
          capacity: parseInt(capacity) || 1,
          pricePerStable: parseFloat(pricePerStable) || 0,
          isAvailable: isAvailable !== false,
          eventId,
          venueId: venueId || null,
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Stable created successfully',
        statusCode: 201,
        data: stable,
      });
    } catch (error) {
      console.error('Stables POST error:', error);
      return res.status(500).json({ success: false, message: 'Failed to create stable', statusCode: 500 });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed', statusCode: 405 });
}

export default withPermission('Edit', 'Stable')(handler);
