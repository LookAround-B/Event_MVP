import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import api from '@/lib/api';
import ProtectedRoute from '@/lib/protected-route';
import AuditPagination from '@/components/AuditPagination';

interface AuditLog {
  id: string;
  entity: string;
  action: string;
  entityId: string;
  changes: string[];
  oldValues: any;
  newValues: any;
  userId: string;
  user: {
    email: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');
  const limit = 20;

  useEffect(() => {
    fetchAuditLogs();
  }, [page, entity, action]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/audit', {
        params: {
          page,
          limit,
          ...(entity && { entity }),
          ...(action && { action }),
        },
      });
      const body = response.data.data || {};
      setLogs(Array.isArray(body.data) ? body.data : Array.isArray(body) ? body : []);
      setTotal(body.pagination?.total || response.data.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getChangesSummary = (log: AuditLog) => {
    if (log.changes && log.changes.length > 0) {
      return log.changes.join(', ');
    }
    if (log.oldValues && log.newValues) {
      return 'Values changed';
    }
    return '—';
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <ProtectedRoute>
      <Head><title>Audit Logs | Equestrian Events</title></Head>
      <div>
        <h1 className="text-3xl font-black text-on-surface tracking-tighter sm:text-4xl mb-8">Audit <span className="gradient-text">Trail</span></h1>

        {/* Filters */}
        <div className="bento-card mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Entity</label>
            <input
              type="text"
              value={entity}
              onChange={(e) => {
                setEntity(e.target.value);
                setPage(1);
              }}
              placeholder="e.g., User, Event, Club"
              className="input"
            />
          </div>
          <div>
            <label className="form-label">Action</label>
            <input
              type="text"
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              placeholder="e.g., CREATE, UPDATE, DELETE"
              className="input"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setEntity('');
                setAction('');
                setPage(1);
              }}
              className="inline-flex h-[42px] items-center justify-center rounded-lg border border-border/50 bg-surface-container px-4 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-bright"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bento-card table-container">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading audit logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No audit logs found.</div>
          ) : (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>User</th>
                    <th>Entity</th>
                    <th>Action</th>
                    <th>Changes</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="text-sm">{formatDate(log.createdAt)}</td>
                      <td className="text-sm">
                        <div className="font-medium">{log.user.firstName} {log.user.lastName}</div>
                        <div className="text-muted-foreground text-xs">{log.user.email}</div>
                      </td>
                      <td className="text-sm">
                        <span className="badge badge-info">{log.entity}</span>
                      </td>
                      <td className="text-sm">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            log.action.includes('CREATED') || log.action.includes('CREATE')
                              ? 'bg-green-500/20 text-green-300'
                              : log.action.includes('UPDATED') || log.action.includes('UPDATE')
                              ? 'bg-yellow-500/20 text-yellow-300'
                              : log.action.includes('DELETED') || log.action.includes('DELETE')
                              ? 'bg-red-500/20 text-destructive'
                              : 'bg-surface-lowest0/20 text-muted-foreground'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="text-sm text-muted-foreground max-w-xs truncate">
                        {getChangesSummary(log)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <AuditPagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
