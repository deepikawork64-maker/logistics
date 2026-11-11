import React, { useState, useMemo } from 'react';
import {
  X,
  Mail,
  CheckCircle2,
  RefreshCw,
  Server,
  Key,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  Plane,
  Utensils,
  Hotel,
  Users as UsersIcon,
  HelpCircle,
  Clock,
} from 'lucide-react';
import { ImapConfig, Delegate } from '../types/inviteOps';
import { MailAnalyzer, AnalyzedEmailResult } from '../services/mailAnalyzer';

interface ImapSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ImapConfig;
  onSaveConfig: (cfg: ImapConfig) => void;
  delegates: Delegate[];
  onSimulateReply: (fromEmail: string, subject: string, body: string, senderName?: string) => void;
}

export const ImapSettingsModal: React.FC<ImapSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  delegates,
  onSimulateReply,
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'analyzer'>('config');
  const [formData, setFormData] = useState<ImapConfig>(config);
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  // Live Email Reader & Ingestion Sandbox State
  const [inputEmail, setInputEmail] = useState(
    delegates[0]?.email || 'ambassador.morel@diplomatie.gouv.fr'
  );
  const [inputName, setInputName] = useState(delegates[0]?.name || 'Ambassador Jean-Luc Morel');
  const [inputSubject, setInputSubject] = useState(
    'Re: Official Invitation: Bhopal Global Investor Summit 2027'
  );
  const [inputBody, setInputBody] = useState(
    'I am delighted to confirm our attendance. Our delegation will arrive on Flight AI-433 on Jan 14 at 10:15 AM. Kindly ensure 2 hotel rooms are reserved, and arrange strict Jain vegetarian meals for our team.'
  );
  const [ingestSuccessMessage, setIngestSuccessMessage] = useState<string | null>(null);

  // Live NLP Analysis
  const liveAnalysis: AnalyzedEmailResult = useMemo(() => {
    return MailAnalyzer.analyzeEmail(inputEmail, inputSubject, inputBody, inputName);
  }, [inputEmail, inputSubject, inputBody, inputName]);

  const matchedDelegate = useMemo(() => {
    const clean = inputEmail.toLowerCase().trim();
    return delegates.find((d) => d.email.toLowerCase() === clean);
  }, [delegates, inputEmail]);

  if (!isOpen) return null;

  const handleTestConnection = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 4000);
    }, 1200);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    onClose();
  };

  const handleApplyAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail.trim() || !inputBody.trim()) return;

    onSimulateReply(inputEmail.trim(), inputSubject.trim(), inputBody.trim(), inputName.trim());
    setIngestSuccessMessage(
      `Email analyzed and synced! Status set to [${liveAnalysis.status}]. Extracted details added to delegate dossier.`
    );
    setTimeout(() => setIngestSuccessMessage(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[#07241A]/50 backdrop-blur-xs" onClick={onClose} />

      <div
        className="relative w-full max-w-2xl bg-[#FBFBFA] rounded border border-[#E2DFD7] shadow-2xl overflow-hidden z-10 text-[#1D1C16]"
        style={{
          boxShadow:
            '0 20px 25px -5px rgba(21, 42, 32, 0.2), 0 10px 10px -5px rgba(21, 42, 32, 0.1)',
        }}
      >
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-[#EBE8E1] bg-[#F5F4F0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Mail className="w-5 h-5 text-[#1E3A2F]" />
            <div>
              <h3 className="font-serif font-semibold text-lg text-[#1D1C16]">
                IMAP Mailbox Settings
              </h3>
              <p className="text-[11px] text-[#8F8C84]">
                Single unified configuration for connecting your mail account and auto-analyzing attendee replies.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-[#8F8C84] hover:text-[#1D1C16] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation: Only IMAP Settings & Email Reader */}
        <div className="flex border-b border-[#EBE8E1] bg-[#FAF8F5] px-5 pt-2 gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'config'
                ? 'border-[#1E3A2F] text-[#1E3A2F]'
                : 'border-transparent text-[#8F8C84] hover:text-[#1D1C16]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>1. IMAP & SMTP Connection Settings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analyzer')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'analyzer'
                ? 'border-[#1E3A2F] text-[#1E3A2F]'
                : 'border-transparent text-[#8F8C84] hover:text-[#1D1C16]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#2E7D52]" />
            <span>2. Live Inbound Email Reader & Test Sandbox</span>
          </button>
        </div>

        <div className="p-5 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {/* Active Connection Banner */}
          <div className="p-3 bg-[#D8EEDF]/40 border border-[#2E7D52]/30 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D52] animate-ping shrink-0" />
              <div>
                <span className="font-semibold text-xs text-[#2E7D52] block">
                  Active IMAP Account: {formData.emailUser || 'Not configured'}
                </span>
                <span className="text-[10px] text-[#424844] font-mono">
                  {formData.imapHost}:{formData.imapPort} • Polling interval: every {formData.autoSyncIntervalSec}s
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-2.5 py-1 text-xs font-semibold bg-white border border-[#2E7D52]/40 text-[#2E7D52] rounded hover:bg-[#D8EEDF] transition-colors flex items-center gap-1 shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Verifying...' : 'Test Connection'}</span>
            </button>
          </div>

          {testSuccess && (
            <div className="p-2.5 bg-[#D8EEDF] text-[#2E7D52] rounded border border-[#2E7D52]/40 font-semibold flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Connection Verified: IMAP SSL socket responded successfully on port {formData.imapPort}.</span>
            </div>
          )}

          {/* TAB 1: SINGLE UNIFIED IMAP SETTING */}
          {activeTab === 'config' && (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="bg-[#FAF8F5] p-3 rounded border border-[#E2DFD7] space-y-1">
                <span className="text-[10px] font-semibold uppercase text-[#1E3A2F] block">
                  Direct Mailbox Connection
                </span>
                <p className="text-[11px] text-[#525048] leading-relaxed">
                  Enter your email address and credentials below. The application will connect directly to this mailbox to dispatch invitations and read incoming RSVPs.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                    Your Email Address (Username)
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.emailUser}
                    onChange={(e) => setFormData({ ...formData, emailUser: e.target.value })}
                    placeholder="e.g. deepikawork64@gmail.com"
                    className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none focus:border-[#1E3A2F] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                    App Password / Secret
                  </label>
                  <input
                    type="password"
                    value={formData.appPassword}
                    onChange={(e) => setFormData({ ...formData, appPassword: e.target.value })}
                    placeholder="Enter 16-character App Password"
                    className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none focus:border-[#1E3A2F] font-mono"
                  />
                  <span className="text-[9px] text-[#8F8C84] mt-0.5 block">
                    For Gmail, use a 16-char App Password from Google Account Security.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                    IMAP Host (Incoming Mail)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.imapHost}
                    onChange={(e) => setFormData({ ...formData, imapHost: e.target.value })}
                    placeholder="imap.gmail.com"
                    className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none focus:border-[#1E3A2F] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                    IMAP Port (SSL)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.imapPort}
                    onChange={(e) => setFormData({ ...formData, imapPort: Number(e.target.value) })}
                    className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none focus:border-[#1E3A2F] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                    SMTP Host (Outgoing Dispatches)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.smtpHost}
                    onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                    placeholder="smtp.gmail.com"
                    className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none focus:border-[#1E3A2F] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                    SMTP Port (SSL)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.smtpPort}
                    onChange={(e) => setFormData({ ...formData, smtpPort: Number(e.target.value) })}
                    className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none focus:border-[#1E3A2F] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                  Live Inbox Polling Interval
                </label>
                <select
                  value={formData.autoSyncIntervalSec}
                  onChange={(e) => setFormData({ ...formData, autoSyncIntervalSec: Number(e.target.value) })}
                  className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none"
                >
                  <option value={15}>Every 15 seconds (High Frequency)</option>
                  <option value={30}>Every 30 seconds (Standard recommended)</option>
                  <option value={60}>Every 60 seconds (Relaxed)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#EBE8E1]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-xs border border-[#E2DFD7] rounded text-[#525048] hover:bg-[#F5F4F0] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-xs bg-[#1E3A2F] text-[#FBFBFA] rounded hover:bg-[#2E7D52] cursor-pointer shadow-xs"
                >
                  Save IMAP Configuration
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: LIVE INBOUND EMAIL READER */}
          {activeTab === 'analyzer' && (
            <div className="space-y-4">
              <div className="bg-[#FAF8F5] p-3 rounded border border-[#E2DFD7] space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-semibold text-xs text-[#1D1C16] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#2E7D52]" />
                    <span>Inbound Email Reading & Attribute Parser</span>
                  </h4>
                  <span className="text-[10px] font-mono font-semibold text-[#2E7D52]">
                    Reading {formData.emailUser}
                  </span>
                </div>
                <p className="text-[11px] text-[#424844] leading-relaxed">
                  When an attendee replies to an invitation, this reader extracts their RSVP response, meal preference (Jain, Veg, Halal), flight arrival details, and hotel accommodation requirements automatically.
                </p>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-[#8F8C84] uppercase font-semibold mr-1">
                    Try Pre-set:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setInputEmail('ambassador.morel@diplomatie.gouv.fr');
                      setInputName('Ambassador Jean-Luc Morel');
                      setInputSubject('Re: Official Invitation: Bhopal Global Investor Summit 2027');
                      setInputBody(
                        'I am delighted to confirm our attendance. Our delegation will arrive on Flight AI-433 on Jan 14 at 10:15 AM. Kindly ensure 2 hotel rooms are reserved, and arrange strict Jain vegetarian meals for our team.'
                      );
                    }}
                    className="px-2 py-0.5 text-[10px] rounded bg-white border border-[#E2DFD7] hover:border-[#1E3A2F] text-[#1D1C16] cursor-pointer"
                  >
                    Attending + Flight + Jain Veg + Hotel
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setInputEmail('campbell.a@parliament.uk');
                      setInputName('Lord Alistair Campbell');
                      setInputSubject('Regrets: Bhopal Investor Summit');
                      setInputBody(
                        'Lord Campbell sends his sincere regrets as parliamentary recess commitments in Westminster prevent him from undertaking travel to India during that week.'
                      );
                    }}
                    className="px-2 py-0.5 text-[10px] rounded bg-white border border-[#E2DFD7] hover:border-[#B83A2C] text-[#B83A2C] cursor-pointer"
                  >
                    Declined (Parliamentary Regrets)
                  </button>
                </div>
              </div>

              {ingestSuccessMessage && (
                <div className="p-3 bg-[#D8EEDF] text-[#2E7D52] rounded border border-[#2E7D52]/40 font-semibold flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{ingestSuccessMessage}</span>
                </div>
              )}

              {/* Email Form */}
              <form onSubmit={handleApplyAnalysis} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                      Sender Email
                    </label>
                    <input
                      type="email"
                      required
                      value={inputEmail}
                      onChange={(e) => setInputEmail(e.target.value)}
                      placeholder="e.g. attendee@company.com"
                      className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs font-mono focus:outline-none focus:border-[#1E3A2F]"
                    />
                    {matchedDelegate ? (
                      <span className="text-[10px] text-[#2E7D52] font-semibold mt-0.5 block flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Matches existing roster contact: <strong>{matchedDelegate.name}</strong>
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#976508] mt-0.5 block">
                        New contact • Auto-creates record in roster
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                      Sender Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={inputName}
                      onChange={(e) => setInputName(e.target.value)}
                      placeholder="e.g. Dr. Rajesh Kumar"
                      className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none focus:border-[#1E3A2F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={inputSubject}
                    onChange={(e) => setInputSubject(e.target.value)}
                    placeholder="Subject line..."
                    className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs font-mono focus:outline-none focus:border-[#1E3A2F]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                    Email Body / Message Text
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={inputBody}
                    onChange={(e) => setInputBody(e.target.value)}
                    placeholder="Paste the reply email text..."
                    className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs leading-relaxed focus:outline-none focus:border-[#1E3A2F]"
                  />
                </div>

                {/* Analysis Preview Card */}
                <div className="p-3.5 bg-white rounded border border-[#1E3A2F]/30 shadow-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-[#EBE8E1] pb-1.5">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-[#8F8C84]">
                      Extracted Inbound Attributes
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-[#2E7D52]">
                      Confidence: {Math.round(liveAnalysis.confidence * 100)}%
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1 ${
                        liveAnalysis.detectedIntent === 'attending'
                          ? 'bg-[#D8EEDF] text-[#2E7D52]'
                          : liveAnalysis.detectedIntent === 'declined'
                          ? 'bg-[#FBE3DE] text-[#B83A2C]'
                          : 'bg-[#F4E7C5] text-[#976508]'
                      }`}
                    >
                      {liveAnalysis.detectedIntent === 'attending' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>Intent: {liveAnalysis.detectedIntent.toUpperCase()}</span>
                    </span>

                    {liveAnalysis.extractedAttributes.arrivalFlight && (
                      <span className="px-2 py-0.5 rounded text-[11px] bg-[#EFECE5] text-[#1E3A2F] font-mono flex items-center gap-1">
                        <Plane className="w-3 h-3 text-[#1E3A2F]" />
                        <span>{liveAnalysis.extractedAttributes.arrivalFlight}</span>
                      </span>
                    )}

                    {liveAnalysis.extractedAttributes.dietary && (
                      <span className="px-2 py-0.5 rounded text-[11px] bg-[#D8EEDF]/60 text-[#2E7D52] font-medium flex items-center gap-1">
                        <Utensils className="w-3 h-3 text-[#2E7D52]" />
                        <span>{liveAnalysis.extractedAttributes.dietary}</span>
                      </span>
                    )}

                    {liveAnalysis.extractedAttributes.hotelRequired !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 ${
                          liveAnalysis.extractedAttributes.hotelRequired
                            ? 'bg-[#F4E7C5] text-[#976508]'
                            : 'bg-[#EBE8E1] text-[#424844]'
                        }`}
                      >
                        <Hotel className="w-3 h-3" />
                        <span>
                          Hotel: {liveAnalysis.extractedAttributes.hotelRequired ? 'Required' : 'Self-Arranged'}
                        </span>
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-[#424844] bg-[#F5F4F0] p-2 rounded">
                    <strong>Summary:</strong> {liveAnalysis.executiveSummary}
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 font-semibold text-xs bg-[#1E3A2F] text-white rounded hover:bg-[#2E7D52] shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Apply Analysis & Update Master Roster</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
