import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Download, FileText, Plus, ShieldCheck } from 'lucide-react';
import { KnowledgeDocument } from '../types';

interface KnowledgeDocsProps {
  documents: KnowledgeDocument[];
  onUploadDoc: (doc: Partial<KnowledgeDocument>) => void;
  activeMenu?: string;
}

export default function KnowledgeDocs({ documents, onUploadDoc, activeMenu }: KnowledgeDocsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');

  useEffect(() => {
    if (!activeMenu) return;
    if (activeMenu === 'circulars') {
      setSelectedType('Circular');
    } else if (activeMenu === 'policies') {
      setSelectedType('Policy');
    } else if (activeMenu === 'guidelines') {
      setSelectedType('Guideline');
    } else if (activeMenu === 'sops') {
      setSelectedType('SOP');
    }
  }, [activeMenu]);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState<'Circular' | 'Guideline' | 'Policy' | 'SOP'>('Circular');
  const [referenceNo, setReferenceNo] = useState('');

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.referenceNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === '' || doc.docType === selectedType;
    return matchesSearch && matchesType;
  });

  const handleDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !referenceNo) {
      alert('Supply guideline subject and reference code ID.');
      return;
    }

    onUploadDoc({
      title,
      docType,
      referenceNo,
      fileSize: '1.2 MB'
    });

    alert('Policy documentation registered in AIMS schema database successfully.');
    setTitle('');
    setReferenceNo('');
    setShowForm(false);
  };

  const handleDownload = (docTitle: string) => {
    alert(`Acquiring secure connection...\nFile Server clearance granted.\nDownloaded file: "${docTitle.toUpperCase().replace(/ /g, '_')}_AIMS_PSU.pdf"`);
  };

  return (
    <div id="aims-knowledge-bank" className="p-6 space-y-6 animate-fade-in font-sans">
      
      {/* Banner */}
      <div className="bg-white border border-slate-300 p-4 rounded-sm shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-800" />
            Policy Knowledge Bank & SOP Repository
          </h2>
          <p className="text-xs text-slate-500">Access official CVC Circulars, General Financial Rules (GFR), statutory directives, and plants-specific Standard Operating Procedures.</p>
        </div>
        <button
          id="toggle-upload-doc-btn"
          onClick={() => setShowForm(!showForm)}
          className="btn-primary-gov gap-1.5 self-start md:self-auto font-bold uppercase"
        >
          <Plus className="w-4 h-4" />
          Upload SOP/Directive
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-300 rounded-sm shadow-sm p-4 max-w-xl mx-auto animate-fade-in">
          <div className="flex justify-between items-center pb-2 border-b mb-3 text-xs font-bold text-slate-800 uppercase">
            <span>Form: POLICY_REGISTRATION_V3</span>
          </div>

          <form onSubmit={handleDocSubmit} className="space-y-4">
            <div>
              <label className="oracle-input-label block mb-1">Corporate Document Title / Subject</label>
              <input
                id="doc-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Circular: Unified Bidding and GFR compliance protocols"
                className="oracle-field-value w-full"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="oracle-input-label block mb-1">Document Category</label>
                <select
                  id="doc-type-select"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                  className="oracle-field-value w-full text-xs"
                >
                  <option value="Circular">Official Circular</option>
                  <option value="Guideline">CVC / PSU Guideline</option>
                  <option value="Policy">Asset Depreciation Policy</option>
                  <option value="SOP">SOP Upload</option>
                </select>
              </div>
              <div>
                <label className="oracle-input-label block mb-1">Reference No / ID code</label>
                <input
                  id="doc-ref-input"
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="e.g. VSP/CO/AUD-2026/04"
                  className="oracle-field-value w-full font-mono text-xs"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                id="doc-submit-btn"
                type="submit"
                className="flex-1 btn-primary-gov py-2 font-bold"
              >
                AUTHORIZE UPLOAD & LINK TO INDEX
              </button>
              <button
                id="doc-cancel-btn"
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary-gov text-xs py-2"
              >
                CANCEL
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Repository search and records */}
      <div className="bg-white border border-slate-300 rounded-sm shadow-sm p-4">
        
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="doc-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reference numbers, circular headers, rules..."
              className="oracle-field-value w-full pl-9 text-xs"
            />
          </div>
          <select
            id="doc-type-filter"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="oracle-field-value text-xs py-1"
          >
            <option value="">All Document Classes</option>
            <option value="Circular">Circulars</option>
            <option value="Guideline">CVC Guidelines</option>
            <option value="Policy">Policies</option>
            <option value="SOP">SOP Uploads</option>
          </select>
        </div>

        {/* Directory table layout */}
        <div className="overflow-x-auto bg-white border border-slate-300 rounded shadow-sm">
          <table className="w-full text-left font-sans text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-300 text-[10px] tracking-wider uppercase text-slate-700 font-bold">
                <th className="p-3">Document Class</th>
                <th className="p-3">Reference No</th>
                <th className="p-3">Policy Topic & Document Header</th>
                <th className="p-3">Publication Date</th>
                <th className="p-3 text-right">Download Size</th>
                <th className="p-3 text-right">Action Gate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-slate-800">
              {filteredDocs.map((doc) => (
                <tr id={`guideline-row-${doc.id}`} key={doc.id} className="hover:bg-slate-50 transition-all font-medium">
                  <td className="p-3">
                    <span className={`inline-block text-[9px] uppercase font-bold px-2.5 py-0.5 rounded border whitespace-nowrap ${
                      doc.docType === 'Circular' ? 'bg-indigo-50 border-indigo-200 text-indigo-805 text-indigo-800' :
                      doc.docType === 'Guideline' ? 'bg-amber-50 border-amber-200 text-amber-805 text-amber-805' :
                      doc.docType === 'Policy' ? 'bg-red-50 border-red-200 text-red-805' :
                      'bg-green-50 border-green-200 text-green-800'
                    }`}>
                      {doc.docType}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-900">{doc.referenceNo}</td>
                  <td className="p-3 font-bold text-slate-905 text-slate-800">{doc.title}</td>
                  <td className="p-3 text-slate-500 font-semibold">{doc.releaseDate}</td>
                  <td className="p-3 text-right font-mono text-slate-500">{doc.fileSize}</td>
                  <td className="p-3 text-right">
                    <button
                      id={`download-doc-btn-${doc.id}`}
                      onClick={() => handleDownload(doc.title)}
                      className="text-blue-900 border hover:bg-blue-50 border-slate-350 hover:border-blue-900 p-1.5 rounded-xs shadow-3xs cursor-pointer transition-all inline-flex items-center gap-1.5"
                      title="Download secure copy"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">GET PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDocs.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-xs italic">
            No compliance matches found within security dictionary index.
          </div>
        )}

      </div>

    </div>
  );
}
