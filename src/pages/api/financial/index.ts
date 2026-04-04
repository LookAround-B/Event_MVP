import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withApiHandler, sendSuccessResponse, sendErrorResponse } from '@/lib/api-handler';
import { withRoleMiddleware } from '@/lib/auth-middleware';
import { validateInput, handleValidationError } from '@/lib/validation';
import { ErrorCode, logError } from '@/lib/errors';

const createTransactionSchema = {
  registrationId: {
    required: true,
    type: 'string',
    message: 'Registration ID is required',
  },
  amount: {
    required: true,
    type: 'string',
    custom: (value: string) => !isNaN(parseFloat(value)) && parseFloat(value) > 0,
    message: 'Amount must be a positive number',
  },
  paymentMethod: {
    required: true,
    type: 'string',
    custom: (value: string) => ['CASH', 'CARD', 'BANK_TRANSFER', 'CHEQUE'].includes(value),
    message: 'Invalid payment method',
  },
};

async function handleGetTransactions(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt((req.query.pageSize as string) || '10')));
    const skip = (page - 1) * pageSize;

    const { registrationId, paymentMethod, startDate, endDate } = req.query;

    const where: any = {};

    if (registrationId) {
      where.registrationId = registrationId as string;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod as string;
    }

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) {
        where.transactionDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.transactionDate.lte = new Date(endDate as string);
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: pageSize,
        select: {
          id: true,
          registrationId: true,
          amount: true,
          paymentMethod: true,
          referenceNumber: true,
          transactionDate: true,
          createdAt: true,
          registration: {
            select: {
              id: true,
              event: {
                select: { id: true, name: true },
              },
              rider: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
        },
        orderBy: { transactionDate: 'desc' },
      }),
      prisma.transaction.count({ where }),
    ]);

    const totalAmount = await prisma.transaction.aggregate({
      where,
      _sum: {
        amount: true,
      },
    });

    return sendSuccessResponse(res, 200, 'Transactions retrieved successfully', {
      data: transactions,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      totalAmount: totalAmount._sum.amount || 0,
    });
  } catch (error) {
    logError(error, 'handleGetTransactions');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function handleCreateTransaction(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const {
      registrationId,
      amount,
      paymentMethod,
      referenceNumber,
      notes,
    } = req.body || {};

    // Validate input
    const validationErrors = validateInput(
      { registrationId, amount, paymentMethod },
      createTransactionSchema
    );

    if (Object.keys(validationErrors).length > 0) {
      return handleValidationError(res, validationErrors);
    }

    // Verify registration exists
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!registration) {
      return sendErrorResponse(res, 400, 'Registration not found', ErrorCode.BAD_REQUEST);
    }

    const parsedAmount = parseFloat(amount);

    // Check payment doesn't exceed total amount
    const paidAmount = await prisma.transaction.aggregate({
      where: { registrationId },
      _sum: { amount: true },
    });

    const totalPaid = (paidAmount._sum.amount || 0) + parsedAmount;

    if (totalPaid > registration.totalAmount) {
      return sendErrorResponse(
        res,
        400,
        `Payment exceeds registration amount. Total payable: ${registration.totalAmount}, already paid: ${paidAmount._sum.amount || 0}`,
        ErrorCode.BAD_REQUEST
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        registrationId,
        amount: parsedAmount,
        paymentMethod,
        referenceNumber,
        notes,
        transactionDate: new Date(),
      },
      include: {
        registration: {
          include: {
            event: {
              select: { id: true, name: true },
            },
            rider: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    // Update registration payment status if fully paid
    if (totalPaid === registration.totalAmount) {
      await prisma.registration.update({
        where: { id: registrationId },
        data: { paymentStatus: 'COMPLETED' },
      });
    } else if (totalPaid > 0) {
      await prisma.registration.update({
        where: { id: registrationId },
        data: { paymentStatus: 'PARTIAL' },
      });
    }

    return sendSuccessResponse(res, 201, 'Transaction recorded successfully', transaction);
  } catch (error) {
    logError(error, 'handleCreateTransaction');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    return handleGetTransactions(req, res);
  }

  if (req.method === 'POST') {
    return handleCreateTransaction(req, res);
  }

  return sendErrorResponse(res, 405, 'Method not allowed', ErrorCode.INTERNAL_SERVER_ERROR);
}

export default withApiHandler(
  withRoleMiddleware(['ADMIN', 'CLUB_MANAGER'])(handler),
  {
    allowedMethods: ['GET', 'POST', 'OPTIONS'],
  }
);
