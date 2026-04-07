import type { NextApiResponse } from 'next'
import { withApiHandler } from '@/lib/api-handler'
import { withRole, AuthenticatedRequest } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma/client'
import { ApiResponse } from '@/types'

/**
 * GET /api/dashboard/events
 * Returns paginated event lists for the dashboard.
 * Query params:
 *   tab - "current" | "all" (default: "all")
 *   page - page number (default: 1)
 *   limit - items per page (default: 20)
 */
async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed', statusCode: 405 })
  }

  try {
    const { tab, page, limit } = req.query as Record<string, string | undefined>

    const pPage = Math.max(1, parseInt(page || '1', 10) || 1)
    const pLimit = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20))
    const pSkip = (pPage - 1) * pLimit
    const now = new Date()

    if (tab === 'current') {
      const where = {
        startDate: { lte: now },
        endDate: { gte: now },
        isPublished: true,
      }

      const [count, events] = await Promise.all([
        prisma.event.count({ where }),
        prisma.event.findMany({
          where,
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
          skip: pSkip,
          take: pLimit,
        }),
      ])

      return res.status(200).json({
        success: true,
        message: 'Current events retrieved',
        statusCode: 200,
        data: {
          events,
          count,
          page: pPage,
          limit: pLimit,
          pages: Math.ceil(count / pLimit),
        },
      })
    }

    // Default: all events
    const [count, events] = await Promise.all([
      prisma.event.count(),
      prisma.event.findMany({
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
        skip: pSkip,
        take: pLimit,
      }),
    ])

    res.status(200).json({
      success: true,
      message: 'Events retrieved',
      statusCode: 200,
      data: {
        events,
        count,
        page: pPage,
        limit: pLimit,
        pages: Math.ceil(count / pLimit),
      },
    })
  } catch (error) {
    console.error('[Dashboard Events Error]', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve events',
      error: error instanceof Error ? error.message : 'Unknown error',
      statusCode: 500,
    })
  }
}

export default withApiHandler(withRole('admin', 'rider')(handler), { allowedMethods: ['GET'] })
