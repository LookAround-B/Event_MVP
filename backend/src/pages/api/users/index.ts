import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withAuth } from '@/lib/auth-middleware';
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
  req: NextApiRequest,
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
    return withAuth(async (authReq, authRes) => {
      try {
        const { page = '1', limit = '10', search = '' } = authReq.query;
        const pageNum = Math.max(1, parseInt(page as string) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));
        const skip = (pageNum - 1) * limitNum;

        const where = search
          ? {
              OR: [
                { email: { contains: search as string, mode: 'insensitive' as 'insensitive' } },
                { firstName: { contains: search as string, mode: 'insensitive' as 'insensitive' } },
                { lastName: { contains: search as string, mode: 'insensitive' as 'insensitive' } },
              ],
            }
          : {};

        const [users, total] = await Promise.all([
          prisma.user.findMany({
            where,
            skip,
            take: limitNum,
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              isApproved: true,
              profileComplete: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.user.count({ where }),
        ]);

        return authRes.status(200).json({
          success: true,
          statusCode: 200,
          message: 'Users retrieved successfully',
          data: users.map(u => ({
            ...u,
            name: `${u.firstName} ${u.lastName}`,
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
        return authRes.status(500).json({
          success: false,
          statusCode: 500,
          message: 'Failed to retrieve users',
        });
      }
    })(req, res);
  }

  if (method === 'POST') {
    return withAuth(async (authReq, authRes) => {
      try {
        const { email, password, firstName, lastName, designation } = authReq.body;

        if (!email || !password || !firstName || !lastName) {
          return authRes.status(400).json({
            success: false,
            statusCode: 400,
            message: 'Email, password, firstName, and lastName are required',
          });
        }

        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          return authRes.status(409).json({
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

        return authRes.status(201).json({
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
        return authRes.status(500).json({
          success: false,
          statusCode: 500,
          message: 'Failed to create user',
        });
      }
    })(req, res);
  }

  return res.status(405).json({
    success: false,
    statusCode: 405,
    message: `Method ${method} not allowed`,
  });
}

export default handler;
