import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, User, Layers, CheckCircle2, AlertCircle, FileSpreadsheet, 
  MapPin, Download, ChevronLeft, ChevronRight, Plus, CalendarRange, Clock, Info, 
  HelpCircle, ShieldAlert, Edit2, Check, X, RefreshCw, Search, Building, UserCheck, 
  Eye, FileText, ChevronDown, ListFilter, AlertTriangle, ArrowRight, ShieldCheck, Printer,
  Users, Lock
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Rebuilt Cycle-Based Data Schema
export interface DepartmentSchedule {
  deptId: string; // 6-digit numeric identifier
  deptName: string;
  deptHead: string;
  auditCategory: string; // Operations, Safety, Services, Environment etc.
  frequency: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Annually';
  plannedAuditCycle: '1 Month' | '2 Months' | '3 Months' | '6 Months' | '12 Months';
  assignedAuditor: string;
  status: 'Planned' | 'Assigned' | 'In Progress' | 'Completed';
}

export interface HistoricalAudit {
  auditId: string;
  deptId: string;
  deptName: string;
  cyclePeriod: string;
  auditor: string;
  numFindings: number;
  status: 'Completed';
  findings: string[];
  auditTrail: string[];
}

export default function SchedulePlanning({ 
  userRole = 'HOD', 
  userName = 'Smt. P. Lakshmi' 
}: { 
  userRole?: string; 
  userName?: string 
}) {
  // State: Department Planning Records
  const [schedules, setSchedules] = useState<DepartmentSchedule[]>([
    {
      deptId: '100001',
      deptName: 'SMS Department',
      deptHead: 'Shri S. Raghavan',
      auditCategory: 'Operations',
      frequency: 'Monthly',
      plannedAuditCycle: '1 Month',
      assignedAuditor: 'Smt. P. Lakshmi',
      status: 'Assigned'
    },
    {
      deptId: '100002',
      deptName: 'Coke Ovens',
      deptHead: 'Shri V. K. Sharma',
      auditCategory: 'Fuel & Coal',
      frequency: 'Quarterly',
      plannedAuditCycle: '2 Months',
      assignedAuditor: 'Shri K. Somasekhar',
      status: 'In Progress'
    },
    {
      deptId: '100003',
      deptName: 'Power Plant',
      deptHead: 'Dr. A. K. Banerjee',
      auditCategory: 'Utility Operations',
      frequency: 'Half-Yearly',
      plannedAuditCycle: '3 Months',
      assignedAuditor: 'Smt. P. Lakshmi',
      status: 'Planned'
    },
    {
      deptId: '100004',
      deptName: 'Mechanical Maintenance',
      deptHead: 'Shri M. N. Rao',
      auditCategory: 'Engineering Services',
      frequency: 'Quarterly',
      plannedAuditCycle: '6 Months',
      assignedAuditor: 'Shri J.C. Bose',
      status: 'Planned'
    },
    {
      deptId: '100005',
      deptName: 'Utilities Department',
      deptHead: 'Shri P. Vasubabu',
      auditCategory: 'Water & Power Services',
      frequency: 'Annually',
      plannedAuditCycle: '1 Month',
      assignedAuditor: 'Smt. P. Lakshmi',
      status: 'Completed'
    },
    {
      deptId: '100006',
      deptName: 'Blast Furnace',
      deptHead: 'Shri D. K. Sahoo',
      auditCategory: 'Core Operations',
      frequency: 'Annually',
      plannedAuditCycle: '2 Months',
      assignedAuditor: 'Shri K. Somasekhar',
      status: 'Assigned'
    },
    {
      deptId: '100007',
      deptName: 'Rolling Mills',
      deptHead: 'Shri S. K. Nayak',
      auditCategory: 'Production Rolling',
      frequency: 'Quarterly',
      plannedAuditCycle: '3 Months',
      assignedAuditor: 'Shri J.C. Bose',
      status: 'In Progress'
    },
    {
      deptId: '100008',
      deptName: 'Central Stores',
      deptHead: 'Shri T. K. Roy',
      auditCategory: 'Materials Inventory',
      frequency: 'Annually',
      plannedAuditCycle: '12 Months',
      assignedAuditor: 'Smt. P. Lakshmi',
      status: 'Completed'
    },
    {
      deptId: '100009',
      deptName: 'Oxygen Plant',
      deptHead: 'Shri R. K. Sen',
      auditCategory: 'Gas Utility',
      frequency: 'Half-Yearly',
      plannedAuditCycle: '1 Month',
      assignedAuditor: 'Shri K. Somasekhar',
      status: 'Planned'
    }
  ]);

  // Historical audit logs
  const [historicalAudits, setHistoricalAudits] = useState<HistoricalAudit[]>([
    {
      auditId: 'AUD-CYC-101',
      deptId: '100005',
      deptName: 'Utilities Department',
      cyclePeriod: '1 Month',
      auditor: 'Smt. P. Lakshmi',
      numFindings: 2,
      status: 'Completed',
      findings: [
        'Water treatment recycle valve log mismatch.',
        'Emergency bypass secondary lever lacked clearance tag.'
      ],
      auditTrail: [
        'Cycle Plan Init: Assigned cycle planning parameter.',
        'Execution Phase Completed: All test standards cleared successfully.',
        'GM Audit Review: Authorised and signed off.'
      ]
    },
    {
      auditId: 'AUD-CYC-102',
      deptId: '100008',
      deptName: 'Central Stores',
      cyclePeriod: '12 Months',
      auditor: 'Smt. P. Lakshmi',
      numFindings: 1,
      findings: ['Pallet tracking index register delay.'],
      status: 'Completed',
      auditTrail: [
        'Scope Authorization: Yearly audit cycle targeted.',
        'Ledger Verification: Verification completed with zero critical non-conformities.'
      ]
    }
  ]);

  // Notifications
  const [notifications] = useState([
    { id: '1', text: 'Oxygen Plant planned for immediate 1 Month audit cycle.', type: 'info' },
    { id: '2', text: 'Safety cycle configuration updated by HOD.', type: 'alert' },
    { id: '3', text: 'Coke Ovens progressing in active 2 Months cycle.', type: 'info' }
  ]);

  // Interactive Form States (locked out for generic reader, open to HOD)
  const [formDeptId, setFormDeptId] = useState('');
  const [formDeptName, setFormDeptName] = useState('');
  const [formDeptHead, setFormDeptHead] = useState('');
  const [formCategory, setFormCategory] = useState('Operations');
  const [formFrequency, setFormFrequency] = useState<'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Annually'>('Quarterly');
  const [formPlannedCycle, setFormPlannedCycle] = useState<'1 Month' | '2 Months' | '3 Months' | '6 Months' | '12 Months'>('3 Months');
  const [formAuditor, setFormAuditor] = useState('Smt. P. Lakshmi');
  const [formStatus, setFormStatus] = useState<'Planned' | 'Assigned' | 'In Progress' | 'Completed'>('Planned');
  const [isEditing, setIsEditing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Filtering Options State
  const [gridSearch, setGridSearch] = useState('');
  const [cycleFilter, setCycleFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [freqFilter, setFreqFilter] = useState('All');
  const [gridFilterStatus, setGridFilterStatus] = useState('All');

  // Modular Grid Sorting & Pagination
  const [sortBy, setSortBy] = useState<keyof DepartmentSchedule>('deptId');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Bottom Tabs View: 'cycles' | 'upcoming' | 'history'
  const [activeBottomTab, setActiveBottomTab] = useState<'cycles' | 'upcoming' | 'history'>('cycles');

  // Modals focus tracker
  const [activeDetailsId, setActiveDetailsId] = useState<string | null>(null);
  const [activeHistoryDetailsId, setActiveHistoryDetailsId] = useState<string | null>(null);
  const [assigningAuditorItem, setAssigningAuditorItem] = useState<DepartmentSchedule | null>(null);
  const [selectedAuditorForAssign, setSelectedAuditorForAssign] = useState('Smt. P. Lakshmi');

  // 1. Precise Summary Bar Metrics Calculation (Total, and grouped by cycle)
  const totalDepts = useMemo(() => schedules.length, [schedules]);
  const m1Count = useMemo(() => schedules.filter(s => s.plannedAuditCycle === '1 Month').length, [schedules]);
  const m2Count = useMemo(() => schedules.filter(s => s.plannedAuditCycle === '2 Months').length, [schedules]);
  const m3Count = useMemo(() => schedules.filter(s => s.plannedAuditCycle === '3 Months').length, [schedules]);
  const m6Count = useMemo(() => schedules.filter(s => s.plannedAuditCycle === '6 Months').length, [schedules]);
  const yCount = useMemo(() => schedules.filter(s => s.plannedAuditCycle === '12 Months').length, [schedules]);

  // Toast notifier
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  // Master Sorting & Filtering
  const filteredSchedules = useMemo(() => {
    let result = [...schedules];

    if (cycleFilter !== 'All') {
      result = result.filter(s => s.plannedAuditCycle === cycleFilter);
    }
    if (deptFilter !== 'All') {
      result = result.filter(s => s.deptId === deptFilter);
    }
    if (freqFilter !== 'All') {
      result = result.filter(s => s.frequency === freqFilter);
    }
    if (gridFilterStatus !== 'All') {
      result = result.filter(s => s.status === gridFilterStatus);
    }
    if (gridSearch) {
      const q = gridSearch.toLowerCase();
      result = result.filter(s => 
        s.deptId.includes(q) ||
        s.deptName.toLowerCase().includes(q) ||
        s.deptHead.toLowerCase().includes(q) ||
        s.auditCategory.toLowerCase().includes(q) ||
        s.assignedAuditor.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const valA = String(a[sortBy]).toLowerCase();
      const valB = String(b[sortBy]).toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [schedules, cycleFilter, deptFilter, freqFilter, gridFilterStatus, gridSearch, sortBy, sortOrder]);

  const paginatedSchedules = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSchedules.slice(start, start + itemsPerPage);
  }, [filteredSchedules, currentPage]);

  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);

  // Grouped Cycle Data variables
  const m1List = useMemo(() => schedules.filter(s => s.plannedAuditCycle === '1 Month'), [schedules]);
  const m2List = useMemo(() => schedules.filter(s => s.plannedAuditCycle === '2 Months'), [schedules]);
  const m3List = useMemo(() => schedules.filter(s => s.plannedAuditCycle === '3 Months'), [schedules]);
  const m6List = useMemo(() => schedules.filter(s => s.plannedAuditCycle === '6 Months'), [schedules]);
  const yList = useMemo(() => schedules.filter(s => s.plannedAuditCycle === '12 Months'), [schedules]);

  // Form Submit Handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formDeptId.length !== 6 || !/^\d{6}$/.test(formDeptId)) {
      alert('Validation Failure: Department ID must contain exactly 6 numeric digits.');
      return;
    }
    if (!formDeptName || !formDeptHead || !formCategory || !formAuditor) {
      alert('Validation Failure: All configuration fields are mandatory.');
      return;
    }

    if (isEditing) {
      setSchedules(prev => prev.map(s => {
        if (s.deptId === formDeptId) {
          return {
            ...s,
            deptName: formDeptName,
            deptHead: formDeptHead,
            auditCategory: formCategory,
            frequency: formFrequency,
            plannedAuditCycle: formPlannedCycle,
            assignedAuditor: formAuditor,
            status: formStatus
          };
        }
        return s;
      }));

      // Add to audit trail log
      setHistoricalAudits(prev => prev.map(h => {
        if (h.deptId === formDeptId) {
          return {
            ...h,
            deptName: formDeptName,
            auditor: formAuditor,
            auditTrail: [...h.auditTrail, `Planning Cycle modified to ${formPlannedCycle} (${formStatus}) by HOD.`]
          };
        }
        return h;
      }));

      showToast(`Master Planning record for ${formDeptName} has been successfully updated.`);
      setIsEditing(false);
    } else {
      if (schedules.some(s => s.deptId === formDeptId)) {
        alert(`Validation Failure: Department ID ${formDeptId} is already registered.`);
        return;
      }

      const fresh: DepartmentSchedule = {
        deptId: formDeptId,
        deptName: formDeptName,
        deptHead: formDeptHead,
        auditCategory: formCategory,
        frequency: formFrequency,
        plannedAuditCycle: formPlannedCycle,
        assignedAuditor: formAuditor,
        status: formStatus
      };

      setSchedules(prev => [...prev, fresh]);
      showToast(`New Cycle Audit Plan initialized for ${formDeptName}.`);
    }

    clearForm();
  };

  const handleEditClick = (item: DepartmentSchedule) => {
    setFormDeptId(item.deptId);
    setFormDeptName(item.deptName);
    setFormDeptHead(item.deptHead);
    setFormCategory(item.auditCategory);
    setFormFrequency(item.frequency);
    setFormPlannedCycle(item.plannedAuditCycle);
    setFormAuditor(item.assignedAuditor);
    setFormStatus(item.status);
    setIsEditing(true);
  };

  const clearForm = () => {
    setFormDeptId('');
    setFormDeptName('');
    setFormDeptHead('');
    setFormCategory('Operations');
    setFormFrequency('Quarterly');
    setFormPlannedCycle('3 Months');
    setFormAuditor('Smt. P. Lakshmi');
    setFormStatus('Planned');
    setIsEditing(false);
  };

  const handleQuickAssignAuditorSubmit = () => {
    if (!assigningAuditorItem) return;
    setSchedules(prev => prev.map(s => {
      if (s.deptId === assigningAuditorItem.deptId) {
        return {
          ...s,
          assignedAuditor: selectedAuditorForAssign,
          status: 'Assigned' // upgrade status level
        };
      }
      return s;
    }));
    showToast(`Assigned Auditor '${selectedAuditorForAssign}' to Dept #${assigningAuditorItem.deptId}.`);
    setAssigningAuditorItem(null);
  };

  // High-density PDF Report Print
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      doc.setFillColor(15, 32, 67);
      doc.rect(0, 0, 297, 24, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text("VISAKHAPATNAM STEEL PLANT - INTERNAL AUDIT DIVISION", 14, 10);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text("CYCLE-BASED AUDIT MASTER PLANNING REGISTRY (AIMS NODE)", 14, 16);
      doc.text(`DATE EXPORTED: 2026-06-06 | AUTHORISED USER: ${userName} (${userRole})`, 14, 21);

      const headers = [['Dept ID', 'Department Name', 'HOD Name', 'Category', 'Frequency', 'Planned Target Cycle', 'Auditor', 'Status']];
      const rows = filteredSchedules.map(s => [
        s.deptId, s.deptName, s.deptHead, s.auditCategory, s.frequency, s.plannedAuditCycle, s.assignedAuditor, s.status
      ]);

      autoTable(doc, {
        head: headers,
        body: rows,
        startY: 28,
        theme: 'striped',
        headStyles: { fillColor: [11, 47, 89], textColor: [255, 255, 255], fontSize: 8.5 },
        bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
      });

      doc.save("AIMS_Audit_Cycle_Planning_Report.pdf");
      showToast("Cycle-based planning registry printed as official PDF.");
    } catch (err) {
      console.error(err);
      alert("Error printing PDF document.");
    }
  };

  // Excel Excel/CSV Direct download
  const handleExportCSV = () => {
    try {
      let csv = 'Department ID,Department Name,Department Head,Audit Category,Audit Frequency,Planned Audit Cycle,Assigned Auditor,Status\r\n';
      filteredSchedules.forEach(s => {
        csv += `"${s.deptId}","${s.deptName}","${s.deptHead}","${s.auditCategory}","${s.frequency}","${s.plannedAuditCycle}","${s.assignedAuditor}","${s.status}"\r\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "AIMS_Audit_Planned_Cycles_Report.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Excel spreadsheet layout report compiled and downloaded.");
    } catch (err) {
      console.error(err);
      alert("Error saving spreadsheet report file.");
    }
  };

  const selectedDetailsSchedule = useMemo(() => {
    return schedules.find(s => s.deptId === activeDetailsId) || null;
  }, [activeDetailsId, schedules]);

  const selectedHistoryAudit = useMemo(() => {
    return historicalAudits.find(h => h.auditId === activeHistoryDetailsId) || null;
  }, [activeHistoryDetailsId, historicalAudits]);

  return (
    <div className="p-6 space-y-6 animate-fade-in font-sans text-slate-800" id="aims-schedule-planning-base">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-6 bg-slate-900 border-l-4 border-l-yellow-400 text-white p-4 rounded shadow-2xl z-50 flex items-center gap-3 text-xs font-mono max-w-sm animate-bounce" id="aims-schedule-toast">
          <CheckCircle2 className="w-5 h-5 text-yellow-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar Area */}
      <div className="bg-white border border-slate-300 p-4 rounded-sm shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] text-slate-400 font-bold font-mono tracking-wider block uppercase mb-1">
            Home &gt; Audit Planning &gt; Schedule Planning
          </span>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarRange className="w-6 h-6 text-blue-900" />
            Audit Schedule Planning
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Internal audit cycles, resource configurations, operational allocation periods, and state maintenance master control.
          </p>
        </div>

        <div className="flex gap-2">
          <button 
            id="aims-planning-btn-csv"
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black rounded-xs border border-slate-350 flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
            Excel Export
          </button>
          
          <button 
            id="aims-planning-btn-pdf"
            onClick={handleExportPDF}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black rounded-xs border border-slate-350 flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            Print Registry (PDF)
          </button>
        </div>
      </div>

      {/* COMPACT ENTERPRISE SUMMARY STRIP */}
      <div 
        className="bg-slate-900 border border-slate-800 text-white p-3 px-4 rounded-xs font-mono text-[11px] select-none shadow-sm flex items-center flex-wrap divide-x divide-slate-705 justify-between gap-y-1.5"
        id="aims-planning-summary-strip"
      >
        <div className="flex items-center gap-2 font-bold text-yellow-400 uppercase tracking-wide">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>AIMS enterprise summary strip:</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 pl-3 text-slate-300">
          <span>Total Departments: <strong className="text-yellow-400 font-extrabold text-xs">{totalDepts}</strong></span>
          <span className="text-slate-600">|</span>
          <span>1 Month Audits: <strong className="text-white text-xs">{m1Count}</strong></span>
          <span className="text-slate-600">|</span>
          <span>2 Month Audits: <strong className="text-white text-xs">{m2Count}</strong></span>
          <span className="text-slate-600">|</span>
          <span>3 Month Audits: <strong className="text-white text-xs">{m3Count}</strong></span>
          <span className="text-slate-600">|</span>
          <span>6 Month Audits: <strong className="text-white text-xs">{m6Count}</strong></span>
          <span className="text-slate-600">|</span>
          <span>Yearly Audits: <strong className="text-white text-xs">{yCount}</strong></span>
        </div>
      </div>

      {/* DUAL COLUMN ORACLE STYLE WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="aims-schedule-workspace">
        
        {/* Left Column: FORM DEPT_SCHEDULE_CONFIG */}
        <div className="lg:col-span-1 bg-white border border-slate-300 rounded-sm shadow-sm flex flex-col justify-between">
          <div className="bg-slate-150 bg-slate-100 px-4 py-3 border-b flex justify-between items-center text-[11px] font-bold text-slate-800 uppercase tracking-widest font-mono">
            <span>FORM: CYCLE_PLANNING_CONFIG</span>
            <span className="bg-blue-100 text-blue-900 border border-blue-200 px-1.5 py-0.5 rounded text-[8.5px] uppercase font-bold">
              {userRole === 'Auditor' ? 'LOCKED' : isEditing ? 'Edit Mode' : 'Create Mode'}
            </span>
          </div>

          <form onSubmit={handleFormSubmit} className="p-4 space-y-4 flex-1 text-xs">
            <div>
              <label htmlFor="dept-id-input" className="block mb-1 text-[11px] font-bold text-slate-700">
                Department ID (6-Digit Numeric) <span className="text-red-650 text-red-600 font-bold">*</span>
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input 
                  id="dept-id-input"
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 100009"
                  value={formDeptId}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^\d*$/.test(v)) setFormDeptId(v);
                  }}
                  className="w-full pl-9 bg-slate-50 border border-slate-300 rounded-sm p-2 font-mono text-slate-900 focus:outline-none focus:border-blue-900 focus:bg-white disabled:opacity-80"
                  required
                  disabled={isEditing || userRole === 'Auditor'}
                />
              </div>
              <p className="text-[9px] text-slate-400 mt-1 italic block leading-none">
                {userRole === 'Auditor' ? 'Auditor role is read-only.' : isEditing ? 'ID Key locked during update.' : 'Must enter a unique 6-digit steel unit identification.'}
              </p>
            </div>

            <div>
              <label htmlFor="dept-name-input" className="block mb-1 text-[11px] font-bold text-slate-700">
                Department Name <span className="text-red-600 font-bold">*</span>
              </label>
              <input 
                id="dept-name-input"
                type="text"
                placeholder="e.g. Oxygen Plant"
                value={formDeptName}
                onChange={(e) => setFormDeptName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-sm p-2 text-slate-900 focus:outline-none focus:border-blue-900 focus:bg-white disabled:opacity-80"
                required
                disabled={userRole === 'Auditor'}
              />
            </div>

            <div>
              <label htmlFor="dept-head-input" className="block mb-1 text-[11px] font-bold text-slate-700">
                Department Head (HOD) <span className="text-red-600 font-bold">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input 
                  id="dept-head-input"
                  type="text"
                  placeholder="e.g. Shri R. K. Sen"
                  value={formDeptHead}
                  onChange={(e) => setFormDeptHead(e.target.value)}
                  className="w-full pl-9 bg-slate-50 border border-slate-300 rounded-sm p-2 text-slate-900 focus:outline-none focus:border-blue-900 focus:bg-white disabled:opacity-80"
                  required
                  disabled={userRole === 'Auditor'}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="dept-category" className="block mb-1 text-[11px] font-bold text-slate-700">
                  Audit Category <span className="text-red-600 font-bold">*</span>
                </label>
                <input 
                  id="dept-category"
                  type="text"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-sm p-2 text-slate-900 focus:outline-none focus:border-blue-900 focus:bg-white disabled:opacity-80"
                  required
                  disabled={userRole === 'Auditor'}
                />
              </div>
              <div>
                <label htmlFor="dept-freq-select" className="block mb-1 text-[11px] font-bold text-slate-700">
                  Audit Frequency <span className="text-red-600 font-bold">*</span>
                </label>
                <select 
                  id="dept-freq-select"
                  value={formFrequency} 
                  onChange={(e) => setFormFrequency(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-sm p-2 text-slate-900 focus:outline-none focus:border-blue-900 font-mono focus:bg-white disabled:opacity-80 text-xs"
                  required
                  disabled={userRole === 'Auditor'}
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Half-Yearly">Half-Yearly</option>
                  <option value="Annually">Annually</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="dept-cycle-select" className="block mb-1 text-[11px] font-bold text-slate-700">
                  Planned Cycle <span className="text-red-600 font-bold">*</span>
                </label>
                <select 
                  id="dept-cycle-select"
                  value={formPlannedCycle} 
                  onChange={(e) => setFormPlannedCycle(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-sm p-2 text-slate-900 focus:outline-none focus:border-blue-900 font-mono focus:bg-white disabled:opacity-80 text-xs"
                  required
                  disabled={userRole === 'Auditor'}
                >
                  <option value="1 Month">1 Month</option>
                  <option value="2 Months">2 Months</option>
                  <option value="3 Months">3 Months</option>
                  <option value="6 Months">6 Months</option>
                  <option value="12 Months">12 Months (Yearly)</option>
                </select>
              </div>
              <div>
                <label htmlFor="dept-status-select" className="block mb-1 text-[11px] font-bold text-slate-700">
                  Audit Status <span className="text-red-600 font-bold">*</span>
                </label>
                <select 
                  id="dept-status-select"
                  value={formStatus} 
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-sm p-2 text-slate-900 focus:outline-none focus:border-blue-900 font-mono focus:bg-white disabled:opacity-80 text-xs"
                  required
                  disabled={userRole === 'Auditor'}
                >
                  <option value="Planned">Planned</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="dept-auditor-select" className="block mb-1 text-[11px] font-bold text-slate-700">
                Assigned Lead Auditor <span className="text-red-600 font-bold">*</span>
              </label>
              <select 
                id="dept-auditor-select"
                value={formAuditor} 
                onChange={(e) => setFormAuditor(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-sm p-2 text-slate-900 focus:outline-none focus:border-blue-900 focus:bg-white disabled:opacity-80 text-xs"
                required
                disabled={userRole === 'Auditor'}
              >
                <option value="Smt. P. Lakshmi">Smt. P. Lakshmi (Senior Manager)</option>
                <option value="Shri K. Somasekhar">Shri K. Somasekhar (DGM)</option>
                <option value="Shri J.C. Bose">Shri J.C. Bose (Chief Executive)</option>
                <option value="Shri T.V. Satyanarayana">Shri T.V. Satyanarayana (AGM)</option>
              </select>
            </div>
          </form>

          {/* Form Action Buttons */}
          <div className="bg-slate-50 p-3.5 border-t border-slate-300 flex items-center justify-between gap-2">
            {userRole === 'Auditor' ? (
              <span className="text-[10px] uppercase font-extrabold text-red-600 font-mono tracking-wider text-center w-full flex items-center justify-center gap-1 py-1.5">
                <Lock className="w-3.5 h-3.5" /> READ-ONLY PLANNING DATABASE
              </span>
            ) : (
              <>
                <button
                  id="dept-form-clear"
                  type="button"
                  onClick={clearForm}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-sm hover:bg-slate-100 text-xs font-bold text-slate-600 transition-all cursor-pointer"
                >
                  Clear Fields
                </button>
                <button
                  id="dept-form-submit"
                  type="button"
                  onClick={handleFormSubmit}
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-black text-xs uppercase tracking-wider rounded-sm transition-all shadow-sm flex items-center gap-1 cursor-pointer font-mono"
                >
                  <Check className="w-4 h-4" />
                  <span>{isEditing ? 'UPDATE' : 'COMMIT'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Column: High-density interactive LEDGER GRID */}
        <div className="lg:col-span-2 bg-white border border-slate-300 rounded-sm shadow-sm flex flex-col justify-between" id="aims-schedule-grid-container">
          
          <div className="bg-slate-100 p-3.5 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">
              DEPARTMENT CYCLE PLANNING INDEX
            </span>
          </div>

          {/* HIGH-DENSITY ENTERPRISE FILTERS */}
          <div className="bg-slate-50 p-3 border-b border-slate-300 grid grid-cols-2 lg:grid-cols-5 gap-2.5 text-[11px]">
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-slate-600">Search Department</span>
              <div className="relative">
                <Search className="absolute left-2 top-1.5 w-3 h-3 text-slate-400" />
                <input
                  id="filter-search"
                  type="text"
                  placeholder="Code/Name..."
                  value={gridSearch}
                  onChange={(e) => { setGridSearch(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-white border border-slate-300 rounded-sm pl-7 pr-2 py-0.5 focus:outline-none focus:border-blue-900"
                />
              </div>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-slate-600">Audit Cycle</span>
              <select
                id="filter-cycle"
                value={cycleFilter}
                onChange={(e) => { setCycleFilter(e.target.value); setCurrentPage(1); }}
                className="w-full bg-white border border-slate-300 rounded-sm p-0.5 focus:outline-none focus:border-blue-900 text-[11.5px]"
              >
                <option value="All">All Cycles</option>
                <option value="1 Month">1 Month Cycles</option>
                <option value="2 Months">2 Months Cycles</option>
                <option value="3 Months">3 Months Cycles</option>
                <option value="6 Months">6 Months Cycles</option>
                <option value="12 Months">Yearly Cycles</option>
              </select>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-slate-600">Department</span>
              <select
                id="filter-dept"
                value={deptFilter}
                onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
                className="w-full bg-white border border-slate-300 rounded-sm p-0.5 focus:outline-none focus:border-blue-900 text-[11.5px]"
              >
                <option value="All">All Departments</option>
                {schedules.map(s => (
                  <option key={s.deptId} value={s.deptId}>{s.deptName}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-slate-600">Frequency</span>
              <select
                id="filter-freq"
                value={freqFilter}
                onChange={(e) => { setFreqFilter(e.target.value); setCurrentPage(1); }}
                className="w-full bg-white border border-slate-300 rounded-sm p-0.5 focus:outline-none focus:border-blue-900 text-[11.5px]"
              >
                <option value="All">All Freqs</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Half-Yearly">Half-Yearly</option>
                <option value="Annually">Annually</option>
              </select>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-slate-600">Status</span>
              <select
                id="filter-status-select"
                value={gridFilterStatus}
                onChange={(e) => { setGridFilterStatus(e.target.value); setCurrentPage(1); }}
                className="w-full bg-white border border-slate-300 rounded-sm p-0.5 focus:outline-none focus:border-blue-900 text-[11.5px]"
              >
                <option value="All">All Statuses</option>
                <option value="Planned">Planned</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* HIGHEST RECORD GRID TABLE */}
          <div className="p-0 overflow-x-auto min-h-[295px]">
            <table className="w-full text-left font-sans text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] tracking-wider uppercase text-slate-600 font-black font-mono">
                  {[
                    { key: 'deptId', label: 'DEPT ID' },
                    { key: 'deptName', label: 'DEPARTMENT NAME' },
                    { key: 'deptHead', label: 'HEAD OF DEPT' },
                    { key: 'auditCategory', label: 'AUDIT CATEGORY' },
                    { key: 'frequency', label: 'FREQUENCY' },
                    { key: 'plannedAuditCycle', label: 'TARGET CYCLE' },
                    { key: 'assignedAuditor', label: 'ASSIGNED AUDITOR' },
                    { key: 'status', label: 'STATUS' },
                  ].map((field) => (
                    <th 
                      key={field.key} 
                      onClick={() => {
                        if (sortBy === field.key) {
                          setSortOrder(p => p === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy(field.key as any);
                          setSortOrder('asc');
                        }
                      }}
                      className="p-3 cursor-pointer hover:bg-slate-100 select-none border-r border-slate-200/50"
                    >
                      <div className="flex items-center gap-1 justify-between">
                        <span>{field.label}</span>
                        {sortBy === field.key && (
                          <span className="text-[10px] text-blue-900 font-bold font-mono">
                            {sortOrder === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="p-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-slate-800 font-sans">
                {paginatedSchedules.length > 0 ? (
                  paginatedSchedules.map((item) => (
                    <tr 
                      id={`master-grid-schedule-row-${item.deptId}`} 
                      key={item.deptId} 
                      className="hover:bg-slate-50/80 transition-all border-b"
                    >
                      <td className="p-3 font-mono font-bold text-blue-900">
                        <span className="bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-[11px]">
                          {item.deptId}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-900 text-[11px] uppercase">
                        {item.deptName}
                      </td>
                      <td className="p-3 text-slate-600 font-semibold">{item.deptHead}</td>
                      <td className="p-3 text-slate-500 font-medium italic">{item.auditCategory}</td>
                      <td className="p-3 font-medium text-slate-600 font-mono">{item.frequency}</td>
                      <td className="p-1.5 p-3 font-mono font-extrabold text-blue-950 text-center">
                        <span className="bg-slate-100 text-xs text-indigo-950 px-2 py-0.5 rounded border border-indigo-100">
                          {item.plannedAuditCycle}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-600">{item.assignedAuditor}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 border text-[9px] font-mono uppercase font-extrabold rounded ${
                          item.status === 'Completed' ? 'bg-green-50 border-green-200 text-green-700' :
                          item.status === 'In Progress' ? 'bg-amber-50 border-amber-250 border-amber-200 text-amber-700 animate-pulse' :
                          item.status === 'Assigned' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
                          'bg-slate-50 border-slate-200 text-slate-700'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${
                            item.status === 'Completed' ? 'bg-green-600' :
                            item.status === 'In Progress' ? 'bg-yellow-600' :
                            item.status === 'Assigned' ? 'bg-indigo-600' :
                            'bg-slate-500'
                          }`}></span>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="inline-flex gap-1">
                          <button
                            id={`actions-view-${item.deptId}`}
                            onClick={() => setActiveDetailsId(item.deptId)}
                            className="p-1 text-slate-600 hover:text-slate-900 border border-slate-300 rounded bg-white"
                            title="View Plan details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {userRole === 'HOD' ? (
                            <>
                              <button
                                id={`actions-edit-${item.deptId}`}
                                onClick={() => handleEditClick(item)}
                                className="p-1 text-blue-800 hover:text-blue-900 border border-blue-200 rounded bg-white"
                                title="Edit parameters"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                id={`actions-assign-${item.deptId}`}
                                onClick={() => {
                                  setAssigningAuditorItem(item);
                                  setSelectedAuditorForAssign(item.assignedAuditor);
                                }}
                                className="p-1 px-1.5 text-indigo-800 hover:text-indigo-950 border border-indigo-200 rounded bg-indigo-50/50 text-[10px] font-bold font-mono tracking-wider"
                                title="Assign Lead Auditor quickly"
                              >
                                ASSIGN
                              </button>
                            </>
                          ) : null}
                          <button
                            id={`actions-history-${item.deptId}`}
                            onClick={() => {
                              setActiveBottomTab('history');
                              const match = historicalAudits.find(h => h.deptId === item.deptId);
                              if (match) {
                                setActiveHistoryDetailsId(match.auditId);
                              } else {
                                showToast(`No previous archived findings logged for Dept ${item.deptId}.`);
                              }
                            }}
                            className="p-1 text-purple-700 hover:text-purple-900 border border-purple-200 rounded bg-white"
                            title="Verify historical archives"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400 italic">
                      No registered cycle parameters found matching the defined filtered state query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="bg-slate-50 px-4 py-2 border-t border-slate-300 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-500">
              Showing {filteredSchedules.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredSchedules.length)} of{' '}
              {filteredSchedules.length} department records
            </span>

            {totalPages > 1 && (
              <div className="flex gap-1 items-center">
                <button
                  id="page-prev"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
                  className="p-0.5 px-1.5 border rounded bg-white disabled:opacity-40 text-[10px] font-bold"
                >
                  PREV
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-2 py-0.5 border text-[10px] font-bold transition-all ${
                      currentPage === i + 1 ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  id="page-next"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
                  className="p-0.5 px-1.5 border rounded bg-white disabled:opacity-40 text-[10px] font-bold"
                >
                  NEXT
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* LOWER TAB CONTROL HUB - DURESS FREE PORTLETS */}
      <div className="bg-white border border-slate-300 rounded-sm shadow-sm" id="aims-planning-lower-hub">
        
        {/* Hub Tab Headings */}
        <div className="bg-slate-100 border-b border-slate-300 px-4 py-1 flex items-center justify-between flex-wrap gap-2">
          <div className="flex flex-wrap">
            <button
              id="subtab-lever-calendar"
              onClick={() => setActiveBottomTab('cycles')}
              className={`px-4 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeBottomTab === 'cycles' ? 'border-b-blue-900 text-blue-950 bg-white/50 font-black' : 'border-b-transparent text-slate-600'
              }`}
            >
              <CalendarRange className="w-4 h-4 text-blue-900" />
              Audit Cycle View
            </button>
            <button
              id="subtab-lever-upcoming"
              onClick={() => setActiveBottomTab('upcoming')}
              className={`px-4 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeBottomTab === 'upcoming' ? 'border-b-blue-900 text-blue-950 bg-white/50 font-black' : 'border-b-transparent text-slate-600'
              }`}
            >
              <Users className="w-4 h-4 text-amber-600" />
              Cycle Allocation Summary
            </button>
            <button
              id="subtab-lever-history"
              onClick={() => setActiveBottomTab('history')}
              className={`px-4 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeBottomTab === 'history' ? 'border-b-blue-900 text-blue-950 bg-white/50 font-black' : 'border-b-transparent text-slate-600'
              }`}
            >
              <FileText className="w-4 h-4 text-purple-700" />
              Audit History Logs
            </button>
          </div>
          
          <span className="text-[10px] font-mono text-slate-400 bg-slate-950/5 px-2.5 py-0.5 rounded font-black">
            PORTLET NODE: {activeBottomTab === 'cycles' ? 'CYCLE_VIEW' : activeBottomTab === 'upcoming' ? 'CYCLE_ALLOCATION' : 'HISTORY_LEDGER'}
          </span>
        </div>

        {/* Tab 1 Body: Audit Cycle View */}
        {activeBottomTab === 'cycles' && (
          <div className="p-6 space-y-5" id="tab-cycles-section">
            <div className="border-b pb-2">
              <h3 className="text-xs font-black text-slate-900 font-mono tracking-wider">
                STRUCTURED PLANNING VIEW GROUPED BY CYCLE
              </h3>
              <p className="text-[11px] text-slate-500">
                Departmental configurations distributed dynamically inside corresponding target audit cycles.
              </p>
            </div>

            {/* HIGH DENSITY LEDGERS CORRESPONDING TO USER SPECS EXACTLY (Text format logic) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                { title: '1 MONTH AUDITS', key: '1 Month', list: m1List },
                { title: '2 MONTH AUDITS', key: '2 Months', list: m2List },
                { title: '3 MONTH AUDITS', key: '3 Months', list: m3List },
                { title: '6 MONTH AUDITS', key: '6 Months', list: m6List },
                { title: 'YEARLY AUDITS', key: '12 Months', list: yList },
              ].map((group) => (
                <div key={group.key} className="bg-slate-50 border border-slate-300 p-3.5 min-h-[170px] flex flex-col justify-between">
                  <div>
                    <div className="bg-slate-900 text-yellow-400 px-2.5 py-1.5 font-mono font-black text-[10.5px] uppercase tracking-wider mb-3 flex items-center justify-between border-b border-yellow-400">
                      <span>## {group.title}</span>
                      <span className="bg-slate-950 text-white px-1.5 py-0.2 rounded font-mono text-[9px]">{group.list.length}</span>
                    </div>
                    
                    <div className="space-y-2 font-mono text-[11px] text-slate-800 leading-relaxed font-semibold">
                      {group.list.length > 0 ? (
                        group.list.map((item) => (
                          <div 
                            key={item.deptId} 
                            onClick={() => setActiveDetailsId(item.deptId)}
                            className="hover:text-blue-900 cursor-pointer pb-1.5 border-b border-slate-200/50 hover:pl-1 transition-all flex justify-between items-center"
                          >
                            <span>{item.deptId} | {item.deptName}</span>
                            <span className="text-[8.5px] text-slate-400 font-normal">{item.status}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-400 italic py-4 text-center text-[10.5px] font-normal leading-normal">
                          -- No registered departments planned in this cycle. --
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3.5 border-t border-slate-200 mt-2 text-right">
                    <span className="text-[8.5px] font-mono tracking-widest text-slate-400 font-extrabold uppercase block select-none">
                      REG STATUS: VERIFIED
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2 Body: Cycle Allocation Summary */}
        {activeBottomTab === 'upcoming' && (
          <div className="p-6 space-y-4" id="tab-upcoming-section">
            <div className="border-b pb-2">
              <h3 className="text-xs font-black text-slate-900 font-mono tracking-wider">
                OPERATIONAL CYCLE ALLOCATION REGISTRY
              </h3>
              <p className="text-[11px] text-slate-500">
                Summary view of current ongoing audits configuration distributed across core sectors.
              </p>
            </div>

            <div className="border border-slate-200">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] tracking-wider uppercase text-slate-600 font-bold font-mono">
                    <th className="p-3">Department ID</th>
                    <th className="p-3">Department Name</th>
                    <th className="p-3">Category Grouping</th>
                    <th className="p-3">Audit Cycle Period</th>
                    <th className="p-3">Assigned Auditor</th>
                    <th className="p-3">Current Plan Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {schedules.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 font-medium">
                      <td className="p-3 font-mono text-blue-900 font-bold">{item.deptId}</td>
                      <td className="p-3 text-slate-800 font-bold uppercase">{item.deptName}</td>
                      <td className="p-3 text-slate-500 italic">{item.auditCategory}</td>
                      <td className="p-3 font-mono text-indigo-900 font-black">{item.plannedAuditCycle}</td>
                      <td className="p-3 text-slate-600">{item.assignedAuditor}</td>
                      <td className="p-3">
                        <span className="bg-slate-100 text-slate-705 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3 Body: Historical archives */}
        {activeBottomTab === 'history' && (
          <div className="p-6 space-y-4" id="tab-history-section">
            <div className="border-b pb-2">
              <h3 className="text-xs font-black text-slate-900 font-mono tracking-wider text-slate-850">
                CHRONOLOGICAL CYCLE AUDIT HISTORY & FINDINGS LEDGER
              </h3>
              <p className="text-[11px] text-slate-500 leading-normal">
                Visakhapatnam internal system logging node tracking previously finalized cycle executions.
              </p>
            </div>

            <div className="border border-slate-200">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] tracking-wider uppercase text-slate-605 text-slate-650 font-bold font-mono">
                    <th className="p-3">Audit ID</th>
                    <th className="p-3">Dept ID</th>
                    <th className="p-3">Department Name</th>
                    <th className="p-3">Cycle Term</th>
                    <th className="p-3">Lead Auditor</th>
                    <th className="p-3 text-center">Findings Registered</th>
                    <th className="p-3">Registry Protection</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {historicalAudits.map((h, i) => (
                    <tr key={i} className="hover:bg-slate-50 font-semibold text-slate-700">
                      <td className="p-3 font-mono text-slate-500">{h.auditId}</td>
                      <td className="p-3 font-mono text-slate-450 text-slate-500">{h.deptId}</td>
                      <td className="p-3 text-slate-900 uppercase">{h.deptName}</td>
                      <td className="p-3 font-mono text-indigo-900">{h.cyclePeriod}</td>
                      <td className="p-3 text-slate-600 font-sans">{h.auditor}</td>
                      <td className="p-3 font-mono text-center text-red-650 text-red-600 font-bold">{h.numFindings} Findings</td>
                      <td className="p-3">
                        <span className="bg-green-50 text-green-700 border border-green-200 text-[9px] font-mono font-black px-1.5 py-0.5 rounded">
                          {h.status} &amp; SECURE
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          id={`hist-findings-pop-${h.auditId}`}
                          onClick={() => setActiveHistoryDetailsId(h.auditId)}
                          className="px-2 py-1 text-[10px] uppercase font-mono font-bold text-blue-900 border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                        >
                          Trace Findings
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* DIALOGS / OVERLAYS */}

      {/* 1. Planning details overlay */}
      {activeDetailsId !== null && selectedDetailsSchedule && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="schedule-details-modal">
          <div className="bg-white border border-slate-300 rounded-sm max-w-sm w-full overflow-hidden shadow-2xl text-slate-800 font-sans text-xs">
            <div className="bg-blue-900 text-white p-3.5 font-mono font-bold uppercase flex items-center justify-between text-[11px] tracking-wider">
              <span>AIMS MASTER PLAN DETAIL OVERLAY</span>
              <button 
                onClick={() => setActiveDetailsId(null)}
                className="text-white hover:text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="border-b pb-2">
                <h4 className="text-sm font-black text-slate-900 uppercase leading-none mb-1">
                  {selectedDetailsSchedule.deptName}
                </h4>
                <p className="text-[10px] text-slate-400 font-mono">PRIMARY IDENTIFIER: {selectedDetailsSchedule.deptId}</p>
              </div>

              <div className="space-y-1.5 leading-relaxed text-slate-700 font-medium">
                <p><strong>Department Head:</strong> {selectedDetailsSchedule.deptHead}</p>
                <p><strong>Category Grouping:</strong> {selectedDetailsSchedule.auditCategory}</p>
                <p><strong>Audit Frequency:</strong> {selectedDetailsSchedule.frequency}</p>
                <p><strong>Planned Target Cycle:</strong> <span className="font-mono text-blue-900 font-bold">{selectedDetailsSchedule.plannedAuditCycle}</span></p>
                <p><strong>Assigned Auditor:</strong> {selectedDetailsSchedule.assignedAuditor}</p>
                <p><strong>Current Registry Status:</strong> <span className="font-mono uppercase font-black text-indigo-900">{selectedDetailsSchedule.status}</span></p>
              </div>

              <div className="p-2 bg-slate-50 border border-slate-200 text-[10px] font-mono leading-normal text-slate-500">
                SECURE AUTH: Visakhapatnam node cycle register parameters are protected as master logs.
              </div>
            </div>

            <div className="bg-slate-100 p-2.5 border-t border-slate-200 text-right flex justify-end gap-2">
              {userRole === 'HOD' ? (
                <button
                  onClick={() => {
                    handleEditClick(selectedDetailsSchedule);
                    setActiveDetailsId(null);
                  }}
                  className="px-2.5 py-1 bg-blue-900 text-white font-mono font-bold text-[10px] uppercase rounded-xs cursor-pointer"
                >
                  Edit Configuration
                </button>
              ) : null}
              <button
                onClick={() => setActiveDetailsId(null)}
                className="px-2.5 py-1 border border-slate-300 text-slate-600 font-mono font-bold text-[10px] uppercase rounded-xs cursor-pointer bg-white"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Chronological findings modal */}
      {activeHistoryDetailsId !== null && selectedHistoryAudit && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="history-details-modal">
          <div className="bg-white border border-slate-300 rounded-sm max-w-md w-full overflow-hidden shadow-2xl text-slate-800 font-sans text-xs">
            <div className="bg-slate-900 text-white p-3.5 font-mono font-bold uppercase flex items-center justify-between text-[11px] tracking-wider">
              <span>FINDINGS &amp; HISTORY TRACE &bull; {selectedHistoryAudit.auditId}</span>
              <button 
                onClick={() => setActiveHistoryDetailsId(null)}
                className="text-white hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5">
              <div className="border-b pb-2">
                <h4 className="text-sm font-black text-slate-900 uppercase leading-none mb-1">
                  {selectedHistoryAudit.deptName}
                </h4>
                <p className="text-[10px] text-slate-450 font-mono">Assigned Cycle Period: {selectedHistoryAudit.cyclePeriod} | Auditor Account: {selectedHistoryAudit.auditor}</p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block font-black">Registered Findings:</span>
                <ul className="space-y-1.5 max-h-36 overflow-y-auto">
                  {selectedHistoryAudit.findings.map((f, idx) => (
                    <li key={idx} className="p-2 bg-red-50/50 border border-red-150 text-red-950 rounded leading-relaxed text-[11px] font-semibold">
                      &bull; {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-dashed">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block font-black">AIMS Audit Trail Path:</span>
                <div className="space-y-1 font-mono text-[10px] text-slate-550 divide-y">
                  {selectedHistoryAudit.auditTrail.map((t, idx) => (
                    <p key={idx} className="py-1 text-slate-600 font-semibold leading-relaxed">&bull; {t}</p>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-100 p-2.5 border-t border-slate-200 text-right">
              <button
                onClick={() => setActiveHistoryDetailsId(null)}
                className="px-3.5 py-1 bg-slate-900 text-white font-mono font-bold text-[10.5px] uppercase rounded-xs cursor-pointer"
              >
                Close Trace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Assign Auditor Quickly Modal */}
      {assigningAuditorItem !== null && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="quick-assign-modal">
          <div className="bg-white border border-slate-305 bg-white border-slate-300 rounded-sm max-w-xs w-full overflow-hidden shadow-2xl text-slate-800 font-sans text-xs">
            <div className="bg-indigo-950 text-white p-3 font-mono font-black uppercase text-[10.5px] tracking-wider flex justify-between items-center">
              <span>QUICK ALLOCATE LEAD AUDITOR</span>
              <button onClick={() => setAssigningAuditorItem(null)} className="text-white hover:text-slate-205 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5">
              <div className="pb-1.5 border-b">
                <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Assigned Department</p>
                <p className="font-bold text-slate-900 uppercase text-[12.5px]">{assigningAuditorItem.deptName}</p>
                <p className="text-[10px] text-slate-500 font-mono">Code Ref: {assigningAuditorItem.deptId} | Cycle: {assigningAuditorItem.plannedAuditCycle}</p>
              </div>

              <div>
                <label htmlFor="modal-auditor-select" className="text-[11.5px] font-bold text-slate-700 block mb-1">Select Lead Auditor Asset</label>
                <select
                  id="modal-auditor-select"
                  value={selectedAuditorForAssign}
                  onChange={(e) => setSelectedAuditorForAssign(e.target.value)}
                  className="w-full bg-slate-55 border border-slate-300 rounded p-2 focus:outline-none focus:border-blue-900 text-slate-800 bg-slate-50"
                >
                  <option value="Smt. P. Lakshmi">Smt. P. Lakshmi (Senior Manager)</option>
                  <option value="Shri K. Somasekhar">Shri K. Somasekhar (DGM)</option>
                  <option value="Shri J.C. Bose">Shri J.C. Bose (Chief Executive)</option>
                  <option value="Shri T.V. Satyanarayana">Shri T.V. Satyanarayana (AGM)</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-100 p-2.5 border-t border-slate-200 text-right flex justify-end gap-2">
              <button
                onClick={() => setAssigningAuditorItem(null)}
                className="px-3.5 py-1 border rounded-xs text-[10.5px] font-mono font-bold hover:bg-slate-50 cursor-pointer bg-white"
              >
                CANCEL
              </button>
              <button
                onClick={handleQuickAssignAuditorSubmit}
                className="px-4 py-1 bg-blue-900 text-white font-mono font-bold text-[10.5px] uppercase rounded-xs cursor-pointer"
              >
                ALLOCATE
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
