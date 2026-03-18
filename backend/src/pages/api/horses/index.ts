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
              { name: { contains: search as string, mode: 'insensitive' as 'insensitive' } },
              { color: { contains: search as string, mode: 'insensitive' as 'insensitive' } },
              { gender: { contains: search as string, mode: 'insensitive' as 'insensitive' } },
            ],
          }
        : {};

      if (format === 'csv') {
        const allHorses = await prisma.horse.findMany({
          where,
          select: { name: true, breed: true, color: true, height: true, gender: true, yearOfBirth: true, _count: { select: { registrations: true } } },
          orderBy: { name: 'asc' },
        });
        const header = 'Name,Breed,Color,Height,Gender,Year of Birth,Registrations';
        const rows = allHorses.map(h =>
          `"${h.name}","${h.breed || ''}","${h.color || ''}","${h.height || ''}","${h.gender || ''}","${h.yearOfBirth || ''}","${h._count.registrations}"`
        );
        const csv = [header, ...rows].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=horses.csv');
        res.write(csv as any);
        return res.end();
      }

      const [horses, total] = await Promise.all([
        prisma.horse.findMany({
          where,
          skip,
          take: limitNum,
          select: {
            id: true,
            name: true,
            breed: true,
            color: true,
            height: true,
            gender: true,
            yearOfBirth: true,
            passportNumber: true,
            createdAt: true,
            _count: {
              select: { registrations: true },
            },
          },
          orderBy: { name: 'asc' },
        }),
        prisma.horse.count({ where }),
      ]);

      return res.status(200).json({
        success: true,
        message: 'Horses retrieved successfully',
        statusCode: 200,
        data: {
          horses: horses.map(h => ({
            ...h,
            registrationCount: h._count.registrations,
            _count: undefined,
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
      console.error('Horses GET error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve horses',
        error: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  }

  if (method === 'POST') {
    try {
      const { name, breed, color, height, gender, yearOfBirth, passportNumber, horseCode } = req.body;

      console.log('Horses POST request body:', req.body);

      // Manual field validation
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: 'VALIDATION_ERROR',
          statusCode: 400,
          data: { name: 'Horse name is required' },
        });
      }

      if (!gender || typeof gender !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: 'VALIDATION_ERROR',
          statusCode: 400,
          data: { gender: 'Gender is required' },
        });
      }

      const horse = await prisma.horse.create({
        data: {
          name: name.trim(),
          breed: breed || null,
          color: color || null,
          height: height ? parseFloat(height) : null,
          gender,
          yearOfBirth: yearOfBirth ? parseInt(yearOfBirth) : null,
          passportNumber: passportNumber || null,
          horseCode: horseCode || null,
        },
      });

      console.log('Horse created successfully:', horse.id);

      return res.status(201).json({
        success: true,
        message: 'Horse created successfully',
        statusCode: 201,
        data: horse,
      });
    } catch (error) {
      console.error('Horses POST error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create horse',
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
