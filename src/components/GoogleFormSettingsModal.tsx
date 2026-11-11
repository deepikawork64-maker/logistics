import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Link2,
  Send,
  HelpCircle,
} from 'lucide-react';
import { GoogleFormConfig, Delegate } from '../types/inviteOps';

interface GoogleFormSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleFormConfig;
  onSaveConfig: (cfg: GoogleFormConfig) => void;
  delegates: Delegate[];
  onSimulateFormSubmission: (data: {
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
  }) => void;
}

export const GoogleFormSettingsModal: React.FC<GoogleFormSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  delegates,
  onSimulateFormSubmission,
}) => {
  const [formData, setFormData] = useState<GoogleFormConfig>(config);

  // Form Submission Simulator state
  const [simEmail, setSimEmail] = useState(delegates[0]?.email || 'dr.priya.saxena@aiimsbhopal.edu.in');
  const [simName, setSimName] = useState(delegates[0]?.name || 'Dr. Priya Saxena');
  const [simAttending, setSimAttending] = useState(true);
  const [simDietary, setSimDietary] = useState('Standard Vegetarian');
  const [simHotel, setSimHotel] = useState(true);
  const [simFlight, setSimFlight] = useState('AI-433 Landing 11:30 IST');
  const [simGuests, setSimGuests] = useState(1);
  const [simNotes, setSimNotes] = useState('Please reserve 2 seats in the Front VIP Row.');
  const [simSuccess, setSimSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    onClose();
  };

  const handleTriggerSim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simEmail.trim()) return;
    onSimulateFormSubmission({
      email: simEmail.trim(),
      name: simName.trim(),
      attending: simAttending,
      dietary: simDietary,
      hotelRequired: simHotel,
      arrivalFlight: simFlight,
      accompanyingGuests: Number(simGuests),
      notes: simNotes,
    });
    setSimSuccess(true);
    setTimeout(() => setSimSuccess(false), 3000);
  };

  const handleDelegateSelect = (email: string) => {
    setSimEmail(email);
    const d = delegates.find((x) => x.email === email);
    if (d) setSimName(d.name);
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
            <FileSpreadsheet className="w-5 h-5 text-[#2E7D52]" />
            <div>
              <h3 className="font-serif font-semibold text-lg text-[#1D1C16]">
                Google Form Auto-Sync Integration
              </h3>
              <p className="text-[11px] text-[#8F8C84]">
                Automatically fetch attendee responses, dietary requests, and hotel needs directly from
                Google Forms.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-[#8F8C84] hover:text-[#1D1C16]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
          {/* Status Chip */}
          <div className="p-3 bg-[#D8EEDF]/40 border border-[#2E7D52]/30 rounded flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2E7D52] animate-ping" />
              <div>
                <span className="font-semibold text-xs text-[#2E7D52] block">
                  Google Form Connected ({config.totalSubmissions} submissions recorded)
                </span>
                <span className="text-[10px] text-[#424844] font-mono">
                  Responses automatically match invitees by email address and update their profile.
                </span>
              </div>
            </div>
            <a
              href={config.formUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 text-xs font-semibold bg-white border border-[#2E7D52]/40 text-[#2E7D52] rounded hover:bg-[#D8EEDF] flex items-center gap-1"
            >
              <span>Open Form</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Form Settings */}
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                Google Form Public Link (Attached to Invitations)
              </label>
              <input
                type="url"
                required
                value={formData.formUrl}
                onChange={(e) => setFormData({ ...formData, formUrl: e.target.value })}
                className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                Google Sheets Response CSV / Webhook URL
              </label>
              <input
                type="url"
                required
                value={formData.responseSheetUrl}
                onChange={(e) => setFormData({ ...formData, responseSheetUrl: e.target.value })}
                className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-1.5 font-semibold bg-[#1E3A2F] text-white rounded hover:bg-[#2E7D52]"
              >
                Save Form URLs
              </button>
            </div>
          </form>

          {/* Interactive Simulation Sandbox */}
          <div className="p-4 bg-[#F5F4F0] rounded border border-[#E2DFD7] space-y-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#2E7D52]" />
              <h4 className="font-serif font-semibold text-sm text-[#1D1C16]">
                Interactive Google Form Submission Simulator
              </h4>
            </div>
            <p className="text-[11px] text-[#424844] leading-relaxed">
              Test what happens when a delegate fills out your Google Form. Their answers (dietary,
              hotel, flight, attendance) will automatically merge into their profile and flip their RSVP
              status to Confirmed!
            </p>

            {simSuccess && (
              <div className="p-2 bg-[#D8EEDF] text-[#2E7D52] rounded border text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Form submission synced! Delegate updated to Confirmed.</span>
              </div>
            )}

            <form onSubmit={handleTriggerSim} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                    Select Delegate
                  </label>
                  <select
                    value={simEmail}
                    onChange={(e) => handleDelegateSelect(e.target.value)}
                    className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none"
                  >
                    {delegates.map((d) => (
                      <option key={d.id} value={d.email}>
                        {d.name} ({d.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                    RSVP Attendance Answer
                  </label>
                  <select
                    value={simAttending ? 'yes' : 'no'}
                    onChange={(e) => setSimAttending(e.target.value === 'yes')}
                    className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none"
                  >
                    <option value="yes">Yes, I will attend the Summit in Bhopal</option>
                    <option value="no">Regrets, Unable to attend</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                    Dietary Requirements
                  </label>
                  <select
                    value={simDietary}
                    onChange={(e) => setSimDietary(e.target.value)}
                    className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none"
                  >
                    <option value="Strict Jain Vegetarian">Strict Jain Vegetarian</option>
                    <option value="Standard Vegetarian">Standard Vegetarian</option>
                    <option value="Halal Certified">Halal Certified</option>
                    <option value="Vegan">Vegan</option>
                    <option value="No Special Requirement">No Special Requirement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                    Hotel Accommodation
                  </label>
                  <select
                    value={simHotel ? 'yes' : 'no'}
                    onChange={(e) => setSimHotel(e.target.value === 'yes')}
                    className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none"
                  >
                    <option value="yes">Yes, Summit Partner Hotel Needed</option>
                    <option value="no">No, Self-Arranged Stay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                    Flight / Train Coordinates
                  </label>
                  <input
                    type="text"
                    value={simFlight}
                    onChange={(e) => setSimFlight(e.target.value)}
                    placeholder="e.g. AI-433 Landing 11:30"
                    className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                  Special Protocol Remarks
                </label>
                <input
                  type="text"
                  value={simNotes}
                  onChange={(e) => setSimNotes(e.target.value)}
                  placeholder="e.g. VIP Ramp Gate 2 escort needed"
                  className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold bg-[#2E7D52] text-white rounded hover:bg-[#186c42] flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Simulate Google Form Webhook Sync</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
