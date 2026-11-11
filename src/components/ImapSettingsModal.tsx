import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Mail,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  SlidersHorizontal,
  Plane,
  Utensils,
  Hotel,
  AlertTriangle,
  ExternalLink,
  ArrowDownToLine,
  Inbox,
  Calendar,
  User as UserIcon,
  HelpCircle,
} from 'lucide-react';
import { ImapConfig, Delegate } from '../types/inviteOps';
import { MailAnalyzer, AnalyzedEmailResult } from '../services/mailAnalyzer';
import { ImapClient, FetchedEmailItem, ImapTestResult } from '../services/imapClient';

interface ImapSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ImapConfig;
  onSaveConfig: (cfg: ImapConfig) => void;
  delegates: Delegate[];
  onSimulateReply: (fromEmail: string, subject: string, body: string, senderName?: string) => void;
  onRealEmailsFetched?: (count: number) => void;
}

export const ImapSettingsModal: React.FC<ImapSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  delegates,
  onSimulateReply,
  onRealEmailsFetched,
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'fetched' | 'analyzer'>('config');
  const [formData, setFormData] = useState<ImapConfig>(config);
  
  // Real Connection Test State
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ImapTestResult | null>(null);

  // Real Inbound Email Fetch State
  const [isFetching, setIsFetching] = useState(false);
  const [fetchedEmails, setFetchedEmails] = useState<FetchedEmailItem[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchSuccessMessage, setFetchSuccessMessage] = useState<string | null>(null);

  // Manual Sandbox State
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

  // Sync form state when config changes
  useEffect(() => {
    setFormData(config);
  }, [config]);

  // Live NLP Analysis for manual sandbox
  const liveAnalysis: AnalyzedEmailResult = useMemo(() => {
    return MailAnalyzer.analyzeEmail(inputEmail, inputSubject, inputBody, inputName);
  }, [inputEmail, inputSubject, inputBody, inputName]);

  const matchedDelegate = useMemo(() => {
    const clean = inputEmail.toLowerCase().trim();
    return delegates.find((d) => d.email.toLowerCase() === clean);
  }, [delegates, inputEmail]);

  if (!isOpen) return null;

  const isGmail =
    formData.imapHost.toLowerCase().includes('gmail.com') ||
    formData.emailUser.toLowerCase().includes('@gmail.com');

  // Real IMAP Connection Test
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setFetchError(null);

    const res = await ImapClient.testConnection(formData);
    setIsTesting(false);
    setTestResult(res);

    if (res.ok) {
      setFormData((prev) => ({ ...prev, connected: true }));
      onSaveConfig({ ...formData, connected: true });
    }
  };

  // Real IMAP Fetch Emails
  const handleFetchEmails = async () => {
    setIsFetching(true);
    setFetchError(null);
    setFetchSuccessMessage(null);

    const res = await ImapClient.fetchEmails(formData, { limit: 25 });
    setIsFetching(false);

    if (res.ok && res.emails) {
      setFetchedEmails(res.emails);
      setActiveTab('fetched');

      // Auto-analyze and ingest into delegates
      let updatedCount = 0;
      res.emails.forEach((msg) => {
        if (msg.fromEmail && msg.textBody) {
          onSimulateReply(msg.fromEmail, msg.subject, msg.textBody, msg.fromName);
          updatedCount++;
        }
      });

      setFetchSuccessMessage(
        `Successfully pulled ${res.emails.length} emails from ${formData.emailUser}. Ingested and updated ${updatedCount} responses into your guest dossiers!`
      );
      if (onRealEmailsFetched) onRealEmailsFetched(res.emails.length);
    } else {
      setFetchError(res.error || 'Failed to fetch emails from mail server.');
    }
  };

  // Ingest a single fetched email
  const handleIngestSingleEmail = (msg: FetchedEmailItem) => {
    onSimulateReply(msg.fromEmail, msg.subject, msg.textBody, msg.fromName);
    setFetchSuccessMessage(
      `Analyzed and synced email from "${msg.fromName || msg.fromEmail}" into roster.`
    );
    setTimeout(() => setFetchSuccessMessage(null), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Auto-clean spaces from password
    const cleanedConfig = {
      ...formData,
      appPassword: formData.appPassword.replace(/\s+/g, ''),
    };
    onSaveConfig(cleanedConfig);
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
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
      <div className="fixed inset-0 bg-[#07241A]/50 backdrop-blur-xs" onClick={onClose} />

      <div
        className="relative w-full max-w-3xl bg-[#FBFBFA] rounded border border-[#E2DFD7] shadow-2xl overflow-hidden z-10 text-[#1D1C16]"
        style={{
          boxShadow:
            '0 20px 25px -5px rgba(21, 42, 32, 0.2), 0 10px 10px -5px rgba(21, 42, 32, 0.1)',
        }}
      >
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-[#EBE8E1] bg-[#F5F4F0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#D8EEDF] rounded text-[#1E3A2F]">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-semibold text-lg text-[#1D1C16]">
                IMAP Mailbox Connection & Live Reader
              </h3>
              <p className="text-[11px] text-[#8F8C84]">
                Direct real-time connection to your email inbox for automatic attendee RSVP tracking.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8F8C84] hover:text-[#1D1C16] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation: Config, Real Inbound Feed, Manual Sandbox */}
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
            onClick={() => setActiveTab('fetched')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'fetched'
                ? 'border-[#1E3A2F] text-[#1E3A2F]'
                : 'border-transparent text-[#8F8C84] hover:text-[#1D1C16]'
            }`}
          >
            <Inbox className="w-3.5 h-3.5 text-[#1E3A2F]" />
            <span>2. Live Inbound Mailbox Feed ({fetchedEmails.length})</span>
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
            <span>3. Test Sandbox & Attribute Parser</span>
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
          {/* Active Connection & Live Action Bar */}
          <div className="p-3.5 bg-[#FAF8F5] border border-[#E2DFD7] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  formData.appPassword ? 'bg-[#2E7D52] animate-ping' : 'bg-[#C2BFB6]'
                }`}
              />
              <div>
                <span className="font-semibold text-xs text-[#1D1C16] block">
                  Active Mailbox: {formData.emailUser || 'Not configured'}
                </span>
                <span className="text-[10px] text-[#525048] font-mono">
                  {formData.imapHost}:{formData.imapPort} (SSL) • Auto-sync interval: {formData.autoSyncIntervalSec}s
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !formData.emailUser || !formData.appPassword}
                className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-[#E2DFD7] text-[#1D1C16] rounded hover:border-[#1E3A2F] hover:bg-[#F5F4F0] disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Verify IMAP connection against real mail server"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-[#1E3A2F]' : ''}`} />
                <span>{isTesting ? 'Testing Server...' : 'Test Connection'}</span>
              </button>

              <button
                type="button"
                onClick={handleFetchEmails}
                disabled={isFetching || !formData.emailUser || !formData.appPassword}
                className="px-3 py-1.5 text-xs font-semibold bg-[#1E3A2F] text-[#FBFBFA] rounded hover:bg-[#2E7D52] disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Connect to IMAP server and fetch recent emails into the app"
              >
                <ArrowDownToLine className={`w-3.5 h-3.5 ${isFetching ? 'animate-bounce' : ''}`} />
                <span>{isFetching ? 'Reading Mailbox...' : 'Fetch Real Emails Now'}</span>
              </button>
            </div>
          </div>

          {/* Test Connection Results Banner */}
          {testResult && testResult.ok && (
            <div className="p-3 bg-[#D8EEDF] text-[#2E7D52] rounded border border-[#2E7D52]/40 font-medium flex items-start gap-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block">IMAP Authentication Successful!</strong>
                <p className="text-[11px] text-[#1E3A2F] mt-0.5">
                  Connected to {formData.imapHost}. Your INBOX has{' '}
                  <strong>{testResult.totalMessages ?? 0} total messages</strong> ({testResult.unseenCount ?? 0} unread). The system is ready to auto-read incoming invitation replies!
                </p>
              </div>
            </div>
          )}

          {testResult && !testResult.ok && (
            <div className="p-3.5 bg-[#FBE3DE] text-[#B83A2C] rounded border border-[#B83A2C]/30 space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#B83A2C]" />
                <div className="space-y-1">
                  <strong className="font-semibold block">IMAP Connection Error</strong>
                  <p className="text-[11px] leading-relaxed">{testResult.error}</p>
                </div>
              </div>

              {isGmail && (
                <div className="bg-white/80 p-2.5 rounded border border-[#B83A2C]/20 text-[11px] text-[#525048] space-y-1 mt-2">
                  <span className="font-semibold text-[#1D1C16] block">
                    Important for Gmail Users:
                  </span>
                  <ol className="list-decimal pl-4 space-y-0.5">
                    <li>
                      Ensure <strong>2-Step Verification</strong> is ON in your Google Account.
                    </li>
                    <li>
                      Generate a <strong>16-character App Password</strong> at{' '}
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#1E3A2F] font-semibold underline inline-flex items-center gap-0.5"
                      >
                        myaccount.google.com/apppasswords
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </li>
                    <li>
                      Paste the 16 characters in the App Password field (spaces are automatically removed).
                    </li>
                    <li>
                      In Gmail Settings &gt; Forwarding and POP/IMAP, ensure <strong>Enable IMAP</strong> is selected.
                    </li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {fetchError && (
            <div className="p-3 bg-[#FBE3DE] text-[#B83A2C] rounded border border-[#B83A2C]/30 flex items-start gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Error fetching emails:</strong> {fetchError}
              </div>
            </div>
          )}

          {fetchSuccessMessage && (
            <div className="p-3 bg-[#D8EEDF] text-[#2E7D52] rounded border border-[#2E7D52]/40 flex items-start gap-2 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{fetchSuccessMessage}</div>
            </div>
          )}

          {/* TAB 1: SINGLE UNIFIED IMAP SETTING */}
          {activeTab === 'config' && (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Helpful Gmail Callout Banner */}
              {isGmail && (
                <div className="p-3.5 bg-[#FAF8F5] rounded border border-[#E2DFD7] space-y-2">
                  <div className="flex items-center gap-2 text-[#1E3A2F]">
                    <HelpCircle className="w-4 h-4 text-[#2E7D52]" />
                    <span className="font-semibold text-xs">Connecting Gmail with IMAP</span>
                  </div>
                  <p className="text-[11px] text-[#525048] leading-relaxed">
                    Google accounts require a dedicated <strong>App Password</strong> for IMAP access instead of your regular Google password:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                    <div className="p-2 bg-white rounded border border-[#E2DFD7]">
                      <span className="font-semibold block text-[#1D1C16]">1. Enable 2-Step Verification</span>
                      <span className="text-[#8F8C84] text-[10px]">Turn ON in your Google Account Security settings.</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-[#E2DFD7]">
                      <span className="font-semibold block text-[#1D1C16]">2. Generate App Password</span>
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#2E7D52] text-[10px] font-semibold underline inline-flex items-center gap-0.5"
                      >
                        Open Google App Passwords
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <div className="p-2 bg-white rounded border border-[#E2DFD7]">
                      <span className="font-semibold block text-[#1D1C16]">3. Paste 16 Characters</span>
                      <span className="text-[#8F8C84] text-[10px]">Paste below (spaces are automatically stripped).</span>
                    </div>
                  </div>
                </div>
              )}

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
                    onChange={(e) =>
                      setFormData({ ...formData, appPassword: e.target.value })
                    }
                    placeholder="Enter 16-character App Password"
                    className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none focus:border-[#1E3A2F] font-mono"
                  />
                  <span className="text-[9px] text-[#8F8C84] mt-0.5 block">
                    Copy and paste as-is (e.g. "abcd efgh ijkl mnop"). Spaces are safely stripped.
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
                  Automatic Background Polling Interval
                </label>
                <select
                  value={formData.autoSyncIntervalSec}
                  onChange={(e) =>
                    setFormData({ ...formData, autoSyncIntervalSec: Number(e.target.value) })
                  }
                  className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none"
                >
                  <option value={15}>Every 15 seconds (High Frequency live monitoring)</option>
                  <option value={30}>Every 30 seconds (Recommended standard)</option>
                  <option value={60}>Every 60 seconds (Relaxed)</option>
                </select>
                <span className="text-[10px] text-[#8F8C84] mt-0.5 block">
                  The app will automatically check your mailbox in the background and update attendee statuses as replies arrive.
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#EBE8E1]">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !formData.emailUser || !formData.appPassword}
                  className="px-3 py-1.5 text-xs font-medium text-[#1E3A2F] border border-[#E2DFD7] rounded hover:bg-[#F5F4F0] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Testing...' : 'Test IMAP Connection'}</span>
                </button>

                <div className="flex gap-2">
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
                    Save &amp; Start Live Reading
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: LIVE INBOUND MAILBOX FEED */}
          {activeTab === 'fetched' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h4 className="font-serif font-semibold text-xs text-[#1D1C16]">
                    Recent Inbound Emails from {formData.emailUser}
                  </h4>
                  <p className="text-[10px] text-[#8F8C84]">
                    Real messages pulled directly from your mailbox via IMAP SSL.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleFetchEmails}
                  disabled={isFetching}
                  className="px-2.5 py-1 text-xs font-medium bg-white border border-[#E2DFD7] rounded text-[#1E3A2F] hover:bg-[#F5F4F0] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
                  <span>Refresh Feed</span>
                </button>
              </div>

              {fetchedEmails.length === 0 ? (
                <div className="p-8 text-center bg-[#FAF8F5] rounded border border-[#E2DFD7] space-y-2">
                  <Inbox className="w-8 h-8 text-[#8F8C84] mx-auto opacity-60" />
                  <p className="text-xs font-medium text-[#1D1C16]">No emails fetched yet</p>
                  <p className="text-[11px] text-[#8F8C84] max-w-sm mx-auto">
                    Click "Fetch Real Emails Now" above to connect to your live mailbox and retrieve incoming attendee responses.
                  </p>
                  <button
                    type="button"
                    onClick={handleFetchEmails}
                    disabled={isFetching || !formData.emailUser || !formData.appPassword}
                    className="mt-2 px-3 py-1.5 text-xs font-semibold bg-[#1E3A2F] text-white rounded hover:bg-[#2E7D52] cursor-pointer disabled:opacity-50"
                  >
                    Fetch Real Emails Now
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                  {fetchedEmails.map((msg) => {
                    const analysis = MailAnalyzer.analyzeEmail(
                      msg.fromEmail,
                      msg.subject,
                      msg.textBody,
                      msg.fromName
                    );

                    return (
                      <div
                        key={msg.uid}
                        className="p-3 bg-white rounded border border-[#E2DFD7] hover:border-[#1E3A2F] transition-all space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-[#1D1C16]">
                                {msg.fromName || msg.fromEmail}
                              </span>
                              <span className="text-[10px] text-[#8F8C84] font-mono">
                                &lt;{msg.fromEmail}&gt;
                              </span>
                            </div>
                            <h5 className="font-medium text-xs text-[#424844] mt-0.5">
                              {msg.subject}
                            </h5>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                                analysis.detectedIntent === 'attending'
                                  ? 'bg-[#D8EEDF] text-[#2E7D52]'
                                  : analysis.detectedIntent === 'declined'
                                  ? 'bg-[#FBE3DE] text-[#B83A2C]'
                                  : 'bg-[#F4E7C5] text-[#976508]'
                              }`}
                            >
                              {analysis.detectedIntent}
                            </span>
                            <span className="text-[10px] text-[#8F8C84] font-mono">
                              {new Date(msg.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-[#525048] line-clamp-2 leading-relaxed bg-[#FAF8F5] p-2 rounded">
                          {msg.snippet || msg.textBody}
                        </p>

                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-2 text-[10px] text-[#8F8C84]">
                            {analysis.extractedAttributes.dietary && (
                              <span className="text-[#2E7D52] font-medium">
                                Dietary: {analysis.extractedAttributes.dietary}
                              </span>
                            )}
                            {analysis.extractedAttributes.arrivalFlight && (
                              <span className="text-[#1E3A2F] font-mono">
                                Flight: {analysis.extractedAttributes.arrivalFlight}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleIngestSingleEmail(msg)}
                            className="px-2 py-1 text-[10px] font-semibold bg-[#D8EEDF] text-[#2E7D52] rounded hover:bg-[#2E7D52] hover:text-white transition-colors cursor-pointer"
                          >
                            Sync to Delegate Dossier
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TEST SANDBOX & ATTRIBUTE PARSER */}
          {activeTab === 'analyzer' && (
            <div className="space-y-4">
              <div className="bg-[#FAF8F5] p-3 rounded border border-[#E2DFD7] space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-semibold text-xs text-[#1D1C16] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#2E7D52]" />
                    <span>Inbound Email Reading & Attribute Parser Sandbox</span>
                  </h4>
                  <span className="text-[10px] font-mono font-semibold text-[#2E7D52]">
                    Reading {formData.emailUser}
                  </span>
                </div>
                <p className="text-[11px] text-[#424844] leading-relaxed">
                  Test custom email responses to see how the natural language model extracts RSVP status, flight numbers, Jain/Veg meal preferences, and hotel room requirements.
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
                    <span>Apply Analysis &amp; Update Master Roster</span>
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
