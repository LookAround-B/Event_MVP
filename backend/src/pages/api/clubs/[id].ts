import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import { ApiResponse } from '@/types';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // CORS headers
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

  if (req.method === 'GET') {
    return withAuth(async (authReq: AuthenticatedRequest, authRes) => {
      try {
        // Resolve "my" → the current user's club based on their role
        let resolvedClubId = clubId;
        if (clubId === 'my') {
          const userId = authReq.user?.id;
          const role = authReq.user?.role;
          if (role === 'club') {
            const club = await prisma.club.findFirst({
              where: { primaryContactId: userId },
              select: { id: true },
            });
            resolvedClubId = club?.id ?? undefined;
          } else if (role === 'rider') {
            const rider = await prisma.rider.findFirst({
              where: { userId },
              select: { clubId: true },
            });
            resolvedClubId = rider?.clubId ?? undefined;
          }
          if (!resolvedClubId) {
            return authRes.status(404).json({
              statusCode: 404,
              message: 'No club associated with this account',
            });
          }
        }

        if (!resolvedClubId) {
          return authRes.status(400).json({
            statusCode: 400,
            message: 'Club ID is required',
          });
        }

        const club = await prisma.club.findUnique({
          where: { id: resolvedClubId },
          select: {
            id: true,
            eId: true,
            name: true,
            shortCode: true,
            registrationNumber: true,
            contactNumber: true,
            optionalPhone: true,
            email: true,
            address: true,
            city: true,
            state: true,
            country: true,
            pincode: true,
            gstNumber: true,
            description: true,
            logoUrl: true,
            socialLinks: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            primaryContact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                gender: true,
                phone: true,
                dob: true,
              },
            },
            _count: {
              select: { riders: true, horses: true, registrations: true },
            },
          },
        });

        if (!club) {
          return authRes.status(404).json({
            statusCode: 404,
            message: 'Club not found',
          });
        }

        return authRes.status(200).json({
          statusCode: 200,
          message: 'Club retrieved successfully',
          data: {
            ...club,
            createdAt: club.createdAt.toISOString(),
            updatedAt: club.updatedAt.toISOString(),
          },
        });
      } catch (error) {
        console.error('Club GET error:', error);
        return authRes.status(500).json({
          statusCode: 500,
          message: 'Failed to retrieve club',
        });
      }
    })(req, res);
  }

  if (req.method === 'PUT') {
    return withAuth(async (authReq, authRes) => {
      try {
        if (!clubId) {
          return authRes.status(400).json({
            statusCode: 400,
            message: 'Club ID is required',
          });
        }

        const isAdmin = authReq.user?.role === 'admin';
        if (!isAdmin) {
          const club = await prisma.club.findUnique({ where: { id: clubId }, select: { primaryContactId: true } });
          if (!club || club.primaryContactId !== authReq.user?.id) {
            return authRes.status(403).json({ statusCode: 403, message: 'Forbidden' });
          }
        }

        const {
          name,
          shortCode,
          registrationNumber,
          contactNumber,
          email,
          address,
          city,
          state,
          country,
          pincode,
          gstNumber,
          description,
          socialLinks,
          optionalPhone,
          eId,
          logoUrl,
        } = authReq.body;

        const club = await prisma.club.update({
          where: { id: clubId },
          data: {
            ...(name && { name }),
            ...(shortCode && { shortCode }),
            ...(registrationNumber !== undefined && { registrationNumber }),
            ...(contactNumber !== undefined && { contactNumber }),
            ...(email !== undefined && { email }),
            ...(address !== undefined && { address }),
            ...(city !== undefined && { city }),
            ...(state !== undefined && { state }),
            ...(country !== undefined && { country }),
            ...(pincode !== undefined && { pincode }),
            ...(gstNumber !== undefined && { gstNumber }),
            ...(description !== undefined && { description }),
            ...(socialLinks !== undefined && { socialLinks }),
            ...(optionalPhone !== undefined && { optionalPhone }),
            ...(eId !== undefined && { eId }),
            ...(logoUrl !== undefined && { logoUrl }),
          },
          select: {
            id: true,
            eId: true,
            name: true,
            shortCode: true,
            email: true,
            createdAt: true,
          },
        });

        return authRes.status(200).json({
          statusCode: 200,
          message: 'Club updated successfully',
          data: {
            ...club,
            createdAt: club.createdAt.toISOString(),
          },
        });
      } catch (error) {
        console.error('Club PUT error:', error);
        return authRes.status(500).json({
          statusCode: 500,
          message: 'Failed to update club',
        });
      }
    })(req, res);
  }

  if (req.method === 'DELETE') {
    return withAuth(async (authReq, authRes) => {
      try {
        if (!clubId) {
          return authRes.status(400).json({
            statusCode: 400,
            message: 'Club ID is required',
          });
        }

        if (authReq.user?.role !== 'admin') {
          return authRes.status(403).json({ statusCode: 403, message: 'Forbidden' });
        }

        await prisma.club.delete({
          where: { id: clubId },
        });

        return authRes.status(200).json({
          statusCode: 200,
          message: 'Club deleted successfully',
        });
      } catch (error) {
        console.error('Club DELETE error:', error);
        return authRes.status(500).json({
          success: false,
          statusCode: 500,
          message: 'Failed to delete club',
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
