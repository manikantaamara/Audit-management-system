import React, { useState } from 'react';
import { Plus, Trash2, Edit, Save, Download, Printer, Search, ArrowLeft, ArrowRight, RefreshCw, HelpCircle } from 'lucide-react';

export interface MonthlyPlanRecord {
  id: string;
  weekNo: string;
  plannedReplies: number;
  completedReplies: number;
  pendingReplies: number;
  status: 'Completed' | 'Pending' | 'Delayed';
}

interface MonthlyPlanningProps {
  monthlyData: Record<string, MonthlyPlanRecord[]>;
  onSaveData: (monthYearKey: string, records: MonthlyPlanRecord[]) => void;
}

const MONTHS = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
];

const YEARS = ["2026", "2027", "2028"];

export default function MonthlyPlanning({ monthlyData, onSaveData }: MonthlyPlanningProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>("MAY");
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const monthYearKey = `${selectedMonth}_${selectedYear}`;

  // Get active month's data, or fallback to default weeks
  const getActiveRecords = (): MonthlyPlanRecord[] => {
    if (monthlyData[monthYearKey]) {
      return monthlyData[monthYearKey];
    }
    // Default mock planning layout for empty slots
    return [
      { id: 'm1', weekNo: 'Week 1', plannedReplies: 12, completedReplies: 10, pendingReplies: 2, status: 'Pending' },
      { id: 'm2', weekNo: 'Week 2', plannedReplies: 15, completedReplies: 15, pendingReplies: 0, status: 'Completed' },
      { id: 'm3', weekNo: 'Week 3', plannedReplies: 10, completedReplies: 4, pendingReplies: 6, status: 'Delayed' },
      { id: 'm4', weekNo: 'Week 4', plannedReplies: 8, completedReplies: 2, pendingReplies: 6, status: 'Pending' }
    ];
  };

  const records = getActiveRecords();

  const handleUpdateRecord = (id: string, updates: Partial<MonthlyPlanRecord>) => {
    const updated = records.map(rec => {
      if (rec.id === id) {
        const planned = updates.plannedReplies !== undefined ? Number(updates.plannedReplies) : rec.plannedReplies;
        const completed = updates.completedReplies !== undefined ? Number(updates.completedReplies) : rec.completedReplies;
        const pending = Math.max(0, planned - completed);
        
        let status: 'Completed' | 'Pending' | 'Delayed' = 'Pending';
        if (completed >= planned && planned > 0) {
          status = 'Completed';
        } else if (completed === 0 && planned > 0) {
          status = 'Delayed';
        } else {
          status = 'Pending';
        }

        return {
          ...rec,
          ...updates,
          plannedReplies: planned,
          completedReplies: completed,
          pendingReplies: pending,
          status: updates.status || status
        };
      }
      return rec;
    });
    onSaveData(monthYearKey, updated);
  };

  const handleAddRow = () => {
    const nextWeekIndex = records.length + 1;
    const newRec: MonthlyPlanRecord = {
      id: `m-new-${Date.now()}`,
      weekNo: `Week ${nextWeekIndex}`,
      plannedReplies: 10,
      completedReplies: 0,
      pendingReplies: 10,
      status: 'Pending'
    };
    onSaveData(monthYearKey, [...records, newRec]);
  };

  const handleDeleteRow = (id: string) => {
    if (records.length <= 1) {
      alert("ORA-02292: Integrity constraint violated - cannot delete all planning block records.");
      return;
    }
    if (confirm("Are you sure you want to delete this planning week row?")) {
      const filtered = records.filter(rec => rec.id !== id);
      // Re-number week sequence
      const resequenced = filtered.map((rec, index) => ({
        ...rec,
        weekNo: rec.weekNo.startsWith("Week ") ? `Week ${index + 1}` : rec.weekNo
      }));
      onSaveData(monthYearKey, resequenced);
    }
  };

  const filteredRecords = records.filter(rec => 
    rec.weekNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rec.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Dynamic Totals Calculation
  const totalPlanned = filteredRecords.reduce((sum, rec) => sum + rec.plannedReplies, 0);
  const totalCompleted = filteredRecords.reduce((sum, rec) => sum + rec.completedReplies, 0);
  const totalPending = filteredRecords.reduce((sum, rec) => sum + rec.pendingReplies, 0);
  const completionPercentage = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;

  // Export to CSV
  const handleExportCSV = () => {
    const header = "Week No,Planned Replies,Completed,Pending,Status\n";
    const rows = records.map(rec => 
      `${rec.weekNo},${rec.plannedReplies},${rec.completedReplies},${rec.pendingReplies},${rec.status}`
    ).join("\n");
    
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ORACLE_PLANNING_${monthYearKey}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Formatted Plaintext Plan
  const handlePrintPlan = () => {
    let printText = `==========================================================\n`;
    printText += `       RASHTRIYA ISPAT NIGAM LIMITED (RINL) - AUDIT PLANNING\n`;
    printText += `               MONTHLY COMPLIANCE SCHEDULE PLAN\n`;
    printText += `==========================================================\n`;
    printText += `PERIOD: ${selectedMonth} ${selectedYear}       STORE CODE: ORA-WEEKPLAN-M\n`;
    printText += `----------------------------------------------------------\n`;
    printText += `WEEK NO    | PLANNED  | COMPLETED | PENDING | STATUS\n`;
    printText += `-----------|----------|-----------|---------|-------------\n`;
    records.forEach(rec => {
      const wk = rec.weekNo.padEnd(10);
      const pl = String(rec.plannedReplies).padStart(8);
      const co = String(rec.completedReplies).padStart(9);
      const pe = String(rec.pendingReplies).padStart(7);
      const st = rec.status.padEnd(11);
      printText += `${wk} | ${pl} | ${co} | ${pe} | ${st}\n`;
    });
    printText += `----------------------------------------------------------\n`;
    printText += `TOTALS     | ${String(totalPlanned).padStart(8)} | ${String(totalCompleted).padStart(9)} | ${String(totalPending).padStart(7)} | ${completionPercentage}% COMPLETED\n`;
    printText += `==========================================================\n`;
    printText += `Secure spool date: ${new Date().toLocaleString()} | Terminal ID: VSP-PLAN-SSO\n`;

    const blob = new Blob([printText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ORACLE_PRINTPLAN_${monthYearKey}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3 font-sans text-slate-950">
      
      {/* Month Year Selector Toolbar */}
      <div className="bg-[#dfebf0] border border-[#a2c1ca] p-2 flex flex-wrap items-center justify-between gap-3 p-1.5 select-none rounded-t-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] font-bold text-[#1a5b6c] uppercase tracking-wide">Month Code:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-yellow-50 border-2 border-[#1a5b6c]/40 text-xs font-mono font-bold px-2 py-0.5 focus:outline-none focus:border-[#1a5b6c] bg-amber-50"
              style={{ boxShadow: 'inset 1px 1px 1px rgba(0,0,0,0.1)' }}
            >
              {MONTHS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-[11px] font-bold text-[#1a5b6c] uppercase tracking-wide">Plan Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-yellow-50 border-2 border-[#1a5b6c]/40 text-xs font-mono font-bold px-2 py-0.5 focus:outline-none focus:border-[#1a5b6c] bg-amber-50"
              style={{ boxShadow: 'inset 1px 1px 1px rgba(0,0,0,0.1)' }}
            >
              {YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <input 
              type="text"
              placeholder="Find Plan Record..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-[#a3c4cc] text-slate-900 text-xs pl-6 pr-2 py-0.5 font-mono w-44 rounded-xs outline-none focus:border-[#1a5b6c]"
            />
            <Search className="w-3.5 h-3.5 text-[#1a5b6c]/60 absolute left-1.5 top-1.5" />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleAddRow}
            className="px-2 py-1 text-[10px] font-bold text-white bg-[#1a5b6c] hover:bg-[#154a58] border border-[#103e4b] rounded-xs cursor-pointer flex items-center gap-1 shadow-3xs"
            title="Insert Week Row into Matrix"
            style={{ boxShadow: 'inset -1px -1px 0px rgba(0,0,0,0.2), inset 1px 1px 0px rgba(255,255,255,0.2)' }}
          >
            <Plus className="w-3 h-3" />
            <span>ADD ROW</span>
          </button>
          
          <button
            onClick={handleExportCSV}
            className="px-2 py-1 text-[10px] font-bold text-slate-800 bg-[#eaeaea] hover:bg-slate-350 bg-slate-200 border border-slate-400 rounded-xs cursor-pointer flex items-center gap-1 shadow-3xs"
            title="Download Plan in Excel CSV"
            style={{ boxShadow: 'inset -1px -1px 0px rgba(0,0,0,0.2), inset 1px 1px 0px rgba(255,255,255,0.2)' }}
          >
            <Download className="w-3 h-3 text-emerald-800" />
            <span>EXPORT CSV</span>
          </button>

          <button
            onClick={handlePrintPlan}
            className="px-2 py-1 text-[10px] font-bold text-slate-800 bg-[#eaeaea] hover:bg-slate-350 bg-slate-200 border border-slate-400 rounded-xs cursor-pointer flex items-center gap-1 shadow-3xs"
            title="Print Planning Spool"
            style={{ boxShadow: 'inset -1px -1px 0px rgba(0,0,0,0.2), inset 1px 1px 0px rgba(255,255,255,0.2)' }}
          >
            <Printer className="w-3 h-3 text-amber-800" />
            <span>PRINT PLAN</span>
          </button>
        </div>
      </div>

      {/* Planning Matrix Rows Grid */}
      <div className="overflow-x-auto border-x border-[#b6d0d7] border-b bg-[#f6fafb]">
        <table className="w-full text-left font-sans text-xs border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-[#cedfe2] text-[#164855] text-[10.5px] uppercase font-bold tracking-wider border-b border-[#a8c6cb]">
              <th className="p-2 border-r border-[#bacfd2] text-center w-16">No</th>
              <th className="p-2 border-r border-[#bacfd2] w-36">Work Week Code</th>
              <th className="p-2 border-r border-[#bacfd2] w-32">Planned Replies</th>
              <th className="p-2 border-r border-[#bacfd2] w-32">Completed Replies</th>
              <th className="p-2 border-r border-[#bacfd2] w-28">Pending (Diff)</th>
              <th className="p-2 border-r border-[#bacfd2] w-32 text-center">Status Flag</th>
              <th className="p-2 text-center w-20">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#d4e4e6]">
            {filteredRecords.map((rec, index) => {
              // Status Badge styling
              let statusBg = 'bg-amber-100 text-amber-900 border-amber-350';
              if (rec.status === 'Completed') {
                statusBg = 'bg-emerald-150 text-emerald-950 border-emerald-350 bg-emerald-100';
              } else if (rec.status === 'Delayed') {
                statusBg = 'bg-rose-150 text-rose-950 border-rose-350 bg-rose-100';
              }

              return (
                <tr key={rec.id} className="hover:bg-[#eaf3f5] transition-colors font-medium text-slate-800 text-[11px]">
                  
                  {/* Row Serial */}
                  <td className="p-2 text-center border-r border-[#d2e2e4] font-mono font-bold text-slate-600 bg-[#e4eff1]">
                    {index + 1}
                  </td>

                  {/* Week Code */}
                  <td className="p-1 border-r border-[#d2e2e4]">
                    <input 
                      type="text"
                      value={rec.weekNo}
                      onChange={(e) => handleUpdateRecord(rec.id, { weekNo: e.target.value })}
                      className="w-full bg-transparent border border-transparent font-bold hover:border-[#1a5b6c]/40 focus:bg-white focus:border-[#1a5b6c] focus:outline-none px-1.5 py-0.5 shrink-0"
                    />
                  </td>

                  {/* Planned */}
                  <td className="p-1 border-r border-[#d2e2e4]">
                    <input 
                      type="number"
                      value={rec.plannedReplies}
                      onChange={(e) => handleUpdateRecord(rec.id, { plannedReplies: Number(e.target.value) })}
                      className="w-full bg-transparent border border-transparent font-mono hover:border-[#1a5b6c]/40 focus:bg-white focus:border-[#1a5b6c] focus:outline-none px-1.5 py-0.5 shrink-0 text-right font-bold"
                    />
                  </td>

                  {/* Completed */}
                  <td className="p-1 border-r border-[#d2e2e4]">
                    <input 
                      type="number"
                      value={rec.completedReplies}
                      onChange={(e) => handleUpdateRecord(rec.id, { completedReplies: Number(e.target.value) })}
                      className="w-full bg-transparent border border-transparent font-mono hover:border-[#1a5b6c]/40 focus:bg-white focus:border-[#1a5b6c] focus:outline-none px-1.5 py-0.5 shrink-0 text-right font-bold text-slate-900"
                    />
                  </td>

                  {/* Pending Difference flag */}
                  <td className="p-2 border-r border-[#d2e2e4] text-right font-mono font-bold text-red-700 bg-red-50/20">
                    {rec.pendingReplies}
                  </td>

                  {/* Status Badges */}
                  <td className="p-1 border-r border-[#d2e2e4]">
                    <div className="flex items-center justify-center p-0.5">
                      <span className={`px-2 py-0.5 rounded-xs text-[9.5px] uppercase font-sans font-bold border ${statusBg} select-none block w-24 text-center shadow-3xs`}>
                        {rec.status}
                      </span>
                    </div>
                  </td>

                  {/* Action purge button */}
                  <td className="p-1 text-center">
                    <button
                      onClick={() => handleDeleteRow(rec.id)}
                      className="p-1 text-rose-700 hover:text-white hover:bg-rose-805 hover:bg-rose-700 rounded-sm cursor-pointer transition-colors"
                      title="Purge planning row record"
                    >
                      <Trash2 className="w-3.5 h-3.5 mx-auto" />
                    </button>
                  </td>

                </tr>
              );
            })}
          </tbody>

          {/* Grid Calculations Aggregate total banner */}
          <tfoot>
            <tr className="bg-[#dfebf0] border-t-2 border-[#1a5b6c] text-[#164855] text-[11px] font-bold">
              <td colSpan={2} className="p-2 text-right border-r border-[#bacfd2] uppercase tracking-wide">
                Aggregate Sum / Completion:
              </td>
              <td className="p-2 text-right border-r border-[#bacfd2] font-mono text-xs">{totalPlanned}</td>
              <td className="p-2 text-right border-r border-[#bacfd2] font-mono text-xs text-blue-950">{totalCompleted}</td>
              <td className="p-2 text-right border-r border-[#bacfd2] font-mono text-xs text-rose-900">{totalPending}</td>
              <td className="p-2 border-r border-[#bacfd2] text-center font-mono">
                <div className="flex items-center justify-center gap-1.5 bg-[#1a5b6c]/10 px-2 py-0.5 rounded text-[10px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1a5b6c] animate-ping" />
                  <span>{completionPercentage}% INDEXED</span>
                </div>
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
