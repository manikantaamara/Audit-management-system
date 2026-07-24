import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, Calculator, FileSpreadsheet, AlertOctagon, Download, CheckCircle, Search, Sparkles } from 'lucide-react';
import { AuditPara, AuditReport, Department } from '../types';

interface ReportsModuleProps {
  paras: AuditPara[];
  reports: AuditReport[];
  departments: Department[];
  activeMenu?: string;
}

export default function ReportsModule({ paras, reports, departments, activeMenu }: ReportsModuleProps) {
  const [activeReportType, setActiveReportType] = useState<'para_history' | 'directorate' | 'exceptions' | 'summary'>('para_history');

  useEffect(() => {
    if (!activeMenu) return;
    if (activeMenu === 'para_history') {
      setActiveReportType('para_history');
    } else if (activeMenu === 'para_history_dir' || activeMenu === 'dir_pending_summary' || activeMenu === 'dir_settled_memo' || activeMenu === 'dir_paras_period') {
      setActiveReportType('directorate');
    } else if (activeMenu === 'exception_dates') {
      setActiveReportType('exceptions');
    } else {
      setActiveReportType('summary');
    }
  }, [activeMenu]);
  
  // Search parameters for History table
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('');

  // Summarize stats
  const totalImplication = paras.reduce((sum, p) => sum + p.financialImplication, 0);
  const totalOutstanding = paras.filter(p => p.status !== 'Settled').length;
  const criticalCount = paras.filter(p => p.category === 'Critical').length;
  const settledCount = paras.filter(p => p.status === 'Settled').length;

  // Chart 1: Preparing Category Data
  const categoriesMap = { Critical: 0, Major: 0, Minor: 0 };
  paras.forEach(p => {
    if (categoriesMap[p.category] !== undefined) {
      categoriesMap[p.category] += 1;
    }
  });
  const pieChartData = [
    { name: 'Critical Exceptions', value: categoriesMap.Critical, color: '#dc2626' },
    { name: 'Major Variances', value: categoriesMap.Major, color: '#d97706' },
    { name: 'Minor Discrepancies', value: categoriesMap.Minor, color: '#1d4ed8' }
  ];

  // Chart 2: Department-wise Liability Sum
  const deptImplicationDataMap: Record<string, number> = {};
  paras.forEach(p => {
    const reportRef = reports.find(r => r.id === p.reportId);
    const deptName = reportRef ? reportRef.department : 'Internal Audit';
    deptImplicationDataMap[deptName] = (deptImplicationDataMap[deptName] || 0) + p.financialImplication;
  });
  const barchartData = Object.entries(deptImplicationDataMap).map(([name, implication]) => ({
    department: name.replace(' Department', '').replace(' Dept', '').substring(0, 16),
    'Implication (Lakhs)': Math.round(implication / 100000)
  }));

  const handleDownloadPDFSim = (titleStr: string) => {
    alert(`AIMS Report Generator:\n\nExecuting physical query on Visakhapatnam central node...\nStamping Digital Signatures via CVC Protocol v14...\nDownloaded "${titleStr.toUpperCase().replace(/ /g, '_')}_REPORT_2026.pdf" successfully.`);
  };

  const filteredParas = paras.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(historySearchTerm.toLowerCase()) || 
                          p.paraNo.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
                          p.description.toLowerCase().includes(historySearchTerm.toLowerCase());
    const matchesCategory = historyCategoryFilter === '' || p.category === historyCategoryFilter;
    const matchesStatus = historyStatusFilter === '' || p.status === historyStatusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div id="aims-reports-module" className="p-6 space-y-6 animate-fade-in font-sans">
      
      {/* Visual Analytics Quick Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-white border-l-4 border-red-650 border border-slate-200 border-l-red-600 p-4 rounded-sm shadow-2xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Monitored Liability</p>
              <h3 className="text-xl font-bold font-mono text-slate-800 mt-1">₹{(totalImplication / 100000).toFixed(2)} Lakhs</h3>
            </div>
            <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase">VSP_LIAB</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-semibold">Calculated from total audit exceptions</p>
        </div>

        <div className="bg-white border-l-4 border-amber-500 border border-slate-200 p-4 rounded-sm shadow-2xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Critical Outstanding Paras</p>
              <h3 className="text-xl font-bold font-mono text-slate-800 mt-1">{criticalCount} Paras</h3>
            </div>
            <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase">VIGIL</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-semibold">Immediate corrective responses requested</p>
        </div>

        <div className="bg-white border-l-4 border-indigo-950 border-l-blue-800 border border-slate-200 p-4 rounded-sm shadow-2xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Under Passive Review</p>
              <h3 className="text-xl font-bold font-mono text-slate-800 mt-1">{totalOutstanding - criticalCount} Active</h3>
            </div>
            <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase text-blue-900">UNDER_REV</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-semibold">Replies submitted, tracking in progress</p>
        </div>

        <div className="bg-white border-l-4 border-green-600 border border-slate-200 p-4 rounded-sm shadow-2xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Settled Memo Reports</p>
              <h3 className="text-xl font-bold font-mono text-slate-800 mt-1">{settledCount} Total</h3>
            </div>
            <span className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase">RESOLVED</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-semibold">Cleared of financial variances</p>
        </div>

      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recharts Pie Chart risk representation */}
        <div className="bg-white border border-slate-300 p-5 rounded-sm shadow-3xs flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider">Audit Paras Distribution by Severity</h4>
            <p className="text-[11px] text-slate-400 font-medium">Comparative percentage of critical, major, and minor audit findings</p>
          </div>
          <div className="h-56 my-3 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} finding(s)`} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center annotation */}
            <div className="absolute text-center">
              <span className="block text-2xl font-mono font-bold text-slate-800 leading-none">{paras.length}</span>
              <span className="text-[9px] font-bold uppercase text-slate-400">Ledger Paras</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 border-t pt-2.5 text-center text-[10px] font-mono">
            {pieChartData.map((e) => (
              <div key={e.name}>
                <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: e.color }} />
                <span className="text-slate-600 font-semibold">{e.name}: {e.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recharts Bar Chart department liabilities */}
        <div className="bg-white border border-slate-300 p-5 rounded-sm shadow-3xs flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider">Department-wise Financial Implications</h4>
            <p className="text-[11px] text-slate-400 font-medium">Aggregated total values involved in unresolved audit observations (₹ in Lakhs)</p>
          </div>
          <div className="h-56 my-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barchartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" tick={{ fontSize: 9 }} />
                <YAxis label={{ value: 'Lakhs (₹)', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 9 }} />
                <Tooltip formatter={(v) => `₹ ${v} Lakhs`} />
                <Bar dataKey="Implication (Lakhs)" fill="#1e3a8a">
                  {barchartData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={idx % 2 === 0 ? '#1e3a8a' : '#1d4ed8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="border-t pt-2.5 text-right">
            <span className="text-[10px] font-mono font-medium text-slate-400 leading-none">Database sequence: VSP_LEDGER_RISK_SCALE</span>
          </div>
        </div>

      </div>

      {/* Reports selector layout */}
      <div className="bg-white border border-slate-300 rounded-sm shadow-sm">
        <div className="bg-slate-100 border-b border-slate-200 p-3.5 flex flex-wrap gap-2 items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">EXECUTIVE GENERATION MATRIX</span>
          <div className="flex gap-1.5">
            <button
              id="reports-subtab-btn-history"
              onClick={() => setActiveReportType('para_history')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xs cursor-pointer transition-all ${
                activeReportType === 'para_history' ? 'bg-blue-800 text-white font-bold' : 'bg-slate-50 text-slate-700 border hover:bg-slate-200'
              }`}
            >
              Audit Para History
            </button>
            <button
              id="reports-subtab-btn-exceptions"
              onClick={() => setActiveReportType('exceptions')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xs cursor-pointer transition-all ${
                activeReportType === 'exceptions' ? 'bg-blue-800 text-white font-bold' : 'bg-slate-50 text-slate-700 border hover:bg-slate-200'
              }`}
            >
              Exception Reports
            </button>
            <button
              id="reports-subtab-btn-summary"
              onClick={() => setActiveReportType('summary')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xs cursor-pointer transition-all ${
                activeReportType === 'summary' ? 'bg-blue-800 text-white font-bold' : 'bg-slate-50 text-slate-700 border hover:bg-slate-200'
              }`}
            >
              Audit Summary Memo
            </button>
          </div>
        </div>

        <div className="p-5">
          {activeReportType === 'para_history' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="history-search-input"
                    type="text"
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                    placeholder="Search parameters, subjects or detailed descriptions..."
                    className="oracle-field-value w-full pl-9"
                  />
                </div>
                <select
                  id="history-cat-filter"
                  value={historyCategoryFilter}
                  onChange={(e) => setHistoryCategoryFilter(e.target.value)}
                  className="oracle-field-value text-xs py-1"
                >
                  <option value="">All Categories</option>
                  <option value="Critical">Critical Findings</option>
                  <option value="Major">Major Variances</option>
                  <option value="Minor">Minor Discrepancies</option>
                </select>
                <select
                  id="history-status-filter"
                  value={historyStatusFilter}
                  onChange={(e) => setHistoryStatusFilter(e.target.value)}
                  className="oracle-field-value text-xs py-1"
                >
                  <option value="">All Statuses</option>
                  <option value="Outstanding">Outstanding</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Settled">Settled Memos</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-3">Reference</th>
                      <th className="p-3">Observation Subject Area</th>
                      <th className="p-3">Severity Category</th>
                      <th className="p-3">Implication Amount</th>
                      <th className="p-3 font-mono">Mail Dak No</th>
                      <th className="p-3 text-right">Filing Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-slate-700">
                    {filteredParas.map((p) => (
                      <tr id={`history-row-${p.id}`} key={p.id} className="hover:bg-slate-50 transition-all font-medium">
                        <td className="p-3 font-mono font-bold text-blue-900">{p.paraNo}</td>
                        <td className="p-3">
                          <p className="font-bold text-slate-900 text-xs">{p.title}</p>
                          <p className="text-[11px] text-slate-500 leading-relaxed text-justify mt-1 truncate max-w-lg">{p.description}</p>
                        </td>
                        <td className="p-3 font-bold">
                          <span className={`inline-block px-2 py-0.5 rounded-sm text-[10px] ${
                            p.category === 'Critical' ? 'bg-red-50 text-red-700' :
                            p.category === 'Major' ? 'bg-amber-50 text-amber-700' :
                            'bg-blue-50 text-blue-700'
                          }`}>{p.category}</span>
                        </td>
                        <td className="p-3 font-mono font-bold text-[11px]">₹{p.financialImplication.toLocaleString('en-IN')}</td>
                        <td className="p-3 font-mono text-[11px] text-purple-800 font-semibold">{p.dakNo || 'N/A (Draft)'}</td>
                        <td className="p-3 text-right">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'Settled' ? 'bg-green-100 text-green-900' :
                            p.status === 'Under Review' ? 'bg-amber-100 text-amber-900' :
                            'bg-rose-100 text-rose-900'
                          }`}>{p.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xs border">
                <span className="text-[10px] font-mono leading-none text-slate-400">ACTIVE SEARCH COUNT: {filteredParas.length} RECORDS</span>
                <button
                  id="export-pdf-btn-history"
                  onClick={() => handleDownloadPDFSim("Full_VSP_Audit_History")}
                  className="bg-blue-800 hover:bg-blue-900 font-bold text-white text-[11px] px-3 py-1.5 rounded-xs flex items-center gap-1.5 cursor-pointer shadow-3xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Stellate PDF History Report
                </button>
              </div>
            </div>
          )}

          {activeReportType === 'exceptions' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 text-red-900 p-4 rounded flex items-start gap-3">
                <AlertOctagon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold">CRITICAL EXCEPTION ACTION LIST (UNDER ACTIVE VIGILANCE DIRECTIVES)</h4>
                  <p className="text-xs text-red-800 leading-relaxed mt-0.5">
                    The following high-value observations have breached the standard HOD response SLA of 14 working days. Financial implications exceed INR ₹10,00,000 without appropriate remedial settlements.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto bg-white border border-red-200 rounded shadow-sm">
                <table className="w-full text-left font-sans text-xs">
                  <thead>
                    <tr className="bg-red-50 border-b border-red-200 text-[10px] tracking-wider uppercase text-red-900 font-bold">
                      <th className="p-3">Reference No</th>
                      <th className="p-3">Critical Exception & Description</th>
                      <th className="p-3">Correlated DAK Seq</th>
                      <th className="p-3 text-right">Corporate Liability Amount</th>
                      <th className="p-3 text-right">Action Trigger</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-slate-800">
                    {paras.filter(p => p.category === 'Critical' && p.status !== 'Settled').map((ep) => (
                      <tr id={`exception-para-row-${ep.id}`} key={ep.id} className="hover:bg-red-50/20 transition-all">
                        <td className="p-3 font-mono font-bold text-red-900">
                          <span className="bg-red-100 px-2 py-0.5 rounded text-[10px] border border-red-200">{ep.paraNo}</span>
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-slate-900 text-xs">{ep.title}</p>
                          <p className="text-[11px] text-slate-505 text-slate-500 mt-1 max-w-xl text-justify">{ep.description}</p>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-purple-850">{ep.dakNo || 'Pending Sequence'}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900 text-xs text-red-750">
                          ₹{ep.financialImplication.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            id={`resolve-escalation-btn-${ep.id}`}
                            onClick={() => handleDownloadPDFSim(`Escalation_${ep.paraNo}`)}
                            className="bg-red-800 text-white text-[10px] font-bold font-mono px-2 py-1.5 rounded hover:bg-slate-900 cursor-pointer shadow-3xs transition-all whitespace-nowrap"
                          >
                            EXPORT ARBITRAGE WRIT
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeReportType === 'summary' && (
            <div className="max-w-xl mx-auto border border-blue-200 rounded p-6 bg-slate-50 font-sans space-y-6">
              
              <div className="text-center space-y-1">
                <h3 className="text-xs font-mono font-bold text-blue-900 tracking-widest uppercase">AUDIT SUMMARY MEMORANDUM</h3>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">RINL Visakhapatnam Internal Audit Wing</h2>
                <div className="h-0.5 bg-gradient-to-r from-transparent via-yellow-500 to-transparent my-3.5" />
              </div>

              <div id="summary-memo-body" className="space-y-3.5 text-xs text-slate-700 leading-relaxed text-justify">
                <p>
                  <strong>Ref Protocol No:</strong> VSP/AUD/SUM/2026/099-B
                </p>
                <p>
                  This official memorandum certifies the active aggregated parameters of outstanding audits running on current Visakhapatnam Steel Plant operations. All data has been verified by the Chief Audit Executive and synchronized with central Oracle Relational Ledger catalogs.
                </p>
                
                <div className="bg-white border p-4 space-y-2 rounded-xs font-mono text-[11px]">
                  <div className="flex justify-between border-b pb-1">
                    <span>Total Formulated Audit Plans:</span>
                    <span className="font-bold">{reports.length} Reports</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span>Active Monitored Paras Count:</span>
                    <span className="font-bold">{paras.length} Paras</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span>Total Unsecured Risk Exposure:</span>
                    <span className="font-bold text-red-600">₹{totalImplication.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Fully Settled Audits:</span>
                    <span className="font-bold text-green-700">{settledCount} Settled</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 italic">
                  Note: Departmental replies are actively under advisory observation, and settlements are updated in 24-hour cycles.
                </p>
              </div>

              <div className="pt-4 border-t border-dashed border-slate-200 text-center flex flex-col sm:flex-row justify-center gap-3">
                <button
                  id="memo-export-pdf"
                  onClick={() => handleDownloadPDFSim("Audit_Summary_Memorandum")}
                  className="bg-blue-800 hover:bg-blue-900 text-white text-[11px] font-bold px-4 py-2 rounded-xs cursor-pointer shadow-3xs"
                >
                  Download Certified Memo PDF
                </button>
              </div>

            </div>
          )}
        </div>
      </div>

    </div>
  );
}
