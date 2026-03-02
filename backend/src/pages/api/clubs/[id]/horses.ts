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

  const { id } = req.query;
  const clubId = typeof id === 'string' ? id : id?.[0];

  if (!clubId) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Club ID is required',
    });
  }

  if (req.method === 'GET') {
    return withAuth(async (authReq, authRes) => {
      try {
        const horses = await prisma.horse.findMany({
          where: { clubId },
          select: {
            id: true,
            eId: true,
            name: true,
            color: true,
            passportNumber: true,
            horseCode: true,
            gender: true,
            yearOfBirth: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        return authRes.status(200).json({
          success: true,
          statusCode: 200,
          message: 'Club horses retrieved successfully',
          data: horses.map(h => ({
            ...h,
            createdAt: h.createdAt.toISOString(),
          })),
        });
      } catch (error) {
        console.error('Get club horses error:', error);
        return authRes.status(500).json({
          success: false,
          statusCode: 500,
          message: 'Failed to retrieve horses',
        });
      }
    })(req, res);
  }

  if (req.method === 'POST') {
    return withAuth(async (authReq, authRes) => {
      try {
        const { name, color, yearOfBirth, passportNumber, horseCode, gender } = authReq.body;

        if (!name || !gender) {
          return authRes.status(400).json({
            success: false,
            statusCode: 400,
            message: 'Horse name and gender are required',
          });
        }

        if (!passportNumber && !horseCode) {
          return authRes.status(400).json({
            success: false,
            statusCode: 400,
            message: 'Either passport number or horse code is required',
          });
        }

        const horse = await prisma.horse.create({
          data: {
            name,
            color,
            yearOfBirth: yearOfBirth ? parseInt(yearOfBirth) : undefined,
            passportNumber,
            horseCode,
            gender,
            clubId,
          },
        });

        return authRes.status(201).json({
          success: true,
          statusCode: 201,
          message: 'Horse added to club successfully',
          data: {
            ...horse,
            createdAt: horse.createdAt.toISOString(),
          },
        });
      } catch (error) {
        console.error('Add horse error:', error);
        return authRes.status(500).json({
          success: false,
          statusCode: 500,
          message: 'Failed to add horse',
        });
      }
    })(req, res);
  }

  return res.status(405).json({
    success: false,
    statusCode: 405,
    message: `Method ${req.method} not allowed`,
  });
}

export default handler;
