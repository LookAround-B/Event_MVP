import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withAuth } from '@/lib/auth-middleware';
import { validateInput } from '@/lib/validation';
import { ApiResponse } from '@/types';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { method } = req;

  // GET is public for form dropdowns, POST requires auth
  if (method === 'GET') {
    try {
      const { page = '1', limit = '10', search = '', format } = req.query;
      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));
      const skip = (pageNum - 1) * limitNum;

      const where = search
        ? {
            OR: [
              { firstName: { contains: search as string, mode: 'insensitive' as 'insensitive' } },
              { lastName: { contains: search as string, mode: 'insensitive' as 'insensitive' } },
              { email: { contains: search as string, mode: 'insensitive' as 'insensitive' } },
            ],
          }
        : {};

      if (format === 'csv') {
        const allRiders = await prisma.rider.findMany({
          where,
          select: { firstName: true, lastName: true, email: true, mobile: true, gender: true, _count: { select: { registrations: true } } },
          orderBy: { lastName: 'asc' },
        });
        const header = 'First Name,Last Name,Email,Mobile,Gender,Registrations';
        const rows = allRiders.map(r =>
          `"${r.firstName}","${r.lastName}","${r.email}","${r.mobile || ''}","${r.gender || ''}","${r._count.registrations}"`
        );
        const csv = [header, ...rows].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=riders.csv');
        res.write(csv as any);
        return res.end();
      }

      const [riders, total] = await Promise.all([
        prisma.rider.findMany({
          where,
          skip,
          take: limitNum,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            mobile: true,
            gender: true,
            createdAt: true,
            _count: {
              select: { registrations: true },
            },
          },
          orderBy: { lastName: 'asc' },
        }),
        prisma.rider.count({ where }),
      ]);

      return res.status(200).json({
        success: true,
        message: 'Riders retrieved successfully',
        statusCode: 200,
        data: {
          riders: riders.map(r => ({
            ...r,
            registrationCount: r._count.registrations,
          })),
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      console.error('Riders GET error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve riders',
        error: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  }

  if (method === 'POST') {
    try {
      const { firstName, lastName, email, mobile, dob, gender, address, aadhaarNumber, efiRiderId, clubId, designation } = req.body;

      console.log('Riders POST request body:', req.body);

      // Manual field validation instead of strict validateInput
      if (!firstName || typeof firstName !== 'string' || !firstName.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: 'VALIDATION_ERROR',
          statusCode: 400,
          data: { firstName: 'First name is required' },
        });
      }

      if (!lastName || typeof lastName !== 'string' || !lastName.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: 'VALIDATION_ERROR',
          statusCode: 400,
          data: { lastName: 'Last name is required' },
        });
      }

      if (!email || typeof email !== 'string' || !email.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: 'VALIDATION_ERROR',
          statusCode: 400,
          data: { email: 'Email is required' },
        });
      }

      const existing = await prisma.rider.findUnique({
        where: { email },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Rider with this email already exists',
          error: 'DUPLICATE_EMAIL',
          statusCode: 409,
        });
      }

      const rider = await prisma.rider.create({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          mobile: mobile || null,
          dob: dob ? new Date(dob) : null,
          gender: gender || null,
          address: address || null,
          aadhaarNumber: aadhaarNumber || null,
          efiRiderId: efiRiderId || null,
          clubId: clubId || null,
        },
      });

      console.log('Rider created successfully:', rider.id);

      return res.status(201).json({
        success: true,
        message: 'Rider created successfully',
        statusCode: 201,
        data: rider,
      });
    } catch (error) {
      console.error('Riders POST error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create rider',
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

// Apply auth only to POST/DELETE, not GET (GET is public for form dropdowns)
export default async function wrappedHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handler(req, res);
  }
  return withAuth(handler)(req, res);
}
