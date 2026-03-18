import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withPermission } from '@/lib/auth-middleware';
import { ApiResponse } from '@/types';
import { PaymentStatus } from '@prisma/client';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { method } = req;

  if (method === 'GET') {
    try {
      const { page = '1', limit = '10', registrationId, status, format } = req.query;
      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));
      const skip = (pageNum - 1) * limitNum;

      const where: any = {
        ...(registrationId && { registrationId: registrationId as string }),
        ...(status && { status: (status as string).toUpperCase() as PaymentStatus }),
      };

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          skip,
          take: limitNum,
          select: {
            id: true,
            eId: true,
            registrationId: true,
            amount: true,
            gstAmount: true,
            cgstAmount: true,
            sgstAmount: true,
            igstAmount: true,
            totalAmount: true,
            transactionDate: true,
            status: true,
            paymentMethod: true,
            referenceNumber: true,
            notes: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.transaction.count({ where }),
      ]);

      // CSV export - return all matching transactions
      if (format === 'csv') {
        const allTransactions = await prisma.transaction.findMany({
          where,
          select: {
            id: true,
            referenceNumber: true,
            amount: true,
            cgstAmount: true,
            sgstAmount: true,
            igstAmount: true,
            totalAmount: true,
            status: true,
            paymentMethod: true,
            notes: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        const csvHeader = 'Reference,Amount,CGST,SGST,IGST,Total,Method,Status,Date\n';
        const csvRows = allTransactions.map(t =>
          [
            t.referenceNumber || t.id.slice(0, 8),
            t.amount,
            t.cgstAmount,
            t.sgstAmount,
            t.igstAmount,
            t.totalAmount,
            t.paymentMethod || '',
            t.status,
            new Date(t.createdAt).toLocaleDateString(),
          ].join(',')
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
        res.write(csvHeader + csvRows);
        return res.end();
      }

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

      // Manual field validation
      if (!registrationId || typeof registrationId !== 'string' || !registrationId.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: 'VALIDATION_ERROR',
          statusCode: 400,
          data: { registrationId: 'Registration ID is required' },
        });
      }

      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: 'VALIDATION_ERROR',
          statusCode: 400,
          data: { amount: 'Amount must be greater than 0' },
        });
      }

      // Verify registration exists
      const registration = await prisma.registration.findUnique({
        where: { id: registrationId },
      });

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: 'Registration not found',
          error: 'NOT_FOUND',
          statusCode: 404,
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

export default withPermission('View', 'Financial')(handler);
