import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withAuth } from '@/lib/auth-middleware';
import { sendRegistrationConfirmation } from '@/lib/email';
import { ApiResponse } from '@/types';

function isMissingStartNumberColumn(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2022' &&
    'meta' in error &&
    typeof (error as { meta?: { column?: string } }).meta?.column === 'string' &&
    (error as { meta?: { column?: string } }).meta?.column?.includes('Registration.startNumber')
  );
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { method } = req;

  if (method === 'GET') {
    try {
      const { page = '1', limit = '10', eventId, status, format } = req.query;
      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));
      const skip = (pageNum - 1) * limitNum;

      const where = {
        ...(eventId && { eventId: eventId as string }),
        ...(status && { paymentStatus: status as 'PAID' | 'UNPAID' | 'PARTIAL' | 'CANCELLED' }),
      };

      if (format === 'csv') {
        const allRegs = await prisma.registration.findMany({
          where,
          include: {
            rider: { select: { firstName: true, lastName: true, email: true } },
            horse: { select: { name: true, horseCode: true } },
            event: { select: { name: true } },
            category: { select: { name: true } },
            club: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        const header = 'Rider Name,Email,Horse,Event,Event Amount,Stable Amount,GST Amount,Total Amount,Payment Status,Created';
        const rows = allRegs.map(r =>
          `"${r.rider.firstName} ${r.rider.lastName}","${r.rider.email}","${r.horse.name}","${r.event.name}","${r.eventAmount}","${r.stableAmount}","${r.gstAmount}","${r.totalAmount}","${r.paymentStatus}","${r.createdAt.toISOString().split('T')[0]}"`
        );
        const csv = [header, ...rows].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=registrations.csv');
        res.write(csv as any);
        return res.end();
      }

      let registrations;
      let total;

      try {
        [registrations, total] = await Promise.all([
          prisma.registration.findMany({
            where,
            skip,
            take: limitNum,
            select: {
              id: true,
              startNumber: true,
              paymentStatus: true,
              paymentMethod: true,
              eventAmount: true,
              stableAmount: true,
              gstAmount: true,
              totalAmount: true,
              registeredAt: true,
              createdAt: true,
              rider: {
                select: { id: true, firstName: true, lastName: true, email: true },
              },
              horse: {
                select: { id: true, name: true, color: true, gender: true, horseCode: true },
              },
              event: {
                select: { id: true, name: true, startDate: true, endDate: true },
              },
              club: {
                select: { id: true, name: true },
              },
              category: {
                select: { id: true, name: true, price: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.registration.count({ where }),
        ]);
      } catch (error) {
        if (!isMissingStartNumberColumn(error)) {
          throw error;
        }

        [registrations, total] = await Promise.all([
          prisma.registration.findMany({
            where,
            skip,
            take: limitNum,
            select: {
              id: true,
              paymentStatus: true,
              paymentMethod: true,
              eventAmount: true,
              stableAmount: true,
              gstAmount: true,
              totalAmount: true,
              registeredAt: true,
              createdAt: true,
              rider: {
                select: { id: true, firstName: true, lastName: true, email: true },
              },
              horse: {
                select: { id: true, name: true, color: true, gender: true, horseCode: true },
              },
              event: {
                select: { id: true, name: true, startDate: true, endDate: true },
              },
              club: {
                select: { id: true, name: true },
              },
              category: {
                select: { id: true, name: true, price: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.registration.count({ where }),
        ]);

        registrations = registrations.map((registration) => ({
          ...registration,
          startNumber: null,
        }));
      }

      return res.status(200).json({
        success: true,
        message: 'Registrations retrieved successfully',
        statusCode: 200,
        data: {
          registrations,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      console.error('Registrations GET error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve registrations',
        error: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  }

  if (method === 'POST') {
    try {
      const { eventId, riderId, horseId, categoryId } = req.body;

      // Manual field validation
      if (!eventId || typeof eventId !== 'string' || !eventId.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: 'VALIDATION_ERROR',
          statusCode: 400,
          data: { eventId: 'Event ID is required' },
        });
      }

      if (!riderId || typeof riderId !== 'string' || !riderId.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: 'VALIDATION_ERROR',
          statusCode: 400,
          data: { riderId: 'Rider ID is required' },
        });
      }

      if (!horseId || typeof horseId !== 'string' || !horseId.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: 'VALIDATION_ERROR',
          statusCode: 400,
          data: { horseId: 'Horse ID is required' },
        });
      }

      if (!categoryId || typeof categoryId !== 'string' || !categoryId.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: 'VALIDATION_ERROR',
          statusCode: 400,
          data: { categoryId: 'Category ID is required' },
        });
      }

      // Check if registration already exists
      const existing = await prisma.registration.findFirst({
        where: {
          eventId,
          riderId,
          horseId,
        },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Registration already exists',
          error: 'DUPLICATE_REGISTRATION',
          statusCode: 409,
        });
      }

      // Rule: a rider can have at most 3 horses in the same event category
      const riderCategoryEntries = await prisma.registration.findMany({
        where: { eventId, riderId, categoryId },
        select: { id: true, startNumber: true },
      });

      if (riderCategoryEntries.length >= 3) {
        return res.status(400).json({
          success: false,
          message: 'A rider can compete on a maximum of 3 horses in the same event category',
          error: 'MAX_HORSES_PER_CATEGORY_EXCEEDED',
          statusCode: 400,
        });
      }

      // Assign a start number that is at least 7 apart from the same rider's other
      // entries in this category (round-robin gap rule)
      const MIN_GAP = 7;
      const allCategoryEntries = await prisma.registration.findMany({
        where: { eventId, categoryId },
        select: { startNumber: true },
      });
      const takenNumbers = new Set(
        allCategoryEntries.map((e) => e.startNumber).filter((n): n is number => n !== null)
      );
      const riderNumbers = riderCategoryEntries
        .map((e) => e.startNumber)
        .filter((n): n is number => n !== null);

      // Find the smallest available start number that satisfies the gap constraint
      let assignedStartNumber = 1;
      while (true) {
        if (takenNumbers.has(assignedStartNumber)) {
          assignedStartNumber++;
          continue;
        }
        const gapOk = riderNumbers.every(
          (n) => Math.abs(assignedStartNumber - n) >= MIN_GAP
        );
        if (gapOk) break;
        assignedStartNumber++;
        // Safety cap to prevent infinite loop
        if (assignedStartNumber > 10000) break;
      }

      // Fetch category to get price and GST rates
      const category = await prisma.eventCategory.findUnique({
        where: { id: categoryId },
        select: { id: true, name: true, price: true, cgst: true, sgst: true, igst: true },
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found',
          error: 'NOT_FOUND',
          statusCode: 404,
        });
      }

      // Use category-specific GST rates (fall back to defaults if all zero)
      const cgstRate = category.cgst || 0;
      const sgstRate = category.sgst || 0;
      const igstRate = category.igst || 0;
      const hasGstRates = cgstRate > 0 || sgstRate > 0 || igstRate > 0;
      const effectiveIgstRate = hasGstRates ? igstRate : 18;
      const effectiveCgstRate = hasGstRates ? cgstRate : 9;
      const effectiveSgstRate = hasGstRates ? sgstRate : 9;

      // Calculate event amount from category price
      const eventAmount = category.price || 0;

      // Calculate stable amount if stableId provided
      const { stableId, clubId, numberOfStables = 1 } = req.body;
      let stableAmount = 0;

      if (stableId) {
        const stable = await prisma.stable.findUnique({
          where: { id: stableId },
          select: { id: true, pricePerStable: true, isAvailable: true, eventId: true },
        });

        if (!stable || stable.eventId !== eventId) {
          return res.status(404).json({
            success: false,
            message: 'Stable not found for this event',
            error: 'NOT_FOUND',
            statusCode: 404,
          });
        }

        if (!stable.isAvailable) {
          return res.status(400).json({
            success: false,
            message: 'Stable is not available',
            error: 'STABLE_UNAVAILABLE',
            statusCode: 400,
          });
        }

        stableAmount = (stable.pricePerStable || 0) * (Number(numberOfStables) || 1);
      }

      const subtotal = eventAmount + stableAmount;

      // Apply IGST if set, otherwise CGST+SGST
      let gstAmount: number;
      if (effectiveIgstRate > 0) {
        gstAmount = Math.round((subtotal * effectiveIgstRate) / 100);
      } else {
        gstAmount = Math.round((subtotal * (effectiveCgstRate + effectiveSgstRate)) / 100);
      }
      const totalAmount = subtotal + gstAmount;

      const registration = await prisma.registration.create({
        data: {
          eventId,
          riderId,
          horseId,
          categoryId,
          ...(clubId && { clubId }),
          paymentStatus: 'UNPAID',
          eventAmount,
          stableAmount,
          gstAmount,
          totalAmount,
          startNumber: assignedStartNumber,
        },
        include: {
          rider: true,
          horse: true,
          event: true,
          category: true,
        },
      });

      // Create stable booking if stable was selected
      if (stableId) {
        await prisma.stableBooking.create({
          data: {
            registrationId: registration.id,
            stableId,
            ...(clubId && { clubId }),
            numberOfStables: Number(numberOfStables) || 1,
            totalPrice: stableAmount,
            bookingDate: new Date(),
          },
        });
      }

      // Send confirmation email
      sendRegistrationConfirmation(registration.id).catch(console.error);

      return res.status(201).json({
        success: true,
        message: 'Registration created successfully',
        statusCode: 201,
        data: registration,
      });
    } catch (error) {
      console.error('Registrations POST error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create registration',
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
