import React, { useState } from 'react';
import { X, Send, Mail, CheckCircle2, FileSpreadsheet, Sparkles } from 'lucide-react';
import { Delegate, DelegateTier } from '../types/inviteOps';

interface SendCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  delegates: Delegate[];
  selectedIds?: string[];
  googleFormUrl: string;
  onSendCampaign: (
    title: string,
    subject: string,
    body: string,
    formUrl: string,
    recipientIds: string[]
  ) => void;
}

export const SendCampaignModal: React.FC<SendCampaignModalProps> = ({
  isOpen,
  onClose,
  delegates,
  selectedIds = [],
  googleFormUrl,
  onSendCampaign,
}) => {
  const [title, setTitle] = useState('Bhopal Summit 2027 Official Invitation Dispatch');
  const [subject, setSubject] = useState('Official Invitation: Bhopal Global Investor Summit 2027 [INV-{{ID}}]');
  const [body, setBody] = useState(
    `Dear {{Name}},\n\nOn behalf of the Government of Madhya Pradesh and the Summit Secretariat, we have the distinct honor to invite you to the Bhopal Global Investor Summit 2027.\n\nYour presence will enrich our high-level plenaries and bilateral councils. Kindly confirm your RSVP and submit your protocol requirements (dietary, hotel, and flight coordinates) on the official Google Form below:\n\n{{GoogleFormLink}}\n\nYou may also confirm directly by replying to this transmission.\n\nWarm regards,\nBhopal Summit Secretariat & Protocol Desk`
  );
  const [attachForm, setAttachForm] = useState(true);
  const [customFormUrl, setCustomFormUrl] = useState(googleFormUrl);
  const [recipientScope, setRecipientScope] = useState<'selected' | 'uninvited' | 'all'>(
    selectedIds.length > 0 ? 'selected' : 'uninvited'
  );

  if (!isOpen) return null;

  const targetDelegates = delegates.filter((d) => {
    if (recipientScope === 'selected') return selectedIds.includes(d.id);
    if (recipientScope === 'uninvited') return d.status === 'Not Invited';
    return true;
  });

  const sampleDelegate = targetDelegates[0] || delegates[0] || {
    name: 'Ambassador Jean-Luc Morel',
    organization: 'Embassy of France',
    id: 'del-1',
  };

  const previewBody = body
    .replace(/\{\{Name\}\}/g, sampleDelegate.name)
    .replace(/\{\{Organization\}\}/g, sampleDelegate.organization || 'your organization')
    .replace(/\{\{GoogleFormLink\}\}/g, attachForm ? customFormUrl : '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetDelegates.length === 0) return;
    onSendCampaign(
      title,
      subject,
      body,
      attachForm ? customFormUrl : '',
      targetDelegates.map((d) => d.id)
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[#07241A]/50 backdrop-blur-xs" onClick={onClose} />

      <div
        className="relative w-full max-w-2xl bg-[#FBFBFA] rounded border border-[#E2DFD7] shadow-xl overflow-hidden z-10 text-[#1D1C16]"
        style={{
          boxShadow:
            '0 20px 25px -5px rgba(21, 42, 32, 0.2), 0 10px 10px -5px rgba(21, 42, 32, 0.1)',
        }}
      >
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-[#EBE8E1] bg-[#F5F4F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-[#1E3A2F]" />
            <div>
              <h3 className="font-serif font-semibold text-lg text-[#1D1C16]">
                Dispatch Invitation Campaign (SMTP Mailer)
              </h3>
              <p className="text-[11px] text-[#8F8C84]">
                Sends personalized emails with auto-tracking ID tags and Google Form links.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-[#8F8C84] hover:text-[#1D1C16]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Campaign Title & Target Audience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                Campaign Name
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none focus:border-[#1E3A2F]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                Target Recipients ({targetDelegates.length} delegates)
              </label>
              <select
                value={recipientScope}
                onChange={(e) => setRecipientScope(e.target.value as any)}
                className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none focus:border-[#1E3A2F]"
              >
                {selectedIds.length > 0 && (
                  <option value="selected">
                    Selected Roster Items ({selectedIds.length} contacts)
                  </option>
                )}
                <option value="uninvited">
                  All Uninvited Contacts ({delegates.filter((d) => d.status === 'Not Invited').length})
                </option>
                <option value="all">All Contacts ({delegates.length})</option>
              </select>
            </div>
          </div>

          {/* Subject Line */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
              Email Subject Line (Includes Tracking Tag)
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none focus:border-[#1E3A2F]"
            />
          </div>

          {/* Email Body Template */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
              Email Body Template (Variables: <code className="font-mono text-[#1E3A2F]">{'{{Name}}'}</code>, <code className="font-mono text-[#1E3A2F]">{'{{Organization}}'}</code>, <code className="font-mono text-[#1E3A2F]">{'{{GoogleFormLink}}'}</code>)
            </label>
            <textarea
              rows={5}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none focus:border-[#1E3A2F]"
            />
          </div>

          {/* Google Form Attachment Toggle */}
          <div className="p-3 bg-[#F5F4F0] rounded border border-[#E2DFD7] space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-[#1D1C16]">
                <input
                  type="checkbox"
                  checked={attachForm}
                  onChange={(e) => setAttachForm(e.target.checked)}
                  className="rounded border-[#E2DFD7] text-[#1E3A2F]"
                />
                <span>Attach Connected Google Form RSVP Link</span>
              </label>
              <span className="text-[10px] font-mono text-[#2E7D52] bg-[#D8EEDF] px-1.5 py-0.2 rounded font-semibold">
                Auto-Sync Enabled
              </span>
            </div>
            {attachForm && (
              <input
                type="url"
                value={customFormUrl}
                onChange={(e) => setCustomFormUrl(e.target.value)}
                placeholder="https://docs.google.com/forms/..."
                className="w-full p-1.5 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none"
              />
            )}
          </div>

          {/* Personalized Preview */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-semibold text-[#8F8C84]">
              Personalized Preview for: {sampleDelegate.name} ({sampleDelegate.organization || 'Delegation'})
            </span>
            <div className="p-3 rounded bg-white border border-[#E2DFD7] text-xs text-[#424844] whitespace-pre-wrap max-h-36 overflow-y-auto font-sans leading-relaxed">
              <div className="font-semibold text-[#1D1C16] pb-1 mb-1 border-b">
                {subject.replace(/\{\{ID\}\}/g, sampleDelegate.id)}
              </div>
              {previewBody}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-[#EBE8E1]">
            <span className="text-[11px] text-[#8F8C84]">
              Recipients will be updated to <strong className="text-[#1D1C16]">"Invitation Sent"</strong>.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded border border-[#E2DFD7] text-[#424844] hover:bg-[#F5F4F0]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={targetDelegates.length === 0}
                className="px-4 py-1.5 font-semibold bg-[#1E3A2F] text-[#FBFBFA] rounded hover:bg-[#2E7D52] disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch to {targetDelegates.length} Delegates</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
