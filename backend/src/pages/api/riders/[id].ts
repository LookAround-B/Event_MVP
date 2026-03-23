import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withAuth } from '@/lib/auth-middleware';
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
          club: { select: { id: true, name: true, shortCode: true } },
          horses: {
            select: {
              id: true,
              eId: true,
              name: true,
              breed: true,
              color: true,
              gender: true,
              yearOfBirth: true,
              horseCode: true,
              height: true,
              isActive: true,
            },
          },
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
      const { firstName, lastName, email, mobile, gender, dob, aadhaarNumber, address, efiRiderId, socialLinks, optionalPhone, imageUrl, eId, clubId } = req.body;

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

      const updateData: any = {};

      if (firstName !== undefined) updateData.firstName = (firstName || '').trim();
      if (lastName !== undefined) updateData.lastName = (lastName || '').trim();
      if (email !== undefined) updateData.email = (email || '').trim();
      if (mobile !== undefined) updateData.mobile = mobile || null;
      if (optionalPhone !== undefined) updateData.optionalPhone = optionalPhone || null;
      if (gender !== undefined) updateData.gender = gender || null;
      if (dob !== undefined) updateData.dob = dob ? new Date(dob) : null;
      if (aadhaarNumber !== undefined) updateData.aadhaarNumber = aadhaarNumber || null;
      if (address !== undefined) updateData.address = address || null;
      if (efiRiderId !== undefined) updateData.efiRiderId = efiRiderId || null;
      if (eId !== undefined) updateData.eId = eId;
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;
      if (socialLinks !== undefined) updateData.socialLinks = socialLinks || null;
      if (clubId !== undefined) updateData.clubId = clubId || null;

      const rider = await prisma.rider.update({
        where: { id: riderId },
        data: updateData,
        include: {
          club: { select: { id: true, name: true } },
          horses: {
            select: {
              id: true, eId: true, name: true, breed: true, color: true,
              gender: true, yearOfBirth: true, horseCode: true, height: true, isActive: true,
            },
          },
        },
      });

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
