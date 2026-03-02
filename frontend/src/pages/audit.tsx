import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiFilter, FiSearch } from 'react-icons/fi';

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
      const response = await axios.get('/api/audit', {
        params: {
          page,
          limit,
          ...(entity && { entity }),
          ...(action && { action }),
        },
      });
      setLogs(response.data.data || []);
      setTotal(response.data.pagination?.total || 0);
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
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Audit Logs</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Entity</label>
            <input
              type="text"
              value={entity}
              onChange={(e) => {
                setEntity(e.target.value);
                setPage(1);
              }}
              placeholder="e.g., User, Event, Club"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
            <input
              type="text"
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              placeholder="e.g., CREATE, UPDATE, DELETE"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setEntity('');
                setAction('');
                setPage(1);
              }}
              className="w-full px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No audit logs found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Changes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">{log.user.firstName} {log.user.lastName}</div>
                        <div className="text-gray-500 text-xs">{log.user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {log.entity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            log.action.includes('CREATED') || log.action.includes('CREATE')
                              ? 'bg-green-100 text-green-800'
                              : log.action.includes('UPDATED') || log.action.includes('UPDATE')
                              ? 'bg-yellow-100 text-yellow-800'
                              : log.action.includes('DELETED') || log.action.includes('DELETE')
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {getChangesSummary(log)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {logs.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
                {Math.min(page * limit, total)} of {total} results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const startPage = Math.max(1, page - 2);
                    const endPage = Math.min(totalPages, startPage + 4);
                    return i + startPage;
                  }).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-2 rounded-lg transition ${
                        p === page
                          ? 'bg-indigo-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
