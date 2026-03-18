import type { NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma/client'
import { withPermission, AuthenticatedRequest } from '@/lib/auth-middleware'
import { createAuditLog } from '@/lib/audit'
import { ApiResponse } from '@/types'

async function handler(req: AuthenticatedRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      statusCode: 405,
    })
  }

  try {
    const { id } = req.query
    const eventId = id as string

    const source = await prisma.event.findUnique({
      where: { id: eventId },
      include: { categories: { select: { id: true } } },
    })

    if (!source) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
        statusCode: 404,
      })
    }

    const duplicate = await prisma.event.create({
      data: {
        eventType: source.eventType,
        name: `${source.name} (Copy)`,
        description: source.description,
        startDate: source.startDate,
        endDate: source.endDate,
        startTime: source.startTime,
        endTime: source.endTime,
        venueName: source.venueName,
        venueAddress: source.venueAddress,
        venueLat: source.venueLat,
        venueLng: source.venueLng,
        termsAndConditions: source.termsAndConditions,
        fileUrl: source.fileUrl,
        isPublished: false,
        categories: {
          connect: source.categories.map((c) => ({ id: c.id })),
        },
      },
      include: { categories: true },
    })

    if (req.user?.id) {
      await createAuditLog({
        userId: req.user.id,
        action: 'Event Duplicated',
        entity: 'Event',
        entityId: duplicate.id,
        newValues: { sourceEventId: eventId, newEventId: duplicate.id },
        changes: ['duplicated'],
        ipAddress: req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      })
    }

    return res.status(201).json({
      success: true,
      message: 'Event duplicated successfully',
      statusCode: 201,
      data: duplicate,
    })
  } catch (error) {
    console.error('[Event Duplicate Error]', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to duplicate event',
      error: error instanceof Error ? error.message : 'Unknown error',
      statusCode: 500,
    })
  }
}

export default withPermission('Create', 'Event')(handler)
