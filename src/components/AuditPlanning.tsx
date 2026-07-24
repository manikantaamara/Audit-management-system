import React, { useState, useEffect } from 'react';
import { 
  Calendar, User, FilePlus2, CheckCircle2, AlertCircle, FileSpreadsheet, MapPin,
  Download, ChevronLeft, ChevronRight, Plus, CalendarRange, Clock, Info, HelpCircle,
  Briefcase, ShieldAlert, Edit2, Check, X, RefreshCw
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuditPlan } from '../types';

interface AuditPlanningProps {
  plans: AuditPlan[];
  onCreatePlan: (p: Partial<AuditPlan>) => void;
  onUpdatePlan: (id: string, updates: Partial<AuditPlan>) => void;
  currentUser: { name: string; role: string };
  activeMenu?: string;
}

export default function AuditPlanning({ plans, onCreatePlan, onUpdatePlan, currentUser, activeMenu }: AuditPlanningProps) {
  const [activeTab, setActiveTab] = useState<'generation' | 'yearly' | 'tour'>('generation');
  
  // Selected plan for editing (Inline edit panel)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  // Form states for plan creation module
  const [quarter, setQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q2'); // default current Q2 (June is Q2)
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Coke Ovens Department');
  const [auditType, setAuditType] = useState<'Internal' | 'External' | 'Compliance' | 'Operational'>('Internal');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [auditPeriod, setAuditPeriod] = useState<'Quarterly' | 'Yearly'>('Quarterly');
  const [reviewWindowStart, setReviewWindowStart] = useState('');
  const [reviewWindowEnd, setReviewWindowEnd] = useState('');
  const [leadAuditor, setLeadAuditor] = useState('');
  const [teamMembers, setTeamMembers] = useState('');
  const [objectives, setObjectives] = useState('');
  const [scope, setScope] = useState('');
  const [riskLevel, setRiskLevel] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [status, setStatus] = useState<'Planned' | 'In Progress' | 'Completed' | 'Cancelled'>('Planned');
  const [remarks, setRemarks] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states for inline editing
  const [editQuarter, setEditQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q2');
  const [editTitle, setEditTitle] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editAuditType, setEditAuditType] = useState<string>('Internal');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editAuditPeriod, setEditAuditPeriod] = useState<string>('Quarterly');
  const [editReviewWindowStart, setEditReviewWindowStart] = useState('');
  const [editReviewWindowEnd, setEditReviewWindowEnd] = useState('');
  const [editLeadAuditor, setEditLeadAuditor] = useState('');
  const [editTeamMembers, setEditTeamMembers] = useState('');
  const [editObjectives, setEditObjectives] = useState('');
  const [editScope, setEditScope] = useState('');
  const [editRiskLevel, setEditRiskLevel] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [editStatus, setEditStatus] = useState<string>('Planned');
  const [editRemarks, setEditRemarks] = useState('');

  useEffect(() => {
    if (!activeMenu) return;
    if (activeMenu === 'annual_plans') {
      setActiveTab('generation');
    } else if (activeMenu === 'yearly_planning') {
      setActiveTab('yearly');
    } else if (activeMenu === 'tour_proposals') {
      if (currentUser?.role?.toUpperCase() === 'HOD') {
        setActiveTab('generation');
      } else {
        setActiveTab('tour');
      }
    }
  }, [activeMenu, currentUser]);

  // Synchronize transaction review window defaults when target quarter changes
  useEffect(() => {
    if (auditPeriod === 'Quarterly') {
      if (quarter === 'Q1') {
        setReviewWindowStart('2026-01-01');
        setReviewWindowEnd('2026-03-31');
      } else if (quarter === 'Q2') {
        setReviewWindowStart('2026-04-01');
        setReviewWindowEnd('2026-06-30');
      } else if (quarter === 'Q3') {
        setReviewWindowStart('2026-07-01');
        setReviewWindowEnd('2026-09-30');
      } else if (quarter === 'Q4') {
        setReviewWindowStart('2026-10-01');
        setReviewWindowEnd('2026-12-31');
      }
    } else {
      // Yearly full FY scope
      setReviewWindowStart('2026-01-01');
      setReviewWindowEnd('2026-12-31');
    }
  }, [quarter, auditPeriod]);

  // Interactive scheduler calendar state (standard calendar months Jan-Dec 2026)
  const quarterMonths: Record<'Q1' | 'Q2' | 'Q3' | 'Q4', Array<{ name: string; idx: number; year: number }>> = {
    'Q1': [
      { name: 'January', idx: 0, year: 2026 },
      { name: 'February', idx: 1, year: 2026 },
      { name: 'March', idx: 2, year: 2026 }
    ],
    'Q2': [
      { name: 'April', idx: 3, year: 2026 },
      { name: 'May', idx: 4, year: 2026 },
      { name: 'June', idx: 5, year: 2026 }
    ],
    'Q3': [
      { name: 'July', idx: 6, year: 2026 },
      { name: 'August', idx: 7, year: 2026 },
      { name: 'September', idx: 8, year: 2026 }
    ],
    'Q4': [
      { name: 'October', idx: 9, year: 2026 },
      { name: 'November', idx: 10, year: 2026 },
      { name: 'December', idx: 11, year: 2026 }
    ]
  };

  const [activeSchedulerQuarter, setActiveSchedulerQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q2');
  const [schedMonthIdx, setSchedMonthIdx] = useState(2); // June 2026 is month index 2 inside Q2 list
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(null);
  const [assignmentPlanId, setAssignmentPlanId] = useState<string | null>(null);
  const [schedStartDate, setSchedStartDate] = useState('');
  const [schedEndDate, setSchedEndDate] = useState('');
  const [inspectedPlanId, setInspectedPlanId] = useState<string | null>(null);

  // Tour proposal form states
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [destination, setDestination] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isSubmittingTour, setIsSubmittingTour] = useState(false);

  const handlePlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !leadAuditor || !objectives) {
      alert('Please fill out the primary parameters (Subject Title, Lead Auditor, Objectives).');
      return;
    }

    onCreatePlan({
      title,
      quarter,
      auditType,
      department,
      leadAuditor,
      teamLead: leadAuditor, // backward compatibility mapping
      teamMembers,
      objectives,
      scope,
      riskLevel,
      status,
      remarks,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      auditPeriod,
      reviewWindowStart: reviewWindowStart || undefined,
      reviewWindowEnd: reviewWindowEnd || undefined,
      plannedMonths: (() => {
        if (quarter === 'Q1') return ['January', 'February', 'March'];
        if (quarter === 'Q2') return ['April', 'May', 'June'];
        if (quarter === 'Q3') return ['July', 'August', 'September'];
        return ['October', 'November', 'December'];
      })()
    });

    setSuccessMsg(`Audit Plan ${quarter} record successfully scheduled and submitted.`);
    setTitle('');
    setLeadAuditor('');
    setTeamMembers('');
    setObjectives('');
    setScope('');
    setStartDate('');
    setEndDate('');
    setReviewWindowStart('');
    setReviewWindowEnd('');
    setRemarks('');
    
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleStartEditing = (plan: AuditPlan) => {
    setEditingPlanId(plan.id);
    setEditQuarter(plan.quarter as any || 'Q2');
    setEditTitle(plan.title);
    setEditDepartment(plan.department);
    setEditAuditType(plan.auditType);
    setEditStartDate(plan.startDate || '');
    setEditEndDate(plan.endDate || '');
    setEditAuditPeriod(plan.auditPeriod || 'Quarterly');
    setEditReviewWindowStart(plan.reviewWindowStart || '');
    setEditReviewWindowEnd(plan.reviewWindowEnd || '');
    setEditLeadAuditor(plan.leadAuditor || plan.teamLead || '');
    setEditTeamMembers(plan.teamMembers || '');
    setEditObjectives(plan.objectives || '');
    setEditScope(plan.scope || '');
    setEditRiskLevel(plan.riskLevel as any || 'Medium');
    setEditStatus(plan.status);
    setEditRemarks(plan.remarks || '');
  };

  const handleSaveEdit = (id: string) => {
    if (!editTitle || !editLeadAuditor) {
      alert('Title and Lead Auditor are mandatory fields.');
      return;
    }

    onUpdatePlan(id, {
      title: editTitle,
      quarter: editQuarter,
      department: editDepartment,
      auditType: editAuditType,
      startDate: editStartDate || undefined,
      endDate: editEndDate || undefined,
      auditPeriod: editAuditPeriod,
      reviewWindowStart: editReviewWindowStart || undefined,
      reviewWindowEnd: editReviewWindowEnd || undefined,
      leadAuditor: editLeadAuditor,
      teamLead: editLeadAuditor, // sync older fields
      teamMembers: editTeamMembers,
      objectives: editObjectives,
      scope: editScope,
      riskLevel: editRiskLevel,
      status: editStatus,
      remarks: editRemarks,
      plannedMonths: (() => {
        if (editQuarter === 'Q1') return ['January', 'February', 'March'];
        if (editQuarter === 'Q2') return ['April', 'May', 'June'];
        if (editQuarter === 'Q3') return ['July', 'August', 'September'];
        return ['October', 'November', 'December'];
      })()
    });

    setEditingPlanId(null);
    alert(`Audit Plan [${id}] update saved to server.`);
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      
      // Visual Heading Core Styling
      doc.setFillColor(15, 32, 67); // RINL Navy blue
      doc.rect(0, 0, 297, 25, 'F');
      
      // Tricolor Accent
      doc.setFillColor(244, 125, 32); doc.rect(0, 25, 297, 1, 'F');
      doc.setFillColor(255, 255, 255); doc.rect(0, 26, 297, 1, 'F');
      doc.setFillColor(19, 136, 8); doc.rect(0, 27, 297, 1, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text("RASHTRIYA ISPAT NIGAM LIMITED - VISAKHAPATNAM STEEL PLANT", 14, 11);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text("INTERNAL AUDIT DIVISION | QUARTER-BASED AUDIT MASTER LEDGER DIRECTORY", 14, 18);

      doc.setTextColor(50, 50, 50);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text("MASTER AUDIT LIST BY QUARTERS", 14, 38);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Export Timestamp: ${new Date().toISOString()}`, 14, 43);
      doc.text(`Active Security Key: INTEGRITY-RINL-AIMS-Q-PLAN`, 14, 47);

      // Stat cards inside PDF
      doc.setFillColor(245, 247, 250);
      doc.rect(205, 34, 78, 20, 'F');
      doc.setDrawColor(210, 215, 225);
      doc.rect(205, 34, 78, 20, 'S');

      doc.setTextColor(15, 32, 67);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text("MEMBER LEDGER EXECUTIVE SUMMARY", 208, 39);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Aggregated Plans: ${plans.length}`, 208, 44);
      doc.text(`Completed Cycles: ${plans.filter(p => p.status === 'Completed').length}`, 208, 48);

      const rows = plans.map((p, idx) => [
        (idx + 1).toString(),
        p.id,
        p.quarter || 'Q2',
        p.title,
        p.department,
        p.auditType,
        p.leadAuditor || p.teamLead || 'N/A',
        p.riskLevel || 'Medium',
        p.status
      ]);

      const headers = [['SNo', 'Plan ID', 'Quarter', 'Audit Subject Focus Title', 'Target division', 'Audit Type', 'Lead Auditor', 'Risk', 'Status']];

      autoTable(doc, {
        head: headers,
        body: rows,
        startY: 56,
        theme: 'striped',
        headStyles: {
          fillColor: [15, 32, 67],
          textColor: [255, 255, 255],
          fontSize: 8.5,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [35, 35, 35]
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 26, fontStyle: 'bold' },
          2: { cellWidth: 16 },
          3: { cellWidth: 78 },
          4: { cellWidth: 42 },
          5: { cellWidth: 24 },
          6: { cellWidth: 32 },
          7: { cellWidth: 15 },
          8: { cellWidth: 22, fontStyle: 'bold' }
        },
        didDrawPage: (data) => {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7.5);
          doc.setTextColor(130, 130, 130);
          doc.text("Official confidential audit report generated directly by Visakhapatnam AIMS Node.", 14, 203);
          doc.text(`Page ${data.pageNumber} of ${doc.getNumberOfPages()}`, 270, 203);
        }
      });

      doc.save("AIMS_Quarterly_Audit_Plan_Report.pdf");
    } catch (err) {
      console.error(err);
      alert("Error printing PDF document.");
    }
  };

  const handleTourProposalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId || !destination || !purpose) {
      alert('Please select plan and write destination & visit purpose.');
      return;
    }
    setIsSubmittingTour(true);
    setTimeout(() => {
      onUpdatePlan(selectedPlanId, {
        status: 'In Progress',
        tourProposalUrl: `TP_${destination.toUpperCase()}_QTR.pdf`
      });
      setIsSubmittingTour(false);
      alert('Official Tour Proposal submitted successfully to the Chief Audit Executive! Travel voucher logged.');
      setSelectedPlanId('');
      setDestination('');
      setPurpose('');
    }, 1200);
  };

  return (
    <div id="aims-audit-planning-main" className="p-6 space-y-6 animate-fade-in font-sans text-slate-800">
      
      {/* Upper Module Navigation Banner */}
      <div className="bg-white border border-slate-300 p-4 rounded-sm shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-400 font-mono uppercase tracking-widest">AIMS CONTROL CENTRE</h2>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5 flex items-center gap-2">
            <Calendar className="w-5.5 h-5.5 text-blue-900" />
            Audit Planning & Scheduler Module
          </h1>
          <p className="text-xs text-slate-500 font-medium">Create or reschedule quarterly targets, manage field teams, and submit digital site tour proposals.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button 
            id="planning-subtab-btn-gen"
            onClick={() => setActiveTab('generation')}
            className={`px-3.5 py-2 text-xs font-black rounded-xs border transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'generation' ? 'bg-blue-900 text-white border-blue-900 shadow-sm' : 'bg-white text-slate-705 text-slate-700 border-slate-350 hover:bg-slate-50'
            }`}
          >
            <FilePlus2 className="w-3.5 h-3.5" />
            Plan Initiation Form & Ledger
          </button>
          <button 
            id="planning-subtab-btn-year"
            onClick={() => setActiveTab('yearly')}
            className={`px-3.5 py-2 text-xs font-black rounded-xs border transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'yearly' ? 'bg-blue-900 text-white border-blue-900 shadow-sm' : 'bg-white text-slate-705 text-slate-700 border-slate-350 hover:bg-slate-50'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            Interactive Scheduler
          </button>
          {currentUser?.role?.toUpperCase() !== 'HOD' && (
            <button 
              id="planning-subtab-btn-tour"
              onClick={() => setActiveTab('tour')}
              className={`px-3.5 py-2 text-xs font-black rounded-xs border transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'tour' ? 'bg-blue-900 text-white border-blue-900 shadow-sm' : 'bg-white text-slate-705 text-slate-700 border-slate-350 hover:bg-slate-50'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              Officer Tour Proposals
            </button>
          )}
        </div>
      </div>

      {activeTab === 'generation' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 1. Audit Plan Initiation Form (Oracle ERP Inspired Style) */}
            <div className="lg:col-span-1 bg-white border border-slate-300 rounded-sm shadow-sm flex flex-col justify-between">
              <div className="bg-slate-100 p-3 border-b flex justify-between items-center text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">
                <span>FORM: QTR_PLAN_INITIATION</span>
                <span className="bg-green-50 text-green-850 px-1 rounded-sm border text-[9px]">PERSISTENCE LEVEL: ACTIVE</span>
              </div>

              <form onSubmit={handlePlanSubmit} className="p-4 space-y-4 flex-1">
                {successMsg && (
                  <div className="bg-green-50 border border-green-200 p-2 text-xs text-green-900 rounded flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-green-700" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Quarter selection dropdown field */}
                <div>
                  <label className="oracle-input-label block mb-1">Target Planning Quarter (Required)</label>
                  <select 
                    id="form-quarter-select"
                    value={quarter} 
                    onChange={(e) => setQuarter(e.target.value as any)}
                    className="oracle-field-value w-full"
                    required
                  >
                    <option value="Q1">Quarter 1 (Q1): January 1 – March 31</option>
                    <option value="Q2">Quarter 2 (Q2): April 1 – June 30</option>
                    <option value="Q3">Quarter 3 (Q3): July 1 – September 30</option>
                    <option value="Q4">Quarter 4 (Q4): October 1 – December 31</option>
                  </select>
                </div>

                {/* Audit plan ID mock display */}
                <div>
                  <label className="oracle-input-label block mb-1">Audit Plan ID</label>
                  <input 
                    type="text" 
                    value="Auto-generated on database compile (e.g. PLN-2026-643)" 
                    disabled 
                    className="oracle-field-value w-full bg-slate-100 text-slate-500 font-mono italic text-[10px]"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="oracle-input-label block mb-1">Audit Subject Title (Required)</label>
                  <input 
                    id="form-title-input"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Describe main audit subject focus..."
                    className="oracle-field-value w-full text-xs"
                    required
                  />
                </div>

                {/* Department/Process */}
                <div>
                  <label className="oracle-input-label block mb-1">Target Department / Process Division</label>
                  <select 
                    id="form-dept-select"
                    value={department} 
                    onChange={(e) => setDepartment(e.target.value)}
                    className="oracle-field-value w-full text-xs"
                  >
                    <option value="Coke Ovens Department">Coke Ovens Department</option>
                    <option value="Blast Furnace Dept">Blast Furnace Dept</option>
                    <option value="SMS-2 Department">SMS-2 Department</option>
                    <option value="Materials Management">Materials Management (MM)</option>
                    <option value="Wire Rod Mill Unit">Wire Rod Mill Unit</option>
                    <option value="Finance & Accounts">Finance & Accounts</option>
                    <option value="Steel Melting Shop 1">Steel Melting Shop 1</option>
                    <option value="Thermal Power Corp Node">Thermal Power Corp Node</option>
                  </select>
                </div>

                {/* Audit Type dropdown */}
                <div>
                  <label className="oracle-input-label block mb-1">Audit Category type</label>
                  <select 
                    id="form-audit-type-select"
                    value={auditType} 
                    onChange={(e) => setAuditType(e.target.value as any)}
                    className="oracle-field-value w-full text-xs"
                  >
                    <option value="Internal">Internal Audit</option>
                    <option value="External">External Audit</option>
                    <option value="Compliance">Compliance Checks</option>
                    <option value="Operational">Operational Audit</option>
                  </select>
                </div>

                {/* Dates picker */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 border rounded-xs border-slate-205">
                  <div>
                    <label className="oracle-input-label block mb-1 text-[10px] uppercase">Schedule Start Date</label>
                    <input 
                      id="form-start-date"
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="oracle-field-value w-full p-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="oracle-input-label block mb-1 text-[10px] uppercase">Schedule End Date</label>
                    <input 
                      id="form-end-date"
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="oracle-field-value w-full p-1 text-xs"
                    />
                  </div>
                </div>

                {/* Audit Period Type Selector */}
                <div>
                  <label className="oracle-input-label block mb-1">Defined Audit Period Type</label>
                  <select 
                    id="form-audit-period-select"
                    value={auditPeriod} 
                    onChange={(e) => setAuditPeriod(e.target.value as any)}
                    className="oracle-field-value w-full text-xs font-bold"
                  >
                    <option value="Quarterly">Quarterly Audit Period</option>
                    <option value="Yearly">Yearly Audit Period</option>
                  </select>
                </div>

                {/* Transaction Review Window Bounds */}
                <div className="bg-amber-50/50 p-2.5 border rounded-xs border-amber-250 space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[10px] uppercase font-mono">
                    <Info className="w-3.5 h-3.5" />
                    <span>Transaction Review Window (Scope)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">Auditors will only examine financial transaction documents falling inside these dates.</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="oracle-input-label block mb-0.5 text-[9px] uppercase text-slate-650 text-slate-600">Review Window Start</label>
                      <input 
                        id="form-review-window-start"
                        type="date" 
                        value={reviewWindowStart}
                        onChange={(e) => setReviewWindowStart(e.target.value)}
                        className="oracle-field-value w-full p-1 text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="oracle-input-label block mb-0.5 text-[9px] uppercase text-slate-650 text-slate-600">Review Window End</label>
                      <input 
                        id="form-review-window-end"
                        type="date" 
                        value={reviewWindowEnd}
                        onChange={(e) => setReviewWindowEnd(e.target.value)}
                        className="oracle-field-value w-full p-1 text-[11px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Lead Auditor */}
                <div>
                  <label className="oracle-input-label block mb-1">Lead Auditor In-Charge (Required)</label>
                  <input 
                    id="form-lead-input"
                    type="text" 
                    value={leadAuditor}
                    onChange={(e) => setLeadAuditor(e.target.value)}
                    placeholder="e.g. Smt. P. Lakshmi, Senior Manager"
                    className="oracle-field-value w-full text-xs"
                    required
                  />
                </div>

                {/* Audit Team Members */}
                <div>
                  <label className="oracle-input-label block mb-1">Audit Team Members (Optional)</label>
                  <input 
                    id="form-team-members"
                    type="text" 
                    value={teamMembers}
                    onChange={(e) => setTeamMembers(e.target.value)}
                    placeholder="e.g. Shri S.K. Sharma, Smt. R. Priya"
                    className="oracle-field-value w-full text-xs"
                  />
                </div>

                {/* Audit Objectives */}
                <div>
                  <label className="oracle-input-label block mb-1">Audit Objectives (Required)</label>
                  <textarea 
                    id="form-objectives"
                    value={objectives}
                    onChange={(e) => setObjectives(e.target.value)}
                    placeholder="Objectives, goals, compliance targets..."
                    className="oracle-field-value w-full h-15 p-1.5 text-xs resize-none"
                    required
                  />
                </div>

                {/* Audit Scope */}
                <div>
                  <label className="oracle-input-label block mb-1">Audit Scope (Required)</label>
                  <textarea 
                    id="form-scope"
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                    placeholder="Audit scope details, transactions limits, processes covered..."
                    className="oracle-field-value w-full h-15 p-1.5 text-xs resize-none"
                    required
                  />
                </div>

                {/* Risk level Selection */}
                <div>
                  <label className="oracle-input-label block mb-1">Assessed Risk Level</label>
                  <div className="flex gap-4 p-2 bg-slate-50 border rounded-xs justify-around">
                    {['Low', 'Medium', 'High'].map(l => (
                      <label key={l} className="flex items-center gap-1.5 text-xs text-slate-800 font-bold cursor-pointer">
                        <input 
                          type="radio" 
                          name="riskLevel" 
                          checked={riskLevel === l} 
                          onChange={() => setRiskLevel(l as any)}
                          className="accent-blue-900" 
                        />
                        {l}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Status Dropdown */}
                <div>
                  <label className="oracle-input-label block mb-1">Initial Audit Status</label>
                  <select 
                    id="form-status"
                    value={status} 
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="oracle-field-value w-full text-xs font-bold"
                  >
                    <option value="Planned">Planned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Remarks */}
                <div>
                  <label className="oracle-input-label block mb-1">Administrative Remarks</label>
                  <textarea 
                    id="form-remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Remarks, caveats or notes..."
                    className="oracle-field-value w-full h-12 p-1.5 text-xs resize-none"
                  />
                </div>

                <button 
                  id="planning-submit-btn"
                  type="submit" 
                  className="w-full btn-primary-gov py-2 mt-2 gap-2 text-xs font-bold font-sans uppercase shrink-0"
                >
                  <FilePlus2 className="w-4 h-4" />
                  INITIATE AUDIT RECORD (INSERT)
                </button>
              </form>
            </div>

            {/* 2. Current Scheduled Audit Plans Ledger Table (Col-span 2) */}
            <div className="lg:col-span-2 bg-white border border-slate-300 rounded-sm shadow-sm flex flex-col justify-between">
              <div>
                <div className="bg-slate-100 p-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">
                    RECORDS: MASTER_QUARTER_AUDIT_LEDGER
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold bg-slate-205 bg-slate-200 px-2 py-0.5 rounded text-slate-600">COUNT: {plans.length}</span>
                    <button
                      id="btn-download-audit-plans-pdf"
                      onClick={handleDownloadPDF}
                      type="button"
                      className="bg-green-700 hover:bg-green-800 text-white font-bold text-[10px] px-2.5 py-1.5 rounded shadow-2xs flex items-center gap-1.5 cursor-pointer uppercase font-sans shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export Ledger PDF
                    </button>
                  </div>
                </div>

                {/* Interactive Inline Editing Panel */}
                {editingPlanId && (
                  <div className="bg-blue-50 border-b border-blue-200 p-4 space-y-4 text-xs font-sans animate-fade-in">
                    <div className="flex justify-between items-center pb-2 border-b border-blue-200">
                      <span className="font-bold text-blue-900 flex items-center gap-1.5">
                        <Edit2 className="w-4 h-4" />
                        Edit Form Editor: Plan [{editingPlanId}]
                      </span>
                      <button 
                        onClick={() => setEditingPlanId(null)}
                        className="text-slate-500 hover:text-rose-600"
                        title="Discard Editing"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="oracle-input-label block mb-0.5">Quarter</label>
                        <select 
                          value={editQuarter} 
                          onChange={(e) => setEditQuarter(e.target.value as any)} 
                          className="oracle-field-value w-full"
                        >
                          <option value="Q1">Q1 (Jan-Mar)</option>
                          <option value="Q2">Q2 (Apr-Jun)</option>
                          <option value="Q3">Q3 (Jul-Sep)</option>
                          <option value="Q4">Q4 (Oct-Dec)</option>
                        </select>
                      </div>

                      <div>
                        <label className="oracle-input-label block mb-0.5">Audit Title</label>
                        <input 
                          type="text" 
                          value={editTitle} 
                          onChange={(e) => setEditTitle(e.target.value)} 
                          className="oracle-field-value w-full" 
                        />
                      </div>

                      <div>
                        <label className="oracle-input-label block mb-0.5">Department</label>
                        <input 
                          type="text" 
                          value={editDepartment} 
                          onChange={(e) => setEditDepartment(e.target.value)} 
                          className="oracle-field-value w-full" 
                        />
                      </div>

                      <div>
                        <label className="oracle-input-label block mb-0.5">Audit Type</label>
                        <select 
                          value={editAuditType} 
                          onChange={(e) => setEditAuditType(e.target.value)} 
                          className="oracle-field-value w-full"
                        >
                          <option value="Internal">Internal</option>
                          <option value="External">External</option>
                          <option value="Compliance">Compliance</option>
                          <option value="Operational">Operational</option>
                        </select>
                      </div>

                      <div>
                        <label className="oracle-input-label block mb-0.5">Lead Auditor</label>
                        <input 
                          type="text" 
                          value={editLeadAuditor} 
                          onChange={(e) => setEditLeadAuditor(e.target.value)} 
                          className="oracle-field-value w-full" 
                        />
                      </div>

                      <div>
                        <label className="oracle-input-label block mb-0.5">Team Members</label>
                        <input 
                          type="text" 
                          value={editTeamMembers} 
                          onChange={(e) => setEditTeamMembers(e.target.value)} 
                          className="oracle-field-value w-full" 
                        />
                      </div>

                      <div>
                        <label className="oracle-input-label block mb-0.5">Start Date</label>
                        <input 
                          type="date" 
                          value={editStartDate} 
                          onChange={(e) => setEditStartDate(e.target.value)} 
                          className="oracle-field-value w-full p-0.5" 
                        />
                      </div>

                      <div>
                        <label className="oracle-input-label block mb-0.5">End Date</label>
                        <input 
                          type="date" 
                          value={editEndDate} 
                          onChange={(e) => setEditEndDate(e.target.value)} 
                          className="oracle-field-value w-full p-0.5" 
                        />
                      </div>

                      <div>
                        <label className="oracle-input-label block mb-0.5">Risk Level</label>
                        <select 
                          value={editRiskLevel} 
                          onChange={(e) => setEditRiskLevel(e.target.value as any)} 
                          className="oracle-field-value w-full font-bold"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>

                      <div className="md:col-span-1">
                        <label className="oracle-input-label block mb-0.5">Status</label>
                        <select 
                          value={editStatus} 
                          onChange={(e) => setEditStatus(e.target.value)} 
                          className="oracle-field-value w-full text-blue-900 font-bold"
                        >
                          <option value="Planned">Planned</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>

                      <div>
                        <label className="oracle-input-label block mb-0.5">Period Type</label>
                        <select 
                          value={editAuditPeriod} 
                          onChange={(e) => setEditAuditPeriod(e.target.value)} 
                          className="oracle-field-value w-full p-0.5"
                        >
                          <option value="Quarterly">Quarterly</option>
                          <option value="Yearly">Yearly</option>
                        </select>
                      </div>

                      <div>
                        <label className="oracle-input-label block mb-0.5">Tx Review Start</label>
                        <input 
                          type="date" 
                          value={editReviewWindowStart} 
                          onChange={(e) => setEditReviewWindowStart(e.target.value)} 
                          className="oracle-field-value w-full p-0.5" 
                        />
                      </div>

                      <div>
                        <label className="oracle-input-label block mb-0.5">Tx Review End</label>
                        <input 
                          type="date" 
                          value={editReviewWindowEnd} 
                          onChange={(e) => setEditReviewWindowEnd(e.target.value)} 
                          className="oracle-field-value w-full p-0.5" 
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="oracle-input-label block mb-0.5">Objectives & Scope Summary</label>
                        <input 
                          type="text" 
                          value={editObjectives} 
                          onChange={(e) => setEditObjectives(e.target.value)} 
                          className="oracle-field-value w-full"
                          placeholder="Objectives description" 
                        />
                      </div>

                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t border-dashed border-blue-200">
                      <button
                        onClick={() => setEditingPlanId(null)}
                        className="bg-white hover:bg-slate-100 text-slate-800 px-3 py-1.5 border border-slate-300 rounded font-bold"
                      >
                        Discard
                      </button>
                      <button
                        onClick={() => handleSaveEdit(editingPlanId!)}
                        className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-1.5 border border-blue-900 rounded font-black flex items-center gap-1 shadow-xs"
                      >
                        <Check className="w-4 h-4" />
                        Save DB Record
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-4 overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-sans">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-205 text-[10px] font-bold tracking-widest uppercase text-slate-650 text-slate-600">
                        <th className="py-2 px-3">Plan Ref ID</th>
                        <th className="py-2 px-3">Quarter</th>
                        <th className="py-2 px-3">Audit Subject Title & Process Department</th>
                        <th className="py-2 px-3">Auditor In-Charge</th>
                        <th className="py-2 px-3">Target Dates</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {plans.map(p => (
                        <tr id={`plan-row-${p.id}`} key={p.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-mono font-bold text-blue-900">{p.id}</td>
                          <td className="py-3 px-3 font-sans">
                            <span className="bg-blue-50 text-blue-900 border border-blue-200 px-2.5 py-0.5 rounded-sm font-black font-mono text-[10px]">
                              {p.quarter || 'Q2'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-extrabold text-slate-900 line-clamp-1">{p.title}</p>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block mt-0.5">Dept: {p.department} &bull; Risk: {p.riskLevel || 'Medium'}</span>
                            <span className="text-[10px] text-blue-900/90 font-medium block mt-0.5 bg-blue-50/50 py-0.5 px-1 rounded-sm max-w-fit">
                              Scope Type: <span className="font-bold">{p.auditPeriod || 'Quarterly'}</span> &bull; Tx Review Scope: <span className="font-mono font-bold text-blue-950">{p.reviewWindowStart && p.reviewWindowEnd ? `${p.reviewWindowStart} to ${p.reviewWindowEnd}` : 'Not Specified'}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-bold text-slate-800 text-[11px]">{p.leadAuditor || p.teamLead || 'N/A'}</p>
                            <span className="text-[10px] text-zinc-400 block font-bold tracking-wider uppercase mt-0.5">{p.auditType}</span>
                          </td>
                          <td className="py-3 px-3 font-mono text-[10px] font-bold text-slate-600">
                            {p.startDate && p.endDate ? (
                              <span>{p.startDate} to {p.endDate}</span>
                            ) : (
                              <span className="text-amber-700 bg-amber-50 px-1 border border-amber-200 uppercase text-[9px]">Unscheduled Calendar</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-block text-[9.5px] font-bold px-2 py-0.5 border ${
                              p.status === 'Completed' || p.status === 'Executed' ? 'bg-green-50 text-green-700 border-green-200' :
                              p.status === 'In Progress' || p.status === 'Submitted' || p.status === 'Approved' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                              p.status === 'Cancelled' ? 'bg-slate-50 text-slate-650 text-slate-600 border-slate-200 line-through' :
                              'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              id={`edit-plan-btn-${p.id}`}
                              onClick={() => handleStartEditing(p)}
                              className="bg-white hover:bg-slate-100 text-[10px] font-bold text-slate-850 px-2 py-1 rounded border border-slate-350 cursor-pointer shadow-3xs hover:border-slate-450 transition-all inline-flex items-center gap-1 shrink-0"
                            >
                              <Edit2 className="w-3 h-3" />
                              Modify
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>

          </div>

          {/* Visual Roadmap Ledger by standard quarters */}
          <div className="bg-white border border-slate-300 rounded-sm shadow-md p-5 flex flex-col">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 mb-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 font-mono">
                <FileSpreadsheet className="w-4 h-4 text-blue-900" />
                Quarterly roadmap workflow index (standard calendar year)
              </h3>
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 text-[9px] font-mono rounded">LEDGER_BY_QUARTERS</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((qCode) => {
                const matchedPlans = plans.filter(p => (p.quarter || 'Q2') === qCode);
                const meta = {
                  'Q1': { label: 'Quarter 1 (Q1)', timeline: 'January – March' },
                  'Q2': { label: 'Quarter 2 (Q2)', timeline: 'April – June' },
                  'Q3': { label: 'Quarter 3 (Q3)', timeline: 'July – September' },
                  'Q4': { label: 'Quarter 4 (Q4)', timeline: 'October – December' }
                }[qCode];

                return (
                  <div key={qCode} className="bg-slate-50 border border-slate-200 rounded-sm p-3 flex flex-col justify-between">
                    <div>
                      <div className="bg-blue-900 text-white text-[10px] font-black px-2 py-0.5 rounded-xs uppercase tracking-wider text-center mb-1">
                        {meta.label}
                      </div>
                      <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-wider font-mono mb-3">{meta.timeline}</p>

                      {matchedPlans.length === 0 ? (
                        <div className="text-center py-6 text-[10px] text-slate-400 italic">
                          No Scheduled Audits
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {matchedPlans.map(plan => (
                            <div key={plan.id} className="bg-white border border-slate-250 border-slate-200 rounded-sm p-2 shadow-3xs text-[10.5px] font-sans">
                              <span className="inline-block bg-blue-50 text-blue-900 text-[8.5px] font-mono font-extrabold px-1.5 py-0.2 rounded-xs mb-1">{plan.id}</span>
                              <p className="font-extrabold text-slate-805 text-slate-800 line-clamp-2 leading-snug">{plan.title}</p>
                              <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Dept: {plan.department}</p>
                              <div className="flex justify-between items-center mt-2 pt-1 border-t border-dashed border-slate-100 text-[9.5px]">
                                <span className="text-slate-455">Lead: {(plan.leadAuditor || '').substring(0, 15)}</span>
                                <span className={`font-mono font-bold uppercase text-[9px] ${
                                  plan.status === 'Completed' || plan.status === 'Completed' ? 'text-green-700' : 'text-blue-700'
                                }`}>{plan.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {activeTab === 'yearly' && (() => {
        // Active tab for calendar configuration
        const monthsMeta = quarterMonths[activeSchedulerQuarter];
        const selectedMonthMeta = monthsMeta[schedMonthIdx] || monthsMeta[0];

        const daysInMonth = new Date(selectedMonthMeta.year, selectedMonthMeta.idx + 1, 0).getDate();
        const startDayCode = new Date(selectedMonthMeta.year, selectedMonthMeta.idx, 1).getDay();

        const blanks = Array.from({ length: startDayCode }, (_, i) => null);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const cells = [...blanks, ...days];

        // Active scheduling plan
        const activeSchedulingPlan = plans.find(p => p.id === assignmentPlanId);

        return (
          <div className="space-y-6">
            
            {/* Active Schedule Selection Banner */}
            {assignmentPlanId && activeSchedulingPlan && (
              <div className="bg-yellow-50 border-2 border-yellow-400 p-4 rounded-sm shadow-xs flex items-center justify-between animate-pulse">
                <div className="flex gap-2.5 items-center">
                  <div className="bg-yellow-101 bg-yellow-100 p-2 rounded-full text-yellow-800">
                    <CalendarRange className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Interactive Schedule Builder Mode: Active on <span className="text-blue-900 font-mono font-extrabold">[{activeSchedulingPlan.id}]</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Subject: <strong className="text-slate-800">{activeSchedulingPlan.title}</strong> &bull; Selected Quarter: <strong className="text-blue-900 font-mono">{activeSchedulingPlan.quarter}</strong>
                    </p>
                    <p className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.5 border border-emerald-200 mt-1 inline-block">
                      Click days in the monthly calendar grid below to assign the Start and End date limits.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    id="sched-cancel-btn"
                    onClick={() => {
                      setAssignmentPlanId(null);
                      setSchedStartDate('');
                      setSchedEndDate('');
                    }}
                    className="bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-sm border border-slate-350 cursor-pointer"
                  >
                    Discard Mode
                  </button>
                  <button
                    id="sched-save-btn"
                    onClick={() => {
                      if (!schedStartDate || !schedEndDate) {
                        alert("Please configure both start and end boundaries!");
                        return;
                      }
                      onUpdatePlan(assignmentPlanId, {
                        startDate: schedStartDate,
                        endDate: schedEndDate,
                        status: 'In Progress'
                      });
                      alert(`Dates configured successfully: ${schedStartDate} to ${schedEndDate}`);
                      setAssignmentPlanId(null);
                      setSchedStartDate('');
                      setSchedEndDate('');
                    }}
                    className="bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-xs px-4 py-1.5 rounded-sm border border-blue-900 cursor-pointer"
                  >
                    Lock Schedule
                  </button>
                </div>
              </div>
            )}

            {/* Split Calendar grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Interactive Month Grid */}
              <div className="lg:col-span-2 bg-white border border-slate-300 rounded-sm shadow-sm flex flex-col justify-between">
                <div>
                  <div className="bg-slate-100 p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-905 text-blue-900" />
                      Visual Scheduling calendar matrix
                    </span>

                    {/* Quarter Switcher */}
                    <div className="flex items-center gap-2">
                      <select 
                        value={activeSchedulerQuarter}
                        onChange={(e) => {
                          const q = e.target.value as any;
                          setActiveSchedulerQuarter(q);
                          setSchedMonthIdx(0); // reset month state to first month in quarter
                        }}
                        className="oracle-field-value text-xs py-1"
                      >
                        <option value="Q1">Q1 (January - March)</option>
                        <option value="Q2">Q2 (April - June)</option>
                        <option value="Q3">Q3 (July - September)</option>
                        <option value="Q4">Q4 (October - December)</option>
                      </select>

                      <div className="flex bg-slate-205 bg-slate-205 bg-slate-200 p-1 border rounded-xs gap-1">
                        {monthsMeta.map((m, mIdx) => (
                          <button
                            key={m.name}
                            onClick={() => setSchedMonthIdx(mIdx)}
                            className={`px-2 py-0.5 text-[10px] font-black rounded-xs cursor-pointer ${
                              schedMonthIdx === mIdx ? 'bg-blue-900 text-white shadow-3xs' : 'text-slate-650 hover:bg-slate-100'
                            }`}
                          >
                            {m.name.substring(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Header Months Label */}
                  <div className="bg-slate-50 border-b p-3 text-center text-xs font-black uppercase text-slate-700 tracking-wider font-mono">
                    {selectedMonthMeta.name} {selectedMonthMeta.year} Grid View
                  </div>

                  {/* Days in row headings */}
                  <div className="grid grid-cols-7 border-b border-slate-200 text-center font-mono font-bold text-[10px] bg-slate-100 text-slate-500 uppercase tracking-widest py-1">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                  </div>

                  {/* Calendar cells */}
                  <div className="grid grid-cols-7 border-b border-slate-150- border-slate-150 bg-slate-50/50">
                    {cells.map((cellDay, idx) => {
                      if (cellDay === null) {
                        return <div key={`blank-${idx}`} className="bg-slate-50 border-r border-b border-slate-200 min-h-[90px]" />;
                      }

                      // Generate standard string date key format YYYY-MM-DD
                      const mm = (selectedMonthMeta.idx + 1).toString().padStart(2, '0');
                      const dd = cellDay.toString().padStart(2, '0');
                      const dayStrDateValue = `${selectedMonthMeta.year}-${mm}-${dd}`;

                      // Check what audits match this cell string date value
                      const activeAuditsOnDay = plans.filter(p => p.startDate && p.endDate && dayStrDateValue >= p.startDate && dayStrDateValue <= p.endDate);

                      // Check if matches manual schedule boundaries
                      const isStartBoundary = schedStartDate === dayStrDateValue;
                      const isEndBoundary = schedEndDate === dayStrDateValue;
                      const isInRange = schedStartDate && schedEndDate && dayStrDateValue >= schedStartDate && dayStrDateValue <= schedEndDate;

                      return (
                        <div 
                          key={`cell-${cellDay}`}
                          onClick={() => {
                            setSelectedCalendarDay(cellDay);
                            if (assignmentPlanId) {
                              if (!schedStartDate) {
                                setSchedStartDate(dayStrDateValue);
                              } else if (!schedEndDate) {
                                if (dayStrDateValue < schedStartDate) {
                                  setSchedStartDate(dayStrDateValue);
                                } else {
                                  setSchedEndDate(dayStrDateValue);
                                }
                              } else {
                                setSchedStartDate(dayStrDateValue);
                                setSchedEndDate('');
                              }
                            } else {
                              if (activeAuditsOnDay.length > 0) {
                                setInspectedPlanId(activeAuditsOnDay[0].id);
                              } else {
                                setInspectedPlanId(null);
                              }
                            }
                          }}
                          className={`border-r border-b border-slate-200 min-h-[92px] p-1.5 flex flex-col justify-between cursor-pointer transition-all ${
                            isStartBoundary ? 'bg-indigo-900 hover:bg-indigo-800 text-white border-2 border-indigo-900 shadow-sm' :
                            isEndBoundary ? 'bg-indigo-900 hover:bg-indigo-800 text-white border-2 border-indigo-900 shadow-sm' :
                            isInRange ? 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200' :
                            activeAuditsOnDay.length > 0 ? 'bg-blue-50/70 hover:bg-blue-100/70 border-blue-200' :
                            'bg-white hover:bg-slate-50'
                          }`}
                        >
                          <span className={`text-[11px] font-mono font-bold block ${
                            isStartBoundary || isEndBoundary ? 'text-white font-black bg-indigo-700 rounded-sm w-5 h-5 flex items-center justify-center' : 'text-slate-400'
                          }`}>
                            {cellDay}
                          </span>

                          <div className="space-y-1">
                            {activeAuditsOnDay.map(pa => (
                              <div key={pa.id} className="text-[9px] font-black uppercase font-mono px-1 py-0.5 rounded truncate leading-tight bg-blue-900 text-white border border-blue-900 shadow-3xs" title={pa.title}>
                                {pa.id} ({((pa.status) || '').toUpperCase().substring(0, 4)})
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Plans Backlog scheduling queue */}
              <div className="space-y-6">
                
                {/* Visual Inspected Day detail */}
                {(() => {
                  const inspectedPlan = plans.find(p => p.id === inspectedPlanId);
                  
                  return (
                    <div className="bg-white border border-slate-300 rounded-sm shadow-sm flex flex-col">
                      <div className="bg-slate-100 border-b border-slate-205 p-3 flex justify-between items-center text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">
                        <span>Day inspect panel</span>
                        <span className="bg-emerald-50 text-emerald-800 text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold">INSPECTOR</span>
                      </div>
                      
                      <div className="p-4 font-sans">
                        {!inspectedPlan ? (
                          <div className="text-center py-10 text-slate-400 flex flex-col items-center justify-center space-y-2">
                            <Info className="w-8 h-8 text-slate-350" />
                            <p className="text-xs font-bold text-slate-505">No day schedule inspection active.</p>
                            <p className="text-[10px] text-slate-400 max-w-[200px]">Click any calendar cell carrying scheduled plans to view detailed auditor assignment nodes here.</p>
                          </div>
                        ) : (
                          <div className="space-y-3.5 text-xs">
                            <div className="flex justify-between items-start border-b pb-2 border-dashed border-slate-200">
                              <span className="bg-blue-50 text-blue-900 border border-blue-200 font-mono text-[10.5px] font-black px-2.5 py-0.5 rounded-sm">{inspectedPlan.id}</span>
                              <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono border border-slate-200">{inspectedPlan.quarter}</span>
                            </div>

                            <div>
                              <h5 className="font-extrabold text-slate-900 text-sm leading-tight">{inspectedPlan.title}</h5>
                              <p className="text-[11px] text-slate-500 font-bold uppercase mt-1">Dept: {inspectedPlan.department}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-slate-650 bg-slate-50 p-2.5 border rounded-xs">
                              <div>
                                <span className="text-[9.5px] font-bold text-slate-400 block uppercase">Lead auditor</span>
                                <span className="font-bold text-slate-805 text-slate-800 font-sans">{inspectedPlan.leadAuditor || inspectedPlan.teamLead}</span>
                              </div>
                              <div>
                                <span className="text-[9.5px] font-bold text-slate-400 block uppercase">Audit Category</span>
                                <span className="font-bold text-blue-900 font-mono uppercase text-[10.5px]">{inspectedPlan.auditType}</span>
                              </div>
                            </div>

                            <div>
                              <span className="text-[9.5px] font-bold text-slate-400 block uppercase mb-0.5">Assigned Members</span>
                              <p className="text-slate-750 font-semibold p-2 bg-slate-50 border rounded-xs leading-relaxed">{inspectedPlan.teamMembers || 'No assisting members logged.'}</p>
                            </div>

                            <div>
                              <span className="text-[9.5px] font-bold text-slate-400 block uppercase mb-0.5">Audit Scope & Goal</span>
                              <p className="text-slate-750 font-semibold p-2 bg-slate-50 border rounded-xs leading-relaxed">{inspectedPlan.scope || 'No explicit scope defined.'}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-slate-650 bg-slate-50 p-2 border">
                              <div>
                                <span className="text-[9.5px] font-bold text-slate-400 block uppercase">Start date</span>
                                <span className="font-mono font-bold text-zinc-900 text-[10.5px]">{inspectedPlan.startDate}</span>
                              </div>
                              <div>
                                <span className="text-[9.5px] font-bold text-slate-400 block uppercase">End date</span>
                                <span className="font-mono font-bold text-zinc-900 text-[10.5px]">{inspectedPlan.endDate}</span>
                              </div>
                            </div>

                            <button
                              id="inspect-close-btn"
                              onClick={() => setInspectedPlanId(null)}
                              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-1 px-3 border border-slate-350 hover:border-slate-400 transition-all cursor-pointer rounded-xs shadow-3xs uppercase text-[11px]"
                            >
                              Exit inspection panel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Unscheduled Backlog Plans Queue */}
                <div className="bg-white border border-slate-300 rounded-sm shadow-sm flex flex-col">
                  <div className="bg-slate-100 border-b border-slate-205 p-3 flex justify-between items-center text-xs font-bold text-slate-805 text-slate-800 uppercase tracking-widest font-mono">
                    <span>Unscheduled Backlog Queue</span>
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full font-sans uppercase">
                      {plans.filter(p => !p.startDate || !p.endDate).length} Queued
                    </span>
                  </div>

                  <div className="p-3.5 space-y-2.5 max-h-[400px] overflow-y-auto">
                    {plans.filter(p => !p.startDate || !p.endDate).length === 0 ? (
                      <p className="text-xs text-center py-8 text-slate-400 italic">No unscheduled plans awaiting calendar timeline assignments.</p>
                    ) : (
                      plans.filter(p => !p.startDate || !p.endDate).map(p => (
                        <div 
                          key={p.id} 
                          className={`p-3 bg-slate-50 border hover:bg-slate-100 transition-all rounded-xs flex flex-col ${
                            assignmentPlanId === p.id ? 'border-2 border-yellow-505 border-yellow-500 bg-yellow-50/35' : 'border-slate-200'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="bg-blue-50 text-blue-900 border border-blue-200 font-mono text-[9px] font-black px-1.5 py-0.2 rounded-sm">{p.id}</span>
                            <span className="bg-slate-200/60 font-mono text-[8.5px] px-1.5 rounded-sm font-bold">{p.quarter}</span>
                          </div>

                          <h5 className="font-extrabold text-slate-900 leading-tight text-[11px] line-clamp-1">{p.title}</h5>
                          <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">Dept: {p.department} &bull; Risk: {p.riskLevel || 'Medium'}</span>

                          <button 
                            id={`schedule-dates-btn-${p.id}`}
                            onClick={() => {
                              setAssignmentPlanId(p.id);
                              setSchedStartDate('');
                              setSchedEndDate('');
                              setActiveSchedulerQuarter(p.quarter as any || 'Q2');
                              setSchedMonthIdx(0); // reset to first month of target quarter
                            }}
                            className="bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-[10px] uppercase py-1 px-3 mt-3 shadow-3xs cursor-pointer rounded-sm border border-blue-900 flex items-center justify-center gap-1 self-start shrink-0"
                          >
                            <CalendarRange className="w-3.5 h-3.5" />
                            Schedule dates
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>

          </div>
        );
      })()}

      {activeTab === 'tour' && (
        <div className="max-w-2xl mx-auto bg-white border border-slate-300 rounded-sm shadow-md overflow-hidden animate-fade-in text-slate-800">
          <div className="bg-gradient-to-r from-gov-blue-800 to-blue-900 border-b border-slate-200 p-5.5 text-white bg-slate-900">
            <h3 className="text-xs font-mono text-yellow-300 font-bold uppercase tracking-widest">FORM ID: VSP_TOUR_PROP_91</h3>
            <h2 className="text-base font-black">Audit Tour Proposal Entry (CAE Gateway)</h2>
            <p className="text-xs text-blue-100 mt-0.5">Initialize travel schedules, per diem allowance details and target department site visits.</p>
          </div>

          <form onSubmit={handleTourProposalSubmit} className="p-6 space-y-4 font-sans">
            <div>
              <label className="oracle-input-label block mb-1">Select Active Audit Plan Record Reference (Required)</label>
              <select
                id="tour-plan-select"
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="oracle-field-value w-full text-xs"
                required
              >
                <option value="">-- Choose Plan Ref No --</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.id}] - {(p.title || '').substring(0, 48)}... ({p.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="oracle-input-label block mb-1">Target Station/Venue (VSP Site / Branch)</label>
                <input
                  id="tour-destination-input"
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. VISAKHAPATNAM PLT / KHURDA MINE"
                  className="oracle-field-value w-full text-xs"
                  required
                />
              </div>
              <div>
                <label className="oracle-input-label block mb-1">Estimated Travel Period duration</label>
                <input
                  id="tour-duration-input"
                  type="text"
                  placeholder="e.g. 5 Working Days (Q2)"
                  className="oracle-field-value w-full text-xs"
                />
              </div>
            </div>

            <div>
              <label className="oracle-input-label block mb-1">Detailed Technical Purpose / Scope of Visit</label>
              <textarea
                id="tour-purpose-textarea"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Examine stores ledger volumes, conduct laser metrics assessment..."
                className="oracle-field-value w-full h-24 text-xs"
                required
              ></textarea>
            </div>

            <button
              id="tour-submit-btn"
              type="submit"
              disabled={isSubmittingTour}
              className="w-full btn-primary-gov py-2.5 gap-2 font-black uppercase text-xs cursor-pointer shadow-sm text-white bg-blue-900 border-blue-900"
            >
              {isSubmittingTour ? 'TRANSMITTING TOUR DATA TO CAE...' : 'GENERATE AND DIGITALLY SUBMIT TOUR PROPOSAL'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
