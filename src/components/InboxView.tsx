import React, { useState, useMemo } from 'react';
import {
  Inbox,
  Mail,
  Search,
  RefreshCw,
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Plane,
  Utensils,
  Hotel,
  Users as UsersIcon,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Send,
  Ticket,
  UserCheck,
  Filter,
  Check,
  Trash2,
} from 'lucide-react';
import { InboxEmail, Delegate, ImapConfig } from '../types/inviteOps';

interface InboxViewProps {
  emails: InboxEmail[];
  delegates: Delegate[];
  imapConfig: ImapConfig;
  onOpenImap: () => void;
  onFetchEmails: () => Promise<void>;
  isFetching: boolean;
  onSyncEmailToRoster: (email: InboxEmail) => void;
  onSendReply: (toEmail: string, subject: string, body: string) => void;
  onMarkAsRead: (id: string) => void;
  onDeleteEmail: (id: string) => void;
  onLoadSampleEmails?: () => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
  emails,
  delegates,
  imapConfig,
  onOpenImap,
  onFetchEmails,
  isFetching,
  onSyncEmailToRoster,
  onSendReply,
  onMarkAsRead,
  onDeleteEmail,
  onLoadSampleEmails,
}) => {
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(
    emails[0]?.id || null
  );
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);

  // Keep selected email fresh or fallback to first
  const activeEmail = useMemo(() => {
    return emails.find((e) => e.id === selectedEmailId) || emails[0] || null;
  }, [emails, selectedEmailId]);

  // Counts by category
  const counts = useMemo(() => {
    return {
      all: emails.length,
      confirmed: emails.filter((e) => e.classification.intent === 'attending').length,
      declined: emails.filter((e) => e.classification.intent === 'declined').length,
      tentative: emails.filter((e) => e.classification.intent === 'tentative').length,
      logistics: emails.filter(
        (e) =>
          e.classification.intent === 'inquiry' ||
          e.classification.category === 'Logistics / Inquiry'
      ).length,
      unread: emails.filter((e) => !e.isRead).length,
    };
  }, [emails]);

  // Filtered email list
  const filteredEmails = useMemo(() => {
    return emails.filter((email) => {
      // Category filter
      if (categoryFilter === 'confirmed' && email.classification.intent !== 'attending')
        return false;
      if (categoryFilter === 'declined' && email.classification.intent !== 'declined')
        return false;
      if (categoryFilter === 'tentative' && email.classification.intent !== 'tentative')
        return false;
      if (
        categoryFilter === 'logistics' &&
        email.classification.intent !== 'inquiry' &&
        email.classification.category !== 'Logistics / Inquiry'
      )
        return false;
      if (categoryFilter === 'unread' && email.isRead) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSender =
          email.fromEmail.toLowerCase().includes(q) ||
          email.fromName.toLowerCase().includes(q);
        const matchesSubject = email.subject.toLowerCase().includes(q);
        const matchesBody = email.textBody.toLowerCase().includes(q);
        const matchesDietary = email.classification.attributes.dietary
          ?.toLowerCase()
          .includes(q);
        const matchesFlight = email.classification.attributes.arrivalFlight
          ?.toLowerCase()
          .includes(q);

        if (
          !matchesSender &&
          !matchesSubject &&
          !matchesBody &&
          !matchesDietary &&
          !matchesFlight
        ) {
          return false;
        }
      }

      return true;
    });
  }, [emails, categoryFilter, searchQuery]);

  const handleSelectEmail = (email: InboxEmail) => {
    setSelectedEmailId(email.id);
    if (!email.isRead) {
      onMarkAsRead(email.id);
    }
  };

  const handleSendDirectReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmail || !replyText.trim()) return;

    const replySubject = activeEmail.subject.startsWith('Re:')
      ? activeEmail.subject
      : `Re: ${activeEmail.subject}`;

    onSendReply(activeEmail.fromEmail, replySubject, replyText.trim());
    setReplyText('');
    setIsReplying(false);
    setReplySuccess(true);
    setTimeout(() => setReplySuccess(false), 4000);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col">
      {/* Top Banner & Control Deck */}
      <div className="bg-[#FBFBFA] border border-[#EBE8E1] rounded p-4 shrink-0 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#152A20] text-[#D8EEDF] rounded">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-xl text-[#1D1C16]">
                  Live Mailbox &amp; Attendee Intelligence
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#D8EEDF] text-[#2E7D52] border border-[#2E7D52]/20 uppercase">
                  {imapConfig.emailUser || 'deepikawork64@gmail.com'}
                </span>
              </div>
              <p className="text-xs text-[#525048] mt-0.5">
                Continuously reads all incoming emails via IMAP, automatically identifies RSVP confirmations, meal preferences, flight numbers, and hotel requests.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onFetchEmails}
              disabled={isFetching}
              className="px-3 py-1.5 text-xs font-semibold bg-[#1E3A2F] text-[#FBFBFA] rounded hover:bg-[#2E7D52] disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Connect to mail server and pull latest emails"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span>{isFetching ? 'Fetching Mails...' : 'Fetch All Mails Now'}</span>
            </button>

            <button
              onClick={onOpenImap}
              className="px-3 py-1.5 text-xs font-medium text-[#1E3A2F] border border-[#E2DFD7] rounded bg-white hover:bg-[#F5F4F0] transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Configure IMAP credentials and auto-sync rate"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>IMAP Settings</span>
            </button>

            {emails.length === 0 && onLoadSampleEmails && (
              <button
                onClick={onLoadSampleEmails}
                className="px-3 py-1.5 text-xs font-medium text-[#976508] bg-[#F4E7C5]/40 border border-[#976508]/30 rounded hover:bg-[#F4E7C5] transition-colors cursor-pointer"
                title="Load sample attendee replies to test classification"
              >
                Load Demo Inbound Emails
              </button>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-4 pt-3 border-t border-[#EBE8E1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Classification Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-[#1E3A2F] text-white'
                  : 'bg-[#F5F4F0] text-[#525048] hover:bg-[#EBE8E1]'
              }`}
            >
              All Mails ({counts.all})
            </button>

            <button
              onClick={() => setCategoryFilter('confirmed')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                categoryFilter === 'confirmed'
                  ? 'bg-[#2E7D52] text-white'
                  : 'bg-[#D8EEDF]/50 text-[#2E7D52] hover:bg-[#D8EEDF]'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Confirmed ({counts.confirmed})</span>
            </button>

            <button
              onClick={() => setCategoryFilter('declined')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                categoryFilter === 'declined'
                  ? 'bg-[#B83A2C] text-white'
                  : 'bg-[#FBE3DE] text-[#B83A2C] hover:bg-[#f7cfc8]'
              }`}
            >
              <XCircle className="w-3 h-3" />
              <span>Declined ({counts.declined})</span>
            </button>

            <button
              onClick={() => setCategoryFilter('tentative')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                categoryFilter === 'tentative'
                  ? 'bg-[#976508] text-white'
                  : 'bg-[#F4E7C5] text-[#976508] hover:bg-[#ecdca8]'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Tentative ({counts.tentative})</span>
            </button>

            <button
              onClick={() => setCategoryFilter('logistics')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                categoryFilter === 'logistics'
                  ? 'bg-[#1E3A2F] text-white'
                  : 'bg-[#EFECE5] text-[#1E3A2F] hover:bg-[#e4dfd4]'
              }`}
            >
              <Plane className="w-3 h-3" />
              <span>Logistics &amp; Inquiries ({counts.logistics})</span>
            </button>

            {counts.unread > 0 && (
              <button
                onClick={() => setCategoryFilter('unread')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  categoryFilter === 'unread'
                    ? 'bg-[#1D1C16] text-white'
                    : 'bg-[#F5F4F0] text-[#1D1C16] hover:bg-[#EBE8E1]'
                }`}
              >
                Unread ({counts.unread})
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#8F8C84] absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sender, flight, diet..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E2DFD7] rounded text-[#1D1C16] focus:outline-none focus:border-[#1E3A2F]"
            />
          </div>
        </div>
      </div>

      {/* Main Split Layout: Email List (Left) + Detail Reader (Right) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Email List (5 cols on lg) */}
        <div className="lg:col-span-5 bg-[#FBFBFA] border border-[#EBE8E1] rounded overflow-hidden flex flex-col shadow-xs">
          <div className="p-3 border-b border-[#EBE8E1] bg-[#F5F4F0] flex items-center justify-between text-xs text-[#525048]">
            <span className="font-semibold text-[#1D1C16]">
              {filteredEmails.length} {filteredEmails.length === 1 ? 'Message' : 'Messages'}
            </span>
            <span className="text-[11px] text-[#8F8C84]">
              Sorted by Newest
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#EBE8E1]">
            {filteredEmails.length === 0 ? (
              <div className="p-8 text-center text-[#8F8C84] space-y-2">
                <Inbox className="w-8 h-8 mx-auto opacity-50" />
                <p className="text-xs font-medium text-[#1D1C16]">No emails found</p>
                <p className="text-[11px] max-w-xs mx-auto">
                  {searchQuery
                    ? 'Try adjusting your search criteria.'
                    : 'Click "Fetch All Mails Now" to pull incoming emails from your IMAP mailbox.'}
                </p>
              </div>
            ) : (
              filteredEmails.map((email) => {
                const isSelected = activeEmail?.id === email.id;
                const { intent, category, attributes } = email.classification;

                return (
                  <div
                    key={email.id}
                    onClick={() => handleSelectEmail(email)}
                    className={`p-3.5 cursor-pointer transition-all border-l-3 ${
                      isSelected
                        ? 'bg-[#FAF8F5] border-l-[#1E3A2F]'
                        : email.isRead
                        ? 'bg-white border-l-transparent hover:bg-[#FAF8F5]'
                        : 'bg-[#F4F9F6] border-l-[#2E7D52] hover:bg-[#ebf4ef]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex items-center gap-1.5">
                        {!email.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#2E7D52] shrink-0" />
                        )}
                        <span
                          className={`text-xs truncate block ${
                            !email.isRead
                              ? 'font-bold text-[#1D1C16]'
                              : 'font-semibold text-[#424844]'
                          }`}
                        >
                          {email.fromName || email.fromEmail.split('@')[0]}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#8F8C84] font-mono shrink-0">
                        {new Date(email.date).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <h4
                      className={`text-xs mt-1 truncate ${
                        !email.isRead ? 'font-semibold text-[#1D1C16]' : 'text-[#525048]'
                      }`}
                    >
                      {email.subject}
                    </h4>

                    <p className="text-[11px] text-[#8F8C84] line-clamp-2 mt-0.5 leading-relaxed">
                      {email.snippet || email.textBody}
                    </p>

                    {/* Classification Badges */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          intent === 'attending'
                            ? 'bg-[#D8EEDF] text-[#2E7D52]'
                            : intent === 'declined'
                            ? 'bg-[#FBE3DE] text-[#B83A2C]'
                            : intent === 'tentative'
                            ? 'bg-[#F4E7C5] text-[#976508]'
                            : 'bg-[#EFECE5] text-[#1E3A2F]'
                        }`}
                      >
                        {category}
                      </span>

                      {attributes.dietary && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#D8EEDF]/60 text-[#2E7D52] font-medium flex items-center gap-0.5">
                          <Utensils className="w-2.5 h-2.5" />
                          <span>{attributes.dietary}</span>
                        </span>
                      )}

                      {attributes.arrivalFlight && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#EFECE5] text-[#1E3A2F] font-mono flex items-center gap-0.5">
                          <Plane className="w-2.5 h-2.5" />
                          <span>{attributes.arrivalFlight}</span>
                        </span>
                      )}

                      {email.matchedDelegateName && (
                        <span className="text-[10px] text-[#2E7D52] font-medium ml-auto">
                          ✓ {email.matchedDelegateName}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Email Reader & AI Intelligence (7 cols on lg) */}
        <div className="lg:col-span-7 bg-[#FBFBFA] border border-[#EBE8E1] rounded overflow-hidden flex flex-col shadow-xs">
          {activeEmail ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-5 space-y-4">
              {/* Header Box */}
              <div className="border-b border-[#EBE8E1] pb-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-serif font-bold text-lg text-[#1D1C16]">
                    {activeEmail.subject}
                  </h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onDeleteEmail(activeEmail.id)}
                      className="p-1.5 text-[#8F8C84] hover:text-[#B83A2C] rounded hover:bg-[#FBE3DE]/30 transition-colors"
                      title="Delete from local inbox view"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#525048] gap-1">
                  <div>
                    <span className="font-semibold text-[#1D1C16]">
                      {activeEmail.fromName}
                    </span>{' '}
                    <span className="text-[#8F8C84] font-mono">
                      &lt;{activeEmail.fromEmail}&gt;
                    </span>
                  </div>
                  <div className="text-[11px] text-[#8F8C84] font-mono">
                    {new Date(activeEmail.date).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </div>
                </div>
              </div>

              {/* AI Classification & Attribute Dossier */}
              <div className="bg-[#FAF8F5] border border-[#1E3A2F]/25 rounded p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#EBE8E1] pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#2E7D52]" />
                    <span className="font-serif font-bold text-xs uppercase tracking-wider text-[#1E3A2F]">
                      Natural Language Extraction
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#2E7D52] font-semibold">
                    Confidence: {Math.round(activeEmail.classification.confidence * 100)}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-white rounded border border-[#E2DFD7] space-y-1">
                    <span className="text-[10px] font-semibold uppercase text-[#8F8C84] block">
                      Detected RSVP Decision
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-bold text-xs ${
                        activeEmail.classification.intent === 'attending'
                          ? 'bg-[#D8EEDF] text-[#2E7D52]'
                          : activeEmail.classification.intent === 'declined'
                          ? 'bg-[#FBE3DE] text-[#B83A2C]'
                          : 'bg-[#F4E7C5] text-[#976508]'
                      }`}
                    >
                      {activeEmail.classification.intent === 'attending' && (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>{activeEmail.classification.category}</span>
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded border border-[#E2DFD7] space-y-1">
                    <span className="text-[10px] font-semibold uppercase text-[#8F8C84] block">
                      Dietary Requirement
                    </span>
                    <span className="font-medium text-xs text-[#1D1C16] flex items-center gap-1.5">
                      <Utensils className="w-3.5 h-3.5 text-[#2E7D52]" />
                      <span>
                        {activeEmail.classification.attributes.dietary || 'Standard / Not Specified'}
                      </span>
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded border border-[#E2DFD7] space-y-1">
                    <span className="text-[10px] font-semibold uppercase text-[#8F8C84] block">
                      Flight &amp; Arrival Schedule
                    </span>
                    <span className="font-mono text-xs text-[#1E3A2F] flex items-center gap-1.5">
                      <Plane className="w-3.5 h-3.5 text-[#1E3A2F]" />
                      <span>
                        {activeEmail.classification.attributes.arrivalFlight
                          ? `${activeEmail.classification.attributes.arrivalFlight} ${
                              activeEmail.classification.attributes.arrivalTime
                                ? `(${activeEmail.classification.attributes.arrivalTime})`
                                : ''
                            }`
                          : 'Not mentioned'}
                      </span>
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded border border-[#E2DFD7] space-y-1">
                    <span className="text-[10px] font-semibold uppercase text-[#8F8C84] block">
                      Hotel Accommodation
                    </span>
                    <span className="font-medium text-xs text-[#1D1C16] flex items-center gap-1.5">
                      <Hotel className="w-3.5 h-3.5 text-[#976508]" />
                      <span>
                        {activeEmail.classification.attributes.hotelRequired !== undefined
                          ? activeEmail.classification.attributes.hotelRequired
                            ? 'Required (Official Accommodation)'
                            : 'Self-Arranged'
                          : 'Not specified'}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-[#F5F4F0] rounded text-xs text-[#424844] space-y-1">
                  <span className="font-semibold text-[#1D1C16] block text-[11px]">
                    Executive Summary:
                  </span>
                  <p className="leading-relaxed text-[11px]">
                    {activeEmail.classification.summary}
                  </p>
                </div>

                {/* Sync Action */}
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-[#525048]">
                    {activeEmail.matchedDelegateName ? (
                      <span className="flex items-center gap-1 text-[#2E7D52] font-semibold">
                        <Check className="w-3.5 h-3.5" />
                        Linked to: {activeEmail.matchedDelegateName}
                      </span>
                    ) : (
                      <span className="text-[#976508]">
                        Unlisted attendee • Will auto-enroll into master roster
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onSyncEmailToRoster(activeEmail)}
                    className="px-3 py-1.5 text-xs font-semibold bg-[#1E3A2F] text-white rounded hover:bg-[#2E7D52] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Sync to Master Delegate Dossier</span>
                  </button>
                </div>
              </div>

              {/* Full Email Message Content */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] uppercase font-semibold text-[#8F8C84] tracking-wider block">
                  Original Email Body
                </span>
                <div className="p-4 bg-white rounded border border-[#E2DFD7] text-xs leading-relaxed text-[#1D1C16] font-mono whitespace-pre-wrap select-text">
                  {activeEmail.textBody || '(No message content)'}
                </div>
              </div>

              {/* Reply Section */}
              <div className="pt-2 border-t border-[#EBE8E1]">
                {!isReplying ? (
                  <button
                    onClick={() => setIsReplying(true)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-[#1E3A2F] bg-white border border-[#E2DFD7] rounded hover:bg-[#F5F4F0] transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Direct 1-on-1 Reply to {activeEmail.fromName}</span>
                  </button>
                ) : (
                  <form onSubmit={handleSendDirectReply} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#1D1C16]">
                        Send Reply to: {activeEmail.fromEmail}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsReplying(false)}
                        className="text-xs text-[#8F8C84] hover:text-[#1D1C16]"
                      >
                        Cancel
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Dear ${activeEmail.fromName},\n\nThank you for confirming your participation...`}
                      className="w-full p-2.5 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none focus:border-[#1E3A2F]"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="submit"
                        className="px-4 py-1.5 text-xs font-semibold bg-[#1E3A2F] text-white rounded hover:bg-[#2E7D52] flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Reply</span>
                      </button>
                    </div>
                  </form>
                )}

                {replySuccess && (
                  <div className="mt-2 p-2 bg-[#D8EEDF] text-[#2E7D52] rounded border border-[#2E7D52]/30 text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Reply dispatched successfully!</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#8F8C84] space-y-2">
              <Mail className="w-10 h-10 opacity-40 text-[#1E3A2F]" />
              <h4 className="font-serif font-bold text-sm text-[#1D1C16]">
                Select an Email to Inspect
              </h4>
              <p className="text-xs max-w-sm">
                Select any incoming message from the left to read the full body and view the extracted RSVP intent, flight numbers, and meal preferences.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
