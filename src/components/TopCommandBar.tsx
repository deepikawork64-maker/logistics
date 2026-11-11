import React from 'react';
import {
  Search,
  Upload,
  Send,
  Mail,
  FileSpreadsheet,
  Clock,
  X,
  FileDown,
} from 'lucide-react';
import { User } from '../types/system';

interface TopCommandBarProps {
  activeTab: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenUpload: () => void;
  onOpenCampaign: () => void;
  onOpenImap: () => void;
  onOpenGoogleForm: () => void;
  onExportExcel: () => void;
  currentUser: User;
  activeMailboxEmail?: string;
}

export const TopCommandBar: React.FC<TopCommandBarProps> = ({
  activeTab,
  searchQuery,
  setSearchQuery,
  onOpenUpload,
  onOpenCampaign,
  onOpenImap,
  onOpenGoogleForm,
  onExportExcel,
  currentUser,
  activeMailboxEmail,
}) => {
  const getBreadcrumb = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Executive Overview & RSVP Telemetry';
      case 'delegates':
        return 'Master Delegate Roster & RSVP Status';
      case 'documents':
        return 'Continuous Document Repository (PDF / XLSX / CSV)';
      case 'tickets':
        return 'Operational Support Tickets Queue';
      case 'audit':
        return 'Audit & Compliance Ledger';
      default:
        return 'Invitation Operations';
    }
  };

  const istTime = new Date().toLocaleTimeString('en-US', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <header className="h-[52px] bg-[#FBFBFA] border-b border-[#EBE8E1] px-4 md:px-6 flex items-center justify-between gap-4 sticky top-0 z-10 shrink-0">
      {/* Left: Breadcrumbs & Time Marker */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-1.5 text-xs text-[#8F8C84] shrink-0">
          <span className="font-medium text-[#424844]">Investor Summit 2027</span>
          <span>/</span>
          <span className="text-[#1D1C16] font-semibold truncate">{getBreadcrumb()}</span>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#F5F4F0] border border-[#E2DFD7] text-[11px] font-mono text-[#424844] tabular-nums">
          <Clock className="w-3 h-3 text-[#8F8C84]" />
          <span>{istTime} IST</span>
        </div>
      </div>

      {/* Center/Right: Integrations Status & Primary Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Search */}
        <div className="relative hidden sm:block w-44 md:w-56">
          <Search className="w-3.5 h-3.5 text-[#8F8C84] absolute left-2.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roster..."
            className="w-full pl-8 pr-7 py-1 text-xs bg-[#F5F4F0] border border-[#E2DFD7] rounded text-[#1D1C16] placeholder-[#8F8C84] focus:outline-none focus:bg-white focus:border-[#2E7D52] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-[#8F8C84] hover:text-[#1D1C16]"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* IMAP Active Badge */}
        <button
          onClick={onOpenImap}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-[0.04em] bg-[#D8EEDF] text-[#2E7D52] border border-[#2E7D52]/20 hover:bg-[#c2e4cc] transition-colors"
          title={`Active Mailbox: ${activeMailboxEmail || 'Deepikawork64@gmail.com'}. Click to switch between My Account and Client Account.`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D52] animate-pulse" />
          <span className="font-mono uppercase">IMAP: {activeMailboxEmail?.split('@')[0] || 'DEEPIKAWORK64'}</span>
        </button>

        {/* Google Form Synced Badge */}
        <button
          onClick={onOpenGoogleForm}
          className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-[0.08em] uppercase bg-[#D8EEDF] text-[#2E7D52] border border-[#2E7D52]/20 hover:bg-[#c2e4cc] transition-colors"
          title="Click to view Google Form sync settings or simulate webhook submission"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D52]" />
          <span className="font-mono">G-FORM SYNCED</span>
        </button>

        {/* Upload Doc Action */}
        <button
          onClick={onOpenUpload}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#1E3A2F] border border-[#E2DFD7] rounded hover:bg-[#F5F4F0] transition-colors"
        >
          <Upload className="w-3.5 h-3.5 text-[#1E3A2F]" />
          <span className="hidden md:inline">Upload Doc</span>
        </button>

        {/* Dispatch Campaign Action */}
        <button
          onClick={onOpenCampaign}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#FBFBFA] bg-[#1E3A2F] border border-[#152A20] rounded hover:bg-[#2E7D52] shadow-sm transition-colors cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Dispatch Invites</span>
        </button>
      </div>
    </header>
  );
};
