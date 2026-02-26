import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withAuth } from '@/lib/auth-middleware';
import { ApiResponse } from '@/types';

async function handler(
  req: NextApiRequest,
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
    return withAuth(async (authReq, authRes) => {
      try {
        const eventTypes = await prisma.eventType.findMany({
          orderBy: { name: 'asc' },
        });

        return authRes.status(200).json({
          statusCode: 200,
          message: 'Event types retrieved successfully',
          data: eventTypes,
        });
      } catch (error) {
        console.error('GET event types error:', error);
        return authRes.status(500).json({
          statusCode: 500,
          message: 'Failed to retrieve event types',
        });
      }
    })(req, res);
  }

  if (req.method === 'POST') {
    return withAuth(async (authReq, authRes) => {
      try {
        const { name, shortCode, description } = authReq.body;

        if (!name || !shortCode) {
          return authRes.status(400).json({
            statusCode: 400,
            message: 'Name and short code are required',
          });
        }

        const eventType = await prisma.eventType.create({
          data: { name, shortCode, description },
        });

        return authRes.status(201).json({
          statusCode: 201,
          message: 'Event type created successfully',
          data: eventType,
        });
      } catch (error) {
        console.error('POST event type error:', error);
        return authRes.status(500).json({
          statusCode: 500,
          message: 'Failed to create event type',
        });
      }
    })(req, res);
  }

  return res.status(405).json({
    statusCode: 405,
    message: `Method ${req.method} not allowed`,
  });
}

export default handler;
