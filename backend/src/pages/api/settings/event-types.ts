import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withRole, AuthenticatedRequest } from '@/lib/auth-middleware';
import { ApiResponse } from '@/types';

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse>
) {
  const origin = req.headers.origin || 'http://localhost:3000';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const eventTypes = await prisma.eventType.findMany({
        orderBy: { name: 'asc' },
      });

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Event types retrieved successfully',
        data: eventTypes,
      });
    } catch (error) {
      console.error('GET event types error:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Failed to retrieve event types',
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, shortCode, description } = req.body;

      if (!name || !shortCode) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Name and short code are required',
        });
      }

      const eventType = await prisma.eventType.create({
        data: { name, shortCode, description },
      });

      return res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Event type created successfully',
        data: eventType,
      });
    } catch (error) {
      console.error('POST event type error:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Failed to create event type',
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
