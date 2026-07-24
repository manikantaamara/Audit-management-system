import React, { useState, useEffect } from 'react';
import { 
  Search, Calendar, User, FileText, Download, Eye, RotateCw, 
  AlertTriangle, CheckSquare, X, RefreshCw, BarChart2, ShieldAlert
} from 'lucide-react';

interface ConversionRecord {
  id: string;
  file_name: string;
  original_file_path: string;
  html_content: string;
  generated_pdf_path: string;
  uploaded_by: string;
  role_name: string;
  upload_date: string;
  status: string;
}

interface ConversionHistoryProps {
  currentUser: { name: string; role: string };
  onSelectMenu?: (menu: string) => void;
}

export default function ConversionHistory({ currentUser, onSelectMenu }: ConversionHistoryProps) {
  const [conversions, setConversions] = useState<ConversionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  // Search parameters
  const [searchFileName, setSearchFileName] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [searchDate, setSearchDate] = useState('');

  // Selected Conversions detail for viewing again
  const [previewingRecord, setPreviewingRecord] = useState<ConversionRecord | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setErrorText('');
    try {
      const response = await fetch('/api/conversions');
      if (!response.ok) {
        throw new Error('Could not pull converted documents registry.');
      }
      const data = await response.json();
      setConversions(data);
    } catch (e: any) {
      console.error(e);
      setErrorText(`Failed to load: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Filter list locally based on inputs
  const filteredConversions = conversions.filter(item => {
    const fileMatch = item.file_name.toLowerCase().includes(searchFileName.toLowerCase());
    const userMatch = item.uploaded_by.toLowerCase().includes(searchUser.toLowerCase()) || 
                      item.role_name.toLowerCase().includes(searchUser.toLowerCase());
    const dateMatch = searchDate === '' || item.upload_date.includes(searchDate);
    return fileMatch && userMatch && dateMatch;
  });

  const handleDownloadPdf = (record: ConversionRecord) => {
    if (!record.generated_pdf_path) {
      alert("Error: Stored PDF binary does not exist for this record yet. Please compile PDF in 'Report Preview & PDF Generator' screen first.");
      return;
    }

    try {
      const binary = atob(record.generated_pdf_path);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `AIMS_RETRIEVED_${record.file_name.replace(/\.[^/.]+$/, "")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  return (
    <div className="p-4 space-y-4 font-sans bg-slate-100 min-h-screen text-slate-800 pb-10" id="aims-conversion-history-vault">
      {/* 1. Header of Core Module */}
      <div className="bg-[#1e3a8a] text-white p-4 rounded border-b-[3px] border-yellow-500 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-5 bg-yellow-400 rounded-xs inline-block" />
            <h1 className="text-lg font-black uppercase tracking-wide">Reply Entry Conversion history</h1>
          </div>
          <p className="text-[11px] text-blue-200 mt-1 font-mono tracking-widest uppercase font-bold">ARCHIVAL RECORD TRAIL & COMPLIANCE PREVIEW CONSOLE</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchHistory}
            className="p-2 bg-blue-950 rounded hover:bg-blue-900 border border-blue-800 text-white cursor-pointer transition-all flex items-center gap-1.5 text-xs font-bold"
            title="Refresh history stream"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {errorText && (
        <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded shadow-2xs flex items-center gap-2.5 font-mono">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorText}</span>
        </div>
      )}

      {/* 2. Interactive Search filter panel */}
      <div className="bg-white border border-[#cbd5e1] rounded p-4 shadow-3xs space-y-3" id="history-search-filter-panel">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <Search className="w-4 h-4 text-blue-900" />
          <h2 className="text-xs font-black uppercase tracking-wider text-blue-950">Filter Archival Ledger</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* File Name Search */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase block font-mono">Search by File Name</label>
            <div className="relative">
              <input
                id="search-file-name-input"
                type="text"
                value={searchFileName}
                onChange={(e) => setSearchFileName(e.target.value)}
                placeholder="e.g. 'audit_report'"
                className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
              />
              <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* User / Role Search */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase block font-mono">Search by User / Designation</label>
            <div className="relative">
              <input
                id="search-user-input"
                type="text"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                placeholder="e.g. 'Shri R.K. Murthy' or 'Auditor'"
                className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
              />
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Date Search */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase block font-mono">Search by Date</label>
            <div className="relative">
              <input
                id="search-date-input"
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
              />
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Archival grid table */}
      <div className="bg-white border border-[#cbd5e1] rounded shadow-3xs overflow-hidden" id="archival-grid-table">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-slate-700">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-slate-200 text-slate-800 uppercase tracking-wider text-[9.5px] font-mono font-bold select-none">
                <th className="p-3">Auto Key ID</th>
                <th className="p-3">File Name</th>
                <th className="p-3">Uploaded By</th>
                <th className="p-3">Upload Date</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Stored PDF</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400 italic">
                    <RotateCw className="w-6 h-6 text-blue-900 animate-spin mx-auto mb-2" />
                    Fetching entries...
                  </td>
                </tr>
              ) : filteredConversions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400 italic font-mono text-[11px]">
                    No search results matched inside conversion ledger registry.
                  </td>
                </tr>
              ) : (
                filteredConversions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-blue-900">{item.id}</td>
                    <td className="p-3 font-black truncate max-w-xs" title={item.file_name}>{item.file_name}</td>
                    <td className="p-3">
                      <span className="font-extrabold text-slate-800 block">{item.uploaded_by}</span>
                      <span className="text-[10px] text-blue-700 font-semibold uppercase tracking-tight">{item.role_name}</span>
                    </td>
                    <td className="p-3 font-mono text-slate-600">{item.upload_date}</td>
                    <td className="p-3 text-center select-none">
                      <span className={`px-2 py-0.5 rounded-sm inline-block font-mono font-black uppercase text-[8.5px] border ${
                        item.status === 'Generated' 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                          : 'bg-yellow-50 border-yellow-250 text-yellow-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono font-black text-slate-600 select-none">
                      {item.generated_pdf_path 
                        ? `${(item.generated_pdf_path.length / 1024).toFixed(1)} KB` 
                        : <span className="text-slate-400 italic">None</span>
                      }
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => setPreviewingRecord(item)}
                        className="px-2.5 py-1 text-[10px] uppercase font-bold border border-slate-300 rounded bg-white hover:bg-slate-100 text-slate-700 font-mono flex items-center gap-1 inline-flex cursor-pointer transition-colors shadow-3xs"
                        title="View extracted HTML markup rendering"
                      >
                        <Eye className="w-3 h-3 text-blue-950" />
                        Preview HTML
                      </button>

                      <button
                        onClick={() => handleDownloadPdf(item)}
                        disabled={!item.generated_pdf_path}
                        className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded font-mono inline-flex items-center gap-1 cursor-pointer transition-colors shadow-3xs border ${
                          item.generated_pdf_path 
                            ? 'bg-yellow-500 border-yellow-600 text-blue-950 hover:bg-yellow-600' 
                            : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                        title={item.generated_pdf_path ? 'Download generated PDF archive' : 'PDF not compiled yet'}
                      >
                        <Download className="w-3 h-3" />
                        Download PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. HTML Preview Modal */}
      {previewingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in" id="html-preview-modal-dialog">
          <div className="bg-white border-[2px] border-blue-900 rounded-sm shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-[#1e3a8a] text-white px-4 py-3 flex items-center justify-between border-b border-blue-900">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-yellow-300" />
                <h3 className="text-xs font-black uppercase tracking-wider">
                  Reviewing Converted Document: {previewingRecord.file_name}
                </h3>
              </div>
              <button 
                onClick={() => setPreviewingRecord(null)}
                className="hover:bg-blue-950 text-slate-300 hover:text-white p-1 rounded transition-colors cursor-pointer"
                title="Close modal dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Subheader */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex flex-wrap justify-between text-[10.5px] font-mono text-slate-500 select-none">
              <span>Conversion Ref: <strong className="text-blue-900">{previewingRecord.id}</strong></span>
              <span>Uploader: <strong className="text-slate-800">{previewingRecord.uploaded_by} ({previewingRecord.role_name})</strong></span>
              <span>Upload Date: <strong className="text-slate-800">{previewingRecord.upload_date}</strong></span>
            </div>

            {/* Modal Scrollable Box */}
            <div className="p-6 bg-slate-100 overflow-y-auto flex-1">
              <div 
                className="prose prose-sm prose-slate max-w-none bg-white p-6 rounded border shadow-2xs leading-relaxed text-slate-800 markdown-body"
                dangerouslySetInnerHTML={{ __html: previewingRecord.html_content }}
              />
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex justify-between gap-2">
              <button
                onClick={() => handleDownloadPdf(previewingRecord)}
                disabled={!previewingRecord.generated_pdf_path}
                className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors ${
                  previewingRecord.generated_pdf_path 
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-blue-950 font-extrabold border border-yellow-600' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </button>

              <button
                onClick={() => setPreviewingRecord(null)}
                className="px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider bg-slate-900 text-white hover:bg-slate-850 cursor-pointer transition-colors font-mono"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
