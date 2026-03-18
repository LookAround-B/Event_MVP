import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withRole, AuthenticatedRequest } from '@/lib/auth-middleware';
import bcrypt from 'bcrypt';
import { ApiResponse } from '@/types';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  isApproved: boolean;
  profileComplete: boolean;
  createdAt: string;
}

interface UsersListResponse extends ApiResponse {
  data: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<UsersListResponse | ApiResponse>
) {
  // CORS headers - handle preflight
  const origin = req.headers.origin || 'http://localhost:3000';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method } = req;

  if (method === 'GET') {
    try {
      const { page = '1', limit = '10', search = '', role, format } = req.query;
      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};
      if (search) {
        where.OR = [
          { email: { contains: search as string, mode: 'insensitive' as 'insensitive' } },
          { firstName: { contains: search as string, mode: 'insensitive' as 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' as 'insensitive' } },
        ];
      }
      if (role) {
        where.roles = { some: { name: role as string } };
      }

      const userSelect = {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isApproved: true,
        profileComplete: true,
        createdAt: true,
        roles: { select: { name: true } },
      };

      // CSV export
      if (format === 'csv') {
        const allUsers = await prisma.user.findMany({
          where,
          select: userSelect,
          orderBy: { createdAt: 'desc' },
        });

        const csvHeader = 'Email,Name,Phone,Role,Status,Created\n';
        const csvRows = allUsers.map(u =>
          [
            u.email,
            `${u.firstName} ${u.lastName}`,
            u.phone || '',
            u.roles.map(r => r.name).join(';') || 'user',
            u.isApproved ? 'Approved' : 'Pending',
            new Date(u.createdAt).toLocaleDateString(),
          ].join(',')
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
        res.write(csvHeader + csvRows);
        return res.end();
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limitNum,
          select: userSelect,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Users retrieved successfully',
        data: users.map(u => ({
          ...u,
          name: `${u.firstName} ${u.lastName}`,
          role: u.roles.map(r => r.name).join(', ') || 'user',
          createdAt: u.createdAt.toISOString(),
        })),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('Users GET error:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Failed to retrieve users',
      });
    }
  }

  if (method === 'POST') {
    try {
      const { email, password, firstName, lastName, designation } = req.body;

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Email, password, firstName, and lastName are required',
        });
      }

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          statusCode: 409,
          message: 'User with this email already exists',
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          designation: designation || '',
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        },
      });

      return res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'User created successfully',
        data: {
          ...newUser,
          name: `${newUser.firstName} ${newUser.lastName}`,
          createdAt: newUser.createdAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('Users POST error:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Failed to create user',
      });
    }
  }

  return res.status(405).json({
    success: false,
    statusCode: 405,
    message: `Method ${method} not allowed`,
  });
}

export default withRole('admin')(handler);
