import type { NextApiRequest, NextApiResponse } from 'next'
import { withApiHandler } from '@/lib/api-handler'
import { withRole, AuthenticatedRequest } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma/client'
import { ApiResponse } from '@/types'

/**
 * GET /api/dashboard
 * Admin dashboard - KPI cards, charts, event lists, participants
 * Query params:
 *   eventId - filter KPIs/charts by a specific event
 *   participantPage / participantLimit - paginate participants
 *   participantMonths - comma-separated YYYY-MM for month filter
 *   participantEvents - comma-separated event IDs
 *   participantCategories - comma-separated category IDs
 *   participantPayment - comma-separated payment statuses
 *   format - "csv" to export participants as CSV
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
    const {
      eventId,
      participantPage,
      participantLimit,
      participantMonths,
      participantEvents,
      participantCategories,
      participantPayment,
      format,
    } = req.query as Record<string, string | undefined>

    // Build event filter for KPI/chart scoping
    const eventFilter = eventId ? { eventId: eventId as string } : {}
    const eventWhere = eventId ? { id: eventId as string } : {}

    // ====================== KPI SUMMARY CARDS ======================
    const [
      totalEvents,
      totalClubs,
      totalRiders,
      totalHorses,
      revenueAgg,
      collectibleAgg,
      receivableAgg,
    ] = await Promise.all([
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
    ])

    // ====================== EVENT DROPDOWN LIST ======================
    const allEventsList = await prisma.event.findMany({
      orderBy: { startDate: 'desc' },
      select: { id: true, name: true },
    })

    // ====================== CHARTS & ANALYTICS ======================
    const eventBreakdown = await prisma.event.findMany({
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
      orderBy: { startDate: 'asc' },
    })

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

    // ====================== EVENT LISTS ======================
    const now = new Date()

    // Current Events (ongoing now)
    const currentEvents = await prisma.event.findMany({
      where: {
        startDate: { lte: now },
        endDate: { gte: now },
        isPublished: true,
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        venueAddress: true,
        venueName: true,
        eventType: true,
      },
      orderBy: { startDate: 'desc' },
    })

    // All Events (chronological)
    const allEvents = await prisma.event.findMany({
      orderBy: { startDate: 'desc' },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        eventType: true,
        isPublished: true,
        venueAddress: true,
        venueName: true,
      },
    })

    // ====================== PARTICIPANTS LIST ======================
    const pPage = Math.max(1, parseInt(participantPage || '1', 10) || 1)
    const pLimit = Math.min(100, Math.max(1, parseInt(participantLimit || '20', 10) || 20))
    const pSkip = (pPage - 1) * pLimit

    // Build participant where clause
    const participantWhere: any = {}
    if (participantEvents) {
      const ids = (participantEvents as string).split(',').map(s => s.trim()).filter(Boolean)
      if (ids.length > 0) participantWhere.eventId = { in: ids }
    } else if (eventId) {
      participantWhere.eventId = eventId
    }
    if (participantCategories) {
      const ids = (participantCategories as string).split(',').map(s => s.trim()).filter(Boolean)
      if (ids.length > 0) participantWhere.categoryId = { in: ids }
    }
    if (participantPayment) {
      const statuses = (participantPayment as string).split(',').map(s => s.trim()).filter(Boolean)
      if (statuses.length > 0) participantWhere.paymentStatus = { in: statuses }
    }
    if (participantMonths) {
      const months = (participantMonths as string).split(',').map(s => s.trim()).filter(Boolean)
      if (months.length > 0) {
        const dateRanges = months.map(m => {
          const [year, month] = m.split('-').map(Number)
          const start = new Date(year, month - 1, 1)
          const end = new Date(year, month, 0, 23, 59, 59, 999)
          return { registeredAt: { gte: start, lte: end } }
        })
        participantWhere.OR = dateRanges
      }
    }

    const [participantCount, participants] = await Promise.all([
      prisma.registration.count({ where: participantWhere }),
      prisma.registration.findMany({
        where: participantWhere,
        orderBy: { createdAt: 'desc' },
        skip: pSkip,
        take: pLimit,
        select: {
          id: true,
          eId: true,
          paymentStatus: true,
          paymentMethod: true,
          totalAmount: true,
          registeredAt: true,
          event: { select: { id: true, name: true, startDate: true } },
          rider: { select: { firstName: true, lastName: true } },
          horse: { select: { name: true } },
          club: { select: { name: true } },
          category: { select: { id: true, name: true } },
        },
      }),
    ])

    const participantsFormatted = participants.map((p) => ({
      id: p.id,
      eventName: p.event.name,
      eventId: p.event.id,
      eventDate: p.event.startDate,
      riderName: `${p.rider.firstName} ${p.rider.lastName}`,
      clubName: p.club?.name || 'N/A',
      horseName: p.horse.name,
      eventCategory: p.category.name,
      categoryId: p.category.id,
      price: p.totalAmount,
      paymentMethod: p.paymentMethod || 'N/A',
      paymentStatus: p.paymentStatus,
    }))

    // CSV export
    if (format === 'csv') {
      const headers = ['Event Name', 'Event Date', 'Rider Name', 'Club Name', 'Horse Name', 'Event Category', 'Price', 'Payment Method', 'Payment Status']
      const rows = participantsFormatted.map(p => [
        p.eventName,
        new Date(p.eventDate).toLocaleDateString(),
        p.riderName,
        p.clubName,
        p.horseName,
        p.eventCategory,
        p.price,
        p.paymentMethod,
        p.paymentStatus,
      ])
      const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename=participants.csv')
      return res.status(200).send(csv as any)
    }

    // ====================== CATEGORY LIST (for filters) ======================
    const allCategories = await prisma.eventCategory.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
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
          totalRevenue: revenueAgg._sum.totalAmount || 0,
          collectibleAmount: collectibleAgg._sum.totalAmount || 0,
          receivableAmount: receivableAgg._sum.totalAmount || 0,
        },
        charts: {
          eventBreakdown: eventStats,
        },
        eventLists: {
          currentEvents,
          allEvents,
        },
        participantsList: {
          data: participantsFormatted,
          count: participantCount,
          page: pPage,
          limit: pLimit,
          pages: Math.ceil(participantCount / pLimit),
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

export default withApiHandler(withRole('admin')(handler), { allowedMethods: ['GET'] })
