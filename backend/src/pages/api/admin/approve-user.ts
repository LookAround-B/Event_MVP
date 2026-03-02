import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withRole } from '@/lib/auth-middleware';
import { ApiResponse } from '@/types';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method === 'GET') {
    try {
      const pendingUsers = await prisma.user.findMany({
        where: {
          isApproved: false,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          gender: true,
          phone: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Pending users retrieved successfully',
        data: pendingUsers,
      });
    } catch (error) {
      console.error('GET pending users error:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Failed to retrieve pending users',
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'User ID is required',
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          statusCode: 404,
          message: 'User not found',
        });
      }

      if (user.isApproved) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'User is already approved',
        });
      }

      const approvedUser = await prisma.user.update({
        where: { id: userId },
        data: { isApproved: true },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isApproved: true,
        },
      });

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'User approved successfully',
        data: approvedUser,
      });
    } catch (error) {
      console.error('POST approve user error:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Failed to approve user',
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
