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
  const riderId = id as string;

  if (req.method === 'GET') {
    try {
      const rider = await prisma.rider.findUnique({
        where: { id: riderId },
        include: {
          registrations: {
            include: {
              event: true,
              horse: true,
            },
          },
        },
      });

      if (!rider) {
        return res.status(404).json({
          success: false,
          message: 'Rider not found',
          error: 'NOT_FOUND',
          statusCode: 404,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Rider retrieved successfully',
        statusCode: 200,
        data: rider,
      });
    } catch (error) {
      console.error('Rider GET error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve rider',
        error: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { firstName, lastName, email, mobile, gender, dob, aadhaarNumber, address, designation } = req.body;

      console.log('Rider PUT request for ID:', riderId, 'Body:', req.body);

      // Check if rider exists
      const existing = await prisma.rider.findUnique({
        where: { id: riderId },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Rider not found',
          error: 'NOT_FOUND',
          statusCode: 404,
        });
      }

      // Manual field updates
      const updateData: any = {};

      if (firstName && typeof firstName === 'string' && firstName.trim()) {
        updateData.firstName = firstName.trim();
      }
      if (lastName && typeof lastName === 'string' && lastName.trim()) {
        updateData.lastName = lastName.trim();
      }
      if (email && typeof email === 'string' && email.trim()) {
        updateData.email = email.trim();
      }
      if (mobile) {
        updateData.mobile = mobile;
      }
      if (gender) {
        updateData.gender = gender;
      }
      if (dob) {
        updateData.dob = new Date(dob);
      }
      if (aadhaarNumber) {
        updateData.aadhaarNumber = aadhaarNumber;
      }
      if (address) {
        updateData.address = address;
      }

      const rider = await prisma.rider.update({
        where: { id: riderId },
        data: updateData,
      });

      console.log('Rider updated successfully:', riderId);

      return res.status(200).json({
        success: true,
        message: 'Rider updated successfully',
        statusCode: 200,
        data: rider,
      });
    } catch (error) {
      console.error('Rider PUT error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update rider',
        error: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.rider.delete({
        where: { id: riderId },
      });

      return res.status(200).json({
        success: true,
        message: 'Rider deleted successfully',
        statusCode: 200,
      });
    } catch (error) {
      console.error('Rider DELETE error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete rider',
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
