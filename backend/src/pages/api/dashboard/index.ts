import type { NextApiRequest, NextApiResponse } from 'next'
import { withApiHandler } from '@/lib/api-handler'
import { withRole, AuthenticatedRequest } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma/client'
import { ApiResponse } from '@/types'

/**
 * GET /api/dashboard
 * Admin dashboard - KPI cards, charts, filter options (fast endpoint).
 * Events and participants are now served by separate endpoints
 * (/api/dashboard/events, /api/dashboard/participants) for independent loading.
 * Query params:
 *   eventId - filter KPIs/charts by a specific event
 * Requires: Admin role
 */
async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed', statusCode: 405 })
  }

  try {
    const { eventId } = req.query as Record<string, string | undefined>

    // Build event filter for KPI/chart scoping
    const eventFilter = eventId ? { eventId: eventId as string } : {}

    // Run ALL queries in parallel for maximum speed
    const [
      totalEvents,
      totalClubs,
      totalRiders,
      totalHorses,
      revenueAgg,
      collectibleAgg,
      receivableAgg,
      allEventsList,
      eventBreakdown,
      allCategories,
    ] = await Promise.all([
      // KPI queries
      prisma.event.count(eventId ? { where: { id: eventId } } : undefined),
      eventId
        ? prisma.registration.groupBy({ by: ['clubId'], where: { eventId, clubId: { not: null } } }).then(r => r.length)
        : prisma.club.count(),
      eventId
        ? prisma.registration.groupBy({ by: ['riderId'], where: { eventId } }).then(r => r.length)
        : prisma.rider.count(),
      eventId
        ? prisma.registration.groupBy({ by: ['horseId'], where: { eventId } }).then(r => r.length)
        : prisma.horse.count(),
      prisma.registration.aggregate({
        _sum: { totalAmount: true },
        where: { ...eventFilter, paymentStatus: 'PAID' },
      }),
      prisma.registration.aggregate({
        _sum: { totalAmount: true },
        where: { ...eventFilter },
      }),
      prisma.registration.aggregate({
        _sum: { totalAmount: true },
        where: { ...eventFilter, paymentStatus: { in: ['UNPAID', 'PARTIAL'] } },
      }),
      // Event dropdown list
      prisma.event.findMany({
        orderBy: { startDate: 'desc' },
        select: { id: true, name: true },
      }),
      // Chart data — limited to 20 most recent events
      prisma.event.findMany({
        where: eventId ? { id: eventId } : {},
        select: {
          id: true,
          name: true,
          startDate: true,
          registrations: {
            select: {
              paymentStatus: true,
              riderId: true,
              horseId: true,
            },
          },
        },
        orderBy: { startDate: 'desc' },
        take: 20,
      }),
      // Category list for filters
      prisma.eventCategory.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ])

    const eventStats = eventBreakdown.map((event) => {
      const unpaidCount = event.registrations.filter(
        (r) => r.paymentStatus !== 'PAID'
      ).length
      const riderIds = new Set(event.registrations.map((r) => r.riderId))
      const horseIds = new Set(event.registrations.map((r) => r.horseId))

      return {
        eventId: event.id,
        eventName: event.name,
        startDate: event.startDate,
        unpaidRegistrations: unpaidCount,
        totalRiders: riderIds.size,
        totalHorses: horseIds.size,
      }
    })

    // ====================== RESPONSE ======================
    res.status(200).json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      statusCode: 200,
      data: {
        kpiCards: {
          totalEvents,
          clubsRegistered: totalClubs,
          ridersRegistered: totalRiders,
          horseCount: totalHorses,
          totalRevenue: (revenueAgg._sum as any)?.totalAmount || 0,
          collectibleAmount: (collectibleAgg._sum as any)?.totalAmount || 0,
          receivableAmount: (receivableAgg._sum as any)?.totalAmount || 0,
        },
        charts: {
          eventBreakdown: eventStats,
        },
        filterOptions: {
          events: allEventsList,
          categories: allCategories,
        },
      },
    })
  } catch (error) {
    console.error('[Dashboard Error]', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard data',
      error: error instanceof Error ? error.message : 'Unknown error',
      statusCode: 500,
    })
  }
}

export default withApiHandler(withRole('admin', 'rider')(handler), { allowedMethods: ['GET'] })
