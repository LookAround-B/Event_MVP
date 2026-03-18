import type { NextApiRequest, NextApiResponse } from 'next'
import { withApiHandler } from '@/lib/api-handler'
import { withRole, AuthenticatedRequest } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma/client'
import { ApiResponse } from '@/types'

/**
 * GET /api/dashboard
 * Admin dashboard - KPI cards, charts, event lists, participants
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
    // ====================== KPI SUMMARY CARDS ======================
    const [
      totalEvents,
      totalClubs,
      totalRiders,
      totalHorses,
      totalRevenue,
      collectibleAmount,
    ] = await Promise.all([
      // Total Events
      prisma.event.count(),

      // Total Clubs
      prisma.club.count(),

      // Total Riders
      prisma.rider.count(),

      // Total Horses
      prisma.horse.count(),

      // Total Revenue (sum of paid transactions)
      prisma.transaction.aggregate({
        _sum: { totalAmount: true },
        where: { status: 'PAID' },
      }),

      // Collectible Amount (sum of unpaid transactions)
      prisma.transaction.aggregate({
        _sum: { totalAmount: true },
        where: { status: { in: ['UNPAID', 'PARTIAL'] } },
      }),
    ])

    // ====================== CHARTS & ANALYTICS ======================
    // Bar Graph: Per-event breakdown (Unpaid registrations, Total Riders, Total Horses)
    const eventBreakdown = await prisma.event.findMany({
      select: {
        id: true,
        name: true,
        registrations: {
          select: {
            paymentStatus: true,
            riderId: true,
            horseId: true,
          },
        },
      },
    })

    const eventStats = eventBreakdown.map((event) => {
      const unpaidCount = event.registrations.filter(
        (r) => r.paymentStatus !== 'PAID'
      ).length
      const riderIds = new Set(event.registrations.map((r) => r.riderId))
      const horseIds = new Set(event.registrations.map((r) => r.horseId))

      return {
        eventName: event.name,
        unpaidRegistrations: unpaidCount,
        totalRiders: riderIds.size,
        totalHorses: horseIds.size,
      }
    })

    // Monthly Revenue Trend
    const monthlyRevenue = await prisma.transaction.groupBy({
      by: ['transactionDate'],
      _sum: { totalAmount: true },
      where: { status: 'PAID' },
    })

    // Group by month
    const monthlyRevenueMap = new Map<string, number>()
    monthlyRevenue.forEach((record) => {
      const month = new Date(record.transactionDate).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
      })
      const existing = monthlyRevenueMap.get(month) || 0
      monthlyRevenueMap.set(month, existing + (record._sum.totalAmount || 0))
    })

    const monthlyRevenueData = Array.from(monthlyRevenueMap).map(([month, revenue]) => ({
      month,
      revenue,
    }))

    // Registration Trend (group by date)
    const registrationTrend = await prisma.registration.groupBy({
      by: ['createdAt'],
      _count: true,
    })

    const registrationTrendMap = new Map<string, number>()
    registrationTrend.forEach((record) => {
      const date = new Date(record.createdAt).toLocaleDateString('en-US')
      const existing = registrationTrendMap.get(date) || 0
      registrationTrendMap.set(date, existing + record._count)
    })

    const registrationTrendData = Array.from(registrationTrendMap).map(([date, count]) => ({
      date,
      registrations: count,
    }))

    // Upcoming Events Countdown
    const now = new Date()
    const upcomingEvents = await prisma.event.findMany({
      where: {
        startDate: { gt: now },
      },
      select: {
        id: true,
        name: true,
        startDate: true,
      },
      orderBy: { startDate: 'asc' },
      take: 5,
    })

    const upcomingCountdown = upcomingEvents.map((event) => {
      const daysUntil = Math.ceil(
        (event.startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      return {
        eventName: event.name,
        daysUntil,
        startDate: event.startDate,
      }
    })

    // Most Active Club (by number of registrations)
    const mostActiveClub = await prisma.registration.groupBy({
      by: ['clubId'],
      _count: true,
      orderBy: { _count: { clubId: 'desc' } },
      take: 1,
    })

    let mostActiveClubInfo = null
    if (mostActiveClub.length > 0 && mostActiveClub[0].clubId) {
      const club = await prisma.club.findUnique({
        where: { id: mostActiveClub[0].clubId },
        select: { name: true, eId: true, _count: { select: { registrations: true } } },
      })
      mostActiveClubInfo = {
        clubName: club?.name,
        registrations: mostActiveClub[0]._count,
      }
    }

    // Most Active Rider (by number of registrations)
    const mostActiveRider = await prisma.registration.groupBy({
      by: ['riderId'],
      _count: true,
      orderBy: { _count: { riderId: 'desc' } },
      take: 1,
    })

    let mostActiveRiderInfo = null
    if (mostActiveRider.length > 0) {
      const rider = await prisma.rider.findUnique({
        where: { id: mostActiveRider[0].riderId },
        select: { firstName: true, lastName: true, _count: { select: { registrations: true } } },
      })
      mostActiveRiderInfo = {
        riderName: `${rider?.firstName} ${rider?.lastName}`,
        registrations: mostActiveRider[0]._count,
      }
    }

    // ====================== EVENT LISTS ======================
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
      },
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
      },
      take: 20, // Limit to last 20 for performance
    })

    // ====================== PARTICIPANTS LIST ======================
    const participants = await prisma.registration.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        eId: true,
        event: { select: { name: true } },
        rider: { select: { firstName: true, lastName: true } },
        horse: { select: { name: true } },
        club: { select: { name: true } },
        category: { select: { name: true } },
        paymentStatus: true,
        totalAmount: true,
        registeredAt: true,
      },
      take: 50, // Limit to last 50 for performance
    })

    const participantsFormatted = participants.map((p) => ({
      eventName: p.event.name,
      eventDate: p.registeredAt,
      riderName: `${p.rider.firstName} ${p.rider.lastName}`,
      clubName: p.club?.name || 'N/A',
      horseName: p.horse.name,
      eventCategory: p.category.name,
      price: p.totalAmount,
      paymentStatus: p.paymentStatus,
    }))

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
          totalRevenue: totalRevenue._sum.totalAmount || 0,
          collectibleAmount: collectibleAmount._sum.totalAmount || 0,
        },
        charts: {
          eventBreakdown: eventStats,
          monthlyRevenue: monthlyRevenueData,
          registrationTrend: registrationTrendData,
          upcomingEventsCountdown: upcomingCountdown,
          mostActiveClub: mostActiveClubInfo,
          mostActiveRider: mostActiveRiderInfo,
        },
        eventLists: {
          currentEvents,
          allEvents,
        },
        participantsList: {
          data: participantsFormatted,
          count: participantsFormatted.length,
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
