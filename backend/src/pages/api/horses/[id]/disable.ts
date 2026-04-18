import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma/client'
import { withRole, AuthenticatedRequest } from '@/lib/auth-middleware'
import { createAuditLog } from '@/lib/audit'
import { ApiResponse } from '@/types'

/**
 * PATCH /api/horses/[id]/disable
 * Disable/enable a horse
 * Requires: Admin or Club role
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
    const horseId = id as string
    const { isActive } = req.body

    // Validate input
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean',
        statusCode: 400,
      })
    }

    // Get existing horse
    const existingHorse = await prisma.horse.findUnique({
      where: { id: horseId },
    })

    if (!existingHorse) {
      return res.status(404).json({
        success: false,
        message: 'Horse not found',
        statusCode: 404,
      })
    }

    // Update horse active status
    const updatedHorse = await prisma.horse.update({
      where: { id: horseId },
      data: { isActive },
    })

    // Create audit log
    if (req.user?.id) {
      await createAuditLog({
        userId: req.user.id,
        action: isActive ? 'Horse Enabled' : 'Horse Disabled',
        entity: 'Horse',
        entityId: horseId,
        oldValues: { isActive: existingHorse.isActive },
        newValues: { isActive: updatedHorse.isActive },
        changes: ['isActive'],
        ipAddress: req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      })
    }

    return res.status(200).json({
      success: true,
      message: `Horse ${isActive ? 'enabled' : 'disabled'} successfully`,
      statusCode: 200,
      data: updatedHorse,
    })
  } catch (error) {
    console.error('[Horse Disable Error]', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to update horse status',
      error: error instanceof Error ? error.message : 'Unknown error',
      statusCode: 500,
    })
  }
}

export default withRole('admin')(handler)
