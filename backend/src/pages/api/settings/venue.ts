import type { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withRole, AuthenticatedRequest } from '@/lib/auth-middleware';
import { ApiResponse } from '@/types';

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse>
) {
  const origin = req.headers.origin || 'http://localhost:3000';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const venue = await prisma.venue.findFirst({
        where: { isDefault: true },
      });

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Venue retrieved successfully',
        data: venue,
      });
    } catch (error) {
      console.error('GET venue error:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Failed to retrieve venue',
      });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { name, address } = req.body;

      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Venue name is required',
        });
      }

      // Find existing default venue or create one
      const existing = await prisma.venue.findFirst({
        where: { isDefault: true },
      });

      let venue;
      if (existing) {
        venue = await prisma.venue.update({
          where: { id: existing.id },
          data: {
            name: name.trim(),
            address: address?.trim() || null,
          },
        });
      } else {
        venue = await prisma.venue.create({
          data: {
            name: name.trim(),
            address: address?.trim() || null,
            isDefault: true,
          },
        });
      }

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Venue updated successfully',
        data: venue,
      });
    } catch (error) {
      console.error('PUT venue error:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Failed to update venue',
      });
    }
  }

  return res.status(405).json({
    success: false,
    statusCode: 405,
    message: `Method ${req.method} not allowed`,
  });
}

export default withRole('admin')(handler);
