import { prisma } from './db.js';

export interface CreateAuditLogParams {
  actorEmail: string;
  actorRole: string;
  action: string;
  resource: string;
  status: 'SUCCESS' | 'FAILED' | 'WARNING';
  details?: string;
  ipAddress?: string;
}

export async function recordAuditLog(params: CreateAuditLogParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        actorEmail: params.actorEmail || 'admin@contoso.onmicrosoft.com',
        actorRole: params.actorRole || 'GLOBAL_ADMIN',
        action: params.action,
        resource: params.resource,
        status: params.status,
        details: params.details || null,
        ipAddress: params.ipAddress || '127.0.0.1',
      },
    });
  } catch (err) {
    console.error('Failed to record audit log:', err);
    return null;
  }
}
