import React from 'react';
import {
  BarChart3,
  Users,
  FolderOpen,
  Mail,
  FileSpreadsheet,
  Settings,
  Ticket,
  Upload,
  Send,
  RefreshCw,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { User } from '../types/system';

interface SidebarProps {
  activeTab: 'dashboard' | 'inbox' | 'delegates' | 'documents' | 'tickets' | 'audit';
  setActiveTab: (tab: 'dashboard' | 'inbox' | 'delegates' | 'documents' | 'tickets' | 'audit') => void;
  currentUser: User;
  totalDelegates: number;
  confirmedCount: number;
  docsCount: number;
  openTicketsCount: number;
  inboxCount?: number;
  onOpenUpload: () => void;
  onOpenCampaign: () => void;
  onOpenImap: () => void;
  onOpenGoogleForm: () => void;
  onExportExcel: () => void;
  activeMailboxEmail?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  totalDelegates,
  confirmedCount,
  docsCount,
  openTicketsCount,
  inboxCount = 0,
  onOpenUpload,
  onOpenCampaign,
  onOpenImap,
  onOpenGoogleForm,
  onExportExcel,
  activeMailboxEmail,
}) => {
  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Executive Dashboard',
      icon: BarChart3,
      badge: `${confirmedCount} Confirmed`,
      badgeColor: 'bg-[#D8EEDF] text-[#2E7D52]',
    },
    {
      id: 'inbox' as const,
      label: 'Live IMAP Inbox',
      icon: Mail,
      badge: inboxCount > 0 ? `${inboxCount} Mails` : 'Live',
      badgeColor: 'bg-[#D8EEDF] text-[#2E7D52]',
    },
    {
      id: 'delegates' as const,
      label: 'Delegates & RSVP Roster',
      icon: Users,
      badge: `${totalDelegates}`,
      badgeColor: 'bg-[#EFECE5] text-[#1E3A2F]',
    },
    {
      id: 'documents' as const,
      label: 'Document Repository',
      icon: FolderOpen,
      badge: `${docsCount} Docs`,
      badgeColor: 'bg-[#EFECE5] text-[#424844]',
    },
    {
      id: 'tickets' as const,
      label: 'Support Tickets Queue',
      icon: Ticket,
      badge: openTicketsCount > 0 ? `${openTicketsCount} Open` : null,
      badgeColor: 'bg-[#F4E7C5] text-[#976508]',
    },
  ];

  return (
    <aside className="w-60 md:w-64 bg-[#152A20] text-[#FBFBFA] flex flex-col shrink-0 border-r border-[#1E3A2F] z-20 select-none min-h-screen">
      {/* Brand & Wordmark Lockup */}
      <div className="p-4 border-b border-[#1E3A2F]">
        <div className="flex items-baseline gap-1">
          <span className="font-serif italic font-semibold text-2xl tracking-tight text-[#FBFBFA]">
            fieldnote
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#D8EEDF] inline-block mb-1" />
        </div>
        <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-[0.08em] uppercase bg-[#D8EEDF]/12 text-[#caeada] border border-[#D8EEDF]/20">
          BHOPAL · INVESTOR SUMMIT
        </div>
        <p className="mt-1.5 text-[11px] text-[#86a496] leading-tight">
          Invitations, IMAP & Google Form Console
        </p>
      </div>

      {/* Quick Action Dock */}
      <div className="p-3 border-b border-[#1E3A2F] bg-[#07241A]/50 space-y-2">
        <button
          onClick={onOpenUpload}
          className="w-full py-1.5 px-2 bg-[#1E3A2F] hover:bg-[#2E7D52] text-[#FBFBFA] rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-[#2E7D52]/40"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload PDF / Excel / CSV</span>
        </button>

        <button
          onClick={onOpenCampaign}
          className="w-full py-1.5 px-2 bg-[#07241A] hover:bg-[#1E3A2F] text-[#caeada] rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-[#2E7D52]/30"
        >
          <Send className="w-3.5 h-3.5 text-[#caeada]" />
          <span>Dispatch Invites</span>
        </button>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-2 py-3 space-y-1">
        <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#86a496]/80">
          Main Console
        </div>

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-all text-left group ${
                isActive
                  ? 'bg-[#1E3A2F] text-[#FBFBFA] font-semibold border-l-2 border-[#D8EEDF]'
                  : 'text-[#caeada]/80 hover:bg-[#1E3A2F]/60 hover:text-[#FBFBFA]'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-[#D8EEDF]' : 'text-[#86a496] group-hover:text-[#caeada]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`px-1.5 py-0.2 text-[10px] rounded font-mono tabular-nums uppercase shrink-0 ${
                    item.badgeColor || 'bg-[#1E3A2F] text-[#86a496]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="px-2 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#86a496]/80">
          Connected Ingestion Feeds
        </div>

        {/* IMAP Trigger */}
        <button
          onClick={onOpenImap}
          className="w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium text-[#caeada]/80 hover:bg-[#1E3A2F]/60 hover:text-[#FBFBFA] transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Mail className="w-4 h-4 text-[#86a496]" />
            <span>IMAP Mailbox Setup</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-[#2E7D52]" title="Polling 30s" />
        </button>

        {/* Google Form Trigger */}
        <button
          onClick={onOpenGoogleForm}
          className="w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium text-[#caeada]/80 hover:bg-[#1E3A2F]/60 hover:text-[#FBFBFA] transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-4 h-4 text-[#86a496]" />
            <span>Google Form Sync</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-[#2E7D52]" title="Webhook Live" />
        </button>
      </nav>

      {/* Pinned Bottom Tray */}
      <div className="p-3 border-t border-[#1E3A2F] bg-[#07241A]/70 space-y-2">
        <div className="bg-[#152A20] p-2 rounded border border-[#1E3A2F] text-[10px] text-[#86a496] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[#D8EEDF] font-semibold">Active Mailbox</span>
            <span className="font-mono text-[#2E7D52]">SSL 993</span>
          </div>
          <div className="font-mono text-[10px] truncate text-[#caeada]" title={activeMailboxEmail || 'Deepikawork64@gmail.com'}>
            {activeMailboxEmail || 'Deepikawork64@gmail.com'}
          </div>
        </div>

        <button
          onClick={onExportExcel}
          className="w-full py-1 text-[11px] font-semibold bg-[#1E3A2F] hover:bg-[#254639] text-[#caeada] rounded border border-[#2E7D52]/40 transition-colors flex items-center justify-center gap-1.5"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-[#2E7D52]" />
          <span>Export Master Excel</span>
        </button>
      </div>
    </aside>
  );
};
