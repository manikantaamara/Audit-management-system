import React, { useState, useEffect } from 'react';
import { 
  FileText, Save, Send, Upload, Download, Eye, Plus, Trash2, CheckCircle, 
  X, AlertCircle, RefreshCw, Layers, CheckSquare, CornerDownRight, ShieldCheck, HelpCircle
} from 'lucide-react';

export interface AuditReportEntry {
  id: string;
  audit_id: string;
  document_number: string;
  document_date: string;
  department: string;
  audit_type: string;
  auditor_name: string;
  audit_period: string;
  start_date: string;
  end_date: string;
  para_heading: string;
  para_class: string;
  reply_body: string;
  report_status: string;
  suggestion: string;
  attachment_url: string;
  created_by: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
  // Dynamic workflow comments added across cycles
  hod_remarks?: string;
  tl_comments?: string;
  review_decision?: string;
  tdr?: boolean;
  satisfactory?: 'Satisfactory' | 'Not Satisfactory' | string;
}

interface AuditReportEntryFormProps {
  role: 'Auditor' | 'HOD' | 'Team Lead' | 'Viewer' | 'Reviewer';
  currentUser: { name: string; username: string };
  onClose?: () => void;
}

export default function AuditReportEntryForm({ role, currentUser, onClose }: AuditReportEntryFormProps) {
  const [entries, setEntries] = useState<AuditReportEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<AuditReportEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form states for adding/editing a record
  const [auditId, setAuditId] = useState('PLN-2026-601');
  const [docNumber, setDocNumber] = useState('');
  const [docDate, setDocDate] = useState('');
  const [dept, setDept] = useState('Coke Ovens Division');
  const [auditType, setAuditType] = useState('Regular');
  const [auditorName, setAuditorName] = useState('');
  const [auditPeriod, setAuditPeriod] = useState('FY 2025-26 Q4');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Main Grid Items
  const [paraHeads, setParaHeads] = useState<{ id: string; sNo: number; heading: string; paraClass: 'Critical' | 'Major' | 'Minor' }[]>([
    { id: '1', sNo: 1, heading: 'OBSERVATION REGARDING RISK PURCHASE CASES (M13)', paraClass: 'Critical' }
  ]);
  const [newParaHeading, setNewParaHeading] = useState('');
  const [newParaClass, setNewParaClass] = useState<'Critical' | 'Major' | 'Minor'>('Major');

  // Reply section body
  const [replyBody, setReplyBody] = useState('');

  // Report Section (TDR, Satisfactory status)
  const [tdr, setTdr] = useState(false);
  const [satisfactoryVal, setSatisfactoryVal] = useState<'Satisfactory' | 'Not Satisfactory'>('Satisfactory');

  // Suggestion section
  const [suggestions, setSuggestions] = useState<{ id: string; sNo: number; suggestion: string }[]>([
    { id: '1', sNo: 1, suggestion: 'Necessary recovery of liquidated damages under Clause 9B should be completed.' }
  ]);
  const [newSuggestionText, setNewSuggestionText] = useState('');

  // Attached files simulation
  const [dragActive, setDragActive] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string }[]>([]);

  // Remarks across review steps
  const [hodRemarks, setHodRemarks] = useState('');
  const [tlComments, setTlComments] = useState('');
  const [statusVal, setStatusVal] = useState('Pending Reply');

  // Load all audit report entries from backend
  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit-report-entries');
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
        if (data.length > 0) {
          selectEntryRecord(data[0]);
        }
      } else {
        showFeedback('error', 'FRM-40105: Failed to fetch backend audit records.');
      }
    } catch (e) {
      showFeedback('error', 'Unable to establish secure connection to database system.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [role]);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  // Maps the selected entry details to interactive form controls
  const selectEntryRecord = (record: AuditReportEntry) => {
    setSelectedEntry(record);
    setAuditId(record.audit_id || 'PLN-2026-601');
    setDocNumber(record.document_number || '');
    setDocDate(record.document_date || '');
    setDept(record.department || 'Coke Ovens Division');
    setAuditType(record.audit_type || 'Regular');
    setAuditorName(record.auditor_name || '');
    setAuditPeriod(record.audit_period || 'FY 2025-26 Q4');
    setStartDate(record.start_date || '');
    setEndDate(record.end_date || '');
    
    // Parse headers if stored, or fallback to record's single para
    setParaHeads([
      { id: '1', sNo: 1, heading: record.para_heading || 'N/A', paraClass: (record.para_class as any) || 'Major' }
    ]);
    
    setReplyBody(record.reply_body || '');
    setTdr(record.tdr || false);
    setSatisfactoryVal((record.satisfactory as any) || 'Satisfactory');
    
    setSuggestions([
      { id: '1', sNo: 1, suggestion: record.suggestion || 'Routine audit observations review recommended.' }
    ]);

    setHodRemarks(record.hod_remarks || '');
    setTlComments(record.tl_comments || '');
    setStatusVal(record.status || 'Pending Reply');

    if (record.attachment_url) {
      setAttachedFiles([{ name: record.attachment_url, size: '2.5 MB' }]);
    } else {
      setAttachedFiles([]);
    }
  };

  // Add parameter heading to current draft grid
  const handleAddParaHeader = () => {
    if (!newParaHeading.trim()) return;
    const newSNo = paraHeads.length + 1;
    setParaHeads([
      ...paraHeads,
      { id: String(Date.now()), sNo: newSNo, heading: newParaHeading, paraClass: newParaClass }
    ]);
    setNewParaHeading('');
    showFeedback('success', `Added para heading ${newSNo} to active memory.`);
  };

  const handleRemoveParaHeader = (id: string) => {
    const filtered = paraHeads.filter(p => p.id !== id).map((p, idx) => ({ ...p, sNo: idx + 1 }));
    setParaHeads(filtered);
  };

  // Add suggestions to draft section grid
  const handleAddSuggestion = () => {
    if (!newSuggestionText.trim()) return;
    const newSNo = suggestions.length + 1;
    setSuggestions([
      ...suggestions,
      { id: String(Date.now()), sNo: newSNo, suggestion: newSuggestionText }
    ]);
    setNewSuggestionText('');
  };

  const handleRemoveSuggestion = (id: string) => {
    const filtered = suggestions.filter(s => s.id !== id).map((s, idx) => ({ ...s, sNo: idx + 1 }));
    setSuggestions(filtered);
  };

  // Save changes locally/backend as Draft
  const handleSaveDraft = async () => {
    setSaving(true);
    const payload = {
      audit_id: auditId,
      document_number: docNumber,
      document_date: docDate,
      department: dept,
      audit_type: auditType,
      auditor_name: auditorName || currentUser.name,
      audit_period: auditPeriod,
      start_date: startDate,
      end_date: endDate,
      para_heading: paraHeads[0]?.heading || '',
      para_class: paraHeads[0]?.paraClass || 'Major',
      reply_body: replyBody,
      suggestion: suggestions[0]?.suggestion || '',
      attachment_url: attachedFiles[0]?.name || '',
      tdr,
      satisfactory: satisfactoryVal,
      created_by: currentUser.username,
      role: role,
      status: 'Pending Reply'
    };

    try {
      const url = selectedEntry ? `/api/audit-report-entries/${selectedEntry.id}` : '/api/audit-report-entries';
      const method = selectedEntry ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedData = await res.json();
        showFeedback('success', 'ORA-00000: SQL Transaction Committed successfully. Draft saved.');
        fetchEntries();
      } else {
        showFeedback('error', 'SQL database write error during compilation.');
      }
    } catch (e) {
      showFeedback('error', 'Network failure during save operation.');
    } finally {
      setSaving(false);
    }
  };

  // Submit report response for review
  const handleSubmitResponse = async () => {
    if (!docNumber) {
      showFeedback('error', 'Validation Failure: Document Number is mandatory.');
      return;
    }
    setSaving(true);
    const payload = {
      audit_id: auditId,
      document_number: docNumber,
      document_date: docDate,
      department: dept,
      audit_type: auditType,
      auditor_name: auditorName || currentUser.name,
      audit_period: auditPeriod,
      start_date: startDate,
      end_date: endDate,
      para_heading: paraHeads[0]?.heading || '',
      para_class: paraHeads[0]?.paraClass || 'Major',
      reply_body: replyBody,
      suggestion: suggestions[0]?.suggestion || '',
      attachment_url: attachedFiles[0]?.name || '',
      tdr,
      satisfactory: satisfactoryVal,
      created_by: currentUser.username,
      role: role,
      status: 'Submitted'
    };

    try {
      const url = selectedEntry ? `/api/audit-report-entries/${selectedEntry.id}` : '/api/audit-report-entries';
      const method = selectedEntry ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showFeedback('success', 'Form officially SUBMITTED to HOD & Team Lead review registries.');
        fetchEntries();
      } else {
        showFeedback('error', 'SQL validation error during submission.');
      }
    } catch (e) {
      showFeedback('error', 'Network error during dispatch sequence.');
    } finally {
      setSaving(false);
    }
  };

  // HOD workflows
  const handleHODWorkflow = async (decision: 'Approve' | 'Re-Mark' | 'Send Back' | 'Finalize') => {
    if (!selectedEntry) return;
    setSaving(true);

    let nextStatus = 'Under HOD Review';
    if (decision === 'Approve') nextStatus = 'Approved';
    if (decision === 'Send Back') nextStatus = 'Pending Reply';
    if (decision === 'Finalize') nextStatus = 'Completed';
    if (decision === 'Re-Mark') nextStatus = 'Under HOD Review';

    const payload = {
      ...selectedEntry,
      status: nextStatus,
      hod_remarks: hodRemarks,
      role: 'HOD'
    };

    try {
      const res = await fetch(`/api/audit-report-entries/${selectedEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showFeedback('success', `Action: ${decision.toUpperCase()} committed successfully in HOD ledger.`);
        fetchEntries();
      } else {
        showFeedback('error', 'Error recording HOD decision.');
      }
    } catch (e) {
      showFeedback('error', 'Database write timed out.');
    } finally {
      setSaving(false);
    }
  };

  // Team Lead actions
  const handleTLWorkflow = async (approved: boolean) => {
    if (!selectedEntry) return;
    setSaving(true);

    const payload = {
      ...selectedEntry,
      status: approved ? 'Approved' : 'Under Review',
      tl_comments: tlComments,
      role: 'Team Lead'
    };

    try {
      const res = await fetch(`/api/audit-report-entries/${selectedEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showFeedback('success', approved ? 'Report successfully APPROVED by Team Lead.' : 'Team Lead review comment recorded.');
        fetchEntries();
      } else {
        showFeedback('error', 'Database write failure.');
      }
    } catch (e) {
      showFeedback('error', 'API server unreachable.');
    } finally {
      setSaving(false);
    }
  };

  // File drag & drop simulator
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const names = Array.from(e.dataTransfer.files).map((f: any) => ({ name: f.name, size: `${(f.size / 1024 / 1024).toFixed(1)} MB` }));
      setAttachedFiles([...attachedFiles, ...names]);
      showFeedback('success', 'File added to active upload buffer.');
    }
  };

  const selectMockFile = () => {
    const list = [
      { name: 'authorized_raw_purchase_report_v2.pdf', size: '1.8 MB' },
      { name: 'slag_safety_compliance_checks_2026.pdf', size: '3.1 MB' },
      { name: 'blast_furnace_disbursement_logs.xlsx', size: '0.8 MB' }
    ];
    const pick = list[Math.floor(Math.random() * list.length)];
    setAttachedFiles([pick]);
    showFeedback('success', `Vouched file attached: ${pick.name}`);
  };

  const clearEntryForm = () => {
    setSelectedEntry(null);
    setDocNumber('');
    setDocDate(new Date().toISOString().substring(0, 10));
    setDept('Purchase (Other than Raw Materials)');
    setAuditType('Regular');
    setAuditorName(currentUser.name);
    setAuditPeriod('FY 2026-27 Q1');
    setStartDate(new Date().toISOString().substring(0, 10));
    setEndDate(new Date().toISOString().substring(0, 10));
    setParaHeads([]);
    setReplyBody('');
    setTdr(false);
    setSatisfactoryVal('Satisfactory');
    setSuggestions([]);
    setAttachedFiles([]);
    setHodRemarks('');
    setTlComments('');
    setStatusVal('Pending Reply');
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'Completed':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'Submitted':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      case 'Under HOD Review':
      case 'Under Review':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      default:
        return 'bg-rose-50 text-rose-800 border-rose-300';
    }
  };

  const isReadOnly = role === 'Viewer';

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. SECURE METADATA & CONTROL DECK */}
      <div className="bg-[#1e293b] text-slate-100 p-4 border border-slate-700 rounded-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm select-none">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-500 text-slate-900 px-3 py-1.5 rounded font-black font-mono text-[11px] shadow-sm tracking-wider">
            ORACLE_FORM: AUD_REP_ENTRY_LEGACY
          </div>
          <div>
            <h3 className="text-[13.5px] font-black uppercase text-white tracking-wider flex items-center gap-1">
              <Layers className="w-4 h-4 text-yellow-400" />
              Audit Report Entry Central Form
            </h3>
            <span className="text-[10.5px] font-mono text-slate-400">
              Role Perspective: <strong className="text-yellow-400">{role.toUpperCase()}</strong> ({currentUser.name}) &bull; Status: Secured Connection
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {role !== 'Viewer' && (
            <button
              onClick={clearEntryForm}
              className="bg-yellow-500 text-slate-950 font-mono font-bold text-[10px] uppercase p-1.5 px-3 hover:bg-yellow-400 border border-yellow-600 rounded-xs transition-colors cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              New Entry (F5)
            </button>
          )}
          <button
            onClick={fetchEntries}
            className="bg-slate-800 text-slate-300 font-mono font-bold text-[10px] uppercase p-1.5 px-3 hover:bg-slate-755 border border-slate-700 rounded-xs transition-colors cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin-subtle" />
            Query (F8)
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 border-l-4 text-xs font-semibold rounded flex items-center gap-2 shadow-sm animate-flash ${
          feedback.type === 'success' ? 'bg-green-50 border-green-600 text-green-800' : 'bg-red-50 border-red-600 text-red-800'
        }`}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* 2. THREE PANEL MASTER DETAIL STRUCTURE */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* SIDEBAR: Active Record Index List */}
        <div className="lg:col-span-1 bg-white border-2 border-[#cbd5e1] rounded-sm shadow-xs overflow-hidden">
          <div className="bg-[#1e3a8a] text-white p-3 border-b border-blue-950 font-semibold text-[11px] font-mono tracking-widest uppercase">
            📁 Ledger Record Navigator
          </div>
          <div className="p-2 bg-[#f8fafc] border-b text-[10px] text-slate-500 italic block">
            Select standard corporate observation to load details:
          </div>
          <div className="divide-y divide-slate-150 max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 italic">Querying SQL database...</div>
            ) : entries.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 italic">No entries saved yet.</div>
            ) : (
              entries.map(entry => {
                const isSelected = selectedEntry?.id === entry.id;
                return (
                  <button
                    key={entry.id}
                    onClick={() => selectEntryRecord(entry)}
                    className={`w-full text-left p-3 text-xs transition-colors flex flex-col gap-1 hover:bg-[#f1f7ff] ${
                      isSelected ? 'bg-blue-50 border-l-[3px] border-blue-800' : 'bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-mono font-bold text-blue-900">{entry.id}</span>
                      <span className={`text-[8.5px] border font-semibold px-2 py-0.5 rounded-sm ${getStatusBadgeClass(entry.status)} font-mono`}>
                        {entry.status}
                      </span>
                    </div>
                    <p className="font-bold text-slate-800 truncate w-full">{entry.para_heading || 'No Heading'}</p>
                    <div className="flex justify-between items-center text-[9.5px] text-slate-400 font-mono mt-0.5">
                      <span className="truncate max-w-[100px]">{entry.department}</span>
                      <span>{entry.document_date}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* DETAILS COLUMN: Full Form entry values */}
        <div className="lg:col-span-3 bg-[#f8fafc] border-2 border-[#cbd5e1] rounded-sm shadow-md overflow-hidden flex flex-col">
          
          {/* Header Title Section */}
          <div className="bg-gradient-to-r from-blue-900 via-[#1e3a8a] to-blue-950 p-3 text-white border-b border-slate-900 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-yellow-400" />
              <div>
                <h4 className="text-xs font-bold font-mono text-slate-300 uppercase">FORM: AUDIT_REPORT_ENTRY_FORM_VSP</h4>
                <h3 className="text-sm font-black uppercase text-yellow-300">{selectedEntry ? `EDIT RECORD: ${selectedEntry.id}` : 'CREATE NEW AUDIT REPORT ENTRY'}</h3>
              </div>
            </div>
            {selectedEntry && (
              <span className={`text-[10px] font-mono border font-black uppercase px-2 py-0.5 rounded bg-slate-950 ${getStatusBadgeClass(statusVal)}`}>
                {statusVal}
              </span>
            )}
          </div>

          <div className="p-6 space-y-6">
            
            {/* 2A. AUDIT MASTER DETAILS HEADER (3x3 Responsive Grid) */}
            <div className="bg-white border border-[#cbd5e1] p-4 rounded-sm shadow-3xs space-y-4">
              <h5 className="text-[10px] font-mono font-bold text-[#1e3a8a] border-b pb-1.5 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-3 bg-yellow-400 inline-block rounded-xs" />
                Audit Parameters / Identification Details
              </h5>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                <div>
                  <label className="block text-[#1e3a8a] font-bold mb-1">Audit ID / Code</label>
                  <input 
                    type="text" 
                    value={auditId} 
                    onChange={e => !isReadOnly && setAuditId(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full bg-slate-50 border border-slate-300 p-2 font-mono font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500" 
                    placeholder="e.g. PLN-2026-601"
                  />
                </div>

                <div>
                  <label className="block text-[#1e3a8a] font-bold mb-1">Document Number</label>
                  <input 
                    type="text" 
                    value={docNumber} 
                    onChange={e => !isReadOnly && setDocNumber(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full bg-slate-50 border border-slate-300 p-2 font-mono font-bold text-slate-800 focus:ring-1 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 font-semibold" 
                    placeholder="e.g. RINL/AUD/M13/2026/04"
                  />
                </div>

                <div>
                  <label className="block text-[#1e3a8a] font-bold mb-1">Document Date</label>
                  <input 
                    type="date" 
                    value={docDate} 
                    onChange={e => !isReadOnly && setDocDate(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full bg-slate-50 border border-slate-300 p-2 font-mono focus:ring-1 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500" 
                  />
                </div>

                <div>
                  <label className="block text-[#1e3a8a] font-bold mb-1">Department</label>
                  <select 
                    value={dept} 
                    onChange={e => !isReadOnly && setDept(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full bg-slate-50 border border-slate-300 p-2 focus:ring-1 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 font-semibold"
                  >
                    <option value="Purchase (Other than Raw Materials)">Purchase (Other than Raw Materials)</option>
                    <option value="Coke Ovens Division">Coke Ovens Division</option>
                    <option value="Steel Melting Shop">Steel Melting Shop</option>
                    <option value="IT & ERP Department">IT & ERP Department</option>
                    <option value="Finance & Accounts Division">Finance & Accounts Division</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#1e3a8a] font-bold mb-1">Audit Type</label>
                  <select 
                    value={auditType} 
                    onChange={e => !isReadOnly && setAuditType(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full bg-slate-50 border border-slate-300 p-2 font-semibold focus:ring-1 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100"
                  >
                    <option value="Regular">Regular Scheduled</option>
                    <option value="Special">Special Investigative</option>
                    <option value="Statutory">Statutory Audit</option>
                    <option value="Compliance">Follow-Up Compliance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#1e3a8a] font-bold mb-1">Auditor Name</label>
                  <input 
                    type="text" 
                    value={auditorName} 
                    onChange={e => !isReadOnly && setAuditorName(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full bg-slate-50 border border-slate-300 p-2 focus:ring-1 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 font-semibold" 
                    placeholder="e.g. Smt. P. Lakshmi"
                  />
                </div>

                <div>
                  <label className="block text-[#1e3a8a] font-bold mb-1">Audit Period</label>
                  <input 
                    type="text" 
                    value={auditPeriod} 
                    onChange={e => !isReadOnly && setAuditPeriod(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full bg-slate-50 border border-slate-300 p-2 font-mono focus:ring-1 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500" 
                    placeholder="e.g. FY 2025-26 Q4"
                  />
                </div>

                <div>
                  <label className="block text-[#1e3a8a] font-bold mb-1">Start Date</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={e => !isReadOnly && setStartDate(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full bg-slate-50 border border-slate-300 p-2 font-mono focus:ring-1 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100" 
                  />
                </div>

                <div>
                  <label className="block text-[#1e3a8a] font-bold mb-1">End Date</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={e => !isReadOnly && setEndDate(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full bg-slate-50 border border-slate-300 p-2 font-mono focus:ring-1 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100" 
                  />
                </div>
              </div>

            </div>

            {/* 2B. MAIN GRID SECTION: Observation Para entries (Table Layout) */}
            <div className="bg-white border border-[#cbd5e1] p-4 rounded-sm shadow-3xs space-y-4">
              <h5 className="text-[10px] font-mono font-bold text-[#1e3a8a] border-b pb-1.5 uppercase tracking-widest flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-yellow-400 inline-block rounded-xs" />
                  Main Grid: Para Records
                </span>
                <span className="text-[9px] text-slate-400 lowercase font-mono">Dynamic table entry values</span>
              </h5>

              {/* Table Grid details */}
              <div className="overflow-x-auto border rounded border-[#cbd5e1]">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-[#f1f5f9] text-[#1e3a8a] font-mono select-none border-b border-[#cbd5e1] text-[10px] text-center">
                    <tr>
                      <th className="p-2.5 w-[60px] text-center font-bold">S.No</th>
                      <th className="p-2.5 text-left font-bold">Para Heading / Core Issue Details</th>
                      <th className="p-2.5 w-[140px] font-bold">Para Classification</th>
                      {!isReadOnly && <th className="p-2.5 w-[80px] font-bold">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {paraHeads.map(ph => (
                      <tr key={ph.id} className="hover:bg-slate-50" id={`form-grid-row-${ph.sNo}`}>
                        <td className="p-2.5 text-center font-mono font-bold text-slate-500">{ph.sNo}</td>
                        <td className="p-2.5 font-bold text-slate-800">{ph.heading}</td>
                        <td className="p-2.5 text-center">
                          <span className={`text-[9.5px] border font-bold px-2 py-0.5 rounded-sm inline-block uppercase font-mono ${
                            ph.paraClass === 'Critical' ? 'bg-red-50 border-red-300 text-red-700' :
                            ph.paraClass === 'Major' ? 'bg-orange-50 border-orange-300 text-orange-700' :
                            'bg-blue-50 border-blue-300 text-blue-700'
                          }`}>
                            {ph.paraClass}
                          </span>
                        </td>
                        {!isReadOnly && (
                          <td className="p-2 text-center">
                            <button
                              onClick={() => handleRemoveParaHeader(ph.id)}
                              className="text-red-600 hover:text-red-800 p-1 bg-red-50 rounded"
                              title="Delete finding line"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}

                    {/* Add Inline Row */}
                    {!isReadOnly && (
                      <tr className="bg-[#fcf8e3]/30">
                        <td className="p-2 text-center font-mono font-bold text-slate-400">+</td>
                        <td className="p-2">
                          <input 
                            type="text" 
                            value={newParaHeading}
                            onChange={e => setNewParaHeading(e.target.value)}
                            className="w-full bg-white border border-slate-300 p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-600" 
                            placeholder="Add new para observation heading..."
                          />
                        </td>
                        <td className="p-2 text-center">
                          <select
                            value={newParaClass}
                            onChange={e => setNewParaClass(e.target.value as any)}
                            className="w-full bg-white border border-slate-300 p-1.5 focus:outline-none font-mono text-[11px]"
                          >
                            <option value="Critical">Critical</option>
                            <option value="Major">Major</option>
                            <option value="Minor">Minor</option>
                          </select>
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={handleAddParaHeader}
                            className="bg-[#1e3a8a] text-white p-1.5 px-3 rounded-xs font-bold text-[11px] hover:bg-blue-900 cursor-pointer"
                          >
                            Add
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>

            {/* 2C. REPLY SECTION & REPORT SECTION (TDR & Satisfactory Status) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-white border border-[#cbd5e1] p-4 rounded-sm shadow-3xs space-y-3">
                <h5 className="text-[10px] font-mono font-bold text-[#1e3a8a] border-b pb-1.5 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-yellow-400 inline-block rounded-xs" />
                  Auditor / Department Reply (Body)
                </h5>
                <textarea
                  value={replyBody}
                  onChange={e => !isReadOnly && setReplyBody(e.target.value)}
                  disabled={isReadOnly}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-300 p-2.5 text-xs text-slate-800 leading-normal focus:ring-1 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100"
                  placeholder="Enter detailed observation reply response body here..."
                />
              </div>

              <div className="bg-white border border-[#cbd5e1] p-4 rounded-sm shadow-3xs space-y-4">
                <h5 className="text-[10px] font-mono font-bold text-[#1e3a8a] border-b pb-1.5 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-yellow-400 inline-block rounded-xs" />
                  Audit Report Clearance Sections
                </h5>
                
                <div className="space-y-4 text-xs font-sans">
                  
                  {/* TDR Checkbox */}
                  <div className="flex items-start gap-2 bg-[#f8fafc] p-3 border rounded border-slate-200">
                    <input 
                      type="checkbox" 
                      id="tdr-checkbox"
                      checked={tdr}
                      onChange={e => !isReadOnly && setTdr(e.target.checked)}
                      disabled={isReadOnly}
                      className="mt-0.5 w-4 h-4 text-blue-900 bg-slate-100 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <div>
                      <label htmlFor="tdr-checkbox" className="font-bold text-slate-800 cursor-pointer block leading-none">TDR (Transaction Disbursement Recovery)</label>
                      <span className="text-[10px] text-slate-400 mt-1 block">Toggle if exception findings warrant direct financial recovery sequences.</span>
                    </div>
                  </div>

                  {/* Satisfactory Select Buttons */}
                  <div>
                    <label className="block text-[#1e3a8a] font-bold mb-1.5">Verification Judgment Result</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => !isReadOnly && setSatisfactoryVal('Satisfactory')}
                        disabled={isReadOnly}
                        className={`p-2.5 border rounded text-center transition-all cursor-pointer font-bold uppercase text-[11px] flex justify-center items-center gap-1 leading-none ${
                          satisfactoryVal === 'Satisfactory' 
                            ? 'bg-emerald-55 bg-emerald-50 text-emerald-800 border-emerald-400 bg-emerald-100/50' 
                            : 'bg-white text-slate-500 border-slate-250 hover:bg-slate-50'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        Satisfactory Reply
                      </button>

                      <button
                        onClick={() => !isReadOnly && setSatisfactoryVal('Not Satisfactory')}
                        disabled={isReadOnly}
                        className={`p-2.5 border rounded text-center transition-all cursor-pointer font-bold uppercase text-[11px] flex justify-center items-center gap-1 leading-none ${
                          satisfactoryVal === 'Not Satisfactory' 
                            ? 'bg-rose-50 text-rose-800 border-rose-400 bg-rose-100/50' 
                            : 'bg-white text-slate-500 border-slate-250 hover:bg-slate-50'
                        }`}
                      >
                        <X className="w-4 h-4 text-rose-600 shrink-0" />
                        Not Satisfactory
                      </button>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* 2D. SUGGESTION SECTION (Tabular list of Suggestions) */}
            <div className="bg-white border border-[#cbd5e1] p-4 rounded-sm shadow-3xs space-y-3">
              <h5 className="text-[10px] font-mono font-bold text-[#1e3a8a] border-b pb-1.5 uppercase tracking-widest flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-yellow-400 inline-block rounded-xs" />
                  Suggestion &amp; Recommendations Section
                </span>
                <span className="text-[9px] text-slate-400 lowercase font-mono">Procedural improvements</span>
              </h5>

              <div className="space-y-3">
                <div className="overflow-x-auto border rounded border-[#cbd5e1]">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-[#f1f5f9] text-[#1e3a8a] font-mono select-none border-b border-[#cbd5e1] text-[10px] text-center">
                      <tr>
                        <th className="p-2 w-[60px] text-center font-bold">S.No</th>
                        <th className="p-2 text-left font-bold">Structured Suggestion Draft Buffer</th>
                        {!isReadOnly && <th className="p-2 w-[80px] font-bold">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {suggestions.map(sug => (
                        <tr key={sug.id} className="hover:bg-slate-50">
                          <td className="p-2 text-center font-mono font-bold text-slate-500">{sug.sNo}</td>
                          <td className="p-2 text-slate-700 leading-normal">{sug.suggestion}</td>
                          {!isReadOnly && (
                            <td className="p-2 text-center">
                              <button
                                onClick={() => handleRemoveSuggestion(sug.id)}
                                className="text-red-600 hover:text-red-800 p-1 bg-red-50 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}

                      {!isReadOnly && (
                        <tr className="bg-yellow-50/20">
                          <td className="p-2 text-center font-mono font-bold text-slate-400">+</td>
                          <td className="p-2">
                            <input 
                              type="text" 
                              value={newSuggestionText}
                              onChange={e => setNewSuggestionText(e.target.value)}
                              className="w-full bg-white border border-slate-300 p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600" 
                              placeholder="Enter recommended procedural compliance improvement..."
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              onClick={handleAddSuggestion}
                              className="bg-[#1e3a8a] text-white p-1.5 px-3 rounded-xs font-bold text-[11px] hover:bg-blue-900 cursor-pointer"
                            >
                              Add
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* 2E. FILE ACTIONS SECTION (Drag and Drop, View Files) */}
            <div className="bg-white border border-[#cbd5e1] p-4 rounded-sm shadow-3xs space-y-4">
              <h5 className="text-[10px] font-mono font-bold text-[#1e3a8a] border-b pb-1.5 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-3 bg-yellow-400 inline-block rounded-xs" />
                Evidence File Attachment / Actions
              </h5>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                {/* Drag Active Box */}
                {!isReadOnly ? (
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-md p-6 text-center transition-all ${
                      dragActive ? 'border-yellow-500 bg-yellow-50/30' : 'border-[#cbd5e1] bg-[#f8fafc] hover:bg-slate-50'
                    }`}
                  >
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-bounce-subtle" />
                    <p className="font-bold text-slate-700 leading-tight">Drag and drop supporting file here</p>
                    <p className="text-[11px] text-slate-400 mt-1">or click below to attach a verified audit document</p>
                    <button
                      onClick={selectMockFile}
                      className="mt-3.5 bg-[#1e293b] hover:bg-[#334155] text-white font-mono text-[10px] font-bold px-3 py-1.5 rounded-xs cursor-pointer uppercase shadow-3xs"
                    >
                      Attach Mock Scanned File
                    </button>
                  </div>
                ) : (
                  <div className="border border-[#cbd5e1] rounded-md p-6 text-center bg-[#f8fafc] flex flex-col items-center justify-center">
                    <ShieldCheck className="w-8 h-8 text-emerald-600 mb-2" />
                    <p className="font-bold text-[#1e3a8a] uppercase text-[10.5px] font-mono">Attachment lock active</p>
                    <p className="text-[10.5px] text-slate-500 mt-1 max-w-[200px]">Auditor documents are preserved in read-only security layout.</p>
                  </div>
                )}

                {/* View files list */}
                <div className="space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-2">Attached Document Buffer:</span>
                    {attachedFiles.length === 0 ? (
                      <div className="p-4 border border-dashed rounded text-center text-slate-405 italic">
                        No PDF/Word attachments logged for this entry.
                      </div>
                    ) : (
                      attachedFiles.map((file, idx) => (
                        <div key={idx} className="border border-slate-205 p-3 rounded bg-[#f1f7ff] flex justify-between items-center" id={`file-att-${idx}`}>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-700 shrink-0" />
                            <div>
                              <p className="font-bold text-slate-800 max-w-[170px] truncate">{file.name}</p>
                              <p className="text-[10px] text-slate-450 text-slate-400 font-mono">Size: {file.size}</p>
                            </div>
                          </div>
                          
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => alert(`Opening ${file.name} for core audit view...`)}
                              className="text-white bg-blue-700 hover:bg-blue-800 p-1 rounded font-mono text-[9px] uppercase px-2 font-bold flex items-center gap-0.5 cursor-pointer leading-none"
                              title="View file details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </button>
                            <button
                              onClick={() => alert(`Simulating safe download of contract document: ${file.name}`)}
                              className="text-white bg-[#1e293b] hover:bg-slate-800 p-1 rounded font-mono text-[9px] uppercase px-2 font-bold flex items-center gap-0.5 cursor-pointer leading-none"
                              title="Download backup file"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Get
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <p className="text-[10px] text-slate-450 leading-normal text-slate-400 font-mono italic">
                    Supported ERP system formats: .PDF, .DOCX, .XLSX, and validated high-res image scans (.JPG, .PNG)
                  </p>
                </div>
              </div>

            </div>

            {/* 2F. ROLE-BASED WORKFLOW CONTROL INTERFACES */}

            {/* AUDITOR / REVIEWER WORKSPACE ACTIONS */}
            {(role === 'Auditor' || role === 'Reviewer') && (
              <div className="bg-emerald-50/50 border-2 border-emerald-300 p-4 rounded-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-3xs">
                <div>
                  <span className="text-[9px] font-mono font-bold text-emerald-800 uppercase block">Active Sector Audit Cycle: Draft</span>
                  <p className="text-xs text-slate-600 mt-1 leading-snug">
                    Confirm all core exception values are registered securely. Submit directly for HOD/TL validation ledger reviews.
                  </p>
                </div>
                
                <div className="flex gap-3 justify-end shrink-0 w-full sm:w-auto">
                  <button
                    onClick={handleSaveDraft}
                    disabled={saving}
                    className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-900 border border-slate-950 text-white font-mono font-bold text-[10.5px] uppercase p-2.5 px-6 rounded-xs cursor-pointer shadow-3xs flex justify-center items-center gap-1.5"
                  >
                    <Save className="w-4 h-4 text-yellow-400" />
                    Save Draft (F10)
                  </button>

                  <button
                    onClick={handleSubmitResponse}
                    disabled={saving}
                    className="flex-1 sm:flex-initial bg-emerald-705 bg-emerald-700 hover:bg-emerald-800 border border-emerald-900 text-white font-mono font-bold text-[10.5px] uppercase p-2.5 px-6 rounded-xs cursor-pointer shadow-3xs flex justify-center items-center gap-1.5"
                  >
                    <Send className="w-4 h-4 text-white" />
                    Submit Reply
                  </button>
                </div>
              </div>
            )}

            {/* HOD DECISION CONTROL PANEL */}
            {role === 'HOD' && (
              <div className="bg-blue-50/50 border-2 border-blue-400 p-5 rounded-sm space-y-4 shadow-3xs">
                <div className="border-b border-blue-200 pb-2">
                  <span className="text-[9px] font-mono font-bold text-blue-800 uppercase block tracking-wider">HOD DECISION &amp; REMARKS CONTROL PANEL</span>
                  <p className="text-xs text-slate-600 mt-1">Review the field response reports and commit appropriate formal actions to progress report statuses.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                  <div>
                    <label className="block text-[#1e3a8a] font-bold mb-1.5">HOD Review Remarks</label>
                    <textarea
                      value={hodRemarks}
                      onChange={e => setHodRemarks(e.target.value)}
                      rows={3}
                      className="w-full bg-white border border-slate-300 p-2 text-xs text-slate-800 leading-normal focus:outline-none focus:ring-1 focus:ring-blue-600"
                      placeholder="Enter legal remarks, directives, or remarks to auditor..."
                    />
                  </div>

                  <div className="flex flex-col justify-between">
                    <div>
                      <label className="block text-[#1e3a8a] font-bold mb-1.5">Relational Workflow Status</label>
                      <select 
                        value={statusVal}
                        onChange={e => setStatusVal(e.target.value)}
                        className="w-full bg-white border border-[#cbd5e1] p-2 focus:ring-1 focus:ring-blue-600 font-mono text-[11px] font-bold"
                      >
                        <option value="Under HOD Review">Under HOD Review</option>
                        <option value="Approved">Approve and Save Outstanding</option>
                        <option value="Pending Reply">Return for Auditor Correction</option>
                        <option value="Completed">Completed and Closed</option>
                      </select>
                    </div>

                    <p className="text-[10px] text-slate-500 font-mono italic mt-2 leading-tight">
                      * Choosing Approve commits the findings list to the quarterly dashboard, triggering real-time notification alerts.
                    </p>
                  </div>
                </div>

                {/* HOD Action Buttons */}
                <div className="flex flex-wrap gap-2.5 pt-2">
                  <button
                    onClick={() => handleHODWorkflow('Approve')}
                    className="bg-emerald-700 hover:bg-emerald-800 font-mono text-white text-[10.5px] font-bold p-2 px-5 rounded-xs uppercase cursor-pointer flex items-center gap-1 shadow-3xs flex-1 md:flex-initial justify-center"
                  >
                    <CheckCircle className="w-4 h-4 text-white" />
                    Approve Reply
                  </button>

                  <button
                    onClick={() => handleHODWorkflow('Re-Mark')}
                    className="bg-slate-800 hover:bg-slate-900 font-mono text-white text-[10.5px] font-bold p-2 px-5 rounded-xs uppercase cursor-pointer flex items-center gap-1 shadow-3xs flex-1 md:flex-initial justify-center"
                  >
                    <RefreshCw className="w-4 h-4 text-yellow-400" />
                    Re-Mark Case
                  </button>

                  <button
                    onClick={() => handleHODWorkflow('Send Back')}
                    className="bg-rose-700 hover:bg-rose-800 font-mono text-white text-[10.5px] font-bold p-2 px-5 rounded-xs uppercase cursor-pointer flex items-center gap-1 shadow-3xs flex-1 md:flex-initial justify-center"
                  >
                    <X className="w-4 h-4 text-white" />
                    Send Back
                  </button>

                  <button
                    onClick={() => handleHODWorkflow('Finalize')}
                    className="bg-[#1e3a8a] hover:bg-blue-900 font-mono text-white text-[10.5px] font-black p-2 px-5 rounded-xs uppercase cursor-pointer flex items-center gap-1 shadow-3xs flex-1 md:flex-initial justify-center"
                  >
                    <ShieldCheck className="w-4 h-4 text-yellow-400" />
                    Finalize &amp; Close Form
                  </button>
                </div>
              </div>
            )}

            {/* TEAM LEAD WORKSPACE INTEGRATION */}
            {role === 'Team Lead' && (
              <div className="bg-indigo-50/50 border-2 border-indigo-300 p-5 rounded-sm space-y-4 shadow-3xs">
                <div className="border-b border-indigo-200 pb-2">
                  <span className="text-[9px] font-mono font-bold text-indigo-800 uppercase block tracking-wider">TEAM LEAD REVIEW GATEWAY</span>
                  <p className="text-xs text-slate-600 mt-1">Review the response compliance and attach review comments prior to HOD sign-off cycles.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                  <div>
                    <label className="block text-[#1e3a8a] font-bold mb-1.5">Review Comments / Verification Log</label>
                    <textarea
                      value={tlComments}
                      onChange={e => setTlComments(e.target.value)}
                      rows={3}
                      className="w-full bg-white border border-slate-300 p-2 text-xs text-slate-800 leading-normal focus:outline-none focus:ring-1 focus:ring-blue-600"
                      placeholder="Add reviewer recommendations, compliance ratings, or comments..."
                    />
                  </div>

                  <div className="flex flex-col justify-center text-xs space-y-3">
                    <p className="font-bold text-slate-800 block">Completeness Verification Checklist:</p>
                    <div className="space-y-1 bg-white p-3 border rounded border-indigo-150">
                      <div className="flex items-center gap-1.5 font-medium text-slate-600">
                        <CheckSquare className="w-4 h-4 text-indigo-700 shrink-0" />
                        <span>All structured suggestions complete</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium text-slate-600 mt-1">
                        <CheckSquare className="w-4 h-4 text-indigo-700 shrink-0" />
                        <span>Proper auditor signatures verified in attachments</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => handleTLWorkflow(false)}
                    className="bg-slate-800 hover:bg-slate-900 font-mono text-white text-[10.5px] font-bold p-2 px-5 rounded-xs uppercase cursor-pointer flex items-center gap-1 shadow-3xs"
                  >
                    <HelpCircle className="w-4 h-4 text-indigo-400" />
                    Comment &amp; Log Audit Review
                  </button>

                  <button
                    onClick={() => handleTLWorkflow(true)}
                    className="bg-indigo-700 hover:bg-indigo-800 font-mono text-white text-[10.5px] font-bold p-2 p-2 px-5 rounded-xs uppercase cursor-pointer flex items-center gap-1 shadow-3xs"
                  >
                    <CheckCircle className="w-4 h-4 text-white animate-pulse" />
                    Approve Recommendations
                  </button>
                </div>
              </div>
            )}

            {/* VIEWER SECURED NOTICE */}
            {role === 'Viewer' && (
              <div className="bg-slate-100 border-2 border-slate-350 p-4 rounded-sm flex items-start gap-3 select-none">
                <ShieldCheck className="w-6 h-6 text-[#1e3a8a] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-[#1e3a8a] uppercase block font-mono">Secured Read-Only Console Perspective</span>
                  <p className="text-slate-600 mt-1 leading-snug">
                    You have secure, comprehensive read-only rights for this audit report. All attachment views, suggested recoveries, and detailed remarks across review cycles are locked under current security guidelines.
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
