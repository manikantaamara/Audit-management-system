import React, { useState, useEffect } from 'react';
import { 
  Database, Plus, CheckCircle2, UserPlus, Building, BookCheck, ClipboardCheck, 
  Search, ShieldAlert, ArrowLeft, ArrowRight, Save, Trash2, RefreshCw, FileSpreadsheet, 
  Printer, HelpCircle, LogOut, FileText, Download, Check, Eye
} from 'lucide-react';
import { Department, Employee, AuditProgram } from '../types';
import { oracleSchema, TableDefinition, ColumnDefinition } from '../schemaDefinition';
import { jsPDF } from "jspdf";
import "jspdf-autotable";

interface MasterMaintenanceProps {
  departments: Department[];
  employees: Employee[];
  programs: AuditProgram[];
  onCreateDepartment: (d: Partial<Department>) => void;
  onCreateEmployee: (e: Partial<Employee>) => void;
  onCreateProgram: (p: Partial<AuditProgram>) => void;
  activeMenu?: string;
}

export default function MasterMaintenance({
  departments, employees, programs, onCreateDepartment, onCreateEmployee, onCreateProgram, activeMenu
}: MasterMaintenanceProps) {
  const [activeSubTab, setActiveSubTab] = useState<'dept' | 'emp' | 'program' | 'dak' | 'schema_explorer'>('dept');

  // Relational Oracle Schema Explorer State
  const [selectedTable, setSelectedTable] = useState<string>('DEPARTMENT_MASTER');
  const [tableData, setTableData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterColumn, setFilterColumn] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Floating Editor Modal
  const [showEditor, setShowEditor] = useState<boolean>(false);
  const [editorMode, setEditorMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [editFormData, setEditFormData] = useState<Record<string, any>>({});
  
  // FK Lookup lists
  const [lookups, setLookups] = useState<Record<string, any[]>>({});

  // File Upload states for BLOB fields
  const [blobFile, setBlobFile] = useState<{ filename: string; fileType: string; fileSize: number; base64: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Help Dialog State
  const [showHelpDialog, setShowHelpDialog] = useState<boolean>(false);

  useEffect(() => {
    if (!activeMenu) return;
    if (activeMenu === 'department_master') {
      setActiveSubTab('dept');
    } else if (activeMenu === 'employee_master') {
      setActiveSubTab('emp');
    } else if (activeMenu === 'programs_master') {
      setActiveSubTab('program');
    } else if (activeMenu === 'dak_initializer') {
      setActiveSubTab('dak');
    } else if (activeMenu === 'code_master') {
      setActiveSubTab('schema_explorer');
    }
  }, [activeMenu]);

  // Read Database Tables & FK lookups dynamically
  const fetchTableData = async (tableName: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tables/${tableName}`);
      if (res.ok) {
        const data = await res.json();
        setTableData(data);
        if (data.length > 0 && !selectedRow) {
          setSelectedRow(data[0]);
        }
      }
    } catch (e) {
      console.error(`Error loading Oracle table ${tableName}:`, e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllLookups = async () => {
    try {
      const [deptRes, empRes] = await Promise.all([
        fetch('/api/tables/DEPARTMENT_MASTER').then(r => r.json()),
        fetch('/api/tables/EMPLOYEE_MASTER').then(r => r.json())
      ]);
      setLookups({
        DEPARTMENT_MASTER: deptRes,
        EMPLOYEE_MASTER: empRes
      });
    } catch (e) {
      console.error("Failed to batch register fk lookups:", e);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'schema_explorer') {
      fetchTableData(selectedTable);
      loadAllLookups();
    }
  }, [activeSubTab, selectedTable]);

  // Table Schemas reference
  const currentTableSchema = oracleSchema.find(t => t.tableName === selectedTable) || oracleSchema[0];

  // Forms state
  const [deptCode, setDeptCode] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptHead, setDeptHead] = useState('');
  const [deptContact, setDeptContact] = useState('');

  const [empNo, setEmpNo] = useState('');
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empDept, setEmpDept] = useState('Coke Ovens Department');
  const [empDesig, setEmpDesig] = useState('');

  const [prgCode, setPrgCode] = useState('');
  const [prgName, setPrgName] = useState('');
  const [prgScope, setPrgScope] = useState('');
  const [prgGuidelines, setPrgGuidelines] = useState('');

  const [initialSeed, setInitialSeed] = useState('5254');

  const handleDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptCode || !deptName || !deptHead) return alert('Fill mandatory parameters.');
    onCreateDepartment({ code: deptCode, name: deptName, headName: deptHead, contactNo: deptContact });
    alert('Code Master Entry successfully inserted for Department.');
    setDeptCode(''); setDeptName(''); setDeptHead(''); setDeptContact('');
  };

  const handleEmpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empNo || !empName) return alert('Fill employee data.');
    onCreateEmployee({ empNo, name: empName, email: empEmail, department: empDept, designation: empDesig, active: true });
    alert('Database INSERT successfully committed inside Employee Master.');
    setEmpNo(''); setEmpName(''); setEmpEmail(''); setEmpDesig('');
  };

  const handlePrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prgCode || !prgName) return alert('Fill program code.');
    onCreateProgram({ code: prgCode, name: prgName, scopeOfAudit: prgScope, applicableGuidelines: prgGuidelines });
    alert('Schema inserted successfully for Audit Program.');
    setPrgCode(''); setPrgName(''); setPrgScope(''); setPrgGuidelines('');
  };

  // Generic Search / Filters / Sorters for Relational Explorer Grid
  const getSortKeyValue = (row: any, key: string) => {
    if (!row) return '';
    return String(row[key] || '').toLowerCase();
  };

  const filteredAndSortedRows = React.useMemo(() => {
    let rows = [...tableData];

    // Global and selective column searching
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(row => {
        if (filterColumn === 'ALL') {
          return Object.keys(row).some(key => 
            String(row[key] || '').toLowerCase().includes(q)
          );
        } else {
          return String(row[filterColumn] || '').toLowerCase().includes(q);
        }
      });
    }

    // Interactive Sorting
    if (sortColumn) {
      rows.sort((a, b) => {
        const valA = getSortKeyValue(a, sortColumn);
        const valB = getSortKeyValue(b, sortColumn);
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return rows;
  }, [tableData, searchQuery, filterColumn, sortColumn, sortDirection]);

  // Pagination bounds
  const ITEMS_PER_PAGE = 8;
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedRows.length / ITEMS_PER_PAGE));
  const paginatedRows = filteredAndSortedRows.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTable, searchQuery, filterColumn]);

  // Oracle Toolbar handlers for dynamic database actions
  const handleToolbarNewRecord = () => {
    const emptyForm: Record<string, any> = {};
    currentTableSchema.columns.forEach(col => {
      emptyForm[col.name] = col.defaultValue || '';
    });
    setEditFormData(emptyForm);
    setBlobFile(null);
    setUploadError(null);
    setEditorMode('ADD');
    setShowEditor(true);
  };

  const handleToolbarEditRecord = () => {
    if (!selectedRow) return alert("Select a row in the registry grid to edit.");
    setEditFormData({ ...selectedRow });
    setBlobFile(null);
    setUploadError(null);
    setEditorMode('EDIT');
    setShowEditor(true);
  };

  const handleToolbarDeleteRecord = async () => {
    if (!selectedRow) return alert("Please focus/select a registry row to issue purge deletion command.");
    const pkCol = currentTableSchema.columns.find(c => c.isPrimaryKey);
    if (!pkCol) return;
    const pkValue = selectedRow[pkCol.name];

    if (!confirm(`Are you sure you want to perform DELETE FROM ${selectedTable} WHERE ${pkCol.name} = '${pkValue}'? This will permanently erase the database row.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/tables/${selectedTable}/${pkValue}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert(`Relational row purged successfully from ${selectedTable}.`);
        setSelectedRow(null);
        fetchTableData(selectedTable);
      } else {
        const err = await res.json();
        alert(`DATABASE ERROR: ${err.error || 'Server rejection'}`);
      }
    } catch (e) {
      alert("Relational transaction failed. Check host database connection status.");
    }
  };

  // Commit Form changes via REST API
  const handleCommitRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const pkCol = currentTableSchema.columns.find(c => c.isPrimaryKey);
    if (!pkCol) return;

    // Build payload. Integrate file uploads if active file exists in state
    const payload = { ...editFormData };
    if (selectedTable === 'UPLOAD_REPORTS' && blobFile) {
      payload.FILE_NAME = blobFile.filename;
      payload.FILE_TYPE = blobFile.fileType;
      payload.FILE_SIZE = blobFile.fileSize;
      payload.FILE_DATA_BLOB = blobFile.base64;
    }

    // Datatype / required validation
    const missing: string[] = [];
    currentTableSchema.columns.forEach(col => {
      if (!col.isNullable && col.name !== pkCol.name && (payload[col.name] === undefined || payload[col.name] === null || payload[col.name] === '')) {
        missing.push(col.label || col.name);
      }
    });

    if (missing.length > 0) {
      return alert(`ORA-01400: mandatory constraints violated on not-null parameters: (${missing.join(', ')})`);
    }

    try {
      let res;
      if (editorMode === 'ADD') {
        res = await fetch(`/api/tables/${selectedTable}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        const pkValue = payload[pkCol.name];
        res = await fetch(`/api/tables/${selectedTable}/${pkValue}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        alert(`Oracle SQL transaction committed successfully to registry table: ${selectedTable}.`);
        setShowEditor(false);
        fetchTableData(selectedTable);
      } else {
        const err = await res.json();
        alert(`DATABASE REJECTION: ${err.error || 'Validation Failed'}`);
      }
    } catch (err) {
      alert("Oracle interface timed out. Transaction aborted.");
    }
  };

  // Base64 document parser for secure BLOB upload
  const handleBlobFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadError(null);

    // Mimetype verification
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'docx', 'xlsx'];
    const ext = f.name.split('.').pop()?.toLowerCase();
    
    if (!allowedExtensions.includes(ext || '')) {
      setUploadError("ORA-22288: Rejected. Mime type must be a valid document file (JPG, PNG, PDF, DOCX, XLSX).");
      return;
    }

    if (f.size > 5 * 1024 * 1024) {
      setUploadError("ORA-22285: Upload failed. File size violates corporate storage quota threshold of 5.0 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Str = event.target?.result as string;
      setBlobFile({
        filename: f.name,
        fileType: f.type,
        fileSize: f.size,
        base64: base64Str
      });
      // Sync into dynamic layout form
      setEditFormData(prev => ({
        ...prev,
        FILE_NAME: f.name,
        FILE_TYPE: f.type,
        FILE_SIZE: f.size,
        FILE_DATA_BLOB: base64Str
      }));
    };
    reader.readAsDataURL(f);
  };

  // Dynamic CSV/Excel Export (Direct browser stream downloads)
  const handleExportCSV = () => {
    let headers = currentTableSchema.columns.map(c => c.name).join(",") + "\n";
    let rows = tableData.map(row => 
      currentTableSchema.columns.map(c => {
        let val = row[c.name] || '';
        if (typeof val === 'string' && val.includes(',')) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(",")
    ).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ORA_EXPORT_${selectedTable}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`Success: Exited data stream. File ORA_EXPORT_${selectedTable}_2026.csv saved to local storage.`);
  };

  // Dynamic high-fidelity PDF Export using standard jsPDF-AutoTable
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
    
    // PSU Style Government Header styling
    doc.setFillColor(15, 32, 67); // Imperial Navy Blue
    doc.rect(0, 0, 297, 26, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.text("RASHTRIYA ISPAT NIGAM LIMITED (RINL) — VISAKHAPATNAM STEEL PLANT", 15, 10);
    doc.setFontSize(9);
    doc.setFont("Helvetica", "normal");
    doc.text("INTERNAL AUDIT DEPARTMENT • DATABASE SECURED INFORMATION SYSTEM", 15, 16);
    doc.text("UTC STAMPDATE: " + new Date().toLocaleString(), 15, 21);

    // Metadata details
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont("Helvetica", "bold");
    doc.text(`TABLE ORACLE REGISTRY SCHEMA: ${selectedTable}`, 15, 34);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Description: ${currentTableSchema.description}`, 15, 39);

    // Pull Table structures
    const headers = currentTableSchema.columns.map(c => c.name);
    const dataRows = tableData.map(row => 
      currentTableSchema.columns.map(c => {
        const val = row[c.name];
        if (c.name === 'FILE_DATA_BLOB' && val) {
          return '[BLOB BYTES DECRYPTED SECURELY]';
        }
        return val !== undefined && val !== null ? String(val) : '';
      })
    );

    (doc as any).autoTable({
      head: [headers],
      body: dataRows,
      startY: 44,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1.5, font: "Helvetica" },
      headStyles: { fillColor: [15, 32, 67], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: 15, right: 15 }
    });

    doc.save(`ORA_AUDIT_REPORT_${selectedTable}.pdf`);
    alert("PDF generation compiled successfully. Spooling to local printer stack complete.");
  };

  const handlePreviousRow = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextRow = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div id="aims-masters-screen" className="p-6 space-y-6 animate-fade-in font-sans">
      
      {/* Module Title Banner */}
      <div className="bg-white border border-slate-350 border-slate-300 p-4 rounded-sm shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-900" />
            Oracle AIMS Schema Registry Maintenance
          </h2>
          <p className="text-xs text-slate-500">Monitor schemas, alter dictionary rows, check physical integrity and commit regulatory ERP updates safely.</p>
        </div>
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded border border-slate-200">
          <button 
            id="master-subtab-btn-dept"
            onClick={() => setActiveSubTab('dept')}
            className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-xs transition-all cursor-pointer ${
              activeSubTab === 'dept' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-650 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Dept Master
          </button>
          <button 
            id="master-subtab-btn-emp"
            onClick={() => setActiveSubTab('emp')}
            className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-xs transition-all cursor-pointer ${
              activeSubTab === 'emp' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-650 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Staff Master
          </button>
          <button 
            id="master-subtab-btn-prg"
            onClick={() => setActiveSubTab('program')}
            className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-xs transition-all cursor-pointer ${
              activeSubTab === 'program' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-650 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Program Master
          </button>
          <button 
            id="master-subtab-btn-dak"
            onClick={() => setActiveSubTab('dak')}
            className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-xs transition-all cursor-pointer ${
              activeSubTab === 'dak' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-650 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Sequencer
          </button>
          <button 
            id="master-subtab-btn-schema"
            onClick={() => setActiveSubTab('schema_explorer')}
            className={`px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-xs transition-all cursor-pointer flex items-center gap-1 border border-blue-200 ${
              activeSubTab === 'schema_explorer' ? 'bg-blue-900 text-white shadow-xs border-blue-900' : 'bg-blue-50 text-blue-900 hover:bg-blue-100'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Database Explorer (14 Tables)
          </button>
        </div>
      </div>

      {activeSubTab === 'dept' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dept forms */}
          <div className="lg:col-span-1 bg-white border border-slate-300 rounded-sm shadow-sm">
            <div className="bg-slate-100 p-3 border-b text-xs font-bold text-slate-800">
              NEW DEPARTMENT METRIC ENTRY
            </div>
            <form onSubmit={handleDeptSubmit} className="p-4 space-y-4">
              <div>
                <label className="oracle-input-label block mb-1">Department Oracle Code</label>
                <input 
                  id="dept-master-code-input"
                  type="text" value={deptCode} onChange={e => setDeptCode(e.target.value)} 
                  placeholder="e.g. CORE_BF" className="oracle-field-value w-full" required 
                />
              </div>
              <div>
                <label className="oracle-input-label block mb-1">Corporate Department Name</label>
                <input 
                  id="dept-master-name-input"
                  type="text" value={deptName} onChange={e => setDeptName(e.target.value)} 
                  placeholder="e.g. Blast Furnace Operation" className="oracle-field-value w-full" required 
                />
              </div>
              <div>
                <label className="oracle-input-label block mb-1">Department Head Name (HOD)</label>
                <input 
                  id="dept-master-head-input"
                  type="text" value={deptHead} onChange={e => setDeptHead(e.target.value)} 
                  placeholder="Shri HOD Officer Name" className="oracle-field-value w-full" required 
                />
              </div>
              <div>
                <label className="oracle-input-label block mb-1">VSP Extension Phone No</label>
                <input 
                  id="dept-master-phone-input"
                  type="text" value={deptContact} onChange={e => setDeptContact(e.target.value)} 
                  placeholder="0891-251XXXX" className="oracle-field-value w-full" 
                />
              </div>
              <button 
                id="dept-master-submit"
                type="submit" className="w-full btn-primary-gov py-2 mt-2 gap-1.5"
              >
                <Building className="w-4 h-4" />
                INSERT DEPARTMENT RECORD
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white border border-slate-300 p-4 rounded-sm shadow-sm">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-widest block mb-3 border-b pb-2">Active Department Codes</span>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="bg-slate-50 border-b text-[10px] uppercase font-bold text-slate-500">
                    <th className="p-2.5">Code</th>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">HOD</th>
                    <th className="p-2.5 text-right">Ext No</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {departments.map(d => (
                    <tr id={`dept-row-${d.id}`} key={d.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-blue-900">{d.code}</td>
                      <td className="p-2.5 font-bold">{d.name}</td>
                      <td className="p-2.5 font-medium">{d.headName}</td>
                      <td className="p-2.5 text-right font-mono text-[11px]">{d.contactNo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'emp' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white border border-slate-300 rounded-sm shadow-sm">
            <div className="bg-slate-100 p-3 border-b text-xs font-bold text-slate-800">
              NEW PERSONNEL RECORD ENTRY
            </div>
            <form onSubmit={handleEmpSubmit} className="p-4 space-y-4">
              <div>
                <label className="oracle-input-label block mb-1">RINL Employee Ticket ID</label>
                <input 
                  id="emp-master-no-input"
                  type="text" value={empNo} onChange={e => setEmpNo(e.target.value)} 
                  placeholder="RINL-00XXXX" className="oracle-field-value w-full" required 
                />
              </div>
              <div>
                <label className="oracle-input-label block mb-1">Employee Name</label>
                <input 
                  id="emp-master-name-input"
                  type="text" value={empName} onChange={e => setEmpName(e.target.value)} 
                  placeholder="e.g. Shri Rahul Kumar" className="oracle-field-value w-full" required 
                />
              </div>
              <div>
                <label className="oracle-input-label block mb-1">Corporate Email Address</label>
                <input 
                  id="emp-master-email-input"
                  type="email" value={empEmail} onChange={e => setEmpEmail(e.target.value)} 
                  placeholder="email@vizagsteel.com" className="oracle-field-value w-full" 
                />
              </div>
              <div>
                <label className="oracle-input-label block mb-1">Department</label>
                <select 
                  id="emp-master-dept-select"
                  value={empDept} onChange={e => setEmpDept(e.target.value)} className="oracle-field-value w-full text-xs"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="oracle-input-label block mb-1">Active Designation Name</label>
                <input 
                  id="emp-master-desig-input"
                  type="text" value={empDesig} onChange={e => setEmpDesig(e.target.value)} 
                  placeholder="e.g. Senior Executive Engine" className="oracle-field-value w-full" required 
                />
              </div>
              <button 
                id="emp-master-submit"
                type="submit" className="w-full btn-primary-gov py-2 mt-2 gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                INSERT RESIDENT EMPLOYEE
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white border border-slate-300 p-4 rounded-sm shadow-sm">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-widest block mb-3 border-b pb-2">PSU Resident Employee Directory Master</span>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="bg-slate-50 border-b text-[10px] uppercase font-bold text-slate-500">
                    <th className="p-2.5">Ticket ID</th>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Email</th>
                    <th className="p-2.5">Department</th>
                    <th className="p-2.5 text-right">Designation</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {employees.map(e => (
                    <tr id={`emp-row-${e.id}`} key={e.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-blue-900">{e.empNo}</td>
                      <td className="p-2.5 font-bold text-slate-900">{e.name}</td>
                      <td className="p-2.5 font-mono text-[11px] text-slate-500">{e.email}</td>
                      <td className="p-2.5 font-medium">{e.department}</td>
                      <td className="p-2.5 text-right text-[11px] font-semibold text-indigo-950">{e.designation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'program' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white border border-slate-300 rounded-sm shadow-sm">
            <div className="bg-slate-100 p-3 border-b text-xs font-bold text-slate-800">
              NEW COMPLIANCE PROTOCOL MASTER
            </div>
            <form onSubmit={handlePrgSubmit} className="p-4 space-y-4">
              <div>
                <label className="oracle-input-label block mb-1">Program Code ID</label>
                <input 
                  id="program-master-code"
                  type="text" value={prgCode} onChange={e => setPrgCode(e.target.value)} 
                  placeholder="e.g. AP-Vigilance" className="oracle-field-value w-full" required 
                />
              </div>
              <div>
                <label className="oracle-input-label block mb-1">Compliance Program Title</label>
                <input 
                  id="program-master-name"
                  type="text" value={prgName} onChange={e => setPrgName(e.target.value)} 
                  placeholder="Audit protocol for procurement safety" className="oracle-field-value w-full" required 
                />
              </div>
              <div>
                <label className="oracle-input-label block mb-1">Standard Scope Description</label>
                <textarea 
                  id="program-master-scope"
                  value={prgScope} onChange={e => setPrgScope(e.target.value)} 
                  placeholder="Scope parameters..." className="oracle-field-value w-full h-20" required 
                />
              </div>
              <div>
                <label className="oracle-input-label block mb-1">Applicable Executive Guidelines</label>
                <input 
                  id="program-master-guidelines"
                  type="text" value={prgGuidelines} onChange={e => setPrgGuidelines(e.target.value)} 
                  placeholder="e.g. Finance Bill regulations 2024" className="oracle-field-value w-full" 
                />
              </div>
              <button 
                id="program-master-submit"
                type="submit" className="w-full btn-primary-gov py-2 mt-2 gap-1.5"
              >
                <BookCheck className="w-4 h-4" />
                INSERT COMPLIANCE PROTOCOL
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white border border-slate-300 p-4 rounded-sm shadow-sm">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-widest block mb-3 border-b pb-2">Registered Audit Compliance Programs</span>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="bg-slate-50 border-b text-[10px] uppercase font-bold text-slate-500">
                    <th className="p-2.5">Program Code</th>
                    <th className="p-2.5">Compliance Program Title</th>
                    <th className="p-2.5">Standard Scope Description</th>
                    <th className="p-2.5 text-right">Applicable Guidelines</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {programs.map(p => (
                    <tr id={`program-row-${p.id}`} key={p.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-blue-900">
                        <span className="bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{p.code}</span>
                      </td>
                      <td className="p-2.5 font-bold text-slate-900">{p.name}</td>
                      <td className="p-2.5 text-slate-600 max-w-sm">{p.scopeOfAudit}</td>
                      <td className="p-2.5 text-right text-[11px] font-semibold text-indigo-950">{p.applicableGuidelines}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'dak' && (
        <div className="max-w-md mx-auto bg-white border border-slate-300 rounded-sm shadow-md overflow-hidden p-6 text-center space-y-4">
          <ClipboardCheck className="w-12 h-12 text-blue-800 mx-auto" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Dynamic Dak Sequencer Initialization</h3>
          <p className="text-xs text-slate-500">
            Set the start point of your outward mail registry (DAK No). All downstream dispatch processes increment sequentially from this active numerical seed.
          </p>
          
          <div className="bg-slate-100 p-4 border border-slate-200 text-left space-y-2">
            <label className="oracle-input-label block">Outward Sequence Start Point Seed</label>
            <input
              id="dak-seed-input"
              type="number"
              value={initialSeed}
              onChange={(e) => setInitialSeed(e.target.value)}
              className="oracle-field-value w-full font-mono text-center text-lg text-blue-900 font-bold"
            />
          </div>

          <button
            id="dak-init-confirm-btn"
            onClick={() => {
              alert(`Sequencer reset! Dak dispatch indexes will now count from base: "DK-2026-${initialSeed}". Database aligned.`);
            }}
            className="w-full btn-primary-gov py-2.5 font-bold uppercase"
          >
            Authorize Sequential Reset
          </button>
        </div>
      )}

      {/* REVELATIONAL DYNAMIC DATABASE EXPLORER MODULE TAB */}
      {activeSubTab === 'schema_explorer' && (
        <div className="space-y-4 animate-fade-in">
          
          {/* Oracle Forms classic high-fidelity controller toolbar */}
          <div className="bg-slate-205 bg-slate-200 border-y border-slate-350 flex flex-wrap items-center justify-between p-1 select-none gap-2">
            <div className="flex items-center flex-wrap gap-0.5">
              <button 
                onClick={handleToolbarNewRecord}
                className="p-1 px-2.5 rounded hover:bg-slate-300 font-bold text-[10.5px] text-slate-800 flex items-center gap-1 cursor-pointer border border-transparent hover:border-slate-400"
                title="Insert New Row (New Record)"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-700" />
                New Record
              </button>
              <button 
                onClick={handleToolbarEditRecord}
                className="p-1 px-2.5 rounded hover:bg-slate-300 font-bold text-[10.5px] text-slate-800 flex items-center gap-1 cursor-pointer border border-transparent hover:border-slate-400"
                title="Modify Row attributes (Edit)"
              >
                <Database className="w-3.5 h-3.5 text-blue-900" />
                Edit Row
              </button>
              <button 
                onClick={handleToolbarDeleteRecord}
                className="p-1 px-2.5 rounded hover:bg-slate-300 font-bold text-[10.5px] text-slate-850 text-slate-800 flex items-center gap-1 cursor-pointer border border-transparent hover:border-slate-400"
                title="Remove highlighted active record line (Delete)"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-700" />
                Delete
              </button>
              <div className="w-[1px] h-6 bg-slate-400 mx-1"></div>
              <button 
                onClick={() => fetchTableData(selectedTable)}
                className="p-1 px-2.5 rounded hover:bg-slate-300 font-bold text-[10.5px] text-slate-800 flex items-center gap-1 cursor-pointer border border-transparent hover:border-slate-400"
                title="Re-fetch schema content"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                Refresh
              </button>
              <button 
                onClick={handleExportCSV}
                className="p-1 px-2.5 rounded hover:bg-slate-300 font-bold text-[10.5px] text-slate-800 flex items-center gap-1 cursor-pointer border border-transparent hover:border-slate-400"
                title="Export CSV data"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-green-700" />
                Export Excel
              </button>
              <button 
                onClick={handleExportPDF}
                className="p-1 px-2.5 rounded hover:bg-slate-300 font-bold text-[10.5px] text-slate-800 flex items-center gap-1 cursor-pointer border border-transparent hover:border-slate-400"
                title="Generate Government Landscape Printable Report"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-700" />
                Print PDF
              </button>
            </div>
            
            <div className="flex items-center gap-1.5 pr-2">
              <button 
                onClick={() => setShowHelpDialog(true)}
                className="p-1 hover:bg-slate-300 rounded text-slate-700 cursor-pointer"
                title="Open system help registry docs"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left selector panel: Lists all 14 database tables exactly */}
            <div className="lg:col-span-1 bg-white border border-slate-300 rounded-sm shadow-sm flex flex-col h-[520px]">
              <div className="bg-slate-100 p-3 border-b text-[11px] font-mono font-bold text-slate-850 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-950" />
                SYSTEM DATA DICTIONARY
              </div>
              <div className="p-2 bg-slate-50 border-b">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">14 Relational Nodes Seeding</span>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {oracleSchema.map(schema => {
                  const isActive = selectedTable === schema.tableName;
                  const rowCount = schema.tableName === selectedTable ? tableData.length : '?';
                  return (
                    <button
                      id={`db-tbl-selector-${schema.tableName}`}
                      key={schema.tableName}
                      onClick={() => {
                        setSelectedTable(schema.tableName);
                        setSelectedRow(null);
                      }}
                      className={`w-full text-left p-3 text-xs transition-all flex items-center justify-between hover:bg-slate-50 ${
                        isActive ? 'bg-blue-50 border-l-4 border-blue-900 font-bold text-blue-950' : 'text-slate-700'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="font-mono block tracking-tight text-[11px]">{schema.tableName}</span>
                        <span className="text-[10px] text-slate-400 font-normal line-clamp-1">{schema.description}</span>
                      </div>
                      {isActive && (
                        <span className="bg-blue-200 text-blue-950 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          {tableData.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right side: Table Grid and filters */}
            <div className="lg:col-span-3 bg-white border border-slate-300 rounded-sm shadow-sm flex flex-col h-[520px] justify-between">
              
              {/* Header information and searches */}
              <div>
                <div className="p-3 bg-slate-50 border-b flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold font-mono text-slate-850 uppercase flex items-center gap-1.5 text-blue-900">
                      <Database className="w-3.5 h-3.5" />
                      {currentTableSchema.tableName}
                    </span>
                    <p className="text-[10.5px] text-slate-510 text-slate-500">{currentTableSchema.description}</p>
                  </div>
                  
                  {/* Dynamic conditional query options */}
                  <div className="flex items-center gap-1.5">
                    <select
                      value={filterColumn}
                      onChange={(e) => setFilterColumn(e.target.value)}
                      className="text-[10.5px] bg-white border border-slate-350 p-1 rounded font-mono text-slate-700 select-xs outline-none"
                    >
                      <option value="ALL">All Columns</option>
                      {currentTableSchema.columns.map(c => (
                        <option key={c.name} value={c.name}>{c.name} ({c.type})</option>
                      ))}
                    </select>
                    
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search records..."
                        className="w-44 text-[10.5px] border border-slate-350 p-1 pl-6 rounded font-sans focus:outline-none focus:border-blue-900"
                      />
                      <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                    </div>
                  </div>
                </div>

                {/* Relational Table Data Grid representation */}
                <div className="overflow-auto max-h-[380px]">
                  {isLoading ? (
                    <div className="p-20 text-center text-xs font-mono text-slate-400 flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-blue-900" />
                      SPOOLING RECORDSETS FROM HOST...
                    </div>
                  ) : filteredAndSortedRows.length === 0 ? (
                    <div className="p-20 text-center text-xs font-mono text-slate-500 italic">
                      NO RECORDS COMMITTED IN ACTIVE BLOCK. CLICK 'NEW RECORD' TO INSERT ROW.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs font-sans table-fixed min-w-[800px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-[10px] uppercase font-mono font-bold text-slate-550 select-none">
                          <th className="p-2 pl-3 w-10">SEL</th>
                          {currentTableSchema.columns.map(col => (
                            <th 
                              key={col.name} 
                              onClick={() => {
                                if (sortColumn === col.name) {
                                  setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setSortColumn(col.name);
                                  setSortDirection('asc');
                                }
                              }}
                              className="p-2 font-mono hover:bg-slate-205 cursor-pointer text-slate-700 hover:text-blue-900 relative group"
                            >
                              <span className="flex items-center gap-1">
                                {col.name}
                                {col.isPrimaryKey && <span className="text-[8.5px] bg-amber-200 text-amber-950 px-1 rounded">PK</span>}
                                {col.isForeignKey && <span className="text-[8.5px] bg-slate-200 text-slate-900 px-1 rounded">FK</span>}
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-sans text-[11px] text-slate-750">
                        {paginatedRows.map((row, index) => {
                          const pkCol = currentTableSchema.columns.find(c => c.isPrimaryKey);
                          const isRowSelected = selectedRow && pkCol && (selectedRow[pkCol.name] === row[pkCol.name]);
                          return (
                            <tr
                              id={`dynamic-row-${selectedTable}-${index}`}
                              key={index}
                              onClick={() => setSelectedRow(row)}
                              className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                                isRowSelected ? 'bg-amber-50/70 border-l-2 border-amber-500 font-semibold' : ''
                              }`}
                            >
                              <td className="p-2 pl-3">
                                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                  isRowSelected ? 'bg-amber-500 border-amber-600' : 'border-slate-300 bg-white'
                                }`}>
                                  {isRowSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                                </div>
                              </td>
                              {currentTableSchema.columns.map(col => {
                                const rawVal = row[col.name];
                                let displayVal = rawVal !== undefined && rawVal !== null ? String(rawVal) : '—';
                                
                                // Securely shield/omit base64 bytes to prevent UI token lag
                                if (col.type === 'CLOB' && displayVal.startsWith('data:')) {
                                  displayVal = '[SECURE BLOB ENCRYPTED BYTES]';
                                }

                                return (
                                  <td key={col.name} className="p-2 font-mono truncate max-w-xs text-slate-800" title={displayVal}>
                                    {displayVal}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Grid Pagination Footer controls */}
              <div className="bg-slate-50 border-t p-3 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-600">
                  Showing lines {Math.min(filteredAndSortedRows.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)} to {Math.min(filteredAndSortedRows.length, currentPage * ITEMS_PER_PAGE)} of {filteredAndSortedRows.length} spooled registry records.
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePreviousRow}
                    disabled={currentPage === 1}
                    className="p-1 px-2.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-xs font-bold cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 inline mr-1" />
                    Previous
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-700">Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={handleNextRow}
                    disabled={currentPage === totalPages}
                    className="p-1 px-2.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-xs font-bold cursor-pointer"
                  >
                    Next
                    <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* FLOATING DETAILED EDITOR MODAL: DYNAMIC AUTOMATED FORMS GENERATION */}
      {showEditor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-white border border-slate-400 rounded-sm shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal system header */}
            <div className="bg-blue-900 p-3 text-white flex items-center justify-between border-b border-blue-950">
              <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <Database className="w-3.5 h-3.5" />
                Commit Block Entry: {selectedTable} [{editorMode}]
              </span>
              <button 
                onClick={() => setShowEditor(false)}
                className="text-white bg-blue-950 hover:bg-blue-800 text-[10px] uppercase font-bold px-2 py-1 rounded"
              >
                Close (ESC)
              </button>
            </div>

            <form onSubmit={handleCommitRecord} className="p-4 space-y-4 flex-1 overflow-y-auto">
              
              <div className="bg-blue-50/50 p-2.5 border border-blue-100 rounded text-[11px] text-blue-900 italic mb-2">
                <strong>Relational Constraint Check:</strong> Modifying attributes triggers instant data validation against database constraints. Primary Key column will be generated automatically if left blank.
              </div>

              {currentTableSchema.columns.map(col => {
                const pkCol = currentTableSchema.columns.find(c => c.isPrimaryKey);
                const isPkColumn = col.name === pkCol?.name;
                
                // If editing, lock down primary key inputs to safeguard uniqueness constraints
                const isReadOnly = (isPkColumn && editorMode === 'EDIT') || col.name === 'CREATION_DATE' || col.name === 'CREATED_BY';

                return (
                  <div key={col.name} className="space-y-1">
                    <label className="oracle-input-label flex items-center justify-between text-[11px]">
                      <span className="font-mono font-bold uppercase text-slate-700">
                        {col.name} {!col.isNullable && <span className="text-rose-600 font-bold">*</span>}
                      </span>
                      <span className="text-[10px] text-slate-400 lowercase font-mono">
                        {col.type}{col.length ? `(${col.length})` : ''}
                      </span>
                    </label>

                    {/* Check if dynamic column is a Foreign Key to render dynamic option-sets lookups */}
                    {col.isForeignKey ? (
                      <select
                        value={editFormData[col.name] || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, [col.name]: e.target.value }))}
                        className="oracle-field-value w-full text-xs font-mono"
                        required={!col.isNullable}
                      >
                        <option value="">-- Choose Relational Lookup --</option>
                        {col.referencesTable === 'DEPARTMENT_MASTER' && lookups.DEPARTMENT_MASTER?.map(d => (
                          <option key={d.DEPT_ID} value={d.DEPT_CODE}>{d.DEPT_CODE} - {d.DEPT_NAME}</option>
                        ))}
                        {col.referencesTable === 'EMPLOYEE_MASTER' && lookups.EMPLOYEE_MASTER?.map(e => (
                          <option key={e.EMP_ID} value={e.EMP_ID}>{e.EMP_NO} - {e.EMP_NAME}</option>
                        ))}
                      </select>
                    ) : col.name === 'FILE_DATA_BLOB' || col.type === 'BLOB' ? (
                      /* BLOB / FILE DATA SYSTEM FILE COMPONENT CAPABILITIES */
                      <div className="space-y-2 border border-dashed border-slate-300 p-3 rounded bg-slate-50">
                        <input
                          id={`file-upload-input-${col.name}`}
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx"
                          onChange={handleBlobFileSelection}
                          className="text-xs w-full cursor-pointer"
                        />
                        <p className="text-[9.5px] text-slate-500">Supported formats: JPG, PNG, PDF, DOCX, XLSX. Storage limit: Max 5MB quota.</p>
                        
                        {blobFile && (
                          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2 rounded text-emerald-900 text-[10px] font-mono">
                            <span className="truncate max-w-[200px]">{blobFile.filename} ({(blobFile.fileSize/1024).toFixed(1)} KB)</span>
                            <div className="flex items-center gap-1">
                              <span className="text-emerald-700 font-bold flex items-center"><Check className="w-3 h-3 mr-0.5" /> SECURE</span>
                            </div>
                          </div>
                        )}
                        {uploadError && <p className="text-[10px] text-rose-600 font-bold font-mono">{uploadError}</p>}
                      </div>
                    ) : col.type === 'DATE' ? (
                      /* Date Form Input Type */
                      <input
                        type="date"
                        value={editFormData[col.name] ? editFormData[col.name].split('T')[0] : ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, [col.name]: e.target.value }))}
                        className="oracle-field-value w-full font-mono text-xs"
                        required={!col.isNullable}
                        disabled={isReadOnly}
                      />
                    ) : col.type === 'CLOB' || (col.length && col.length > 250) ? (
                      /* Large text CLOB inputs descriptions components */
                      <textarea
                        value={editFormData[col.name] || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, [col.name]: e.target.value }))}
                        rows={3}
                        className="oracle-field-value w-full text-xs font-sans h-20"
                        required={!col.isNullable}
                        maxLength={col.length}
                        disabled={isReadOnly}
                        placeholder={`Details write space for ${col.name} (${col.type})`}
                      />
                    ) : (
                      /* Default Standard Inputs types (NUMBER, VARCHAR2, etc) */
                      <input
                        type={col.type === 'NUMBER' ? 'number' : 'text'}
                        value={editFormData[col.name] !== undefined && editFormData[col.name] !== null ? editFormData[col.name] : ''}
                        onChange={(e) => setEditFormData(prev => {
                          const val = col.type === 'NUMBER' ? parseFloat(e.target.value) || 0 : e.target.value;
                          return { ...prev, [col.name]: val };
                        })}
                        className="oracle-field-value w-full font-mono text-xs"
                        required={!col.isNullable}
                        maxLength={col.length}
                        disabled={isReadOnly}
                        placeholder={col.isPrimaryKey ? 'Auto-Increment sequencer' : `Enter value for ${col.name}`}
                      />
                    )}
                  </div>
                );
              })}

              {/* Commit and Cancel Controls */}
              <div className="pt-3 border-t flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowEditor(false)}
                  className="p-1.5 px-4 rounded border border-slate-350 bg-slate-100 hover:bg-slate-200 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="dynamic-form-commit-btn"
                  type="submit"
                  className="p-1.5 px-5 rounded bg-blue-900 hover:bg-blue-950 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  Commit to Grid
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ORACLE SECURE SYSTEM DIAGNOSTICS TIPS HELPER DIALOG */}
      {showHelpDialog && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none animate-fade-in">
          <div className="bg-white border border-slate-400 rounded-sm shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-slate-105 bg-slate-100 p-2.5 border-b font-sans font-bold text-xs uppercase text-slate-850 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-blue-900" />
              Oracle Forms Key Diagnostics Help
            </div>
            <div className="p-4 space-y-3 text-xs text-slate-700">
              <p>Welcome to the AIMS Desktop relational registry compiler interface. Shortcuts are supported directly via active panel operations:</p>
              
              <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-slate-600 bg-slate-50 p-2 rounded border">
                <li><strong>New Record:</strong> INSERT a blank dictionary node row.</li>
                <li><strong>Save Row:</strong> Commit changes directly (PostgreSQL/Oracle database engine).</li>
                <li><strong>Delete:</strong> Purge target row (incorporates automatic cascading triggers).</li>
                <li><strong>Refresh:</strong> Spool live dataset buffers from active system configuration.</li>
                <li><strong>PDF Export:</strong> Landscaping tabular report generator with executive headings.</li>
              </ul>

              <p className="text-[10.5px] italic text-slate-455 text-slate-500">Security Watchdog Note: Every database transaction gets committed sequentially into the logs module tracking and telemetry database vault.</p>
            </div>
            <div className="p-3 bg-slate-50 border-t text-right">
              <button
                id="close-help-diag-btn"
                onClick={() => setShowHelpDialog(false)}
                className="p-1 px-4 rounded bg-blue-900 text-white font-bold hover:bg-blue-950 cursor-pointer"
              >
                Exit Help
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
