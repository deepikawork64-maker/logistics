/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopCommandBar } from './components/TopCommandBar';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { DelegatesTableView } from './components/DelegatesTableView';
import { DocumentRegistryView } from './components/DocumentRegistryView';
import { TicketsView } from './components/TicketsView';
import { DelegateDossierDrawer } from './components/DelegateDossierDrawer';
import { TicketDetailDrawer } from './components/TicketDetailDrawer';
import { DocUploadModal } from './components/DocUploadModal';
import { SendCampaignModal } from './components/SendCampaignModal';
import { ImapSettingsModal } from './components/ImapSettingsModal';
import { GoogleFormSettingsModal } from './components/GoogleFormSettingsModal';
import { IngestEmailModal } from './components/IngestEmailModal';
import { PowerBiExportModal } from './components/PowerBiExportModal';

import { InviteStorage } from './services/inviteStorage';
import { OpsStorage } from './services/storage';
import {
  Delegate,
  UploadedDocument,
  ActivityEvent,
  Campaign,
  ImapConfig,
  GoogleFormConfig,
  RsvpStatus,
  MailboxProfile,
} from './types/inviteOps';
import { TicketRequest, TicketMessage, StatusHistoryEntry, User } from './types/system';
import { CheckCircle2, AlertOctagon } from 'lucide-react';

export default function App() {
  const [initialized, setInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'delegates' | 'documents' | 'tickets' | 'audit'>('dashboard');

  // Invitation & Delegate State
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [imapConfig, setImapConfig] = useState<ImapConfig>(InviteStorage.getImapConfig());
  const [mailboxProfiles, setMailboxProfiles] = useState<MailboxProfile[]>(InviteStorage.getMailboxProfiles());
  const [gformConfig, setGformConfig] = useState<GoogleFormConfig>(InviteStorage.getGoogleFormConfig());
  const [selectedDelegate, setSelectedDelegate] = useState<Delegate | null>(null);

  // Ticketing & User State
  const [currentUser, setCurrentUser] = useState<User>(OpsStorage.getActiveUser());
  const [requests, setRequests] = useState<TicketRequest[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketRequest | null>(null);

  // Modals State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [isImapModalOpen, setIsImapModalOpen] = useState(false);
  const [isGoogleFormModalOpen, setIsGoogleFormModalOpen] = useState(false);
  const [isTicketIngestOpen, setIsTicketIngestOpen] = useState(false);
  const [isPowerBiModalOpen, setIsPowerBiModalOpen] = useState(false);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [delegatesInitialFilter, setDelegatesInitialFilter] = useState<string>('all');
  const [flashMessage, setFlashMessage] = useState<{ text: string; type: 'success' | 'alert' } | null>(null);

  const showFlash = (text: string, type: 'success' | 'alert' = 'success') => {
    setFlashMessage({ text, type });
    setTimeout(() => setFlashMessage(null), 4000);
  };

  const refreshInviteData = useCallback(() => {
    setDelegates(InviteStorage.getDelegates());
    setDocuments(InviteStorage.getDocuments());
    setActivities(InviteStorage.getActivities());
    setCampaigns(InviteStorage.getCampaigns());
    setImapConfig(InviteStorage.getImapConfig());
    setMailboxProfiles(InviteStorage.getMailboxProfiles());
    setGformConfig(InviteStorage.getGoogleFormConfig());
    setRequests(OpsStorage.getRequests());
  }, []);

  useEffect(() => {
    InviteStorage.init();
    OpsStorage.init();
    refreshInviteData();
    setInitialized(true);
  }, [refreshInviteData]);

  // Keep selected delegate fresh
  useEffect(() => {
    if (selectedDelegate) {
      const fresh = delegates.find((d) => d.id === selectedDelegate.id);
      if (fresh) setSelectedDelegate(fresh);
    }
  }, [delegates, selectedDelegate?.id]);

  // Document Ingestion
  const handleImportDocument = (
    doc: { fileName: string; fileType: 'csv' | 'xlsx' | 'xls' | 'pdf'; fileSize: string; recordCount: number; status: 'Parsed & Imported'; previewRows?: Record<string, string>[] },
    extractedDelegates: Omit<Delegate, 'id' | 'interactions'>[]
  ) => {
    const { importedCount } = InviteStorage.addUploadedDocument(doc, extractedDelegates);
    refreshInviteData();
    showFlash(`Document "${doc.fileName}" ingested successfully! Merged ${importedCount} new delegates.`);
  };

  // Dispatch Bulk Campaign
  const handleSendCampaign = (
    title: string,
    subject: string,
    body: string,
    formUrl: string,
    recipientIds: string[]
  ) => {
    InviteStorage.sendCampaign(title, subject, body, formUrl, recipientIds);
    refreshInviteData();
    showFlash(`Dispatched invitation campaign to ${recipientIds.length} delegates via SMTP.`);
  };

  // IMAP Inbound Reply Ingestion & Live Reading
  const handleSimulateReply = (
    fromEmail: string,
    subject: string,
    body: string,
    senderName?: string
  ) => {
    const result = InviteStorage.ingestImapReply(fromEmail, subject, body, senderName);
    refreshInviteData();
    showFlash(
      `Email analyzed: [${result.intent.toUpperCase()}] ${result.analysis.executiveSummary}`,
      result.intent === 'declined' ? 'alert' : 'success'
    );
  };

  // Google Form Ingestion
  const handleSimulateFormSubmission = (data: {
    email: string;
    name?: string;
    attending: boolean;
    phone?: string;
    organization?: string;
    designation?: string;
    dietary?: string;
    hotelRequired?: boolean;
    arrivalFlight?: string;
    arrivalTime?: string;
    accompanyingGuests?: number;
    notes?: string;
  }) => {
    const target = InviteStorage.ingestGoogleFormSubmission(data);
    refreshInviteData();
    showFlash(
      `Google Form response synced for ${target.name}! Dietary: ${data.dietary || 'None'}. Status: ${target.status}`,
      data.attending ? 'success' : 'alert'
    );
  };

  // Update Status
  const handleUpdateDelegateStatus = (id: string, status: RsvpStatus, note?: string) => {
    InviteStorage.updateDelegateStatus(id, status, note);
    refreshInviteData();
    showFlash(`Delegate status updated to [${status}]`);
  };

  // Direct 1-on-1 email
  const handleSendDirectEmail = (toEmail: string, subject: string, body: string) => {
    const del = delegates.find((d) => d.email.toLowerCase() === toEmail.toLowerCase());
    if (del) {
      del.interactions.push({
        id: `direct-${Date.now()}`,
        type: 'direct_reply',
        timestamp: new Date().toISOString(),
        subject,
        body,
        from: imapConfig.emailUser,
        to: toEmail,
      });
      InviteStorage.logActivity(
        'email_sent',
        `Direct 1-on-1 Message to ${del.name}`,
        `Subject: ${subject}`,
        del.email
      );
      refreshInviteData();
      showFlash(`1-on-1 Email dispatched to ${del.name} <${toEmail}>`);
    }
  };

  const handleNavigateToDelegates = (filterStatus?: string) => {
    setDelegatesInitialFilter(filterStatus || 'all');
    setActiveTab('delegates');
  };

  const handleOpenCampaignWithSelection = (ids: string[]) => {
    setSelectedCampaignIds(ids);
    setIsCampaignModalOpen(true);
  };

  if (!initialized) return null;

  const totalDelegates = delegates.length;
  const confirmedCount = delegates.filter((d) => d.status === 'Confirmed (Attending)').length;
  const docsCount = documents.length;
  const openTicketsCount = requests.filter((r) => r.is_open).length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FEF9EF] text-[#1D1C16]">
      {/* Sidebar Nav */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        totalDelegates={totalDelegates}
        confirmedCount={confirmedCount}
        docsCount={docsCount}
        openTicketsCount={openTicketsCount}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onOpenCampaign={() => {
          setSelectedCampaignIds([]);
          setIsCampaignModalOpen(true);
        }}
        onOpenImap={() => setIsImapModalOpen(true)}
        onOpenGoogleForm={() => setIsGoogleFormModalOpen(true)}
        onExportExcel={InviteStorage.exportMasterExcel}
        activeMailboxEmail={imapConfig.emailUser}
      />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#FEF9EF]">
        <TopCommandBar
          activeTab={activeTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenUpload={() => setIsUploadModalOpen(true)}
          onOpenCampaign={() => {
            setSelectedCampaignIds([]);
            setIsCampaignModalOpen(true);
          }}
          onOpenImap={() => setIsImapModalOpen(true)}
          onOpenGoogleForm={() => setIsGoogleFormModalOpen(true)}
          onExportExcel={InviteStorage.exportMasterExcel}
          currentUser={currentUser}
          activeMailboxEmail={imapConfig.emailUser}
          onClearAllData={() => {
            InviteStorage.clearAllData();
            OpsStorage.clearAllData();
            refreshInviteData();
            showFlash('All data records cleared. Ready to add your own data!');
          }}
        />

        {/* Global Flash Bar */}
        {flashMessage && (
          <div
            className={`px-4 py-2 text-xs font-semibold flex items-center justify-between border-b transition-all duration-300 ${
              flashMessage.type === 'alert'
                ? 'bg-[#FBE3DE] text-[#B83A2C] border-[#B83A2C]/30'
                : 'bg-[#D8EEDF] text-[#2E7D52] border-[#2E7D52]/30'
            }`}
          >
            <div className="flex items-center gap-2">
              {flashMessage.type === 'alert' ? (
                <AlertOctagon className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span>{flashMessage.text}</span>
            </div>
            <button
              onClick={() => setFlashMessage(null)}
              className="text-[11px] underline opacity-80 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {activeTab === 'dashboard' && (
            <ExecutiveDashboard
              delegates={delegates}
              documents={documents}
              activities={activities}
              campaigns={campaigns}
              onOpenUpload={() => setIsUploadModalOpen(true)}
              onOpenCampaign={() => {
                setSelectedCampaignIds([]);
                setIsCampaignModalOpen(true);
              }}
              onOpenImap={() => setIsImapModalOpen(true)}
              onOpenGoogleForm={() => setIsGoogleFormModalOpen(true)}
              onSelectDelegate={(d) => setSelectedDelegate(d)}
              onNavigateToDelegates={handleNavigateToDelegates}
              onExportExcel={InviteStorage.exportMasterExcel}
            />
          )}

          {activeTab === 'delegates' && (
            <DelegatesTableView
              delegates={delegates}
              documents={documents}
              onSelectDelegate={(d) => setSelectedDelegate(d)}
              onOpenUpload={() => setIsUploadModalOpen(true)}
              onOpenCampaignWithSelection={handleOpenCampaignWithSelection}
              onExportExcel={InviteStorage.exportMasterExcel}
              initialFilterStatus={delegatesInitialFilter}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentRegistryView
              documents={documents}
              delegates={delegates}
              onOpenUpload={() => setIsUploadModalOpen(true)}
              onSelectDelegate={(d) => setSelectedDelegate(d)}
            />
          )}

          {activeTab === 'tickets' && (
            <TicketsView
              requests={requests}
              onSelectTicket={(req) => setSelectedTicket(req)}
              currentUser={currentUser}
              onOpenIngestModal={() => setIsTicketIngestOpen(true)}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          )}
        </main>
      </div>

      {/* Slide-over Inspection Drawer for Delegate */}
      <DelegateDossierDrawer
        delegate={selectedDelegate}
        onClose={() => setSelectedDelegate(null)}
        onUpdateStatus={handleUpdateDelegateStatus}
        onSendDirectEmail={handleSendDirectEmail}
      />

      {/* Slide-over Drawer for Tickets (if ticket selected) */}
      <TicketDetailDrawer
        ticket={selectedTicket}
        messages={selectedTicket ? OpsStorage.getMessages(selectedTicket.request_id) : []}
        statusHistory={selectedTicket ? OpsStorage.getStatusHistory(selectedTicket.request_id) : []}
        currentUser={currentUser}
        allUsers={OpsStorage.getUsers()}
        onClose={() => setSelectedTicket(null)}
        onSendReply={(id, text) => {
          OpsStorage.sendReply(id, text, currentUser.username);
          refreshInviteData();
        }}
        onAddNote={(id, text) => {
          OpsStorage.addNote(id, text, currentUser.username);
          refreshInviteData();
        }}
        onAssign={(id, team, owner) => {
          OpsStorage.assign(id, team, owner, currentUser.username);
          refreshInviteData();
        }}
        onUpdateStatus={(id, status) => {
          OpsStorage.setStatus(id, status, currentUser.username);
          refreshInviteData();
        }}
        onEscalate={(id, reason) => {
          OpsStorage.escalate(id, reason, currentUser.username);
          refreshInviteData();
        }}
      />

      {/* Continuous Document Upload Modal (PDF, CSV, Excel & Google Form Sheets) */}
      <DocUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onImportParsedData={handleImportDocument}
        onImportGoogleFormSheet={(responses, fileName) => {
          const { updatedCount, newCount } = InviteStorage.ingestBatchGoogleFormResponses(responses, fileName);
          refreshInviteData();
          showFlash(
            `Google Form responses sheet "${fileName}" parsed: ${updatedCount} delegates updated with answers, ${newCount} new invitees added!`
          );
        }}
      />

      {/* Bulk Campaign Dispatch Modal */}
      <SendCampaignModal
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
        delegates={delegates}
        selectedIds={selectedCampaignIds}
        googleFormUrl={gformConfig.formUrl}
        onSendCampaign={handleSendCampaign}
      />

      {/* IMAP Connection, Multi-Mailbox Switcher & Reply Simulator Modal */}
      <ImapSettingsModal
        isOpen={isImapModalOpen}
        onClose={() => setIsImapModalOpen(false)}
        config={imapConfig}
        onSaveConfig={(cfg) => {
          InviteStorage.setImapConfig(cfg);
          refreshInviteData();
          showFlash('IMAP mailbox settings updated.');
        }}
        delegates={delegates}
        onSimulateReply={handleSimulateReply}
        mailboxProfiles={mailboxProfiles}
        onSwitchProfile={(profileId) => {
          const switched = InviteStorage.switchActiveMailbox(profileId);
          if (switched) {
            refreshInviteData();
            showFlash(`Active Mailbox switched to ${switched.name} (${switched.emailUser})!`);
          }
        }}
        onSaveProfile={(prof) => {
          InviteStorage.saveMailboxProfile(prof);
          refreshInviteData();
          showFlash(`Mailbox profile "${prof.name}" saved!`);
        }}
      />

      {/* Google Form Settings & Webhook Simulator Modal */}
      <GoogleFormSettingsModal
        isOpen={isGoogleFormModalOpen}
        onClose={() => setIsGoogleFormModalOpen(false)}
        config={gformConfig}
        onSaveConfig={(cfg) => {
          InviteStorage.setGoogleFormConfig(cfg);
          refreshInviteData();
          showFlash('Google Form connection and link updated.');
        }}
        delegates={delegates}
        onSimulateFormSubmission={handleSimulateFormSubmission}
      />

      {/* Ticket Ingest Modal */}
      <IngestEmailModal
        isOpen={isTicketIngestOpen}
        onClose={() => setIsTicketIngestOpen(false)}
        onSubmit={async (email, name, subject, body) => {
          await OpsStorage.processEmail(email, name, subject, body);
          refreshInviteData();
          showFlash(`Support ticket created from ${email}`);
        }}
      />

      {/* Power BI Modal */}
      <PowerBiExportModal
        isOpen={isPowerBiModalOpen}
        onClose={() => setIsPowerBiModalOpen(false)}
      />
    </div>
  );
}
