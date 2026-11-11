import React, { useState } from 'react';
import { Users, Mail, Clock, ArrowRight, Search, FileText } from 'lucide-react';
import { Attendee, TicketRequest, CATEGORY_LABELS } from '../types/system';

interface AttendeesViewProps {
  attendees: Attendee[];
  requests: TicketRequest[];
  onSelectTicket: (ticket: TicketRequest) => void;
}

export const AttendeesView: React.FC<AttendeesViewProps> = ({
  attendees,
  requests,
  onSelectTicket,
}) => {
  const [search, setSearch] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  const filtered = attendees.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
  });

  const attendeeHistory = selectedEmail
    ? requests.filter((r) => r.attendee_email.toLowerCase() === selectedEmail.toLowerCase())
    : [];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-[#EBE8E1]">
        <div>
          <h1 className="font-serif font-semibold text-2xl md:text-3xl text-[#1D1C16] tracking-tight">
            Attendee & Delegation Directory
          </h1>
          <p className="text-xs md:text-sm text-[#424844] mt-1">
            Delegate communication history, lifetime ticket volume, and active open inquiries.
          </p>
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-[#8F8C84] absolute left-2.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search attendee or domain..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FBFBFA] border border-[#E2DFD7] rounded text-[#1D1C16] focus:outline-none focus:border-[#1E3A2F]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendees List */}
        <div className="lg:col-span-2 bg-[#FBFBFA] rounded border border-[#EBE8E1] overflow-hidden">
          <div className="p-3.5 bg-[#F5F4F0] border-b border-[#E2DFD7] flex items-center justify-between text-xs">
            <span className="font-semibold text-[#1D1C16] uppercase tracking-wider text-[11px]">
              Registered Delegates ({filtered.length})
            </span>
            <span className="text-[#8F8C84] text-[11px]">Click delegate to inspect history</span>
          </div>

          <div className="overflow-x-auto max-h-[620px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-[#F5F4F0] border-b border-[#E2DFD7] text-[10px] uppercase font-semibold text-[#424844] tracking-wider z-10">
                <tr>
                  <th className="py-2 px-3">Delegate Name</th>
                  <th className="py-2 px-3">Email Address</th>
                  <th className="py-2 px-3 text-center">Total</th>
                  <th className="py-2 px-3 text-center">Open</th>
                  <th className="py-2 px-3">Last Request</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE8E1]">
                {filtered.map((att) => {
                  const isSelected = selectedEmail === att.email;
                  return (
                    <tr
                      key={att.email}
                      onClick={() => setSelectedEmail(att.email)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#EFECE5] font-medium border-l-2 border-l-[#1E3A2F]'
                          : 'hover:bg-[#F5F4F0]'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-[#1D1C16] font-medium">{att.name}</td>
                      <td className="py-2.5 px-3 text-[#424844] font-mono text-[11px] truncate max-w-[200px]">
                        {att.email}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono tabular-nums font-semibold text-[#1D1C16]">
                        {att.total_requests || 0}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {(att.open_requests || 0) > 0 ? (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#FBE3DE] text-[#B83A2C]">
                            {att.open_requests}
                          </span>
                        ) : (
                          <span className="text-[#8F8C84] font-mono text-[11px]">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#8F8C84] whitespace-nowrap">
                        {new Date(att.last_request || att.first_seen).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Drilldown History Card */}
        <div className="bg-[#FBFBFA] rounded border border-[#EBE8E1] p-4 flex flex-col h-full min-h-[400px]">
          <div className="pb-3 border-b border-[#E2DFD7]">
            <h3 className="font-serif font-semibold text-base text-[#1D1C16]">
              Delegate Dossier
            </h3>
            <p className="text-[11px] text-[#8F8C84] mt-0.5">
              {selectedEmail ? selectedEmail : 'Select a delegate from the left list'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto pt-3 space-y-3">
            {!selectedEmail ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#8F8C84] space-y-2">
                <Users className="w-8 h-8 text-[#dedad0]" />
                <span className="text-xs">No delegate selected</span>
              </div>
            ) : attendeeHistory.length === 0 ? (
              <div className="text-xs text-[#8F8C84] p-4 text-center">
                No tickets on record for this email.
              </div>
            ) : (
              <div className="space-y-2.5">
                {attendeeHistory.map((req) => (
                  <div
                    key={req.request_id}
                    onClick={() => onSelectTicket(req)}
                    className="p-3 rounded border border-[#E2DFD7] bg-[#F5F4F0] hover:bg-white transition-colors cursor-pointer space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-[#1E3A2F] group-hover:underline">
                        {req.request_id}
                      </span>
                      <span
                        className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                          req.status === 'Resolved'
                            ? 'bg-[#D8EEDF] text-[#2E7D52]'
                            : req.status === 'Escalated'
                            ? 'bg-[#FBE3DE] text-[#B83A2C]'
                            : 'bg-white text-[#424844] border'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <div className="font-medium text-xs text-[#1D1C16] truncate">
                      {req.subject}
                    </div>

                    <div className="text-[11px] text-[#8F8C84] line-clamp-2">
                      {req.summary}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#424844] pt-1 border-t border-black/5 font-mono">
                      <span>{CATEGORY_LABELS[req.category]}</span>
                      <span>{new Date(req.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
