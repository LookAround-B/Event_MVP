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
      const categories = await prisma.eventCategory.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Event categories retrieved successfully',
        data: categories,
      });
    } catch (error) {
      console.error('GET event categories error:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Failed to retrieve event categories',
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, price, cgst = 0, sgst = 0, igst = 0, description } = req.body;

      if (!name || price === undefined) {
        return res.status(400).json({
          success: false,
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

      return res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Event category created successfully',
        data: category,
      });
    } catch (error) {
      console.error('POST event category error:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Failed to create event category',
      });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, name, price, cgst, sgst, igst, description } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
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

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Event category updated successfully',
        data: category,
      });
    } catch (error) {
      console.error('PUT event category error:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Failed to update event category',
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Category ID is required',
        });
      }

      await prisma.eventCategory.update({
        where: { id },
        data: { isActive: false },
      });

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Event category deleted successfully',
      });
    } catch (error) {
      console.error('DELETE event category error:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Failed to delete event category',
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
