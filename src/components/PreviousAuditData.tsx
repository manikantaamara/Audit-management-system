import React, { useState, useMemo } from 'react';
import { 
  Calendar, Layers, Filter, Search, Download, FileSpreadsheet, Eye, 
  FileText, ArrowUpRight, History, Printer, ChevronLeft, ChevronRight,
  Info, Clock, ShieldCheck, CheckCircle2, AlertTriangle, AlertCircle, RefreshCcw
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Type definitions for Previous Audits
export interface PreviousAuditRecord {
  id: string; // Audit sequence code
  deptId: string; // Exactly 6 digits
  deptName: string;
  deptHead: string;
  auditType: 'Monthly' | 'Half-Yearly' | 'Annual';
  auditDate: string;
  auditor: string;
  status: 'Completed' | 'Draft Clear' | 'Under Review';
  financialYear: '2023-24' | '2024-25' | '2025-26' | '2026-27';
  findingsCount: number;
}

// Initial robust historical registry (Past 3 years + current rolling)
const INITIAL_HISTORICAL_REGISTRY: PreviousAuditRecord[] = [
  {
    id: 'RINL-AUD-2023-101',
    deptId: '100001',
    deptName: 'Safety Department',
    deptHead: 'Shri S. Raghavan',
    auditType: 'Annual',
    auditDate: '2023-08-14',
    auditor: 'Smt. P. Lakshmi',
    status: 'Completed',
    financialYear: '2023-24',
    findingsCount: 4
  },
  {
    id: 'RINL-AUD-2023-102',
    deptId: '100002',
    deptName: 'Production Department',
    deptHead: 'Shri V. K. Sharma',
    auditType: 'Monthly',
    auditDate: '2023-09-10',
    auditor: 'Shri K. Somasekhar',
    status: 'Completed',
    financialYear: '2023-24',
    findingsCount: 7
  },
  {
    id: 'RINL-AUD-2024-201',
    deptId: '100003',
    deptName: 'Quality Assurance Department',
    deptHead: 'Dr. A. K. Banerjee',
    auditType: 'Half-Yearly',
    auditDate: '2024-11-20',
    auditor: 'Smt. P. Lakshmi',
    status: 'Completed',
    financialYear: '2024-25',
    findingsCount: 3
  },
  {
    id: 'RINL-AUD-2024-202',
    deptId: '100004',
    deptName: 'Maintenance Department',
    deptHead: 'Shri M. N. Rao',
    auditType: 'Annual',
    auditDate: '2024-12-05',
    auditor: 'Shri J.C. Bose',
    status: 'Completed',
    financialYear: '2024-25',
    findingsCount: 9
  },
  {
    id: 'RINL-AUD-2025-301',
    deptId: '100005',
    deptName: 'Stores Department',
    deptHead: 'Shri P. Vasubabu',
    auditType: 'Annual',
    auditDate: '2025-06-04',
    auditor: 'Smt. P. Lakshmi',
    status: 'Completed',
    financialYear: '2025-26',
    findingsCount: 2
  },
  {
    id: 'RINL-AUD-2025-302',
    deptId: '100006',
    deptName: 'Utilities Department',
    deptHead: 'Shri D. K. Sahoo',
    auditType: 'Monthly',
    auditDate: '2025-10-15',
    auditor: 'Shri K. Somasekhar',
    status: 'Completed',
    financialYear: '2025-26',
    findingsCount: 5
  },
  {
    id: 'RINL-AUD-2025-303',
    deptId: '100007',
    deptName: 'Coke Ovens Department',
    deptHead: 'Dr. N.V. Saiy',
    auditType: 'Half-Yearly',
    auditDate: '2025-11-02',
    auditor: 'Dr. N.V. Saiy',
    status: 'Completed',
    financialYear: '2025-26',
    findingsCount: 11
  },
  {
    id: 'RINL-AUD-2026-401',
    deptId: '100002',
    deptName: 'Production Department',
    deptHead: 'Shri V. K. Sharma',
    auditType: 'Monthly',
    auditDate: '2026-04-12',
    auditor: 'Shri K. Somasekhar',
    status: 'Completed',
    financialYear: '2026-27',
    findingsCount: 6
  },
  {
    id: 'RINL-AUD-2026-402',
    deptId: '100001',
    deptName: 'Safety Department',
    deptHead: 'Shri S. Raghavan',
    auditType: 'Half-Yearly',
    auditDate: '2026-05-18',
    auditor: 'Smt. P. Lakshmi',
    status: 'Completed',
    financialYear: '2026-27',
    findingsCount: 3
  }
];

export default function PreviousAuditData() {
  const [records, setRecords] = useState<PreviousAuditRecord[]>(INITIAL_HISTORICAL_REGISTRY);
  
  // Year selector & Filter states
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<string>('All');
  const [auditTypeFilter, setAuditTypeFilter] = useState<string>('All');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Detail interaction states
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<PreviousAuditRecord | null>(null);
  const [historyTrailRecord, setHistoryTrailRecord] = useState<PreviousAuditRecord | null>(null);
  
  // Pagination & Sorting states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;
  const [sortField, setSortField] = useState<string>('auditDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Set selectors lists dynamically based on unique registry data
  const availableFinancialYears = ['All', '2023-24', '2024-25', '2025-26', '2026-27'];
  const availableDepts = [
    { id: 'All', name: 'All Departments' },
    { id: '100001', name: '100001 - Safety' },
    { id: '100002', name: '100002 - Production' },
    { id: '100003', name: '100003 - Quality Assurance' },
    { id: '100004', name: '100004 - Maintenance' },
    { id: '100005', name: '100005 - Stores' },
    { id: '100006', name: '100006 - Utilities' },
    { id: '100007', name: '100007 - Coke Ovens' }
  ];

  // Filtering Logic
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      const matchYear = selectedFinancialYear === 'All' || rec.financialYear === selectedFinancialYear;
      const matchType = auditTypeFilter === 'All' || rec.auditType === auditTypeFilter;
      const matchDept = deptFilter === 'All' || rec.deptId === deptFilter;
      const matchSearch = searchQuery.trim() === '' || 
        rec.deptId.includes(searchQuery) ||
        rec.deptName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.auditor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.id.toLowerCase().includes(searchQuery.toLowerCase());
        
      return matchYear && matchType && matchDept && matchSearch;
    }).sort((a: any, b: any) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [records, selectedFinancialYear, auditTypeFilter, deptFilter, searchQuery, sortField, sortDirection]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRecords, currentPage]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  // Export Excel functionally (generates mock TSV and opens downloads)
  const handleExportExcel = () => {
    let csvContent = 'data:text/tsv;charset=utf-8,';
    csvContent += 'Audit ID\tDept ID\tDept Name\tDept Head\tAudit Type\tAudit Date\tAuditor\tStatus\tFinancial Year\n';
    
    filteredRecords.forEach(r => {
      csvContent += `${r.id}\t${r.deptId}\t${r.deptName}\t${r.deptHead}\t${r.auditType}\t${r.auditDate}\t${r.auditor}\t${r.status}\t${r.financialYear}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AIMS_Previous_Audits_Export.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF with autoTable
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('RASHTRIYA ISPAT NIGAM LIMITED - VISAKHAPATNAM STEEL PLANT', 14, 15);
    doc.setFontSize(11);
    doc.text('Internal Audit Division - Previous Audit Data Master Archive', 14, 21);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated On: 2026-06-04 | User Context: HOD Executive Client`, 14, 27);
    doc.text(`Filter Parameters: FY: ${selectedFinancialYear} | Type: ${auditTypeFilter} | Count: ${filteredRecords.length} Audits`, 14, 32);
    
    const tableHeaders = [['Audit ID', 'Dept ID', 'Department Name', 'Audit Type', 'Audit Date', 'Auditor', 'Status', 'FY']];
    const tableData = filteredRecords.map(r => [
      r.id, r.deptId, r.deptName, r.auditType, r.auditDate, r.auditor, r.status, r.financialYear
    ]);

    autoTable(doc, {
      startY: 36,
      head: tableHeaders,
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        2: { cellWidth: 40 }
      }
    });

    doc.save('AIMS_Previous_Audits_Registry.pdf');
  };

  const handleDownloadReportPDF = (record: PreviousAuditRecord) => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('RASHTRIYA ISPAT NIGAM LIMITED - VISAKHAPATNAM STEEL PLANT', 14, 18);
    doc.setFontSize(11);
    doc.text(`INTERNAL AUDIT REPORT: ${record.id}`, 14, 24);
    doc.line(14, 26, 196, 26);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Audit Meta Context:', 14, 34);
    doc.setFont('helvetica', 'normal');
    doc.text(`Department ID: ${record.deptId}`, 14, 40);
    doc.text(`Department Name: ${record.deptName}`, 14, 45);
    doc.text(`Department Head: ${record.deptHead}`, 14, 50);
    doc.text(`Financial Year: ${record.financialYear}`, 14, 55);
    doc.text(`Audit Typology: ${record.auditType}`, 14, 60);
    doc.text(`Assigned Auditor: ${record.auditor}`, 14, 65);
    doc.text(`Status: ${record.status}`, 14, 70);
    doc.text(`Actual Exec Date: ${record.auditDate}`, 14, 75);

    doc.setFont('helvetica', 'bold');
    doc.text('Audit Executive Digest & Non-Conformity Findings Table:', 14, 85);
    doc.setFont('helvetica', 'normal');
    
    const findings = [
      [`RINL-PARA-${record.deptId}-01`, 'Operational safety logging delays beyond 24-hr threshold window.', 'Category A - Major', 'Pending Action Area'],
      [`RINL-PARA-${record.deptId}-02`, 'VSP Core statutory training updates mismatch with biometric clock logs.', 'Category B - Minor', 'Remediation Under Review'],
      [`RINL-PARA-${record.deptId}-03`, 'Asset ledger tagging discrepancy in auxiliary storage warehouses.', 'Category B - Minor', 'Cleared in Draft Phase']
    ];

    autoTable(doc, {
      startY: 90,
      head: [['Para Reference Code', 'Non-Conformity Observation Detail', 'Severity Category', 'Current Settlement Status']],
      body: findings,
      theme: 'grid',
      headStyles: { fillColor: [4, 120, 87], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 8 }
    });

    doc.setFontSize(8);
    doc.text('Authorized signatory validator signature verified automatically via RINL-AIMS Node 77.', 14, 140);
    doc.save(`AIMS_Report_${record.id}.pdf`);
  };

  return (
    <div className="flex-1 bg-slate-50 p-4 space-y-4 font-sans select-none" id="previous-audits-view">
      
      {/* Page Header and Breadcrumb */}
      <div className="border-b border-slate-200 pb-3">
        <nav className="text-[11px] font-semibold text-slate-500 font-mono mb-1">
          Home &gt; Audit Planning &gt; Schedule Planning &gt; <span className="text-blue-900">Previous Audit Data</span>
        </nav>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 bg-blue-900 rounded-2xs" />
            <h1 className="text-lg font-black uppercase text-slate-800 tracking-tight">Previous Audit Data Registry</h1>
          </div>
          <span className="text-xs bg-blue-900 text-yellow-300 border border-blue-950 font-bold font-mono px-2.5 py-1 rounded shadow-3xs uppercase">
            Internal Audit Division
          </span>
        </div>
      </div>

      {/* Main High Information Density Work Layout */}
      <div className="grid grid-cols-12 gap-4">
        
        {/* Left Side Panel: Oracle Form Filters */}
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          <div className="bg-white border border-slate-300 rounded-sm shadow-2xs overflow-hidden">
            <div className="bg-[#1e3a8a] text-white px-3 py-2 flex items-center gap-1.5 border-b border-blue-950">
              <Filter className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-bold uppercase tracking-wider font-mono">Form Filter Console</span>
            </div>
            
            <div className="p-3.5 space-y-3.5 text-xs">
              
              {/* Financial Year Selector Component */}
              <div>
                <label className="block text-[10.5px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                  Financial Year:
                </label>
                <div className="grid grid-cols-2 gap-1" id="rolling-fy-tabs">
                  {availableFinancialYears.map(year => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => { setSelectedFinancialYear(year); setCurrentPage(1); }}
                      className={`py-1.5 rounded-sm font-semibold text-center border font-mono transition-all text-[11px] cursor-pointer ${
                        selectedFinancialYear === year 
                          ? 'bg-blue-900 text-white border-blue-950 shadow-3xs' 
                          : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audit Type selection */}
              <div>
                <label htmlFor="form-type-select" className="block text-[10.5px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Audit Type Options:
                </label>
                <select
                  id="form-type-select"
                  value={auditTypeFilter}
                  onChange={(e) => { setAuditTypeFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-semibold rounded-sm focus:ring-1 focus:ring-blue-600 text-slate-700"
                >
                  <option value="All">All Types</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Half-Yearly">Half-Yearly</option>
                  <option value="Annual">Annual</option>
                </select>
              </div>

              {/* Department selection */}
              <div>
                <label htmlFor="form-dept-select" className="block text-[10.5px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Target Department:
                </label>
                <select
                  id="form-dept-select"
                  value={deptFilter}
                  onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-slate-50 border border-slate-300 p-2 text-xs font-bold font-mono rounded-sm focus:ring-1 focus:ring-blue-600 text-slate-700"
                >
                  {availableDepts.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Search tool block */}
              <div>
                <label htmlFor="form-search-input" className="block text-[10.5px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Search keyword:
                </label>
                <div className="relative">
                  <input
                    id="form-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    placeholder="Search Auditor, Case ID..."
                    className="w-full pl-7 pr-2.5 py-1.5 bg-slate-50 border border-slate-300 text-xs rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-700 font-semibold"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Reset controls */}
              <button
                id="reset-form-filters-btn"
                onClick={() => {
                  setSelectedFinancialYear('All');
                  setAuditTypeFilter('All');
                  setDeptFilter('All');
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-300 py-1.5 rounded-sm font-semibold uppercase tracking-wider text-[10px] text-slate-700 transition items-center justify-center flex gap-1 cursor-pointer"
              >
                <RefreshCcw className="w-3 h-3" />
                Clear Filters
              </button>

            </div>
          </div>

          {/* Quick Help Meta Card */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-sm text-[11px] leading-relaxed text-blue-800 font-mono space-y-1">
            <span className="font-extrabold uppercase text-blue-900 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              ARCHIVE VALIDATION
            </span>
            <p>
              In accordance with Division Code Sec 18, historical data for previous three financial years is protected against revision. Any amendment requires HOD authorization keys.
            </p>
          </div>
        </aside>

        {/* Right Side Panel: Main Records Grid */}
        <section className="col-span-12 lg:col-span-9 space-y-4">
          
          {/* Controls Bar & Counters */}
          <div className="bg-white border border-slate-300 rounded-sm p-3 shadow-2xs flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="text-xs font-mono font-bold text-slate-700">
              Showing <span className="text-blue-900 font-black">{filteredRecords.length}</span> records resolved under selected node index
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                id="prev-audits-excel-export-btn"
                onClick={handleExportExcel}
                className="bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-[10.5px] uppercase tracking-wider px-3 py-1.5 rounded-sm border border-emerald-900 transition flex items-center gap-1 shadow-3xs cursor-pointer"
                title="Export TSV formatted spreadsheet"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Export Excel
              </button>

              <button
                id="prev-audits-pdf-export-btn"
                onClick={handleExportPDF}
                className="bg-[#1e3a8a] hover:bg-blue-950 text-white font-bold text-[10.5px] uppercase tracking-wider px-3 py-1.5 rounded-sm border border-blue-900 transition flex items-center gap-1 shadow-3xs cursor-pointer"
                title="Download consolidated PDF registry report"
              >
                <Printer className="w-3.5 h-3.5" />
                Export PDF
              </button>
            </div>
          </div>

          {/* Records High Density Grid */}
          <div className="bg-white border border-slate-300 rounded-sm shadow-2xs overflow-x-auto">
            <table className="w-full text-left border-collapse" id="previous-audits-table-grid">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-[10.5px] font-black uppercase text-slate-700 tracking-wider">
                  <th className="p-2.5 font-mono cursor-pointer hover:bg-slate-200" onClick={() => handleSort('deptId')}>
                    Dept ID {sortField === 'deptId' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="p-2.5 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('deptName')}>
                    Department Name {sortField === 'deptName' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="p-2.5">Dept Head</th>
                  <th className="p-2.5">Audit Type</th>
                  <th className="p-2.5 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('auditDate')}>
                    Audit Date {sortField === 'auditDate' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="p-2.5">Auditor</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 font-mono">FY</th>
                  <th className="p-2.5 text-right w-[20%]">Actions Grid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400 font-mono italic">
                      No past audit records matched current filter context.
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map(record => (
                    <tr key={record.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="p-2.5 font-mono font-bold text-slate-800">{record.deptId}</td>
                      <td className="p-2.5 font-bold text-slate-900">{record.deptName}</td>
                      <td className="p-2.5 text-slate-700">{record.deptHead}</td>
                      <td className="p-2.5">
                        <span className={`px-1.5 py-0.5 rounded-full font-extrabold text-[9px] uppercase border ${
                          record.auditType === 'Annual' 
                            ? 'bg-purple-950 text-purple-400 border-purple-900' 
                            : record.auditType === 'Half-Yearly'
                            ? 'bg-blue-950 text-blue-400 border-blue-900'
                            : 'bg-slate-800 text-slate-350 border-slate-700'
                        }`}>
                          {record.auditType}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-slate-650">{record.auditDate}</td>
                      <td className="p-2.5 text-slate-800 font-semibold">{record.auditor}</td>
                      <td className="p-2.5">
                        <span className="text-green-700 font-bold flex items-center gap-1 text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                          {record.status}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-slate-500 font-bold">{record.financialYear}</td>
                      <td className="p-2 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedRecordForDetail(record)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-[10px] px-2 py-1 rounded-sm cursor-pointer transition-all inline-flex items-center gap-0.5"
                          title="View local audit variables"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                        <button
                          onClick={() => handleDownloadReportPDF(record)}
                          className="bg-blue-900 hover:bg-blue-950 text-white font-bold text-[10px] px-2 py-1 rounded-sm cursor-pointer transition-all inline-flex items-center gap-0.5"
                          title="Generate & download official Internal Audit PDF report"
                        >
                          <Download className="w-3 h-3 text-yellow-300" />
                          Report
                        </button>
                        <button
                          onClick={() => setHistoryTrailRecord(record)}
                          className="bg-amber-950 hover:bg-amber-900 text-amber-400 font-bold border border-amber-800 text-[10px] px-1.5 py-1 rounded-sm cursor-pointer transition-all inline-flex items-center gap-0.5"
                          title="Review secure history audit logs trail"
                        >
                          <History className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Grid Footing Pagination & Total count bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between bg-white border border-slate-300 p-2 px-3 rounded-sm shadow-2xs gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Page <span className="font-bold text-slate-800">{currentPage}</span> of <span className="font-bold text-slate-800">{totalPages}</span>
            </span>
            
            <div className="flex items-center gap-1 pb-1 sm:pb-0">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="px-2 py-1 bg-slate-50 border border-slate-300 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-40 select-none cursor-pointer text-xs"
              >
                First
              </button>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-40 select-none cursor-pointer text-xs flex items-center gap-1 font-semibold"
              >
                <ChevronLeft className="w-3 h-3" /> Prev
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-40 select-none cursor-pointer text-xs flex items-center gap-1 font-semibold"
              >
                Next <ChevronRight className="w-3 h-3" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="px-2 py-1 bg-slate-50 border border-slate-300 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-40 select-none cursor-pointer text-xs"
              >
                Last
              </button>
            </div>
          </div>

        </section>

      </div>

      {/* Detail Overlay Drawer Modal style - View Record */}
      {selectedRecordForDetail && (
        <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-400 w-full max-w-lg shadow-2xl rounded-sm font-sans" id="record-detail-modal">
            {/* Header */}
            <div className="bg-[#1e3a8a] text-white p-3.5 flex items-center justify-between border-b border-blue-950">
              <div className="flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-yellow-400" />
                <span className="text-xs font-black uppercase tracking-wider font-mono">Record Audit Context: {selectedRecordForDetail.id}</span>
              </div>
              <button 
                onClick={() => setSelectedRecordForDetail(null)} 
                className="text-white hover:text-yellow-400 font-bold font-mono text-base leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content info */}
            <div className="p-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3.5 border-b pb-3 font-mono">
                <div>
                  <p className="text-slate-400 font-bold font-sans">Department ID:</p>
                  <p className="font-bold text-slate-800 text-[13px]">{selectedRecordForDetail.deptId}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold font-sans">Financial Year:</p>
                  <p className="font-bold text-slate-800 text-[13px]">{selectedRecordForDetail.financialYear}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-500 uppercase tracking-widest text-[9.5px]">Audit Particular Details</p>
                <div className="bg-slate-50 p-3 rounded-sm border border-slate-200 space-y-1.5 leading-relaxed text-slate-700">
                  <p><strong>Department Unit:</strong> {selectedRecordForDetail.deptName}</p>
                  <p><strong>HOD In-Charge Name:</strong> {selectedRecordForDetail.deptHead}</p>
                  <p><strong>Approved Auditor:</strong> {selectedRecordForDetail.auditor}</p>
                  <p><strong>Typology Class:</strong> {selectedRecordForDetail.auditType}</p>
                  <p><strong>Filing Date of Record:</strong> {selectedRecordForDetail.auditDate}</p>
                  <p><strong>Flagged Findings Identified:</strong> {selectedRecordForDetail.findingsCount} critical observations registered</p>
                  <p><strong>Security Clearance Status:</strong> <span className="font-bold text-green-700">{selectedRecordForDetail.status}</span></p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-2.5 text-[10px] text-blue-800 font-mono">
                <strong>SYSTEM NOTE:</strong> This record was digitally notarized on {selectedRecordForDetail.auditDate} under gateway validator VSP-INTERNAL-AUDIT. Data structure complies with ISO 9001/ISO 19011 guideline frames.
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="bg-slate-100 p-3 flex justify-end gap-2 border-t border-slate-200">
              <button
                onClick={() => handleDownloadReportPDF(selectedRecordForDetail)}
                className="bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-xs uppercase px-3 py-1.5 rounded-sm cursor-pointer transition-all flex items-center gap-1 border border-emerald-900"
              >
                <Download className="w-3.5 h-3.5" />
                Download Report PDF
              </button>
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="bg-slate-300 hover:bg-slate-400 text-slate-850 font-bold text-xs uppercase px-3.5 py-1.5 rounded-sm cursor-pointer transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit History Log Modal popup */}
      {historyTrailRecord && (
        <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-400 w-full max-w-lg shadow-2xl rounded-sm font-sans" id="history-trail-modal">
            {/* Header */}
            <div className="bg-[#1e3a8a] text-white p-3.5 flex items-center justify-between border-b border-blue-950">
              <div className="flex items-center gap-2">
                <History className="w-4.5 h-4.5 text-yellow-400" />
                <span className="text-xs font-black uppercase tracking-wider font-mono">Secure Audit Log trail [{historyTrailRecord.id}]</span>
              </div>
              <button 
                onClick={() => setHistoryTrailRecord(null)} 
                className="text-white hover:text-yellow-400 font-bold font-mono text-base leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content trail */}
            <div className="p-4 space-y-4 text-xs">
              
              <div className="border border-slate-200 rounded p-3 bg-slate-550 bg-slate-50 font-mono space-y-1.5">
                <div className="flex justify-between">
                  <strong>SYSTEM FILE REF:</strong>
                  <span>{historyTrailRecord.id}</span>
                </div>
                <div className="flex justify-between">
                  <strong>UNIT IDENTIFIER:</strong>
                  <span>{historyTrailRecord.deptId} (Department {historyTrailRecord.deptName})</span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="font-extrabold text-[#111827] uppercase tracking-wide text-[10px]">Division Watchdog Audit Ledger Entries</p>
                
                <div className="relative border-l-2 border-blue-900 pl-4 space-y-3.5 py-2">
                  <div className="relative">
                    <span className="absolute -left-[21px] top-0 bg-blue-900 text-white rounded-full p-0.5 border border-white">
                      <CheckCircle2 className="w-3 h-3 text-yellow-300" />
                    </span>
                    <p className="font-bold text-slate-800 text-[11px]">Audit Digitally Sealed & Archived</p>
                    <p className="text-[10px] text-slate-500 font-mono">{historyTrailRecord.auditDate} 17:34:10</p>
                    <p className="text-slate-600 font-mono text-[10px] mt-0.5">Executor ID: HOD-D77 | Action: Final Seal</p>
                  </div>

                  <div className="relative">
                    <span className="absolute -left-[21px] top-0 bg-blue-900 text-white rounded-full p-0.5 border border-white">
                      <Clock className="w-3 h-3 text-yellow-300" />
                    </span>
                    <p className="font-bold text-slate-800 text-[11px]">Draft Paras Clearance Verified during Board Review</p>
                    <p className="text-[10px] text-slate-500 font-mono">{historyTrailRecord.auditDate} 12:15:02</p>
                    <p className="text-slate-600 font-mono text-[10px] mt-0.5">Approved by Auditor: {historyTrailRecord.auditor}</p>
                  </div>

                  <div className="relative">
                    <span className="absolute -left-[21px] top-0 bg-blue-900 text-white rounded-full p-0.5 border border-white">
                      <Layers className="w-3 h-3 text-yellow-300" />
                    </span>
                    <p className="font-bold text-slate-800 text-[11px]">Voucher Initial Compliance Findings Ingested</p>
                    <p className="text-[10px] text-slate-500 font-mono">{historyTrailRecord.auditDate} 09:30:19</p>
                    <p className="text-slate-600 font-mono text-[10px] mt-0.5">Observation count verified: {historyTrailRecord.findingsCount} nodes</p>
                  </div>
                </div>

              </div>

            </div>

            {/* Footer Buttons */}
            <div className="bg-slate-100 p-3 flex justify-end border-t border-slate-200">
              <button
                onClick={() => setHistoryTrailRecord(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs uppercase px-4 py-1.5 rounded-sm cursor-pointer transition-all"
              >
                Close Trail
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
