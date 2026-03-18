import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withAuth } from '@/lib/auth-middleware';
import { ApiResponse } from '@/types';

interface ClubsListResponse extends ApiResponse {
  clubs: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ClubsListResponse | ApiResponse>
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

  if (req.method === 'GET') {
    return withAuth(async (authReq, authRes) => {
      try {
        const { page = '1', limit = '10', search = '', format } = authReq.query;
        const pageNum = Math.max(1, parseInt(page as string) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));
        const skip = (pageNum - 1) * limitNum;

        const where = search
          ? {
              OR: [
                { name: { contains: search as string, mode: 'insensitive' as const } },
                { email: { contains: search as string, mode: 'insensitive' as const } },
                { shortCode: { contains: search as string, mode: 'insensitive' as const } },
              ],
            }
          : {};

        if (format === 'csv') {
          const allClubs = await prisma.club.findMany({
            where,
            select: { name: true, shortCode: true, email: true, contactNumber: true, city: true, isActive: true, primaryContact: { select: { firstName: true, lastName: true } } },
            orderBy: { createdAt: 'desc' },
          });
          const header = 'Name,Short Code,Email,Contact Number,City,Contact Person,Active';
          const rows = allClubs.map(c =>
            `"${c.name}","${c.shortCode || ''}","${c.email || ''}","${c.contactNumber || ''}","${c.city || ''}","${c.primaryContact ? `${c.primaryContact.firstName} ${c.primaryContact.lastName}` : ''}","${c.isActive ? 'Yes' : 'No'}"`
          );
          const csv = [header, ...rows].join('\n');
          authRes.setHeader('Content-Type', 'text/csv');
          authRes.setHeader('Content-Disposition', 'attachment; filename=clubs.csv');
        authRes.write(csv as any);
        return authRes.end();
        }

        const [clubs, total] = await Promise.all([
          prisma.club.findMany({
            where,
            skip,
            take: limitNum,
            select: {
              id: true,
              eId: true,
              name: true,
              shortCode: true,
              email: true,
              contactNumber: true,
              address: true,
              city: true,
              primaryContact: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              createdAt: true,
              isActive: true,
            },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.club.count({ where }),
        ]);

        return authRes.status(200).json({
          statusCode: 200,
          message: 'Clubs retrieved successfully',
          clubs: clubs.map(c => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
          })),
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(total / limitNum),
          },
        });
      } catch (error) {
        console.error('Clubs GET error:', error);
        return authRes.status(500).json({
          statusCode: 500,
          message: 'Failed to retrieve clubs',
        });
      }
    })(req, res);
  }

  if (req.method === 'POST') {
    return withAuth(async (authReq, authRes) => {
      try {
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
          primaryContactId,
          primaryContactFirstName,
          primaryContactLastName,
          primaryContactGender,
          primaryContactDob,
          primaryContactMobile,
          primaryContactEmail,
        } = authReq.body;

        if (!name || !shortCode) {
          return authRes.status(400).json({
            statusCode: 400,
            message: 'Club name and short code are required',
          });
        }

        // Create primary contact if details provided
        let contactId = primaryContactId;
        if (primaryContactFirstName && primaryContactLastName && primaryContactEmail) {
          const contact = await prisma.user.create({
            data: {
              firstName: primaryContactFirstName,
              lastName: primaryContactLastName,
              email: primaryContactEmail,
              password: 'default', // To be set later
              designation: 'Club Contact',
              gender: primaryContactGender,
              phone: primaryContactMobile,
            },
          });
          contactId = contact.id;
        }

        if (!contactId) {
          return authRes.status(400).json({
            statusCode: 400,
            message: 'Primary contact information is required',
          });
        }

        const club = await prisma.club.create({
          data: {
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
            primaryContactId: contactId,
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

        return authRes.status(201).json({
          statusCode: 201,
          message: 'Club created successfully',
          data: {
            ...club,
            createdAt: club.createdAt.toISOString(),
          },
        });
      } catch (error) {
        console.error('Club POST error:', error);
        return authRes.status(500).json({
          statusCode: 500,
          message: 'Failed to create club',
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
