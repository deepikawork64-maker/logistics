import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Upload,
  Clock,
  CheckCircle2,
  Users,
  Search,
  Eye,
  Download,
  FolderOpen,
} from 'lucide-react';
import { UploadedDocument, Delegate } from '../types/inviteOps';

interface DocumentRegistryViewProps {
  documents: UploadedDocument[];
  delegates: Delegate[];
  onOpenUpload: () => void;
  onSelectDelegate: (delegate: Delegate) => void;
}

export const DocumentRegistryView: React.FC<DocumentRegistryViewProps> = ({
  documents,
  delegates,
  onOpenUpload,
  onSelectDelegate,
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string>(documents[0]?.id || '');
  const [search, setSearch] = useState('');

  const selectedDoc = documents.find((d) => d.id === selectedDocId) || documents[0];
  const extractedDelegates = selectedDoc
    ? delegates.filter((d) => d.sourceDocName === selectedDoc.fileName)
    : [];

  const filteredExtracted = extractedDelegates.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return d.name.toLowerCase().includes(q) || d.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-[#EBE8E1]">
        <div>
          <h1 className="font-serif font-semibold text-2xl md:text-3xl text-[#1D1C16] tracking-tight">
            Document Repository & Continuous Manifest Ingestion
          </h1>
          <p className="text-xs md:text-sm text-[#424844] mt-1">
            Archival record of all uploaded PDF rosters, Excel spreadsheets, and CSV manifests.
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#FBFBFA] bg-[#1E3A2F] border border-[#152A20] rounded hover:bg-[#2E7D52] shadow-sm transition-colors cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>+ Upload Another Document (PDF/XLSX/CSV)</span>
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="bg-[#FBFBFA] p-12 rounded border border-[#EBE8E1] text-center space-y-3">
          <FolderOpen className="w-10 h-10 text-[#8F8C84] mx-auto" />
          <h3 className="font-serif text-lg text-[#1D1C16]">No Documents Uploaded Yet</h3>
          <p className="text-xs text-[#525048] max-w-md mx-auto">
            You can upload multiple Excel files (.xlsx, .xls), CSVs, or PDF delegate rosters continuously. Every document will be cataloged and parsed into your master roster.
          </p>
          <button
            onClick={onOpenUpload}
            className="px-4 py-2 text-xs font-semibold bg-[#1E3A2F] text-white rounded hover:bg-[#2E7D52] transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Your First Document</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document Cards List */}
          <div className="space-y-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8F8C84]">
              Uploaded Manifest Files ({documents.length})
            </div>

            <div className="space-y-2.5">
              {documents.map((doc) => {
                const isSelected = selectedDocId === doc.id;
                const isExcel = doc.fileType === 'xlsx' || doc.fileType === 'xls';
                const isCsv = doc.fileType === 'csv';
                const isPdf = doc.fileType === 'pdf';

                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`p-3.5 rounded border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-white border-[#1E3A2F] shadow-sm ring-1 ring-[#1E3A2F]'
                        : 'bg-[#FBFBFA] border-[#EBE8E1] hover:bg-[#F5F4F0]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        {isPdf ? (
                          <FileText className="w-4 h-4 text-[#B83A2C] shrink-0 mt-0.5" />
                        ) : (
                          <FileSpreadsheet className="w-4 h-4 text-[#2E7D52] shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-semibold text-xs text-[#1D1C16] leading-snug">
                            {doc.fileName}
                          </div>
                          <div className="text-[10px] text-[#8F8C84] mt-0.5">
                            Uploaded {new Date(doc.uploadedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <span className="font-mono text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-[#EFECE5] text-[#1E3A2F]">
                        {doc.fileType}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-black/5 text-[#424844]">
                      <span className="flex items-center gap-1 font-mono font-medium">
                        <Users className="w-3 h-3 text-[#1E3A2F]" />
                        <span>{doc.recordCount} Extracted Delegates</span>
                      </span>
                      <span className="font-mono text-[10px] text-[#8F8C84]">{doc.fileSize}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        {/* Selected Document Details & Extracted Delegates Table */}
        <div className="lg:col-span-2 bg-[#FBFBFA] rounded border border-[#EBE8E1] p-4 flex flex-col">
          {selectedDoc ? (
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2DFD7]">
                <div>
                  <h3 className="font-serif font-semibold text-base text-[#1D1C16]">
                    Manifest: {selectedDoc.fileName}
                  </h3>
                  <p className="text-[11px] text-[#8F8C84]">
                    {selectedDoc.recordCount} delegates extracted and matched in Master Roster.
                  </p>
                </div>

                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 text-[#8F8C84] absolute left-2 top-2 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search in manifest..."
                    className="w-full pl-7 pr-2 py-1 text-xs bg-white border border-[#E2DFD7] rounded text-[#1D1C16] focus:outline-none"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-x-auto max-h-[500px] overflow-y-auto border border-[#E2DFD7] rounded bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-[#F5F4F0] border-b text-[10px] font-semibold text-[#424844] uppercase tracking-wider">
                    <tr>
                      <th className="p-2.5">Delegate Name</th>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5">Organization</th>
                      <th className="p-2.5">Tier</th>
                      <th className="p-2.5">RSVP Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBE8E1]">
                    {filteredExtracted.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-xs text-[#8F8C84]">
                          No records match search filter.
                        </td>
                      </tr>
                    ) : (
                      filteredExtracted.map((d) => (
                        <tr
                          key={d.id}
                          onClick={() => onSelectDelegate(d)}
                          className="hover:bg-[#F5F4F0] transition-colors cursor-pointer group"
                        >
                          <td className="p-2.5 font-medium text-[#1D1C16] group-hover:underline">
                            {d.name}
                          </td>
                          <td className="p-2.5 font-mono text-[11px] text-[#8F8C84]">{d.email}</td>
                          <td className="p-2.5 text-[#424844]">{d.organization || '—'}</td>
                          <td className="p-2.5">
                            <span className="font-mono text-[10px] uppercase px-1 rounded bg-[#EFECE5] text-[#1E3A2F]">
                              {d.tier}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                                d.status === 'Confirmed (Attending)'
                                  ? 'bg-[#D8EEDF] text-[#2E7D52]'
                                  : d.status === 'Replied (Email)'
                                  ? 'bg-[#F4E7C5] text-[#976508]'
                                  : d.status === 'Declined'
                                  ? 'bg-[#FBE3DE] text-[#B83A2C]'
                                  : 'bg-[#EBE8E1] text-[#8F8C84]'
                              }`}
                            >
                              {d.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#8F8C84]">
              Select an uploaded document to review its extracted contacts.
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};
