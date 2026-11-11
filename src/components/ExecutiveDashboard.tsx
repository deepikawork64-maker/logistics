import React from 'react';
import {
  Mail,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  Inbox,
  ArrowRight,
  ExternalLink,
  Upload,
  Send,
  Sparkles,
  Users,
  Radio,
  FileUp,
} from 'lucide-react';
import { Delegate, UploadedDocument, ActivityEvent, Campaign } from '../types/inviteOps';

interface ExecutiveDashboardProps {
  delegates: Delegate[];
  documents: UploadedDocument[];
  activities: ActivityEvent[];
  campaigns: Campaign[];
  onOpenUpload: () => void;
  onOpenCampaign: () => void;
  onOpenImap: () => void;
  onOpenGoogleForm: () => void;
  onSelectDelegate: (delegate: Delegate) => void;
  onNavigateToDelegates: (filterStatus?: string) => void;
  onNavigateToInbox?: () => void;
  onExportExcel: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  delegates,
  documents,
  activities,
  campaigns,
  onOpenUpload,
  onOpenCampaign,
  onOpenImap,
  onOpenGoogleForm,
  onSelectDelegate,
  onNavigateToDelegates,
  onNavigateToInbox,
  onExportExcel,
}) => {
  const total = delegates.length;
  const invited = delegates.filter((d) => d.status !== 'Not Invited').length;
  const confirmed = delegates.filter((d) => d.status === 'Confirmed (Attending)').length;
  const formSubmitted = delegates.filter((d) => !!d.formSubmittedAt).length;
  const emailReplied = delegates.filter((d) => d.status === 'Replied (Email)').length;
  const declined = delegates.filter((d) => d.status === 'Declined').length;
  const pending = invited - confirmed - declined;

  const confirmationRate = invited > 0 ? Math.round((confirmed / invited) * 100) : 0;
  const formCompletionRate = invited > 0 ? Math.round((formSubmitted / invited) * 100) : 0;

  // Breakdown by Tier
  const tierCounts = delegates.reduce((acc, d) => {
    acc[d.tier] = (acc[d.tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Editorial Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-3 border-b border-[#EBE8E1]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold tracking-[0.08em] uppercase bg-[#D8EEDF] text-[#2E7D52] mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D52]" />
            IMAP Auto-Sync & Google Form Webhook Active
          </div>
          <h1 className="font-serif font-semibold text-2xl md:text-3xl text-[#1D1C16] tracking-tight">
            Invitation & Response Command Center
          </h1>
          <p className="text-xs md:text-sm text-[#424844] mt-1">
            Real-time tracking of sent invitations, incoming IMAP mail replies, Google Form RSVP
            submissions, and uploaded document manifests.
          </p>
        </div>

        {/* Quick Command Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1E3A2F] bg-white border border-[#E2DFD7] rounded hover:bg-[#F5F4F0] shadow-xs transition-colors"
          >
            <FileUp className="w-3.5 h-3.5 text-[#1E3A2F]" />
            <span>Upload Document (PDF/Excel/CSV)</span>
          </button>

          <button
            onClick={onOpenCampaign}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#FBFBFA] bg-[#1E3A2F] border border-[#152A20] rounded hover:bg-[#2E7D52] shadow-sm transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Dispatch Invitations</span>
          </button>

          <button
            onClick={onExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1E3A2F] border border-[#E2DFD7] rounded bg-white hover:bg-[#F5F4F0] transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#2E7D52]" />
            <span>Export Master Excel</span>
          </button>
        </div>
      </div>

      {/* Clean Slate Onboarding Card when no data is loaded */}
      {total === 0 && (
        <div className="p-5 md:p-6 bg-white rounded border border-[#E2DFD7] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-[#EFECE5] text-[#1E3A2F] rounded mb-1.5">
                Clean Slate Mode • 0 Sample Records
              </span>
              <h2 className="font-serif font-semibold text-lg text-[#1D1C16]">
                Ready to Add Your Real Guest Lists & RSVPs
              </h2>
              <p className="text-xs text-[#525048] max-w-2xl mt-1 leading-relaxed">
                All sample records have been removed. You can now upload your own PDF guest lists, Excel spreadsheets, or CSV rosters, sync your Google Form responses, and connect your IMAP mailbox.
              </p>
            </div>
            <button
              onClick={onOpenUpload}
              className="px-4 py-2 font-semibold text-xs bg-[#1E3A2F] text-[#FBFBFA] rounded hover:bg-[#2E7D52] transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Your First Document</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div
              onClick={onOpenUpload}
              className="p-3.5 bg-[#FAF8F5] rounded border border-[#E2DFD7] hover:border-[#1E3A2F] cursor-pointer transition-all space-y-1 group"
            >
              <div className="font-semibold text-xs text-[#1D1C16] group-hover:text-[#1E3A2F] flex items-center justify-between">
                <span>1. Upload Guest Lists (PDF / Excel / CSV)</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8F8C84] group-hover:text-[#1E3A2F]" />
              </div>
              <p className="text-[11px] text-[#525048]">
                Drop any attendee sheet. Automatically parses names, emails, phones, and organizations.
              </p>
            </div>

            <div
              onClick={onOpenUpload}
              className="p-3.5 bg-[#FAF8F5] rounded border border-[#E2DFD7] hover:border-[#1E3A2F] cursor-pointer transition-all space-y-1 group"
            >
              <div className="font-semibold text-xs text-[#1D1C16] group-hover:text-[#1E3A2F] flex items-center justify-between">
                <span>2. Upload Google Form Sheet</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8F8C84] group-hover:text-[#1E3A2F]" />
              </div>
              <p className="text-[11px] text-[#525048]">
                Upload your downloaded responses sheet to import dietary, hotel, and flight data.
              </p>
            </div>

            <div
              onClick={onNavigateToInbox || onOpenImap}
              className="p-3.5 bg-[#FAF8F5] rounded border border-[#E2DFD7] hover:border-[#1E3A2F] cursor-pointer transition-all space-y-1 group"
            >
              <div className="font-semibold text-xs text-[#1D1C16] group-hover:text-[#1E3A2F] flex items-center justify-between">
                <span>3. Live IMAP Inbox & Classifier</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8F8C84] group-hover:text-[#1E3A2F]" />
              </div>
              <p className="text-[11px] text-[#525048]">
                View all emails, auto-read attendee replies, and track RSVPs and dietary needs live.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 6 Key KPI Metric Strips */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Ingested */}
        <div
          onClick={() => onNavigateToDelegates()}
          className="p-3.5 bg-[#FBFBFA] rounded border border-[#EBE8E1] space-y-1 hover:border-[#1E3A2F] transition-all cursor-pointer group"
        >
          <span className="text-[10px] uppercase font-semibold tracking-[0.08em] text-[#8F8C84] block">
            Total Ingested Contacts
          </span>
          <div className="text-2xl font-serif font-bold text-[#1D1C16] font-mono tabular-nums group-hover:text-[#1E3A2F]">
            {total}
          </div>
          <span className="text-[11px] text-[#424844]">Across {documents.length} documents</span>
        </div>

        {/* Invitations Sent */}
        <div
          onClick={() => onNavigateToDelegates('Invitation Sent')}
          className="p-3.5 bg-[#FBFBFA] rounded border border-[#EBE8E1] space-y-1 hover:border-[#1E3A2F] transition-all cursor-pointer group"
        >
          <span className="text-[10px] uppercase font-semibold tracking-[0.08em] text-[#8F8C84] block">
            Invitations Sent
          </span>
          <div className="text-2xl font-serif font-bold text-[#1E3A2F] font-mono tabular-nums">
            {invited}
          </div>
          <span className="text-[11px] text-[#424844]">
            {total > 0 ? Math.round((invited / total) * 100) : 0}% of contact base
          </span>
        </div>

        {/* Confirmed RSVPs */}
        <div
          onClick={() => onNavigateToDelegates('Confirmed (Attending)')}
          className="p-3.5 bg-[#D8EEDF]/40 rounded border border-[#2E7D52]/40 space-y-1 hover:border-[#2E7D52] transition-all cursor-pointer group"
        >
          <span className="text-[10px] uppercase font-semibold tracking-[0.08em] text-[#2E7D52] block flex items-center justify-between">
            <span>Confirmed RSVPs</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D52]" />
          </span>
          <div className="text-2xl font-serif font-bold text-[#2E7D52] font-mono tabular-nums">
            {confirmed}
          </div>
          <span className="text-[11px] text-[#2E7D52] font-medium">
            {confirmationRate}% conversion rate
          </span>
        </div>

        {/* Google Form Submissions */}
        <div
          onClick={onOpenGoogleForm}
          className="p-3.5 bg-[#FBFBFA] rounded border border-[#EBE8E1] space-y-1 hover:border-[#1E3A2F] transition-all cursor-pointer group"
        >
          <span className="text-[10px] uppercase font-semibold tracking-[0.08em] text-[#8F8C84] block flex items-center justify-between">
            <span>Google Form Sync</span>
            <ExternalLink className="w-3 h-3 text-[#8F8C84]" />
          </span>
          <div className="text-2xl font-serif font-bold text-[#1E3A2F] font-mono tabular-nums">
            {formSubmitted}
          </div>
          <span className="text-[11px] text-[#424844]">
            {formCompletionRate}% response rate
          </span>
        </div>

        {/* Inbound Email Replies */}
        <div
          onClick={() => onNavigateToDelegates('Replied (Email)')}
          className="p-3.5 bg-[#FBFBFA] rounded border border-[#EBE8E1] space-y-1 hover:border-[#1E3A2F] transition-all cursor-pointer group"
        >
          <span className="text-[10px] uppercase font-semibold tracking-[0.08em] text-[#8F8C84] block flex items-center justify-between">
            <span>IMAP Mail Replies</span>
            <Inbox className="w-3 h-3 text-[#976508]" />
          </span>
          <div className="text-2xl font-serif font-bold text-[#976508] font-mono tabular-nums">
            {emailReplied}
          </div>
          <span className="text-[11px] text-[#424844]">Auto-parsed intent</span>
        </div>

        {/* Declined / Regrets */}
        <div
          onClick={() => onNavigateToDelegates('Declined')}
          className="p-3.5 bg-[#FBFBFA] rounded border border-[#EBE8E1] space-y-1 hover:border-[#1E3A2F] transition-all cursor-pointer group"
        >
          <span className="text-[10px] uppercase font-semibold tracking-[0.08em] text-[#8F8C84] block">
            Declined / Regrets
          </span>
          <div className="text-2xl font-serif font-bold text-[#B83A2C] font-mono tabular-nums">
            {declined}
          </div>
          <span className="text-[11px] text-[#424844]">Seat reallocation open</span>
        </div>
      </div>

      {/* Funnel & Conversion Health */}
      <div className="bg-[#FBFBFA] p-4 rounded border border-[#EBE8E1] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif font-semibold text-sm text-[#1D1C16]">
              Invitation Delivery & Confirmation Funnel
            </h3>
            <p className="text-[11px] text-[#8F8C84]">
              Tracking progression from document ingestion to invitation dispatch, mail response, and
              Google Form completion.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#1E3A2F]" />
              <span className="text-[#424844]">Sent ({invited})</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#976508]" />
              <span className="text-[#424844]">Replies ({emailReplied})</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#2E7D52]" />
              <span className="text-[#424844]">Confirmed ({confirmed})</span>
            </span>
          </div>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="w-full h-3 bg-[#EFECE5] rounded-full overflow-hidden flex">
          <div
            className="bg-[#2E7D52] h-full transition-all"
            style={{ width: `${total > 0 ? (confirmed / total) * 100 : 0}%` }}
            title={`Confirmed: ${confirmed}`}
          />
          <div
            className="bg-[#976508] h-full transition-all"
            style={{ width: `${total > 0 ? (emailReplied / total) * 100 : 0}%` }}
            title={`Replied / Pending: ${emailReplied}`}
          />
          <div
            className="bg-[#1E3A2F]/50 h-full transition-all"
            style={{
              width: `${
                total > 0
                  ? (Math.max(0, invited - confirmed - emailReplied - declined) / total) * 100
                  : 0
              }%`,
            }}
            title="Awaiting Response"
          />
          <div
            className="bg-[#B83A2C] h-full transition-all"
            style={{ width: `${total > 0 ? (declined / total) * 100 : 0}%` }}
            title={`Declined: ${declined}`}
          />
        </div>
      </div>

      {/* Grid: Live Activity Stream & Document Repositories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Activity Feed */}
        <div className="lg:col-span-2 bg-[#FBFBFA] rounded border border-[#EBE8E1] overflow-hidden flex flex-col">
          <div className="p-3.5 bg-[#F5F4F0] border-b border-[#E2DFD7] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2E7D52] animate-ping" />
              <h3 className="font-serif font-semibold text-sm text-[#1D1C16]">
                Live Interaction & Sync Stream
              </h3>
            </div>
            <span className="text-[11px] text-[#8F8C84] font-mono">
              Auto-Polling IMAP & Webhook
            </span>
          </div>

          <div className="p-4 overflow-y-auto max-h-[460px] space-y-3">
            {activities.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8F8C84]">
                No interactions logged yet.
              </div>
            ) : (
              activities.map((act) => {
                const isForm = act.type === 'form_submission';
                const isMail = act.type === 'imap_reply_received';
                const isDoc = act.type === 'document_uploaded';
                const isSent = act.type === 'email_sent';

                return (
                  <div
                    key={act.id}
                    className="p-3 rounded border border-[#E2DFD7] bg-[#F5F4F0]/60 space-y-1 text-xs transition-colors hover:bg-white"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#1D1C16] flex items-center gap-1.5">
                        {isForm && (
                          <span className="px-1.5 py-0.2 rounded bg-[#D8EEDF] text-[#2E7D52] font-mono text-[10px]">
                            GOOGLE FORM
                          </span>
                        )}
                        {isMail && (
                          <span className="px-1.5 py-0.2 rounded bg-[#F4E7C5] text-[#976508] font-mono text-[10px]">
                            IMAP INBOUND
                          </span>
                        )}
                        {isDoc && (
                          <span className="px-1.5 py-0.2 rounded bg-[#caeada] text-[#032017] font-mono text-[10px]">
                            DOC INGESTION
                          </span>
                        )}
                        {isSent && (
                          <span className="px-1.5 py-0.2 rounded bg-[#1E3A2F] text-[#FBFBFA] font-mono text-[10px]">
                            INVITE DISPATCH
                          </span>
                        )}
                        <span>{act.title}</span>
                      </span>
                      <span className="font-mono text-[#8F8C84] tabular-nums text-[10px]">
                        {new Date(act.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-[#424844] text-[12px] leading-relaxed">
                      {act.description}
                    </p>

                    {act.delegateEmail && (
                      <div className="text-[10px] text-[#1E3A2F] font-mono pt-0.5">
                        Matched Contact: {act.delegateEmail}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Document Ingestion & Integration Health */}
        <div className="space-y-4">
          {/* Continuous Document Registry Card */}
          <div className="bg-[#FBFBFA] p-4 rounded border border-[#EBE8E1] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2DFD7]">
              <div>
                <h3 className="font-serif font-semibold text-sm text-[#1D1C16]">
                  Uploaded Manifests ({documents.length})
                </h3>
                <p className="text-[10px] text-[#8F8C84]">PDF, Excel, & CSV databases</p>
              </div>
              <button
                onClick={onOpenUpload}
                className="text-xs font-semibold text-[#1E3A2F] hover:underline flex items-center gap-1"
              >
                <span>+ Upload</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-2.5 rounded border border-[#E2DFD7] bg-[#F5F4F0] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#1D1C16] truncate max-w-[180px]">
                      {doc.fileName}
                    </span>
                    <span className="font-mono text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-[#EFECE5] text-[#1E3A2F]">
                      {doc.fileType}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#8F8C84]">
                    <span>{doc.recordCount} records imported</span>
                    <span className="font-mono tabular-nums">{doc.fileSize}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Integrations Status Card */}
          <div className="bg-[#FBFBFA] p-4 rounded border border-[#EBE8E1] space-y-3">
            <h3 className="font-serif font-semibold text-sm text-[#1D1C16]">
              Connected Ingestion Endpoints
            </h3>

            {/* IMAP Card */}
            <div
              onClick={onOpenImap}
              className="p-2.5 rounded border border-[#E2DFD7] bg-[#F5F4F0] hover:bg-white transition-colors cursor-pointer space-y-1"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#1D1C16] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#1E3A2F]" />
                  <span>IMAP Inbound Mailbox</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#2E7D52] bg-[#D8EEDF] px-1.5 py-0.2 rounded-full">
                  <span className="w-1 h-1 rounded-full bg-[#2E7D52]" />
                  Active
                </span>
              </div>
              <p className="text-[11px] text-[#424844]">
                Host: imap.gmail.com · Polling every 30s for attendee reply intent.
              </p>
            </div>

            {/* Google Form Card */}
            <div
              onClick={onOpenGoogleForm}
              className="p-2.5 rounded border border-[#E2DFD7] bg-[#F5F4F0] hover:bg-white transition-colors cursor-pointer space-y-1"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#1D1C16] flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#2E7D52]" />
                  <span>Google Form Responses</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#2E7D52] bg-[#D8EEDF] px-1.5 py-0.2 rounded-full">
                  <span className="w-1 h-1 rounded-full bg-[#2E7D52]" />
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] text-[#424844]">
                Webhook listening · Auto-syncing dietary, flight, and hotel answers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
