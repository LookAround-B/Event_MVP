import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withAuth } from '@/lib/auth-middleware';
import { ApiResponse } from '@/types';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { method } = req;

  if (method === 'GET') {
    try {
      const { page = '1', limit = '10', search = '', format, gender, clubId, status } = req.query;
      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};
      const conditions: any[] = [
        {
          OR: [
            { userId: null },
            { user: { isApproved: true } },
            { user: { roles: { none: { name: 'rider' } } } },
          ],
        },
      ];

      if (search) {
        conditions.push({
          OR: [
            { firstName: { contains: search as string, mode: 'insensitive' as 'insensitive' } },
            { lastName: { contains: search as string, mode: 'insensitive' as 'insensitive' } },
            { email: { contains: search as string, mode: 'insensitive' as 'insensitive' } },
            { efiRiderId: { contains: search as string, mode: 'insensitive' as 'insensitive' } },
          ],
        });
      }

      if (gender && typeof gender === 'string') {
        conditions.push({ gender });
      }

      if (clubId && typeof clubId === 'string') {
        conditions.push({ clubId });
      }

      if (status && typeof status === 'string') {
        conditions.push({ isActive: status === 'active' });
      }

      if (conditions.length > 0) {
        where.AND = conditions;
      }

      if (format === 'csv') {
        const allRiders = await prisma.rider.findMany({
          where,
          select: {
            firstName: true, lastName: true, email: true, mobile: true, gender: true,
            efiRiderId: true, eId: true,
            club: { select: { name: true } },
            _count: { select: { registrations: true } },
          },
          orderBy: { lastName: 'asc' },
        });
        const header = 'First Name,Last Name,Email,Mobile,Gender,EFI Rider ID,Embassy ID,Club,Registrations';
        const rows = allRiders.map(r =>
          `"${r.firstName}","${r.lastName}","${r.email}","${r.mobile || ''}","${r.gender || ''}","${r.efiRiderId || ''}","${r.eId}","${r.club?.name || ''}","${r._count.registrations}"`
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
            eId: true,
            efiRiderId: true,
            firstName: true,
            lastName: true,
            email: true,
            mobile: true,
            optionalPhone: true,
            gender: true,
            dob: true,
            address: true,
            imageUrl: true,
            socialLinks: true,
            isActive: true,
            clubId: true,
            createdAt: true,
            club: {
              select: { id: true, name: true },
            },
            _count: {
              select: { registrations: true },
            },
          },
          orderBy: { createdAt: 'desc' },
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
            clubName: r.club?.name || null,
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
      const { firstName, lastName, email, mobile, dob, gender, address, aadhaarNumber, efiRiderId, clubId, socialLinks, optionalPhone, imageUrl } = req.body;

      if (!firstName || typeof firstName !== 'string' || !firstName.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: 'VALIDATION_ERROR',
          statusCode: 400,
          data: { firstName: 'First name is required' },
        });
      }

      if (!efiRiderId || typeof efiRiderId !== 'string' || !efiRiderId.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: 'VALIDATION_ERROR',
          statusCode: 400,
          data: { efiRiderId: 'EFI Rider ID is required' },
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

      // Auto-generate Embassy ID with EIRSD prefix
      let embassyId = 'EIRSD00001';
      const lastRider = await prisma.rider.findFirst({
        where: { eId: { startsWith: 'EIRSD' } },
        orderBy: { eId: 'desc' },
        select: { eId: true },
      });
      if (lastRider && lastRider.eId.startsWith('EIRSD')) {
        const num = parseInt(lastRider.eId.replace('EIRSD', ''), 10);
        if (!isNaN(num)) {
          embassyId = 'EIRSD' + String(num + 1).padStart(5, '0');
        }
      }

      const rider = await prisma.rider.create({
        data: {
          eId: embassyId,
          firstName: firstName.trim(),
          lastName: (lastName || '').trim(),
          email: email.trim(),
          efiRiderId: efiRiderId.trim(),
          mobile: mobile || null,
          optionalPhone: optionalPhone || null,
          dob: dob ? new Date(dob) : null,
          gender: gender || null,
          address: address || null,
          aadhaarNumber: aadhaarNumber || null,
          imageUrl: imageUrl || null,
          socialLinks: socialLinks || null,
          clubId: clubId || null,
        },
      });

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

export default withAuth(handler);
