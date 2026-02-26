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
        const categories = await prisma.eventCategory.findMany({
          where: { isActive: true },
          orderBy: { name: 'asc' },
        });

        return authRes.status(200).json({
          statusCode: 200,
          message: 'Event categories retrieved successfully',
          data: categories,
        });
      } catch (error) {
        console.error('GET event categories error:', error);
        return authRes.status(500).json({
          statusCode: 500,
          message: 'Failed to retrieve event categories',
        });
      }
    })(req, res);
  }

  if (req.method === 'POST') {
    return withAuth(async (authReq, authRes) => {
      try {
        const { name, price, cgst = 0, sgst = 0, igst = 0, description } = authReq.body;

        if (!name || price === undefined) {
          return authRes.status(400).json({
            statusCode: 400,
            message: 'Name and price are required',
          });
        }

        const category = await prisma.eventCategory.create({
          data: {
            name,
            price,
            cgst: parseFloat(cgst) || 0,
            sgst: parseFloat(sgst) || 0,
            igst: parseFloat(igst) || 0,
            description,
          },
        });

        return authRes.status(201).json({
          statusCode: 201,
          message: 'Event category created successfully',
          data: category,
        });
      } catch (error) {
        console.error('POST event category error:', error);
        return authRes.status(500).json({
          statusCode: 500,
          message: 'Failed to create event category',
        });
      }
    })(req, res);
  }

  if (req.method === 'PUT') {
    return withAuth(async (authReq, authRes) => {
      try {
        const { id, name, price, cgst, sgst, igst, description } = authReq.body;

        if (!id) {
          return authRes.status(400).json({
            statusCode: 400,
            message: 'Category ID is required',
          });
        }

        const category = await prisma.eventCategory.update({
          where: { id },
          data: {
            ...(name && { name }),
            ...(price !== undefined && { price }),
            ...(cgst !== undefined && { cgst: parseFloat(cgst) }),
            ...(sgst !== undefined && { sgst: parseFloat(sgst) }),
            ...(igst !== undefined && { igst: parseFloat(igst) }),
            ...(description && { description }),
          },
        });

        return authRes.status(200).json({
          statusCode: 200,
          message: 'Event category updated successfully',
          data: category,
        });
      } catch (error) {
        console.error('PUT event category error:', error);
        return authRes.status(500).json({
          statusCode: 500,
          message: 'Failed to update event category',
        });
      }
    })(req, res);
  }

  if (req.method === 'DELETE') {
    return withAuth(async (authReq, authRes) => {
      try {
        const { id } = authReq.body;

        if (!id) {
          return authRes.status(400).json({
            statusCode: 400,
            message: 'Category ID is required',
          });
        }

        await prisma.eventCategory.update({
          where: { id },
          data: { isActive: false },
        });

        return authRes.status(200).json({
          statusCode: 200,
          message: 'Event category deleted successfully',
        });
      } catch (error) {
        console.error('DELETE event category error:', error);
        return authRes.status(500).json({
          statusCode: 500,
          message: 'Failed to delete event category',
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
