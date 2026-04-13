import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import { ApiResponse } from '@/types';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, statusCode: 405, message: 'Method not allowed' });
  }

  return withAuth(async (authReq: AuthenticatedRequest, authRes) => {
    const userId = authReq.user?.id;
    const role = authReq.user?.role;

    if (!userId) {
      return authRes.status(401).json({ success: false, statusCode: 401, message: 'Unauthorized' });
    }

    try {
      let clubId: string | null = null;

      if (role === 'club') {
        // Club user: find the club where they are the primary contact
        const club = await prisma.club.findFirst({
          where: { primaryContactId: userId },
          select: { id: true },
        });
        clubId = club?.id ?? null;
      } else if (role === 'rider') {
        // Rider user: find their rider profile and get the clubId
        const rider = await prisma.rider.findFirst({
          where: { userId },
          select: { clubId: true },
        });
        clubId = rider?.clubId ?? null;
      }

      if (!clubId) {
        return authRes.status(404).json({
          success: false,
          statusCode: 404,
          message: 'No club associated with this account',
        });
      }

      return authRes.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Club found',
        data: { clubId },
      });
    } catch (error) {
      console.error('GET /api/clubs/my error:', error);
      return authRes.status(500).json({ success: false, statusCode: 500, message: 'Internal server error' });
    }
  })(req, res);
}

export default handler;
