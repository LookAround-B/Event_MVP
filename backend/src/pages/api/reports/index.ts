import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withAuth } from '@/lib/auth-middleware';
import { ApiResponse } from '@/types';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      error: 'METHOD_NOT_ALLOWED',
      statusCode: 405,
    });
  }

  const { type, eventId, startDate, endDate, format } = req.query;

  try {
    if (type === 'attendance') {
      return await getAttendanceReport(req, res, eventId as string);
    }
    if (type === 'financial') {
      return await getFinancialReconciliation(req, res, startDate as string, endDate as string, format as string);
    }
    if (type === 'rider-stats') {
      return await getRiderStatistics(req, res);
    }
    if (type === 'event-summary') {
      return await getEventSummaryReport(req, res);
    }

    return res.status(400).json({
      success: false,
      message: 'Report type required. Options: attendance, financial, rider-stats, event-summary',
      error: 'VALIDATION_ERROR',
      statusCode: 400,
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: 'INTERNAL_ERROR',
      statusCode: 500,
    });
  }
}

async function getAttendanceReport(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  eventId?: string
) {
  const where: any = {};
  if (eventId) where.eventId = eventId;

  const events = await prisma.event.findMany({
    where: eventId ? { id: eventId } : {},
    include: {
      registrations: {
        include: {
          rider: { select: { firstName: true, lastName: true, email: true } },
          horse: { select: { name: true } },
          club: { select: { name: true } },
          category: { select: { name: true } },
        },
      },
      categories: { select: { name: true } },
    },
    orderBy: { startDate: 'desc' },
  });

  const report = events.map(event => {
    const totalRegs = event.registrations.length;
    const approved = event.registrations.filter(r => r.approvalStatus === 'APPROVED').length;
    const pending = event.registrations.filter(r => r.approvalStatus === 'PENDING').length;
    const rejected = event.registrations.filter(r => r.approvalStatus === 'REJECTED').length;
    const paid = event.registrations.filter(r => r.paymentStatus === 'PAID').length;

    const clubBreakdown: Record<string, number> = {};
    event.registrations.forEach(r => {
      const clubName = r.club?.name || 'No Club';
      clubBreakdown[clubName] = (clubBreakdown[clubName] || 0) + 1;
    });

    const categoryBreakdown: Record<string, number> = {};
    event.registrations.forEach(r => {
      const catName = r.category?.name || 'Unknown';
      categoryBreakdown[catName] = (categoryBreakdown[catName] || 0) + 1;
    });

    return {
      eventId: event.id,
      eventName: event.name,
      eventType: event.eventType,
      startDate: event.startDate,
      endDate: event.endDate,
      totalRegistrations: totalRegs,
      approved,
      pending,
      rejected,
      paid,
      unpaid: totalRegs - paid,
      clubBreakdown,
      categoryBreakdown,
      registrations: event.registrations.map(r => ({
        riderName: `${r.rider.firstName} ${r.rider.lastName}`,
        email: r.rider.email,
        horse: r.horse.name,
        club: r.club?.name || '-',
        category: r.category?.name || '-',
        approvalStatus: r.approvalStatus,
        paymentStatus: r.paymentStatus,
        totalAmount: r.totalAmount,
      })),
    };
  });

  return res.status(200).json({
    success: true,
    message: 'Attendance report generated',
    statusCode: 200,
    data: { report },
  });
}

async function getFinancialReconciliation(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  startDate?: string,
  endDate?: string,
  format?: string
) {
  const where: any = {};
  if (startDate || endDate) {
    where.transactionDate = {};
    if (startDate) where.transactionDate.gte = new Date(startDate);
    if (endDate) where.transactionDate.lte = new Date(endDate);
  }

  const [transactions, registrationTotals, summary] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        registration: {
          include: {
            event: { select: { name: true } },
            rider: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { transactionDate: 'desc' },
    }),
    prisma.registration.aggregate({
      _sum: { totalAmount: true, eventAmount: true, stableAmount: true, gstAmount: true },
      _count: { id: true },
    }),
    prisma.transaction.aggregate({
      where,
      _sum: { totalAmount: true, amount: true, gstAmount: true },
      _count: { id: true },
    }),
  ]);

  const byMethod: Record<string, { count: number; total: number }> = {};
  const byStatus: Record<string, { count: number; total: number }> = {};

  transactions.forEach(t => {
    const method = t.paymentMethod || 'Unknown';
    if (!byMethod[method]) byMethod[method] = { count: 0, total: 0 };
    byMethod[method].count++;
    byMethod[method].total += t.totalAmount;

    const status = t.status;
    if (!byStatus[status]) byStatus[status] = { count: 0, total: 0 };
    byStatus[status].count++;
    byStatus[status].total += t.totalAmount;
  });

  if (format === 'csv') {
    const header = 'Date,Event,Rider,Amount,GST,Total,Method,Reference,Status';
    const rows = transactions.map(t =>
      `"${t.transactionDate.toISOString().split('T')[0]}","${t.registration.event.name}","${t.registration.rider.firstName} ${t.registration.rider.lastName}","${t.amount}","${t.gstAmount}","${t.totalAmount}","${t.paymentMethod || '-'}","${t.referenceNumber || '-'}","${t.status}"`
    );
    const csv = [header, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=financial-reconciliation.csv');
    res.write(csv);
    return res.end();
  }

  return res.status(200).json({
    success: true,
    message: 'Financial reconciliation report generated',
    statusCode: 200,
    data: {
      totalExpectedRevenue: registrationTotals._sum.totalAmount || 0,
      totalCollected: summary._sum.totalAmount || 0,
      totalOutstanding: (registrationTotals._sum.totalAmount || 0) - (summary._sum.totalAmount || 0),
      transactionCount: summary._count.id,
      registrationCount: registrationTotals._count.id,
      byMethod,
      byStatus,
      transactions: transactions.map(t => ({
        id: t.id,
        date: t.transactionDate,
        event: t.registration.event.name,
        rider: `${t.registration.rider.firstName} ${t.registration.rider.lastName}`,
        amount: t.amount,
        gstAmount: t.gstAmount,
        totalAmount: t.totalAmount,
        method: t.paymentMethod,
        reference: t.referenceNumber,
        status: t.status,
      })),
    },
  });
}

async function getRiderStatistics(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const riders = await prisma.rider.findMany({
    where: { isActive: true },
    include: {
      registrations: {
        include: {
          event: { select: { name: true, eventType: true } },
          category: { select: { name: true } },
        },
      },
      horses: { select: { name: true, breed: true } },
      club: { select: { name: true } },
    },
  });

  const riderStats = riders.map(rider => {
    const totalEvents = new Set(rider.registrations.map(r => r.eventId)).size;
    const totalSpent = rider.registrations.reduce((s, r) => s + r.totalAmount, 0);
    const eventTypes: Record<string, number> = {};
    rider.registrations.forEach(r => {
      const type = r.event.eventType;
      eventTypes[type] = (eventTypes[type] || 0) + 1;
    });

    return {
      id: rider.id,
      name: `${rider.firstName} ${rider.lastName}`,
      email: rider.email,
      club: rider.club?.name || '-',
      totalRegistrations: rider.registrations.length,
      totalEvents,
      totalSpent,
      horses: rider.horses.map(h => h.name),
      eventTypes,
      approvedCount: rider.registrations.filter(r => r.approvalStatus === 'APPROVED').length,
      paidCount: rider.registrations.filter(r => r.paymentStatus === 'PAID').length,
    };
  });

  // Sort by total registrations desc
  riderStats.sort((a, b) => b.totalRegistrations - a.totalRegistrations);

  return res.status(200).json({
    success: true,
    message: 'Rider statistics generated',
    statusCode: 200,
    data: {
      totalRiders: riderStats.length,
      riders: riderStats,
    },
  });
}

async function getEventSummaryReport(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const events = await prisma.event.findMany({
    include: {
      registrations: {
        select: {
          paymentStatus: true,
          approvalStatus: true,
          totalAmount: true,
          eventAmount: true,
          stableAmount: true,
          gstAmount: true,
        },
      },
      categories: { select: { name: true, price: true } },
    },
    orderBy: { startDate: 'desc' },
  });

  const summary = events.map(event => {
    const regs = event.registrations;
    return {
      id: event.id,
      name: event.name,
      eventType: event.eventType,
      startDate: event.startDate,
      endDate: event.endDate,
      isPublished: event.isPublished,
      totalRegistrations: regs.length,
      approved: regs.filter(r => r.approvalStatus === 'APPROVED').length,
      pending: regs.filter(r => r.approvalStatus === 'PENDING').length,
      rejected: regs.filter(r => r.approvalStatus === 'REJECTED').length,
      paid: regs.filter(r => r.paymentStatus === 'PAID').length,
      unpaid: regs.filter(r => r.paymentStatus === 'UNPAID').length,
      partial: regs.filter(r => r.paymentStatus === 'PARTIAL').length,
      totalRevenue: regs.reduce((s, r) => s + r.totalAmount, 0),
      eventRevenue: regs.reduce((s, r) => s + r.eventAmount, 0),
      stableRevenue: regs.reduce((s, r) => s + r.stableAmount, 0),
      gstCollected: regs.reduce((s, r) => s + r.gstAmount, 0),
      categories: event.categories.map(c => c.name),
    };
  });

  return res.status(200).json({
    success: true,
    message: 'Event summary report generated',
    statusCode: 200,
    data: { events: summary },
  });
}

export default withAuth(handler);
