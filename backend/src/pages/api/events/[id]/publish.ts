import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma/client'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import { createAuditLog } from '@/lib/audit'
import { ApiResponse } from '@/types'

/**
 * PATCH /api/events/[id]/publish
 * Toggle event published status
 * Requires: Admin role
 */
async function handler(req: AuthenticatedRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      statusCode: 405,
    })
  }

  try {
    const { id } = req.query
    const eventId = id as string
    const { isPublished } = req.body

    // Validate input
    if (typeof isPublished !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isPublished must be a boolean',
        statusCode: 400,
      })
    }

    // Get existing event
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
        statusCode: 404,
      })
    }

    // Update event published status
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { isPublished },
    })

    // Create audit log
    if (req.user?.id) {
      await createAuditLog({
        userId: req.user.id,
        action: 'Event Published',
        entity: 'Event',
        entityId: eventId,
        oldValues: { isPublished: existingEvent.isPublished },
        newValues: { isPublished: updatedEvent.isPublished },
        changes: ['isPublished'],
        ipAddress: req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      })
    }

    return res.status(200).json({
      success: true,
      message: `Event ${isPublished ? 'published' : 'unpublished'} successfully`,
      statusCode: 200,
      data: updatedEvent,
    })
  } catch (error) {
    console.error('[Event Publish Error]', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to update event publish status',
      error: error instanceof Error ? error.message : 'Unknown error',
      statusCode: 500,
    })
  }
}

export default withAuth(handler)
