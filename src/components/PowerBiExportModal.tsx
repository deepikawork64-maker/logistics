import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, Check, Copy, ExternalLink } from 'lucide-react';
import { OpsStorage } from '../services/storage';

interface PowerBiExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PowerBiExportModal: React.FC<PowerBiExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedFile, setSelectedFile] = useState<string>('requests.csv');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const csvMap = OpsStorage.generatePowerBiCsvs();
  const fileNames = Object.keys(csvMap);

  const downloadFile = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
  };

  const handleDownloadAll = () => {
    for (const [name, content] of Object.entries(csvMap)) {
      downloadFile(name, content);
    }
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(csvMap[selectedFile]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[#07241A]/50 backdrop-blur-xs" onClick={onClose} />

      <div
        className="relative w-full max-w-3xl bg-[#FBFBFA] rounded border border-[#E2DFD7] shadow-xl overflow-hidden z-10 text-[#1D1C16]"
        style={{
          boxShadow:
            '0 20px 25px -5px rgba(21, 42, 32, 0.2), 0 10px 10px -5px rgba(21, 42, 32, 0.1)',
        }}
      >
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-[#EBE8E1] bg-[#F5F4F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#1E3A2F]" />
            <div>
              <h3 className="font-serif font-semibold text-lg text-[#1D1C16]">
                Power BI Dataset Export (`export_powerbi.py`)
              </h3>
              <p className="text-[11px] text-[#8F8C84]">
                Sanitized CSV extracts formatted for Power BI Desktop & Excel analytics.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-[#8F8C84] hover:text-[#1D1C16]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Instructions Box */}
          <div className="p-3 bg-[#EFECE5] rounded border border-[#E2DFD7] text-[#424844] space-y-1">
            <div className="font-semibold text-[#1E3A2F]">How to use in Power BI Desktop:</div>
            <p className="text-[11px] leading-relaxed">
              Open Power BI Desktop &rarr; Click <strong>Get Data</strong> &rarr; Select{' '}
              <strong>Text/CSV</strong> (or Folder). Load <code className="font-mono text-[#1E3A2F]">requests.csv</code>{' '}
              as the primary fact table. Message bodies are excluded to maintain attendee PII privacy.
            </p>
          </div>

          {/* File Selector Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2DFD7] pb-2">
            <div className="flex flex-wrap gap-1">
              {fileNames.map((name) => (
                <button
                  key={name}
                  onClick={() => setSelectedFile(name)}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${
                    selectedFile === name
                      ? 'bg-[#1E3A2F] text-[#FBFBFA]'
                      : 'bg-white text-[#424844] border border-[#E2DFD7] hover:bg-[#F5F4F0]'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyContent}
                className="px-2.5 py-1 text-xs border border-[#E2DFD7] rounded bg-white hover:bg-[#F5F4F0] flex items-center gap-1 text-[#1E3A2F]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#2E7D52]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy CSV'}</span>
              </button>
              <button
                onClick={() => downloadFile(selectedFile, csvMap[selectedFile])}
                className="px-3 py-1 text-xs font-semibold bg-[#1E3A2F] text-[#FBFBFA] rounded hover:bg-[#2E7D52] flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download {selectedFile}</span>
              </button>
            </div>
          </div>

          {/* CSV Preview */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-semibold text-[#8F8C84]">
              Preview ({selectedFile})
            </span>
            <div
              className="bg-[#122219] p-3 rounded text-[#D8EEDF] font-mono text-[11px] leading-relaxed max-h-56 overflow-auto border border-[#07241A]"
              style={{ boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.4)' }}
            >
              <pre>{csvMap[selectedFile].slice(0, 2500)}</pre>
              {csvMap[selectedFile].length > 2500 && (
                <div className="text-[#86a496] pt-2 text-[10px] italic">
                  ... ({csvMap[selectedFile].length - 2500} additional characters truncated in preview)
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-[#EBE8E1]">
            <span className="text-[11px] text-[#8F8C84]">
              Total dataset size: {fileNames.length} tables generated in-memory.
            </span>
            <button
              onClick={handleDownloadAll}
              className="px-4 py-1.5 font-semibold bg-[#1E3A2F] text-[#FBFBFA] rounded hover:bg-[#2E7D52] transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download All 5 Datasets</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
