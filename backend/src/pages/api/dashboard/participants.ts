import type { NextApiResponse } from 'next'
import { withApiHandler } from '@/lib/api-handler'
import { withRole, AuthenticatedRequest } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma/client'
import { ApiResponse } from '@/types'

/**
 * GET /api/dashboard/participants
 * Participants list with filters + pagination.
 * Query params:
 *   eventId - filter by event
 *   page / limit - pagination
 *   months - comma-separated YYYY-MM
 *   events - comma-separated event IDs
 *   categories - comma-separated category IDs
 *   payment - comma-separated payment statuses
 *   format - "csv" for CSV export
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
      page,
      limit,
      months,
      events: eventIds,
      categories,
      payment,
      format,
    } = req.query as Record<string, string | undefined>

    const pPage = Math.max(1, parseInt(page || '1', 10) || 1)
    const pLimit = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20))
    const pSkip = (pPage - 1) * pLimit

    // Build where clause
    const where: any = {}
    if (eventIds) {
      const ids = eventIds.split(',').map(s => s.trim()).filter(Boolean)
      if (ids.length > 0) where.eventId = { in: ids }
    } else if (eventId) {
      where.eventId = eventId
    }
    if (categories) {
      const ids = categories.split(',').map(s => s.trim()).filter(Boolean)
      if (ids.length > 0) where.categoryId = { in: ids }
    }
    if (payment) {
      const statuses = payment.split(',').map(s => s.trim()).filter(Boolean)
      if (statuses.length > 0) where.paymentStatus = { in: statuses }
    }
    if (months) {
      const monthList = months.split(',').map(s => s.trim()).filter(Boolean)
      if (monthList.length > 0) {
        const dateRanges = monthList.map(m => {
          const [year, month] = m.split('-').map(Number)
          const start = new Date(year, month - 1, 1)
          const end = new Date(year, month, 0, 23, 59, 59, 999)
          return { registeredAt: { gte: start, lte: end } }
        })
        where.OR = dateRanges
      }
    }

    const [count, participants] = await Promise.all([
      prisma.registration.count({ where }),
      prisma.registration.findMany({
        where,
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

    const formatted = participants.map((p) => ({
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
      const rows = formatted.map(p => [
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

    res.status(200).json({
      success: true,
      message: 'Participants retrieved',
      statusCode: 200,
      data: {
        data: formatted,
        count,
        page: pPage,
        limit: pLimit,
        pages: Math.ceil(count / pLimit),
      },
    })
  } catch (error) {
    console.error('[Dashboard Participants Error]', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve participants',
      error: error instanceof Error ? error.message : 'Unknown error',
      statusCode: 500,
    })
  }
}

export default withApiHandler(withRole('admin', 'rider')(handler), { allowedMethods: ['GET'] })
