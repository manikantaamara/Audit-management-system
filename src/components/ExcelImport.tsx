import React, { useState } from 'react';
import { 
  FileSpreadsheet, Upload, CheckCircle2, AlertTriangle, Play, Database, 
  Layers, ArrowRight, Loader, Sparkles, Server, Check, RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Table names we support
const TABLE_KEYS = [
  'DEPARTMENT_MASTER',
  'EMPLOYEE_MASTER',
  'AUDIT_PROGRAM_MASTER',
  'USER_MASTER',
  'ROLE_MASTER',
  'STATUS_MASTER',
  'AUDIT_PLANNING',
  'AUDIT_REPORTS_ENTRY',
  'REPLY_ENTRY',
  'DISPATCH',
  'AUDIT_PARAS',
  'REVIEW_TRACKING',
  'UPLOAD_REPORTS',
  'ACTIVITY_LOGS'
] as const;

type TableName = typeof TABLE_KEYS[number];

// Smart column mapping engine
function mapRawKeysToOracleSchema(rawHeaders: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  const rules: Record<string, string[]> = {
    // DEPARTMENT_MASTER
    'DEPT_ID': ['dept_id', 'dept id', 'department id', 'departmentid', 'id'],
    'DEPT_CODE': ['dept_code', 'dept code', 'department code', 'code', 'department_code'],
    'DEPT_NAME': ['dept_name', 'dept name', 'department name', 'department_name', 'name'],
    'HEAD_NAME': ['head_name', 'head name', 'hod_name', 'hod name', 'department head', 'head'],
    'CONTACT_NO': ['contact_no', 'contact no', 'intercom_no', 'intercom', 'phone', 'contact'],
    'STATUS': ['status', 'state', 'dept_status'],
    'CREATION_DATE': ['creation_date', 'creation date', 'created_on', 'created on', 'date_created'],
    'CREATED_BY': ['created_by', 'created by', 'operator'],

    // EMPLOYEE_MASTER
    'EMP_ID': ['emp_id', 'emp id', 'employee id', 'employeeid'],
    'EMP_NO': ['emp_no', 'emp no', 'ticket_no', 'ticket no', 'employee_no', 'ticket'],
    'EMP_NAME': ['emp_name', 'emp name', 'employee name', 'staff name'],
    'EMAIL': ['email', 'email_id', 'email id', 'official_email'],
    'DESIGNATION': ['designation', 'grade', 'post', 'designation_name'],
    'IS_ACTIVE': ['is_active', 'is active', 'active', 'active_status'],

    // AUDIT_PROGRAM_MASTER
    'PROG_ID': ['prog_id', 'prog id', 'program id', 'program_id'],
    'PROG_CODE': ['prog_code', 'prog code', 'program code', 'program_code'],
    'PROG_NAME': ['prog_name', 'prog name', 'program name', 'subject'],
    'SCOPE_OF_AUDIT': ['scope_of_audit', 'scope of audit', 'scope', 'audit_scope', 'specifications'],
    'APPLICABLE_GUIDELINES': ['applicable_guidelines', 'applicable guidelines', 'guidelines', 'circulars'],

    // AUDIT_PLANNING
    'PLAN_ID': ['plan_id', 'plan id', 'scheme_id', 'scheme id', 'audit scheme id'],
    'TITLE': ['title', 'plan_title', 'audit_title', 'objective'],
    'FINANCIAL_YEAR': ['financial_year', 'financial year', 'fy', 'fiscal_period'],
    'AUDIT_TYPE': ['audit_type', 'audit type', 'classification'],
    'PLANNED_MONTHS': ['planned_months', 'planned months', 'months', 'itinerary'],
    'TEAM_LEAD': ['team_lead', 'team lead', 'lead_auditor', 'auditor_lead'],
    'START_DATE': ['start_date', 'start date', 'est_start'],
    'END_DATE': ['end_date', 'end date', 'est_end'],
    'TOUR_PROPOSAL_URL': ['tour_proposal_url', 'tour proposal url', 'itinerary_link'],

    // AUDIT_REPORTS_ENTRY
    'REPORT_ID': ['report_id', 'report id', 'corporate report id'],
    'REPORT_NO': ['report_no', 'report no', 'reference_no', 'reference letter no'],
    'AUDIT_PERIOD_FROM': ['audit_period_from', 'audit period from', 'start_coverage', 'period_from'],
    'AUDIT_PERIOD_TO': ['audit_period_to', 'audit period to', 'end_coverage', 'period_to'],
    'LEAD_AUDITOR': ['lead_auditor', 'lead auditor', 'inspector'],
    'DATE_CREATED': ['date_created', 'date created', 'draft_date'],
    'DATE_SUBMITTED': ['date_submitted', 'date submitted', 'submission_date'],
    'PARAS_COUNT': ['paras_count', 'paras count', 'observations_count'],
    'ATTACHMENT_NAME': ['attachment_name', 'attachment name', 'pdf_attachment', 'file_name'],

    // AUDIT_PARAS
    'PARA_ID': ['para_id', 'para id', 'section id', 'observation id'],
    'PARA_NO': ['para_no', 'para no', 'para section code', 'section_no'],
    'CATEGORY': ['category', 'severity', 'priority'],
    'DESCRIPTION': ['description', 'observation_details', 'para_description'],
    'FINANCIAL_IMPLICATION': ['financial_implication', 'financial implication', 'implication_value', 'monetary_loss', 'cost'],
    'REPLY_CONTENT': ['reply_content', 'reply content', 'hod_response', 'compliance_memo'],
    'MARKED_EMP_ID': ['marked_emp_id', 'marked emp id', 'assigned_employee', 'respondent_id', 'assigned_to'],
    'DAK_NO': ['dak_no', 'dak no', 'dak_code', 'tracking_barcode'],

    // DISPATCH
    'DISPATCH_ID': ['dispatch_id', 'dispatch id'],
    'DISPATCH_NO': ['dispatch_no', 'dispatch no', 'outward_no', 'outward register no'],
    'DISPATCH_DATE': ['dispatch_date', 'dispatch date', 'outward_date'],
    'SUBJECT': ['subject', 'mail_subject'],
    'SENDER_DEPT': ['sender_dept', 'sender dept', 'originator'],
    'RECEIVER_DEPT': ['receiver_dept', 'receiver dept', 'recipient'],
    'MEDIUM': ['medium', 'transit_mode', 'mode'],
  };

  rawHeaders.forEach(header => {
    const norm = header.toLowerCase().trim().replace(/[\s_\-]+/g, ' ');
    // Direct matches
    for (const [oracleKey, matchers] of Object.entries(rules)) {
      if (matchers.some(m => norm === m || norm.includes(m))) {
        mapping[header] = oracleKey;
        break;
      }
    }
  });

  return mapping;
}

// Smart sheet to table resolver
function findMatchingTable(sheetName: string, headers: string[]): TableName | null {
  const normSheet = sheetName.toUpperCase().trim().replace(/[\s_\-]+/g, '_');
  
  // Rule 1: Direct Table Name match
  if (TABLE_KEYS.includes(normSheet as any)) {
    return normSheet as TableName;
  }

  // Rule 2: Substring or plural match
  if (normSheet.includes('DEPARTMENT')) return 'DEPARTMENT_MASTER';
  if (normSheet.includes('EMPLOYEE')) return 'EMPLOYEE_MASTER';
  if (normSheet.includes('PROGRAM')) return 'AUDIT_PROGRAM_MASTER';
  if (normSheet.includes('USER')) return 'USER_MASTER';
  if (normSheet.includes('PLAN')) return 'AUDIT_PLANNING';
  if (normSheet.includes('REPORT')) return 'AUDIT_REPORTS_ENTRY';
  if (normSheet.includes('PARA')) return 'AUDIT_PARAS';
  if (normSheet.includes('REPLY')) return 'REPLY_ENTRY';
  if (normSheet.includes('DISPATCH')) return 'DISPATCH';
  if (normSheet.includes('REVIEW')) return 'REVIEW_TRACKING';

  // Rule 3: Detect by signature columns
  const headerKeys = headers.map(h => h.toUpperCase().replace(/\s+/g, '_'));
  if (headerKeys.includes('DEPT_CODE') && headerKeys.includes('DEPT_NAME')) return 'DEPARTMENT_MASTER';
  if (headerKeys.includes('EMP_NO') && headerKeys.includes('EMP_NAME')) return 'EMPLOYEE_MASTER';
  if (headerKeys.includes('PLAN_ID') && headerKeys.includes('PLANNED_MONTHS')) return 'AUDIT_PLANNING';
  if (headerKeys.includes('REPORT_ID') && headerKeys.includes('REPORT_NO')) return 'AUDIT_REPORTS_ENTRY';
  if (headerKeys.includes('PARA_ID') && headerKeys.includes('PARA_NO')) return 'AUDIT_PARAS';

  return null;
}

interface ImportStat {
  sheetName: string;
  tableName: TableName | 'SKIPPED';
  detectedColumns: string[];
  mappedColumns: string[];
  totalRecordsProcessed: number;
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  rows: any[];
}

interface ExcelImportProps {
  onSuccess: () => void;
}

export default function ExcelImport({ onSuccess }: ExcelImportProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processLogs, setProcessLogs] = useState<string[]>([]);
  const [importStats, setImportStats] = useState<ImportStat[] | null>(null);
  const [summaryStats, setSummaryStats] = useState<{
    totalSheets: number;
    totalTables: number;
    totalImported: number;
    totalFailed: number;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const logMessage = (msg: string) => {
    setProcessLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
        logMessage(`File selected via drop: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
      } else {
        alert('ORA-22288: Invalid format. Please drop a valid Excel file (.xlsx or .xls).');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      logMessage(`File selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    }
  };

  // Automated workbook ingest flow
  const handleIngestWorkbook = async (file: File) => {
    setIsProcessing(true);
    setProcessLogs([]);
    setImportStats(null);
    setSummaryStats(null);

    logMessage(`Initializing Oracle SQL Ingest Gateway for workbook: ${file.name}`);
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          if (!data) throw new Error("Could not read file binary buffer.");
          
          logMessage("Reading workbook binary records...");
          const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
          
          const sheetsCount = workbook.SheetNames.length;
          logMessage(`Workbook loaded successfully. Detected sheets count: ${sheetsCount}`);
          
          const statsList: ImportStat[] = [];
          let grandImported = 0;
          let grandFailed = 0;
          let grandSkipped = 0;
          let mappedTablesCount = 0;

          // For each sheet, we parse and auto-map
          for (const sheetName of workbook.SheetNames) {
            logMessage(`-----------------------------------------------------`);
            logMessage(`Analyzing worksheet name: "${sheetName}"`);
            
            const rawSheet = workbook.Sheets[sheetName];
            const rawRows = XLSX.utils.sheet_to_json<any>(rawSheet, { defval: '' });
            
            if (rawRows.length === 0) {
              logMessage(`Sheet "${sheetName}" is empty. Skipping analysis.`);
              continue;
            }

            // Detect headers
            const rawHeaders = Object.keys(rawRows[0]);
            logMessage(`Detected columns: [${rawHeaders.join(', ')}]`);

            const targetTable = findMatchingTable(sheetName, rawHeaders);
            if (!targetTable) {
              logMessage(`Could not resolve Oracle Table schema for Sheet "${sheetName}". Skipping.`);
              statsList.push({
                sheetName,
                tableName: 'SKIPPED',
                detectedColumns: rawHeaders,
                mappedColumns: [],
                totalRecordsProcessed: rawRows.length,
                importedCount: 0,
                skippedCount: rawRows.length,
                failedCount: 0,
                rows: []
              });
              continue;
            }

            mappedTablesCount++;
            logMessage(`>>> Automatically mapped sheet "${sheetName}" to module table "${targetTable}"`);

            // Profiling column associations
            const colMapRules = mapRawKeysToOracleSchema(rawHeaders);
            const mappedOracleCols = Object.values(colMapRules);
            logMessage(`Mapped Columns: [${Object.entries(colMapRules).map(([k,v]) => `${k} -> ${v}`).join(', ')}]`);

            // Retrieve current database table state to prevent duplicate matching
            const existingTableRes = await fetch(`/api/tables/${targetTable}`);
            const existingRows: any[] = existingTableRes.ok ? await existingTableRes.json() : [];
            
            // Primary key detection
            const pkName = (() => {
              if (targetTable === 'DEPARTMENT_MASTER') return 'DEPT_ID';
              if (targetTable === 'EMPLOYEE_MASTER') return 'EMP_ID';
              if (targetTable === 'AUDIT_PROGRAM_MASTER') return 'PROG_ID';
              if (targetTable === 'USER_MASTER') return 'USER_ID';
              if (targetTable === 'ROLE_MASTER') return 'ROLE_CODE';
              if (targetTable === 'STATUS_MASTER') return 'STATUS_CODE';
              if (targetTable === 'AUDIT_PLANNING') return 'PLAN_ID';
              if (targetTable === 'AUDIT_REPORTS_ENTRY') return 'REPORT_ID';
              if (targetTable === 'REPLY_ENTRY') return 'REPLY_ID';
              if (targetTable === 'DISPATCH') return 'DISPATCH_ID';
              if (targetTable === 'AUDIT_PARAS') return 'PARA_ID';
              if (targetTable === 'REVIEW_TRACKING') return 'REVIEW_ID';
              return 'LOG_ID';
            })();

            logMessage(`Mapping key constraint configured: "${pkName}"`);

            let importedCount = 0;
            let skippedCount = 0;
            let failedCount = 0;
            const updatedRows: any[] = [];

            // Import in batches of 50 for large datasets performance limit
            const batchSize = 50;
            for (let i = 0; i < rawRows.length; i += batchSize) {
              const batch = rawRows.slice(i, i + batchSize);
              logMessage(`Directing relational batch [${i + 1} to ${Math.min(i + batchSize, rawRows.length)}] into database...`);

              for (const rawRow of batch) {
                // Initialize model according to matched schema rules
                const record: Record<string, any> = {};
                
                // Keep default values
                if (targetTable === 'DEPARTMENT_MASTER') {
                  record.STATUS = 'Active';
                  record.CREATION_DATE = new Date().toISOString().split('T')[0];
                  record.CREATED_BY = 'OFFLINE_EXCEL_AGENT';
                } else if (targetTable === 'EMPLOYEE_MASTER') {
                  record.IS_ACTIVE = 'Y';
                  record.CREATION_DATE = new Date().toISOString().split('T')[0];
                  record.CREATED_BY = 'OFFLINE_EXCEL_AGENT';
                } else if (targetTable === 'AUDIT_PLANNING') {
                  record.STATUS = 'Draft';
                  record.CREATION_DATE = new Date().toISOString().split('T')[0];
                }

                // Map raw row values based on column associations
                rawHeaders.forEach(field => {
                  const dbCol = colMapRules[field];
                  if (dbCol) {
                    let val = rawRow[field];
                    // Clean fields
                    if (val instanceof Date) {
                      val = val.toISOString().split('T')[0];
                    }
                    record[dbCol] = val;
                  }
                });

                // Enforce mandatory column validations
                let isValid = true;
                if (targetTable === 'DEPARTMENT_MASTER' && !record.DEPT_CODE) isValid = false;
                if (targetTable === 'EMPLOYEE_MASTER' && (!record.EMP_NO || !record.EMP_NAME)) isValid = false;
                if (targetTable === 'AUDIT_PLANNING' && !record.TITLE) isValid = false;
                if (targetTable === 'AUDIT_PARAS' && (!record.REPORT_ID || !record.PARA_NO || !record.TITLE)) isValid = false;

                if (!isValid) {
                  failedCount++;
                  grandFailed++;
                  continue;
                }

                // Auto generate primary key values if missing or blank
                if (!record[pkName]) {
                  if (['DEPARTMENT_MASTER', 'EMPLOYEE_MASTER', 'AUDIT_PROGRAM_MASTER', 'USER_MASTER'].includes(targetTable)) {
                    record[pkName] = Math.floor(25000 + Math.random() * 70000);
                  } else {
                    record[pkName] = `${targetTable.substring(0, 3)}-${Math.floor(10000 + Math.random() * 90000)}`;
                  }
                }

                // Ensure integrity checks (referential mappings)
                if (targetTable === 'EMPLOYEE_MASTER' && record.DEPT_CODE) {
                  // Ensure department code exists in DEPT table
                  const deptExists = existingRows.some(d => d.DEPT_CODE === record.DEPT_CODE) || 
                                     statsList.find(s => s.tableName === 'DEPARTMENT_MASTER')?.rows.some(d => d.DEPT_CODE === record.DEPT_CODE);
                  if (!deptExists && record.DEPT_CODE !== 'SYSTEM') {
                    // Relational repair auto trigger
                    logMessage(`Relational integrity constraint trigger: Dept Code "${record.DEPT_CODE}" missing. Registering placeholder in Master.`);
                    const newDeptRec = {
                      DEPT_ID: Math.floor(100 + Math.random() * 900),
                      DEPT_CODE: record.DEPT_CODE,
                      DEPT_NAME: `${record.DEPT_CODE} Sector`,
                      HEAD_NAME: 'Shri Auto Appointed HOD',
                      STATUS: 'Active',
                      CREATION_DATE: new Date().toISOString().split('T')[0],
                      CREATED_BY: 'DATABASE_RELATIONAL_REPAIR'
                    };
                    await fetch('/api/tables/DEPARTMENT_MASTER', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(newDeptRec)
                    });
                  }
                }

                // Check for duplicates
                const isDuplicate = existingRows.some(x => {
                  if (pkName && x[pkName] === record[pkName]) return true;
                  // Complex duplicate heuristics
                  if (targetTable === 'DEPARTMENT_MASTER' && x.DEPT_CODE === record.DEPT_CODE) return true;
                  if (targetTable === 'EMPLOYEE_MASTER' && x.EMP_NO === record.EMP_NO) return true;
                  if (targetTable === 'AUDIT_PLANNING' && x.TITLE === record.TITLE && (x.QUARTER === record.QUARTER || x.FINANCIAL_YEAR === record.FINANCIAL_YEAR)) return true;
                  return false;
                });

                if (isDuplicate) {
                  skippedCount++;
                  grandSkipped++;
                  continue;
                }

                // Commit record to Database REST endpoints
                const postRes = await fetch(`/api/tables/${targetTable}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(record)
                });

                if (postRes.ok) {
                  importedCount++;
                  grandImported++;
                  updatedRows.push(record);
                } else {
                  failedCount++;
                  grandFailed++;
                }
              }
            }

            statsList.push({
              sheetName,
              tableName: targetTable,
              detectedColumns: rawHeaders,
              mappedColumns: mappedOracleCols,
              totalRecordsProcessed: rawRows.length,
              importedCount,
              skippedCount,
              failedCount,
              rows: updatedRows
            });

            logMessage(`Sheet results: Mapped ${importedCount} records successfully, skipped ${skippedCount} duplicate rows, failed ${failedCount}.`);
          }

          setImportStats(statsList);
          setSummaryStats({
            totalSheets: sheetsCount,
            totalTables: mappedTablesCount,
            totalImported: grandImported,
            totalFailed: grandFailed
          });

          logMessage(`=====================================================`);
          logMessage(`Master dataset ingestion transaction COMPLETE.`);
          logMessage(`Successfully written ${grandImported} records into relational tables!`);
          
          setIsProcessing(false);
          // Reload overall state via parent hook
          onSuccess();
        } catch (err: any) {
          logMessage(`ERROR: DB Link Parsing Exception: ${err.message}`);
          setIsProcessing(false);
        }
      };

      reader.readAsBinaryString(file);
    } catch (e: any) {
      logMessage(`FATAL: Ingestion thread interrupted: ${e.message}`);
      setIsProcessing(false);
    }
  };

  // Pre-seeded automatic dataset creation to load comprehensive ERP demo database
  const handleAutoGeneratePreseededDataset = () => {
    logMessage("Initializing dynamic Visakhapatnam Steel Plant Master dataset generation...");
    
    // Create preseeded sheets
    const workbook = XLSX.utils.book_new();

    // Sheet 1: DEPARTMENT_MASTER
    const deptData = [
      { 'Department ID': 110, 'Department Oracle Code': 'IRON_ST', 'Department Corporate Name': 'Iron & Steel Making Div', 'Department Head (HOD)': 'Shri S.N. Singh', 'Intercom Contact Number': '7032115140', 'Department Status': 'Active' },
      { 'Department ID': 111, 'Department Oracle Code': 'LIME_CAL', 'Department Corporate Name': 'Lime Calcination Plant', 'Department Head (HOD)': 'Shri B.K. Patra', 'Intercom Contact Number': '7032115141', 'Department Status': 'Active' },
      { 'Department ID': 112, 'Department Oracle Code': 'RO_MILLS', 'Department Corporate Name': 'Rolling Mills Complex', 'Department Head (HOD)': 'Smt. S. Chatterjee', 'Intercom Contact Number': '7032115142', 'Department Status': 'Active' },
      { 'Department ID': 113, 'Department Oracle Code': 'MED_DIV_V', 'Department Corporate Name': 'VSKP General Medical Division', 'Department Head (HOD)': 'Dr. G.S. Prasad', 'Intercom Contact Number': '7552115201', 'Department Status': 'Active' },
      { 'Department ID': 114, 'Department Oracle Code': 'CONT_PUR', 'Department Corporate Name': 'Contracts & Purchase Sector', 'Department Head (HOD)': 'Shri Mukesh Patel', 'Intercom Contact Number': '7032115143', 'Department Status': 'Active' },
      { 'Department ID': 115, 'Department Oracle Code': 'POWER_PL', 'Department Corporate Name': 'Captive Thermal Power Plant', 'Department Head (HOD)': 'Shri N. Narasimhas', 'Intercom Contact Number': '7032115144', 'Department Status': 'Active' },
      { 'Department ID': 116, 'Department Oracle Code': 'MKT_CENT', 'Department Corporate Name': 'Central Marketing Wing VSP', 'Department Head (HOD)': 'Shri Anil Kumar', 'Intercom Contact Number': '7032115145', 'Department Status': 'Active' },
      { 'Department ID': 117, 'Department Oracle Code': 'SAF_INSP', 'Department Corporate Name': 'Corporate Safety & Inspection', 'Department Head (HOD)': 'Shri R.D. Rao', 'Intercom Contact Number': '7032115146', 'Department Status': 'Active' }
    ];
    const deptSheet = XLSX.utils.json_to_sheet(deptData);
    XLSX.utils.book_append_sheet(workbook, deptSheet, 'DEPARTMENT_MASTER');

    // Sheet 2: EMPLOYEE_MASTER
    const empData = [
      { 'Employee ID': 410, 'Personal Ticket No': 'EMP-11200', 'Employee Full Name': 'Shri S.N. Singh', 'Official Intranet Email': 'sn.singh@vizagsteel.com', 'Assigned Department': 'IRON_ST', 'Official Grade Designation': 'CGM (Iron & Steel)', 'Active status code (Y/N)': 'Y' },
      { 'Employee ID': 411, 'Personal Ticket No': 'EMP-11300', 'Employee Full Name': 'Shri B.K. Patra', 'Official Intranet Email': 'bk.patra@vizagsteel.com', 'Assigned Department': 'LIME_CAL', 'Official Grade Designation': 'GM (Calcination)', 'Active status code (Y/N)': 'Y' },
      { 'Employee ID': 412, 'Personal Ticket No': 'EMP-11400', 'Employee Full Name': 'Smt. S. Chatterjee', 'Official Intranet Email': 's.chatter@vizagsteel.com', 'Assigned Department': 'RO_MILLS', 'Official Grade Designation': 'DGM (Rolling)', 'Active status code (Y/N)': 'Y' },
      { 'Employee ID': 413, 'Personal Ticket No': 'EMP-11500', 'Employee Full Name': 'Dr. G.S. Prasad', 'Official Intranet Email': 'gs.prasad@vizagsteel.com', 'Assigned Department': 'MED_DIV_V', 'Official Grade Designation': 'Chief Medical Officer', 'Active status code (Y/N)': 'Y' },
      { 'Employee ID': 414, 'Personal Ticket No': 'EMP-11600', 'Employee Full Name': 'Shri Mukesh Patel', 'Official Intranet Email': 'mukesh.p@vizagsteel.com', 'Assigned Department': 'CONT_PUR', 'Official Grade Designation': 'DGM (Contracts)', 'Active status code (Y/N)': 'Y' },
      { 'Employee ID': 415, 'Personal Ticket No': 'EMP-11700', 'Employee Full Name': 'Shri N. Narasimhas', 'Official Intranet Email': 'n.narasimha@vizagsteel.com', 'Assigned Department': 'POWER_PL', 'Official Grade Designation': 'AGM (Thermal)', 'Active status code (Y/N)': 'Y' },
      { 'Employee ID': 416, 'Personal Ticket No': 'EMP-11800', 'Employee Full Name': 'Shri Anil Kumar', 'Official Intranet Email': 'anil.k@vizagsteel.com', 'Assigned Department': 'MKT_CENT', 'Official Grade Designation': 'Manager (Sales)', 'Active status code (Y/N)': 'Y' },
      { 'Employee ID': 417, 'Personal Ticket No': 'EMP-11900', 'Employee Full Name': 'Shri R.D. Rao', 'Official Intranet Email': 'rd.rao@vizagsteel.com', 'Assigned Department': 'SAF_INSP', 'Official Grade Designation': 'GM (Safety Ops)', 'Active status code (Y/N)': 'Y' },
      { 'Employee ID': 418, 'Personal Ticket No': 'EMP-12000', 'Employee Full Name': 'Smt. Karuna Devi', 'Official Intranet Email': 'karuna.d@vizagsteel.com', 'Assigned Department': 'IRON_ST', 'Official Grade Designation': 'Senior Engineer', 'Active status code (Y/N)': 'Y' },
      { 'Employee ID': 419, 'Personal Ticket No': 'EMP-12100', 'Employee Full Name': 'Shri Sunil Ganguly', 'Official Intranet Email': 'suganguly@vizagsteel.com', 'Assigned Department': 'RO_MILLS', 'Official Grade Designation': 'Assistant Manager', 'Active status code (Y/N)': 'Y' }
    ];
    const empSheet = XLSX.utils.json_to_sheet(empData);
    XLSX.utils.book_append_sheet(workbook, empSheet, 'EMPLOYEE_MASTER');

    // Sheet 3: AUDIT_PLANNING
    const planData = [
      { 'Audit Scheme ID': 'PLN-2026-610', 'Comprehensive Objective Title': 'Evaluation of Oxygen Injection Speed & Furnace Refractory Scans', 'Fiscal Financial Period': '2026-27', 'Audit Classification Category': 'Special', 'Department Scoped': 'IRON_ST', 'Intended Execution Month Blocks': 'February, March', 'Assigned Directing Lead Auditor': 'Smt. P. Lakshmi', 'Estimated Commissioning Date': '2026-02-10', 'Estimated Decommission Date': '2026-03-25', 'Current Plan Status': 'Executed' },
      { 'Audit Scheme ID': 'PLN-2026-611', 'Comprehensive Objective Title': 'Safety Review of Captive Thermal Plant High Pressure Boilers', 'Fiscal Financial Period': '2026-27', 'Audit Classification Category': 'Regular', 'Department Scoped': 'POWER_PL', 'Intended Execution Month Blocks': 'August, September', 'Assigned Directing Lead Auditor': 'Shri J.C. Bose', 'Estimated Commissioning Date': '2026-08-01', 'Estimated Decommission Date': '2026-09-15', 'Current Plan Status': 'Approved' },
      { 'Audit Scheme ID': 'PLN-2026-612', 'Comprehensive Objective Title': 'Performance audit on Finished Billets Distribution & Sales Billing logs', 'Fiscal Financial Period': '2026-27', 'Audit Classification Category': 'Regular', 'Department Scoped': 'MKT_CENT', 'Intended Execution Month Blocks': 'October', 'Assigned Directing Lead Auditor': 'Smt. P. Lakshmi', 'Estimated Commissioning Date': '2026-10-01', 'Estimated Decommission Date': '2026-10-31', 'Current Plan Status': 'Draft' },
      { 'Audit Scheme ID': 'PLN-2026-613', 'Comprehensive Objective Title': 'Compliance Audit of Scrap Metal Salvage Contracts', 'Fiscal Financial Period': '2026-27', 'Audit Classification Category': 'Statutory', 'Department Scoped': 'CONT_PUR', 'Intended Execution Month Blocks': 'December', 'Assigned Directing Lead Auditor': 'Smt. P. Lakshmi', 'Estimated Commissioning Date': '2026-12-05', 'Estimated Decommission Date': '2027-01-10', 'Current Plan Status': 'Approved' }
    ];
    const planSheet = XLSX.utils.json_to_sheet(planData);
    XLSX.utils.book_append_sheet(workbook, planSheet, 'AUDIT_PLANNING');

    // Sheet 4: AUDIT_REPORTS_ENTRY
    const reportData = [
      { 'Corporate Report ID': 'REP-2026-710', 'Parent Audit Plan reference': 'PLN-2026-610', 'RINL Reference Letter No': 'RINL/AUD/IRON/2026/18', 'Audit Report Subject': 'Oxygen Injection Variance & Refractory Safety Scan report', 'Start Coverage': '2026-02-10', 'End Coverage': '2026-03-25', 'Authoring Controller Inspector': 'Smt. P. Lakshmi', 'Audited Division Code': 'IRON_ST', 'Draught Date': '2026-03-28', 'Current Report Validation Tier': 'Authorized', 'Observations count': 3 },
      { 'Corporate Report ID': 'REP-2026-711', 'Parent Audit Plan reference': 'PLN-2026-611', 'RINL Reference Letter No': 'RINL/AUD/PWR/2026/04', 'Audit Report Subject': 'Boiler Integrity High-Level Inspection Report', 'Start Coverage': '2026-08-01', 'End Coverage': '2026-08-20', 'Authoring Controller Inspector': 'Shri J.C. Bose', 'Audited Division Code': 'POWER_PL', 'Draught Date': '2026-08-25', 'Current Report Validation Tier': 'Draft', 'Observations count': 1 }
    ];
    const reportSheet = XLSX.utils.json_to_sheet(reportData);
    XLSX.utils.book_append_sheet(workbook, reportSheet, 'AUDIT_REPORTS_ENTRY');

    // Sheet 5: AUDIT_PARAS
    const paraData = [
      { 'Para ID Reference': 'PR-850', 'Parent report number': 'REP-2026-710', 'Section Para code (e.g. 1.1)': 'Para-1.1', 'Direct Observation title': 'EXCESS OXYGEN CONSUMPTION RECORDINGS IN FURNACE-B', 'Priority Severity categorization': 'Critical', 'Detailed Core Observation Description': 'Oxygen rates tracked in primary oxygen lance nozzle B exceeded the safe thermal standard parameters by 18.4% during slag tapping intervals. Over-oxidation has induced early refractory jacket degradation risks.', 'Loss Implication value (INR ₹)': 5400000, 'Current Para state code': 'Outstanding', 'Assigned Respondent': '410', 'Associated DAK tracking barcode': 'DK-2026-5301' },
      { 'Para ID Reference': 'PR-851', 'Parent report number': 'REP-2026-710', 'Section Para code (e.g. 1.1)': 'Para-1.2', 'Direct Observation title': 'NON-MAINTENANCE OF INTRUSION SCANNERS FOR SPOUT SEGMENT', 'Priority Severity categorization': 'Major', 'Detailed Core Observation Description': 'Central automated spout cameras were found offline during five major high-heat charges. Replaced by manual physical verification which is non-compliant with standard corporate safety directive 14B.', 'Loss Implication value (INR ₹)': 1200000, 'Current Para state code': 'Under Review', 'Assigned Respondent': '410', 'Associated DAK tracking barcode': 'DK-2026-5302' },
      { 'Para ID Reference': 'PR-852', 'Parent report number': 'REP-2026-710', 'Section Para code (e.g. 1.1)': 'Para-1.3', 'Direct Observation title': 'DISCREPANCY IN REFRACTORY BRICK ALLOCATION FOR SLAG WELL', 'Priority Severity categorization': 'Critical', 'Detailed Core Observation Description': 'Discrepancy of 1450 Units of high-heat premium silicon refractory bricks detected in the inventory store vs material charge slips. Materials worth ₹15.8 Lakh remain unaccounted for.', 'Loss Implication value (INR ₹)': 1580000, 'Current Para state code': 'Outstanding', 'Assigned Respondent': '410', 'Associated DAK tracking barcode': 'DK-2026-5303' },
      { 'Para ID Reference': 'PR-853', 'Parent report number': 'REP-2026-711', 'Section Para code (e.g. 1.1)': 'Para-1.1', 'Direct Observation title': 'ABSENCE OF CERTIFIED NDT THICKNESS SCANS FOR REHEATER PIPING', 'Priority Severity categorization': 'Major', 'Detailed Core Observation Description': 'No thickness certificate logged for Reheater block HP-4 lines since January 2025. Boiler safety rules dictate mandatory NDT thickness ultrasound mapping every 12 months.', 'Loss Implication value (INR ₹)': 3200000, 'Current Para state code': 'Outstanding', 'Assigned Respondent': '415', 'Associated DAK tracking barcode': 'DK-2026-5304' }
    ];
    const paraSheet = XLSX.utils.json_to_sheet(paraData);
    XLSX.utils.book_append_sheet(workbook, paraSheet, 'AUDIT_PARAS');

    // Create Excel file in-memory
    const wOpts: XLSX.WritingOptions = { bookType: 'xlsx', bookSST: false, type: 'binary' };
    const wBinary = XLSX.write(workbook, wOpts);
    
    // Create browser binary stream properties
    const buffer = new ArrayBuffer(wBinary.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < wBinary.length; i++) {
      view[i] = wBinary.charCodeAt(i) & 0xFF;
    }
    
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const virtualFile = new File([blob], 'VSP_MASTER_DATASET_IMPORT.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    setSelectedFile(virtualFile);
    logMessage("Successfully formulated preseeded Visakhapatnam Steel Plant Master dataset (XLSX). Triggering SQL Ingestion automatic parser thread!");
    handleIngestWorkbook(virtualFile);
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    setImportStats(null);
    setSummaryStats(null);
    setProcessLogs([]);
    logMessage("Central files selection cleared.");
  };

  return (
    <div id="aims-excel-importer" className="p-6 space-y-6 font-sans animate-fade-in p-6">
      
      {/* 1. Header Banner */}
      <div className="bg-white border border-slate-300 p-5 rounded-sm shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] bg-blue-100 text-blue-900 border border-blue-200 uppercase font-black px-2.5 py-0.5 rounded font-mono">FORM-99 CENTRAL SCHEME INTEGRATION</span>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 mt-1">
            <FileSpreadsheet className="w-5.5 h-5.5 text-emerald-700" />
            Corporate Master Dataset Integration Terminal
          </h2>
          <p className="text-xs text-slate-500 font-medium font-sans mt-0.5">Automated deep spreadsheet ingestion, automatic schema profiling, FK resolving and batched SQL linking inside the relational Oracle AIMS Nodes.</p>
        </div>
        
        <button 
          id="xlsx-auto-preseed-btn"
          onClick={handleAutoGeneratePreseededDataset}
          className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-850 text-white font-black px-4 py-2 text-xs rounded shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer border border-emerald-500 hover:scale-[1.02]"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          Auto Ingest Master VSP Dataset
        </button>
      </div>

      {/* 2. Drag & Drop Container or Results Visualizers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Selector + Logs (4 cols on lg) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* File input widget */}
          <div className="bg-white border border-slate-300 rounded-sm shadow-sm overflow-hidden text-xs">
            <div className="bg-[#1e3a8a] text-white p-3.5 flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 uppercase tracking-wide">
                <Upload className="w-4 h-4 text-yellow-500" />
                Select Excel File File
              </span>
              <Server className="w-3.5 h-3.5 text-slate-300" />
            </div>

            <div className="p-5 space-y-4">
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-sm p-6 text-center transition-all flex flex-col items-center justify-center gap-2.5 ${
                  isDragOver 
                    ? 'border-blue-700 bg-blue-50/50 scale-[0.99] shadow-inner' 
                    : selectedFile 
                      ? 'border-emerald-500 bg-emerald-50/20' 
                      : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className={`p-3 rounded-full ${selectedFile ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-50 text-blue-800'}`}>
                  <FileSpreadsheet className="w-7 h-7" />
                </div>

                {selectedFile ? (
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-800 break-all">{selectedFile.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{(selectedFile.size / 1024).toFixed(1)} KB &bull; Excel Workbook File</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-bold text-slate-700">Drag & Drop master workbook here</p>
                    <p className="text-[10px] text-slate-400">or click to browse your workspace</p>
                  </div>
                )}

                <input 
                  id="excel-file-hidden-picker"
                  type="file" 
                  accept=".xlsx, .xls" 
                  onChange={handleFileChange}
                  className="hidden" 
                />
                
                <button
                  type="button"
                  onClick={() => document.getElementById('excel-file-hidden-picker')?.click()}
                  className="mt-2 px-3 py-1 bg-white border border-slate-320 border-slate-300 hover:border-slate-420 hover:bg-slate-50 rounded text-slate-700 font-bold transition-all text-[11px] cursor-pointer"
                >
                  {selectedFile ? 'Change File' : 'Browse Local Files'}
                </button>
              </div>

              {selectedFile && (
                <div className="flex gap-2">
                  <button
                    id="excel-ingest-trigger-btn"
                    disabled={isProcessing}
                    onClick={() => handleIngestWorkbook(selectedFile)}
                    className="flex-1 bg-[#1e3a8a] hover:bg-blue-900 font-black text-white px-3 py-2 rounded text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader className="w-3.5 h-3.5 animate-spin" />
                        Processing Ingestion...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-yellow-400" />
                        Instate System Import
                      </>
                    )}
                  </button>

                  <button
                    id="excel-clear-picker-btn"
                    disabled={isProcessing}
                    onClick={handleClearSelection}
                    className="bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 px-3 py-2 rounded text-xs transition-all cursor-pointer border border-slate-300"
                  >
                    Clear File
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Process logs tracking */}
          <div className="bg-white border border-slate-300 rounded-sm shadow-sm overflow-hidden text-xs flex flex-col h-[280px]">
            <div className="bg-slate-100 px-3.5 py-3 border-b flex items-center justify-between">
              <span className="font-bold uppercase text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-700" />
                Ingestion Engine Transaction Logs
              </span>
              <RefreshCw className="w-3.5 h-3.5 text-slate-505 text-slate-500 animate-pulse" />
            </div>
            
            <div className="p-3.5 flex-1 bg-slate-900 text-slate-300 font-mono text-[9.5px] overflow-y-auto space-y-1.5 leading-relaxed selection:bg-slate-800">
              {processLogs.length === 0 ? (
                <p className="text-slate-500 italic">No transactions running. Load workbook to initiate deep sync protocols.</p>
              ) : (
                processLogs.map((log, idx) => (
                  <p key={idx} className={log.includes('ERROR') ? 'text-rose-400 font-bold' : log.includes('>>>') ? 'text-emerald-400' : 'text-slate-300'}>
                    {log}
                  </p>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Schema/Table Summary (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Summary Dashboard widget */}
          {summaryStats && (
            <div className="grid grid-cols-4 gap-4 animate-fade-in" id="import-summary-cards">
              <div className="bg-white border-l-4 border-blue-800 border p-4 rounded-sm shadow-xs space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase font-mono block">Sheets Detected</span>
                <p className="text-xl font-black text-blue-900">{summaryStats.totalSheets}</p>
                <span className="text-[9.5px] text-slate-400 font-mono">In workbook file</span>
              </div>
              <div className="bg-white border-l-4 border-emerald-600 border p-4 rounded-sm shadow-xs space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase font-mono block">Tables Identified</span>
                <p className="text-xl font-black text-emerald-800">{summaryStats.totalTables}</p>
                <span className="text-[9.5px] text-slate-400 font-mono">Mapped structures</span>
              </div>
              <div className="bg-white border-l-4 border-indigo-700 border p-4 rounded-sm shadow-xs space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase font-mono block">Records Imported</span>
                <p className="text-xl font-black text-indigo-900">{summaryStats.totalImported}</p>
                <span className="text-[9.5px] text-slate-400 font-mono">Inserted to Oracle</span>
              </div>
              <div className="bg-white border-l-4 border-amber-500 border p-4 rounded-sm shadow-xs space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase font-mono block">Failed Entries</span>
                <p className={`text-xl font-black ${summaryStats.totalFailed > 0 ? 'text-amber-700 animate-pulse' : 'text-slate-605 text-slate-600'}`}>{summaryStats.totalFailed}</p>
                <span className="text-[9.5px] text-slate-400 font-mono">Validation bugs</span>
              </div>
            </div>
          )}

          {/* Mapped Modules / Sheet Summary List */}
          <div className="bg-white border border-slate-300 rounded-sm shadow-sm overflow-hidden text-xs">
            <div className="bg-gradient-to-r from-gov-blue-800 to-indigo-950 text-white p-4 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-[#93c5fd] font-bold uppercase block">AUTOMATIC SCHEMA PROFILER MATCHES</span>
                <h3 className="text-[14px] font-black">Datatypes Map & Referential Schemas</h3>
              </div>
              <Database className="w-5 h-5 text-yellow-500" />
            </div>

            <div className="p-4 space-y-4">
              {!importStats ? (
                <div className="text-center py-20 bg-slate-50 border border-slate-200 rounded-sm">
                  <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-600">Central Mapping Summary Idle</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Please ingest an Excel workbook or trigger VisaKhapatnam steel preseeded master.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[380px] overflow-y-auto">
                  {importStats.map((stat, index) => (
                    <div key={index} className={`border rounded-sm ${stat.tableName === 'SKIPPED' ? 'border-amber-250 border-amber-200 bg-amber-50/10' : 'border-slate-205 border-slate-200 bg-white'} p-4.5 space-y-3 shadow-3xs hover:shadow-2xs transition-all`}>
                      <div className="flex md:items-center justify-between flex-col md:flex-row gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className={`w-4 h-4 ${stat.tableName === 'SKIPPED' ? 'text-amber-600' : 'text-emerald-600'}`} />
                          <span className="font-extrabold text-[#111827] text-sm font-sans">{stat.sheetName}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          {stat.tableName === 'SKIPPED' ? (
                            <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[10px] uppercase font-black px-2 py-0.5 rounded font-mono">Skipped Sheet</span>
                          ) : (
                            <span className="bg-blue-105 bg-blue-50 text-[#1e3a8a] border border-blue-200 text-[10px] uppercase font-black px-2 py-0.5 rounded font-mono">{stat.tableName}</span>
                          )}
                        </div>
                        <span className="text-slate-500 font-mono font-bold whitespace-nowrap text-[10.5px]">
                          {stat.totalRecordsProcessed} Records Mapped
                        </span>
                      </div>

                      {stat.tableName !== 'SKIPPED' && (
                        <div className="text-[11px] text-slate-600 space-y-2.5">
                          {/* Columns matched mapping badge lists */}
                          <div className="bg-slate-50 p-2.5 border border-slate-150 rounded-xs">
                            <span className="text-[9px] font-bold text-slate-500 block uppercase font-mono tracking-wide mb-1">AUTOMAPPED ATTRIBUTES / FIELDS</span>
                            <div className="flex flex-wrap gap-1.5">
                              {stat.detectedColumns.map((col, cIdx) => {
                                const mapped = stat.mappedColumns[cIdx];
                                return (
                                  <span key={cIdx} className={`text-[9.5px] px-1.5 py-0.5 border rounded-xs font-mono font-medium flex items-center gap-1 ${
                                    mapped 
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                      : 'bg-slate-100 text-slate-500 border-slate-200 line-through'
                                  }`}>
                                    {col} {mapped && <span className="text-slate-400 font-sans font-bold">➔ {mapped}</span>}
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          {/* Records progression splits */}
                          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-semibold uppercase tracking-wider font-mono">
                            <div className="bg-green-50 text-green-800 border border-green-200 rounded p-1.5">
                              <span className="text-[8.5px] text-green-600 block mb-0.5 font-bold">COMITTED INSERT</span>
                              <span className="text-xs font-extrabold">{stat.importedCount} rows</span>
                            </div>
                            <div className="bg-slate-50 text-slate-600 border border-slate-200 rounded p-1.5">
                              <span className="text-[8.5px] text-slate-500 block mb-0.5 font-bold">SKIP DUPLICATES</span>
                              <span className="text-xs font-extrabold">{stat.skippedCount} rows</span>
                            </div>
                            <div className="bg-amber-50 text-amber-800 border border-amber-200 rounded p-1.5">
                              <span className="text-[8.5px] text-amber-600 block mb-0.5 font-bold">VALIDATION FAILURE</span>
                              <span className="text-xs font-extrabold">{stat.failedCount} rows</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
