import React, { useState } from 'react';
import {
  X,
  Send,
  StickyNote,
  UserCheck,
  AlertOctagon,
  Clock,
  ShieldCheck,
  Copy,
  Check,
  MessageSquare,
  History,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  TicketRequest,
  TicketMessage,
  StatusHistoryEntry,
  User,
  TeamName,
  TicketStatus,
  ALL_TEAMS,
  ALL_STATUSES,
  CATEGORY_LABELS,
} from '../types/system';

interface TicketDetailDrawerProps {
  ticket: TicketRequest | null;
  messages: TicketMessage[];
  statusHistory: StatusHistoryEntry[];
  currentUser: User;
  allUsers: User[];
  onClose: () => void;
  onSendReply: (requestId: string, text: string) => void;
  onAddNote: (requestId: string, text: string) => void;
  onAssign: (requestId: string, team: TeamName, owner: string | null) => void;
  onUpdateStatus: (requestId: string, status: TicketStatus) => void;
  onEscalate: (requestId: string, reason: string) => void;
}

export const TicketDetailDrawer: React.FC<TicketDetailDrawerProps> = ({
  ticket,
  messages,
  statusHistory,
  currentUser,
  allUsers,
  onClose,
  onSendReply,
  onAddNote,
  onAssign,
  onUpdateStatus,
  onEscalate,
}) => {
  const [activeTab, setActiveTab] = useState<'conversation' | 'actions' | 'history' | 'raw'>(
    'conversation'
  );
  const [replyText, setReplyText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<TeamName>(ticket?.team || 'General Support');
  const [selectedOwner, setSelectedOwner] = useState<string>(ticket?.owner || '');
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus>(ticket?.status || 'In Progress');
  const [escalateReason, setEscalateReason] = useState('');
  const [copied, setCopied] = useState(false);

  if (!ticket) return null;

  const canWork = ['admin', 'lead', 'agent'].includes(currentUser.role);
  const canAssign = ['admin', 'lead'].includes(currentUser.role);

  const availableOwners = allUsers.filter(
    (u) => u.active && (u.team === selectedTeam || u.role === 'admin' || u.role === 'lead')
  );

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onSendReply(ticket.request_id, replyText.trim());
    setReplyText('');
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    onAddNote(ticket.request_id, noteText.trim());
    setNoteText('');
  };

  const handleSaveAssignment = () => {
    onAssign(ticket.request_id, selectedTeam, selectedOwner ? selectedOwner : null);
  };

  const handleAssignToMe = () => {
    const team = currentUser.team || ticket.team || 'General Support';
    onAssign(ticket.request_id, team, currentUser.username);
  };

  const handleUpdateStatus = () => {
    onUpdateStatus(ticket.request_id, selectedStatus);
  };

  const handleEscalate = () => {
    onEscalate(
      ticket.request_id,
      escalateReason.trim() || 'Manual escalation by operative'
    );
    setEscalateReason('');
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(ticket, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#07241A]/35 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Slide-Over Inspection Drawer */}
      <div
        className="relative w-full max-w-[500px] bg-[#FBFBFA] h-full flex flex-col z-10 border-l border-[#E2DFD7] text-[#1D1C16]"
        style={{
          boxShadow:
            '-8px 0 24px -4px rgba(21, 42, 32, 0.12), -2px 0 6px -1px rgba(21, 42, 32, 0.06)',
        }}
      >
        {/* Drawer Header */}
        <div className="p-4 md:p-5 border-b border-[#EBE8E1] bg-[#F5F4F0] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-semibold text-[#1E3A2F] bg-[#EFECE5] px-2 py-0.5 rounded border border-[#E2DFD7]">
                {ticket.request_id}
              </span>
              <span className="text-[11px] text-[#8F8C84] font-mono tabular-nums">
                Age: {ticket.age_hours}h · SLA: {ticket.sla_hours}h
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded text-[#8F8C84] hover:text-[#1D1C16] hover:bg-[#EBE8E1] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h2 className="font-serif font-semibold text-lg text-[#1D1C16] leading-snug">
            {ticket.subject}
          </h2>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                  ticket.status === 'Resolved'
                    ? 'bg-[#D8EEDF] text-[#2E7D52]'
                    : ticket.status === 'Responded'
                    ? 'bg-[#D8EEDF]/80 text-[#2E7D52]'
                    : ticket.status === 'Escalated'
                    ? 'bg-[#FBE3DE] text-[#B83A2C]'
                    : ticket.status === 'In Progress'
                    ? 'bg-[#F4E7C5] text-[#976508]'
                    : 'bg-[#F5F4F0] text-[#1E3A2F] border border-[#E2DFD7]'
                }`}
              >
                {ticket.status}
              </span>
              <span
                className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                  ticket.priority === 'High'
                    ? 'bg-[#FBE3DE] text-[#B83A2C]'
                    : ticket.priority === 'Medium'
                    ? 'bg-[#F4E7C5] text-[#976508]'
                    : 'bg-[#EFECE5] text-[#424844]'
                }`}
              >
                {ticket.priority} Priority
              </span>
            </div>

            <div className="text-[11px] text-[#424844]">
              {CATEGORY_LABELS[ticket.category]}
            </div>
          </div>

          {/* Attendee Info Strip */}
          <div className="bg-[#FBFBFA] px-3 py-2 rounded border border-[#E2DFD7] flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-[#1D1C16]">{ticket.attendee_name}</span>
              <span className="text-[#8F8C84] ml-1.5 font-mono text-[11px]">
                &lt;{ticket.attendee_email}&gt;
              </span>
            </div>
          </div>

          {/* AI Summary Banner */}
          <div className="bg-[#EFECE5] p-2.5 rounded border border-[#E2DFD7] text-xs space-y-1">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[#1E3A2F]">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#2E7D52]" />
                <span>AI Ingestion Summary</span>
              </span>
              <span className="font-mono text-[#8F8C84]">
                Confidence {(ticket.confidence || 0).toFixed(2)}
              </span>
            </div>
            <p className="text-[#1D1C16] text-[12px] leading-relaxed">
              {ticket.summary}
            </p>
          </div>

          {/* Escalation Warning (if applicable) */}
          {ticket.status === 'Escalated' && ticket.escalation_reason && (
            <div className="bg-[#FBE3DE] p-2.5 rounded border border-[#B83A2C]/30 text-xs text-[#B83A2C] flex items-start gap-2">
              <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Escalated Ticket:</strong>
                <span>{ticket.escalation_reason}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#EBE8E1] bg-[#FBFBFA] px-4 pt-2 gap-4 text-xs font-semibold uppercase tracking-[0.06em]">
          <button
            onClick={() => setActiveTab('conversation')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'conversation'
                ? 'border-[#1E3A2F] text-[#1E3A2F]'
                : 'border-transparent text-[#8F8C84] hover:text-[#1D1C16]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Thread ({messages.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'actions'
                ? 'border-[#1E3A2F] text-[#1E3A2F]'
                : 'border-transparent text-[#8F8C84] hover:text-[#1D1C16]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Actions & Triage</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-[#1E3A2F] text-[#1E3A2F]'
                : 'border-transparent text-[#8F8C84] hover:text-[#1D1C16]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'raw'
                ? 'border-[#1E3A2F] text-[#1E3A2F]'
                : 'border-transparent text-[#8F8C84] hover:text-[#1D1C16]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Payload</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
          {/* TAB 1: CONVERSATION */}
          {activeTab === 'conversation' && (
            <div className="space-y-4">
              <div className="space-y-3">
                {messages.map((msg) => {
                  const isIn = msg.direction === 'in';
                  const isNote = msg.direction === 'note';
                  return (
                    <div
                      key={msg.id}
                      className={`p-3 rounded border text-xs leading-relaxed ${
                        isIn
                          ? 'bg-white border-[#E2DFD7] text-[#1D1C16]'
                          : isNote
                          ? 'bg-[#F4E7C5]/30 border-[#976508]/40 text-[#424844]'
                          : 'bg-[#F5F4F0] border-[#E2DFD7] text-[#1D1C16]'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-black/5 text-[10px]">
                        <span className="font-semibold text-[#1E3A2F]">
                          {isIn
                            ? `Incoming from ${msg.sender}`
                            : isNote
                            ? `📝 Internal Note by ${msg.sender}`
                            : `Outgoing from Event Desk (${msg.sender})`}
                        </span>
                        <span className="font-mono text-[#8F8C84] tabular-nums">
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap">{msg.body}</div>
                    </div>
                  );
                })}
              </div>

              {/* Inline Quick Reply */}
              {canWork && (
                <form
                  onSubmit={handleSendReply}
                  className="pt-3 border-t border-[#EBE8E1] space-y-2 bg-[#F5F4F0] p-3 rounded border"
                >
                  <label className="block text-[10px] uppercase font-semibold tracking-[0.08em] text-[#8F8C84]">
                    Fast Reply to Attendee (Auto-threads via [{ticket.request_id}])
                  </label>
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Compose official email response..."
                    className="w-full p-2 text-xs bg-white border border-[#E2DFD7] rounded focus:outline-none focus:border-[#1E3A2F]"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!replyText.trim()}
                      className="px-3 py-1.5 text-xs font-semibold bg-[#1E3A2F] text-[#FBFBFA] rounded hover:bg-[#2E7D52] disabled:opacity-50 transition-colors flex items-center gap-1.5"
                    >
                      <Send className="w-3 h-3" />
                      <span>Send Official Reply</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: ACTIONS & TRIAGE */}
          {activeTab === 'actions' && (
            <div className="space-y-5 text-xs">
              {!canWork ? (
                <div className="p-4 bg-[#F5F4F0] border border-[#E2DFD7] rounded text-center text-[#8F8C84]">
                  Your role ({currentUser.role}) has read-only access.
                </div>
              ) : (
                <>
                  {/* Send Email Reply */}
                  <div className="bg-[#F5F4F0] p-3.5 rounded border border-[#E2DFD7] space-y-2.5">
                    <h4 className="font-serif font-semibold text-sm text-[#1D1C16]">
                      1. Reply to Attendee
                    </h4>
                    <textarea
                      rows={4}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type response. Automatically signs with event credentials and marks ticket Responded..."
                      className="w-full p-2.5 text-xs bg-white border border-[#E2DFD7] rounded focus:outline-none focus:border-[#1E3A2F]"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleSendReply}
                        disabled={!replyText.trim()}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-[#1E3A2F] text-[#FBFBFA] rounded hover:bg-[#2E7D52] disabled:opacity-50 transition-colors flex items-center gap-1.5"
                      >
                        <Send className="w-3 h-3" />
                        <span>Send Official Reply</span>
                      </button>
                    </div>
                  </div>

                  {/* Internal Operational Note */}
                  <div className="bg-[#F5F4F0] p-3.5 rounded border border-[#E2DFD7] space-y-2.5">
                    <h4 className="font-serif font-semibold text-sm text-[#1D1C16]">
                      2. Internal Dispatch Note
                    </h4>
                    <p className="text-[11px] text-[#8F8C84]">
                      Internal notes are private to staff and recorded in the audit log.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add internal note or handover memo..."
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#E2DFD7] rounded focus:outline-none focus:border-[#1E3A2F]"
                      />
                      <button
                        onClick={handleAddNote}
                        disabled={!noteText.trim()}
                        className="px-3 py-1.5 text-xs font-semibold bg-white border border-[#E2DFD7] text-[#1E3A2F] hover:bg-[#EFECE5] rounded disabled:opacity-50 transition-colors"
                      >
                        Add Note
                      </button>
                    </div>
                  </div>

                  {/* Assignment Control */}
                  <div className="bg-[#F5F4F0] p-3.5 rounded border border-[#E2DFD7] space-y-2.5">
                    <h4 className="font-serif font-semibold text-sm text-[#1D1C16]">
                      3. Operational Assignment
                    </h4>
                    {canAssign ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-[#8F8C84] uppercase font-semibold mb-1">
                              Team
                            </label>
                            <select
                              value={selectedTeam}
                              onChange={(e) => setSelectedTeam(e.target.value as TeamName)}
                              className="w-full text-xs bg-white border border-[#E2DFD7] rounded p-1.5 focus:outline-none"
                            >
                              {ALL_TEAMS.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-[#8F8C84] uppercase font-semibold mb-1">
                              Owner
                            </label>
                            <select
                              value={selectedOwner}
                              onChange={(e) => setSelectedOwner(e.target.value)}
                              className="w-full text-xs bg-white border border-[#E2DFD7] rounded p-1.5 focus:outline-none"
                            >
                              <option value="">(None / Unassigned)</option>
                              {availableOwners.map((u) => (
                                <option key={u.id} value={u.username}>
                                  {u.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={handleSaveAssignment}
                            className="px-3 py-1.5 text-xs font-semibold bg-[#1E3A2F] text-[#FBFBFA] rounded hover:bg-[#2E7D52] transition-colors"
                          >
                            Save Assignment
                          </button>
                          <button
                            onClick={handleAssignToMe}
                            className="px-3 py-1.5 text-xs font-medium border border-[#E2DFD7] rounded bg-white hover:bg-[#F5F4F0]"
                          >
                            Assign to Me
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[#8F8C84]">Assigned:</span>{' '}
                          <span className="font-medium">{ticket.team}</span> (
                          {ticket.owner || 'unassigned'})
                        </div>
                        <button
                          onClick={handleAssignToMe}
                          className="px-2.5 py-1 text-xs font-semibold bg-[#1E3A2F] text-[#FBFBFA] rounded"
                        >
                          Claim Ticket
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Lifecycle Status Updater */}
                  <div className="bg-[#F5F4F0] p-3.5 rounded border border-[#E2DFD7] space-y-2.5">
                    <h4 className="font-serif font-semibold text-sm text-[#1D1C16]">
                      4. Lifecycle Status
                    </h4>
                    <div className="flex gap-2">
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value as TicketStatus)}
                        className="flex-1 text-xs bg-white border border-[#E2DFD7] rounded p-1.5 focus:outline-none"
                      >
                        {ALL_STATUSES.filter((s) => s !== 'Escalated').map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleUpdateStatus}
                        className="px-3 py-1.5 text-xs font-semibold bg-[#1E3A2F] text-[#FBFBFA] rounded hover:bg-[#2E7D52] transition-colors"
                      >
                        Set Status
                      </button>
                    </div>
                  </div>

                  {/* Manual SLA Escalation */}
                  <div className="bg-[#FBE3DE]/30 p-3.5 rounded border border-[#B83A2C]/30 space-y-2.5">
                    <h4 className="font-serif font-semibold text-sm text-[#B83A2C] flex items-center gap-1.5">
                      <AlertOctagon className="w-4 h-4" />
                      <span>5. Escalate to Operations Command</span>
                    </h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={escalateReason}
                        onChange={(e) => setEscalateReason(e.target.value)}
                        placeholder="Reason for immediate escalation..."
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#B83A2C]/40 rounded focus:outline-none"
                      />
                      <button
                        onClick={handleEscalate}
                        className="px-3 py-1.5 text-xs font-semibold bg-[#B83A2C] text-white rounded hover:bg-[#93000a] transition-colors"
                      >
                        Escalate
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: STATUS HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="text-[10px] uppercase font-semibold tracking-[0.08em] text-[#8F8C84]">
                Audit Trail & State Transitions
              </div>

              {statusHistory.length === 0 ? (
                <div className="text-xs text-[#8F8C84] p-4 text-center">
                  No status transitions logged yet.
                </div>
              ) : (
                <div className="space-y-2 relative before:absolute before:inset-0 before:left-2 before:w-0.5 before:bg-[#E2DFD7]">
                  {statusHistory.map((h) => (
                    <div key={h.id} className="relative pl-6">
                      <div className="absolute left-1 top-2 w-2 h-2 rounded-full bg-[#1E3A2F] border-2 border-white" />
                      <div className="bg-[#F5F4F0] p-2.5 rounded border border-[#E2DFD7] text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-[#1D1C16]">
                            {h.old_status ? `${h.old_status} → ${h.new_status}` : `Created as ${h.new_status}`}
                          </span>
                          <span className="font-mono text-[#8F8C84] text-[10px] tabular-nums">
                            {new Date(h.changed_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#424844] font-mono">
                          Changed by: {h.changed_by}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RAW PAYLOAD */}
          {activeTab === 'raw' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-semibold tracking-[0.08em] text-[#8F8C84]">
                  SQLite JSON Record
                </span>
                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1 text-[11px] font-medium text-[#1E3A2F] hover:text-[#2E7D52]"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#2E7D52]" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>

              <div
                className="bg-[#122219] p-3.5 rounded text-[#D8EEDF] font-mono text-[11px] leading-relaxed overflow-x-auto border border-[#07241A]"
                style={{ boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.4)' }}
              >
                <pre>{JSON.stringify(ticket, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-[#EBE8E1] bg-[#F5F4F0] flex items-center justify-between text-xs">
          <span className="text-[#8F8C84] text-[11px] font-mono">
            {ticket.request_id} · {ticket.attendee_email}
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 font-medium text-[#1E3A2F] border border-[#E2DFD7] rounded hover:bg-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
