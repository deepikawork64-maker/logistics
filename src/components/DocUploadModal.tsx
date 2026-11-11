import React, { useState } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  parseSpreadsheetFile,
  parsePdfText,
  parseGoogleFormResponseSheet,
  ParseResult,
  GoogleFormSheetResult,
} from '../services/docParser';
import { Delegate, GoogleFormParsedResponse } from '../types/inviteOps';

interface DocUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportParsedData: (
    doc: {
      fileName: string;
      fileType: 'csv' | 'xlsx' | 'xls' | 'pdf';
      fileSize: string;
      recordCount: number;
      status: 'Parsed & Imported';
      previewRows?: Record<string, string>[];
    },
    delegates: Omit<Delegate, 'id' | 'interactions'>[]
  ) => void;
  onImportGoogleFormSheet: (
    responses: GoogleFormParsedResponse[],
    fileName: string
  ) => void;
}

export const DocUploadModal: React.FC<DocUploadModalProps> = ({
  isOpen,
  onClose,
  onImportParsedData,
  onImportGoogleFormSheet,
}) => {
  const [uploadMode, setUploadMode] = useState<'manifest' | 'gform'>('manifest');
  const [dragActive, setDragActive] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const [manifestResult, setManifestResult] = useState<ParseResult | null>(null);
  const [gformResult, setGformResult] = useState<GoogleFormSheetResult | null>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setIsParsing(true);
    setParseError(null);
    setManifestResult(null);
    setGformResult(null);

    const ext = file.name.split('.').pop()?.toLowerCase();
    try {
      if (uploadMode === 'gform') {
        if (ext !== 'xlsx' && ext !== 'xls' && ext !== 'csv') {
          throw new Error('Google Form responses sheet must be an Excel (.xlsx, .xls) or CSV file.');
        }
        const result = await parseGoogleFormResponseSheet(file);
        setGformResult(result);
      } else {
        if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
          const result = await parseSpreadsheetFile(file);
          setManifestResult(result);
        } else if (ext === 'pdf') {
          const result = await parsePdfText(file);
          setManifestResult(result);
        } else {
          throw new Error('Unsupported format. Please upload .xlsx, .xls, .csv, or .pdf');
        }
      }
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (uploadMode === 'gform') {
      if (!gformResult) return;
      onImportGoogleFormSheet(gformResult.responses, gformResult.fileName);
      onClose();
    } else {
      if (!manifestResult) return;
      onImportParsedData(
        {
          fileName: manifestResult.fileName,
          fileType: manifestResult.fileType,
          fileSize: manifestResult.fileSize,
          recordCount: manifestResult.delegates.length,
          status: 'Parsed & Imported',
          previewRows: manifestResult.previewRows,
        },
        manifestResult.delegates
      );
      onClose();
    }
  };

  // Sample synthetic loader for quick testing
  const loadSampleGoogleFormSheet = () => {
    setIsParsing(true);
    setParseError(null);
    setTimeout(() => {
      const sampleResponses: GoogleFormParsedResponse[] = [
        {
          email: 'suresh.narang@mpdiscom.gov.in',
          name: 'Suresh K. Narang',
          attending: true,
          organization: 'Madhya Pradesh Central Discom',
          dietary: 'Standard Vegetarian',
          hotelRequired: false,
          arrivalFlight: 'Self-drive from Govindpura',
          accompanyingGuests: 0,
          submittedAt: new Date().toISOString(),
          rawRecord: { 'Will you attend?': 'Yes', Dietary: 'Vegetarian' },
        },
        {
          email: 'dr.priya.saxena@aiimsbhopal.edu.in',
          name: 'Dr. Priya Saxena',
          attending: true,
          organization: 'AIIMS Bhopal Medical Command',
          dietary: 'Standard Vegetarian',
          hotelRequired: false,
          arrivalFlight: 'Local Medical Unit',
          accompanyingGuests: 1,
          notes: 'Emergency ambulance crew liaison confirmed on Ch-7',
          submittedAt: new Date().toISOString(),
          rawRecord: { 'Will you attend?': 'Yes' },
        },
        {
          email: 'vikram.singhania@apexindustrial.com',
          name: 'Vikramaditya K. Singhania',
          attending: true,
          organization: 'Apex Industrial Holdings',
          dietary: 'No specific requirements',
          hotelRequired: true,
          arrivalFlight: 'Private Charter Landing Raja Bhoj 09:30 IST',
          accompanyingGuests: 2,
          submittedAt: new Date().toISOString(),
          rawRecord: { 'Will you attend?': 'Yes', Hotel: 'Yes' },
        },
        {
          email: 'colin.vance@ukdelegation.gov.uk',
          name: 'Colin Vance (Deputy for Sir Robert Sterling)',
          attending: true,
          organization: 'Commonwealth Heritage Fund',
          dietary: 'Halal Certified / Continental',
          hotelRequired: true,
          arrivalFlight: 'BA-142 to Delhi, AI-433 to Bhopal',
          accompanyingGuests: 1,
          submittedAt: new Date().toISOString(),
          rawRecord: { 'Will you attend?': 'Yes' },
        },
      ];

      setGformResult({
        fileName: 'Google_Form_Responses_Bhopal_Summit_Export.xlsx',
        fileSize: '32.4 KB',
        responses: sampleResponses,
        rawHeaders: ['Timestamp', 'Email Address', 'Full Name', 'Will you attend?', 'Dietary', 'Hotel'],
      });
      setIsParsing(false);
    }, 600);
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
            <Upload className="w-5 h-5 text-[#1E3A2F]" />
            <div>
              <h3 className="font-serif font-semibold text-lg text-[#1D1C16]">
                Upload Delegate Manifest or Google Form Responses
              </h3>
              <p className="text-[11px] text-[#8F8C84]">
                Upload invitation databases or downloaded Google Form response spreadsheets.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-[#8F8C84] hover:text-[#1D1C16]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-[#E2DFD7] bg-[#EFECE5] px-4 pt-2 gap-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setUploadMode('manifest');
              setManifestResult(null);
              setGformResult(null);
            }}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              uploadMode === 'manifest'
                ? 'border-[#1E3A2F] text-[#1E3A2F]'
                : 'border-transparent text-[#8F8C84] hover:text-[#1D1C16]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>1. Delegate Manifest / Guest List (PDF, Excel, CSV)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setUploadMode('gform');
              setManifestResult(null);
              setGformResult(null);
            }}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              uploadMode === 'gform'
                ? 'border-[#2E7D52] text-[#2E7D52]'
                : 'border-transparent text-[#8F8C84] hover:text-[#1D1C16]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#2E7D52]" />
            <span>2. Google Form Responses Sheet (Excel / CSV)</span>
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Instructions banner */}
          <div className="p-3 bg-[#F5F4F0] rounded border border-[#E2DFD7] text-xs text-[#424844] leading-relaxed">
            {uploadMode === 'gform' ? (
              <div className="space-y-1">
                <span className="font-semibold text-[#2E7D52] block">
                  Google Form Responses Mode:
                </span>
                <p className="text-[11px]">
                  Upload the <strong>Excel or CSV spreadsheet downloaded directly from Google Forms</strong>.
                  The system will automatically match each attendee by email, update their RSVP status to{' '}
                  <strong className="text-[#2E7D52]">Confirmed</strong> or{' '}
                  <strong className="text-[#B83A2C]">Declined</strong>, and import their dietary preferences,
                  hotel requirements, and flight coordinates!
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <span className="font-semibold text-[#1E3A2F] block">
                  Delegate Manifest Mode:
                </span>
                <p className="text-[11px]">
                  Upload delegate lists, guest rosters, or registration databases in Excel (.xlsx, .xls), CSV,
                  or PDF format. Contacts merge automatically by email.
                </p>
              </div>
            )}
          </div>

          {/* Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`p-6 border-2 border-dashed rounded text-center transition-all cursor-pointer ${
              dragActive
                ? 'border-[#2E7D52] bg-[#D8EEDF]/20'
                : 'border-[#E2DFD7] hover:border-[#1E3A2F] bg-[#F5F4F0]/40'
            }`}
          >
            <input
              type="file"
              id="file-upload"
              accept={uploadMode === 'gform' ? '.csv,.xlsx,.xls' : '.csv,.xlsx,.xls,.pdf'}
              onChange={handleChange}
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer space-y-2 block">
              <div className="w-10 h-10 rounded-full bg-[#EFECE5] text-[#1E3A2F] flex items-center justify-center mx-auto">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-sm text-[#1E3A2F]">
                  Click to select file or drag & drop here
                </span>
                <p className="text-[11px] text-[#8F8C84] mt-0.5">
                  {uploadMode === 'gform'
                    ? 'Upload Google Forms Responses (.xlsx, .xls, .csv)'
                    : 'Upload Master Manifest (.xlsx, .xls, .csv, or .pdf)'}
                </p>
              </div>
            </label>
          </div>

          {/* Quick Sample Test Button for Google Form */}
          {uploadMode === 'gform' && !gformResult && (
            <div className="flex items-center justify-between p-2.5 bg-[#EFECE5] rounded border text-xs">
              <span className="text-[#424844] text-[11px]">
                Testing without a local file?
              </span>
              <button
                type="button"
                onClick={loadSampleGoogleFormSheet}
                className="px-2.5 py-1 text-xs font-semibold bg-white border border-[#2E7D52]/40 text-[#2E7D52] rounded hover:bg-[#D8EEDF] transition-colors"
              >
                Load Sample Google Form Sheet
              </button>
            </div>
          )}

          {/* Parsing Spinner */}
          {isParsing && (
            <div className="p-4 bg-[#F5F4F0] rounded border border-[#E2DFD7] text-center space-y-1">
              <span className="inline-block animate-spin w-4 h-4 border-2 border-[#1E3A2F] border-t-transparent rounded-full" />
              <div className="font-medium text-xs text-[#1D1C16]">
                Parsing spreadsheet and mapping questions...
              </div>
            </div>
          )}

          {/* Error Message */}
          {parseError && (
            <div className="p-3 bg-[#FBE3DE] text-[#B83A2C] rounded border border-[#B83A2C]/30 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Parsed Google Form Result Preview */}
          {gformResult && (
            <div className="space-y-3">
              <div className="p-3 bg-[#D8EEDF]/40 border border-[#2E7D52]/30 rounded flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-[#1D1C16]">
                    {gformResult.fileName}
                  </div>
                  <div className="text-[11px] text-[#2E7D52] font-mono">
                    Extracted {gformResult.responses.length} Google Form responses (
                    {gformResult.responses.filter((r) => r.attending).length} Attending,{' '}
                    {gformResult.responses.filter((r) => !r.attending).length} Declined)
                  </div>
                </div>
                <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-[#D8EEDF] text-[#2E7D52] font-semibold">
                  GOOGLE FORM EXCEL
                </span>
              </div>

              {/* Sample Rows */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-semibold text-[#8F8C84]">
                  Extracted Form Responses (Preview)
                </span>
                <div className="overflow-x-auto max-h-44 border border-[#E2DFD7] rounded bg-white">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-[#F5F4F0] border-b text-[10px] font-semibold text-[#424844] uppercase">
                      <tr>
                        <th className="p-2">Attendee Name</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">RSVP</th>
                        <th className="p-2">Dietary</th>
                        <th className="p-2">Hotel</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EBE8E1]">
                      {gformResult.responses.slice(0, 5).map((r, i) => (
                        <tr key={i} className="hover:bg-[#F5F4F0]">
                          <td className="p-2 font-medium">{r.name}</td>
                          <td className="p-2 font-mono text-[#8F8C84]">{r.email}</td>
                          <td className="p-2">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                r.attending ? 'bg-[#D8EEDF] text-[#2E7D52]' : 'bg-[#FBE3DE] text-[#B83A2C]'
                              }`}
                            >
                              {r.attending ? 'ATTENDING' : 'DECLINED'}
                            </span>
                          </td>
                          <td className="p-2 text-[#424844]">{r.dietary || '—'}</td>
                          <td className="p-2">{r.hotelRequired ? 'YES' : 'NO'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Parsed Manifest Result Preview */}
          {manifestResult && (
            <div className="space-y-3">
              <div className="p-3 bg-[#D8EEDF]/40 border border-[#2E7D52]/30 rounded flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-[#1D1C16]">
                    {manifestResult.fileName}
                  </div>
                  <div className="text-[11px] text-[#2E7D52] font-mono">
                    Extracted {manifestResult.delegates.length} delegate records (
                    {manifestResult.fileSize})
                  </div>
                </div>
                <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-[#D8EEDF] text-[#2E7D52] font-semibold">
                  {manifestResult.fileType}
                </span>
              </div>

              {/* Sample Rows */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-semibold text-[#8F8C84]">
                  Extracted Data Preview (First 5 Rows)
                </span>
                <div className="overflow-x-auto max-h-40 border border-[#E2DFD7] rounded bg-white">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-[#F5F4F0] border-b text-[10px] font-semibold text-[#424844] uppercase">
                      <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Organization</th>
                        <th className="p-2">Tier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EBE8E1]">
                      {manifestResult.delegates.slice(0, 5).map((d, i) => (
                        <tr key={i} className="hover:bg-[#F5F4F0]">
                          <td className="p-2 font-medium">{d.name}</td>
                          <td className="p-2 font-mono text-[#8F8C84]">{d.email}</td>
                          <td className="p-2">{d.organization || '—'}</td>
                          <td className="p-2 font-mono text-[10px]">{d.tier}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-[#EBE8E1]">
            <span className="text-[11px] text-[#8F8C84]">
              {uploadMode === 'gform'
                ? 'Updates attendees to Confirmed with dietary & hotel preferences.'
                : 'Upload continuous documents anytime. Merges by email.'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded border border-[#E2DFD7] text-[#424844] hover:bg-[#F5F4F0]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={uploadMode === 'gform' ? !gformResult : !manifestResult}
                onClick={handleConfirmImport}
                className="px-4 py-1.5 font-semibold bg-[#1E3A2F] text-[#FBFBFA] rounded hover:bg-[#2E7D52] disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {uploadMode === 'gform' ? 'Ingest Google Form Responses' : 'Ingest into Master Roster'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
