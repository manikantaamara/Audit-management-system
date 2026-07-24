import React, { useState, useEffect, useRef } from 'react';
import { 
  Reply, CornerDownRight, CheckCircle2, UserCheck, RefreshCw, Landmark,
  Save, Printer, Search, PlusSquare, Trash2, ChevronLeft, ChevronRight, HelpCircle,
  Minimize2, Maximize2, X, Download, FileText, Check, AlertTriangle, Filter, Eye, ListFilter
} from 'lucide-react';
import { AuditPara, AuditReport, Employee } from '../types';
import MonthlyPlanning, { MonthlyPlanRecord } from './MonthlyPlanning';
import AnnualPlanning, { AnnualPlanRecord } from './AnnualPlanning';
import AuditReportEntryForm from './AuditReportEntryForm';

interface ReplyEntryComponentProps {
  paras: AuditPara[];
  reports: AuditReport[];
  employees: Employee[];
  onUpdatePara: (id: string, updates: Partial<AuditPara>) => void;
  currentUser: { name: string; role: string; department: string };
  activeMenu?: string;
}

interface PendingParaItem {
  id: string;
  sn: number;
  description: string;
  status: 'Pending' | 'Under Review' | 'Resolved';
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
}

export default function ReplyEntryComponent({ 
  paras, reports, employees, onUpdatePara, currentUser, activeMenu
}: ReplyEntryComponentProps) {
  const [activeTab, setActiveTab] = useState<'detail_entry' | 'marking' | 'remarking'>('detail_entry');

  // NEW EDITOR PLANNING STATES
  const [planningMode, setPlanningMode] = useState<'monthly' | 'annual'>('monthly');

  const [monthlyPlanningData, setMonthlyPlanningData] = useState<Record<string, MonthlyPlanRecord[]>>({
    "MAY_2026": [
      { id: 'm1', weekNo: 'Week 1', plannedReplies: 12, completedReplies: 10, pendingReplies: 2, status: 'Pending' },
      { id: 'm2', weekNo: 'Week 2', plannedReplies: 15, completedReplies: 15, pendingReplies: 0, status: 'Completed' },
      { id: 'm3', weekNo: 'Week 3', plannedReplies: 10, completedReplies: 4, pendingReplies: 6, status: 'Delayed' },
      { id: 'm4', weekNo: 'Week 4', plannedReplies: 8, completedReplies: 2, pendingReplies: 6, status: 'Pending' }
    ]
  });

  const [annualPlanningData, setAnnualPlanningData] = useState<AnnualPlanRecord[]>([
    { month: 'APRIL', target: 50, completed: 42, pending: 8, percentage: 84 },
    { month: 'MAY', target: 45, completed: 30, pending: 15, percentage: 67 },
    { month: 'JUNE', target: 55, completed: 20, pending: 35, percentage: 36 },
    { month: 'JULY', target: 60, completed: 0, pending: 60, percentage: 0 },
    { month: 'AUGUST', target: 40, completed: 0, pending: 40, percentage: 0 },
    { month: 'SEPTEMBER', target: 50, completed: 0, pending: 50, percentage: 0 },
    { month: 'OCTOBER', target: 65, completed: 0, pending: 65, percentage: 0 },
    { month: 'NOVEMBER', target: 55, completed: 0, pending: 55, percentage: 0 },
    { month: 'DECEMBER', target: 45, completed: 0, pending: 45, percentage: 0 },
    { month: 'JANUARY', target: 50, completed: 0, pending: 50, percentage: 0 },
    { month: 'FEBRUARY', target: 40, completed: 0, pending: 40, percentage: 0 },
    { month: 'MARCH', target: 60, completed: 0, pending: 60, percentage: 0 }
  ]);

  useEffect(() => {
    if (!activeMenu) return;
    if (activeMenu === 'reply_details') {
      setActiveTab('detail_entry');
    } else if (activeMenu === 'reply_marking') {
      setActiveTab('marking');
    } else if (activeMenu === 'reply_remarking') {
      setActiveTab('remarking');
    }
  }, [activeMenu]);

  // --- ORACLE WORKSPACE STATES ---
  const [department, setDepartment] = useState('Purchase (Other than Raw Materials)');
  const [iomFrom, setIomFrom] = useState('HOD (IT)');
  const [refNo, setRefNo] = useState('RINL/IT/AUDIT/2026/14');
  const [copyTo, setCopyTo] = useState('ED (Works), GM (Finance)');
  const [periodFrom, setPeriodFrom] = useState('2026-04-01');
  const [periodTo, setPeriodTo] = useState('2026-05-28');
  const [iomTo, setIomTo] = useState('GM (F&A)');
  const [iomDate, setIomDate] = useState('2026-05-28');

  // Interactive Window State
  const [windowState, setWindowState] = useState<'normal' | 'maximized' | 'minimized'>('normal');

  // Menu Dropdown states
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Status Bar status
  const [statusBarMsg, setStatusBarMsg] = useState('FRM-44102: Form initialized. Press F9/Double-Click on Department to view LOV.');

  // "Pending Paras" Data Grid list (Prefilled with 4 required sample items)
  const [pendingRecords, setPendingRecords] = useState<PendingParaItem[]>([
    { id: 'p1', sn: 1, description: "OBSERVATION REGARDING RISK PURCHASE CASES (M13)", status: "Pending", priority: "High", dueDate: "2026-06-15" },
    { id: 'p2', sn: 2, description: "Observation on Non-blocking of Vendors due to Quality Complaints", status: "Under Review", priority: "Medium", dueDate: "2026-06-30" },
    { id: 'p3', sn: 3, description: "NON RESOLUTION OF QUALITY COMPLAINTS", status: "Pending", priority: "High", dueDate: "2026-06-10" },
    { id: 'p4', sn: 4, description: "DELAY IN SUPPLIES IN CASE OF RISK PURCHASE ITEMS", status: "Resolved", priority: "Low", dueDate: "2026-07-15" }
  ]);

  // Selected Row in Pending Paras table
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);

  // --- COMPLIANCE DRAFT REPLIES & SUGGESTIONS STATES ---
  const [draftReplies, setDraftReplies] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('aims_draft_replies');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      'p1': 'Comprehensive risk assessment and purchase analysis complete. Active recovery of penalty values is registered.',
      'p2': 'Quality standard procedures reviewed and finalized. Vendor blocking mechanism initiated for non-compliant parties.',
      'p3': 'Show-cause notices dispatched to default contractors. Remedial measures completed successfully.',
      'p4': 'Transit delay resolved with the alternative supplier. Stocks buffer restored for urgent demands.'
    };
  });

  const [suggestionsEntries, setSuggestionsEntries] = useState<Record<string, {
    suggestions_entry: string;
    auditId: string;
    replyId: string;
    departmentId: string;
    recordId: string;
    userId: string;
    createdBy: string;
    createdDate: string;
    modifiedBy: string;
    modifiedDate: string;
  }>>(() => {
    const saved = localStorage.getItem('aims_suggestions_entry_records');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      'p1': {
        suggestions_entry: 'Recommend establishing a dedicated compliance oversight board and automating penalty tracking inside the purchase ledger system.',
        auditId: 'AUD-P1-2026',
        replyId: 'REP-P1-RLY',
        departmentId: 'Purchase (Other than Raw Materials)',
        recordId: 'p1',
        userId: 'hod_usr',
        createdBy: 'Smt. P. Lakshmi',
        createdDate: '2026-06-08 09:00:00',
        modifiedBy: 'Smt. P. Lakshmi',
        modifiedDate: '2026-06-08 09:15:00'
      },
      'p2': {
        suggestions_entry: 'Suggest draft revisions to vendor listing manual under Section 4B to enforce mandatory blocking upon repeated quality infractions.',
        auditId: 'AUD-P2-2026',
        replyId: 'REP-P2-RLY',
        departmentId: 'Purchase (Other than Raw Materials)',
        recordId: 'p2',
        userId: 'hod_usr',
        createdBy: 'Smt. P. Lakshmi',
        createdDate: '2026-06-08 09:05:00',
        modifiedBy: 'Smt. P. Lakshmi',
        modifiedDate: '2026-06-08 09:20:00'
      }
    };
  });

  const [suggestions, setSuggestions] = useState([
    {
      id: 'sug-1',
      title: 'Risk Purchase Clause Recovery',
      category: 'Financial',
      content: 'The necessary recovery of liquidated damages and penalty values under Clause 9B has been finalized. Active financial recoveries initiated successfully from outstanding balance bills.'
    },
    {
      id: 'sug-2',
      title: 'Vendor Quality Blocking Protocol',
      category: 'Procurement',
      content: 'Under compliance guidelines, non-performing vendor blocking registry has been updated in AIMS ERP system, and all future tenders are temporarily suspended.'
    },
    {
      id: 'sug-3',
      title: 'Remedial Show-Cause Dispatch',
      category: 'Legal',
      content: 'Official warning & show-cause notice registered and issued to the contracted supply wing. Corrective Action Plan (CAP) demanded within 14 business days.'
    },
    {
      id: 'sug-4',
      title: 'Materials Transit Delay Buffer',
      category: 'Logistics',
      content: 'Alternative procurement routes utilized and raw stock buffers elevated by 15% to safeguard against transit bottlenecks. Regular weekly status reports enabled.'
    },
    {
      id: 'sug-5',
      title: 'Standard General Audit Compliance',
      category: 'Compliance',
      content: 'The procedural recommendations of the internal audit have been fully reviewed, complied with, and integrated into standard division system manual controls.'
    }
  ]);

  const [suggestionSearch, setSuggestionSearch] = useState('');
  const [newSugTitle, setNewSugTitle] = useState('');
  const [newSugCat, setNewSugCat] = useState('Compliance');
  const [newSugContent, setNewSugContent] = useState('');

  // --- POPUP LOV SEARCH WINDOW STATES ---
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupSearchQuery, setPopupSearchQuery] = useState('');
  const [selectedPopupIndex, setSelectedPopupIndex] = useState(0);

  // Sample LOV details
  const sampleDepts = [
    { name: "Purchase (Other than Raw Materials)", status: "Active Replies", period: "FY 2026-27" },
    { name: "Purchase (Raw Materials)", status: "Pending Action", period: "FY 2026-27" },
    { name: "Agra BSO", status: "Under Review", period: "FY 2025-26" },
    { name: "BC Gate Marketing", status: "Completed", period: "FY 2025-26" },
    { name: "Coke Ovens Division", status: "Under Review", period: "FY 2026-27" },
    { name: "Steel Melting Shop", status: "Active Replies", period: "FY 2026-27" }
  ];

  const filteredDepts = sampleDepts.filter(dept => 
    dept.name.toLowerCase().includes(popupSearchQuery.toLowerCase()) ||
    dept.status.toLowerCase().includes(popupSearchQuery.toLowerCase()) || 
    dept.period.toLowerCase().includes(popupSearchQuery.toLowerCase())
  );

  // References
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard navigation for LOV Popup Window
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPopupOpen) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedPopupIndex(prev => (prev + 1) % filteredDepts.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedPopupIndex(prev => (prev - 1 + filteredDepts.length) % filteredDepts.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredDepts[selectedPopupIndex]) {
          commitSelectedDept(filteredDepts[selectedPopupIndex].name);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsPopupOpen(false);
        setStatusBarMsg('FRM-40105: List of Values (LOV) window canceled.');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPopupOpen, filteredDepts, selectedPopupIndex]);

  // Keyboard navigation for tabular rows when focus is on workspace and popup is closed
  useEffect(() => {
    const handleWorkspaceKeyDown = (e: KeyboardEvent) => {
      if (isPopupOpen) return;
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return; // Allow standard input interactions
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedRowIndex(prev => Math.min(prev + 1, pendingRecords.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedRowIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'F9') {
        e.preventDefault();
        openDepartmentLOV();
      }
    };

    window.addEventListener('keydown', handleWorkspaceKeyDown);
    return () => window.removeEventListener('keydown', handleWorkspaceKeyDown);
  }, [isPopupOpen, pendingRecords]);

  // Auto-focus search box inside popup
  useEffect(() => {
    if (isPopupOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isPopupOpen]);

  // Helper to trigger LOV Popup
  const openDepartmentLOV = () => {
    setPopupSearchQuery('');
    setSelectedPopupIndex(0);
    setIsPopupOpen(true);
    setStatusBarMsg('LOV Window opened. Use Find to filter & arrow keys/Click to select.');
  };

  // Commit pop-up selection
  const commitSelectedDept = (deptName: string) => {
    setDepartment(deptName);
    setIsPopupOpen(false);
    // Prefill some fields depending on department choice to increase fidelity
    if (deptName.includes('Raw Materials')) {
      setIomFrom('ED (Raw Materials)');
      setIomTo('GM (MM)');
      setRefNo(`RINL/MM-URGENT/2026/${Math.floor(100 + Math.random() * 900)}`);
    } else if (deptName.includes('Agra')) {
      setIomFrom('BSO Agra Rep');
      setIomTo('GM (Marketing)');
      setRefNo(`RINL/MKTG-AGRA/2026/${Math.floor(100 + Math.random() * 900)}`);
    } else {
      setIomFrom('HOD (Services)');
      setIomTo('GM (Finance)');
      setRefNo(`RINL/SER-CORR/2026/${Math.floor(100 + Math.random() * 900)}`);
    }
    setStatusBarMsg(`FRM-41008: Value of Department changed to "${deptName}" successfully.`);
  };

  // Toolbar Actions
  const handleSaveAll = () => {
    if (!department || !iomFrom || !periodFrom || !periodTo || !iomDate) {
      alert('Error: Please complete all highlighted yellow required fields first.');
      setStatusBarMsg('FRM-30006: Required field cannot be left blank.');
      return;
    }
    
    // Simulate updating paras list to parent prop if applicable
    if (paras.length > 0 && pendingRecords.length > 0) {
      // update first para as test
      onUpdatePara(paras[0].id, {
        replyContent: `[Oracle Forms Response] IOM Date: ${iomDate}, Ref: ${refNo}, Dept: ${department}. Detailed remedial counter active.`,
        status: 'Under Review'
      });
    }

    // Persist draft replies and suggestions entry data structures to local storage
    localStorage.setItem('aims_draft_replies', JSON.stringify(draftReplies));
    localStorage.setItem('aims_suggestions_entry_records', JSON.stringify(suggestionsEntries));

    alert(`COMMIT SUCCESSFUL!\nOracle Database System returned:\nFRM-40400: Transaction complete: ${pendingRecords.length} records applied and saved.`);
    setStatusBarMsg(`FRM-40400: Transaction complete: 1 block transaction saved successfully at ${new Date().toLocaleTimeString()}.`);
  };

  const handlePrintForm = () => {
    const printContent = `
========================================================================
             VISAKHAPATNAM STEEL PLANT - AUDIT DIVISION
               Official Form Audit Schedule & Reply Summary
========================================================================
DEPARTMENT   : ${department}
IOM FROM     : ${iomFrom}            IOM TO      : ${iomTo}
REF NO       : ${refNo}               IOM DATE    : ${iomDate}
COPY TO      : ${copyTo}
PERIOD       : ${periodFrom} To ${periodTo}
------------------------------------------------------------------------
                             PENDING PARAS LIST
------------------------------------------------------------------------
${pendingRecords.map(item => `${item.sn}. ${item.description}
   [Status: ${item.status}]  [Priority: ${item.priority}]  [Due Date: ${item.dueDate}]`).join('\n\n')}
========================================================================
Generated on : ${new Date().toLocaleString()} (Intranet Secure Terminal)
    `;

    const blob = new Blob([printContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VSP-Audit-Form-Reply-${department.replace(/[^a-z0-9]/gi, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setStatusBarMsg('FRM-40502: Print summary successfully dispatched to download terminal.');
  };

  const handleAddParaRow = () => {
    const newSn = pendingRecords.length + 1;
    const newPara: PendingParaItem = {
      id: `p-${Date.now()}`,
      sn: newSn,
      description: `NEW LOGGED DETAIL OBSERVATION FIELD (${newSn})`,
      status: 'Pending',
      priority: 'Medium',
      dueDate: '2026-06-30'
    };
    setPendingRecords(prev => [...prev, newPara]);
    setSelectedRowIndex(pendingRecords.length);
    setStatusBarMsg(`FRM-40100: Blank outstanding record inserted. Record row #${newSn}.`);
  };

  const handleDeleteParaRow = () => {
    if (pendingRecords.length <= 1) {
      alert('Cannot delete the last remaining record row block.');
      return;
    }
    const target = pendingRecords[selectedRowIndex];
    if (!target) return;

    if (confirm(`Do you want to delete row #${selectedRowIndex + 1}: ${target.description.substring(0, 30)}?`)) {
      setPendingRecords(prev => {
        const remaining = prev.filter((_, i) => i !== selectedRowIndex);
        // re-render index
        return remaining.map((item, idx) => ({ ...item, sn: idx + 1 }));
      });
      setSelectedRowIndex(prev => Math.max(0, prev - 1));
      setStatusBarMsg('FRM-40102: Selected record row deleted from buffer block.');
    }
  };

  const handleResetForm = () => {
    if (confirm('Clear all fields to reset default Oracle buffer values?')) {
      setDepartment('Purchase (Other than Raw Materials)');
      setIomFrom('HOD (IT)');
      setIomTo('GM (F&A)');
      setRefNo('RINL/IT/AUDIT/2026/14');
      setCopyTo('ED (Works), GM (Finance)');
      setPeriodFrom('2026-04-01');
      setPeriodTo('2026-05-28');
      setIomDate('2026-05-28');
      setPendingRecords([
        { id: 'p1', sn: 1, description: "OBSERVATION REGARDING RISK PURCHASE CASES (M13)", status: "Pending", priority: "High", dueDate: "2026-06-15" },
        { id: 'p2', sn: 2, description: "Observation on Non-blocking of Vendors due to Quality Complaints", status: "Under Review", priority: "Medium", dueDate: "2026-06-30" },
        { id: 'p3', sn: 3, description: "NON RESOLUTION OF QUALITY COMPLAINTS", status: "Pending", priority: "High", dueDate: "2026-06-10" },
        { id: 'p4', sn: 4, description: "DELAY IN SUPPLIES IN CASE OF RISK PURCHASE ITEMS", status: "Resolved", priority: "Low", dueDate: "2026-07-15" }
      ]);
      setSelectedRowIndex(0);
      setStatusBarMsg('FRM-40350: Form record query buffer cleared and initialized.');
    }
  };

  // Keyboard and value alteration states for rows
  const handleRowValueChange = (index: number, field: keyof PendingParaItem, value: any) => {
    setPendingRecords(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: value
      };
      return copy;
    });
    setStatusBarMsg(`FRM-41001: Grid value changed.`);
  };


  // --- STANDARD SECTOR HOD ASSIGNMENT LOGIC ---
  const [selectedParaId, setSelectedParaId] = useState('');
  const [targetEmployeeId, setTargetEmployeeId] = useState('');

  const handleMarkingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParaId || !targetEmployeeId) {
      alert('Ensure you select both a detailed paragraph and assign standard active personnel.');
      return;
    }

    onUpdatePara(selectedParaId, {
      markedToEmployeeId: targetEmployeeId
    });

    const emp = employees.find(e => e.id === targetEmployeeId);
    alert(`Marking complete: observation directed officially to ${emp ? emp.name : 'Target Employee'}. Email notice dispatched.`);
    setSelectedParaId('');
    setTargetEmployeeId('');
  };

  return (
    <div id="aims-reply-module" className="p-4 space-y-4 animate-fade-in font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Tab Select Panel */}
      <div className="bg-slate-800 border-b border-slate-700 p-2.5 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-2">
          <Landmark className="w-5 h-5 text-yellow-500 shrink-0" />
          <div>
            <span className="bg-blue-900 border border-blue-700 text-yellow-400 font-mono text-[9px] px-1 font-bold rounded-xs leading-none">RINL PSU CENTRAL</span>
            <p className="text-sm font-bold uppercase tracking-wide">Audit Response Management</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button 
            id="reply-tab-btn-detail"
            onClick={() => setActiveTab('detail_entry')}
            className={`px-3 py-1 text-xs font-bold rounded-xs transition-all cursor-pointer border ${
              activeTab === 'detail_entry' 
                ? 'bg-yellow-500 text-slate-950 border-yellow-600 shadow-xs' 
                : 'bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-650'
            }`}
          >
            Reply Details Entry (Oracle)
          </button>
          <button 
            id="reply-tab-btn-marking"
            onClick={() => setActiveTab('marking')}
            className={`px-3 py-1 text-xs font-bold rounded-xs transition-all cursor-pointer border ${
              activeTab === 'marking' 
                ? 'bg-yellow-500 text-slate-950 border-yellow-600 shadow-xs' 
                : 'bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-650'
            }`}
          >
            Assignment (Marking)
          </button>
          <button 
            id="reply-tab-btn-remarking"
            onClick={() => setActiveTab('remarking')}
            className={`px-3 py-1 text-xs font-bold rounded-xs transition-all cursor-pointer border ${
              activeTab === 'remarking' 
                ? 'bg-yellow-500 text-slate-950 border-yellow-600 shadow-xs' 
                : 'bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-650'
            }`}
          >
            Remarks Audit List
          </button>
        </div>
      </div>

      {/* RENDER ORACLE WINDOW OR STANDARD SCREEN */}
      {activeTab === 'detail_entry' ? (
        
        <div className="bg-slate-705 bg-slate-700 border border-slate-900 shadow-md rounded-xs overflow-hidden pb-1" id="oracle-canvas-wrapper">
          
          {/* ORACLE WINDOW TITLE FRAME */}
          <div className="bg-[#104b8f] text-white px-2.5 py-1.5 flex items-center justify-between text-xs select-none border-b border-blue-900 shadow-inner">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse" />
              <span className="font-sans font-bold select-all">
                Visakhapatnam Steel Plant - Audit Information System [Active Form: REPLY_TRANS_ENTRY]
              </span>
            </div>
            
            {/* Standard Vintage Oracle window elements */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => { setWindowState('minimized'); alert('Minimize Form to Taskbar. Click anywhere on Tab Select to restore.'); }}
                className={`text-slate-200 hover:text-white hover:bg-slate-800/40 p-0.5 rounded cursor-pointer ${windowState === 'minimized' ? 'bg-indigo-900' : ''}`}
                title="Minimize Form Window"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setWindowState(prev => prev === 'maximized' ? 'normal' : 'maximized')}
                className="text-slate-200 hover:text-white hover:bg-slate-800/40 p-0.5 rounded cursor-pointer"
                title="Toggle Maximize Form"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => { if (confirm('Exiting Reply Entry session...')) handleResetForm(); }}
                className="text-slate-200 hover:text-red-400 hover:bg-red-900/40 p-0.5 rounded cursor-pointer"
                title="Close Application Layer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* CLASSIC MENU BAR */}
          <div className="bg-[#f0f0f0] border-b border-slate-350 px-2 py-1 flex flex-wrap text-slate-800 text-[11px] font-sans relative select-none">
            {[
              { label: 'Action', items: [
                { name: 'Save Statement (F10)', action: handleSaveAll },
                { name: 'Print Schedule (Ctrl+P)', action: handlePrintForm },
                { name: 'Exit (Ctrl+Q)', action: handleResetForm }
              ]},
              { label: 'Edit', items: [
                { name: 'Add Para Record', action: handleAddParaRow },
                { name: 'Delete Current Para', action: handleDeleteParaRow },
                { name: 'Clear Form Fields', action: handleResetForm }
              ]},
              { label: 'Query', items: [
                { name: 'Open Dept LOV', action: openDepartmentLOV },
                { name: 'Filter Outstanding Grid', action: () => alert('Query-by-example ready in Pending Paras grid table.') }
              ]},
              { label: 'Block', items: [{ name: 'Validate Current Block', action: () => setStatusBarMsg('FRM-41100: Block evaluation completed. OK.') }]},
              { label: 'Record', items: [
                { name: 'First Record', action: () => setSelectedRowIndex(0) },
                { name: 'Last Record', action: () => setSelectedRowIndex(pendingRecords.length - 1) }
              ]},
              { label: 'Field', items: [{ name: 'Display Help', action: () => alert('Press F9 inside Department box to open Search values.') }]},
              { label: 'Help', items: [
                { name: 'Keyboard Help', action: () => alert('F9: Open List of Values (LOV)\nF10: Commit Block Save\nCtrl+P: Print / Export data\nArrow Up/Down: Navigate Rows') },
                { name: 'AIMS Database Version Info', action: () => alert('Audit Information Management System (AIMS) v12.2c (Oracle 12c WebLogic Replica Engine)') }
              ]},
              { label: 'Window', items: [{ name: 'AIMS Response Console', action: () => {} }]}
            ].map((menu) => (
              <div 
                key={menu.label} 
                className="relative group"
                onMouseEnter={() => setOpenMenu(menu.label)}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <button 
                  id={`oracle-menu-btn-${menu.label}`}
                  className="px-3 py-0.5 hover:bg-[#124b8f] hover:text-white cursor-pointer font-medium rounded-xs text-left"
                >
                  {menu.label}
                </button>
                
                {openMenu === menu.label && (
                  <div className="absolute left-0 top-full bg-white border border-slate-400 py-1 shadow-md w-52 z-30 divide-y divide-slate-100 rounded-sm">
                    {menu.items.map((sub, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          sub.action();
                          setOpenMenu(null);
                        }}
                        className="w-full text-left px-3 py-1.5 text-[11.5px] text-slate-700 hover:bg-[#124b8f] hover:text-white font-medium"
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ORACLE STANDARD COMPACT GRAY TOOLBAR */}
          <div className="bg-[#e4e4e4] border-b border-slate-350 p-1.5 flex items-center justify-between text-slate-800 shrink-0 select-none">
            <div className="flex items-center gap-1">
              <button 
                id="oracle-toolbar-save"
                onClick={handleSaveAll}
                className="p-1 px-2 border-r border-[#bebebe] hover:bg-[#d5d5d5] hover:shadow-xs active:bg-[#cbcbca] text-slate-800 flex items-center gap-1 font-bold text-[10px] cursor-pointer"
                title="Save Statement (F10)"
              >
                <Save className="w-3.5 h-3.5 text-blue-800" />
                <span>SAVE</span>
              </button>

              <button 
                id="oracle-toolbar-print"
                onClick={handlePrintForm}
                className="p-1 px-2 border-r border-[#bebebe] hover:bg-[#d5d5d5] hover:shadow-xs active:bg-[#cbcbca] text-slate-800 flex items-center gap-1 font-bold text-[10px] cursor-pointer"
                title="Print Form Schedule (Ctrl+P)"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-800" />
                <span>PRINT</span>
              </button>

              <button 
                id="oracle-toolbar-search"
                onClick={openDepartmentLOV}
                className="p-1 px-2 border-r border-[#bebebe] hover:bg-[#d5d5d5] hover:shadow-xs active:bg-[#cbcbca] text-slate-800 flex items-center gap-1 font-bold text-[10px] cursor-pointer"
                title="Query Department list (F9)"
              >
                <Search className="w-3.5 h-3.5 text-slate-700" />
                <span>FIND DEPT</span>
              </button>

              <button 
                id="oracle-toolbar-add"
                onClick={handleAddParaRow}
                className="p-1 px-2 border-r border-[#bebebe] hover:bg-[#d5d5d5] hover:shadow-xs active:bg-[#cbcbca] text-slate-800 flex items-center gap-1 font-bold text-[10px] cursor-pointer"
                title="Insert New Outstanding Record"
              >
                <PlusSquare className="w-3.5 h-3.5 text-indigo-700" />
                <span>ADD ROW</span>
              </button>

              <button 
                id="oracle-toolbar-delete"
                onClick={handleDeleteParaRow}
                className="p-1 px-2 border-r border-[#bebebe] hover:bg-[#d5d5d5] hover:shadow-xs active:bg-[#cbcbca] text-slate-800 flex items-center gap-1 font-bold text-[10px] cursor-pointer"
                title="Delete Selected Grid Observation"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-700" />
                <span>DELETE</span>
              </button>

              <button 
                id="oracle-toolbar-prev"
                onClick={() => setSelectedRowIndex(prev => Math.max(0, prev - 1))}
                className="p-1 px-1.5 hover:bg-[#d5d5d5] hover:shadow-xs text-slate-800 cursor-pointer"
                title="Previous Row"
              >
                <ChevronLeft className="w-4 h-4 text-slate-700" />
              </button>

              <button 
                id="oracle-toolbar-next"
                onClick={() => setSelectedRowIndex(prev => Math.min(prev + 1, pendingRecords.length - 1))}
                className="p-1 px-1.5 border-r border-[#bebebe] hover:bg-[#d5d5d5] hover:shadow-xs text-slate-800 cursor-pointer"
                title="Next Row"
              >
                <ChevronRight className="w-4 h-4 text-slate-700" />
              </button>

              <button 
                id="oracle-toolbar-refresh"
                onClick={handleResetForm}
                className="p-1 px-2 border-r border-[#bebebe] hover:bg-[#d5d5d5] text-slate-800 flex items-center gap-1 font-bold text-[10px] cursor-pointer"
                title="Clear Database buffer state"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                <span>REFRESH</span>
              </button>

              <button 
                id="oracle-toolbar-help"
                onClick={() => alert(`HELP CENTER:\n\n1. Select Department field/click '...' trigger to open the 'List of Online Replies Received' Floating Popup.\n2. Fill in dates (From Date, To Date, IOM Date) through calendar values.\n3. Make modifications to the "Pending Paras" tabular rows directly by clicking or double-clicking field columns.\n4. Click Save icon on Toolbar to persist records.`)}
                className="p-1 px-2 hover:bg-[#d5d5d5] text-slate-800 flex items-center gap-1 font-bold text-[10px] cursor-pointer"
                title="Oracle System Documentation"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>HELP</span>
              </button>
            </div>

            <div className="text-[10px] font-mono font-medium hidden md:block text-slate-500 mr-2">
              RINL-AIMS-SSO-NODE: OK
            </div>
          </div>

          {/* APPLICATION MAIN WORKSPACE CANVAS AREA */}
          <div className="bg-[#f0ece4] p-4 text-slate-900 shadow-inner" id="oracle-form-canvas">
            
            {/* EDITOR PLANNING SECTION */}
            <div className="bg-[#f0ece4] border-2 border-white rounded-xs p-4 relative mb-6" style={{ boxShadow: 'inset -2px -2px 0px #888, inset 2px 2px 0px #fff' }}>
              
              {/* SECTION TITLE LABEL */}
              <div className="absolute -top-3 left-4 bg-[#f0ece4] px-3 border-x border-[#f0ece4] text-xs font-black uppercase tracking-wider text-[#1a5b6c] select-none">
                EDITOR PLANNING
              </div>

              {/* CLASSIC TOGGLE BUTTONS */}
              <div className="flex gap-2 mb-3 select-none">
                <button
                  type="button"
                  id="planning-toggle-monthly"
                  onClick={() => {
                    setPlanningMode('monthly');
                    setStatusBarMsg('FRM-44111: Switched to Monthly Plan dashboard.');
                  }}
                  className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer border ${
                    planningMode === 'monthly'
                      ? 'bg-[#1a5b6c] text-white border-[#103e4b]'
                      : 'bg-[#dcdcd8] text-slate-800 border-[#808080] hover:bg-slate-300'
                  }`}
                  style={{ boxShadow: 'inset -1px -1px 0px rgba(0,0,0,0.2), inset 1px 1px 0px rgba(255,255,255,0.2)' }}
                >
                  Monthly Plan
                </button>
                <button
                  type="button"
                  id="planning-toggle-annual"
                  onClick={() => {
                    setPlanningMode('annual');
                    setStatusBarMsg('FRM-44112: Switched to Annual Plan dashboard.');
                  }}
                  className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer border ${
                    planningMode === 'annual'
                      ? 'bg-[#1a5b6c] text-white border-[#103e4b]'
                      : 'bg-[#dcdcd8] text-slate-800 border-[#808080] hover:bg-slate-300'
                  }`}
                  style={{ boxShadow: 'inset -1px -1px 0px rgba(0,0,0,0.2), inset 1px 1px 0px rgba(255,255,255,0.2)' }}
                >
                  Annual Plan
                </button>
              </div>

              {planningMode === 'monthly' ? (
                <MonthlyPlanning 
                  monthlyData={monthlyPlanningData}
                  onSaveData={(key, records) => {
                    setMonthlyPlanningData(prev => ({ ...prev, [key]: records }));
                    setStatusBarMsg(`FRM-40410: Monthly planning buffer synchronized. Key: ${key}.`);
                  }}
                />
              ) : (
                <AnnualPlanning 
                  annualData={annualPlanningData}
                  onSaveData={(records) => {
                    setAnnualPlanningData(records);
                    setStatusBarMsg('FRM-40411: Fiscal Annual targets committed successfully to schema.');
                  }}
                />
              )}
            </div>

            <div className="bg-[#f0ece4] border-2 border-white rounded-xs p-4 relative" style={{ boxShadow: 'inset -2px -2px 0px #888, inset 2px 2px 0px #fff' }}>
              
              {/* SCREEN TITLE LABEL */}
              <div className="absolute -top-3 left-4 bg-[#f0ece4] px-3 border-x border-[#f0ece4] text-xs font-black uppercase tracking-wider text-[#104b8f] select-none">
                REPLY DETAILS ENTRY SCREEN
              </div>

              {/* TWO COLUMN COMPACT FORM */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3 pt-2">
                
                {/* LEFT SIDE FORM FIELDS */}
                <div className="space-y-3">
                  
                  {/* Department Field (with Popup Search LOV Trigger!) */}
                  <div className="flex items-center">
                    <label className="w-28 text-right pr-3.5 text-[11px] font-sans font-bold text-slate-700 capitalize">
                      Department <span className="text-red-600">*</span>
                    </label>
                    <div className="flex-1 flex gap-0.5 relative">
                      <input 
                        id="form-input-department"
                        type="text" 
                        value={department}
                        onClick={openDepartmentLOV}
                        readOnly
                        placeholder="Select PSU Department"
                        className="flex-1 bg-yellow-100 hover:bg-yellow-200 border-2 border-[#808080] text-[11px] font-bold px-2 py-1 text-slate-900 cursor-pointer focus:outline-none"
                        title="Click to select from list of received replies"
                        style={{ borderBottomColor: '#f0f0f0', borderRightColor: '#f0f0f0', boxShadow: 'inset 1px 1px 1px #000' }}
                      />
                      <button 
                        id="form-btn-department-lov"
                        type="button"
                        onClick={openDepartmentLOV}
                        className="bg-[#dcdcd8] text-slate-800 hover:bg-slate-300 font-bold border-2 border-white px-2 cursor-pointer shadow-3xs flex items-center justify-center font-mono text-[10.5px]"
                        style={{ boxShadow: 'inset -1px -1px 0px #666, inset 1px 1px 0px #fff' }}
                        title="List of values (LOV)"
                      >
                        ...
                      </button>
                    </div>
                  </div>

                  {/* IOM From */}
                  <div className="flex items-center">
                    <label className="w-28 text-right pr-3.5 text-[11px] font-sans font-bold text-slate-700 capitalize">
                      IOM From <span className="text-red-600">*</span>
                    </label>
                    <input 
                      id="form-input-iom-from"
                      type="text" 
                      value={iomFrom}
                      onChange={(e) => setIomFrom(e.target.value)}
                      className="flex-1 bg-yellow-100 border-2 border-[#808080] text-[11px] px-2 py-1 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-700"
                      style={{ borderBottomColor: '#f0f0f0', borderRightColor: '#f0f0f0', boxShadow: 'inset 1px 1px 1px #000' }}
                      required
                    />
                  </div>

                  {/* Ref No */}
                  <div className="flex items-center">
                    <label className="w-28 text-right pr-3.5 text-[11px] font-sans font-bold text-slate-700 capitalize">
                      Ref No
                    </label>
                    <input 
                      id="form-input-ref-no"
                      type="text" 
                      value={refNo}
                      onChange={(e) => setRefNo(e.target.value)}
                      placeholder="e.g. RINL/AUDIT-2026/01"
                      className="flex-1 bg-white border-2 border-[#808080] text-[11px] px-2 py-1 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-700"
                      style={{ borderBottomColor: '#f0f0f0', borderRightColor: '#f0f0f0', boxShadow: 'inset 1px 1px 1px #000' }}
                    />
                  </div>

                  {/* Copy To */}
                  <div className="flex items-center">
                    <label className="w-28 text-right pr-3.5 text-[11px] font-sans font-bold text-slate-700 capitalize">
                      Copy To
                    </label>
                    <input 
                      id="form-input-copy-to"
                      type="text" 
                      value={copyTo}
                      onChange={(e) => setCopyTo(e.target.value)}
                      className="flex-1 bg-white border-2 border-[#808080] text-[11px] px-2 py-1 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-700"
                      style={{ borderBottomColor: '#f0f0f0', borderRightColor: '#f0f0f0', boxShadow: 'inset 1px 1px 1px #000' }}
                    />
                  </div>

                </div>

                {/* RIGHT SIDE FORM FIELDS */}
                <div className="space-y-3">
                  
                  {/* Audit Period */}
                  <div className="flex items-start">
                    <span className="w-28 text-right pr-3.5 text-[11px] font-sans font-bold text-slate-700 pt-1">
                      Audit Period <span className="text-red-600">*</span>
                    </span>
                    <div className="flex-1 flex flex-col sm:flex-row gap-2">
                      {/* From Date */}
                      <div className="flex-1 flex items-center">
                        <span className="text-[10px] text-slate-500 w-10 text-right pr-2">From:</span>
                        <input 
                          id="form-input-period-from"
                          type="date"
                          value={periodFrom}
                          onChange={(e) => setPeriodFrom(e.target.value)}
                          className="flex-1 bg-yellow-105 bg-yellow-100 border-2 border-[#808080] text-[11px] px-2 py-1 text-slate-900 focus:outline-none"
                          style={{ borderBottomColor: '#f0f0f0', borderRightColor: '#f0f0f0', boxShadow: 'inset 1px 1px 1px #000' }}
                          required
                        />
                      </div>
                      {/* To Date */}
                      <div className="flex-1 flex items-center">
                        <span className="text-[10px] text-slate-500 w-10 text-right pr-2">To:</span>
                        <input 
                          id="form-input-period-to"
                          type="date"
                          value={periodTo}
                          onChange={(e) => setPeriodTo(e.target.value)}
                          className="flex-1 bg-yellow-105 bg-yellow-100 border-2 border-[#808080] text-[11px] px-2 py-1 text-slate-900 focus:outline-none"
                          style={{ borderBottomColor: '#f0f0f0', borderRightColor: '#f0f0f0', boxShadow: 'inset 1px 1px 1px #000' }}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* IOM To */}
                  <div className="flex items-center">
                    <label className="w-28 text-right pr-3.5 text-[11px] font-sans font-bold text-slate-700 capitalize">
                      IOM To
                    </label>
                    <input 
                      id="form-input-iom-to"
                      type="text" 
                      value={iomTo}
                      onChange={(e) => setIomTo(e.target.value)}
                      className="flex-1 bg-white border-2 border-[#808080] text-[11px] px-2 py-1 text-slate-900 focus:outline-none"
                      style={{ borderBottomColor: '#f0f0f0', borderRightColor: '#f0f0f0', boxShadow: 'inset 1px 1px 1px #000' }}
                    />
                  </div>

                  {/* IOM Date */}
                  <div className="flex items-center">
                    <label className="w-28 text-right pr-3.5 text-[11px] font-sans font-bold text-slate-700 capitalize">
                      IOM Date <span className="text-red-600">*</span>
                    </label>
                    <input 
                      id="form-input-iom-date"
                      type="date" 
                      value={iomDate}
                      onChange={(e) => setIomDate(e.target.value)}
                      className="flex-1 bg-yellow-100 border-2 border-[#808080] text-[11px] px-2 py-1 text-slate-900 focus:outline-none"
                      style={{ borderBottomColor: '#f0f0f0', borderRightColor: '#f0f0f0', boxShadow: 'inset 1px 1px 1px #000' }}
                      required
                    />
                  </div>

                  {/* Exit control button */}
                  <div className="flex justify-end pt-1">
                    <button
                      id="oracle-exit-btn"
                      type="button"
                      onClick={() => {
                        if (confirm('De-authenticate session and close Reply details screen?')) {
                          handleResetForm();
                        }
                      }}
                      className="bg-slate-300 text-slate-900 hover:bg-slate-400 font-bold border-2 border-white px-5 py-1.5 text-[11px] uppercase cursor-pointer rounded-xs transition-colors flex items-center gap-1"
                      style={{ boxShadow: 'inset -2px -2px 0px #666, inset 2px 2px 0px #fff' }}
                    >
                      <span>Exit Button</span>
                    </button>
                  </div>

                </div>

              </div>
              
              {/* PENDING PARAS DATA GRID SECTION */}
              <div className="mt-6 border-t-2 border-[#94a3b8] pt-4" id="oracle-tabular-block">
                
                <div className="flex justify-between items-center mb-1.5 select-none bg-[#104bef]/5 p-1 rounded-sm">
                  <span className="text-[#104b8f] text-xs font-black uppercase tracking-wider flex items-center gap-2">
                    <ListFilter className="w-4 h-4 text-indigo-800" />
                    Pending Paras Block
                  </span>
                  
                  <div className="flex gap-2">
                    <span className="text-[10px] bg-slate-200 text-slate-800 font-mono px-2 py-0.5 rounded-sm font-bold">
                      RECORD: {selectedRowIndex + 1} OF {pendingRecords.length}
                    </span>
                    <button 
                      onClick={handleAddParaRow}
                      className="text-[10px] font-bold text-[#104b8f] hover:underline cursor-pointer"
                    >
                      [+ Add Row]
                    </button>
                  </div>
                </div>

                {/* THE DATA GRID REGISTER */}
                <div className="overflow-x-auto border-2 border-[#808080] bg-white" style={{ borderBottomColor: '#f0f0f0', borderRightColor: '#f0f0f0', boxShadow: 'inset 1px 1px 1px #000' }}>
                  <table className="w-full text-left font-sans text-xs min-w-[700px] select-none border-collapse">
                    
                    {/* Headers */}
                    <thead className="bg-[#e4e4e4] sticky top-0 border-b border-[#a0a0a0]">
                      <tr className="text-[10.5px] uppercase font-bold text-slate-700 tracking-wider">
                        <th className="p-2 border-r border-[#bebebe] text-center w-14">S.No</th>
                        <th className="p-2 border-r border-[#bebebe]">Para Description</th>
                        <th className="p-2 border-r border-[#bebebe] w-36">Status</th>
                        <th className="p-2 border-r border-[#bebebe] w-32">Priority</th>
                        <th className="p-2 w-36">Due Date</th>
                      </tr>
                    </thead>

                    {/* Body */}
                    <tbody className="divide-y divide-slate-150">
                      {pendingRecords.map((item, index) => {
                        const isSelected = selectedRowIndex === index;
                        return (
                          <tr 
                            id={`pending-para-row-${item.id}`}
                            key={item.id} 
                            onClick={() => setSelectedRowIndex(index)}
                            className={`transition-colors font-medium border-b border-[#ecece9] ${
                              isSelected 
                                ? 'bg-[#104b8f] text-white' 
                                : 'hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            
                            {/* Serial No */}
                            <td className="p-2 text-center border-r border-[#e1e1de] font-mono font-bold">
                              {item.sn}
                            </td>

                            {/* Para Description */}
                            <td className="p-1 border-r border-[#e1e1de]">
                              <input 
                                type="text" 
                                value={item.description}
                                onChange={(e) => handleRowValueChange(index, 'description', e.target.value)}
                                className={`w-full bg-transparent px-1.5 py-1 text-xs font-semibold focus:outline-none focus:bg-white focus:text-slate-900 border border-transparent rounded-xs ${
                                  isSelected ? 'text-white bg-[#0a3568]/40' : 'text-slate-800'
                                }`}
                              />
                            </td>

                            {/* Status Selector */}
                            <td className="p-1 border-r border-[#e1e1de]">
                              <select
                                value={item.status}
                                onChange={(e) => handleRowValueChange(index, 'status', e.target.value)}
                                className={`w-full text-xs font-semibold p-1 focus:outline-none rounded-xs border border-transparent ${
                                  isSelected 
                                    ? 'bg-[#0a3568] border-blue-400 text-white' 
                                    : 'bg-slate-100 text-[#1e3a8a]'
                                }`}
                              >
                                <option className="text-slate-900 bg-white" value="Pending">Pending</option>
                                <option className="text-slate-900 bg-white" value="Under Review">Under Review</option>
                                <option className="text-slate-900 bg-white" value="Resolved">Resolved</option>
                              </select>
                            </td>

                            {/* Priority */}
                            <td className="p-1 border-r border-[#e1e1de]">
                              <select
                                value={item.priority}
                                onChange={(e) => handleRowValueChange(index, 'priority', e.target.value)}
                                className={`w-full text-xs font-bold p-1 focus:outline-none rounded-xs border border-transparent ${
                                  isSelected 
                                    ? 'bg-[#0a3568] border-blue-400 text-white' 
                                    : 'bg-slate-100'
                                } ${
                                  item.priority === 'High' ? 'text-red-700' : item.priority === 'Medium' ? 'text-amber-700' : 'text-green-700'
                                }`}
                              >
                                <option className="text-slate-900 bg-white" value="High">High ⚠️</option>
                                <option className="text-slate-900 bg-white" value="Medium">Medium ⚙️</option>
                                <option className="text-slate-900 bg-white" value="Low">Low ⭐</option>
                              </select>
                            </td>

                            {/* Due Date */}
                            <td className="p-1">
                              <input 
                                type="date" 
                                value={item.dueDate}
                                onChange={(e) => handleRowValueChange(index, 'dueDate', e.target.value)}
                                className={`w-full bg-transparent p-1 text-xs font-mono focus:outline-none rounded-xs ${
                                  isSelected ? 'text-white' : 'text-slate-700 bg-transparent'
                                }`}
                              />
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>

                  </table>
                </div>

                {/* Micro Actions Panel */}
                <div className="mt-3 flex flex-wrap gap-2 justify-between items-center bg-[#eaeaea] p-2 border border-slate-350 rounded-xs select-none">
                  <div className="flex gap-4 text-[10.5px] font-mono text-slate-600 font-bold">
                    <span>GRID BLOCK: PENDING_PARAS</span>
                    <span>ACTIVE ROW: #{selectedRowIndex + 1}</span>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      id="export-pdf-schedule"
                      onClick={handlePrintForm}
                      className="bg-slate-850 hover:bg-slate-900 bg-slate-800 text-white font-bold text-[10px] px-3 py-1 uppercase rounded-xs border border-slate-950 flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Schedule Info (Print Tool)</span>
                    </button>
                    <button 
                      id="clear-grid-draft"
                      onClick={() => {
                        setPendingRecords(prev => prev.map(item => ({ ...item, status: 'Pending' })));
                        setStatusBarMsg('FRM-41009: Draft status cleared.');
                      }}
                      className="bg-yellow-500 hover:bg-yellow-600 border border-yellow-600 text-slate-950 font-bold text-[10px] px-3 py-1 uppercase rounded-xs cursor-pointer"
                    >
                      Auto-Reset Row Status
                    </button>
                  </div>
                </div>

              </div>

              {/* TRANSACTION REPLY & SUGGESTIONS COMPLIANCE EDITOR (NEW SECTION) */}
              <div className="mt-6 border-t-2 border-slate-300 pt-4" id="reply-suggestions-compliance-block">
                
                <div className="bg-slate-200 border border-slate-350 p-2 text-slate-800 flex items-center justify-between mb-4 shadow-[1px_1px_0px_#fff]">
                  <span className="text-[#104b8f] text-[11px] font-black uppercase tracking-wider flex items-center gap-2">
                    <Reply className="w-4 h-4 text-blue-900" />
                    Transaction Reply & Suggestions Compliance Editor
                  </span>
                  <span className="text-[10px] bg-slate-700 text-white font-mono px-2 py-0.5 rounded-xs font-bold shadow-inner">
                    ONLINE SUGGESTIONS ENGINE V1.2
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  
                  {/* Left Column: Official Reply Draft Box (lg:col-span-6) */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="bg-white border-2 border-[#808080] p-3 rounded-xs" style={{ borderBottomColor: '#f0f0f0', borderRightColor: '#f0f0f0', boxShadow: 'inset 1px 1px 1px #000' }}>
                      <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-250">
                        <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                          📝 Draft Response Detail for Para #{selectedRowIndex + 1}
                        </span>
                        <span className="text-[10px] font-mono text-blue-800 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          ID: {pendingRecords[selectedRowIndex]?.id || 'N/A'}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase">Target Para Title Header:</label>
                          <div className="bg-slate-50 border border-slate-300 p-2 text-xs font-semibold text-slate-800 font-mono italic leading-normal">
                            {pendingRecords[selectedRowIndex]?.description || 'No Para selected'}
                          </div>
                        </div>

                        <div>
                          <label htmlFor="compliance-reply-textarea" className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">
                            Official Compliance Reply Message: <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            id="compliance-reply-textarea"
                            value={draftReplies[pendingRecords[selectedRowIndex]?.id] || ''}
                            onChange={(e) => {
                              const selectedId = pendingRecords[selectedRowIndex]?.id;
                              if (selectedId) {
                                setDraftReplies(prev => ({ ...prev, [selectedId]: e.target.value }));
                                setStatusBarMsg('FRM-41014: Active response draft buffer altered.');
                              }
                            }}
                            rows={5}
                            placeholder="Type or select a pre-audited suggestion clause from the library on the right to insert it..."
                            className="w-full bg-[#ffffe0] border-2 border-[#808080] text-xs font-semibold px-2 py-1.5 focus:outline-none focus:bg-white text-slate-900"
                            style={{ borderBottomColor: '#f0f0f0', borderRightColor: '#f0f0f0', boxShadow: 'inset 1px 1px 1px #000' }}
                          />
                        </div>

                        {/* Suggestions Entry Input Section */}
                        <div>
                          <label htmlFor="suggestions-entry-textarea" className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">
                            Suggestions Entry
                          </label>
                          <textarea
                            id="suggestions-entry-textarea"
                            value={
                              pendingRecords[selectedRowIndex]?.id 
                                ? (suggestionsEntries[pendingRecords[selectedRowIndex].id]?.suggestions_entry || '') 
                                : ''
                            }
                            onChange={(e) => {
                              const selectedId = pendingRecords[selectedRowIndex]?.id;
                              if (selectedId) {
                                setSuggestionsEntries(prev => {
                                  const matched = prev[selectedId];
                                  const updated = {
                                    suggestions_entry: e.target.value,
                                    auditId: matched?.auditId || `AUD-${selectedId.toUpperCase()}-2026`,
                                    replyId: matched?.replyId || `REP-${selectedId.toUpperCase()}-RLY`,
                                    departmentId: department,
                                    recordId: selectedId,
                                    userId: matched?.userId || currentUser?.name?.toLowerCase().replace(/\s+/g, '_') || 'aims_usr',
                                    createdBy: matched?.createdBy || currentUser?.name || 'AIMS User',
                                    createdDate: matched?.createdDate || new Date().toISOString().replace('T', ' ').substring(0, 19),
                                    modifiedBy: currentUser?.name || 'AIMS User',
                                    modifiedDate: new Date().toISOString().replace('T', ' ').substring(0, 19)
                                  };
                                  return { ...prev, [selectedId]: updated };
                                });
                                setStatusBarMsg('FRM-41019: Suggestions entry buffer modified.');
                              }
                            }}
                            rows={4}
                            placeholder="Enter suggestions, recommendations, review remarks, corrective measures, improvement actions, or additional comments here..."
                            className="w-full bg-[#f8fafc] border-2 border-[#808080] text-xs font-semibold px-2 py-1.5 focus:outline-none focus:bg-white text-slate-900"
                            style={{ borderBottomColor: '#f0f0f5', borderRightColor: '#f0f0f5', boxShadow: 'inset 1px 1px 1px #000' }}
                          />

                          {/* Audit Trail Metadata display for compliance transparency */}
                          {pendingRecords[selectedRowIndex]?.id && suggestionsEntries[pendingRecords[selectedRowIndex].id] && (
                            <div className="mt-1.5 bg-slate-100 p-2 border border-slate-300 rounded-xs text-[9px] font-mono text-slate-600 space-y-1 select-none leading-normal">
                              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                <div><span className="text-slate-400 font-bold uppercase">Audit ID:</span> <strong className="text-slate-700">{suggestionsEntries[pendingRecords[selectedRowIndex].id].auditId}</strong></div>
                                <div><span className="text-slate-400 font-bold uppercase">Reply ID:</span> <strong className="text-slate-700">{suggestionsEntries[pendingRecords[selectedRowIndex].id].replyId}</strong></div>
                                <div><span className="text-slate-400 font-bold uppercase">Record ID:</span> <strong className="text-slate-700">{suggestionsEntries[pendingRecords[selectedRowIndex].id].recordId}</strong></div>
                                <div><span className="text-slate-400 font-bold uppercase">User ID:</span> <strong className="text-slate-700">{suggestionsEntries[pendingRecords[selectedRowIndex].id].userId}</strong></div>
                              </div>
                              <div className="border-t border-slate-200 pt-1 mt-1 flex justify-between gap-2 flex-wrap text-[8.5px]">
                                <span>Created: <strong className="text-slate-700">{suggestionsEntries[pendingRecords[selectedRowIndex].id].createdBy}</strong> ({suggestionsEntries[pendingRecords[selectedRowIndex].id].createdDate})</span>
                                <span>Modified: <strong className="text-slate-700">{suggestionsEntries[pendingRecords[selectedRowIndex].id].modifiedBy}</strong> ({suggestionsEntries[pendingRecords[selectedRowIndex].id].modifiedDate})</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Interactive actions inside Draft Box */}
                        <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center pt-2">
                          <button
                            type="button"
                            id="btn-apply-reply-to-para"
                            onClick={() => {
                              const activeParaId = pendingRecords[selectedRowIndex]?.id;
                              const draftText = draftReplies[activeParaId];
                              if (!draftText) {
                                alert('Error: compliance draft buffer empty. Add input text or choose from standard audit template.');
                                return;
                              }
                              // Mutate row status to 'Under Review' immediately
                              handleRowValueChange(selectedRowIndex, 'status', 'Under Review');
                              setStatusBarMsg(`FRM-41015: Row status upgraded to 'Under Review' with custom compliance text.`);
                              alert(`Reply drafted successfully!\nApplied to row #${selectedRowIndex + 1} with status: 'Under Review'.\nClick top block SAVE (F10) to finalize.`);
                            }}
                            className="bg-[#104b8f] text-white hover:bg-[#0a3568] font-bold text-[10.5px] px-3 py-1.5 rounded-xs transition-all cursor-pointer uppercase flex items-center justify-center gap-1 shadow-3xs border border-[#0a3568]"
                          >
                            <Check className="w-3.5 h-3.5 text-yellow-400" />
                            Apply Reply draft to Block-Buffer
                          </button>

                          <button
                            type="button"
                            id="btn-download-active-reply"
                            onClick={() => {
                              const activeParaId = pendingRecords[selectedRowIndex]?.id;
                              const draftText = draftReplies[activeParaId] || '';
                              const pTitle = pendingRecords[selectedRowIndex]?.description || '';
                              
                              const content = `========================================================================
             VISAKHAPATNAM STEEL PLANT - AUDIT COMPLIANCE DRAFT
========================================================================
DEPARTMENT       : ${department}
IOM FROM         : ${iomFrom}
IOM TO           : ${iomTo}
REF NO           : ${refNo}
IOM DATE         : ${iomDate}
------------------------------------------------------------------------
TARGET PARA      : #${selectedRowIndex + 1} - ${pTitle}
DRAFT STATUS     : Under Review / Pending Commitment
------------------------------------------------------------------------
OFFICIAL COMPLIANCE RESPONSE DETAIL:
${draftText || '(No reply text written)'}
------------------------------------------------------------------------
Generated on     : ${new Date().toLocaleString()} (AIMS Secure Export Port)
========================================================================`;

                              const blob = new Blob([content], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `VSP_DraftReply_Para_${selectedRowIndex + 1}.txt`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);

                              setStatusBarMsg('FRM-40520: Active compliance statement successfully downloaded.');
                            }}
                            className="bg-slate-700 text-white hover:bg-slate-800 font-bold text-[10.5px] px-3 py-1.5 rounded-xs transition-all cursor-pointer uppercase flex items-center justify-center gap-1 border border-slate-800"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download Draft Statement
                          </button>
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* Right Column: Suggestions Library (lg:col-span-6) */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="bg-white border-2 border-[#808080] p-3 rounded-xs flex flex-col h-full" style={{ borderBottomColor: '#f0f0f0', borderRightColor: '#f0f0f0', boxShadow: 'inset 1px 1px 1px #000' }}>
                      <div className="pb-2 mb-2 border-b border-slate-250 flex justify-between items-center flex-wrap gap-2">
                        <div>
                          <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                            🌟 Pre-Audited Compliance Suggestions
                          </span>
                          <p className="text-[9.5px] text-slate-500 font-semibold mt-0.5 leading-none">
                            Click any clause to append it to your active reply draft box.
                          </p>
                        </div>
                      </div>

                      {/* Search & Export Panel */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                        <div className="relative">
                          <input
                            type="text"
                            id="suggestions-search-field"
                            value={suggestionSearch}
                            onChange={(e) => setSuggestionSearch(e.target.value)}
                            placeholder="🔍 Filter clauses catalog..."
                            className="w-full bg-[#f8fafc] border border-slate-350 text-[10.5px] px-2.5 py-1 focus:outline-none focus:bg-white text-slate-800 font-semibold rounded-xs"
                          />
                        </div>

                        <div className="flex gap-1">
                          <button
                            type="button"
                            id="btn-download-suggestions-library"
                            onClick={() => {
                              const sLibrary = suggestions.map((s, idx) => `Suggestion #${idx + 1}: [${s.category}] - ${s.title}
--------------------------------------------------
${s.content}
==================================================`).join('\n');
                              
                              const header = `VISAKHAPATNAM STEEL PLANT - CERTIFIED AUDIT COMPLIANCE CLAUSES LIBRARY\n${'='.repeat(80)}\n`;
                              const blob = new Blob([header + sLibrary], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = 'VSP_Certified_Audit_Compliance_Suggestions.txt';
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                              setStatusBarMsg('FRM-40521: Full suggestions repository downloaded.');
                            }}
                            className="bg-emerald-800 text-white hover:bg-emerald-950 border border-emerald-950 font-bold text-[10px] uppercase rounded-xs px-2 px-1 flex-1 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-white animate-pulse" />
                            <span>Download Suggestions Guide</span>
                          </button>
                        </div>
                      </div>

                      {/* Suggestions List */}
                      <div className="overflow-y-auto max-h-[190px] border border-slate-300 p-1 bg-slate-50 space-y-2 flex-1 rounded-sm">
                        {suggestions.filter(s => 
                          s.title.toLowerCase().includes(suggestionSearch.toLowerCase()) || 
                          s.content.toLowerCase().includes(suggestionSearch.toLowerCase()) || 
                          s.category.toLowerCase().includes(suggestionSearch.toLowerCase())
                        ).map((sug) => (
                          <div 
                            key={sug.id} 
                            id={`suggestion-card-${sug.id}`}
                            className="group bg-white border border-slate-200 hover:border-[#104b8f] p-2 rounded-xs cursor-pointer transition-all hover:bg-blue-50/20"
                            onClick={() => {
                              const activeParaId = pendingRecords[selectedRowIndex]?.id;
                              if (activeParaId) {
                                setDraftReplies(prev => {
                                  const currentText = prev[activeParaId] || '';
                                  const spacing = currentText ? '\n\n' : '';
                                  return {
                                    ...prev,
                                    [activeParaId]: currentText + spacing + sug.content
                                  };
                                });
                                setStatusBarMsg(`Certified Clause [${sug.title}] appended to Active Draft.`);
                              } else {
                                alert('Please select a specific pending para block row first.');
                              }
                            }}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-bold text-[#104b8f] font-mono uppercase bg-blue-50 px-1 border border-blue-200 rounded-2xs">
                                {sug.category}
                              </span>
                              <span className="text-[9px] font-mono text-slate-400 group-hover:text-[#104b8f] font-bold uppercase tracking-wider">
                                Click to Append ➕
                              </span>
                            </div>
                            <h5 className="text-[11.5px] font-black text-slate-800 leading-tight">
                              {sug.title}
                            </h5>
                            <p className="text-[10.5px] text-slate-650 mt-1 leading-relaxed text-slate-600 line-clamp-2">
                              {sug.content}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Custom Suggested Clause builder */}
                      <div className="mt-3 bg-slate-100 border border-slate-300 p-2 text-slate-800 rounded-sm">
                        <span className="text-[10px] font-bold text-[#104b8f] uppercase tracking-widest block mb-1.5 pb-1 border-b border-dashed border-slate-300">
                          ➕ Create New Suggestion / Remedial Clause
                        </span>
                        
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-1.5">
                            <div className="col-span-2">
                              <input
                                type="text"
                                value={newSugTitle}
                                onChange={(e) => setNewSugTitle(e.target.value)}
                                placeholder="Clause Title (e.g. Quality Standard)"
                                className="w-full bg-white border border-slate-400 text-[10px] px-2 py-1 focus:outline-none rounded-xs font-semibold"
                              />
                            </div>
                            <div>
                              <select
                                value={newSugCat}
                                onChange={(e) => setNewSugCat(e.target.value)}
                                className="w-full bg-white border border-slate-400 text-[10px] p-1 focus:outline-none font-bold rounded-xs"
                              >
                                <option value="Compliance">Compliance</option>
                                <option value="Procurement">Procurement</option>
                                <option value="Financial">Financial</option>
                                <option value="Technical">Technical</option>
                                <option value="Security">Security</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex gap-1.5 items-stretch">
                            <input
                              type="text"
                              value={newSugContent}
                              onChange={(e) => setNewSugContent(e.target.value)}
                              placeholder="Type suggestion content/clause text..."
                              className="flex-1 bg-white border border-slate-400 text-[10px] px-2 py-1 focus:outline-none rounded-xs font-medium"
                            />
                            
                            <button
                              type="button"
                              id="btn-add-custom-suggestion"
                              onClick={() => {
                                if (!newSugTitle || !newSugContent) {
                                  alert('Input both title and clause text to add a custom suggestion.');
                                  return;
                                }
                                const newSug = {
                                  id: `sug-${Date.now()}`,
                                  title: newSugTitle,
                                  category: newSugCat,
                                  content: newSugContent
                                };
                                setSuggestions(prev => [newSug, ...prev]);
                                setNewSugTitle('');
                                setNewSugContent('');
                                setStatusBarMsg('FRM-41018: Custom clause populated inside local library successfully.');
                              }}
                              className="bg-blue-800 hover:bg-blue-900 text-white font-bold text-[9px] px-3 uppercase rounded-xs cursor-pointer flex items-center justify-center border border-blue-900 shadow-3xs"
                            >
                              Insert
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>

          {/* ORACLE LOWEST STATUS MESSAGE BAR */}
          <div className="bg-[#b3b3b3] border-t border-slate-400 text-slate-900 px-3 py-1.5 text-[10.5px] font-mono flex justify-between select-none">
            <div className="text-[#050505] font-bold truncate pr-4">
              {statusBarMsg}
            </div>
            <div className="flex gap-4 shrink-0 pr-1">
              <span className="border-l border-slate-400 pl-3">OS: WebLogic</span>
              <span>Buffer: 1/1</span>
              <span className="text-blue-900 font-bold">INS</span>
            </div>
          </div>

          {/* FLOATING LIST OF VALUES (LOV) POPUP WINDOW */}
          {isPopupOpen && (
            <div className="fixed inset-0 bg-slate-900/65 flex items-center justify-center z-50 backdrop-blur-3xs p-4 animate-fade-in" id="lov-popup-overlay">
              
              <div 
                className="w-full max-w-lg bg-[#e2e8f0] border-4 border-[#104bef] rounded-xs shadow-2xl overflow-hidden"
                style={{ outline: '2px solid outline-blue' }}
              >
                
                {/* Vintage LOV Header */}
                <div className="bg-[#104b8f] text-white px-3 py-2 flex items-center justify-between font-bold text-xs select-none">
                  <span className="uppercase tracking-wider">List of Online Replies Received</span>
                  <button 
                    onClick={() => setIsPopupOpen(false)}
                    className="p-0.5 hover:bg-blue-950 rounded cursor-pointer"
                    title="Cancel LOV"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Find Field box */}
                <div className="bg-[#f1f5f9] p-3 border-b border-slate-350 select-none">
                  <div className="flex gap-2 items-center">
                    <label className="text-[11px] font-bold text-slate-700">Find:</label>
                    <div className="flex-1 relative">
                      <input 
                        ref={searchInputRef}
                        type="text"
                        value={popupSearchQuery}
                        onChange={(e) => {
                          setPopupSearchQuery(e.target.value);
                          setSelectedPopupIndex(0);
                        }}
                        placeholder="Type filter query (e.g. 'Raw' or 'Purchase')"
                        className="w-full bg-white border border-slate-400 text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-700 text-slate-800"
                        title="LOV search block query value"
                      />
                    </div>
                    <button
                      id="popup-btn-lov-find"
                      onClick={() => setStatusBarMsg(`LOV Filtered: ${filteredDepts.length} matches found.`)}
                      className="bg-blue-800 text-white font-bold text-[11px] px-3.5 py-1.5 hover:bg-blue-900 transition-colors cursor-pointer rounded-xs"
                    >
                      Find
                    </button>
                    <button
                      id="popup-btn-lov-clear"
                      onClick={() => setPopupSearchQuery('')}
                      className="bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold text-[11px] px-2.5 py-1.5 cursor-pointer rounded-xs"
                    >
                      Clear
                    </button>
                  </div>
                  <p className="text-[9px] text-[#2563eb] pt-1.5 leading-none font-bold italic font-mono uppercase">
                    * Keyboard Navigation: Arrow Up/Down to focus, Enter to select, Esc to exit list.
                  </p>
                </div>

                {/* Display Grid Table */}
                <div className="p-3">
                  <div className="max-h-[220px] overflow-y-auto border border-slate-350 bg-white">
                    <table className="w-full text-left font-sans text-[11.5px] border-collapse">
                      
                      <thead className="bg-[#eaeaea] text-slate-700 text-[10px] font-black uppercase sticky top-0 border-b border-slate-350">
                        <tr>
                          <th className="p-2 border-r border-slate-300">Department Name</th>
                          <th className="p-2 border-r border-slate-300 w-32">Reply Status</th>
                          <th className="p-2 w-28">Period</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-150">
                        {filteredDepts.map((item, idx) => {
                          const isRowFocused = selectedPopupIndex === idx;
                          return (
                            <tr
                              id={`lov-row-${idx}`}
                              key={idx}
                              onClick={() => setSelectedPopupIndex(idx)}
                              onDoubleClick={() => commitSelectedDept(item.name)}
                              className={`cursor-pointer font-medium ${
                                isRowFocused 
                                  ? 'bg-[#104b8f] text-white font-bold' 
                                  : 'hover:bg-[#104b8f]/5 text-slate-800'
                              }`}
                            >
                              <td className="p-2 border-r border-slate-205">
                                {item.name}
                              </td>
                              <td className="p-2 border-r border-slate-205">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-xs border ${
                                  isRowFocused 
                                    ? 'bg-transparent text-white border-transparent' 
                                    : item.status.includes('Active') ? 'text-green-800 bg-green-50 border-green-200' : 'text-amber-800 bg-amber-50 border-amber-200'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="p-2 font-mono">
                                {item.period}
                              </td>
                            </tr>
                          );
                        })}

                        {filteredDepts.length === 0 && (
                          <tr>
                            <td colSpan={3} className="p-6 text-center text-slate-400 font-mono text-[11px] italic">
                              FRM-40301: Query produced no matching Department values.
                            </td>
                          </tr>
                        )}
                      </tbody>

                    </table>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="bg-[#f1f5f9] p-3 border-t border-slate-350 flex justify-end gap-2 text-xs">
                  <button
                    id="lov-btn-ok"
                    onClick={() => {
                      if (filteredDepts[selectedPopupIndex]) {
                        commitSelectedDept(filteredDepts[selectedPopupIndex].name);
                      }
                    }}
                    disabled={filteredDepts.length === 0}
                    className="bg-blue-800 hover:bg-blue-900 text-white font-bold px-5 py-1.5 cursor-pointer rounded-xs border shadow-xs disabled:opacity-50 disabled:cursor-not-allowed uppercase text-[10.5px]"
                  >
                    OK
                  </button>
                  <button
                    id="lov-btn-cancel"
                    onClick={() => setIsPopupOpen(false)}
                    className="bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold px-4 py-1.5 cursor-pointer rounded-xs border border-slate-400 uppercase text-[10.5px]"
                  >
                    Cancel
                  </button>
                </div>

              </div>

            </div>
          )}

        </div>

      ) : activeTab === 'marking' ? (
        
        <div className="bg-white border border-slate-300 rounded-sm shadow-sm">
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-4 text-white">
            <h3 className="text-xs font-mono text-blue-200 tracking-wider">HOD DIRECTIVE CONTROL PANEL: REPLY_MARKING</h3>
            <h2 className="text-md font-bold text-yellow-300">Assign Outstanding Paras to Specific Section Employees for active corrective inputs</h2>
          </div>

          <form onSubmit={handleMarkingSubmit} className="p-6 max-w-2xl mx-auto space-y-4">
            <div>
              <label className="oracle-input-label block mb-1">1. Identify Target Observation</label>
              <select
                id="marking-para-select"
                value={selectedParaId}
                onChange={(e) => setSelectedParaId(e.target.value)}
                className="oracle-field-value w-full"
                required
              >
                <option value="">-- Choose Outstanding Para --</option>
                {paras.map(p => (
                  <option key={p.id} value={p.id}>[{p.paraNo}] - {p.title.substring(0, 60)}...</option>
                ))}
              </select>
            </div>

            <div>
              <label className="oracle-input-label block mb-1">2. Assign Responsible Employee (HOD Area Node)</label>
              <select
                id="marking-employee-select"
                value={targetEmployeeId}
                onChange={(e) => setTargetEmployeeId(e.target.value)}
                className="oracle-field-value w-full"
                required
              >
                <option value="">-- Select Employee (Master Records) --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.designation} - {emp.department}) [{emp.empNo}]
                  </option>
                ))}
              </select>
            </div>

            <button
              id="marking-submit-btn"
              type="submit"
              className="w-full btn-primary-gov py-2.5 mt-2 gap-1.5 font-bold uppercase transition-transform active:scale-[99]"
            >
              <UserCheck className="w-4 h-4" />
              CONFIRM MARK DELEGATION WRIT
            </button>
          </form>
        </div>

      ) : (

        <AuditReportEntryForm role="HOD" currentUser={{ name: currentUser?.name || 'HOD Guest', username: 'hod_usr' }} />

      )}

    </div>
  );
}
