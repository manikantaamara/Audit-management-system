import React, { useState } from 'react';
import { Download, Printer, Search, RefreshCw, BarChart2, ShieldAlert } from 'lucide-react';

export interface AnnualPlanRecord {
  month: string;
  target: number;
  completed: number;
  pending: number;
  percentage: number;
}

interface AnnualPlanningProps {
  annualData: AnnualPlanRecord[];
  onSaveData: (records: AnnualPlanRecord[]) => void;
}

const DEFAULT_ANNUAL_DATA: AnnualPlanRecord[] = [
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
];

export default function AnnualPlanning({ annualData, onSaveData }: AnnualPlanningProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");

  const records = annualData && annualData.length === 12 ? annualData : DEFAULT_ANNUAL_DATA;

  const handleUpdateRecord = (month: string, field: 'target' | 'completed', value: number) => {
    const updated = records.map(rec => {
      if (rec.month === month) {
        const val = Math.max(0, Number(value));
        const target = field === 'target' ? val : rec.target;
        const completed = field === 'completed' ? val : rec.completed;
        const pending = Math.max(0, target - completed);
        const percentage = target > 0 ? Math.round((completed / target) * 100) : 0;
        return {
          ...rec,
          target,
          completed,
          pending,
          percentage
        };
      }
      return rec;
    });
    onSaveData(updated);
  };

  const filteredRecords = records.filter(rec => 
    rec.month.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Cumulative Totals
  const totalTarget = records.reduce((sum, r) => sum + r.target, 0);
  const totalCompleted = records.reduce((sum, r) => sum + r.completed, 0);
  const totalPending = records.reduce((sum, r) => sum + r.pending, 0);
  const totalPercentage = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;

  // Quarterly Breakdowns
  const getQuarterlyStats = (startIx: number, endIx: number) => {
    const qMonths = records.slice(startIx, endIx);
    const target = qMonths.reduce((s, r) => s + r.target, 0);
    const completed = qMonths.reduce((s, r) => s + r.completed, 0);
    const pending = qMonths.reduce((s, r) => s + r.pending, 0);
    const pct = target > 0 ? Math.round((completed / target) * 100) : 0;
    return { target, completed, pending, pct };
  };

  // VSP Fiscal Year starts in April
  const q1 = getQuarterlyStats(0, 3); // Apr - Jun
  const q2 = getQuarterlyStats(3, 6); // Jul - Sep
  const q3 = getQuarterlyStats(6, 9); // Oct - Dec
  const q4 = getQuarterlyStats(9, 12); // Jan - Mar

  const handleExportCSV = () => {
    const header = "Month,Target,Completed,Pending,Percentage\n";
    const rows = records.map(rec => 
      `${rec.month},${rec.target},${rec.completed},${rec.pending},${rec.percentage}%`
    ).join("\n");
    
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ORACLE_ANNUAL_PLANNING_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPlan = () => {
    let printText = `==========================================================\n`;
    printText += `       RASHTRIYA ISPAT NIGAM LIMITED (RINL) - AUDIT PLANNING\n`;
    printText += `               ANNUAL FISCAL TARGET SCHEDULE REGISTER\n`;
    printText += `==========================================================\n`;
    printText += `FISCAL YEAR: 2026-2027                 STORE CODE: ORA-ANNPLAN-Y\n`;
    printText += `----------------------------------------------------------\n`;
    printText += `MONTH      | TARGET   | COMPLETED | PENDING | PERCENTAGE\n`;
    printText += `-----------|----------|-----------|---------|-------------\n`;
    records.forEach(rec => {
      const mn = rec.month.padEnd(10);
      const tg = String(rec.target).padStart(8);
      const co = String(rec.completed).padStart(9);
      const pe = String(rec.pending).padStart(7);
      const pct = `${rec.percentage}%`.padStart(11);
      printText += `${mn} | ${tg} | ${co} | ${pe} | ${pct}\n`;
    });
    printText += `----------------------------------------------------------\n`;
    printText += `TOTALS     | ${String(totalTarget).padStart(8)} | ${String(totalCompleted).padStart(9)} | ${String(totalPending).padStart(7)} | ${totalPercentage}%\n`;
    printText += `==========================================================\n`;
    printText += `QUARTERLY COMPLIANCE OVERVIEW:\n`;
    printText += `  Q1 (APR-JUN) : Target ${q1.target}, Completed ${q1.completed}, Pending ${q1.pending} (${q1.pct}%)\n`;
    printText += `  Q2 (JUL-SEP) : Target ${q2.target}, Completed ${q2.completed}, Pending ${q2.pending} (${q2.pct}%)\n`;
    printText += `  Q3 (OCT-DEC) : Target ${q3.target}, Completed ${q3.completed}, Pending ${q3.pending} (${q3.pct}%)\n`;
    printText += `  Q4 (JAN-MAR) : Target ${q4.target}, Completed ${q4.completed}, Pending ${q4.pending} (${q4.pct}%)\n`;
    printText += `==========================================================\n`;
    printText += `Secure spool date: ${new Date().toLocaleString()} | Terminal ID: VSP-ANNUAL-SSO\n`;

    const blob = new Blob([printText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ORACLE_PRINTANNUAL_2026.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 font-sans text-slate-950">
      
      {/* Search and Action Toolbar */}
      <div className="bg-[#dfebf0] border border-[#a2c1ca] p-2 flex flex-wrap items-center justify-between gap-3 p-1.5 select-none rounded-t-xs">
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-[#144d5a] flex items-center gap-1">
            <BarChart2 className="w-4 h-4 text-[#1a5b6c]" />
            ANNUAL TARGET METRIC OVERVIEW (FISCAL YEAR 2026-27)
          </span>

          <div className="relative">
            <input 
              type="text"
              placeholder="Find Month Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-[#a3c4cc] text-[#144d5a] text-xs pl-6 pr-2 py-0.5 font-mono w-44 rounded-xs outline-none focus:border-[#1a5b6c]"
            />
            <Search className="w-3.5 h-3.5 text-[#1a5b6c]/60 absolute left-1.5 top-1.5" />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="px-2.5 py-1 text-[10px] font-bold text-slate-800 bg-[#eaeaea] hover:bg-slate-350 bg-slate-200 border border-slate-400 rounded-xs cursor-pointer flex items-center gap-1 shadow-3xs"
            title="Download full fiscal year data"
            style={{ boxShadow: 'inset -1px -1px 0px rgba(0,0,0,0.2), inset 1px 1px 0px rgba(255,255,255,0.2)' }}
          >
            <Download className="w-3 h-3 text-emerald-800" />
            <span>EXPORT CSV</span>
          </button>

          <button
            onClick={handlePrintPlan}
            className="px-2.5 py-1 text-[10px] font-bold text-slate-800 bg-[#eaeaea] hover:bg-slate-350 bg-slate-200 border border-slate-400 rounded-xs cursor-pointer flex items-center gap-1 shadow-3xs"
            title="Spool Landscape layout print document"
            style={{ boxShadow: 'inset -1px -1px 0px rgba(0,0,0,0.2), inset 1px 1px 0px rgba(255,255,255,0.2)' }}
          >
            <Printer className="w-3 h-3 text-amber-800" />
            <span>PRINT REGISTER</span>
          </button>
        </div>
      </div>

      {/* Grid containing 12 Month Panels and Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* The 12 Month Table Row Matrix */}
        <div className="lg:col-span-3 border border-[#b6d0d7] rounded-sm bg-[#f6fafb] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-[#cedfe2] text-[#164855] text-[10.5px] uppercase font-bold tracking-wider border-b border-[#a8c6cb]">
                  <th className="p-2 border-r border-[#bacfd2] w-28">Month Node</th>
                  <th className="p-2 border-r border-[#bacfd2] text-right w-24">Target Count</th>
                  <th className="p-2 border-r border-[#bacfd2] text-right w-24">Completed</th>
                  <th className="p-2 border-r border-[#bacfd2] text-right w-24">Pending</th>
                  <th className="p-2">Completion Progress Indicator Bar</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#d4e4e6] text-[#164855]">
                {filteredRecords.map(rec => {
                  return (
                    <tr key={rec.month} className="hover:bg-[#eaf3f5] transition-colors font-medium text-[11px]">
                      
                      {/* Month Name */}
                      <td className="p-2 border-r border-[#d2e2e4] font-bold bg-[#e4eff1] text-slate-800 tracking-wide uppercase">
                        {rec.month}
                      </td>

                      {/* Target Count (Editable) */}
                      <td className="p-1 border-r border-[#d2e2e4]">
                        <input 
                          type="number"
                          value={rec.target}
                          onChange={(e) => handleUpdateRecord(rec.month, 'target', Number(e.target.value))}
                          className="w-full bg-transparent border border-transparent font-mono hover:border-[#1a5b6c]/40 focus:bg-white focus:border-[#1a5b6c] focus:outline-none px-1.5 py-0.5 font-bold text-right"
                        />
                      </td>

                      {/* Completed (Editable) */}
                      <td className="p-1 border-r border-[#d2e2e4]">
                        <input 
                          type="number"
                          value={rec.completed}
                          onChange={(e) => handleUpdateRecord(rec.month, 'completed', Number(e.target.value))}
                          className="w-full bg-transparent border border-transparent font-mono hover:border-[#1a5b6c]/40 focus:bg-white focus:border-[#1a5b6c] focus:outline-none px-1.5 py-0.5 font-bold text-right text-blue-900"
                        />
                      </td>

                      {/* Pending Replies */}
                      <td className="p-2 border-r border-[#d2e2e4] font-mono text-right font-bold text-rose-700 bg-red-50/10">
                        {rec.pending}
                      </td>

                      {/* Dynamic Visual Progress Bar */}
                      <td className="p-2">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-slate-205 h-3 bg-slate-200 rounded-sm overflow-hidden relative border border-slate-300">
                            <div 
                              className="bg-[#1a5b6c] h-full transition-all duration-300 border-r border-[#103e4b]"
                              style={{ width: `${Math.min(100, rec.percentage)}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10.5px] font-bold w-12 text-right text-slate-800">
                            {rec.percentage}%
                          </span>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quarterly & Annual Target Summary panels */}
        <div className="lg:col-span-1 space-y-3">
          
          {/* Cumulative Score Widget */}
          <div className="bg-[#1a5b6c] text-white p-3 rounded-sm border border-[#103e4b] space-y-1.5 shadow-sm text-center">
            <span className="text-[10px] font-mono font-bold tracking-widest block uppercase text-[#9ed3df]">ANNUAL AUDIT COMPLETION INDEX</span>
            <div className="text-3xl font-mono font-black">{totalPercentage}%</div>
            <div className="text-[10px] font-bold bg-[#103e4b]/45 p-1 rounded font-mono flex justify-between">
              <span>TGT: {totalTarget}</span>
              <span>CMP: {totalCompleted}</span>
              <span>PND: {totalPending}</span>
            </div>
          </div>

          {/* Detailed Quarterly Collapse List */}
          <div className="bg-white border border-[#b6d0d7] p-3 rounded-sm space-y-2.5">
            <span className="text-[11px] font-bold text-[#164855] uppercase tracking-wide border-b border-[#d4e4e6] pb-1 block">QUARTERLY LEDGER SUMMARY</span>
            
            {[
              { label: "Q1 Apr-Jun", stats: q1 },
              { label: "Q2 Jul-Sep", stats: q2 },
              { label: "Q3 Oct-Dec", stats: q3 },
              { label: "Q4 Jan-Mar", stats: q4 }
            ].map(qr => (
              <div key={qr.label} className="bg-[#f6fafb] p-2 border border-[#d2e2e4] rounded-sm text-[11px] space-y-1">
                <div className="flex justify-between font-bold text-slate-800 uppercase tracking-tight text-[10.5px]">
                  <span>{qr.label}</span>
                  <span className="text-[#1a5b6c] font-mono">{qr.stats.pct}% Complete</span>
                </div>
                
                {/* Horizontal mini progress bar */}
                <div className="w-full bg-slate-200 h-1.5 rounded-sm overflow-hidden mb-1.5">
                  <div 
                    className="bg-[#1a5b6c] h-full"
                    style={{ width: `${Math.min(100, qr.stats.pct)}%` }}
                  />
                </div>

                <div className="flex justify-between font-mono text-[10px] text-slate-500">
                  <span>Target: {qr.stats.target}</span>
                  <span className="text-emerald-800">Done: {qr.stats.completed}</span>
                  <span className="text-rose-800">Pend: {qr.stats.pending}</span>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
