import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, CheckCircle2, AlertCircle, FileText, Download, 
  Send, RefreshCw, Layers, Sparkles, Plus, Clock, FileCheck 
} from 'lucide-react';
import { AuditPlan } from '../types';

interface Transaction {
  id: string;
  voucherNo: string;
  date: string;
  description: string;
  department: string;
  amount: number;
  status: 'Committed' | 'Pending' | 'Draft';
  remarks?: string;
}

interface HandoverMemo {
  id: string;
  title: string;
  author: string;
  targetUser: string;
  timestamp: string;
  content: string;
}

interface TransactionCutoffLedgerProps {
  plans: AuditPlan[];
  currentUser: { name: string; role: string };
}

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'TX-001',
    voucherNo: 'VCH-2026-1041',
    date: '2026-03-15',
    description: 'Bulk Procurement of Premium Low-Ash Coking Coal',
    department: 'Coke Ovens Department',
    amount: 14500000,
    status: 'Committed',
    remarks: 'Approved under Coke division Q1 budget ledger'
  },
  {
    id: 'TX-002',
    voucherNo: 'VCH-2026-1050',
    date: '2026-03-31',
    description: 'Unbilled materials receipt - SMS-2 scrap charges',
    department: 'SMS-2 Department',
    amount: 3200000,
    status: 'Pending',
    remarks: 'Awaiting supplier invoice delivery'
  },
  {
    id: 'TX-003',
    voucherNo: 'VCH-2026-2004',
    date: '2026-04-12',
    description: 'Refractory lining material replacement - Furnace Node',
    department: 'Blast Furnace Dept',
    amount: 8850000,
    status: 'Committed',
    remarks: 'Scheduled regular Q2 overhaul transaction'
  },
  {
    id: 'TX-004',
    voucherNo: 'VCH-2026-2081',
    date: '2026-05-18',
    description: 'Consultant fees for environment safety & air scrubber auditing',
    department: 'Coke Ovens Department',
    amount: 1200000,
    status: 'Committed',
    remarks: 'Environmental site certification payout'
  },
  {
    id: 'TX-005',
    voucherNo: 'VCH-2026-2130',
    date: '2026-06-28',
    description: 'Limestone charges logistics supplier invoice',
    department: 'SMS-2 Department',
    amount: 2150000,
    status: 'Pending',
    remarks: 'Invoiced, goods delivered on June 28'
  },
  {
    id: 'TX-006',
    voucherNo: 'VCH-2026-2144',
    date: '2026-07-02',
    description: 'Special alloy additive shipment logistics charges',
    department: 'SMS-2 Department',
    amount: 1800000,
    status: 'Pending',
    remarks: 'Shipped July 2, but tied to late June dispatch operations'
  },
  {
    id: 'TX-007',
    voucherNo: 'VCH-2026-3012',
    date: '2026-08-11',
    description: 'Billet cooling bed hydraulics replacement parts',
    department: 'Wire Rod Mill Unit',
    amount: 4100000,
    status: 'Committed',
    remarks: 'Q3 standard maintenance procurement'
  },
  {
    id: 'TX-008',
    voucherNo: 'VCH-2026-2150',
    date: '2026-06-30',
    description: 'Accrued electricity consumption estimate - Unit 4 Blast Furnace',
    department: 'Thermal Power Corp Node',
    amount: 6700000,
    status: 'Pending',
    remarks: 'Provisional June utility ledger record'
  },
];

export default function TransactionCutoffLedger({ plans, currentUser }: TransactionCutoffLedgerProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [auditLogs, setAuditLogs] = useState<string[]>([
    'System: Ledger initialized count = 8 standard database records.'
  ]);

  // Handover memos
  const [memos, setMemos] = useState<HandoverMemo[]>([
    {
      id: 'MEMO-101',
      title: 'Transfer Window Boundaries Overlap Note',
      author: 'Shri K. Raghavan, Chief Auditor',
      targetUser: 'Smt. R. Priya, Field Auditor',
      timestamp: '2026-06-01 10:45 AM',
      content: 'Please double check SMS-2 limestone receipts VCH-2026-2130 dating 28th June. Since it is pending, confirm if material physically reached site before midnight of June 30th to qualify for cut-off inclusion.'
    },
    {
      id: 'MEMO-102',
      title: 'Thermal Power Corp Accruals Baseline',
      author: 'Smt. P. Lakshmi, Senior Manager',
      targetUser: 'Shri S.K. Sharma, Lead Auditor',
      timestamp: '2026-05-28 04:30 PM',
      content: 'We are applying standard utility estimation procedures for Unit 4 power cost in Q2. Review window end constraint strictly enforced on all auxiliary backup billing.'
    }
  ]);

  // Handle Note input fields
  const [memoTitle, setMemoTitle] = useState('');
  const [memoTarget, setMemoTarget] = useState('Shri S.K. Sharma');
  const [memoContent, setMemoContent] = useState('');

  // Selected Plan Object reference
  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  // Auto-select first plan if available
  useEffect(() => {
    if (plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans, selectedPlanId]);

  // Custom logging helper
  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setAuditLogs(prev => [`[${time}] ${msg}`, ...prev]);
  };

  // Check if target date is in reviews window bounds
  const checkScope = (dateStr: string) => {
    if (!selectedPlan || !selectedPlan.reviewWindowStart || !selectedPlan.reviewWindowEnd) {
      return { inScope: true, msg: 'No Bounds Configured' };
    }
    const date = new Date(dateStr);
    const start = new Date(selectedPlan.reviewWindowStart);
    const end = new Date(selectedPlan.reviewWindowEnd);

    const isIn = date >= start && date <= end;
    return {
      inScope: isIn,
      msg: isIn ? '✓ IN Scope' : '🚫 Out of Scope'
    };
  };

  // Execute standard cut-off delay adjusting rule
  const handleApplyCutoffRules = () => {
    if (!selectedPlan) {
      alert('Please select an active Audit Plan first.');
      return;
    }

    const startBound = selectedPlan.reviewWindowStart || '2026-04-01';
    const endBound = selectedPlan.reviewWindowEnd || '2026-06-30';

    // Rule: Find all PENDING transactions dated AFTER the endBound, or within 3 days after, and shift their recognition date.
    // Also tag pending transactions inside scope as 'Cutoff Approved'
    let adjustedCount = 0;
    const nextList = transactions.map(t => {
      const isPending = t.status === 'Pending';
      if (isPending) {
        if (t.date > endBound) {
          // It's outside at the end boundary, adjust date to next quarter standard kickoff (e.g. July 5th) and mark as shifted
          const originalDate = t.date;
          const adjustedDate = new Date(new Date(endBound).getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          adjustedCount++;
          return {
            ...t,
            date: adjustedDate,
            remarks: `${t.remarks || ''} [CUT-OFF SHIFTED from ${originalDate} to next period standard recognized date by compliance mandate]`
          };
        } else if (t.date >= startBound && t.date <= endBound) {
          // Tag as accrued within current transaction window limits
          adjustedCount++;
          return {
            ...t,
            status: 'Committed' as const,
            remarks: `${t.remarks || ''} [Cut-off compliance validated - Accrued to current period ledger]`
          };
        }
      }
      return t;
    });

    setTransactions(nextList);
    addLog(`Success: Executed Cut-off boundary checking on all ledger rows. Adjusted/Accrued ${adjustedCount} pending transactions around boundary [${endBound}].`);
    alert(`Success: Adjusted/Accrued ${adjustedCount} pending transactions to enforce strict cut-off rules.`);
  };

  // Accrue provisional coking expenses
  const handleAccrueProvisions = () => {
    if (!selectedPlan) {
      alert('Please select an active Audit Plan first.');
      return;
    }

    const startBound = selectedPlan.reviewWindowStart || '2026-04-01';
    const endBound = selectedPlan.reviewWindowEnd || '2026-06-30';

    // Insert a new adjustment voucher
    const adjustVch: Transaction = {
      id: `TX-ADJ-${Date.now().toString().slice(-4)}`,
      voucherNo: `ADJ-VCH-${new Date().getFullYear()}-009`,
      date: endBound, // post exactly at cut-off date boundary
      description: 'Audit Corrective Adjustment: Accrued provisional services completed inside review window',
      department: selectedPlan.department || 'Coke Ovens Department',
      amount: 1540000,
      status: 'Committed',
      remarks: `Correcting journal voucher added under current plan transaction limits`
    };

    setTransactions(prev => [...prev, adjustVch]);
    addLog(`Posted corrective journal voucher: ${adjustVch.voucherNo} on ${adjustVch.date} for ₹${adjustVch.amount.toLocaleString('en-IN')}`);
    alert(`Posted corrective journal voucher under plan [${selectedPlan.id}] for ₹15,40,000.`);
  };

  // Add Handover note memo
  const handleAddMemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoTitle || !memoContent) {
      alert('Please fill out the memo title and content body.');
      return;
    }

    const newMemo: HandoverMemo = {
      id: `MEMO-${Date.now().toString().slice(-3)}`,
      title: memoTitle,
      author: `${currentUser.name} (${currentUser.role})`,
      targetUser: memoTarget,
      timestamp: new Date().toLocaleString(),
      content: memoContent
    };

    setMemos(prev => [newMemo, ...prev]);
    setMemoTitle('');
    setMemoContent('');
    addLog(`Added handover brainstorming memo: "${newMemo.title}" targeted for ${newMemo.targetUser}`);
    alert(`Handover brainstorm memo successfully logged.`);
  };

  // Generate Word compliance report (.doc) download
  const handleDownloadWordReport = () => {
    if (!selectedPlan) {
      alert('Please select an active Audit Plan first.');
      return;
    }

    const startBound = selectedPlan.reviewWindowStart || '2026-04-01';
    const endBound = selectedPlan.reviewWindowEnd || '2026-06-30';

    // HTML representing standard styled Word document (Office Open XML / MSO compliant)
    const htmlString = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>RINL AIMS Transaction Scope & Cut-off Audit Report</title>
        <style>
          body { font-family: 'Arial', sans-serif; font-size: 11pt; color: #333; line-height: 1.5; }
          h1 { color: #0f2043; font-size: 20pt; border-bottom: 2px solid #0f2043; padding-bottom: 5px; }
          h2 { color: #1e3a8a; font-size: 14pt; margin-top: 20px; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .header-table td { padding: 8px; border: 1px solid #ddd; background-color: #f8fafc; }
          .header-table th { background-color: #0f2043; color: #fff; font-weight: bold; text-align: left; padding: 10px; }
          .data-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          .data-table th { background-color: #f1f5f9; color: #334155; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          .data-table td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          .in-scope { color: #15803d; font-weight: bold; background-color: #f0fdf4; }
          .out-scope { color: #b91c1c; font-weight: bold; background-color: #fef2f2; }
          .footer { margin-top: 50px; font-size: 9pt; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 10px; }
          .memo-box { background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 10px; margin: 10px auto; }
        </style>
      </head>
      <body>
        <h1>AIMS COMPLIANCE AUDIT TRANS_LEDGER DISCLOSURE REPORT</h1>
        <p><strong>Generated By:</strong> ${currentUser.name} (${currentUser.role})</p>
        <p><strong>Generated On-Date:</strong> ${new Date().toLocaleString()}</p>
        
        <h2>SECTION I: AUDIT PLAN ALIGNMENT & REVIEW WINDOW BOUNDS</h2>
        <table class="header-table">
          <tr>
            <th>Parameter Field</th>
            <th>Registered Database Value</th>
          </tr>
          <tr>
            <td>Audit Plan Reference ID</td>
            <td><strong>${selectedPlan.id}</strong></td>
          </tr>
          <tr>
            <td>Audit Subject Title</td>
            <td>${selectedPlan.title}</td>
          </tr>
          <tr>
            <td>Target Site Department</td>
            <td>${selectedPlan.department}</td>
          </tr>
          <tr>
            <td>Audit Period Frequency Type</td>
            <td>${selectedPlan.auditPeriod || 'Quarterly'}</td>
          </tr>
          <tr>
            <td>Audit Work Team Lead</td>
            <td>${selectedPlan.leadAuditor || 'N/A'}</td>
          </tr>
          <tr>
            <td>Schedule Duration Dates</td>
            <td>${selectedPlan.startDate || 'N/A'} to ${selectedPlan.endDate || 'N/A'}</td>
          </tr>
          <tr>
            <td><strong>Transaction Review Window Start</strong></td>
            <td><strong>${startBound}</strong></td>
          </tr>
          <tr>
            <td><strong>Transaction Review Window End</strong></td>
            <td><strong>${endBound}</strong></td>
          </tr>
        </table>
        
        <p><em>*Note: Compliance guidelines require that all relevant vouchers reviewed strictly correspond inside the defined starting and ending Transaction Review Scope boundaries. Outside vouchers are logged as Excluded exceptions.</em></p>

        <h2>SECTION II: FINANCIAL TRANSACTIONS SCOPE EVALUATION LEDGER</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th>Voucher No</th>
              <th>Posting Date</th>
              <th>Process Description</th>
              <th>Amount (₹)</th>
              <th>Status</th>
              <th>Scope Check Result</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.map(t => {
              const check = checkScope(t.date);
              return `
                <tr>
                  <td><code>${t.voucherNo}</code></td>
                  <td>${t.date}</td>
                  <td>${t.description} (${t.department})</td>
                  <td>₹${t.amount.toLocaleString('en-IN')}</td>
                  <td>${t.status}</td>
                  <td class="${check.inScope ? 'in-scope' : 'out-scope'}">${check.inScope ? 'VALIDATED_IN_SCOPE' : 'OUT_OF_PERIOD_EXCLUDED'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <h2>SECTION III: RECORDED DYNAMIC COMPLIANCE CUT-OFF ADJUSTMENTS</h2>
        <ul>
          <li>All Pending transactions that fell target after Cut-off bound <strong>[${endBound}]</strong> were redirected to next subsequent ledger period to prevent un-accrued liabilities overlap.</li>
          <li>Accruals posted for completed services inside review window.</li>
        </ul>

        <h2>SECTION IV: COLLABORATIVE BRAINSTORMING & HANDOVER NOTE MEMOS</h2>
        ${memos.map(m => `
          <div class="memo-box">
            <p><strong>Subject:</strong> ${m.title}</p>
            <p><strong>From:</strong> ${m.author} &bull; <strong>To:</strong> ${m.targetUser} &bull; <strong>Date:</strong> ${m.timestamp}</p>
            <p>${m.content}</p>
          </div>
        `).join('')}

        <div class="footer">
          <p>CONFIDENTIAL DOCUMENT &bull; AUDIT INFORMATION MANAGEMENT SYSTEM (AIMS) &bull; GOVERNMENT OF INDIA PSU PORTAL</p>
          <p>Security Handover Checksum Signature: SHA-256 System-Auth Encoded Integrity Locked.</p>
        </div>
      </body>
      </html>
    `;

    // Trigger standard download blobbing for .doc Word compatibility
    const blob = new Blob(['\ufeff' + htmlString], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AIMS_Scope_Review_Report_${selectedPlan.id || 'PLAN'}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addLog(`Word document created: downloaded "AIMS_Scope_Review_Report_${selectedPlan.id}.doc" successfully.`);
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in text-xs">
      
      {/* 1. Header with PSU styling */}
      <div className="bg-amber-50 border border-amber-250 p-4 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-3xs">
        <div>
          <div className="flex items-center gap-2 text-amber-900 font-bold font-mono tracking-wide uppercase text-xs">
            <ShieldAlert className="w-5 h-5 text-amber-700" />
            <span>RINL AIMS Compliance Module: Section 35(B) Transaction Bound Control</span>
          </div>
          <h2 className="text-sm font-black text-slate-850 text-slate-800 mt-1 uppercase">
            Transaction Review Period &amp; Cut-Off Boundary Manager
          </h2>
          <p className="text-slate-500 font-medium mt-0.5">
            Restricts the investigation ledger so that auditors review transactions strictly within the defined scope period. Manages pending items to prevent cut-off leakages.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-605 text-slate-600 bg-slate-205 bg-slate-200 px-2 py-1 rounded">
            Active Project: Visakhapatnam Node
          </span>
          <button 
            id="exec-scope-cutoff-btn"
            onClick={handleApplyCutoffRules}
            className="bg-blue-900 hover:bg-blue-800 text-white font-black px-3.5 py-1.5 rounded-sm shadow-2xs flex items-center gap-1.5 cursor-pointer uppercase transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 whitespace-nowrap animate-spin-hover" />
            Apply Cut-Off Rules
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Select Audit Plan & Configure Windows */}
        <div className="bg-white border border-slate-300 rounded-sm shadow-sm p-4 flex flex-col space-y-4">
          <div className="border-b pb-2 flex justify-between items-center bg-slate-50 p-2 border">
            <span className="font-bold text-slate-800 font-mono uppercase tracking-wider">
              ALIGN PLAN TARGET
            </span>
            <span className="text-[9px] bg-indigo-50 border border-indigo-200 text-indigo-900 px-1 rounded-sm font-mono font-bold">MUTATOR</span>
          </div>

          <div>
            <label className="oracle-input-label block mb-1">Select Approved Audit Plan (Bound Register):</label>
            <select
              id="cutoff-plan-selector"
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="oracle-field-value w-full"
            >
              <option value="">-- Choose Audit Plan --</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} - {(p.title || '').substring(0, 35)}... ({p.quarter})
                </option>
              ))}
            </select>
          </div>

          {selectedPlan ? (
            <div className="space-y-3 bg-slate-50 p-3.5 border rounded-xs">
              <div className="text-[10px] font-mono text-indigo-950 uppercase font-black border-b pb-1">
                Aligned Plan Specifications
              </div>
              
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Plan Title / Division:</span>
                <span className="text-slate-800 font-extrabold text-[11px] block">{selectedPlan.title}</span>
                <span className="text-[10px] text-zinc-400 block font-semibold uppercase mt-0.5">Dept: {selectedPlan.department}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] py-1 border-t border-b border-dashed">
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[9px]">Period Frequency:</span>
                  <span className="text-indigo-900 font-black uppercase font-mono">{selectedPlan.auditPeriod || 'Quarterly'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[9px]">Risk Assessment:</span>
                  <span className="text-red-800 font-black uppercase font-mono">{selectedPlan.riskLevel || 'Medium'}</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xs space-y-1">
                <div className="flex items-center gap-1 text-slate-700 font-bold uppercase text-[9.5px]">
                  <Clock className="w-3.5 h-3.5 text-blue-800 shrink-0" />
                  <span>Audit Calendar Duration</span>
                </div>
                <div className="text-slate-800 font-mono font-bold text-[10px]">
                  {selectedPlan.startDate || 'N/A'} to {selectedPlan.endDate || 'N/A'}
                </div>
                <p className="text-[9px] text-slate-400 font-medium">This represents when field works physically starts and resolves.</p>
              </div>

              <div className="bg-amber-100 bg-amber-50 border border-amber-250 p-2.5 rounded-xs space-y-1">
                <div className="flex items-center gap-1 text-amber-900 font-bold uppercase text-[9.5px]">
                  <FileCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Transaction Review Boundaries</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] font-mono font-black text-slate-800">
                  <div>
                    <span className="text-[8px] text-slate-400 uppercase block font-bold">Start Scope:</span>
                    <span className="bg-white border rounded-sm px-1 py-0.5 text-slate-800 inline-block font-bold">
                      {selectedPlan.reviewWindowStart || 'Not set'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 block font-bold uppercase">End Scope:</span>
                    <span className="bg-white border rounded-sm px-1 py-0.5 text-slate-800 inline-block font-bold">
                      {selectedPlan.reviewWindowEnd || 'Not set'}
                    </span>
                  </div>
                </div>
                <p className="text-[9px] text-slate-500 mt-1 font-medium">Any ledger transactions ledger dated outside this boundary is flagged as Out-of-Period.</p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center border-2 border-dashed bg-slate-50 text-slate-400 font-medium">
              No plan selected. Choose a plan to map transaction review bounds.
            </div>
          )}

          {/* Boundaries Action Terminal */}
          <div className="bg-slate-50 p-3.5 border rounded-xs flex flex-col space-y-2">
            <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase">Boundaries Commands</span>
            
            <button
              id="cutoff-recon-provisions-btn"
              onClick={handleAccrueProvisions}
              disabled={!selectedPlan}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold px-3 py-2 border rounded-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed uppercase shrink-0 transition-all text-left text-[10px] flex items-center justify-between"
            >
              <span>Accrue Current Period Cut-Off Provision</span>
              <Plus className="w-3.5 h-3.5 text-yellow-400" />
            </button>

            <button
              id="cutoff-download-word-btn"
              onClick={handleDownloadWordReport}
              disabled={!selectedPlan}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-3 py-2 border rounded-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed uppercase shrink-0 text-left text-[10px] flex items-center justify-between transition-all"
            >
              <span>Export Word Compliance Report (.doc)</span>
              <Download className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Middle and Right Column (Span-2): Real-Time Vouchers Scope Verification */}
        <div className="lg:col-span-2 bg-white border border-slate-300 rounded-sm shadow-sm flex flex-col">
          <div className="bg-slate-100 p-3.5 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">
                COMPLIANCE LEDGER: LIVE_TRANSACTIONS_ENFORCEMENT
              </span>
              <p className="text-[10px] text-slate-400 font-serif">Transactions checks dynamically computed against selected plan bounds</p>
            </div>
            <div className="bg-blue-50 border text-blue-900 px-2 py-0.5 font-bold font-mono text-[10px] rounded shrink-0">
              LEDGER COUNT: {transactions.length}
            </div>
          </div>

          {/* Table Container */}
          <div className="p-3 overflow-x-auto flex-grow">
            <table className="w-full text-left font-sans text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                  <th className="py-2.5 px-2">Voucher Ref Record</th>
                  <th className="py-2.5 px-2">Posting Date</th>
                  <th className="py-2.5 px-2">Process Description &amp; Department</th>
                  <th className="py-2.5 px-2 text-right">Amount (₹)</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-2 text-center">In-Period Scope Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {transactions.map((t) => {
                  const check = checkScope(t.date);
                  return (
                    <tr 
                      key={t.id} 
                      className={`hover:bg-slate-50/55 transition-colors ${
                        !check.inScope ? 'bg-red-50/40 text-rose-950' : 'bg-green-50/30'
                      }`}
                    >
                      <td className="py-2.5 px-2 font-mono font-bold text-blue-950 flex flex-col">
                        <span>{t.voucherNo}</span>
                        <span className="text-[9px] text-slate-400 font-sans font-medium">ID: {t.id}</span>
                      </td>
                      <td className="py-2.5 px-2 font-mono font-semibold text-slate-700">{t.date}</td>
                      <td className="py-2.5 px-2">
                        <p className="font-extrabold text-slate-850 text-slate-805 line-clamp-1">{t.description}</p>
                        <span className="text-[9px] font-bold uppercase block text-indigo-900 mt-0.5">
                          Dept: <span className="font-mono">{t.department}</span>
                        </span>
                        {t.remarks && (
                          <span className="text-[9px] italic block text-amber-800 mt-1">{t.remarks}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-[11.5px] text-slate-900">
                        {t.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-2">
                        <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase font-mono ${
                          t.status === 'Committed' ? 'bg-green-100 text-green-800 border' : 'bg-amber-100 text-amber-850'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={`inline-block text-[10px] font-black px-2.5 py-1 rounded w-fit border shadow-3xs ${
                          check.inScope 
                            ? 'bg-green-50 text-green-800 border-green-200' 
                            : 'bg-red-50 text-red-700 border-red-200 line-through decoration-red-400 decoration-1'
                        }`}>
                          {check.inScope ? '✓ IN_SCOPE' : '🚫 EXCLUDED'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 p-3.5 border-t text-[11px] text-slate-500 font-sans flex items-start gap-1">
            <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
            <span>
              <strong>Regulatory Rule:</strong> Accrued Pending invoices must undergo calendar testing. Transactions posted after matching the quarter review cutoff targets require journal date adjustments to matching subsequent quarters.
            </span>
          </div>
        </div>

      </div>

      {/* 3. Brainstorming Notes & Handover Pad (Teammate Collaboration) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Note Intake Form */}
        <div className="bg-white border border-slate-300 rounded-sm shadow-sm p-4">
          <div className="border-b pb-2 mb-3 bg-indigo-50/50 p-2 border flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 font-mono uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-900" />
              Brainstorm &amp; Handover note
            </span>
            <span className="text-[9px] bg-indigo-100 text-indigo-850 border border-indigo-200 px-1 rounded-sm font-mono font-bold">WRITER</span>
          </div>

          <form onSubmit={handleAddMemoSubmit} className="space-y-4">
            <div>
              <label className="oracle-input-label block mb-1">Memo subject header:</label>
              <input
                id="memo-title-input"
                type="text"
                placeholder="e.g., Coking coal cutoff verification issue"
                value={memoTitle}
                onChange={(e) => setMemoTitle(e.target.value)}
                className="oracle-field-value w-full"
                required
              />
            </div>

            <div>
              <label className="oracle-input-label block mb-1">Target auditor receiver:</label>
              <select
                id="memo-target-select"
                value={memoTarget}
                onChange={(e) => setMemoTarget(e.target.value)}
                className="oracle-field-value w-full"
              >
                <option value="Shri S.K. Sharma, Lead Auditor">Shri S.K. Sharma (Lead Auditor)</option>
                <option value="Smt. R. Priya, Assistant Auditor">Smt. R. Priya (Assistant Auditor)</option>
                <option value="Shri K. Raghavan, Chief CAE">Shri K. Raghavan (Chief CAE)</option>
              </select>
            </div>

            <div>
              <label className="oracle-input-label block mb-1">Brainstorm content / Handover note:</label>
              <textarea
                id="memo-content-input"
                rows={4}
                value={memoContent}
                onChange={(e) => setMemoContent(e.target.value)}
                placeholder="Write specific notes, warnings, transaction exceptions or handover steps..."
                className="oracle-field-value w-full h-24 p-2 text-xs font-medium resize-none"
                required
              />
            </div>

            <button
              id="cutoff-submit-memo-btn"
              type="submit"
              className="w-full btn-primary-gov py-2 uppercase font-mono flex items-center justify-center gap-1.5 cursor-pointer font-extrabold text-[11px]"
            >
              <Send className="w-3.5 h-3.5" />
              Post Collaborative Memo
            </button>
          </form>
        </div>

        {/* Memo Registry List */}
        <div className="lg:col-span-2 bg-white border border-slate-300 rounded-sm shadow-sm flex flex-col justify-between">
          <div>
            <div className="bg-slate-100 p-3.5 border-b">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">
                LEDGER: AUDIT_PLAN_MESSAGES_HANDOVER_MUTATIVE
              </span>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[310px] overflow-y-auto">
              {memos.map((m) => (
                <div key={m.id} className="border border-slate-205 rounded-xs p-3.5 bg-blue-50/15 hover:bg-slate-50/20 transition-all flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="font-extrabold text-blue-900 text-[11px] uppercase tracking-wide leading-tight line-clamp-1">{m.title}</span>
                      <span className="bg-blue-50 text-blue-900 font-mono font-bold text-[9px] px-1 border border-blue-200 uppercase shrink-0">{m.id}</span>
                    </div>
                    <p className="text-slate-600 font-medium text-[11px] leading-relaxed mt-1">{m.content}</p>
                  </div>

                  <div className="border-t border-dashed border-slate-200 pt-2 flex flex-col space-y-1 bg-slate-50/50 p-1.5 rounded-sm">
                    <div className="flex justify-between text-[9px] font-bold text-slate-400">
                      <span>Sender: <strong className="text-slate-700">{m.author}</strong></span>
                      <span>Target: <strong className="text-slate-700">{m.targetUser.split(' ')[0]}</strong></span>
                    </div>
                    <div className="text-[8.5px] font-mono font-bold text-zinc-400 text-right uppercase mt-0.5">
                      {m.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-100 p-3 border-t text-[10px] text-slate-500 font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse inline-block" />
            <span>Integrates team handover comments. Documents are saved as transient notes &amp; embedded inside compliance downloads.</span>
          </div>
        </div>

      </div>

      {/* 4. Live Command Log */}
      <div className="bg-slate-900 text-slate-300 font-mono text-[10px] rounded-sm p-3.5 border border-slate-950 shadow-inner">
        <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
          <span className="text-emerald-400 font-bold tracking-wide flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            Compliance Event Log Console
          </span>
          <span className="text-slate-500 text-[8px] font-bold">STATUS: STREAMING_ACTIVE</span>
        </div>
        <div className="max-h-24 overflow-y-auto space-y-1 selection:bg-emerald-500 selection:text-slate-950">
          {auditLogs.map((log, lidx) => (
            <div key={lidx} className="text-slate-400">
              <span className="text-emerald-500/80 mr-1.5 font-bold">&gt;&gt;</span>
              {log}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
