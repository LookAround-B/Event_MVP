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
      statusCode: 400,
      message: 'Club ID is required',
    });
  }

  if (req.method === 'GET') {
    return withAuth(async (authReq, authRes) => {
      try {
        const riders = await prisma.rider.findMany({
          where: { clubId },
          select: {
            id: true,
            eId: true,
            firstName: true,
            lastName: true,
            email: true,
            efiRiderId: true,
            gender: true,
            dob: true,
            mobile: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        return authRes.status(200).json({
          statusCode: 200,
          message: 'Club riders retrieved successfully',
          data: riders.map(r => ({
            ...r,
            dob: r.dob ? r.dob.toISOString() : null,
            createdAt: r.createdAt.toISOString(),
          })),
        });
      } catch (error) {
        console.error('Get club riders error:', error);
        return authRes.status(500).json({
          statusCode: 500,
          message: 'Failed to retrieve riders',
        });
      }
    })(req, res);
  }

  if (req.method === 'POST') {
    return withAuth(async (authReq, authRes) => {
      try {
        const {
          firstName,
          lastName,
          email,
          efiRiderId,
          dob,
          mobile,
          address,
          gender,
        } = authReq.body;

        if (!firstName || !lastName || !email) {
          return authRes.status(400).json({
            statusCode: 400,
            message: 'firstName, lastName, and email are required',
          });
        }

        const rider = await prisma.rider.create({
          data: {
            firstName,
            lastName,
            email,
            efiRiderId,
            dob: dob ? new Date(dob) : undefined,
            mobile,
            address,
            gender,
            clubId,
          },
        });

        return authRes.status(201).json({
          statusCode: 201,
          message: 'Rider added to club successfully',
          data: {
            ...rider,
            dob: rider.dob ? rider.dob.toISOString() : null,
            createdAt: rider.createdAt.toISOString(),
          },
        });
      } catch (error) {
        console.error('Add rider error:', error);
        return authRes.status(500).json({
          statusCode: 500,
          message: 'Failed to add rider',
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
