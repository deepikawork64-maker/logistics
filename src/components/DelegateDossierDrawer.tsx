import React, { useState } from 'react';
import {
  X,
  Mail,
  Send,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Clock,
  Building,
  User,
  Phone,
  Tag,
  MessageSquare,
  AlertOctagon,
  ExternalLink,
} from 'lucide-react';
import { Delegate, RsvpStatus } from '../types/inviteOps';

interface DelegateDossierDrawerProps {
  delegate: Delegate | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: RsvpStatus, note?: string) => void;
  onSendDirectEmail: (toEmail: string, subject: string, body: string) => void;
}

export const DelegateDossierDrawer: React.FC<DelegateDossierDrawerProps> = ({
  delegate,
  onClose,
  onUpdateStatus,
  onSendDirectEmail,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'form' | 'emails'>('profile');
  const [directSubject, setDirectSubject] = useState('');
  const [directBody, setDirectBody] = useState('');
  const [staffNote, setStaffNote] = useState('');

  if (!delegate) return null;

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directSubject.trim() || !directBody.trim()) return;
    onSendDirectEmail(delegate.email, directSubject.trim(), directBody.trim());
    setDirectSubject('');
    setDirectBody('');
    setActiveTab('emails');
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffNote.trim()) return;
    onUpdateStatus(delegate.id, delegate.status, staffNote.trim());
    setStaffNote('');
  };

  const isConfirmed = delegate.status === 'Confirmed (Attending)';
  const isDeclined = delegate.status === 'Declined';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-[#07241A]/35 backdrop-blur-xs" onClick={onClose} />

      {/* Drawer */}
      <div
        className="relative w-full max-w-[500px] bg-[#FBFBFA] h-full flex flex-col z-10 border-l border-[#E2DFD7] text-[#1D1C16]"
        style={{
          boxShadow:
            '-8px 0 24px -4px rgba(21, 42, 32, 0.12), -2px 0 6px -1px rgba(21, 42, 32, 0.06)',
        }}
      >
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-[#EBE8E1] bg-[#F5F4F0] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-[#EFECE5] text-[#1E3A2F] border border-[#E2DFD7]">
              {delegate.tier}
            </span>
            <button onClick={onClose} className="p-1 rounded text-[#8F8C84] hover:text-[#1D1C16]">
              <X className="w-4 h-4" />
            </button>
          </div>

          <h2 className="font-serif font-semibold text-xl text-[#1D1C16] leading-snug">
            {delegate.name}
          </h2>

          <div className="text-xs text-[#424844]">
            {delegate.organization ? (
              <span>
                {delegate.organization}
                {delegate.designation ? ` · ${delegate.designation}` : ''}
              </span>
            ) : (
              'Organization not specified'
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                isConfirmed
                  ? 'bg-[#D8EEDF] text-[#2E7D52]'
                  : isDeclined
                  ? 'bg-[#FBE3DE] text-[#B83A2C]'
                  : 'bg-white text-[#1E3A2F] border border-[#E2DFD7]'
              }`}
            >
              {isConfirmed && <CheckCircle2 className="w-3 h-3" />}
              {isDeclined && <XCircle className="w-3 h-3" />}
              <span>{delegate.status}</span>
            </span>

            <span className="text-[11px] text-[#8F8C84] font-mono">
              Source: {delegate.sourceDocName || 'Direct Upload'}
            </span>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="flex border-b border-[#EBE8E1] bg-[#FBFBFA] px-4 pt-2 gap-4 text-xs font-semibold uppercase tracking-[0.06em]">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 transition-colors border-b-2 ${
              activeTab === 'profile'
                ? 'border-[#1E3A2F] text-[#1E3A2F]'
                : 'border-transparent text-[#8F8C84] hover:text-[#1D1C16]'
            }`}
          >
            Profile & Contact
          </button>
          <button
            onClick={() => setActiveTab('form')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'form'
                ? 'border-[#1E3A2F] text-[#1E3A2F]'
                : 'border-transparent text-[#8F8C84] hover:text-[#1D1C16]'
            }`}
          >
            <span>Google Form</span>
            {delegate.formData && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D52]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('emails')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'emails'
                ? 'border-[#1E3A2F] text-[#1E3A2F]'
                : 'border-transparent text-[#8F8C84] hover:text-[#1D1C16]'
            }`}
          >
            <span>Email History</span>
            <span className="text-[10px] font-mono px-1 rounded bg-[#EFECE5]">
              {delegate.interactions.length}
            </span>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
          {/* TAB 1: PROFILE & CONTACT */}
          {activeTab === 'profile' && (
            <div className="space-y-4 text-xs">
              <div className="bg-[#F5F4F0] p-3 rounded border border-[#E2DFD7] space-y-2">
                <div className="text-[10px] uppercase font-semibold text-[#8F8C84]">
                  Contact Coordinates
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#1E3A2F]" />
                    <span className="font-mono text-[#1D1C16] font-medium">{delegate.email}</span>
                  </div>
                  {delegate.phone && (
                    <div className="flex items-center gap-2 text-[#424844]">
                      <Phone className="w-3.5 h-3.5 text-[#8F8C84]" />
                      <span>{delegate.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Override */}
              <div className="p-3 bg-[#FBFBFA] rounded border border-[#E2DFD7] space-y-2">
                <div className="text-[10px] uppercase font-semibold text-[#8F8C84]">
                  Manual RSVP Status Override
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onUpdateStatus(delegate.id, 'Confirmed (Attending)')}
                    className="px-3 py-1 font-semibold rounded bg-[#D8EEDF] text-[#2E7D52] hover:bg-[#c2e4cc] border border-[#2E7D52]/40"
                  >
                    Mark Confirmed
                  </button>
                  <button
                    onClick={() => onUpdateStatus(delegate.id, 'Declined')}
                    className="px-3 py-1 font-semibold rounded bg-[#FBE3DE] text-[#B83A2C] hover:bg-[#fad0c7] border border-[#B83A2C]/40"
                  >
                    Mark Declined
                  </button>
                  <button
                    onClick={() => onUpdateStatus(delegate.id, 'Needs Follow-up')}
                    className="px-3 py-1 font-medium rounded border border-[#E2DFD7] bg-white text-[#424844] hover:bg-[#F5F4F0]"
                  >
                    Needs Follow-up
                  </button>
                </div>
              </div>

              {/* Staff Notes */}
              <div className="space-y-2">
                <div className="text-[10px] uppercase font-semibold text-[#8F8C84]">
                  Internal Operational Notes
                </div>
                {delegate.notes && (
                  <p className="bg-[#EFECE5] p-2.5 rounded text-xs text-[#1D1C16] whitespace-pre-wrap border border-[#E2DFD7]">
                    {delegate.notes}
                  </p>
                )}
                <form onSubmit={handleSaveNote} className="flex gap-2">
                  <input
                    type="text"
                    value={staffNote}
                    onChange={(e) => setStaffNote(e.target.value)}
                    placeholder="Append staff memo..."
                    className="flex-1 p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-[#1E3A2F] text-[#FBFBFA] rounded font-semibold hover:bg-[#2E7D52]"
                  >
                    Save
                  </button>
                </form>
              </div>

              {/* Tags */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] uppercase font-semibold text-[#8F8C84]">Tags</div>
                <div className="flex flex-wrap gap-1.5">
                  {delegate.tags.map((t, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[10px] bg-[#F5F4F0] border border-[#E2DFD7] text-[#424844]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE FORM ANSWERS */}
          {activeTab === 'form' && (
            <div className="space-y-4 text-xs">
              {!delegate.formData ? (
                <div className="p-8 text-center bg-[#F5F4F0] rounded border border-[#E2DFD7] space-y-2">
                  <FileSpreadsheet className="w-8 h-8 text-[#8F8C84] mx-auto" />
                  <div className="font-serif text-sm font-semibold text-[#1D1C16]">
                    No Google Form Submission On Record
                  </div>
                  <p className="text-[11px] text-[#8F8C84] max-w-xs mx-auto">
                    Attendee has not yet submitted their RSVP through the connected Google Form.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-[#D8EEDF]/40 border border-[#2E7D52]/30 rounded flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-[#2E7D52] block">
                        Official Google Form Response Verified
                      </span>
                      <span className="text-[11px] text-[#424844] font-mono">
                        Synced: {new Date(delegate.formData.submittedAt).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#D8EEDF] text-[#2E7D52]">
                      {delegate.formData.attending ? 'ATTENDING' : 'DECLINED'}
                    </span>
                  </div>

                  <div className="bg-[#F5F4F0] p-3 rounded border border-[#E2DFD7] space-y-2.5">
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-[#8F8C84] block">
                        Dietary Preferences
                      </span>
                      <span className="text-xs font-medium text-[#1D1C16]">
                        {delegate.formData.dietary || 'None specified / Standard Meals'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold uppercase text-[#8F8C84] block">
                        Hotel Accommodation Needed
                      </span>
                      <span className="text-xs font-medium text-[#1D1C16]">
                        {delegate.formData.hotelRequired ? 'YES (Bhopal Summit Partner Hotel)' : 'NO (Arranging own stay)'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold uppercase text-[#8F8C84] block">
                        Flight & Arrival Coordinates
                      </span>
                      <span className="text-xs font-mono font-medium text-[#1D1C16]">
                        {delegate.formData.arrivalFlight || 'Not yet booked'} ·{' '}
                        {delegate.formData.arrivalTime || 'TBD'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold uppercase text-[#8F8C84] block">
                        Accompanying Delegation Size
                      </span>
                      <span className="text-xs font-mono font-medium text-[#1D1C16]">
                        {delegate.formData.accompanyingGuests || 0} additional guests
                      </span>
                    </div>

                    {delegate.formData.notes && (
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-[#8F8C84] block">
                          Special Protocol Notes from Form
                        </span>
                        <p className="text-xs text-[#1D1C16] italic mt-0.5">
                          "{delegate.formData.notes}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EMAIL HISTORY & 1-ON-1 SENDER */}
          {activeTab === 'emails' && (
            <div className="space-y-4">
              <div className="space-y-3">
                {delegate.interactions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#8F8C84] bg-[#F5F4F0] rounded border">
                    No emails exchanged yet.
                  </div>
                ) : (
                  delegate.interactions.map((msg) => {
                    const isIn = msg.type === 'inbound_reply';
                    return (
                      <div
                        key={msg.id}
                        className={`p-3 rounded border text-xs leading-relaxed space-y-1.5 ${
                          isIn
                            ? 'bg-white border-[#E2DFD7] text-[#1D1C16]'
                            : 'bg-[#F5F4F0] border-[#E2DFD7] text-[#424844]'
                        }`}
                      >
                        <div className="flex items-center justify-between pb-1 border-b border-black/5 text-[10px]">
                          <span className="font-semibold text-[#1E3A2F]">
                            {isIn ? `Inbound Reply from ${msg.from}` : `Outbound to ${msg.to}`}
                          </span>
                          <span className="font-mono text-[#8F8C84]">
                            {new Date(msg.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="font-semibold text-[#1D1C16]">{msg.subject}</div>
                        <p className="whitespace-pre-wrap text-[11px] text-[#424844]">{msg.body}</p>
                        {msg.detectedIntent && (
                          <div className="text-[10px] font-mono text-[#2E7D52] font-semibold">
                            Auto-detected Intent: [{msg.detectedIntent.toUpperCase()}]
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Compose 1-on-1 Direct Mail */}
              <form onSubmit={handleSendEmail} className="bg-[#F5F4F0] p-3.5 rounded border border-[#E2DFD7] space-y-2 text-xs">
                <span className="block text-[10px] uppercase font-semibold text-[#8F8C84]">
                  Send 1-on-1 Email Transmission to {delegate.name}
                </span>
                <input
                  type="text"
                  required
                  value={directSubject}
                  onChange={(e) => setDirectSubject(e.target.value)}
                  placeholder="Subject line..."
                  className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none"
                />
                <textarea
                  rows={3}
                  required
                  value={directBody}
                  onChange={(e) => setDirectBody(e.target.value)}
                  placeholder="Message body (Google Form link will be appended automatically)..."
                  className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-3 py-1.5 font-semibold bg-[#1E3A2F] text-white rounded hover:bg-[#2E7D52] transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send Message</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#EBE8E1] bg-[#F5F4F0] flex items-center justify-between text-xs">
          <span className="text-[#8F8C84] font-mono text-[11px]">{delegate.id}</span>
          <button
            onClick={onClose}
            className="px-3 py-1 font-medium border border-[#E2DFD7] rounded bg-white hover:bg-[#F5F4F0]"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
