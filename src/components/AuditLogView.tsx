import React, { useState, useMemo } from 'react';
import { FileText, Search, Filter, Download, RotateCcw } from 'lucide-react';
import { AuditLogEntry } from '../types/system';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [search, setSearch] = useState('');

  const users = useMemo(() => Array.from(new Set(logs.map((l) => l.user))).sort(), [logs]);
  const actions = useMemo(() => Array.from(new Set(logs.map((l) => l.action))).sort(), [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedUser && log.user !== selectedUser) return false;
      if (selectedAction && log.action !== selectedAction) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          (log.request_id && log.request_id.toLowerCase().includes(q)) ||
          log.user.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          log.details.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [logs, selectedUser, selectedAction, search]);

  const handleExportCsv = () => {
    const headers = ['ID', 'Timestamp (UTC)', 'User', 'Action', 'Request ID', 'Details'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.ts,
      l.user,
      l.action,
      l.request_id || '',
      `"${l.details.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fieldnote_audit_log_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-[#EBE8E1]">
        <div>
          <h1 className="font-serif font-semibold text-2xl md:text-3xl text-[#1D1C16] tracking-tight">
            Compliance & Audit Trail
          </h1>
          <p className="text-xs md:text-sm text-[#424844] mt-1">
            Immutable operational event ledger recording logins, assignments, status changes, and
            transmissions.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1E3A2F] bg-white border border-[#E2DFD7] rounded hover:bg-[#F5F4F0] transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit CSV</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-[#FBFBFA] p-3.5 rounded border border-[#EBE8E1] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] uppercase font-semibold tracking-[0.08em] text-[#8F8C84] mb-1">
              Filter by Operative / User
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full text-xs bg-[#F5F4F0] border border-[#E2DFD7] rounded px-2.5 py-1.5 text-[#1D1C16] focus:outline-none focus:border-[#1E3A2F]"
            >
              <option value="">All Users ({users.length})</option>
              {users.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold tracking-[0.08em] text-[#8F8C84] mb-1">
              Action Category
            </label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full text-xs bg-[#F5F4F0] border border-[#E2DFD7] rounded px-2.5 py-1.5 text-[#1D1C16] focus:outline-none focus:border-[#1E3A2F]"
            >
              <option value="">All Actions ({actions.length})</option>
              {actions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold tracking-[0.08em] text-[#8F8C84] mb-1">
              Search Details
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8F8C84] absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ticket ID or memo..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F5F4F0] border border-[#E2DFD7] rounded text-[#1D1C16] focus:outline-none focus:border-[#1E3A2F]"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#EBE8E1] text-[11px] text-[#8F8C84]">
          <span className="font-mono tabular-nums">
            Showing <strong className="text-[#1D1C16]">{filteredLogs.length}</strong> of{' '}
            {logs.length} logged entries
          </span>
          {(selectedUser || selectedAction || search) && (
            <button
              onClick={() => {
                setSelectedUser('');
                setSelectedAction('');
                setSearch('');
              }}
              className="text-[#1E3A2F] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-[#FBFBFA] rounded border border-[#EBE8E1] overflow-hidden">
        <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-[#F5F4F0] border-b border-[#E2DFD7] text-[10px] uppercase font-semibold text-[#424844] tracking-wider z-10">
              <tr>
                <th className="py-2.5 px-3">Timestamp (UTC / IST)</th>
                <th className="py-2.5 px-3">User / System</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Ticket ID</th>
                <th className="py-2.5 px-3">Details & Parameters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBE8E1]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F5F4F0] transition-colors">
                  <td className="py-2 px-3 font-mono text-[11px] text-[#424844] whitespace-nowrap tabular-nums">
                    {new Date(log.ts).toLocaleString()}
                  </td>
                  <td className="py-2 px-3 font-medium text-[#1D1C16] whitespace-nowrap">
                    {log.user}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#EFECE5] text-[#1E3A2F] border border-[#E2DFD7]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono text-[#1E3A2F] whitespace-nowrap">
                    {log.request_id || '-'}
                  </td>
                  <td className="py-2 px-3 text-[#424844] font-mono text-[11px] truncate max-w-[450px]">
                    {log.details || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
