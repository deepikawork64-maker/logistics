import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  Clock,
  Radio,
  User,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Send,
  Copy,
  Check,
  Building,
} from 'lucide-react';
import { Incident, Severity } from '../types/ops';

interface InspectionDrawerProps {
  incident: Incident | null;
  onClose: () => void;
  onUpdateStatus: (incidentId: string, newStatus: Incident['status']) => void;
  onAddAuditNote: (incidentId: string, note: string) => void;
}

export const InspectionDrawer: React.FC<InspectionDrawerProps> = ({
  incident,
  onClose,
  onUpdateStatus,
  onAddAuditNote,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'payload' | 'team'>('overview');
  const [newNote, setNewNote] = useState('');
  const [copiedPayload, setCopiedPayload] = useState(false);

  if (!incident) return null;

  const getSeverityBadge = (sev: Severity) => {
    switch (sev) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-[0.08em] uppercase bg-[#FBE3DE] text-[#B83A2C] border border-[#B83A2C]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B83A2C]" />
            SIGNAL ROSE · URGENT
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-[0.08em] uppercase bg-[#F4E7C5] text-[#976508] border border-[#976508]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#976508]" />
            ARCHIVAL AMBER · WARNING
          </span>
        );
      case 'operational':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-[0.08em] uppercase bg-[#D8EEDF] text-[#2E7D52] border border-[#2E7D52]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D52]" />
            OPERATIONAL MINT · NOMINAL
          </span>
        );
      case 'disconnected':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-[0.08em] uppercase bg-[#EBE8E1] text-[#8F8C84] border border-[#8F8C84]/30">
            DISCONNECTED · NULL
          </span>
        );
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddAuditNote(incident.id, newNote.trim());
    setNewNote('');
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(incident.payload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Overlay Backdrop */}
      <div
        className="fixed inset-0 bg-[#07241A]/30 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className="relative w-full max-w-[460px] md:max-w-[500px] bg-[#FBFBFA] h-full flex flex-col z-10 border-l border-[#E2DFD7] text-[#1D1C16]"
        style={{
          boxShadow: '-8px 0 24px -4px rgba(21, 42, 32, 0.12), -2px 0 6px -1px rgba(21, 42, 32, 0.06)',
        }}
      >
        {/* Drawer Header */}
        <div className="p-4 md:p-5 border-b border-[#EBE8E1] bg-[#F5F4F0] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-medium tracking-wider text-[#424844] bg-[#EFECE5] px-1.5 py-0.5 rounded border border-[#E2DFD7]">
                {incident.id}
              </span>
              <span className="text-[11px] text-[#8F8C84] font-mono tabular-nums">
                {incident.timeReported} ({incident.elapsedMinutes}m elapsed)
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded text-[#8F8C84] hover:text-[#1D1C16] hover:bg-[#EBE8E1] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h2 className="font-serif font-semibold text-lg md:text-xl text-[#1D1C16] leading-snug">
            {incident.title}
          </h2>

          <div className="flex items-center justify-between pt-1">
            {getSeverityBadge(incident.severity)}
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded ${
                incident.status === 'Resolved'
                  ? 'bg-[#D8EEDF] text-[#2E7D52]'
                  : incident.status === 'Escalated'
                  ? 'bg-[#FBE3DE] text-[#B83A2C]'
                  : 'bg-[#F5F4F0] text-[#1E3A2F] border border-[#E2DFD7]'
              }`}
            >
              Status: {incident.status}
            </span>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="flex border-b border-[#EBE8E1] bg-[#FBFBFA] px-4 pt-2 gap-4 text-xs font-semibold uppercase tracking-[0.06em]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'border-[#1E3A2F] text-[#1E3A2F]'
                : 'border-transparent text-[#8F8C84] hover:text-[#1D1C16]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'border-[#1E3A2F] text-[#1E3A2F]'
                : 'border-transparent text-[#8F8C84] hover:text-[#1D1C16]'
            }`}
          >
            <span>Audit Log</span>
            <span className="text-[10px] font-mono px-1 rounded bg-[#EFECE5]">
              {incident.auditTrail.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('payload')}
            className={`pb-2.5 transition-colors border-b-2 ${
              activeTab === 'payload'
                ? 'border-[#1E3A2F] text-[#1E3A2F]'
                : 'border-transparent text-[#8F8C84] hover:text-[#1D1C16]'
            }`}
          >
            Raw Payload
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`pb-2.5 transition-colors border-b-2 ${
              activeTab === 'team'
                ? 'border-[#1E3A2F] text-[#1E3A2F]'
                : 'border-transparent text-[#8F8C84] hover:text-[#1D1C16]'
            }`}
          >
            Unit / Comms
          </button>
        </div>

        {/* Drawer Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
          {activeTab === 'overview' && (
            <div className="space-y-4 text-xs">
              {/* Location & Sector */}
              <div className="bg-[#F5F4F0] p-3 rounded border border-[#E2DFD7] space-y-2">
                <div className="text-[10px] uppercase font-semibold tracking-[0.08em] text-[#8F8C84]">
                  Venue & Deployment Sector
                </div>
                <div className="flex items-start gap-2">
                  <Building className="w-4 h-4 text-[#1E3A2F] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-sm text-[#1D1C16]">
                      {incident.venueName}
                    </div>
                    <div className="text-[#424844] mt-0.5 font-medium">
                      {incident.locationDetail}
                    </div>
                  </div>
                </div>
              </div>

              {/* Narrative Summary */}
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase font-semibold tracking-[0.08em] text-[#8F8C84]">
                  Operational Field Summary
                </div>
                <p className="text-[#1D1C16] text-[13px] leading-relaxed bg-[#FBFBFA] p-3 rounded border border-[#EBE8E1]">
                  {incident.summary}
                </p>
              </div>

              {/* Fast Metadata Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded bg-[#F5F4F0] border border-[#E2DFD7]">
                  <span className="block text-[10px] font-semibold text-[#8F8C84] uppercase tracking-wider">
                    Category
                  </span>
                  <span className="font-medium text-[#1D1C16] text-xs mt-0.5 block">
                    {incident.category}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-[#F5F4F0] border border-[#E2DFD7]">
                  <span className="block text-[10px] font-semibold text-[#8F8C84] uppercase tracking-wider">
                    Lead Field Officer
                  </span>
                  <span className="font-medium text-[#1D1C16] text-xs mt-0.5 block">
                    {incident.leadOfficer}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-[#F5F4F0] border border-[#E2DFD7]">
                  <span className="block text-[10px] font-semibold text-[#8F8C84] uppercase tracking-wider">
                    Assigned Unit
                  </span>
                  <span className="font-medium text-[#1D1C16] text-xs mt-0.5 block">
                    {incident.assignedUnit}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-[#F5F4F0] border border-[#E2DFD7]">
                  <span className="block text-[10px] font-semibold text-[#8F8C84] uppercase tracking-wider">
                    Radio Tactical Channel
                  </span>
                  <span className="font-mono text-[#1E3A2F] font-semibold text-xs mt-0.5 block">
                    {incident.assignedRadioChannel}
                  </span>
                </div>
              </div>

              {/* Quick Status Modifiers */}
              <div className="pt-2 border-t border-[#EBE8E1]">
                <div className="text-[10px] uppercase font-semibold tracking-[0.08em] text-[#8F8C84] mb-2">
                  Triage Actions
                </div>
                <div className="flex flex-wrap gap-2">
                  {incident.status !== 'Resolved' ? (
                    <>
                      <button
                        onClick={() => onUpdateStatus(incident.id, 'Resolved')}
                        className="px-3 py-1.5 text-xs font-semibold rounded bg-[#D8EEDF] text-[#2E7D52] hover:bg-[#c2e4cc] border border-[#2E7D52]/40 transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Incident Resolved</span>
                      </button>
                      {incident.status !== 'Escalated' && (
                        <button
                          onClick={() => onUpdateStatus(incident.id, 'Escalated')}
                          className="px-3 py-1.5 text-xs font-semibold rounded bg-[#FBE3DE] text-[#B83A2C] hover:bg-[#fad0c7] border border-[#B83A2C]/30 transition-colors flex items-center gap-1.5"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Escalate to Level 2</span>
                        </button>
                      )}
                      {incident.status === 'Open' && (
                        <button
                          onClick={() => onUpdateStatus(incident.id, 'In Progress')}
                          className="px-3 py-1.5 text-xs font-semibold rounded bg-[#1E3A2F] text-[#FBFBFA] hover:bg-[#2E7D52] transition-colors"
                        >
                          Acknowledge & Dispatch
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => onUpdateStatus(incident.id, 'In Progress')}
                      className="px-3 py-1.5 text-xs font-medium rounded border border-[#E2DFD7] text-[#424844] hover:bg-[#F5F4F0]"
                    >
                      Re-open Incident
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-4">
              {/* Chronological Audit Timeline */}
              <div className="space-y-3 relative before:absolute before:inset-0 before:left-2.5 before:w-0.5 before:bg-[#E2DFD7]">
                {incident.auditTrail.map((item) => (
                  <div key={item.id} className="relative pl-7 group">
                    <div className="absolute left-1.5 top-1.5 w-2.5 h-2.5 rounded-full bg-[#1E3A2F] border-2 border-[#FBFBFA]" />
                    <div className="bg-[#F5F4F0] p-3 rounded border border-[#E2DFD7] space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-[#1D1C16]">
                          {item.action}
                        </span>
                        <span className="font-mono text-[#8F8C84] tabular-nums text-[10px]">
                          {item.timestamp}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#424844] font-mono">
                        {item.author} ({item.callsign})
                      </div>
                      <p className="text-xs text-[#1D1C16] pt-1 leading-relaxed">
                        {item.note}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Append Field Note Form */}
              <form onSubmit={handleAddNote} className="pt-2 border-t border-[#EBE8E1] space-y-2">
                <label className="block text-[10px] uppercase font-semibold tracking-[0.08em] text-[#8F8C84]">
                  Append Field Operational Note
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter dispatch observation or instruction..."
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#E2DFD7] rounded focus:outline-none focus:border-[#1E3A2F]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-semibold bg-[#1E3A2F] text-[#FBFBFA] rounded hover:bg-[#2E7D52] transition-colors flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>Log</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'payload' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-semibold tracking-[0.08em] text-[#8F8C84]">
                  Structured Telemetry Ingestion Payload
                </span>
                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1 text-[11px] font-medium text-[#1E3A2F] hover:text-[#2E7D52]"
                >
                  {copiedPayload ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#2E7D52]" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>

              {/* Sunken Inset Terminal */}
              <div
                className="bg-[#122219] p-3.5 rounded text-[#D8EEDF] font-mono text-[11px] leading-relaxed overflow-x-auto border border-[#07241A]"
                style={{
                  boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.4)',
                }}
              >
                <pre>{JSON.stringify(incident.payload, null, 2)}</pre>
              </div>
              <p className="text-[11px] text-[#8F8C84] leading-relaxed">
                Raw packets are validated against the Bhopal Operations Event Schema v2.1.
              </p>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-4 text-xs">
              <div className="bg-[#F5F4F0] p-3 rounded border border-[#E2DFD7] space-y-2">
                <div className="text-[10px] uppercase font-semibold tracking-[0.08em] text-[#8F8C84]">
                  Dispatched Tactical Unit
                </div>
                <div className="font-semibold text-sm text-[#1D1C16]">
                  {incident.assignedUnit}
                </div>
                <div className="flex items-center gap-2 text-[#424844] pt-1">
                  <User className="w-3.5 h-3.5 text-[#8F8C84]" />
                  <span>Lead Officer: {incident.leadOfficer}</span>
                </div>
                <div className="flex items-center gap-2 text-[#1E3A2F] font-mono">
                  <Radio className="w-3.5 h-3.5 text-[#2E7D52]" />
                  <span>Frequency: {incident.assignedRadioChannel}</span>
                </div>
              </div>

              <div className="p-3 rounded border border-[#E2DFD7] space-y-2 bg-[#FBFBFA]">
                <div className="text-[10px] uppercase font-semibold tracking-[0.08em] text-[#8F8C84]">
                  Radio Dispatch Broadcast Script
                </div>
                <p className="font-mono text-[11px] bg-[#EFECE5] p-2.5 rounded text-[#1D1C16] leading-relaxed border border-[#E2DFD7]">
                  "Echo-7 to {incident.assignedUnit.split(' ')[0]} · Reference {incident.id} at {incident.venueName}. Status: {incident.status}. Advise immediate corridor clearance."
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-[#EBE8E1] bg-[#F5F4F0] flex items-center justify-between text-xs">
          <span className="text-[#8F8C84] text-[11px]">
            Fieldnote Dossier ID: #{incident.id}
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 font-medium text-[#1E3A2F] border border-[#E2DFD7] rounded hover:bg-white transition-colors"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
};
