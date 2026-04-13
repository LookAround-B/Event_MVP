import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withRole, AuthenticatedRequest } from '@/lib/auth-middleware';
import { ApiResponse } from '@/types';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  gender?: string;
  createdAt: string;
}

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse | User>
) {
  // CORS headers - handle preflight
  const origin = req.headers.origin || 'http://localhost:3000';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  const { method } = req;

  const userId = typeof id === 'string' ? id : id?.[0];

  if (method === 'GET') {
    try {
      if (!userId) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'User ID is required',
        });
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          gender: true,
          createdAt: true,
        },
      });

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          statusCode: 404,
          message: 'User not found',
        });
      }

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'User retrieved successfully',
        ...(targetUser && {
          ...targetUser,
          name: `${targetUser.firstName} ${targetUser.lastName}`,
          createdAt: targetUser.createdAt.toISOString(),
        }),
      });
    } catch (error) {
      console.error('User GET error:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Failed to retrieve user',
      });
    }
  }

  if (method === 'PUT') {
    try {
      if (!userId) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'User ID is required',
        });
      }

      const { firstName, lastName, gender, phone, isApproved, isActive } = req.body;

      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          statusCode: 404,
          message: 'User not found',
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(gender !== undefined ? { gender: gender || null } : {}),
          ...(phone !== undefined ? { phone: phone || null } : {}),
          ...(isApproved !== undefined ? { isApproved: Boolean(isApproved) } : {}),
          ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          gender: true,
          createdAt: true,
        },
      });

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'User updated successfully',
        ...(updatedUser && {
          ...updatedUser,
          name: `${updatedUser.firstName} ${updatedUser.lastName}`,
          createdAt: updatedUser.createdAt.toISOString(),
        }),
      });
    } catch (error) {
      console.error('User PUT error:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Failed to update user',
      });
    }
  }

  if (method === 'DELETE') {
    try {
      if (!userId) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'User ID is required',
        });
      }

      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          statusCode: 404,
          message: 'User not found',
        });
      }

      await prisma.user.delete({
        where: { id: userId },
      });

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'User deleted successfully',
      });
    } catch (error) {
      console.error('User DELETE error:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Failed to delete user',
      });
    }
  }

  return res.status(405).json({
    success: false,
    statusCode: 405,
    message: `Method ${method} not allowed`,
  });
}

export default withRole('admin')(handler);
