import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowUpDown,
  RotateCcw,
  Plus,
} from 'lucide-react';
import {
  TicketRequest,
  TicketStatus,
  TicketCategory,
  TicketPriority,
  TeamName,
  ALL_STATUSES,
  ALL_TEAMS,
  CATEGORY_LABELS,
  User,
} from '../types/system';

interface TicketsViewProps {
  requests: TicketRequest[];
  onSelectTicket: (ticket: TicketRequest) => void;
  currentUser: User;
  onOpenIngestModal: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const TicketsView: React.FC<TicketsViewProps> = ({
  requests,
  onSelectTicket,
  currentUser,
  onOpenIngestModal,
  searchQuery,
  setSearchQuery,
}) => {
  const [selectedStatuses, setSelectedStatuses] = useState<TicketStatus[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<TicketCategory[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<TeamName[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<TicketPriority[]>([]);
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [onlyUnassigned, setOnlyUnassigned] = useState(false);
  const [scopeAgentTeam, setScopeAgentTeam] = useState(
    currentUser.role === 'agent' && !!currentUser.team
  );

  // Scoped requests
  const scopedRequests = useMemo(() => {
    let list = requests;
    if (scopeAgentTeam && currentUser.team) {
      list = list.filter(
        (r) => r.team === currentUser.team || r.owner === currentUser.username
      );
    }
    return list;
  }, [requests, scopeAgentTeam, currentUser]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return scopedRequests.filter((r) => {
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(r.status)) return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes(r.category)) return false;
      if (selectedTeams.length > 0 && !selectedTeams.includes(r.team)) return false;
      if (selectedPriorities.length > 0 && !selectedPriorities.includes(r.priority)) return false;
      if (onlyOverdue && !r.is_overdue) return false;
      if (onlyUnassigned && !r.is_unassigned) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          r.request_id.toLowerCase().includes(q) ||
          r.attendee_email.toLowerCase().includes(q) ||
          r.attendee_name.toLowerCase().includes(q) ||
          r.subject.toLowerCase().includes(q) ||
          r.summary.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [
    scopedRequests,
    selectedStatuses,
    selectedCategories,
    selectedTeams,
    selectedPriorities,
    onlyOverdue,
    onlyUnassigned,
    searchQuery,
  ]);

  const resetFilters = () => {
    setSelectedStatuses([]);
    setSelectedCategories([]);
    setSelectedTeams([]);
    setSelectedPriorities([]);
    setOnlyOverdue(false);
    setOnlyUnassigned(false);
    setSearchQuery('');
  };

  const hasActiveFilters =
    selectedStatuses.length > 0 ||
    selectedCategories.length > 0 ||
    selectedTeams.length > 0 ||
    selectedPriorities.length > 0 ||
    onlyOverdue ||
    onlyUnassigned ||
    searchQuery.trim() !== '';

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-[#EBE8E1]">
        <div>
          <h1 className="font-serif font-semibold text-2xl md:text-3xl text-[#1D1C16] tracking-tight">
            Ticket Queue & Triage
          </h1>
          <p className="text-xs md:text-sm text-[#424844] mt-1">
            Incoming attendee transmissions, team assignments, and SLA response tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser.role === 'agent' && currentUser.team && (
            <button
              onClick={() => setScopeAgentTeam(!scopeAgentTeam)}
              className={`px-3 py-1.5 text-xs font-semibold rounded border transition-colors ${
                scopeAgentTeam
                  ? 'bg-[#1E3A2F] text-[#FBFBFA] border-[#152A20]'
                  : 'bg-white text-[#1E3A2F] border-[#E2DFD7] hover:bg-[#F5F4F0]'
              }`}
            >
              {scopeAgentTeam ? `Scoped: ${currentUser.team}` : 'All Summit Teams'}
            </button>
          )}

          <button
            onClick={onOpenIngestModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#FBFBFA] bg-[#1E3A2F] border border-[#152A20] rounded hover:bg-[#2E7D52] shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Simulate Incoming Email</span>
          </button>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-[#FBFBFA] p-3.5 rounded border border-[#EBE8E1] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Status filter */}
          <div>
            <label className="block text-[10px] uppercase font-semibold tracking-[0.08em] text-[#8F8C84] mb-1">
              Status Filter
            </label>
            <select
              value={selectedStatuses[0] || ''}
              onChange={(e) =>
                setSelectedStatuses(e.target.value ? [e.target.value as TicketStatus] : [])
              }
              className="w-full text-xs bg-[#F5F4F0] border border-[#E2DFD7] rounded px-2.5 py-1.5 text-[#1D1C16] focus:outline-none focus:border-[#1E3A2F]"
            >
              <option value="">All Statuses ({ALL_STATUSES.length})</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Category filter */}
          <div>
            <label className="block text-[10px] uppercase font-semibold tracking-[0.08em] text-[#8F8C84] mb-1">
              Category
            </label>
            <select
              value={selectedCategories[0] || ''}
              onChange={(e) =>
                setSelectedCategories(e.target.value ? [e.target.value as TicketCategory] : [])
              }
              className="w-full text-xs bg-[#F5F4F0] border border-[#E2DFD7] rounded px-2.5 py-1.5 text-[#1D1C16] focus:outline-none focus:border-[#1E3A2F]"
            >
              <option value="">All Categories (8)</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Team filter */}
          <div>
            <label className="block text-[10px] uppercase font-semibold tracking-[0.08em] text-[#8F8C84] mb-1">
              Operational Team
            </label>
            <select
              value={selectedTeams[0] || ''}
              onChange={(e) =>
                setSelectedTeams(e.target.value ? [e.target.value as TeamName] : [])
              }
              className="w-full text-xs bg-[#F5F4F0] border border-[#E2DFD7] rounded px-2.5 py-1.5 text-[#1D1C16] focus:outline-none focus:border-[#1E3A2F]"
            >
              <option value="">All Teams ({ALL_TEAMS.length})</option>
              {ALL_TEAMS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Priority filter */}
          <div>
            <label className="block text-[10px] uppercase font-semibold tracking-[0.08em] text-[#8F8C84] mb-1">
              SLA Priority
            </label>
            <select
              value={selectedPriorities[0] || ''}
              onChange={(e) =>
                setSelectedPriorities(e.target.value ? [e.target.value as TicketPriority] : [])
              }
              className="w-full text-xs bg-[#F5F4F0] border border-[#E2DFD7] rounded px-2.5 py-1.5 text-[#1D1C16] focus:outline-none focus:border-[#1E3A2F]"
            >
              <option value="">All Priorities</option>
              <option value="High">High (&le; 2h SLA)</option>
              <option value="Medium">Medium (&le; 8h SLA)</option>
              <option value="Low">Low (&le; 24h SLA)</option>
            </select>
          </div>
        </div>

        {/* Checkbox Toggles & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#EBE8E1] text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 cursor-pointer font-medium text-[#1D1C16]">
              <input
                type="checkbox"
                checked={onlyOverdue}
                onChange={(e) => setOnlyOverdue(e.target.checked)}
                className="rounded border-[#E2DFD7] text-[#B83A2C] focus:ring-0 cursor-pointer"
              />
              <span className="text-[#B83A2C] font-semibold">🔴 Overdue Only</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer font-medium text-[#1D1C16]">
              <input
                type="checkbox"
                checked={onlyUnassigned}
                onChange={(e) => setOnlyUnassigned(e.target.checked)}
                className="rounded border-[#E2DFD7] text-[#976508] focus:ring-0 cursor-pointer"
              />
              <span>Unassigned Only</span>
            </label>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-[11px] text-[#8F8C84] hover:text-[#1D1C16] underline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          <div className="text-[11px] font-mono text-[#8F8C84] tabular-nums">
            Showing <strong className="text-[#1D1C16]">{filteredRequests.length}</strong> of{' '}
            {requests.length} total tickets
          </div>
        </div>
      </div>

      {/* Ticket Data Grid */}
      <div className="bg-[#FBFBFA] rounded border border-[#EBE8E1] overflow-hidden shadow-xs">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Filter className="w-8 h-8 text-[#8F8C84] mx-auto" />
            <div className="font-serif text-lg text-[#1D1C16]">No matching tickets found</div>
            <p className="text-xs text-[#8F8C84] max-w-md mx-auto">
              Try adjusting your search query, clearing filters, or simulate a new attendee email
              transmission.
            </p>
            <button
              onClick={resetFilters}
              className="mt-2 px-3 py-1 text-xs font-medium border border-[#E2DFD7] rounded text-[#1E3A2F] hover:bg-[#F5F4F0]"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5F4F0] border-b border-[#E2DFD7] text-[11px] font-semibold tracking-[0.06em] text-[#424844] uppercase select-none">
                  <th className="py-2.5 px-3">Ticket ID</th>
                  <th className="py-2.5 px-3">Flag / SLA</th>
                  <th className="py-2.5 px-3">Attendee</th>
                  <th className="py-2.5 px-3">Subject & Summary</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Assigned Team</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Age</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE8E1] text-xs">
                {filteredRequests.map((req) => {
                  return (
                    <tr
                      key={req.request_id}
                      onClick={() => onSelectTicket(req)}
                      className="hover:bg-[#F5F4F0] transition-colors cursor-pointer group hover:border-l-2 hover:border-l-[#1E3A2F]"
                    >
                      <td className="py-2.5 px-3 font-mono font-medium text-[#1E3A2F] group-hover:underline whitespace-nowrap">
                        {req.request_id}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {req.is_overdue ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#B83A2C] bg-[#FBE3DE] px-2 py-0.5 rounded-full uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#B83A2C]" />
                            Overdue
                          </span>
                        ) : req.status === 'Escalated' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#B83A2C] bg-[#FBE3DE] px-2 py-0.5 rounded-full uppercase">
                            Escalated
                          </span>
                        ) : req.is_unassigned ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#976508] bg-[#F4E7C5] px-2 py-0.5 rounded-full uppercase">
                            Unassigned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#2E7D52] bg-[#D8EEDF] px-2 py-0.5 rounded-full uppercase">
                            <span className="w-1 h-1 rounded-full bg-[#2E7D52]" />
                            Nominal
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-[#1D1C16] truncate max-w-[150px]">
                          {req.attendee_name}
                        </div>
                        <div className="text-[10px] text-[#8F8C84] truncate max-w-[150px]">
                          {req.attendee_email}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 max-w-[300px]">
                        <div className="font-medium text-[#1D1C16] truncate">
                          {req.subject}
                        </div>
                        <div className="text-[11px] text-[#8F8C84] truncate">
                          {req.summary}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-[#424844] font-medium whitespace-nowrap">
                        {CATEGORY_LABELS[req.category]}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
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
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                            req.status === 'Resolved'
                              ? 'bg-[#D8EEDF] text-[#2E7D52]'
                              : req.status === 'Responded'
                              ? 'bg-[#D8EEDF]/70 text-[#2E7D52]'
                              : req.status === 'Escalated'
                              ? 'bg-[#FBE3DE] text-[#B83A2C]'
                              : req.status === 'In Progress'
                              ? 'bg-[#F4E7C5] text-[#976508]'
                              : req.status === 'Assigned'
                              ? 'bg-[#F5F4F0] text-[#1E3A2F] border border-[#E2DFD7]'
                              : 'bg-[#EBE8E1] text-[#424844]'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#1D1C16] whitespace-nowrap">
                        {req.team || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-[#424844] font-mono text-[11px] whitespace-nowrap">
                        {req.owner || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-[#424844] whitespace-nowrap">
                        {req.age_hours}h
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
