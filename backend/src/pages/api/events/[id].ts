import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import { validateInput } from '@/lib/validation';
import { createAuditLog } from '@/lib/audit';
import { ApiResponse } from '@/types';

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { id } = req.query;
  const eventId = id as string;

  if (req.method === 'GET') {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          categories: true,
          registrations: {
            include: {
              rider: true,
              horse: true,
            },
          },
        },
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
          error: 'NOT_FOUND',
          statusCode: 404,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Event retrieved successfully',
        statusCode: 200,
        data: event,
      });
    } catch (error) {
      console.error('Event GET error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve event',
        error: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { name, startDate, startTime, startEndTime, endDate, endStartTime, endTime, venueName, venueAddress, venueLat, venueLng, description, eventType, isPublished, termsAndConditions, fileUrl, categoryIds } = req.body;

      // Fetch existing event for audit comparison
      const existingEvent = await prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!existingEvent) {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
          error: 'NOT_FOUND',
          statusCode: 404,
        });
      }

      // Validate name length if provided
      if (name && (name.trim().length < 3 || name.trim().length > 200)) {
        return res.status(400).json({
          success: false,
          message: 'Event name must be between 3 and 200 characters',
          error: 'VALIDATION_ERROR',
          statusCode: 400,
        });
      }

      // Validate event type if provided
      if (eventType && !['KSEC', 'EPL', 'EIRS Show'].includes(eventType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid event type',
          error: 'VALIDATION_ERROR',
          statusCode: 400,
        });
      }

      // Update event
      const updateData: any = {};
      const changedFields: string[] = [];

      if (name && name !== existingEvent.name) {
        updateData.name = name;
        changedFields.push('name');
      }
      if (startDate && new Date(startDate).getTime() !== existingEvent.startDate.getTime()) {
        updateData.startDate = new Date(startDate);
        changedFields.push('startDate');
      }
      if (endDate && new Date(endDate).getTime() !== existingEvent.endDate.getTime()) {
        updateData.endDate = new Date(endDate);
        changedFields.push('endDate');
      }
      if (startTime && startTime !== existingEvent.startTime) {
        updateData.startTime = startTime;
        changedFields.push('startTime');
      }
      if (endTime && endTime !== existingEvent.endTime) {
        updateData.endTime = endTime;
        changedFields.push('endTime');
      }
      if (startEndTime !== undefined && startEndTime !== (existingEvent as any).startEndTime) {
        updateData.startEndTime = startEndTime;
        changedFields.push('startEndTime');
      }
      if (endStartTime !== undefined && endStartTime !== (existingEvent as any).endStartTime) {
        updateData.endStartTime = endStartTime;
        changedFields.push('endStartTime');
      }
      if (venueName !== undefined && venueName !== existingEvent.venueName) {
        updateData.venueName = venueName;
        changedFields.push('venueName');
      }
      if (venueAddress !== undefined && venueAddress !== existingEvent.venueAddress) {
        updateData.venueAddress = venueAddress;
        changedFields.push('venueAddress');
      }
      if (venueLat !== undefined && venueLat !== existingEvent.venueLat) {
        updateData.venueLat = venueLat ? parseFloat(venueLat) : null;
        changedFields.push('venueLat');
      }
      if (venueLng !== undefined && venueLng !== existingEvent.venueLng) {
        updateData.venueLng = venueLng ? parseFloat(venueLng) : null;
        changedFields.push('venueLng');
      }
      if (description !== undefined && description !== existingEvent.description) {
        updateData.description = description;
        changedFields.push('description');
      }
      if (eventType && eventType !== existingEvent.eventType) {
        updateData.eventType = eventType;
        changedFields.push('eventType');
      }
      if (isPublished !== undefined && isPublished !== existingEvent.isPublished) {
        updateData.isPublished = isPublished;
        changedFields.push('isPublished');
      }
      if (termsAndConditions !== undefined && termsAndConditions !== existingEvent.termsAndConditions) {
        updateData.termsAndConditions = termsAndConditions;
        changedFields.push('termsAndConditions');
      }
      if (fileUrl !== undefined && fileUrl !== existingEvent.fileUrl) {
        updateData.fileUrl = fileUrl;
        changedFields.push('fileUrl');
      }

      // Handle categories
      if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
        updateData.categories = {
          set: categoryIds.map((id: string) => ({ id })),
        };
        changedFields.push('categories');
      }

      const updatedEvent = await prisma.event.update({
        where: { id: eventId },
        data: updateData,
        include: {
          categories: true,
        },
      });

      // Create audit log if changes made
      if (changedFields.length > 0 && req.user?.id) {
        await createAuditLog({
          userId: req.user.id,
          action: 'Event Edited',
          entity: 'Event',
          entityId: eventId,
          oldValues: {
            ...Object.fromEntries(changedFields.map(f => [f, (existingEvent as any)[f]])),
          },
          newValues: {
            ...Object.fromEntries(changedFields.map(f => [f, (updatedEvent as any)[f]])),
          },
          changes: changedFields,
          ipAddress: req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Event updated successfully',
        statusCode: 200,
        data: updatedEvent,
      });
    } catch (error) {
      console.error('Event PUT error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update event',
        error: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Check if event has registrations (prevent deletion if it does)
      const registrationCount = await prisma.registration.count({
        where: { eventId: eventId },
      });

      if (registrationCount > 0) {
        return res.status(409).json({
          success: false,
          message: `Cannot delete event with ${registrationCount} active registrations`,
          error: 'CONFLICT',
          statusCode: 409,
        });
      }

      const deletedEvent = await prisma.event.delete({
        where: { id: eventId },
      });

      // Create audit log
      if (req.user?.id) {
        await createAuditLog({
          userId: req.user.id,
          action: 'Event Deleted',
          entity: 'Event',
          entityId: eventId,
          oldValues: deletedEvent,
          changes: ['Event deleted'],
          ipAddress: req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Event deleted successfully',
        statusCode: 200,
      });
    } catch (error) {
      console.error('Event DELETE error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete event',
        error: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed',
    error: 'METHOD_NOT_ALLOWED',
    statusCode: 405,
  });
}

export default withAuth(handler);
