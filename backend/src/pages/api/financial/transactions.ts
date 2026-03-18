import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withRole } from '@/lib/auth-middleware';
import { validateInput } from '@/lib/validation';
import { ApiResponse } from '@/types';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { method } = req;

  if (method === 'GET') {
    try {
      const { page = '1', limit = '10', type, registrationId } = req.query;
      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));
      const skip = (pageNum - 1) * limitNum;

      const where = {
        ...(registrationId && { registrationId: registrationId as string }),
      };

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          skip,
          take: limitNum,
          include: {
            registration: {
              include: {
                rider: { select: { firstName: true, lastName: true } },
                event: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.transaction.count({ where }),
      ]);

      // Calculate summary stats
      const stats = await prisma.transaction.aggregate({
        where,
        _sum: { totalAmount: true },
        _count: true,
      });

      return res.status(200).json({
        success: true,
        message: 'Transactions retrieved successfully',
        statusCode: 200,
        data: {
          transactions,
          summary: {
            totalTransactions: stats._count,
            totalAmount: stats._sum.totalAmount || 0,
          },
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      console.error('Transactions GET error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve transactions',
        error: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  }

  if (method === 'POST') {
    try {
      const { registrationId, amount, cgstAmount = 0, sgstAmount = 0, igstAmount = 0, paymentMethod, referenceNumber, notes } = req.body;

      const validation = validateInput({
        registrationId: { type: 'string', required: true },
        amount: { type: 'number', required: true, min: 0.01 },
        cgstAmount: { type: 'number', required: false, min: 0 },
        sgstAmount: { type: 'number', required: false, min: 0 },
        igstAmount: { type: 'number', required: false, min: 0 },
        paymentMethod: { type: 'string', required: false, max: 100 },
        referenceNumber: { type: 'string', required: false, max: 100 },
        notes: { type: 'string', required: false, max: 500 },
      }, req.body);

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: 'VALIDATION_ERROR',
          statusCode: 400,
          data: validation.errors,
        });
      }

      // Calculate total GST from breakdown components
      const totalGSTAmount = (cgstAmount || 0) + (sgstAmount || 0) + (igstAmount || 0);
      const totalAmount = amount + totalGSTAmount;

      const transaction = await prisma.transaction.create({
        data: {
          registrationId,
          amount,
          gstAmount: totalGSTAmount, // Legacy field for backward compatibility
          cgstAmount: cgstAmount || 0,
          sgstAmount: sgstAmount || 0,
          igstAmount: igstAmount || 0,
          totalAmount,
          paymentMethod,
          referenceNumber,
          notes,
          status: 'UNPAID',
        },
        include: {
          registration: {
            include: {
              rider: true,
              event: true,
            },
          },
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        statusCode: 201,
        data: transaction,
      });
    } catch (error) {
      console.error('Transactions POST error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create transaction',
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

export default withRole('admin')(handler);
