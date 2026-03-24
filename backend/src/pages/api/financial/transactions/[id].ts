import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withPermission } from '@/lib/auth-middleware';
import { ApiResponse } from '@/types';
import { PaymentStatus } from '@prisma/client';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Transaction ID is required',
      error: 'VALIDATION_ERROR',
      statusCode: 400,
    });
  }

  if (req.method === 'GET') {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: {
          registration: {
            include: {
              rider: { select: { firstName: true, lastName: true } },
              event: { select: { name: true } },
            },
          },
        },
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found',
          error: 'NOT_FOUND',
          statusCode: 404,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Transaction retrieved successfully',
        statusCode: 200,
        data: transaction,
      });
    } catch (error) {
      console.error('Transaction GET error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve transaction',
        error: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const existing = await prisma.transaction.findUnique({ where: { id } });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found',
          error: 'NOT_FOUND',
          statusCode: 404,
        });
      }

      const {
        amount, cgstAmount, sgstAmount, igstAmount,
        paymentMethod, referenceNumber, status, notes,
      } = req.body;

      const updatedAmount = amount !== undefined ? parseFloat(amount) : existing.amount;
      const updatedCgst = cgstAmount !== undefined ? parseFloat(cgstAmount) : (existing as any).cgstAmount || 0;
      const updatedSgst = sgstAmount !== undefined ? parseFloat(sgstAmount) : (existing as any).sgstAmount || 0;
      const updatedIgst = igstAmount !== undefined ? parseFloat(igstAmount) : (existing as any).igstAmount || 0;
      const totalGst = updatedCgst + updatedSgst + updatedIgst;
      const totalAmount = updatedAmount + totalGst;

      const updateData: any = {};
      if (amount !== undefined) updateData.amount = updatedAmount;
      if (cgstAmount !== undefined) updateData.cgstAmount = updatedCgst;
      if (sgstAmount !== undefined) updateData.sgstAmount = updatedSgst;
      if (igstAmount !== undefined) updateData.igstAmount = updatedIgst;
      if (amount !== undefined || cgstAmount !== undefined || sgstAmount !== undefined || igstAmount !== undefined) {
        updateData.gstAmount = totalGst;
        updateData.totalAmount = totalAmount;
      }
      if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
      if (referenceNumber !== undefined) updateData.referenceNumber = referenceNumber;
      if (status !== undefined) updateData.status = status as PaymentStatus;
      if (notes !== undefined) updateData.notes = notes;

      const transaction = await prisma.transaction.update({
        where: { id },
        data: updateData,
      });

      // Sync registration payment status when transaction status changes
      if (status) {
        const allTransactions = await prisma.transaction.findMany({
          where: { registrationId: transaction.registrationId },
          select: { status: true },
        });

        const allPaid = allTransactions.every(t => t.status === 'PAID');
        const anyPaid = allTransactions.some(t => t.status === 'PAID');

        const regStatus: PaymentStatus = allPaid ? 'PAID' : anyPaid ? 'PARTIAL' : 'UNPAID';
        await prisma.registration.update({
          where: { id: transaction.registrationId },
          data: { paymentStatus: regStatus },
        }).catch(console.error);
      }

      return res.status(200).json({
        success: true,
        message: 'Transaction updated successfully',
        statusCode: 200,
        data: transaction,
      });
    } catch (error) {
      console.error('Transaction PATCH error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update transaction',
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

export default withPermission('Edit', 'Financial')(handler);
