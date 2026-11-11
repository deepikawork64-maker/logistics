import React from 'react';
import {
  AlertTriangle,
  Clock,
  Inbox,
  UserX,
  ShieldAlert,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { TicketRequest, CATEGORY_LABELS } from '../types/system';

interface DashboardViewProps {
  requests: TicketRequest[];
  onSelectTicket: (ticket: TicketRequest) => void;
  onNavigateToTickets: (filterPreset?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  requests,
  onSelectTicket,
  onNavigateToTickets,
}) => {
  const total = requests.length;
  const openReqs = requests.filter((r) => r.is_open);
  const openCount = openReqs.length;
  const unassignedCount = requests.filter((r) => r.is_unassigned).length;
  const overdueReqs = requests.filter((r) => r.is_overdue);
  const overdueCount = overdueReqs.length;
  const escalatedReqs = requests.filter((r) => r.status === 'Escalated');
  const escalatedCount = escalatedReqs.length;

  const respondedReqs = requests.filter((r) => r.first_response_hrs !== null);
  const avgFirstResponse =
    respondedReqs.length > 0
      ? (
          respondedReqs.reduce((acc, r) => acc + (r.first_response_hrs || 0), 0) /
          respondedReqs.length
        ).toFixed(1)
      : '-';

  // Category counts
  const categoryCounts = requests.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Status counts
  const statusCounts = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Workload by team
  const teamWorkload = openReqs.reduce((acc, r) => {
    const t = r.team || 'Unassigned';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Needs Attention items (overdue / unassigned / escalated)
  const needsAttention = requests.filter(
    (r) => r.is_overdue || r.is_unassigned || r.status === 'Escalated'
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-[#EBE8E1]">
        <div>
          <h1 className="font-serif font-semibold text-2xl md:text-3xl text-[#1D1C16] tracking-tight">
            Summit Operations Dashboard
          </h1>
          <p className="text-xs md:text-sm text-[#424844] mt-1">
            Real-time telemetry, first-response SLA adherence, and team queue allocation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToTickets()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1E3A2F] bg-white border border-[#E2DFD7] rounded hover:bg-[#F5F4F0] transition-colors"
          >
            <span>View All Tickets ({total})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 6 Key KPI Metric Strips */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total */}
        <div className="p-3.5 bg-[#FBFBFA] rounded border border-[#EBE8E1] space-y-1">
          <span className="text-[10px] uppercase font-semibold tracking-[0.08em] text-[#8F8C84] block">
            Total Requests
          </span>
          <div className="text-2xl font-serif font-bold text-[#1D1C16] font-mono tabular-nums">
            {total}
          </div>
          <span className="text-[11px] text-[#424844]">Ingested from mailbox</span>
        </div>

        {/* Open */}
        <div className="p-3.5 bg-[#FBFBFA] rounded border border-[#EBE8E1] space-y-1">
          <span className="text-[10px] uppercase font-semibold tracking-[0.08em] text-[#8F8C84] block">
            Open Queue
          </span>
          <div className="text-2xl font-serif font-bold text-[#1E3A2F] font-mono tabular-nums">
            {openCount}
          </div>
          <span className="text-[11px] text-[#424844]">Active attention</span>
        </div>

        {/* Unassigned */}
        <div className="p-3.5 bg-[#FBFBFA] rounded border border-[#EBE8E1] space-y-1">
          <span className="text-[10px] uppercase font-semibold tracking-[0.08em] text-[#8F8C84] block">
            Unassigned
          </span>
          <div className="text-2xl font-serif font-bold text-[#976508] font-mono tabular-nums">
            {unassignedCount}
          </div>
          <span className="text-[11px] text-[#424844]">Manual review needed</span>
        </div>

        {/* Overdue */}
        <div
          className={`p-3.5 rounded border space-y-1 transition-all ${
            overdueCount > 0
              ? 'bg-[#FBE3DE]/40 border-[#B83A2C]/40'
              : 'bg-[#FBFBFA] border-[#EBE8E1]'
          }`}
        >
          <span className="text-[10px] uppercase font-semibold tracking-[0.08em] text-[#B83A2C] block flex items-center justify-between">
            <span>SLA Overdue</span>
            {overdueCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[#B83A2C] animate-ping" />}
          </span>
          <div className="text-2xl font-serif font-bold text-[#B83A2C] font-mono tabular-nums">
            {overdueCount}
          </div>
          <span className="text-[11px] text-[#B83A2C]/80 font-medium">Breached SLA threshold</span>
        </div>

        {/* Escalated */}
        <div className="p-3.5 bg-[#FBFBFA] rounded border border-[#EBE8E1] space-y-1">
          <span className="text-[10px] uppercase font-semibold tracking-[0.08em] text-[#8F8C84] block">
            Escalated
          </span>
          <div className="text-2xl font-serif font-bold text-[#B83A2C] font-mono tabular-nums">
            {escalatedCount}
          </div>
          <span className="text-[11px] text-[#424844]">Supervisor triage</span>
        </div>

        {/* Avg First Response */}
        <div className="p-3.5 bg-[#FBFBFA] rounded border border-[#EBE8E1] space-y-1">
          <span className="text-[10px] uppercase font-semibold tracking-[0.08em] text-[#8F8C84] block">
            Avg 1st Response
          </span>
          <div className="text-2xl font-serif font-bold text-[#2E7D52] font-mono tabular-nums">
            {avgFirstResponse}
            <span className="text-xs font-sans text-[#424844] font-normal ml-1">hrs</span>
          </div>
          <span className="text-[11px] text-[#424844]">Target &le; 2.0h High</span>
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Category Breakdown */}
        <div className="bg-[#FBFBFA] p-4 rounded border border-[#EBE8E1] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2DFD7]">
            <h3 className="font-serif font-semibold text-sm text-[#1D1C16]">
              Requests by Category
            </h3>
            <span className="text-[10px] uppercase tracking-wider text-[#8F8C84] font-mono">
              8 Sectors
            </span>
          </div>
          <div className="space-y-2">
            {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => {
              const count = categoryCounts[catKey] || 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={catKey} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#1D1C16] font-medium">{label}</span>
                    <span className="font-mono text-[#424844] tabular-nums">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#EFECE5] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#1E3A2F] h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-[#FBFBFA] p-4 rounded border border-[#EBE8E1] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2DFD7]">
            <h3 className="font-serif font-semibold text-sm text-[#1D1C16]">
              Requests by Status
            </h3>
            <span className="text-[10px] uppercase tracking-wider text-[#8F8C84] font-mono">
              Lifecycle
            </span>
          </div>
          <div className="space-y-2.5">
            {[
              { status: 'New', color: 'bg-[#EBE8E1] text-[#424844]' },
              { status: 'Assigned', color: 'bg-[#F5F4F0] text-[#1E3A2F]' },
              { status: 'In Progress', color: 'bg-[#F4E7C5] text-[#976508]' },
              { status: 'Responded', color: 'bg-[#D8EEDF] text-[#2E7D52]' },
              { status: 'Resolved', color: 'bg-[#caeada] text-[#032017]' },
              { status: 'Escalated', color: 'bg-[#FBE3DE] text-[#B83A2C]' },
              { status: 'Closed', color: 'bg-[#dedad0] text-[#1D1C16]' },
            ].map(({ status, color }) => {
              const count = statusCounts[status] || 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={status} className="flex items-center justify-between text-xs">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${color}`}>
                    {status}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-[#EFECE5] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#2E7D52] h-full rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="font-mono text-[#1D1C16] font-semibold tabular-nums w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Open Workload by Team */}
        <div className="bg-[#FBFBFA] p-4 rounded border border-[#EBE8E1] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2DFD7]">
            <h3 className="font-serif font-semibold text-sm text-[#1D1C16]">
              Active Workload by Team
            </h3>
            <span className="text-[10px] uppercase tracking-wider text-[#8F8C84] font-mono">
              {openCount} Open
            </span>
          </div>
          {Object.keys(teamWorkload).length === 0 ? (
            <div className="text-center py-6 text-xs text-[#8F8C84]">
              No open requests in queue
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(teamWorkload)
                .sort((a, b) => b[1] - a[1])
                .map(([team, count]) => {
                  const pct = openCount > 0 ? Math.round((count / openCount) * 100) : 0;
                  return (
                    <div key={team} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#1D1C16] font-medium truncate max-w-[180px]">
                          {team}
                        </span>
                        <span className="font-mono text-[#424844] tabular-nums">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#EFECE5] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#976508] h-full rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Needs Attention Queue (Overdue / Unassigned / Escalated) */}
      <div className="bg-[#FBFBFA] rounded border border-[#EBE8E1] overflow-hidden">
        <div className="p-4 bg-[#F5F4F0] border-b border-[#E2DFD7] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B83A2C]" />
            <h2 className="font-serif font-semibold text-base text-[#1D1C16]">
              Needs Immediate Attention
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#FBE3DE] text-[#B83A2C] font-semibold">
              {needsAttention.length}
            </span>
          </div>
          <span className="text-[11px] text-[#424844]">
            Filtered for SLA breach, unassigned triage, or active supervisor escalation
          </span>
        </div>

        {needsAttention.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-[#2E7D52] mx-auto" />
            <div className="font-serif text-base text-[#1D1C16]">All queues nominal</div>
            <p className="text-xs text-[#8F8C84]">
              No tickets are currently overdue, unassigned, or escalated.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5F4F0] border-b border-[#E2DFD7] text-[11px] font-semibold tracking-[0.06em] text-[#424844] uppercase">
                  <th className="py-2.5 px-3">Ticket ID</th>
                  <th className="py-2.5 px-3">Flag</th>
                  <th className="py-2.5 px-3">Attendee</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Team / Owner</th>
                  <th className="py-2.5 px-3">Age</th>
                  <th className="py-2.5 px-3">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE8E1] text-xs">
                {needsAttention.map((req) => (
                  <tr
                    key={req.request_id}
                    onClick={() => onSelectTicket(req)}
                    className="hover:bg-[#F5F4F0] transition-colors cursor-pointer group hover:border-l-2 hover:border-l-[#1E3A2F]"
                  >
                    <td className="py-2.5 px-3 font-mono font-medium text-[#1E3A2F] group-hover:underline">
                      {req.request_id}
                    </td>
                    <td className="py-2.5 px-3">
                      {req.is_overdue ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#B83A2C] bg-[#FBE3DE] px-2 py-0.5 rounded-full uppercase">
                          <span className="w-1 h-1 rounded-full bg-[#B83A2C]" />
                          Overdue
                        </span>
                      ) : req.status === 'Escalated' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#B83A2C] bg-[#FBE3DE] px-2 py-0.5 rounded-full uppercase">
                          Escalated
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#976508] bg-[#F4E7C5] px-2 py-0.5 rounded-full uppercase">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-[#1D1C16]">{req.attendee_name}</div>
                      <div className="text-[10px] text-[#8F8C84] truncate max-w-[160px]">
                        {req.attendee_email}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-[#424844] font-medium">
                      {CATEGORY_LABELS[req.category]}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                          req.priority === 'High'
                            ? 'bg-[#FBE3DE] text-[#B83A2C]'
                            : req.priority === 'Medium'
                            ? 'bg-[#F4E7C5] text-[#976508]'
                            : 'bg-[#EFECE5] text-[#424844]'
                        }`}
                      >
                        {req.priority}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-[#1D1C16]">{req.status}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="text-[#1D1C16]">{req.team || '-'}</div>
                      <div className="text-[10px] text-[#8F8C84]">{req.owner || '(unassigned)'}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-[#424844]">
                      {req.age_hours}h
                    </td>
                    <td className="py-2.5 px-3 max-w-[280px] truncate text-[#424844]">
                      {req.summary}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
