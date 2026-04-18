import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma/client'
import { withRole, AuthenticatedRequest } from '@/lib/auth-middleware'
import { createAuditLog } from '@/lib/audit'
import { ApiResponse } from '@/types'

/**
 * PATCH /api/riders/[id]/disable
 * Disable/enable a rider
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
    const riderId = id as string
    const { isActive } = req.body

    // Validate input
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean',
        statusCode: 400,
      })
    }

    // Get existing rider
    const existingRider = await prisma.rider.findUnique({
      where: { id: riderId },
    })

    if (!existingRider) {
      return res.status(404).json({
        success: false,
        message: 'Rider not found',
        statusCode: 404,
      })
    }

    // Update rider active status
    const updatedRider = await prisma.rider.update({
      where: { id: riderId },
      data: { isActive },
    })

    // Create audit log
    if (req.user?.id) {
      await createAuditLog({
        userId: req.user.id,
        action: isActive ? 'Rider Enabled' : 'Rider Disabled',
        entity: 'Rider',
        entityId: riderId,
        oldValues: { isActive: existingRider.isActive },
        newValues: { isActive: updatedRider.isActive },
        changes: ['isActive'],
        ipAddress: req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      })
    }

    return res.status(200).json({
      success: true,
      message: `Rider ${isActive ? 'enabled' : 'disabled'} successfully`,
      statusCode: 200,
      data: updatedRider,
    })
  } catch (error) {
    console.error('[Rider Disable Error]', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to update rider status',
      error: error instanceof Error ? error.message : 'Unknown error',
      statusCode: 500,
    })
  }
}

export default withRole('admin')(handler)
