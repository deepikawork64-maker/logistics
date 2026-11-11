import React, { useState } from 'react';
import { X, Mail, Sparkles, Send, CheckCircle2, RotateCcw } from 'lucide-react';
import { fallbackClassify, ClassificationResult } from '../services/classifier';
import { TEAM_MAP } from '../types/system';

interface IngestEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string, name: string, subject: string, body: string) => Promise<void>;
}

const PRESETS = [
  {
    label: 'VIP Ambassador Protocol Request',
    email: 'ambassador.morel@diplomatie.gouv.fr',
    name: 'Jean-Luc Morel',
    subject: 'VIP Delegation Arrival & Security Escort Protocol for Keynote',
    body: 'Dear Event Secretariat,\n\nI will be arriving at Raja Bhoj Airport on January 14 at 10:15 IST accompanying the official French ministerial delegation. Please ensure protocol liaison at the airhead and security clearance for our motorcade to Jehan Numa Palace.\n\nBest regards,\nJean-Luc Morel\nAmbassador',
  },
  {
    label: 'Hotel Room Allotment Choke',
    email: 'ananya.roy@csir.res.in',
    name: 'Prof. Ananya Roy',
    subject: 'Urgent: Hotel Room Booking Not Confirmed at Lake View Hotel',
    body: 'Hello Support Team,\n\nI have reached Bhopal but the reception desk at Lake View Hotel states my room under the summit allotment has not been confirmed. I am scheduled to present in the 14:00 session at Bhojpur Pavilion today.\n\nPlease help resolve this immediately.\n\nProf. Ananya Roy',
  },
  {
    label: 'Airport Shuttle Pickup',
    email: 'tariq.hashimi@araburban.org',
    name: 'Dr. Tariq Al-Hashimi',
    subject: 'Airport cab pickup required for 3 delegates on arrival',
    body: 'Hello,\n\nOur flight AI-434 lands at 13:45 IST today. We require a dedicated summit shuttle or cab transfer to Taj-ul-Masajid Concourse for 3 delegates with luggage.\n\nKindly confirm pickup driver details.\n\nThanks,\nDr. Tariq Al-Hashimi',
  },
  {
    label: 'Dietary Jain Requirement',
    email: 'kavita.jain@vcpartners.in',
    name: 'Kavita Jain',
    subject: 'Strict Jain vegetarian food requirement for delegate lunch',
    body: 'Dear Catering Team,\n\nCould you please confirm if Jain vegetarian meals (strictly no root vegetables/onion/garlic) will be prepared at the Bharat Bhavan dining hall for tomorrow lunch?\n\nThank you,\nKavita Jain',
  },
];

export const IngestEmailModal: React.FC<IngestEmailModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [email, setEmail] = useState(PRESETS[0].email);
  const [name, setName] = useState(PRESETS[0].name);
  const [subject, setSubject] = useState(PRESETS[0].subject);
  const [body, setBody] = useState(PRESETS[0].body);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Real-time keyword preview classification
  const previewAi: ClassificationResult = fallbackClassify(subject, body);
  const assignedTeam = TEAM_MAP[previewAi.category] || 'General Support';

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setEmail(preset.email);
    setName(preset.name);
    setSubject(preset.subject);
    setBody(preset.body);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !subject.trim() || !body.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(email.trim(), name.trim(), subject.trim(), body.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
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
            <Mail className="w-4 h-4 text-[#1E3A2F]" />
            <h3 className="font-serif font-semibold text-lg text-[#1D1C16]">
              Simulate Inbound Attendee Email (IMAP Pipeline)
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-[#8F8C84] hover:text-[#1D1C16]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Presets Strip */}
        <div className="p-3 bg-[#EFECE5] border-b border-[#E2DFD7] flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[10px] uppercase font-semibold text-[#8F8C84] shrink-0">
            Presets:
          </span>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-2.5 py-1 rounded bg-white hover:bg-[#F5F4F0] border border-[#E2DFD7] text-[11px] font-medium text-[#1E3A2F] whitespace-nowrap transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                Attendee Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 bg-white border border-[#E2DFD7] rounded focus:outline-none focus:border-[#1E3A2F]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                Attendee Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 bg-white border border-[#E2DFD7] rounded focus:outline-none focus:border-[#1E3A2F]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
              Subject Line
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Flight delay or VIP escort request (include [REQ-xxxxx] for replies)"
              className="w-full p-2 bg-white border border-[#E2DFD7] rounded focus:outline-none focus:border-[#1E3A2F]"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
              Email Body
            </label>
            <textarea
              rows={4}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full p-2 bg-white border border-[#E2DFD7] rounded focus:outline-none focus:border-[#1E3A2F]"
            />
          </div>

          {/* Real-time AI preview box */}
          <div className="p-3 rounded bg-[#F5F4F0] border border-[#E2DFD7] space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#1E3A2F]">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#2E7D52]" />
                <span>Classification Preview (pipeline.py)</span>
              </span>
              <span className="font-mono text-[#8F8C84] text-[10px]">
                Confidence {(previewAi.confidence || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-white border text-[#1D1C16] font-medium">
                Category: <strong>{previewAi.category}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-white border text-[#1D1C16] font-medium">
                Priority: <strong>{previewAi.priority}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-[#D8EEDF] text-[#2E7D52] font-semibold">
                Routes to: {assignedTeam}
              </span>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EBE8E1]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded border border-[#E2DFD7] text-[#424844] hover:bg-[#F5F4F0]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 font-semibold bg-[#1E3A2F] text-[#FBFBFA] rounded hover:bg-[#2E7D52] disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Ingesting...' : 'Ingest & Trigger Auto-Ack'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
