import type { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withPermission, AuthenticatedRequest } from '@/lib/auth-middleware';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, message: 'Stable ID is required', statusCode: 400 });
  }

  const stable = await prisma.stable.findUnique({
    where: { id },
    include: { event: { select: { id: true, name: true } }, _count: { select: { bookings: true } } },
  });

  if (!stable) {
    return res.status(404).json({ success: false, message: 'Stable not found', statusCode: 404 });
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: 'Stable retrieved successfully',
      statusCode: 200,
      data: { ...stable, bookingCount: stable._count.bookings, _count: undefined },
    });
  }

  if (req.method === 'PUT') {
    try {
      const { number, capacity, pricePerStable, isAvailable, venueId } = req.body;

      const updated = await prisma.stable.update({
        where: { id },
        data: {
          ...(number !== undefined && { number: String(number).trim() }),
          ...(capacity !== undefined && { capacity: parseInt(capacity) || 1 }),
          ...(pricePerStable !== undefined && { pricePerStable: parseFloat(pricePerStable) || 0 }),
          ...(isAvailable !== undefined && { isAvailable: Boolean(isAvailable) }),
          ...(venueId !== undefined && { venueId: venueId || null }),
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Stable updated successfully',
        statusCode: 200,
        data: updated,
      });
    } catch (error) {
      console.error('Stable PUT error:', error);
      return res.status(500).json({ success: false, message: 'Failed to update stable', statusCode: 500 });
    }
  }

  if (req.method === 'DELETE') {
    if (stable._count.bookings > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete stable with existing bookings',
        statusCode: 400,
      });
    }

    try {
      await prisma.stable.delete({ where: { id } });
      return res.status(200).json({
        success: true,
        message: 'Stable deleted successfully',
        statusCode: 200,
      });
    } catch (error) {
      console.error('Stable DELETE error:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete stable', statusCode: 500 });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed', statusCode: 405 });
}

export default withPermission('Edit', 'Stable')(handler);
