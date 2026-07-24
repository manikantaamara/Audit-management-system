import React, { useState } from 'react';
import { 
  Users, BarChart2, ShieldAlert, BookOpen, Grid, Award, FileText, Reply, Send, 
  Check, Play, ArrowRight, ShieldCheck, Plus, AlertCircle, FileSpreadsheet, Lock,
  ChevronDown, HelpCircle, HardDrive, Download, Database, RotateCw, FileCheck, CheckSquare, X
} from 'lucide-react';
import { User, AuditPara, AuditReport, AuditPlan, UserRole, getRoleDisplayName } from '../types';
import AuditReportEntryForm from './AuditReportEntryForm';

interface FormsContainerProps {
  reports: AuditReport[];
  paras: AuditPara[];
  plans: AuditPlan[];
  currentUser: User;
  activeMenu: string;
  onSelectMenu: (menu: string) => void;
  onUpdatePara: (id: string, updates: Partial<AuditPara>) => Promise<void>;
  onUpdateReport: (id: string, updates: Partial<AuditReport>) => Promise<void>;
  onUpdatePlan: (id: string, updates: Partial<AuditPlan>) => Promise<void>;
  onCreatePara: (para: Partial<AuditPara>) => Promise<void>;
  onCreateReport: (report: Partial<AuditReport>) => Promise<void>;
}

interface Workload {
  name: string;
  count: number;
  rating: string;
  dept: string;
  activeAudits: string[];
}

export default function EnterpriseAIMSFormsContainer({
  reports,
  paras,
  plans,
  currentUser,
  activeMenu,
  onSelectMenu,
  onUpdatePara,
  onUpdateReport,
  onUpdatePlan,
  onCreatePara,
  onCreateReport
}: FormsContainerProps) {
  
  // Local active states for simulation databases
  const [localAssignments, setLocalAssignments] = useState([
    { id: '1', planId: 'PLN-2026-602', planTitle: 'Performance Audit of Blast Furnace fuel distribution logs', auditor: 'Smt. P. Lakshmi', assignedDate: '2026-06-02', priority: 'High', status: 'Assigned' },
    { id: '2', planId: 'PLN-2026-601', planTitle: 'Audit on Risk Purchase Executions & Procurement Delays', auditor: 'Shri K. Somasekhar', assignedDate: '2026-05-30', priority: 'Critical', status: 'In Progress' }
  ]);

  const [workloads, setWorkloads] = useState<Workload[]>([
    { name: 'Smt. P. Lakshmi', count: 3, rating: 'Outstanding', dept: 'Audit Division', activeAudits: ['PLN-2026-601', 'PLN-2026-603', 'REP-2026-702'] },
    { name: 'Shri J.C. Bose', count: 1, rating: 'Senior Expert', dept: 'Audit Division', activeAudits: ['PLN-2026-602'] },
    { name: 'Shri K. Somasekhar', count: 2, rating: 'Very Good', dept: 'MM Advisory', activeAudits: ['PLN-2026-601'] }
  ]);

  const [correctionsList, setCorrectionsList] = useState([
    { id: 'PR-802', reportNo: 'RINL/AUD/M13/2026/04', paraNo: 'Para-1.2', title: 'Observation on Non-blocking of Vendors', requestedBy: 'Shri J.C. Bose (CAE)', remarks: 'Please verify the exact vendor ERP serial key and trace physical approval signatures.', status: 'Pending Auditor Rework', auditorText: '' }
  ]);

  const [evidenceRecords, setEvidenceRecords] = useState([
    { id: 'EV-101', title: 'Slag chemical weight bridges receipts scan', type: 'Image JPG', dateStr: '2026-06-03', verified: false, paraNo: 'Para-1.1' },
    { id: 'EV-102', title: 'Oracle ERP lockout ledger logs exported', type: 'CSV Document', dateStr: '2026-06-02', verified: true, paraNo: 'Para-1.2' }
  ]);

  // Form states
  const [assignPlanId, setAssignPlanId] = useState('PLN-2026-602');
  const [assignAuditor, setAssignAuditor] = useState('Smt. P. Lakshmi');
  const [assignPriority, setAssignPriority] = useState('High');
  const [assignSuccess, setAssignSuccess] = useState(false);

  // Correction Formulation states
  const [correctionTargetPara, setCorrectionTargetPara] = useState('PR-801');
  const [correctionRemarksText, setCorrectionRemarksText] = useState('');
  const [correctionSuccess, setCorrectionSuccess] = useState(false);

  // Report creation / audit observation entry states
  const [newObservationParaNo, setNewObservationParaNo] = useState('Para-1.5');
  const [newObservationTitle, setNewObservationTitle] = useState('');
  const [newObservationCategory, setNewObservationCategory] = useState<'Critical' | 'Major' | 'Minor'>('Major');
  const [newObservationDesc, setNewObservationDesc] = useState('');
  const [newObservationFinVal, setNewObservationFinVal] = useState('1250000');
  const [observationSuccessStr, setObservationSuccessStr] = useState('');

  // Smt. P. Lakshmi Auditor reply / correction inputs
  const [auditorReworkTexts, setAuditorReworkTexts] = useState<Record<string, string>>({});
  const [reworkSuccessStr, setReworkSuccessStr] = useState('');

  // Review state
  const [reviewFormParaNo, setReviewFormParaNo] = useState('PR-801');
  const [reviewFormComment, setReviewFormComment] = useState('');
  const [reviewFormRecommendation, setReviewFormRecommendation] = useState('Satisfied - Recommend Settling observation');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // File upload simulation
  const [uploadedEvidenceFiles, setUploadedEvidenceFiles] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // Permission Matrix Setup Configuration JSON
  const pfMatrix = [
    { role: 'HOD', view: true, create: true, edit: true, assign: true, review: true, verify: true, approve: true, close: true, description: 'Full access to the system. Can View, Create, Edit, Assign, Review, Verify, Approve, and Close audits. Directly assigns audits to Team Leads or Auditors with final approval and closure authority.' },
    { role: 'Team Lead', view: true, create: true, edit: true, assign: true, review: true, verify: true, approve: false, close: false, description: 'Can View, Create, Edit, Assign, Review, and Verify audits. Cannot Approve or Close audits. Responsible for managing audit activities and coordinating with auditors.' },
    { role: 'Reviewer', view: true, create: true, edit: true, assign: true, review: false, verify: false, approve: false, close: true, description: 'Can View, Create, Edit, and Assign audits. Cannot Review, Verify, Approve, or Close audits. Responsible for department-level audit management and task allocation.' },
    { role: 'Auditor', view: true, create: false, edit: false, assign: false, review: true, verify: false, approve: false, close: false, description: 'Can only View assigned audits and participate in Review activities. Cannot Create, Edit, Assign, Verify, Approve, or Close audits. Responsible for performing audit work and submitting findings.' }
  ];

  // Helper functions
  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const planObj = plans.find(p => p.id === assignPlanId) || { title: 'External Statutory Audit' };
    const newAssign = {
      id: String(localAssignments.length + 1),
      planId: assignPlanId,
      planTitle: planObj.title,
      auditor: assignAuditor,
      assignedDate: new Date().toISOString().substring(0, 10),
      priority: assignPriority,
      status: 'Assigned'
    };
    setLocalAssignments([newAssign, ...localAssignments]);
    setAssignSuccess(true);
    setTimeout(() => setAssignSuccess(false), 3050);
  };

  const handlePostCorrectionRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const paraObj = paras.find(p => p.id === correctionTargetPara) || { title: 'Unknown Finding Exception', paraNo: 'Para-1.0' };
    const newCorrection = {
      id: correctionTargetPara,
      reportNo: 'RINL/AUD/M13/2026/04',
      paraNo: paraObj.paraNo,
      title: paraObj.title,
      requestedBy: currentUser.name + ' (' + currentUser.role + ')',
      remarks: correctionRemarksText || 'Please double-check financial tally computations.',
      status: 'Pending Auditor Rework',
      auditorText: ''
    };
    
    setCorrectionsList([newCorrection, ...correctionsList]);
    setCorrectionSuccess(true);
    
    // Also demote Para status to Under Review or outstanding to match business cycle
    if (onUpdatePara) {
      onUpdatePara(correctionTargetPara, { status: 'Under Review', replyContent: `Correction requested: ${correctionRemarksText}` });
    }

    setCorrectionRemarksText('');
    setTimeout(() => setCorrectionSuccess(false), 3050);
  };

  const handleRegisterObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObservationTitle || !newObservationDesc) {
      alert('Error: Please fill in the Title and Description buffers.');
      return;
    }

    const payload = {
      reportId: 'REP-2026-702', // Coke charging efficiency report
      paraNo: newObservationParaNo,
      title: newObservationTitle,
      category: newObservationCategory,
      description: newObservationDesc,
      financialImplication: Number(newObservationFinVal) || 0,
      status: 'Outstanding' as const
    };

    if (onCreatePara) {
      await onCreatePara(payload);
      setObservationSuccessStr(`SUCCESS: Form node Observation registered securely in database! Para ${newObservationParaNo} assigned serial value.`);
      setNewObservationTitle('');
      setNewObservationDesc('');
      setTimeout(() => setObservationSuccessStr(''), 4050);
    }
  };

  const handleAuditorReworkSubmit = (paraId: string) => {
    const text = auditorReworkTexts[paraId];
    if (!text) {
      alert('Type a response buffer first.');
      return;
    }

    setCorrectionsList(prev => prev.map(c => {
      if (c.id === paraId) {
        return { ...c, status: 'Rework Submitted for Review', auditorText: text };
      }
      return c;
    }));

    if (onUpdatePara) {
      onUpdatePara(paraId, { replyContent: `Auditor Correction response: ${text}` });
    }

    setReworkSuccessStr(`SUCCESS: Rework response committed for parameter ID: ${paraId}. Status changed to "Review Verification Pending".`);
    setTimeout(() => setReworkSuccessStr(''), 4050);
  };

  const handleSubmitReviewForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdatePara) {
      onUpdatePara(reviewFormParaNo, { 
        status: reviewFormRecommendation.includes('Settling') ? 'Settled' : 'Under Review',
        replyContent: `Reviewer Comment: ${reviewFormComment} [Rec: ${reviewFormRecommendation}]`
      });
    }

    setReviewSuccess(true);
    setReviewFormComment('');
    setTimeout(() => setReviewSuccess(false), 3100);
  };

  const handleToggleEvidenceVerify = (id: string) => {
    setEvidenceRecords(prev => prev.map(e => {
      if (e.id === id) {
        return { ...e, verified: !e.verified };
      }
      return e;
    }));
  };

  const handleVerifyReportTL = (reportId: string) => {
    if (onUpdateReport) {
      onUpdateReport(reportId, { status: 'Authorized' });
      alert(`SUCCESS: Report ${reportId} officially status-verified by Team Lead and dispatched to GM HOD for final corporate authorization!`);
    }
  };

  // Drag and drop events
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
      const names = Array.from(e.dataTransfer.files).map((f: any) => f.name);
      setUploadedEvidenceFiles([...uploadedEvidenceFiles, ...names]);
    }
  };

  const selectFilesDummy = () => {
    const sampleNames = [
      'aud_voucher_v18_slag_claims.pdf',
      'mill_dispatch_records_receipt_scan.png',
      'furnace_carbon_recovery_logs_extract.xlsx'
    ];
    const pick = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    setUploadedEvidenceFiles([...uploadedEvidenceFiles, pick]);
  };

  return (
    <div className="p-6 font-sans space-y-6">

      {/* TOP DECK ROLE OVERVIEW BAR */}
      <div className="bg-[#1e293b] border border-slate-700 p-4 rounded-sm text-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-500 text-slate-900 p-2.5 rounded font-black font-mono shadow-sm animate-pulse">
            {currentUser.role.replace(' ', '_').toUpperCase()}
          </div>
          <div>
            <h3 className="text-[14px] font-black uppercase text-white tracking-wide">Enterprise Role-Based Information Gateway</h3>
            <span className="text-[11px] font-mono text-slate-400">Current Node: VISAKHAPATNAM STEEL PLANT — INTERNAL AUDIT INFORMATION SYSTEM</span>
          </div>
        </div>
        <div className="text-right text-[11px] font-mono bg-slate-950 p-2 border border-slate-800 rounded">
          <span className="text-emerald-400 font-bold block">● GATEWAY SECURED ACTIVE</span>
          <span className="text-slate-500 font-bold mt-0.5 block">STATION SERIAL: VSP-AIMS-77-ACTIVE</span>
        </div>
      </div>

      {/* RENDER THE RELEVANT PANEL VIEWS */}

      {/* 1. MASTER SUMMARY VIEW: PERMISSIONS MATRIX & INTERACTIVE DASHBOARD AND ANALYTICS */}
      {activeMenu === 'role_matrix_dashboard' && (
        <div className="space-y-6 animate-fade-in text-slate-800">
          
          {/* Permission Matrix Grid Card */}
          <div className="bg-white border-2 border-slate-350 rounded-sm shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-950 text-white p-3.5 flex justify-between items-center border-b border-blue-900">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-yellow-400" />
                <h3 className="text-xs font-black uppercase tracking-wider font-mono">FORM: SECURE_ROLES_PERMISSION_MATRIX_RINL</h3>
              </div>
              <span className="bg-[#0b2f59] border border-blue-600 text-yellow-300 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                System Rules Base (CVC Directive)
              </span>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                The role matrix below outlines the granular permission scopes loaded inside the <strong>Visakhapatnam Steel Plant's Digital Audit Environment</strong>. Roles determine standard node access, document operations, workflow submission routes, and critical ledger validations (excl: Annual Plan generation and Database Master Maintenance).
              </p>

              {/* Matrix Table */}
              <div className="overflow-x-auto border border-[#cbd5e1] rounded">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="bg-[#f1f5f9] border-b border-[#cbd5e1] text-slate-700 font-bold uppercase text-[9.5px] font-mono text-center">
                      <th className="p-2.5 text-left font-bold text-blue-900 w-[150px]">ROLE SPEC</th>
                      <th className="p-2 border-l border-r border-[#cbd5e1]">View</th>
                      <th className="p-2 border-r border-[#cbd5e1]">Create</th>
                      <th className="p-2 border-r border-[#cbd5e1]">Edit</th>
                      <th className="p-2 border-r border-[#cbd5e1]">Assign</th>
                      <th className="p-2 border-r border-[#cbd5e1]">Review</th>
                      <th className="p-2 border-r border-[#cbd5e1]">Verify</th>
                      <th className="p-2 border-r border-[#cbd5e1]">Approve</th>
                      <th className="p-2 border-r border-[#cbd5e1]">Close</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pfMatrix.map((row) => {
                      const isActiveRole = row.role === currentUser.role;
                      return (
                        <tr key={row.role} className={`border-b border-[#cbd5e1] hover:bg-[#f8fafc] text-center ${isActiveRole ? 'bg-amber-50/75 font-semibold' : ''}`} id={`matrix-row-${row.role.replace(' ', '')}`}>
                          <td className="p-2.5 text-left font-bold border-r border-[#cbd5e1] flex items-center gap-1.5 text-slate-900">
                            <span className={`w-2 h-2 rounded-full ${isActiveRole ? 'bg-amber-500 animate-ping' : 'bg-slate-300'}`} />
                            {getRoleDisplayName(row.role)} {isActiveRole ? <span className="text-[8px] bg-amber-200 text-amber-900 p-0.5 rounded px-1 lowercase">active</span> : ''}
                          </td>
                          <td className="p-2 border-r border-[#cbd5e1]"><CheckState checked={row.view} /></td>
                          <td className="p-2 border-r border-[#cbd5e1]"><CheckState checked={row.create} /></td>
                          <td className="p-2 border-r border-[#cbd5e1]"><CheckState checked={row.edit} /></td>
                          <td className="p-2 border-r border-[#cbd5e1]"><CheckState checked={row.assign} /></td>
                          <td className="p-2 border-r border-[#cbd5e1]"><CheckState checked={row.review} /></td>
                          <td className="p-2 border-r border-[#cbd5e1]"><CheckState checked={row.verify} /></td>
                          <td className="p-2 border-r border-[#cbd5e1]"><CheckState checked={row.approve} /></td>
                          <td className="p-2"><CheckState checked={row.close} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Role Explanatory Callouts */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-3">
                {pfMatrix.map((r) => (
                  <div key={r.role} className="border border-slate-200 p-3 rounded bg-slate-50 relative overflow-hidden flex flex-col justify-between">
                    <p className="text-xs font-black text-slate-800 uppercase block font-mono border-b pb-1.5 mb-1.5">{getRoleDisplayName(r.role)} SCOPE</p>
                    <p className="text-[11px] text-slate-500 leading-snug">{r.description}</p>
                    <div className="mt-3.5 flex justify-between text-[9px] font-mono font-bold text-slate-400">
                      <span>SCOPE LEVEL: SECURE</span>
                      <span>REF_AIMS_{r.role.toUpperCase().replace(' ', '_')}</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      )}

      {/* TEAM LEAD ROUTING CASES */}

      {/* Audit Assignment Terminal */}
      {activeMenu === 'tl_audit_assignment' && (
        <div className="bg-white border-2 border-slate-350 rounded-sm shadow-md overflow-hidden animate-fade-in text-slate-800">
          <div className="bg-[#104a7c] text-white p-3 border-b border-slate-950 flex justify-between items-center font-mono">
            <span className="text-xs font-bold font-black">FORM: AUD_ASSIGN_M90 (TEAM_LEAD)</span>
            <span className="text-[9px] bg-blue-950 text-slate-300 p-1 font-bold">Oracle Forms Runtime v12.2</span>
          </div>

          <div className="p-6">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2 mb-4">Allocate Field Auditor Schedules to Active Plans</h3>
            
            <form onSubmit={handleCreateAssignment} className="space-y-4 max-w-xl">
              {assignSuccess && (
                <div className="bg-green-50 border-l-4 border-green-600 p-3 text-xs text-green-800 font-semibold rounded">
                  TRANSACTION COMMITTED: Auditor successfully mapped to Audit Plan node. Relational logs updated.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Select Audit Plan Code:</label>
                  <select 
                    value={assignPlanId} 
                    onChange={e => setAssignPlanId(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-300 p-2 font-medium focus:ring-1 focus:ring-blue-600"
                  >
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.id} &bull; {p.title.substring(0,40)}...</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Select Lead Auditor:</label>
                  <select 
                    value={assignAuditor} 
                    onChange={e => setAssignAuditor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2 font-medium focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="Smt. P. Lakshmi">Smt. P. Lakshmi (Senior Manager)</option>
                    <option value="Shri K. Somasekhar">Shri K. Somasekhar (DGM MM)</option>
                    <option value="Shri J.C. Bose">Shri J.C. Bose (CAE)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Assignment Priority:</label>
                  <select 
                    value={assignPriority} 
                    onChange={e => setAssignPriority(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2 font-mono font-bold text-blue-900 focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="Critical">🚨 CRITICAL IMPACT (CVC RED FLAG)</option>
                    <option value="High">⚠️ High Priority Evaluation</option>
                    <option value="Medium">Medium Standard Cycle</option>
                    <option value="Low">Low Regular Review</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Target Completion Date:</label>
                  <input 
                    type="date" 
                    defaultValue="2026-06-30" 
                    className="w-full bg-slate-50 border border-slate-300 p-2 focus:ring-1 focus:ring-blue-600" 
                  />
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="bg-[#104a7c] hover:bg-indigo-900 text-white font-bold p-2.5 px-6 rounded-xs text-xs font-mono tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm">
                  <Database className="w-4 h-4 text-yellow-400" />
                  COMMIT ASSIGNMENT BUFFER (F10)
                </button>
              </div>
            </form>

            {/* Assignments Table */}
            <div className="mt-8">
              <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-3">Live Plan Mapping Database Registry</h4>
              <div className="overflow-x-auto border border-slate-250 rounded">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#e4ecf4] text-[#12365e] font-mono font-bold border-b text-[10px]">
                      <th className="p-2.5">PLAN ID</th>
                      <th className="p-2.5">SCOPE / DESCRIPTION NAME</th>
                      <th className="p-2.5">ASSIGNED AUDITOR</th>
                      <th className="p-2.5">DATE SIGNED</th>
                      <th className="p-2.5">PRIORITY</th>
                      <th className="p-2.5 text-right">STATUS CODE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {localAssignments.map(la => (
                      <tr key={la.id} className="hover:bg-slate-50 font-sans" id={`local-assignment-row-${la.id}`}>
                        <td className="p-2.5 font-mono font-bold text-[#104a7c]">{la.planId}</td>
                        <td className="p-2.5 font-bold text-slate-800">{la.planTitle}</td>
                        <td className="p-2.5 text-blue-950 font-semibold">{la.auditor}</td>
                        <td className="p-2.5 font-mono text-slate-500">{la.assignedDate}</td>
                        <td className="p-2.5 font-bold text-orange-700">{la.priority}</td>
                        <td className="p-2.5 text-right"><span className="bg-indigo-50 border border-indigo-200 text-indigo-800 font-mono text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">{la.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Team Workload Management */}
      {activeMenu === 'tl_team_workload' && (
        <div className="bg-white border border-slate-300 rounded shadow animate-fade-in text-slate-800">
          <div className="bg-slate-100 p-4 border-b flex justify-between items-center">
            <h3 className="text-xs font-black uppercase text-[#104a7c]">Workload Distribution &amp; Allocation Monitor</h3>
            <span className="text-[10px] font-mono bg-indigo-50 text-[#104a7c] p-1 border font-bold">Total Auditor Load Nodes: {workloads.length}</span>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {workloads.map((wl, index) => (
                <div key={wl.name} className="border border-slate-205 p-4 rounded bg-slate-50 relative flex flex-col justify-between" id={`workload-card-${index}`}>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-900 border-b pb-1.5 mb-1.5 uppercase flex items-center justify-between">
                      {wl.name}
                      <span className="text-[9.5px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{wl.rating}</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 font-semibold">Division: {wl.dept}</p>
                    
                    <div className="flex justify-between text-xs pt-1">
                      <span className="text-slate-500">Active Allocated Files:</span>
                      <span className="font-bold text-indigo-900">{wl.count} Audits</span>
                    </div>

                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-blue-900" style={{ width: `${(wl.count / 5) * 100}%` }} />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-dashed">
                    <span className="text-[8px] font-mono text-slate-400 block mb-1">MAPPED RECORD CODES:</span>
                    <div className="flex gap-1">
                      {wl.activeAudits.map(code => (
                        <span key={code} className="bg-slate-200 text-slate-700 text-[9px] font-mono p-0.5 rounded px-1.5 font-bold">{code}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 text-xs rounded text-yellow-800 flex gap-2">
              <Plus className="w-4 h-4 text-yellow-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Critical Workload Balancing Action:</span>
                Team Lead delegates can request real-time cross-functional re-allocation to optimize the 90-day CVC circular completion timeline. Click below to refresh database workloads.
                <button onClick={() => alert('Workload balanced successfully!')} className="mt-2 block bg-yellow-600 hover:bg-yellow-700 text-white font-mono text-[9px] uppercase font-bold p-1 px-2.5 rounded-sm">
                  Run Load Balancing Algorithm (RINL)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Performance Reports */}
      {activeMenu === 'tl_team_perf' && (
        <div className="bg-white border border-slate-300 p-5 rounded animate-fade-in text-slate-800">
          <h3 className="text-xs font-black uppercase text-[#104a7c] border-b pb-2 mb-4">Milestone Target Tracking &amp; Auditor Performance</h3>
          <p className="text-xs text-slate-500 mb-4 font-sans">The performance scorecard measures overall audit report cycle speeds, draft observations logged, and query clearance ratings.</p>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border border-slate-200 p-4 rounded bg-slate-50 flex flex-col justify-between" id="perf-card-1">
                <div>
                  <span className="text-[9px] text-slate-455 text-slate-400 font-mono font-bold block mb-1">TIMELINES</span>
                  <h4 className="text-xs font-bold text-slate-805 text-slate-800 uppercase">Average Report Turnaround</h4>
                  <p className="text-lg font-mono font-bold text-indigo-900 mt-2">12.4 Days</p>
                </div>
                <div className="text-[10px] text-emerald-600 font-bold mt-2">&uarr; 3.2 days improved vs Q1</div>
              </div>

              <div className="border border-slate-200 p-4 rounded bg-slate-50 flex flex-col justify-between" id="perf-card-2">
                <div>
                  <span className="text-[9px] text-slate-400 font-mono font-bold block mb-1">SETTLEMENTS</span>
                  <h4 className="text-xs font-bold text-slate-800 uppercase">Para Closure Rate</h4>
                  <p className="text-lg font-mono font-bold text-emerald-700 mt-2">84.2% Passed</p>
                </div>
                <div className="text-[10px] text-emerald-600 font-bold mt-2">&uarr; 5% above steel sector average</div>
              </div>

              <div className="border border-slate-200 p-4 rounded bg-slate-50 flex flex-col justify-between" id="perf-card-3">
                <div>
                  <span className="text-[9px] text-slate-400 font-mono font-bold block mb-1">LIQUIDATION VALUES</span>
                  <h4 className="text-xs font-bold text-slate-805 text-slate-800 uppercase">Active Recoveries Liquidated</h4>
                  <p className="text-lg font-mono font-bold text-[#104a7c] mt-2">₹61.3 Lakhs</p>
                </div>
                <div className="text-[10px] text-indigo-600 font-bold mt-2">10 Audit exception observations</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Monitoring Console */}
      {activeMenu === 'tl_audit_monitoring' && (
        <div className="bg-white border border-slate-300 rounded shadow animate-fade-in text-slate-800">
          <div className="bg-slate-100 p-4 border-b flex justify-between items-center">
            <h3 className="text-xs font-black uppercase text-[#104a7c]">Audit Progress Monitoring Control board</h3>
            <span className="text-[10px] font-mono text-slate-500 font-bold animate-pulse">LIVE UPDATE ROUTINES LOADED</span>
          </div>

          <div className="p-5">
            <div className="space-y-4">
              {plans.map(p => (
                <div key={p.id} className="border border-slate-200 p-3.5 rounded bg-slate-50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4" id={`monitoring-row-${p.id}`}>
                  <div className="space-y-1">
                    <span className="bg-blue-105 bg-blue-100 text-blue-805 text-[#104a7c] font-mono text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">{p.id}</span>
                    <p className="text-xs font-bold text-slate-800 block mt-0.5">{p.title}</p>
                    <div className="flex gap-3 text-[10px] text-slate-500 font-mono pt-1">
                      <span>TL: {p.teamLead}</span>
                      <span>&bull;</span>
                      <span>Target: {p.endDate || 'No Target Date'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
                    <div className="space-y-1 text-right">
                      <span className="block text-[8px] font-mono font-bold text-slate-400">ACTIVE STAGE</span>
                      <span className="bg-emerald-50 border border-emerald-250 text-emerald-850 text-emerald-800 font-bold font-mono text-[9px] uppercase px-2 py-0.5 rounded tracking-wide">
                        {p.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Audit Status Tracking */}
      {activeMenu === 'tl_status_tracking' && (
        <div className="bg-white border border-slate-350 p-5 rounded animate-fade-in text-slate-800">
          <h3 className="text-xs font-black uppercase text-[#104a7c] border-b pb-2 mb-3">Audit Reports status history tracker</h3>
          <p className="text-xs leading-relaxed text-slate-500 mb-4">Search and monitor active progress cycles of all draft, reviewed, and finalized compliance reports logged inside the central relational database.</p>
          
          <div className="overflow-x-auto border rounded">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-[#f1f5f9] border-b text-slate-600 font-bold uppercase text-[9.5px]">
                  <th className="p-2.5 font-mono">REPORT NO</th>
                  <th className="p-2.5">FACILITY DEPARTMENT NAME</th>
                  <th className="p-2.5">CREATED BY</th>
                  <th className="p-2.5">DATE INGESTED</th>
                  <th className="p-2.5 font-mono text-center">PARAS COUNT</th>
                  <th className="p-2.5 text-right">REG CODE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {reports.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50" id={`status-tracking-row-${r.id}`}>
                    <td className="p-2.5 font-mono font-bold text-blue-900">{r.reportNo}</td>
                    <td className="p-2.5 font-bold text-slate-800">{r.department}</td>
                    <td className="p-2.5 font-medium">{r.leadAuditor}</td>
                    <td className="p-2.5 font-mono text-slate-500">{r.dateCreated}</td>
                    <td className="p-2.5 text-center font-bold text-orange-700 font-mono">{r.parasCount}</td>
                    <td className="p-2.5 text-right"><span className="bg-yellow-50 text-yellow-800 border border-yellow-250 font-mono text-[9px] font-bold px-2 py-0.5 rounded block uppercase text-center">{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending Audits */}
      {activeMenu === 'tl_pending_audits' && (
        <div className="bg-white border border-slate-300 p-5 rounded animate-fade-in text-slate-800 space-y-4">
          <h3 className="text-xs font-black uppercase text-[#104a7c] border-b pb-2">Pending Audits allocation ledger</h3>
          <p className="text-xs text-slate-500 font-sans">These scheduled programs require Field/Lead Auditor map assignments within the current GVC circular window.</p>
          
          <div className="space-y-3">
            {plans.filter(p => p.status === 'Approved' || p.status === 'Planned').map(p => (
              <div key={p.id} className="border border-red-150 bg-red-50/20 p-3.5 rounded flex justify-between items-center" id={`pending-audit-row-${p.id}`}>
                <div>
                  <span className="text-[10px] bg-red-100 text-red-800 font-mono font-semibold p-0.5 px-2 rounded">AWAITING ALLOCATION</span>
                  <h4 className="text-xs font-bold text-slate-800 mt-1.5">{p.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Planning Date Code: {p.startDate || '2026-Q2'}</p>
                </div>
                <button onClick={() => { setAssignPlanId(p.id); onSelectMenu('tl_audit_assignment'); }} className="bg-[#104a7c] hover:bg-indigo-900 text-white font-mono text-[10px] uppercase font-bold px-3 py-1.5 rounded-sm">
                  Assign Auditor Now &rarr;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verification of Reviewed Reports */}
      {activeMenu === 'tl_verify_reports' && (
        <div className="bg-white border border-slate-300 p-5 rounded animate-fade-in text-slate-800 space-y-4">
          <h3 className="text-xs font-black uppercase text-[#104a7c] border-b pb-2">Verification &amp; Clearance of reviewed reports</h3>
          <p className="text-xs text-slate-500">The Team Lead performs formal verification of audit reports that have completed standard Advisory Review cycles. Verified reports progress to HOD for secure global authorization.</p>

          <div className="space-y-4">
            {reports.filter(r => r.status === 'Draft' || r.status === 'Under_Review').map(r => (
              <div key={r.id} className="border border-slate-205 p-4 rounded bg-slate-50 flex justify-between items-start" id={`verify-reports-tl-row-${r.id}`}>
                <div className="space-y-1">
                  <span className="bg-yellow-50 text-yellow-800 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border border-yellow-250 uppercase">STA: REVIEWED BY CAE</span>
                  <h4 className="text-xs font-bold text-slate-800 mt-1.5">{r.title}</h4>
                  <p className="text-[10px] text-slate-450 text-slate-405 font-mono">Report RefNo: {r.reportNo} &bull; Findings: {r.parasCount} observations</p>
                </div>
                
                <div className="flex gap-2">
                  <button onClick={() => handleVerifyReportTL(r.id)} className="bg-green-700 hover:bg-green-800 text-white font-mono text-[10px] font-bold p-1.5 px-3.5 rounded-sm uppercase cursor-pointer flex items-center gap-1">
                    <CheckSquare className="w-3.5 h-3.5" />
                    Verify and Authorize Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Reviews Tracker */}
      {activeMenu === 'tl_pending_reviews' && (
        <div className="bg-white border border-slate-300 p-4 rounded animate-fade-in text-slate-800 space-y-3">
          <h3 className="text-xs font-black uppercase text-[#104a7c] border-b pb-2">Pending Advisory Review Track List</h3>
          <p className="text-xs text-slate-500 font-sans">The following audit exception observations compiled by field auditors are locked with the advisory board reviewers.</p>
          
          <div className="space-y-2">
            {paras.filter(p => p.status === 'Under Review' || p.status === 'Outstanding').map(p => (
              <div key={p.id} className="border border-dashed p-3 rounded bg-slate-50/50 flex justify-between items-center" id={`pending-review-tl-row-${p.id}`}>
                <div>
                  <span className="text-[9.5px] font-bold font-mono text-orange-700">{p.paraNo} &bull; {p.category}</span>
                  <h4 className="text-xs font-medium text-slate-800 block">{p.title}</h4>
                </div>
                <span className="text-[9.5px] font-mono text-slate-400">Lock ID: CAE_BOB_992</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dispatch Tracking / Knowledge Bank TL Fallback */}
      {(activeMenu === 'tl_dispatch_tracking' || activeMenu === 'tl_knowledge_bank' || activeMenu === 'tl_reports_analytics') && (
        <div className="bg-white border border-slate-300 p-5 rounded animate-fade-in text-slate-800">
          <h3 className="text-xs font-black uppercase text-[#104a7c] border-b pb-2 mb-3">Enterprise Lead terminal module</h3>
          
          <div className="p-8 text-center bg-slate-50 border rounded space-y-3">
            <Database className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-xs font-bold text-slate-800 uppercase font-mono">RINL Central SQL Database Pipeline Connected</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">This Team Lead component utilizes live standard relational database queries dynamically synced with your Master maintenance system files.</p>
            <span className="inline-block bg-[#104a7c] text-white font-mono text-[9px] p-1 px-3.5 uppercase font-bold">STATUS: OK_SYNC_256</span>
          </div>
        </div>
      )}


      {/* REVIEWER ROUTING CASES */}

      {/* Review Dashboard */}
      {activeMenu === 'rev_dashboard' && (
        <div className="space-y-6 animate-fade-in text-slate-800">
          {/* Metrics Summary Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border border-slate-205 p-4 rounded bg-white shadow-xs" id="rev-metric-1">
              <span className="block text-[9.5px] font-mono text-slate-400 font-black">PENDING ASSIGNMENTS</span>
              <p className="text-xl font-mono font-bold text-orange-700 mt-1">2 Reports</p>
              <span className="text-[9.5px] text-slate-500 font-semibold block mt-1">Awaiting Advisory Opinion</span>
            </div>

            <div className="border border-slate-205 p-4 rounded bg-white shadow-xs" id="rev-metric-2">
              <span className="block text-[9.5px] font-mono text-slate-400 font-black">COMPLIANCE ADVISORIES</span>
              <p className="text-xl font-mono font-bold text-emerald-700 mt-1">11 Paras</p>
              <span className="text-[9.5px] text-slate-500 font-semibold block mt-1">Officially Settled / Resolved</span>
            </div>

            <div className="border border-slate-205 p-4 rounded bg-white shadow-xs" id="rev-metric-3">
              <span className="block text-[9.5px] font-mono text-slate-400 font-black">CORRECTIONS ROUTED</span>
              <p className="text-xl font-mono font-bold text-red-700 mt-1">1 Pending</p>
              <span className="text-[9.5px] text-slate-500 font-semibold block mt-1">Auditor Field Action required</span>
            </div>

            <div className="border border-slate-205 p-4 rounded bg-white shadow-xs" id="rev-metric-4">
              <span className="block text-[9.5px] font-mono text-slate-400 font-black">CLEARED DISPATCH MONTHLY</span>
              <p className="text-xl font-mono font-bold text-blue-900 mt-1">98.2%</p>
              <span className="text-[9.5px] text-slate-500 font-semibold block mt-1">Timetable performance rating</span>
            </div>
          </div>

          <div className="bg-amber-50 p-4 border border-amber-200 text-xs rounded text-slate-750 text-slate-705">
            <span className="font-bold text-slate-900 block mb-1">⚠️ Active Advisory Review Core Warning:</span>
            Ensure physical receipts, counter notices, and signed exception vouchers are attached prior to marking parameter codes as "OFFICIALLY SETTLED". Check local evidence archives.
          </div>
        </div>
      )}

      {/* Review Entry Form */}
      {activeMenu === 'rev_entry' && (
        <div className="bg-white border border-slate-350 rounded shadow animate-fade-in text-slate-800">
          <div className="bg-[#1e1b4b] text-white p-3.5 border-b border-slate-950 flex justify-between items-center font-mono">
            <span className="text-xs font-bold font-black">FORM: AUD_REV_BLOCK_99 (REVIEWER)</span>
            <span className="text-[9px] bg-slate-900 border border-slate-750 text-indigo-300 p-1 font-bold">CAE DECISION GATE</span>
          </div>

          <div className="p-5">
            <h3 className="text-xs font-black uppercase text-[#1e1b4b] border-b pb-2 mb-4">Advisory Board Formal Check &amp; Remarks Entry</h3>

            <form onSubmit={handleSubmitReviewForm} className="space-y-4 max-w-xl">
              {reviewSuccess && (
                <div className="bg-green-50 border-l-4 border-green-600 p-3 text-xs text-green-800 font-semibold rounded">
                  TRANSACTION COMMITTED: Review comment attached successfully. Paragraph status updated in master relational block.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Select Parameter to Review:</label>
                  <select 
                    value={reviewFormParaNo} 
                    onChange={e => setReviewFormParaNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2 focus:ring-1 focus:ring-blue-600"
                  >
                    {paras.map(p => (
                      <option key={p.id} value={p.id}>{p.paraNo} &bull; {p.title.substring(0,35)}...</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Advisory Recommendation / Action:</label>
                  <select 
                    value={reviewFormRecommendation} 
                    onChange={e => setReviewFormRecommendation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-305 text-indigo-950 font-bold p-2 focus:ring-1 focus:ring-blue-600 font-mono"
                  >
                    <option value="Satisfied - Recommend Settling observation">✅ CLEAR FINDING (Mark officially Settled)</option>
                    <option value="Further audit response required - Flag correction">❌ REQUEST FIELD CORRECTION (Send back to Auditor)</option>
                    <option value="Escalate to Legal Board">⚠️ ESCALATE to central Legal Advisory Board</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Enter Review Comments &amp; Regulatory Remarks:</label>
                <textarea 
                  value={reviewFormComment} 
                  onChange={e => setReviewFormComment(e.target.value)}
                  placeholder="Type official review remarks for history logs..." 
                  className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-medium focus:ring-1 focus:ring-blue-600 h-28"
                />
              </div>

              <div>
                <button type="submit" className="bg-[#1e1b4b] hover:bg-indigo-950 text-white font-mono text-xs font-bold p-2.5 px-6 rounded-xs shadow-sm flex items-center gap-1.5 cursor-pointer">
                  <Database className="w-4 h-4 text-yellow-400" />
                  COMMIT REVIEW DECISION (F10)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evidence Verification Form */}
      {activeMenu === 'rev_evidence_verify' && (
        <div className="bg-white border border-slate-300 p-5 rounded animate-fade-in text-slate-800 space-y-4">
          <h3 className="text-xs font-black uppercase text-[#1e1b4b] border-b pb-2">Auditor Field Evidence Tally Verification</h3>
          <p className="text-xs text-slate-500 font-sans">Inspect file attachments and voucher screenshots uploaded by field teams, and toggle official Advisory verification validation tokens.</p>

          <div className="space-y-3">
            {evidenceRecords.map(ev => (
              <div key={ev.id} className="border border-slate-205 p-3.5 rounded bg-slate-50 flex justify-between items-center" id={`evidence-verifier-row-${ev.id}`}>
                <div>
                  <span className="text-[10px] bg-slate-200 text-slate-700 font-mono p-0.5 px-1.5 rounded font-bold uppercase">{ev.type} &bull; {ev.id}</span>
                  <p className="text-xs font-bold text-slate-800 mt-1">{ev.title}</p>
                  <p className="text-[9px] text-slate-450 text-slate-405 font-mono">Linked Para Code: {ev.paraNo} &bull; Uploaded: {ev.dateStr}</p>
                </div>

                <button 
                  onClick={() => handleToggleEvidenceVerify(ev.id)} 
                  className={`font-mono text-[9.5px] p-2 rounded-xs uppercase font-bold cursor-pointer transition-all border ${
                    ev.verified 
                      ? 'bg-green-105 bg-green-50 border-green-205 text-green-805 text-green-700 hover:bg-slate-100/50' 
                      : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                  }`}
                >
                  {ev.verified ? '✓ Evidence Approved' : '✗ Evidentially Rejected'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Remarks */}
      {activeMenu === 'rev_remarks_entry' && (
        <div className="bg-white border border-slate-300 p-5 rounded animate-fade-in text-slate-800 space-y-3">
          <h3 className="text-xs font-black uppercase text-[#1e1b4b] border-b pb-2">CAE Review Comments Quick Ledger</h3>
          <p className="text-xs text-slate-450 mb-3">These are quick observations registered by the Advisory Board reviewers attached directly to the current audit period ledger.</p>

          <div className="border rounded overflow-hidden">
            <div className="bg-slate-100 p-2.5 font-mono text-[9px] text-slate-500 font-bold border-b">CURRENT REGISTERED DIRECTIVES</div>
            <div className="p-4 space-y-3 font-sans text-xs">
              <div className="border-b pb-2">
                <span className="font-bold text-[#1e1b4b] block">DIRECTIVE 1.25.1</span>
                <p className="text-slate-600 mt-1">"Verify vendor liquidation bank guarantees before concluding fieldwork. If raw vouchers list claims variance &gt; 1.5 Lakhs, raise Category level to Critical."</p>
              </div>
              <div>
                <span className="font-bold text-[#1e1b4b] block">DIRECTIVE 1.25.2</span>
                <p className="text-slate-600 mt-1">"Scrutinize gate pass registry records against monthly dispatch notes. Flag cutoff variances immediately."</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Correction Requests Formulation */}
      {activeMenu === 'rev_correction_requests' && (
        <div className="bg-white border-2 border-slate-350 rounded shadow-md animate-fade-in text-slate-800 overflow-hidden">
          <div className="bg-[#1e1b4b] text-white p-3 border-b flex justify-between items-center font-mono">
            <span className="text-xs font-bold leading-none uppercase">Form: FORM_CORRECT_99B (REVIEWER)</span>
            <span className="text-[9px] font-bold">Correction Formulation Node</span>
          </div>

          <div className="p-6">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2 mb-4">raise formal correction advice to Auditor</h3>
            
            <form onSubmit={handlePostCorrectionRequest} className="space-y-4 max-w-xl">
              {correctionSuccess && (
                <div className="bg-indigo-50 border-l-4 border-[#1e1b4b] p-3 text-xs text-indigo-900 font-bold rounded">
                  TRANSACTION DISPATCHED: Correction feedback routed to field Auditor inbox. Rework state enabled.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-600 mb-1 font-mono">Target Exception Parameter:</label>
                  <select 
                    value={correctionTargetPara} 
                    onChange={e => setCorrectionTargetPara(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2 focus:ring-1 focus:ring-blue-650 focus:ring-blue-600 focus:outline-none"
                  >
                    {paras.map(p => (
                      <option key={p.id} value={p.id}>{p.paraNo} &bull; {p.title.substring(0,40)}...</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-605 text-slate-600 mb-1 font-mono">Dispatch Code Identifier:</label>
                  <input 
                    type="text" 
                    readOnly 
                    value="DISP_CORRECT_AIMS_77" 
                    className="w-full bg-slate-100 border border-slate-300 p-2 font-mono text-slate-500 text-xs font-bold" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 font-mono">Specify Exact Correction Requirements (to be resolved by Auditor):</label>
                <textarea 
                  value={correctionRemarksText} 
                  onChange={e => setCorrectionRemarksText(e.target.value)}
                  placeholder="Specify exact observations, missing files, or ledger mismatches that the Auditor must re-evaluate..." 
                  className="w-full bg-slate-50 border border-slate-300 p-2.5 text-xs font-medium focus:ring-1 focus:ring-blue-600 h-28"
                  required
                />
              </div>

              <div>
                <button type="submit" className="bg-[#1e1b4b] hover:bg-neutral-900 text-white font-mono text-xs font-bold p-2.5 px-6 rounded shadow-3xs flex items-center gap-1.5 cursor-pointer">
                  <Send className="w-4 h-4 text-yellow-300" />
                  DISPATCH CORRECTION DIRECTIVE (F11)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Re-Review Lifecycle Control */}
      {activeMenu === 'rev_re_review' && (
        <div className="bg-white border border-slate-300 p-5 rounded animate-fade-in text-slate-800 space-y-4">
          <h3 className="text-xs font-black uppercase text-[#1e1b4b] border-b pb-2">Re-Review pending checkouts</h3>
          <p className="text-xs text-slate-500 font-sans">Verify reworked answers submitted by field auditors on previously returned paragraphs.</p>
          
          <div className="space-y-3">
            {correctionsList.filter(c => c.status.includes('Submitted') || c.status.includes('Auditor')).map(c => (
              <div key={c.id} className="border border-slate-200 p-4 rounded bg-slate-50 flex justify-between items-start" id={`rereview-row-${c.id}`}>
                <div className="space-y-1">
                  <span className="text-[9px] bg-indigo-100 text-indigo-900 font-mono p-0.5 px-2 rounded font-bold uppercase">{c.status}</span>
                  <h4 className="text-xs font-bold text-slate-800 mt-1.5">{c.title}</h4>
                  <p className="text-[10px] text-slate-450 font-mono">Remarks: {c.remarks}</p>
                </div>
                <button 
                  onClick={() => {
                    alert('SUCCESS: Parameter approved and cleared for settlement verified mark!');
                    setCorrectionsList(prev => prev.map(item => item.id === c.id ? { ...item, status: 'Officially Approved Settlement' } : item));
                    if (onUpdatePara) onUpdatePara(c.id, { status: 'Settled' });
                  }} 
                  className="bg-green-700 hover:bg-green-800 text-white font-mono text-[9px] uppercase font-bold p-1.5 px-3 rounded-sm"
                >
                  Clear and Settle Para ✓
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review History / Advisory Archives */}
      {(activeMenu === 'rev_history' || activeMenu === 'rev_reports_comp' || activeMenu === 'rev_knowledge' || activeMenu === 'rev_pending_alerts' || activeMenu === 'rev_report_review') && (
        <div className="bg-white border border-slate-300 p-5 rounded animate-fade-in text-slate-800">
          <h3 className="text-xs font-black uppercase text-[#1e1b4b] border-b pb-2 mb-3">Enterprise Advisory Review Archive Router</h3>
          
          <div className="p-8 text-center bg-slate-50 border rounded space-y-3">
            <Lock className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-xs font-bold text-slate-805 text-slate-800 uppercase font-mono">Advisory Vault Security Enabled</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">This view is locked under secure authentication tokens signed by the Chief Audit Executive decision gate node code.</p>
            <span className="inline-block bg-[#1e1b4b] text-[#fbe5c9] font-mono text-[9px] p-1 px-3.5 uppercase font-bold">SEC_TOKEN: CAE_SYS_AIMS</span>
          </div>
        </div>
      )}


      {/* AUDITOR ROUTING CASES */}

      {/* Assigned Audits */}
      {activeMenu === 'aud_assigned_audits' && (
        <div className="bg-white border border-slate-300 p-5 rounded animate-fade-in text-slate-800 space-y-3">
          <h3 className="text-xs font-black uppercase text-emerald-805 text-emerald-800 border-b pb-2">My Assigned Field Audit Programs</h3>
          <p className="text-xs text-slate-500 font-sans">The following audit tasks are currently assigned to your field investigation credentials (Smt. P. Lakshmi).</p>

          <div className="space-y-3">
            {localAssignments.map(la => (
              <div key={la.id} className="border border-slate-205 p-3.5 rounded bg-slate-50/75 flex justify-between items-center" id={`auditor-assignments-row-${la.id}`}>
                <div>
                  <span className="text-[10px] bg-emerald-50 border border-emerald-250 text-emerald-850 text-emerald-800 font-mono p-0.5 px-2 rounded font-bold uppercase">{la.priority} PRIORITY</span>
                  <p className="text-xs font-bold text-slate-800 mt-1.5">{la.planTitle}</p>
                </div>
                <button onClick={() => onSelectMenu('aud_execution')} className="bg-emerald-800 hover:bg-emerald-900 text-white font-mono text-[10px] uppercase font-bold px-3 py-1.5 rounded-sm">
                  Start Fieldwork &rarr;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Execution */}
      {activeMenu === 'aud_execution' && (
        <div className="bg-white border border-slate-300 p-5 rounded animate-fade-in text-slate-800 space-y-4">
          <h3 className="text-xs font-black uppercase text-emerald-800 border-b pb-2">Active Field Audit Execution walkthrough</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200 p-4 rounded bg-slate-50 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase">Field Investigation Milestones Check List:</h4>
              <ul className="text-xs text-slate-600 list-disc list-inside space-y-1.5 pt-2">
                <li>Doublecheck physical weight bridges ledger receipts.</li>
                <li>Trace MM system files against voucher claims lists.</li>
                <li>Verify counter notice signatures from the department manager.</li>
                <li>Evaluate exact financial implications values in Rupee terms.</li>
              </ul>
            </div>

            <div className="border border-slate-200 p-4 rounded bg-sky-50/50 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-indigo-950 uppercase font-mono">Oracle active ledger integration</h4>
                <p className="text-xs text-slate-650 text-slate-505 mt-2">Create standard observations parameters findings of the audit programs to compile reports draft directly inside our local cloud database.</p>
              </div>
              <button onClick={() => onSelectMenu('aud_report_entry')} className="bg-emerald-850 bg-emerald-800 hover:bg-emerald-900 text-white font-mono text-[10px] uppercase font-bold p-2 rounded-sm text-center">
                Go to Report Exception Entry Form &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Status Tracking Auditor */}
      {activeMenu === 'aud_status_tracking' && (
        <div className="bg-white border border-slate-300 p-5 rounded animate-fade-in text-slate-800 space-y-4">
          <h3 className="text-xs font-black uppercase text-emerald-800 border-b pb-2">Observations Status Monitoring Dashboard</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            {paras.map(p => (
              <div key={p.id} className="border border-slate-205 p-3 rounded-sm bg-slate-50 flex justify-between items-center" id={`status-tracking-aud-row-${p.id}`}>
                <div>
                  <h4 className="font-bold text-slate-900">{p.paraNo} &bull; {p.title}</h4>
                  <span className="text-[10px] text-slate-400 block font-mono">Value: ₹{p.financialImplication.toLocaleString()}</span>
                </div>
                <span className={`bg-rose-50 border border-rose-250 text-rose-850 text-rose-850 text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${p.status === 'Settled' ? 'bg-green-50 text-green-800 border-green-250' : ''}`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Entry Terminal */}
      {activeMenu === 'aud_report_entry' && (
        <div className="bg-white border-2 border-slate-350 rounded-sm shadow-md overflow-hidden animate-fade-in text-slate-800">
          <div className="bg-[#115e59] text-white p-3 border-b border-teal-950 flex justify-between items-center font-mono">
            <span className="text-xs font-bold leading-none uppercase font-black">FORM: AUD_OBSERV_ENTRY_RINL (AUDITOR)</span>
            <span className="text-[9px] bg-slate-900 text-slate-305 text-slate-250 p-1 font-bold">VSP AUDIT CORE</span>
          </div>

          <form onSubmit={handleRegisterObservation} className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-1.5 mb-3 uppercase">Register New Audit Observation Parameter Finding</h3>
            
            {observationSuccessStr && (
              <div className="bg-teal-50 border-l-4 border-teal-600 p-3 text-xs text-teal-900 font-bold font-semibold rounded">
                {observationSuccessStr}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Para/Rule No. Code:</label>
                <input 
                  type="text" 
                  value={newObservationParaNo} 
                  onChange={e => setNewObservationParaNo(e.target.value)}
                  placeholder="e.g. Para-1.5" 
                  className="w-full bg-slate-50 border border-slate-300 p-2 font-mono text-slate-800 font-bold focus:ring-1 focus:ring-blue-600" 
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Criticality Category Code:</label>
                <select 
                  value={newObservationCategory} 
                  onChange={e => setNewObservationCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 p-2 font-mono font-bold text-rose-900 focus:ring-1 focus:ring-blue-600"
                >
                  <option value="Critical">🚨 Critical Red Flag (Action Required)</option>
                  <option value="Major">Major Exception finding</option>
                  <option value="Minor">Minor Routine compliance observation</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Estimated Financial Implication (INR):</label>
                <input 
                  type="number" 
                  value={newObservationFinVal} 
                  onChange={e => setNewObservationFinVal(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 p-2 font-mono text-indigo-900 font-bold focus:ring-1 focus:ring-blue-600 text-right" 
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#115e59] mb-1 font-mono uppercase">Finding Subject Title:</label>
              <input 
                type="text" 
                value={newObservationTitle} 
                onChange={e => setNewObservationTitle(e.target.value)}
                placeholder="e.g. Discrepancy logged within scrap disposal certificates..." 
                className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-semibold focus:ring-1 focus:ring-blue-600" 
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#115e59] mb-1 font-mono uppercase">Finding Observation description detail:</label>
              <textarea 
                value={newObservationDesc} 
                onChange={e => setNewObservationDesc(e.target.value)}
                placeholder="Detail exact findings, vouchers numbers, departments heads interviewed..." 
                className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-medium focus:ring-1 focus:ring-blue-600 h-28" 
                required
              />
            </div>

            <div>
              <button type="submit" className="bg-[#115e59] hover:bg-teal-900 text-white font-mono text-xs font-bold p-2.5 px-6 rounded-xs shadow-sm flex items-center gap-1.5 cursor-pointer">
                <Database className="w-4 h-4 text-yellow-300 animate-pulse" />
                REGISTER OBSERVATION OBS (F10)
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reply Entry Auditor */}
      {activeMenu === 'aud_reply_entry' && (
        <AuditReportEntryForm role="Auditor" currentUser={{ name: currentUser?.name || 'Auditor Guest', username: currentUser?.username || 'auditor_usr' }} />
      )}

      {/* Report Entry Team Lead */}
      {activeMenu === 'tl_report_entry' && (
        <AuditReportEntryForm role="Team Lead" currentUser={{ name: currentUser?.name || 'Lead Guest', username: currentUser?.username || 'lead_usr' }} />
      )}

      {/* Report Entry Department HOD / Reviewer */}
      {activeMenu === 'rev_report_entry' && (
        <AuditReportEntryForm role="Reviewer" currentUser={{ name: currentUser?.name || 'Reviewer Guest', username: currentUser?.username || 'reviewer_usr' }} />
      )}

      {/* Rework Requests Redressal */}
      {activeMenu === 'aud_rework_requests' && (
        <div className="bg-white border-2 border-slate-350 rounded-sm shadow-md overflow-hidden animate-fade-in text-slate-800">
          <div className="bg-[#115e59] text-white p-3 border-b flex justify-between items-center font-mono">
            <span className="text-xs font-bold font-black uppercase leading-none">FORM: AUD_REWORK_REDR_99 (AUDITOR)</span>
            <span className="text-[9px] font-bold">Rework Inbox Terminal</span>
          </div>

          <div className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-1.5 uppercase_block">Audit Remarks &amp; Corrections Rework Panel</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">The Advisory Reviewer board CAE returned these observations for rework. Review notes carefully and submit correction updates.</p>

            {reworkSuccessStr && (
              <div className="bg-emerald-50 border-l-4 border-emerald-600 p-3 text-xs text-emerald-900 font-bold font-semibold rounded">
                {reworkSuccessStr}
              </div>
            )}

            <div className="space-y-4">
              {correctionsList.map(c => (
                <div key={c.id} className="border border-dashed border-orange-300 bg-orange-50/10 p-4 rounded-sm space-y-3" id={`rework-box-${c.id}`}>
                  <div className="flex justify-between text-xs">
                    <span className="font-mono font-bold text-slate-500">{c.paraNo} &bull; {c.title}</span>
                    <span className="bg-orange-100 text-orange-850 font-mono text-[9px] px-2 py-0.5 rounded font-bold uppercase">{c.status}</span>
                  </div>

                  <div className="bg-slate-100 p-3 rounded text-xs select-text font-serif italic text-slate-805 leading-relaxed">
                    <span className="font-bold font-sans text-[10px] text-red-700 block mb-1 uppercase font-mono tracking-widest leading-none">Reviewer Correction Directive remarks:</span>
                    "{c.remarks}"
                  </div>

                  {c.status !== 'Rework Submitted for Review' ? (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-605 text-slate-600">Enter Rework Update response:</label>
                      <textarea 
                        value={auditorReworkTexts[c.id] || ''} 
                        onChange={e => {
                          const val = e.target.value;
                          setAuditorReworkTexts(prev => ({ ...prev, [c.id]: val }));
                        }}
                        placeholder="Detail exact findings correction, newly cross-verified database serial values, or compliance proof..." 
                        className="w-full bg-white border border-slate-350 p-2 text-xs font-medium focus:ring-1 focus:ring-blue-650 h-20" 
                      />
                      <button 
                        onClick={() => handleAuditorReworkSubmit(c.id)} 
                        className="bg-emerald-800 hover:bg-[#115e59] text-white font-mono text-[10px] uppercase font-bold p-1 px-4 rounded-sm flex items-center gap-1.5 cursor-pointer shadow-3xs"
                      >
                        <Send className="w-3.5 h-3.5 text-yellow-300" />
                        SUBMIT REWORK RESPONSE &rarr;
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 text-emerald-800 text-xs border rounded-xs font-bold">
                      ✓ Rework successfully completed and submitted for Review Verification checking loop.
                      {c.auditorText && <p className="font-sans font-medium text-slate-700 italic mt-1 pb-1">Response: "{c.auditorText}"</p>}
                    </div>
                  )}

                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upload Evidence / Documents Auditor */}
      {(activeMenu === 'aud_upload_evidence' || activeMenu === 'aud_upload_docs') && (
        <div className="bg-white border border-slate-350 rounded shadow animate-fade-in text-slate-800 overflow-hidden">
          <div className="bg-[#115e59] text-white p-3.5 border-b flex justify-between items-center font-mono">
            <span className="text-xs font-bold leading-none font-black uppercase">FORM: AUD_FILE_UPLOAD_RINL (AUDITOR)</span>
            <span className="text-[9.5px] font-bold">Secure Document vault</span>
          </div>

          <div className="p-5 space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-800 border-b pb-1.5">Upload Field Audit Evidence vouchers</h3>
            <p className="text-xs text-slate-500 font-sans">DVC protocols mandate that pdf/jpg file evidence must be committed for all outstanding observation descriptions before settlement verification cycles are invoked.</p>

            {/* Drag & Drop Canvas */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded p-10 text-center space-y-3 transition-all ${
                dragActive ? 'border-emerald-600 bg-emerald-50/20' : 'border-slate-300 bg-slate-50'
              }`}
            >
              <Download className="w-10 h-10 text-slate-400 mx-auto" />
              <div>
                <p className="text-xs font-bold text-slate-700">Drag and drop field evidence files here</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Supports PDF, JPG, XLSX, DOCX formats (Max 10MB)</p>
              </div>
              
              <div className="pt-2">
                <button 
                  type="button" 
                  onClick={selectFilesDummy}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-mono text-[9px] uppercase font-bold p-1.5 px-4 rounded shadow-3xs cursor-pointer"
                >
                  Or Select Files manually From drive
                </button>
              </div>
            </div>

            {/* List of uploaded files */}
            {uploadedEvidenceFiles.length > 0 && (
              <div className="border border-slate-205 rounded bg-white">
                <div className="bg-slate-100 p-2 font-mono text-[9px] text-slate-500 font-bold">Successfully Committed Files (Active buffers)</div>
                <div className="p-3 space-y-2">
                  {uploadedEvidenceFiles.map((fn, i) => (
                    <div key={i} className="flex justify-between text-xs font-mono font-medium text-slate-705 p-1 bg-slate-50 border rounded" id={`upload-badge-${i}`}>
                      <span className="text-slate-800 overflow-hidden text-ellipsis w-[250px] truncate">✓ {fn}</span>
                      <span className="text-[#115e59] font-bold uppercase tracking-wider text-[9px]">Committed SSL</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auditor history / archives */}
      {(activeMenu === 'aud_history' || activeMenu === 'aud_knowledge') && (
        <div className="bg-white border border-slate-300 p-5 rounded animate-fade-in text-slate-800">
          <h3 className="text-xs font-black uppercase text-emerald-800 border-b pb-2 mb-3">Enterprise Field Auditor Central Lookup</h3>
          
          <div className="p-8 text-center bg-slate-50 border rounded space-y-3">
            <Lock className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-xs font-bold text-slate-800 uppercase font-mono">Field Archives Encrypted</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">This view is locked under secure authentication tokens signed by the Field auditor decision gate node code.</p>
            <span className="inline-block bg-[#115e59] text-[#e0f1ef] font-mono text-[9px] p-1 px-3.5 uppercase font-bold">REF_TOKEN: AUD_SYS_77AIMS</span>
          </div>
        </div>
      )}

    </div>
  );
}

// Sub components
function CheckState({ checked }: { checked: boolean }) {
  return checked ? (
    <div className="flex justify-center items-center gap-1 text-emerald-600 select-all font-semibold">
      <CheckSquare className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100 shrink-0" />
      <span className="text-emerald-700 font-sans text-xs font-bold">✔</span>
    </div>
  ) : (
    <div className="flex justify-center text-slate-300 scale-95 font-sans font-bold select-all">
      &mdash;
    </div>
  );
}
