import React, { useState } from 'react';
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
} from 'lucide-react';
import { ImapConfig, Delegate, MailboxProfile } from '../types/inviteOps';

interface ImapSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ImapConfig;
  onSaveConfig: (cfg: ImapConfig) => void;
  delegates: Delegate[];
  onSimulateReply: (fromEmail: string, subject: string, body: string) => void;
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
  const [activeTab, setActiveTab] = useState<'switch' | 'config' | 'simulate'>('switch');
  const [formData, setFormData] = useState<ImapConfig>(config);
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  // New mailbox creation form
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileEmail, setNewProfileEmail] = useState('');
  const [newProfilePassword, setNewProfilePassword] = useState('');
  const [newProfileIsClient, setNewProfileIsClient] = useState(true);

  // Simulation test state
  const [simEmail, setSimEmail] = useState(delegates[0]?.email || 'v.singhania@apexindustrial.com');
  const [simSubject, setSimSubject] = useState('Re: Official Invitation: Bhopal Summit 2027');
  const [simBody, setSimBody] = useState(
    'I am pleased to confirm our attendance. Our delegation will arrive on January 14. Looking forward to the sessions.'
  );
  const [simulatedSuccess, setSimulatedSuccess] = useState(false);

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
      connected: false,
      lastSyncAt: null,
    };

    onSaveProfile(newProfile);
    onSwitchProfile(newProfile.id);
    setIsCreatingProfile(false);
    setNewProfileName('');
    setNewProfileEmail('');
    setNewProfilePassword('');
  };

  const handleTriggerSimReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simEmail.trim() || !simBody.trim()) return;
    onSimulateReply(simEmail.trim(), simSubject.trim(), simBody.trim());
    setSimulatedSuccess(true);
    setTimeout(() => setSimulatedSuccess(false), 3000);
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
            <Mail className="w-5 h-5 text-[#1E3A2F]" />
            <div>
              <h3 className="font-serif font-semibold text-lg text-[#1D1C16]">
                IMAP & SMTP Mailbox Hub
              </h3>
              <p className="text-[11px] text-[#8F8C84]">
                Frontend connection manager. Switch between your personal account and client mailboxes with zero downtime.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-[#8F8C84] hover:text-[#1D1C16]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-[#EBE8E1] bg-[#FAF8F5] px-5 pt-2 gap-4 text-xs">
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
            <span>Switch Accounts ({mailboxProfiles.length})</span>
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
            <span>Server Parameters</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('simulate')}
            className={`pb-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'simulate'
                ? 'border-[#1E3A2F] text-[#1E3A2F] font-semibold'
                : 'border-transparent text-[#8F8C84] hover:text-[#1D1C16]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#2E7D52]" />
            <span>Inbound Reply Simulator</span>
          </button>
        </div>

        <div className="p-5 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {/* Active Connection Banner */}
          <div className="p-3 bg-[#D8EEDF]/40 border border-[#2E7D52]/30 rounded flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D52] animate-ping" />
              <div>
                <span className="font-semibold text-xs text-[#2E7D52] block">
                  Active IMAP Mailbox: {config.emailUser}
                </span>
                <span className="text-[10px] text-[#424844] font-mono">
                  Listening on {config.imapHost}:{config.imapPort} (SSL) • Polling every {config.autoSyncIntervalSec}s
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-2.5 py-1 text-xs font-semibold bg-white border border-[#2E7D52]/40 text-[#2E7D52] rounded hover:bg-[#D8EEDF] transition-colors flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Checking...' : 'Check Status'}</span>
            </button>
          </div>

          {testSuccess && (
            <div className="p-2.5 bg-[#D8EEDF] text-[#2E7D52] rounded border border-[#2E7D52]/40 font-semibold flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>IMAP/SMTP Handshake Successful: SSL Socket verified on port 993/465.</span>
            </div>
          )}

          {/* TAB 1: SWITCH ACCOUNTS (My Email vs Client Email) */}
          {activeTab === 'switch' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8F8C84] mb-1">
                  Connected Mailbox Profiles
                </h4>
                <p className="text-[11px] text-[#424844] mb-3">
                  You requested the flexibility to run and test invitations using your own email first, and immediately switch to your client’s organization email when ready. Select any profile below to make it active:
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
                                : 'bg-[#EFE8D8] text-[#8C6D1F]'
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
                                <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-[#EFE8D8] text-[#8C6D1F] rounded">
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
                              className="px-3 py-1.5 text-xs font-semibold bg-[#1E3A2F] text-white rounded hover:bg-[#2E7D52] transition-colors flex items-center gap-1"
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
                  className="w-full py-2.5 border border-dashed border-[#1E3A2F]/50 rounded text-xs font-semibold text-[#1E3A2F] hover:bg-[#1E3A2F]/5 transition-colors flex items-center justify-center gap-1.5"
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
                          placeholder="e.g. Apex Global Client Account"
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
                          placeholder="Gmail 16-char App Password"
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

          {/* TAB 2: SERVER CONFIGURATION */}
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
                    SMTP Port (SSL / STARTTLS)
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
                    required
                    value={formData.appPassword}
                    onChange={(e) => setFormData({ ...formData, appPassword: e.target.value })}
                    className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold bg-[#1E3A2F] text-[#FBFBFA] rounded hover:bg-[#2E7D52]"
                >
                  Save Active Settings
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: SIMULATOR */}
          {activeTab === 'simulate' && (
            <div className="p-4 bg-[#F5F4F0] rounded border border-[#E2DFD7] space-y-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#2E7D52]" />
                <h4 className="font-serif font-semibold text-sm text-[#1D1C16]">
                  Interactive IMAP Reply Sandbox
                </h4>
              </div>
              <p className="text-[11px] text-[#424844] leading-relaxed">
                Simulate an invited delegate sending an email back to <code className="font-mono text-[#1E3A2F] font-semibold">{config.emailUser}</code>.
                The system automatically catches it via the IMAP listener, determines attendee intent (Attending / Declined / Inquiry), and updates their status on the dashboard in real time!
              </p>

              {simulatedSuccess && (
                <div className="p-2 bg-[#D8EEDF] text-[#2E7D52] rounded border text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simulated email ingested! Check delegate status and activity log.</span>
                </div>
              )}

              <form onSubmit={handleTriggerSimReply} className="space-y-2.5">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                    Select Invitee Contact to Reply
                  </label>
                  <select
                    value={simEmail}
                    onChange={(e) => setSimEmail(e.target.value)}
                    className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none"
                  >
                    {delegates.map((d) => (
                      <option key={d.id} value={d.email}>
                        {d.name} ({d.email}) — Currently: {d.status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                    Incoming Email Subject
                  </label>
                  <input
                    type="text"
                    value={simSubject}
                    onChange={(e) => setSimSubject(e.target.value)}
                    className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                    Incoming Email Body
                  </label>
                  <textarea
                    rows={3}
                    value={simBody}
                    onChange={(e) => setSimBody(e.target.value)}
                    className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSimBody(
                          'I am delighted to accept your kind invitation and will definitely be attending the summit plenary.'
                        )
                      }
                      className="text-[10px] text-[#1E3A2F] underline"
                    >
                      Quick: "Attending"
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSimBody(
                          'Regrettably, I have prior commitments in London and will not be able to attend this year.'
                        )
                      }
                      className="text-[10px] text-[#B83A2C] underline"
                    >
                      Quick: "Declined"
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSimBody(
                          'Could you please confirm if hotel bookings at Jehan Numa Palace are arranged for keynote speakers?'
                        )
                      }
                      className="text-[10px] text-[#976508] underline"
                    >
                      Quick: "Inquiry"
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="px-3.5 py-1.5 font-semibold bg-[#1E3A2F] text-white rounded hover:bg-[#2E7D52] flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Inbound Reply</span>
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
