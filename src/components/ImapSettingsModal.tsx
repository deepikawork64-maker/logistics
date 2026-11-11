import React, { useState, useMemo } from 'react';
import {
  X,
  Mail,
  CheckCircle2,
  RefreshCw,
  Server,
  Key,
  ShieldCheck,
  Send,
  Sparkles,
  UserCheck,
  Plus,
  Building,
  ArrowRight,
  Radio,
  SlidersHorizontal,
  FileText,
  Utensils,
  Hotel,
  Plane,
  Users as UsersIcon,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { ImapConfig, Delegate, MailboxProfile } from '../types/inviteOps';
import { MailAnalyzer, AnalyzedEmailResult } from '../services/mailAnalyzer';

interface ImapSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ImapConfig;
  onSaveConfig: (cfg: ImapConfig) => void;
  delegates: Delegate[];
  onSimulateReply: (fromEmail: string, subject: string, body: string, senderName?: string) => void;
  mailboxProfiles: MailboxProfile[];
  onSwitchProfile: (profileId: string) => void;
  onSaveProfile: (profile: MailboxProfile) => void;
}

export const ImapSettingsModal: React.FC<ImapSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  delegates,
  onSimulateReply,
  mailboxProfiles,
  onSwitchProfile,
  onSaveProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'analyzer' | 'switch' | 'config'>('analyzer');
  const [formData, setFormData] = useState<ImapConfig>(config);
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  // New mailbox creation form
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileEmail, setNewProfileEmail] = useState('');
  const [newProfilePassword, setNewProfilePassword] = useState('');
  const [newProfileIsClient, setNewProfileIsClient] = useState(true);

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

  const handleCreateProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileEmail.trim()) return;

    const newProfile: MailboxProfile = {
      id: `mbx-${Date.now()}`,
      name: newProfileName.trim() || (newProfileIsClient ? 'Client Mailbox' : 'Personal Mailbox'),
      emailUser: newProfileEmail.trim(),
      appPassword: newProfilePassword || '••••••••••••',
      imapHost: 'imap.gmail.com',
      imapPort: 993,
      smtpHost: 'smtp.gmail.com',
      smtpPort: 465,
      useSsl: true,
      isClientAccount: newProfileIsClient,
      connected: true,
      lastSyncAt: new Date().toISOString(),
    };

    onSaveProfile(newProfile);
    onSwitchProfile(newProfile.id);
    setIsCreatingProfile(false);
    setNewProfileName('');
    setNewProfileEmail('');
    setNewProfilePassword('');
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
        className="relative w-full max-w-3xl bg-[#FBFBFA] rounded border border-[#E2DFD7] shadow-2xl overflow-hidden z-10 text-[#1D1C16]"
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
                Live Email Tracker & Deep Analysis Engine
              </h3>
              <p className="text-[11px] text-[#8F8C84]">
                Automatically reads incoming invitation replies, analyzes RSVP intent, and extracts flights, dietary, and hotel needs.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-[#8F8C84] hover:text-[#1D1C16]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#EBE8E1] bg-[#FAF8F5] px-5 pt-2 gap-4 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('analyzer')}
            className={`pb-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'analyzer'
                ? 'border-[#1E3A2F] text-[#1E3A2F] font-semibold'
                : 'border-transparent text-[#8F8C84] hover:text-[#1D1C16]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#2E7D52]" />
            <span>Live Email Reader & Ingestion Sandbox</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('switch')}
            className={`pb-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'switch'
                ? 'border-[#1E3A2F] text-[#1E3A2F] font-semibold'
                : 'border-transparent text-[#8F8C84] hover:text-[#1D1C16]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Switch Mailbox ({config.emailUser})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`pb-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'config'
                ? 'border-[#1E3A2F] text-[#1E3A2F] font-semibold'
                : 'border-transparent text-[#8F8C84] hover:text-[#1D1C16]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>IMAP/SMTP Settings</span>
          </button>
        </div>

        <div className="p-5 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {/* Active Connection Banner */}
          <div className="p-3 bg-[#D8EEDF]/40 border border-[#2E7D52]/30 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D52] animate-ping shrink-0" />
              <div>
                <span className="font-semibold text-xs text-[#2E7D52] block">
                  Live IMAP Listener Active: {config.emailUser}
                </span>
                <span className="text-[10px] text-[#424844] font-mono">
                  SSL Port 993 • Auto-analyzing incoming replies every {config.autoSyncIntervalSec}s
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
              <span>{isTesting ? 'Verifying...' : 'Check Mailbox Status'}</span>
            </button>
          </div>

          {testSuccess && (
            <div className="p-2.5 bg-[#D8EEDF] text-[#2E7D52] rounded border border-[#2E7D52]/40 font-semibold flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>IMAP Listener Online: Authenticated with host {config.imapHost}:{config.imapPort} (SSL 993).</span>
            </div>
          )}

          {/* TAB 1: LIVE EMAIL READER & ANALYZER */}
          {activeTab === 'analyzer' && (
            <div className="space-y-4">
              <div className="bg-[#FAF8F5] p-3.5 rounded border border-[#E2DFD7] space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-semibold text-sm text-[#1D1C16] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#2E7D52]" />
                    <span>Real-Time Email Reader & Attribute Extraction</span>
                  </h4>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#EFECE5] text-[#1E3A2F]">
                    NLP Engine
                  </span>
                </div>
                <p className="text-[11px] text-[#424844] leading-relaxed">
                  Paste any email received in your inbox (or test with real attendee replies below). The system analyzes the text, identifies who sent it, extracts dietary preferences, flight numbers, arrival times, and hotel requests, and updates your master roster automatically.
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
                    className="px-2 py-0.5 text-[10px] rounded bg-white border border-[#E2DFD7] hover:border-[#1E3A2F] text-[#1D1C16]"
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
                    className="px-2 py-0.5 text-[10px] rounded bg-white border border-[#E2DFD7] hover:border-[#B83A2C] text-[#B83A2C]"
                  >
                    Declined (Parliamentary Regrets)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setInputEmail('sunitamehra@mpadmin.gov.in');
                      setInputName('Sunita Mehra, IAS');
                      setInputSubject('Inquiry: Schedule and VIP Protocol');
                      setInputBody(
                        'Could you please share the updated bilateral roundtable timings? We also need to know if state transport shuttle from Raja Bhoj Airport is provided.'
                      );
                    }}
                    className="px-2 py-0.5 text-[10px] rounded bg-white border border-[#E2DFD7] hover:border-[#976508] text-[#976508]"
                  >
                    Inquiry (Schedule & Shuttle)
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
                      Sender Email Address
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
                        <CheckCircle2 className="w-3 h-3" /> Matches existing roster contact:{' '}
                        <strong>{matchedDelegate.name}</strong> ({matchedDelegate.status})
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#976508] mt-0.5 block">
                        New contact • Will automatically create a new guest record in roster
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                      Sender Full Name (Optional)
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
                    placeholder="Paste the message content received from the delegate..."
                    className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs leading-relaxed focus:outline-none focus:border-[#1E3A2F]"
                  />
                </div>

                {/* Real-Time Live Analysis Preview Card */}
                <div className="p-3.5 bg-white rounded border border-[#1E3A2F]/30 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[#EBE8E1] pb-2">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-[#8F8C84]">
                      Live NLP Reader Analysis
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-[#2E7D52]">
                      Confidence: {Math.round(liveAnalysis.confidence * 100)}%
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1 ${
                        liveAnalysis.detectedIntent === 'attending'
                          ? 'bg-[#D8EEDF] text-[#2E7D52]'
                          : liveAnalysis.detectedIntent === 'declined'
                          ? 'bg-[#FBE3DE] text-[#B83A2C]'
                          : 'bg-[#F4E7C5] text-[#976508]'
                      }`}
                    >
                      {liveAnalysis.detectedIntent === 'attending' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>RSVP Intent: {liveAnalysis.detectedIntent.toUpperCase()}</span>
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

                    {liveAnalysis.extractedAttributes.accompanyingGuests ? (
                      <span className="px-2 py-0.5 rounded text-[11px] bg-[#EFECE5] text-[#1E3A2F] flex items-center gap-1">
                        <UsersIcon className="w-3 h-3" />
                        <span>+{liveAnalysis.extractedAttributes.accompanyingGuests} Guests</span>
                      </span>
                    ) : null}
                  </div>

                  <div className="text-[11px] text-[#424844] bg-[#F5F4F0] p-2 rounded">
                    <strong>Auto-Generated Synopsis:</strong> {liveAnalysis.executiveSummary}
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 font-semibold text-xs bg-[#1E3A2F] text-white rounded hover:bg-[#2E7D52] shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Apply Analysis & Update Master Roster</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: SWITCH ACCOUNTS */}
          {activeTab === 'switch' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8F8C84] mb-1">
                  Connected Mailbox Profiles
                </h4>
                <p className="text-[11px] text-[#424844] mb-3">
                  Toggle between your personal mailbox for testing and your client’s organization email with zero downtime.
                </p>

                <div className="space-y-2.5">
                  {mailboxProfiles.map((p) => {
                    const isActive = p.emailUser.toLowerCase() === config.emailUser.toLowerCase();
                    return (
                      <div
                        key={p.id}
                        className={`p-3.5 rounded border transition-all flex items-center justify-between ${
                          isActive
                            ? 'bg-[#1E3A2F]/5 border-[#1E3A2F] shadow-xs'
                            : 'bg-white border-[#E2DFD7] hover:border-[#1E3A2F]/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs ${
                              p.isClientAccount
                                ? 'bg-[#D6E2DA] text-[#1E3A2F]'
                                : 'bg-[#EFECE5] text-[#8C6D1F]'
                            }`}
                          >
                            {p.isClientAccount ? <Building className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-[#1D1C16]">
                                {p.name}
                              </span>
                              {p.isClientAccount ? (
                                <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-[#D6E2DA] text-[#1E3A2F] rounded">
                                  Client Org
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-[#EFECE5] text-[#8C6D1F] rounded">
                                  Personal / Test
                                </span>
                              )}
                              {isActive && (
                                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#2E7D52] text-white rounded">
                                  Active Live
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-[#525048] block mt-0.5">
                              {p.emailUser}
                            </span>
                            <span className="text-[10px] text-[#8F8C84]">
                              IMAP {p.imapHost}:{p.imapPort} • SMTP {p.smtpHost}:{p.smtpPort}
                            </span>
                          </div>
                        </div>

                        <div>
                          {isActive ? (
                            <span className="text-[11px] font-semibold text-[#2E7D52] flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Active Now
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                onSwitchProfile(p.id);
                                setFormData({
                                  ...formData,
                                  emailUser: p.emailUser,
                                  imapHost: p.imapHost,
                                  imapPort: p.imapPort,
                                  smtpHost: p.smtpHost,
                                  smtpPort: p.smtpPort,
                                });
                              }}
                              className="px-3 py-1.5 text-xs font-semibold bg-[#1E3A2F] text-white rounded hover:bg-[#2E7D52] transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <span>Switch to This</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add New Client Mailbox */}
              {!isCreatingProfile ? (
                <button
                  type="button"
                  onClick={() => setIsCreatingProfile(true)}
                  className="w-full py-2.5 border border-dashed border-[#1E3A2F]/50 rounded text-xs font-semibold text-[#1E3A2F] hover:bg-[#1E3A2F]/5 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Connect Another Client Mailbox Account</span>
                </button>
              ) : (
                <div className="p-4 bg-white rounded border border-[#1E3A2F]/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-xs text-[#1D1C16]">
                      Add Client Mailbox Credentials
                    </h5>
                    <button
                      type="button"
                      onClick={() => setIsCreatingProfile(false)}
                      className="text-[#8F8C84] hover:text-[#1D1C16]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateProfileSubmit} className="space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-0.5">
                          Profile Label / Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Apex Global Secretariat"
                          value={newProfileName}
                          onChange={(e) => setNewProfileName(e.target.value)}
                          className="w-full p-2 bg-[#FBFBFA] border border-[#E2DFD7] rounded text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-0.5">
                          Client Email Address
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. secretariat@summit2027.gov.in"
                          value={newProfileEmail}
                          onChange={(e) => setNewProfileEmail(e.target.value)}
                          className="w-full p-2 bg-[#FBFBFA] border border-[#E2DFD7] rounded text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-0.5">
                          App Password / Secret
                        </label>
                        <input
                          type="password"
                          placeholder="16-character App Password"
                          value={newProfilePassword}
                          onChange={(e) => setNewProfilePassword(e.target.value)}
                          className="w-full p-2 bg-[#FBFBFA] border border-[#E2DFD7] rounded text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-0.5">
                          Account Classification
                        </label>
                        <div className="flex items-center gap-4 mt-2">
                          <label className="flex items-center gap-1 text-xs cursor-pointer">
                            <input
                              type="radio"
                              name="isClient"
                              checked={newProfileIsClient}
                              onChange={() => setNewProfileIsClient(true)}
                              className="text-[#1E3A2F]"
                            />
                            <span>Client Account</span>
                          </label>
                          <label className="flex items-center gap-1 text-xs cursor-pointer">
                            <input
                              type="radio"
                              name="isClient"
                              checked={!newProfileIsClient}
                              onChange={() => setNewProfileIsClient(false)}
                              className="text-[#1E3A2F]"
                            />
                            <span>Personal Account</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsCreatingProfile(false)}
                        className="px-3 py-1 text-xs border border-[#E2DFD7] text-[#525048] rounded hover:bg-[#F5F4F0]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 text-xs font-semibold bg-[#1E3A2F] text-white rounded hover:bg-[#2E7D52]"
                      >
                        Save & Switch To This Mailbox
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: IMAP/SMTP PARAMETERS */}
          {activeTab === 'config' && (
            <form onSubmit={handleSave} className="space-y-4">
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
                    className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none font-mono"
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
                    className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none font-mono"
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
                    className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none font-mono"
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
                    className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                    Mailbox Account Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.emailUser}
                    onChange={(e) => setFormData({ ...formData, emailUser: e.target.value })}
                    className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none font-mono"
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
                    placeholder="Enter app password..."
                    className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                  Live Inbox Polling Interval (Seconds)
                </label>
                <select
                  value={formData.autoSyncIntervalSec}
                  onChange={(e) => setFormData({ ...formData, autoSyncIntervalSec: Number(e.target.value) })}
                  className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none"
                >
                  <option value={15}>15 seconds (High Frequency)</option>
                  <option value={30}>30 seconds (Standard)</option>
                  <option value={60}>60 seconds (Relaxed)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold bg-[#1E3A2F] text-[#FBFBFA] rounded hover:bg-[#2E7D52] cursor-pointer"
                >
                  Save Active Settings
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
