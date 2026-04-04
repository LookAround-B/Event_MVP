import { prisma } from './prisma/client';
import { ErrorCode, logError } from './errors';

export interface AuditLogInput {
  userId: string;
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT';
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changes?: string[];
  ipAddress?: string;
  userAgent?: string;
  description?: string;
}

/**
 * Creates an audit log entry for tracking system changes.
 * Fire-and-forget: never blocks the response.
 */
export function createAuditLog(input: AuditLogInput): void {
  const {
    userId,
    entityType,
    entityId,
    action,
    oldValues = {},
    newValues = {},
    changes = [],
    ipAddress,
    userAgent,
    description,
  } = input;

  // Calculate changes if not provided
  let detectedChanges = changes;
  if (detectedChanges.length === 0 && oldValues && newValues) {
    detectedChanges = Object.keys(newValues).filter(
      (key) => JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])
    );
  }

  prisma.auditLog.create({
    data: {
      userId,
      entityType,
      entityId,
      action,
      oldValues: Object.keys(oldValues).length > 0 ? oldValues : null,
      newValues: Object.keys(newValues).length > 0 ? newValues : null,
      changes: detectedChanges.length > 0 ? detectedChanges : null,
      ipAddress,
      userAgent,
      description,
    },
  }).catch((err) => console.error('Audit log failed:', err));
}

/**
 * Helper to extract user ID from request
 * Used in API handlers to get the current user ID for audit logging
 */
export function getUserIdFromRequest(req: any): string | null {
  // This assumes user info is attached to request by auth middleware
  if (req.user && req.user.id) {
    return req.user.id;
  }
  return null;
}

/**
 * Helper to get client IP address from request
 */
export function getClientIpAddress(req: any): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  return typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
}

/**
 * Helper to get user agent from request
 */
export function getUserAgent(req: any): string | undefined {
  return req.headers['user-agent'];
}

/**
 * Audit logging patterns for common operations
 */

export function auditCreate(
  userId: string,
  entityType: string,
  entityId: string,
  newValues: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): void {
  createAuditLog({
    userId,
    entityType,
    entityId,
    action: 'CREATE',
    newValues,
    ipAddress,
    userAgent,
    description: `Created ${entityType}`,
  });
}

export function auditUpdate(
  userId: string,
  entityType: string,
  entityId: string,
  oldValues: Record<string, any>,
  newValues: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): void {
  const changes = Object.keys(newValues).filter(
    (key) => JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])
  );

  if (changes.length === 0) {
    return; // No changes, don't log
  }

  createAuditLog({
    userId,
    entityType,
    entityId,
    action: 'UPDATE',
    oldValues,
    newValues,
    changes,
    ipAddress,
    userAgent,
    description: `Updated ${entityType}: ${changes.join(', ')}`,
  });
}

export function auditDelete(
  userId: string,
  entityType: string,
  entityId: string,
  oldValues: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): void {
  createAuditLog({
    userId,
    entityType,
    entityId,
    action: 'DELETE',
    oldValues,
    ipAddress,
    userAgent,
    description: `Deleted ${entityType}`,
  });
}

export function auditView(
  userId: string,
  entityType: string,
  entityId: string,
  ipAddress?: string,
  userAgent?: string
): void {
  createAuditLog({
    userId,
    entityType,
    entityId,
    action: 'VIEW',
    ipAddress,
    userAgent,
    description: `Viewed ${entityType}`,
  });
}

export function auditExport(
  userId: string,
  entityType: string,
  exportFormat: string,
  recordCount: number,
  ipAddress?: string,
  userAgent?: string
): void {
  createAuditLog({
    userId,
    entityType,
    entityId: `export-${Date.now()}`,
    action: 'EXPORT',
    newValues: {
      format: exportFormat,
      recordCount,
    },
    ipAddress,
    userAgent,
    description: `Exported ${recordCount} ${entityType} records as ${exportFormat}`,
  });
}
