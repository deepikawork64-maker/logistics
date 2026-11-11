import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  FileSpreadsheet,
  Mail,
  Send,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  RotateCcw,
  UserCheck,
} from 'lucide-react';
import { Delegate, DelegateTier, RsvpStatus, UploadedDocument } from '../types/inviteOps';

interface DelegatesTableViewProps {
  delegates: Delegate[];
  documents: UploadedDocument[];
  onSelectDelegate: (delegate: Delegate) => void;
  onOpenUpload: () => void;
  onOpenCampaignWithSelection: (selectedIds: string[]) => void;
  onExportExcel: () => void;
  initialFilterStatus?: string;
}

const ALL_TIERS: DelegateTier[] = [
  'VVIP / Minister',
  'Head of Delegation',
  'Speaker',
  'Corporate CEO',
  'General Delegate',
  'Media',
];

export const DelegatesTableView: React.FC<DelegatesTableViewProps> = ({
  delegates,
  documents,
  onSelectDelegate,
  onOpenUpload,
  onOpenCampaignWithSelection,
  onExportExcel,
  initialFilterStatus,
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialFilterStatus || 'all');
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [selectedDoc, setSelectedDoc] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filtered Delegates
  const filtered = useMemo(() => {
    return delegates.filter((d) => {
      // Status Tab filter
      if (activeTab === 'confirmed' && d.status !== 'Confirmed (Attending)') return false;
      if (activeTab === 'form' && !d.formSubmittedAt) return false;
      if (activeTab === 'replied' && d.status !== 'Replied (Email)') return false;
      if (activeTab === 'sent' && d.status !== 'Invitation Sent') return false;
      if (activeTab === 'not_invited' && d.status !== 'Not Invited') return false;
      if (activeTab === 'declined' && d.status !== 'Declined') return false;

      // Tier filter
      if (selectedTier && d.tier !== selectedTier) return false;

      // Document filter
      if (selectedDoc && d.sourceDocName !== selectedDoc) return false;

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          d.name.toLowerCase().includes(q) ||
          d.email.toLowerCase().includes(q) ||
          (d.organization && d.organization.toLowerCase().includes(q)) ||
          (d.phone && d.phone.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [delegates, activeTab, selectedTier, selectedDoc, search]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((d) => d.id));
    }
  };

  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const resetFilters = () => {
    setActiveTab('all');
    setSelectedTier('');
    setSelectedDoc('');
    setSearch('');
  };

  const confirmedCount = delegates.filter((d) => d.status === 'Confirmed (Attending)').length;
  const formCount = delegates.filter((d) => !!d.formSubmittedAt).length;
  const replyCount = delegates.filter((d) => d.status === 'Replied (Email)').length;
  const sentCount = delegates.filter((d) => d.status === 'Invitation Sent').length;
  const uninvitedCount = delegates.filter((d) => d.status === 'Not Invited').length;
  const declinedCount = delegates.filter((d) => d.status === 'Declined').length;

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      {/* Top Bar with Bulk Dispatch Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-[#EBE8E1]">
        <div>
          <h1 className="font-serif font-semibold text-2xl md:text-3xl text-[#1D1C16] tracking-tight">
            Master Delegate Directory & RSVP Tracking
          </h1>
          <p className="text-xs md:text-sm text-[#424844] mt-1">
            Aggregated from uploaded PDF, Excel, and CSV sheets. Auto-synced with IMAP replies and
            Google Form submissions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={() => onOpenCampaignWithSelection(selectedIds)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#FBFBFA] bg-[#1E3A2F] rounded hover:bg-[#2E7D52] shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Invites to Selected ({selectedIds.length})</span>
            </button>
          )}

          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1E3A2F] bg-white border border-[#E2DFD7] rounded hover:bg-[#F5F4F0] transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-[#1E3A2F]" />
            <span>Upload Sheet / PDF</span>
          </button>

          <button
            onClick={onExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1E3A2F] bg-white border border-[#E2DFD7] rounded hover:bg-[#F5F4F0] transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#2E7D52]" />
            <span>Export Roster (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Filter Control Box */}
      <div className="bg-[#FBFBFA] p-3.5 rounded border border-[#EBE8E1] space-y-3">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1 border-b border-[#E2DFD7] pb-2 text-xs font-medium">
          {[
            { id: 'all', label: 'All Contacts', count: delegates.length },
            { id: 'confirmed', label: 'Confirmed (Attending)', count: confirmedCount },
            { id: 'form', label: 'Google Form Synced', count: formCount },
            { id: 'replied', label: 'IMAP Replied', count: replyCount },
            { id: 'sent', label: 'Invitation Sent', count: sentCount },
            { id: 'not_invited', label: 'Not Invited', count: uninvitedCount },
            { id: 'declined', label: 'Declined', count: declinedCount },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded transition-all text-xs flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#1E3A2F] text-[#FBFBFA] font-semibold'
                    : 'text-[#424844] hover:bg-[#F5F4F0] hover:text-[#1D1C16]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1 rounded ${
                    isActive ? 'bg-[#07241A] text-[#D8EEDF]' : 'bg-[#EFECE5] text-[#8F8C84]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Secondary Filter Dropdowns & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8F8C84] absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, company, phone..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E2DFD7] rounded text-[#1D1C16] focus:outline-none focus:border-[#1E3A2F]"
            />
          </div>

          {/* Tier Dropdown */}
          <div>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full text-xs bg-white border border-[#E2DFD7] rounded px-2.5 py-1.5 text-[#1D1C16] focus:outline-none focus:border-[#1E3A2F]"
            >
              <option value="">All Protocol Tiers ({ALL_TIERS.length})</option>
              {ALL_TIERS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Source Document Dropdown */}
          <div>
            <select
              value={selectedDoc}
              onChange={(e) => setSelectedDoc(e.target.value)}
              className="w-full text-xs bg-white border border-[#E2DFD7] rounded px-2.5 py-1.5 text-[#1D1C16] focus:outline-none focus:border-[#1E3A2F]"
            >
              <option value="">All Source Documents ({documents.length})</option>
              {documents.map((d) => (
                <option key={d.id} value={d.fileName}>
                  {d.fileName} ({d.fileType.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {(selectedTier || selectedDoc || search || activeTab !== 'all') && (
          <div className="flex items-center justify-between pt-1 text-[11px] text-[#8F8C84]">
            <span>
              Showing <strong className="text-[#1D1C16]">{filtered.length}</strong> of{' '}
              {delegates.length} contacts
            </span>
            <button onClick={resetFilters} className="text-[#1E3A2F] hover:underline">
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Main Data Table */}
      <div className="bg-[#FBFBFA] rounded border border-[#EBE8E1] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            {delegates.length === 0 ? (
              <>
                <FileSpreadsheet className="w-10 h-10 text-[#8F8C84] mx-auto" />
                <div className="font-serif text-lg text-[#1D1C16]">Your Delegate Roster is Empty</div>
                <p className="text-xs text-[#525048] max-w-md mx-auto">
                  All sample data has been cleared. Upload your PDF guest list, Excel sheet (.xlsx, .xls), or CSV file to populate your roster.
                </p>
                <button
                  onClick={onOpenUpload}
                  className="px-4 py-2 text-xs font-semibold bg-[#1E3A2F] text-white rounded hover:bg-[#2E7D52] transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Your Guest List</span>
                </button>
              </>
            ) : (
              <>
                <Filter className="w-8 h-8 text-[#8F8C84] mx-auto" />
                <div className="font-serif text-lg text-[#1D1C16]">No matching delegates found</div>
                <p className="text-xs text-[#8F8C84] max-w-md mx-auto">
                  No records match your active search or filters. Clear existing filters to view your contacts.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-3 py-1 text-xs font-medium border border-[#E2DFD7] rounded text-[#1E3A2F] hover:bg-[#F5F4F0]"
                >
                  Reset Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F5F4F0] border-b border-[#E2DFD7] text-[10px] uppercase font-semibold text-[#424844] tracking-wider select-none">
                  <th className="py-2.5 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-[#E2DFD7] text-[#1E3A2F] focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3">Delegate Name & Tier</th>
                  <th className="py-2.5 px-3">Email & Contact</th>
                  <th className="py-2.5 px-3">Organization & Role</th>
                  <th className="py-2.5 px-3">Source Document</th>
                  <th className="py-2.5 px-3">RSVP Status</th>
                  <th className="py-2.5 px-3">Form Answers (Dietary / Hotel)</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE8E1]">
                {filtered.map((d) => {
                  const isSelected = selectedIds.includes(d.id);
                  const isConfirmed = d.status === 'Confirmed (Attending)';
                  const isReplied = d.status === 'Replied (Email)';
                  const isDeclined = d.status === 'Declined';
                  const isSent = d.status === 'Invitation Sent';

                  return (
                    <tr
                      key={d.id}
                      onClick={() => onSelectDelegate(d)}
                      className={`hover:bg-[#F5F4F0] transition-colors cursor-pointer group hover:border-l-2 hover:border-l-[#1E3A2F] ${
                        isSelected ? 'bg-[#EFECE5]/60' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleSelectOne(d.id, e as any)}
                          className="rounded border-[#E2DFD7] text-[#1E3A2F] focus:ring-0 cursor-pointer"
                        />
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-[#1D1C16] group-hover:underline">
                          {d.name}
                        </div>
                        <span className="inline-block mt-0.5 text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#EFECE5] text-[#1E3A2F] border border-[#E2DFD7]">
                          {d.tier}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-mono text-[#424844] text-[11px]">{d.email}</div>
                        {d.phone && <div className="text-[10px] text-[#8F8C84]">{d.phone}</div>}
                      </td>

                      <td className="py-2.5 px-3 max-w-[200px]">
                        <div className="text-[#1D1C16] font-medium truncate">
                          {d.organization || '—'}
                        </div>
                        <div className="text-[10px] text-[#8F8C84] truncate">
                          {d.designation || '—'}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-mono text-[10px] text-[#424844] truncate max-w-[140px] block" title={d.sourceDocName}>
                          {d.sourceDocName ? d.sourceDocName.slice(0, 18) + '...' : 'Direct Entry'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                            isConfirmed
                              ? 'bg-[#D8EEDF] text-[#2E7D52]'
                              : isReplied
                              ? 'bg-[#F4E7C5] text-[#976508]'
                              : isDeclined
                              ? 'bg-[#FBE3DE] text-[#B83A2C]'
                              : isSent
                              ? 'bg-[#EFECE5] text-[#1E3A2F] border'
                              : 'bg-[#EBE8E1] text-[#8F8C84]'
                          }`}
                        >
                          {isConfirmed && <CheckCircle2 className="w-2.5 h-2.5" />}
                          {isDeclined && <XCircle className="w-2.5 h-2.5" />}
                          <span>{d.status}</span>
                        </span>
                      </td>

                      <td className="py-2.5 px-3 max-w-[220px]">
                        {d.formData ? (
                          <div className="space-y-0.5 text-[11px]">
                            {d.formData.dietary && (
                              <div className="text-[#2E7D52] truncate">
                                🍽️ {d.formData.dietary}
                              </div>
                            )}
                            {d.formData.hotelRequired && (
                              <div className="text-[#976508]">🏨 Hotel Requested</div>
                            )}
                            {d.formData.arrivalFlight && (
                              <div className="text-[#424844] font-mono text-[10px] truncate">
                                ✈️ {d.formData.arrivalFlight}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#8F8C84] text-[11px] italic">
                            No form submission
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <ChevronRight className="w-4 h-4 text-[#8F8C84] group-hover:text-[#1E3A2F] inline-block transition-colors" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
