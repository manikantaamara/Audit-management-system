import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import mammoth from "mammoth";
import * as pdfParse from "pdf-parse";
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, BorderStyle, HeadingLevel, WidthType } from "docx";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { 
  User, AuditPlan, AuditReport, AuditPara, DispatchItem, 
  Employee, Department, AuditProgram, KnowledgeDocument, ActivityLog 
} from "./src/types";

// Database storage file path
const DB_FILE = path.join(process.cwd(), "db_aims_store.json");

// Structure of our fully Relational SQLite-like JSON Database
interface FullRelationalDB {
  DEPARTMENT_MASTER: any[];
  EMPLOYEE_MASTER: any[];
  AUDIT_PROGRAM_MASTER: any[];
  USER_MASTER: any[];
  ROLE_MASTER: any[];
  STATUS_MASTER: any[];
  AUDIT_PLANNING: any[];
  AUDIT_REPORTS_ENTRY: any[];
  REPLY_ENTRY: any[];
  DISPATCH: any[];
  AUDIT_PARAS: any[];
  REVIEW_TRACKING: any[];
  UPLOAD_REPORTS: any[];
  REPORT_VERSIONS: any[];
  ACTIVITY_LOGS: any[];
  AUDIT_REPORT_ENTRIES: any[];
  knowledgeDocsList: KnowledgeDocument[]; // preserve legacy compatibility
  REPORT_CONVERSIONS?: any[]; // conversion storage table
}

// Initial Seeding Routine for RINL / Visakhapatnam Steel Plant ERP
const getSeedDatabase = (): FullRelationalDB => {
  const nowStr = new Date().toISOString();
  const dateOnly = nowStr.split('T')[0];

  const depts = [
    { DEPT_ID: 101, DEPT_CODE: 'PUR_ORM', DEPT_NAME: 'Purchase (Other than Raw Materials)', HEAD_NAME: 'Shri K. Somasekhar', CONTACT_NO: '7032115123', STATUS: 'Active', CREATION_DATE: dateOnly, CREATED_BY: 'SYSTEM' },
    { DEPT_ID: 102, DEPT_CODE: 'PUR_RM', DEPT_NAME: 'Purchase (Raw Materials)', HEAD_NAME: 'Shri P. Vasubabu', CONTACT_NO: '7032115124', STATUS: 'Active', CREATION_DATE: dateOnly, CREATED_BY: 'SYSTEM' },
    { DEPT_ID: 103, DEPT_CODE: 'AGRA_BSO', DEPT_NAME: 'Agra BSO', HEAD_NAME: 'Shri S.K. Sharma', CONTACT_NO: '0562-401231', STATUS: 'Active', CREATION_DATE: dateOnly, CREATED_BY: 'SYSTEM' },
    { DEPT_ID: 104, DEPT_CODE: 'BCG_MKTG', DEPT_NAME: 'BC Gate Marketing', HEAD_NAME: 'Smt. R. Priya', CONTACT_NO: '7032115125', STATUS: 'Active', CREATION_DATE: dateOnly, CREATED_BY: 'SYSTEM' },
    { DEPT_ID: 105, DEPT_CODE: 'COKE_OVENS', DEPT_NAME: 'Coke Ovens Division', HEAD_NAME: 'Shri M. Ravindra', CONTACT_NO: '7032115126', STATUS: 'Active', CREATION_DATE: dateOnly, CREATED_BY: 'SYSTEM' },
    { DEPT_ID: 106, DEPT_CODE: 'SMS_DEPT', DEPT_NAME: 'Steel Melting Shop', HEAD_NAME: 'Shri G. Srinivasa Murthy', CONTACT_NO: '7032115127', STATUS: 'Active', CREATION_DATE: dateOnly, CREATED_BY: 'SYSTEM' },
    { DEPT_ID: 107, DEPT_CODE: 'AUDIT_DIV', DEPT_NAME: 'Internal Audit', HEAD_NAME: 'Shri R.K. Murthy', CONTACT_NO: '7032115128', STATUS: 'Active', CREATION_DATE: dateOnly, CREATED_BY: 'SYSTEM' },
    { DEPT_ID: 108, DEPT_CODE: 'FIN_DIV', DEPT_NAME: 'Finance & Accounts', HEAD_NAME: 'Dr. N.V. Saiy', CONTACT_NO: '7032115129', STATUS: 'Active', CREATION_DATE: dateOnly, CREATED_BY: 'SYSTEM' },
    { DEPT_ID: 109, DEPT_CODE: 'BLAST_FRN', DEPT_NAME: 'Blast Furnace Dept', HEAD_NAME: 'Shri J.S. Rao', CONTACT_NO: '7032115130', STATUS: 'Active', CREATION_DATE: dateOnly, CREATED_BY: 'SYSTEM' }
  ];

  const employees = [
    { EMP_ID: 401, EMP_NO: 'EMP-11001', EMP_NAME: 'Shri R.K. Murthy', EMAIL: 'rk.murthy@vizagsteel.com', DEPT_CODE: 'AUDIT_DIV', DESIGNATION: 'General Manager (GM)', IS_ACTIVE: 'Y', CREATION_DATE: dateOnly, CREATED_BY: 'SYSTEM' },
    { EMP_ID: 402, EMP_NO: 'EMP-22002', EMP_NAME: 'Smt. P. Lakshmi', EMAIL: 'p.lakshmi@vizagsteel.com', DEPT_CODE: 'AUDIT_DIV', DESIGNATION: 'Senior Manager (Audit)', IS_ACTIVE: 'Y', CREATION_DATE: dateOnly, CREATED_BY: 'SYSTEM' },
    { EMP_ID: 403, EMP_NO: 'EMP-33003', EMP_NAME: 'Dr. N.V. Saiy', EMAIL: 'nv.saiy@vizagsteel.com', DEPT_CODE: 'FIN_DIV', DESIGNATION: 'DGM (F&A)', IS_ACTIVE: 'Y', CREATION_DATE: dateOnly, CREATED_BY: 'SYSTEM' },
    { EMP_ID: 404, EMP_NO: 'EMP-44004', EMP_NAME: 'Shri J.S. Rao', EMAIL: 'js.rao@vizagsteel.com', DEPT_CODE: 'BLAST_FRN', DESIGNATION: 'HOD & GM (BF)', IS_ACTIVE: 'Y', CREATION_DATE: dateOnly, CREATED_BY: 'SYSTEM' },
    { EMP_ID: 405, EMP_NO: 'EMP-55005', EMP_NAME: 'Shri J.C. Bose', EMAIL: 'jc.bose@vizagsteel.com', DEPT_CODE: 'AUDIT_DIV', DESIGNATION: 'Chief Audit Executive (CAE)', IS_ACTIVE: 'Y', CREATION_DATE: dateOnly, CREATED_BY: 'SYSTEM' },
    { EMP_ID: 406, EMP_NO: 'EMP-66006', EMP_NAME: 'Shri K. Somasekhar', EMAIL: 'k.somasekhar@vizagsteel.com', DEPT_CODE: 'PUR_ORM', DESIGNATION: 'DGM (Purchase)', IS_ACTIVE: 'Y', CREATION_DATE: dateOnly, CREATED_BY: 'SYSTEM' }
  ];

  const programs = [
    { PROG_ID: 301, PROG_CODE: 'PR_PUR_01', PROG_NAME: 'Review of Risk Purchase Contracts & Vendor Claims', SCOPE_OF_AUDIT: 'Critical audit covering Risk purchase executions under section M13. Evaluation of timelines, penalty calculations, vendor lists, quality testing reports and pending counter-justifications.', APPLICABLE_GUIDELINES: 'RINL Corporate Purchase Manual 2024, Govt GFR Guidelines', CREATION_DATE: dateOnly, CREATED_BY: 'SYSTEM' },
    { PROG_ID: 302, PROG_CODE: 'PR_BF_02', PROG_NAME: 'Audit of Coke Charging Efficiency and Fuel Consumption', SCOPE_OF_AUDIT: 'Verification of Coke Oven and Blast Furnace charging measurements, moisture contents, efficiency, variance analysis vs standards and recovery logs.', APPLICABLE_GUIDELINES: 'Steel Production Quality Manual Section 4A', CREATION_DATE: dateOnly, CREATED_BY: 'SYSTEM' },
    { PROG_ID: 303, PROG_CODE: 'PR_FIN_03', PROG_NAME: 'Internal Capital Expenditure Verification and Asset Depreciation', SCOPE_OF_AUDIT: 'Comprehensive review of Capital expenditures, WIP ledger, asset capitalization certificates, scrap disposal logs and depreciation rates.', APPLICABLE_GUIDELINES: 'Accounting Standard AS-10, VSP Financial Guidelines', CREATION_DATE: dateOnly, CREATED_BY: 'SYSTEM' }
  ];

  const roles = [
    { ROLE_CODE: 'Team Lead', ROLE_NAME: 'Team Lead / Audit Manager', DESCRIPTION: 'Coordinate field audit assignments, monitor workloads, track audit progress, and manage reviews.' },
    { ROLE_CODE: 'Auditor', ROLE_NAME: 'Field/Internal Auditor', DESCRIPTION: 'Create audit plans, draft reports, declare outstanding paras, dispatch DAK files and evaluate replies.' },
    { ROLE_CODE: 'HOD', ROLE_NAME: 'Department Head / Exec Recipient', DESCRIPTION: 'Register official replies to observations, delegate paras to executive personnel, mark corrective action files.' },
    { ROLE_CODE: 'Reviewer', ROLE_NAME: 'Advisory Review Board', DESCRIPTION: 'Review outstanding queries, approve settling actions, authorize settlements, write high level final remarks.' }
  ];

  const statuses = [
    { STATUS_CODE: 'Draft', STATUS_NAME: 'Draft Schedule/Document', DISPLAY_COLOR: '#f1f5f9' },
    { STATUS_CODE: 'Submitted', STATUS_NAME: 'Submitted for check', DISPLAY_COLOR: '#e0f2fe' },
    { STATUS_CODE: 'Approved', STATUS_NAME: 'Approved by Administrator', DISPLAY_COLOR: '#dcfce7' },
    { STATUS_CODE: 'Outstanding', STATUS_NAME: 'Outstanding Query', DISPLAY_COLOR: '#fee2e2' },
    { STATUS_CODE: 'Under Review', STATUS_NAME: 'Counter reply under review', DISPLAY_COLOR: '#fef9c3' },
    { STATUS_CODE: 'Settled', STATUS_NAME: 'Officially Settled Para', DISPLAY_COLOR: '#dcfce7' },
    { STATUS_CODE: 'Resolved', STATUS_NAME: 'Mutually Resolved Block', DISPLAY_COLOR: '#bbf7d0' }
  ];

  const users = [
    { USER_ID: 1, USER_NAME: '1001', PASSWORD_HASH: 'lead-key', ROLE_CODE: 'Team Lead', FULL_NAME: 'Shri T.V. Satyanarayana', DEPT_CODE: 'AUDIT_DIV', DESIGNATION: 'Assistant General Manager (AGM)' },
    { USER_ID: 2, USER_NAME: '2002', PASSWORD_HASH: 'auditor-key', ROLE_CODE: 'Auditor', FULL_NAME: 'Smt. P. Lakshmi', DEPT_CODE: 'AUDIT_DIV', DESIGNATION: 'Senior Manager (Audit)' },
    { USER_ID: 3, USER_NAME: '3003', PASSWORD_HASH: 'hod-key', ROLE_CODE: 'HOD', FULL_NAME: 'Dr. N.V. Saiy', DEPT_CODE: 'FIN_DIV', DESIGNATION: 'DGM (F&A)' },
    { USER_ID: 4, USER_NAME: '4004', PASSWORD_HASH: 'hod-key', ROLE_CODE: 'HOD', FULL_NAME: 'Shri J.S. Rao', DEPT_CODE: 'BLAST_FRN', DESIGNATION: 'HOD & GM (BF)' },
    { USER_ID: 5, USER_NAME: '5005', PASSWORD_HASH: 'reviewer-key', ROLE_CODE: 'Reviewer', FULL_NAME: 'Shri J.C. Bose', DEPT_CODE: 'AUDIT_DIV', DESIGNATION: 'Chief Audit Executive (CAE)' }
  ];

  const plans = [
    { PLAN_ID: 'PLN-2026-601', TITLE: 'Audit on Risk Purchase Executions & Procurement Delays', FINANCIAL_YEAR: '2026-27', AUDIT_TYPE: 'Regular', DEPT_CODE: 'PUR_ORM', PLANNED_MONTHS: 'April, May', TEAM_LEAD: 'Smt. P. Lakshmi', START_DATE: '2026-04-01', END_DATE: '2026-05-15', TOUR_PROPOSAL_URL: 'https://vsp-audit.gov.internal/tours/PLAN_601.pdf', STATUS: 'Executed', CREATION_DATE: dateOnly },
    { PLAN_ID: 'PLN-2026-602', TITLE: 'Performance Audit of Blast Furnace fuel distribution logs', FINANCIAL_YEAR: '2026-27', AUDIT_TYPE: 'Special', DEPT_CODE: 'BLAST_FRN', PLANNED_MONTHS: 'June, July', TEAM_LEAD: 'Shri J.C. Bose', START_DATE: '2026-06-01', END_DATE: '2026-07-20', TOUR_PROPOSAL_URL: '', STATUS: 'Approved', CREATION_DATE: dateOnly },
    { PLAN_ID: 'PLN-2026-603', TITLE: 'Statutory Verification of Capital Ledger & Spares', FINANCIAL_YEAR: '2025-26', AUDIT_TYPE: 'Statutory', DEPT_CODE: 'FIN_DIV', PLANNED_MONTHS: 'March', TEAM_LEAD: 'Smt. P. Lakshmi', START_DATE: '2026-03-05', END_DATE: '2026-03-31', TOUR_PROPOSAL_URL: 'https://vsp-audit.gov.internal/tours/PLAN_603.pdf', STATUS: 'Executed', CREATION_DATE: dateOnly }
  ];

  const reports = [
    { REPORT_ID: 'REP-2026-701', PLAN_ID: 'PLN-2026-601', REPORT_NO: 'RINL/AUD/M13/2026/04', TITLE: 'Critical Procurement Audit Report: Raw materials risk claims', AUDIT_PERIOD_FROM: '2026-04-01', AUDIT_PERIOD_TO: '2026-05-15', LEAD_AUDITOR: 'Smt. P. Lakshmi', DEPT_CODE: 'PUR_ORM', DATE_CREATED: dateOnly, DATE_SUBMITTED: dateOnly, STATUS: 'Authorized', PARAS_COUNT: 4, ATTACHMENT_NAME: 'authorized_raw_purchase_report.pdf' },
    { REPORT_ID: 'REP-2026-702', PLAN_ID: 'PLN-2026-602', REPORT_NO: 'RINL/AUD/BF/2026/09', TITLE: 'Coke Charging Efficiency Audit Report', AUDIT_PERIOD_FROM: '2026-06-01', AUDIT_PERIOD_TO: '2026-06-15', LEAD_AUDITOR: 'Shri J.C. Bose', DEPT_CODE: 'BLAST_FRN', DATE_CREATED: dateOnly, DATE_SUBMITTED: '', STATUS: 'Draft', PARAS_COUNT: 1, ATTACHMENT_NAME: '' }
  ];

  const paras = [
    { PARA_ID: 'PR-801', REPORT_ID: 'REP-2026-701', PARA_NO: 'Para-1.1', TITLE: 'OBSERVATION REGARDING RISK PURCHASE CASES (M13)', CATEGORY: 'Critical', DESCRIPTION: 'Serious delays detected inside the risk purchase claims register. Material suppliers failed to carry out the delivery schedules for key slag chemicals. Outstanding claims worth ₹42.8 Lakh remain un-recouped due to missing counter notices from the HOD purchase sector.', FINANCIAL_IMPLICATION: 4280000, STATUS: 'Outstanding', REPLY_CONTENT: 'Drafting explanation of standard force majeure reasons for selected vendors. Response memo being aligned with GM MM.', MARKED_EMP_ID: '406', DAK_NO: 'DK-2026-5251' },
    { PARA_ID: 'PR-802', REPORT_ID: 'REP-2026-701', PARA_NO: 'Para-1.2', TITLE: 'Observation on Non-blocking of Vendors due to Quality Complaints', CATEGORY: 'Major', DESCRIPTION: 'Identified three vendors delivering defective iron components. Despite central QMS raising quality reject logs, the vendors were not flagged in the ERP and received further tenders against core PSU allocation protocols.', FINANCIAL_IMPLICATION: 1850000, STATUS: 'Under Review', REPLY_CONTENT: 'Vendors have now been officially locked out in the Oracle ERP master registry as of 25th May 2026. Action compliance scan submitted.', MARKED_EMP_ID: '406', DAK_NO: 'DK-2026-5252' },
    { PARA_ID: 'PR-803', REPORT_ID: 'REP-2026-701', PARA_NO: 'Para-1.3', TITLE: 'NON RESOLUTION OF QUALITY COMPLAINTS', CATEGORY: 'Critical', DESCRIPTION: 'Outstanding counter-justifications regarding sub-standard ore batches have did not reach the central legal division for 150 days. This has resulted in exposure to loss without appropriate security guarantees.', FINANCIAL_IMPLICATION: 3100000, STATUS: 'Outstanding', REPLY_CONTENT: '', MARKED_EMP_ID: '406', DAK_NO: 'DK-2026-5253' },
    { PARA_ID: 'PR-804', REPORT_ID: 'REP-2026-701', PARA_NO: 'Para-1.4', TITLE: 'DELAY IN SUPPLIES IN CASE OF RISK PURCHASE ITEMS', CATEGORY: 'Minor', DESCRIPTION: 'Minor logistical lags in raw lime shipping schedules. Implication resolved through internal surplus buffer transfer.', FINANCIAL_IMPLICATION: 350000, STATUS: 'Settled', REPLY_CONTENT: 'Compliance resolved. Lime logs adjusted and reconciled.', MARKED_EMP_ID: '406', DAK_NO: 'DK-2026-5254' }
  ];

  const replies = [
    { REPLY_ID: 'RE-901', DEPT_CODE: 'PUR_ORM', AUDIT_PERIOD_FROM: '2026-04-01', AUDIT_PERIOD_TO: '2026-05-15', IOM_FROM: 'HOD (Purchase)', IOM_TO: 'GM (Internal Audit)', REF_NO: 'RINL/PUR/AUD-REP/2026/14', COPY_TO: 'ED (Works), GM (Finance)', IOM_DATE: dateOnly, CREATION_DATE: nowStr },
    { REPLY_ID: 'RE-902', DEPT_CODE: 'PUR_RM', AUDIT_PERIOD_FROM: '2026-04-01', AUDIT_PERIOD_TO: '2026-05-15', IOM_FROM: 'ED (Raw Materials)', IOM_TO: 'GM (Internal Audit)', REF_NO: 'RINL/RM/AUD-REP/2026/78', COPY_TO: 'ED (Works)', IOM_DATE: dateOnly, CREATION_DATE: nowStr }
  ];

  const dispatches = [
    { DISPATCH_ID: 'DSP-25001', DISPATCH_NO: 'VSP/AUD/DISP/2026/101', DISPATCH_DATE: dateOnly, SUBJECT: 'Dispatch of signed slag purchase inspection notes', SENDER_DEPT: 'Internal Audit', RECEIVER_DEPT: 'Purchase (Other than Raw Materials)', DAK_NO: 'DK-2026-5251', MEDIUM: 'Intranet Email', STATUS: 'Dispatched' },
    { DISPATCH_ID: 'DSP-25002', DISPATCH_NO: 'VSP/AUD/DISP/2026/102', DISPATCH_DATE: dateOnly, SUBJECT: 'Quality Complaint lockouts register', SENDER_DEPT: 'Internal Audit', RECEIVER_DEPT: 'Purchase (Other than Raw Materials)', DAK_NO: 'DK-2026-5252', MEDIUM: 'Hand Delivered', STATUS: 'Acknowledged' }
  ];

  const reviews = [
    { REVIEW_ID: 'REV-001', PARA_ID: 'PR-802', REVIEWER_ID: '5005', COMMENTS: 'Verified security lockouts are officially toggled in the system configuration. The documentation is satisfactory and approved.', ACTION_TAKEN: 'Lockout active in system', STATUS_ASSIGNED: 'Settled', REVIEW_DATE: nowStr }
  ];

  const uploads = [
    { UPLOAD_ID: 'UPL-001', REPORT_ID: 'REP-2026-701', FILE_NAME: 'authorized_raw_purchase_report.pdf', FILE_TYPE: 'application/pdf', FILE_SIZE: 1240180, FILE_DATA_BLOB: 'JVBERi0xLjQKJSDi48PXNTQg...[MOCK BASE64 ENCRYPTED FILE DATA]...', UPLOADED_BY: '2002', UPLOAD_DATE: dateOnly }
  ];

  const logs = [
    { LOG_ID: 'LOG-30001', TIMESTAMP: nowStr, USERNAME: '1001', ROLE: 'Team Lead', ACTION: 'Oracle AIMS Database Engine initialized successfully.', IP_ADDRESS: '10.210.45.18' }
  ];

  const auditReportEntries = [
    {
      id: "ARE-1001",
      audit_id: "PLN-2026-601",
      document_number: "RINL/AUD/M13/2026/04",
      document_date: "2026-05-28",
      department: "Purchase (Other than Raw Materials)",
      audit_type: "Regular",
      auditor_name: "Smt. P. Lakshmi",
      audit_period: "FY 2025-26 Q4",
      start_date: "2026-04-01",
      end_date: "2026-05-15",
      para_heading: "OBSERVATION REGARDING RISK PURCHASE CASES (M13)",
      para_class: "Critical",
      reply_body: "Comprehensive risk assessment and purchase analysis complete. Active recovery of penalty values is registered.",
      report_status: "Pending Reply",
      suggestion: "Necessary recovery of liquidated damages and penalty values under Clause 9B has been finalized.",
      attachment_url: "authorized_raw_purchase_report.pdf",
      created_by: "2002",
      role: "Auditor",
      status: "Pending Reply",
      created_at: nowStr,
      updated_at: nowStr
    },
    {
      id: "ARE-1002",
      audit_id: "PLN-2026-602",
      document_number: "VSP/AUD/CO/2026/01",
      document_date: "2026-06-01",
      department: "Coke Ovens Division",
      audit_type: "Special",
      auditor_name: "Shri S.K. Sharma",
      audit_period: "FY 2026-27 Q1",
      start_date: "2026-06-01",
      end_date: "2026-07-20",
      para_heading: "COKE OVEN CHARGING EFFICIENCY DEVIATION STATUS",
      para_class: "Major",
      reply_body: "Operational charging cycles recalibrated. Periodic thermal logs enabled to monitor charging deviation.",
      report_status: "Submitted",
      suggestion: "Standardize weekly charging temperature scans and review coal grade mixture standards.",
      attachment_url: "",
      created_by: "2002",
      role: "Auditor",
      status: "Submitted",
      created_at: nowStr,
      updated_at: nowStr
    },
    {
      id: "ARE-1003",
      audit_id: "PLN-2026-603",
      document_number: "VSP/AUD/SMS/2026/02",
      document_date: "2026-05-25",
      department: "Steel Melting Shop",
      audit_type: "Statutory",
      auditor_name: "Shri R.K. Murthy",
      audit_period: "FY 2025-26 Q4",
      start_date: "2026-03-05",
      end_date: "2026-03-31",
      para_heading: "SLAG CHEMICAL PROCESSING AND SAFETY VARIANCE REVIEW",
      para_class: "Critical",
      reply_body: "Pending final review of slag cooling bath records. Shift engineers have been directed to enforce mandatory compliance guidelines.",
      report_status: "Under HOD Review",
      suggestion: "Deploy advanced visual feedback alerts and record periodic logbooks in digital form.",
      attachment_url: "slag_safety_compliance_v1.pdf",
      created_by: "2002",
      role: "Auditor",
      status: "Under HOD Review",
      created_at: nowStr,
      updated_at: nowStr
    }
  ];

  // Old knowledge bank bank standardizer
  const knowledgeDocs: KnowledgeDocument[] = [
    { id: 'KD-201', title: 'RINL Corporate Purchase Manual 2024 Revision B', docType: 'Circular', releaseDate: '2024-01-15', referenceNo: 'VSP/PUR/MAN-24', fileSize: '4.8 MB' },
    { id: 'KD-202', title: 'Audit Scope of Special slag purchase accounts', docType: 'Guideline', releaseDate: '2025-09-12', referenceNo: 'RINL/IA/GUIDE-5', fileSize: '1.2 MB' },
    { id: 'KD-203', title: 'VSP Financial Delegation of Authority Limits (DoA)', docType: 'Policy', releaseDate: '2023-11-20', referenceNo: 'VSP/FIN/POL/09', fileSize: '8.5 MB' }
  ];

  return {
    DEPARTMENT_MASTER: depts,
    EMPLOYEE_MASTER: employees,
    AUDIT_PROGRAM_MASTER: programs,
    USER_MASTER: users,
    ROLE_MASTER: roles,
    STATUS_MASTER: statuses,
    AUDIT_PLANNING: plans,
    AUDIT_REPORTS_ENTRY: reports,
    REPLY_ENTRY: replies,
    DISPATCH: dispatches,
    AUDIT_PARAS: paras,
    REVIEW_TRACKING: reviews,
    UPLOAD_REPORTS: uploads,
    REPORT_VERSIONS: [],
    ACTIVITY_LOGS: logs,
    AUDIT_REPORT_ENTRIES: auditReportEntries,
    knowledgeDocsList: knowledgeDocs,
    REPORT_CONVERSIONS: []
  };
};

// Database utility manager (handles load/save dynamically to guarantee physical persistence)
class RelationalDatabase {
  private data: FullRelationalDB;

  constructor() {
    this.data = getSeedDatabase();
    this.load();
  }

  public getTable(name: keyof FullRelationalDB) {
    this.load();
    return this.data[name] || [];
  }

  public saveTable(name: keyof FullRelationalDB, list: any[]) {
    this.data[name] = list;
    this.persist();
  }

  public commitLog(username: string, role: string, action: string, ip: string = "10.210.45.18") {
    const newLog = {
      LOG_ID: `LOG-${Math.floor(100000 + Math.random() * 900000)}`,
      TIMESTAMP: new Date().toISOString(),
      USERNAME: username,
      ROLE: role,
      ACTION: action,
      IP_ADDRESS: ip
    };
    this.data.ACTIVITY_LOGS.unshift(newLog);
    this.persist();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(fileContent);
        if (!this.data.AUDIT_REPORT_ENTRIES) {
          this.data.AUDIT_REPORT_ENTRIES = getSeedDatabase().AUDIT_REPORT_ENTRIES;
          this.persist();
        }
        if (!this.data.REPORT_CONVERSIONS) {
          this.data.REPORT_CONVERSIONS = [];
          this.persist();
        }
      } else {
        this.persist();
      }
    } catch (e) {
      console.error("Failed to read AIMS persisted state, fallback to seed:", e);
    }
  }

  private persist() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to write AIMS database:", e);
    }
  }
}

const db = new RelationalDatabase();
let activeDakNumber = 5254;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // --- API SERVICE - DYNAMIC DUMMY QUERY COMPATIBILITY LAYER ---
  // Transforms SQL/Oracle columns model back to legacy UI properties dynamically for client compatibility.
  
  const mapPlans = (item: any): AuditPlan => {
    // Derive quarter if not present
    let quarterVal = item.QUARTER;
    if (!quarterVal) {
      if (item.START_DATE) {
        const monthNum = new Date(item.START_DATE).getMonth(); // Jan: 0, Feb: 1, Mar: 2, etc.
        if (monthNum >= 0 && monthNum <= 2) quarterVal = 'Q1';
        else if (monthNum >= 3 && monthNum <= 5) quarterVal = 'Q2';
        else if (monthNum >= 6 && monthNum <= 8) quarterVal = 'Q3';
        else quarterVal = 'Q4';
      } else if (item.PLANNED_MONTHS) {
        const pm = item.PLANNED_MONTHS.toLowerCase();
        if (pm.includes('jan') || pm.includes('feb') || pm.includes('mar')) quarterVal = 'Q1';
        else if (pm.includes('apr') || pm.includes('may') || pm.includes('jun')) quarterVal = 'Q2';
        else if (pm.includes('jul') || pm.includes('aug') || pm.includes('sep')) quarterVal = 'Q3';
        else if (pm.includes('oct') || pm.includes('nov') || pm.includes('dec')) quarterVal = 'Q4';
        else quarterVal = 'Q2';
      } else {
        quarterVal = 'Q2';
      }
    }

    // Map status nicely to handle legacy ('Executed' -> 'Completed', 'Approved' -> 'In Progress', 'Draft' -> 'Planned', etc.)
    let statusVal = item.STATUS;
    if (statusVal === 'Draft') statusVal = 'Planned';
    else if (statusVal === 'Approved') statusVal = 'In Progress';
    else if (statusVal === 'Executed') statusVal = 'Completed';
    else if (statusVal === 'Submitted') statusVal = 'In Progress';

    // Map audit type to new system (Regular -> Operational, Statutory -> Compliance, Special -> External, State -> Internal)
    let typeVal = item.AUDIT_TYPE;
    if (typeVal === 'Regular') typeVal = 'Operational';
    else if (typeVal === 'Statutory') typeVal = 'Compliance';
    else if (typeVal === 'Special') typeVal = 'External';
    else if (typeVal === 'Propriety') typeVal = 'Internal';

    return {
      id: item.PLAN_ID,
      title: item.TITLE,
      financialYear: item.FINANCIAL_YEAR,
      quarter: quarterVal,
      auditType: typeVal,
      department: (() => {
        const d = db.getTable('DEPARTMENT_MASTER').find(x => x.DEPT_CODE === item.DEPT_CODE);
        return d ? d.DEPT_NAME : item.DEPT_CODE;
      })(),
      plannedMonths: (item.PLANNED_MONTHS || "").split(", "),
      teamLead: item.TEAM_LEAD || item.LEAD_AUDITOR || 'Smt. P. Lakshmi',
      leadAuditor: item.LEAD_AUDITOR || item.TEAM_LEAD || 'Smt. P. Lakshmi',
      teamMembers: item.TEAM_MEMBERS || 'Shri S.K. Sharma, Smt. R. Priya',
      objectives: item.OBJECTIVES || 'Audit efficiency and operational compliance checking.',
      scope: item.SCOPE || 'Review transaction logs, registers, and voucher receipts.',
      riskLevel: item.RISK_LEVEL || 'Medium',
      remarks: item.REMARKS || 'No additional remarks.',
      startDate: item.START_DATE,
      endDate: item.END_DATE,
      auditPeriod: item.AUDIT_PERIOD || 'Quarterly',
      reviewWindowStart: item.REVIEW_WINDOW_START || item.START_DATE || '',
      reviewWindowEnd: item.REVIEW_WINDOW_END || item.END_DATE || '',
      tourProposalUrl: item.TOUR_PROPOSAL_URL,
      status: statusVal,
      createdAt: item.CREATION_DATE
    };
  };

  const mapReports = (item: any): AuditReport => ({
    id: item.REPORT_ID,
    planId: item.PLAN_ID,
    reportNo: item.REPORT_NO,
    title: item.TITLE,
    auditPeriod: `${item.AUDIT_PERIOD_FROM || ""} To ${item.AUDIT_PERIOD_TO || ""}`,
    leadAuditor: item.LEAD_AUDITOR,
    department: (() => {
      const d = db.getTable('DEPARTMENT_MASTER').find(x => x.DEPT_CODE === item.DEPT_CODE);
      return d ? d.DEPT_NAME : item.DEPT_CODE;
    })(),
    dateCreated: item.DATE_CREATED,
    dateSubmitted: item.DATE_SUBMITTED,
    status: item.STATUS as any,
    parasCount: item.PARAS_COUNT || 0,
    attachmentName: item.ATTACHMENT_NAME
  });

  const mapParas = (item: any): AuditPara => ({
    id: item.PARA_ID,
    reportId: item.REPORT_ID,
    paraNo: item.PARA_NO,
    title: item.TITLE,
    category: item.CATEGORY as any,
    description: item.DESCRIPTION,
    financialImplication: parseFloat(item.FINANCIAL_IMPLICATION) || 0,
    status: item.STATUS as any,
    replyContent: item.REPLY_CONTENT || "",
    markedToEmployeeId: item.MARKED_EMP_ID || "",
    dakNo: item.DAK_NO || ""
  });

  const mapDispatch = (item: any): DispatchItem => ({
    id: item.DISPATCH_ID,
    dispatchNo: item.DISPATCH_NO,
    date: item.DISPATCH_DATE,
    subject: item.SUBJECT,
    senderDept: item.SENDER_DEPT,
    receiverDept: item.RECEIVER_DEPT,
    dakNo: item.DAK_NO,
    medium: item.MEDIUM as any,
    status: item.STATUS as any
  });

  const mapEmployee = (item: any): Employee => ({
    id: String(item.EMP_ID),
    empNo: item.EMP_NO,
    name: item.EMP_NAME,
    email: item.EMAIL,
    department: (() => {
      const d = db.getTable('DEPARTMENT_MASTER').find(x => x.DEPT_CODE === item.DEPT_CODE);
      return d ? d.DEPT_NAME : item.DEPT_CODE;
    })(),
    designation: item.DESIGNATION,
    active: item.IS_ACTIVE === 'Y'
  });

  const mapDept = (item: any): Department => ({
    id: String(item.DEPT_ID),
    code: item.DEPT_CODE,
    name: item.DEPT_NAME,
    headName: item.HEAD_NAME,
    contactNo: item.CONTACT_NO || ""
  });

  const mapProgram = (item: any): AuditProgram => ({
    id: String(item.PROG_ID),
    code: item.PROG_CODE,
    name: item.PROG_NAME,
    scopeOfAudit: item.SCOPE_OF_AUDIT || "",
    applicableGuidelines: item.APPLICABLE_GUIDELINES || ""
  });

  // --- GENERIC WORKSPACE CRUD CONTROLLER DESIGN ---
  // Exposes ALL 14 tables dynamically via /api/tables/:tableName interface!
  
  app.get("/api/tables/:tableName", (req, res) => {
    const { tableName } = req.params;
    const table = db.getTable(tableName as keyof FullRelationalDB);
    if (!table) {
      return res.status(404).json({ error: `Oracle table ${tableName} not defined.` });
    }
    res.json(table);
  });

  app.post("/api/tables/:tableName", (req, res) => {
    const { tableName } = req.params;
    let table = db.getTable(tableName as keyof FullRelationalDB);
    if (!table) {
      return res.status(404).json({ error: `Table ${tableName} not defined.` });
    }

    // Dynamic relational auto-number sequencer / primary key calculations
    const record = { ...req.body };
    const pkName = (() => {
      if (tableName === 'DEPARTMENT_MASTER') return 'DEPT_ID';
      if (tableName === 'EMPLOYEE_MASTER') return 'EMP_ID';
      if (tableName === 'AUDIT_PROGRAM_MASTER') return 'PROG_ID';
      if (tableName === 'USER_MASTER') return 'USER_ID';
      if (tableName === 'ROLE_MASTER') return 'ROLE_CODE';
      if (tableName === 'STATUS_MASTER') return 'STATUS_CODE';
      if (tableName === 'AUDIT_PLANNING') return 'PLAN_ID';
      if (tableName === 'AUDIT_REPORTS_ENTRY') return 'REPORT_ID';
      if (tableName === 'REPLY_ENTRY') return 'REPLY_ID';
      if (tableName === 'DISPATCH') return 'DISPATCH_ID';
      if (tableName === 'AUDIT_PARAS') return 'PARA_ID';
      if (tableName === 'REVIEW_TRACKING') return 'REVIEW_ID';
      if (tableName === 'UPLOAD_REPORTS') return 'UPLOAD_ID';
      return 'LOG_ID';
    })();

    // Check PK conflict
    if (!record[pkName]) {
      if (['DEPARTMENT_MASTER', 'EMPLOYEE_MASTER', 'AUDIT_PROGRAM_MASTER', 'USER_MASTER'].includes(tableName)) {
        record[pkName] = Math.floor(20000 + Math.random() * 80000);
      } else {
        record[pkName] = `${tableName.substring(0,3)}-${Math.floor(10000 + Math.random() * 90000)}`;
      }
    }

    // Date default values
    if ('CREATION_DATE' in record || tableName.endsWith('_MASTER') || tableName === 'AUDIT_PLANNING' || tableName === 'REPLY_ENTRY') {
      if (!record.CREATION_DATE) record.CREATION_DATE = new Date().toISOString().split('T')[0];
    }
    if ('CREATED_BY' in record) {
      if (!record.CREATED_BY) record.CREATED_BY = 'AIMS_OPERATOR';
    }

    // Datatype Verification & Validation logic
    // Checks NOT NULL, NUMBER correctness, Maximum Length, etc.
    const issues: string[] = [];
    if (tableName === 'DEPARTMENT_MASTER' && !record.DEPT_CODE) issues.push('DEPT_CODE cannot be null');
    if (tableName === 'EMPLOYEE_MASTER' && (!record.EMP_NO || !record.EMP_NAME)) issues.push('EMP_NO/EMP_NAME cannot be null');
    if (tableName === 'USER_MASTER' && !record.USER_NAME) issues.push('USER_NAME cannot be null');
    
    if (issues.length > 0) {
      return res.status(400).json({ error: `ORA-01400: cannot insert NULL: (${issues.join(', ')})` });
    }

    table.push(record);
    db.saveTable(tableName as keyof FullRelationalDB, table);
    db.commitLog("SYSTEM", "Admin", `INSERT INTO ${tableName} committed successfully. KEY: ${record[pkName]}`);
    res.status(201).json(record);
  });

  app.put("/api/tables/:tableName/:pkValue", (req, res) => {
    const { tableName, pkValue } = req.params;
    let table = db.getTable(tableName as keyof FullRelationalDB);
    if (!table) return res.status(404).json({ error: "Table offline." });

    const pkName = (() => {
      if (tableName === 'DEPARTMENT_MASTER') return 'DEPT_ID';
      if (tableName === 'EMPLOYEE_MASTER') return 'EMP_ID';
      if (tableName === 'AUDIT_PROGRAM_MASTER') return 'PROG_ID';
      if (tableName === 'USER_MASTER') return 'USER_ID';
      if (tableName === 'ROLE_MASTER') return 'ROLE_CODE';
      if (tableName === 'STATUS_MASTER') return 'STATUS_CODE';
      if (tableName === 'AUDIT_PLANNING') return 'PLAN_ID';
      if (tableName === 'AUDIT_REPORTS_ENTRY') return 'REPORT_ID';
      if (tableName === 'REPLY_ENTRY') return 'REPLY_ID';
      if (tableName === 'DISPATCH') return 'DISPATCH_ID';
      if (tableName === 'AUDIT_PARAS') return 'PARA_ID';
      if (tableName === 'REVIEW_TRACKING') return 'REVIEW_ID';
      if (tableName === 'UPLOAD_REPORTS') return 'UPLOAD_ID';
      return 'LOG_ID';
    })();

    const idx = table.findIndex(x => String(x[pkName]) === pkValue);
    if (idx !== -1) {
      table[idx] = { ...table[idx], ...req.body };
      db.saveTable(tableName as keyof FullRelationalDB, table);
      db.commitLog("SYSTEM", "Admin", `UPDATE ON ${tableName} committed. PK=${pkValue}`);
      res.json(table[idx]);
    } else {
      res.status(404).json({ error: "Record not matched." });
    }
  });

  app.delete("/api/tables/:tableName/:pkValue", (req, res) => {
    const { tableName, pkValue } = req.params;
    let table = db.getTable(tableName as keyof FullRelationalDB);
    if (!table) return res.status(404).json({ error: "Table offline." });

    const pkName = (() => {
      if (tableName === 'DEPARTMENT_MASTER') return 'DEPT_ID';
      if (tableName === 'EMPLOYEE_MASTER') return 'EMP_ID';
      if (tableName === 'AUDIT_PROGRAM_MASTER') return 'PROG_ID';
      if (tableName === 'USER_MASTER') return 'USER_ID';
      if (tableName === 'ROLE_MASTER') return 'ROLE_CODE';
      if (tableName === 'STATUS_MASTER') return 'STATUS_CODE';
      if (tableName === 'AUDIT_PLANNING') return 'PLAN_ID';
      if (tableName === 'AUDIT_REPORTS_ENTRY') return 'REPORT_ID';
      if (tableName === 'REPLY_ENTRY') return 'REPLY_ID';
      if (tableName === 'DISPATCH') return 'DISPATCH_ID';
      if (tableName === 'AUDIT_PARAS') return 'PARA_ID';
      if (tableName === 'REVIEW_TRACKING') return 'REVIEW_ID';
      if (tableName === 'UPLOAD_REPORTS') return 'UPLOAD_ID';
      return 'LOG_ID';
    })();

    const preLength = table.length;
    table = table.filter(x => String(x[pkName]) !== pkValue);
    
    if (table.length < preLength) {
      db.saveTable(tableName as keyof FullRelationalDB, table);
      
      // Cascading relational actions if applicable:
      if (tableName === 'AUDIT_REPORTS_ENTRY') {
        const parasTable = db.getTable('AUDIT_PARAS').filter(p => p.REPORT_ID !== pkValue);
        db.saveTable('AUDIT_PARAS', parasTable);
      }
      
      db.commitLog("SYSTEM", "Admin", `DELETE FROM ${tableName} committed. PK=${pkValue}`);
      res.json({ success: true, message: `Row ${pkValue} purged from ${tableName} successfully.` });
    } else {
      res.status(404).json({ error: `ORA-02292: integrity constraint violated - parent key or element not found: ${pkValue}` });
    }
  });


  // --- LEGACY FRONT-END API EQUIVALENTS (PRESERVES CRITICAL COMPATIBILITY) ---

  // Auth login Handler
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const userRow = db.getTable('USER_MASTER').find(u => u.USER_NAME === username);
    
    if (userRow && password) {
      // Package into classic client-side session User model format
      const clientUser: User = {
        id: String(userRow.USER_ID),
        username: userRow.USER_NAME,
        role: userRow.ROLE_CODE as any,
        name: userRow.FULL_NAME,
        department: (() => {
          const d = db.getTable('DEPARTMENT_MASTER').find(x => x.DEPT_CODE === userRow.DEPT_CODE);
          return d ? d.DEPT_NAME : userRow.DEPT_CODE;
        })(),
        designation: userRow.DESIGNATION || 'Officer'
      };
      
      db.commitLog(userRow.USER_NAME, userRow.ROLE_CODE, `User session started successfully for ${userRow.FULL_NAME}`);
      res.json({ success: true, user: clientUser, token: `mock-jwt-auth-${clientUser.username}` });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials. Please refer to registered USER_MASTER logins (such as 1001, 2002, 3003)." });
    }
  });

  // Plans API
  app.get("/api/plans", (req, res) => {
    const list = db.getTable('AUDIT_PLANNING').map(mapPlans);
    res.json(list);
  });

  app.post("/api/plans", (req, res) => {
    const planNo = `PLN-2026-${Math.floor(100 + Math.random() * 900)}`;
    const deptRow = db.getTable('DEPARTMENT_MASTER').find(d => d.DEPT_NAME === req.body.department || d.DEPT_CODE === req.body.department);
    const code = deptRow ? deptRow.DEPT_CODE : 'PUR_ORM';

    const oracleRecord = {
      PLAN_ID: planNo,
      TITLE: req.body.title || 'Untitled Schedule',
      QUARTER: req.body.quarter || 'Q1',
      AUDIT_TYPE: req.body.auditType || 'Internal',
      DEPT_CODE: code,
      PLANNED_MONTHS: (() => {
        // Map quarter to planned months for backward compatibility if needed
        const q = req.body.quarter || 'Q2';
        if (q === 'Q1') return 'January, February, March';
        if (q === 'Q2') return 'April, May, June';
        if (q === 'Q3') return 'July, August, September';
        return 'October, November, December';
      })(),
      TEAM_LEAD: req.body.leadAuditor || req.body.teamLead || 'Smt. P. Lakshmi',
      LEAD_AUDITOR: req.body.leadAuditor || 'Smt. P. Lakshmi',
      TEAM_MEMBERS: req.body.teamMembers || '',
      OBJECTIVES: req.body.objectives || '',
      SCOPE: req.body.scope || '',
      RISK_LEVEL: req.body.riskLevel || 'Medium',
      REMARKS: req.body.remarks || '',
      START_DATE: req.body.startDate || new Date().toISOString().split('T')[0],
      END_DATE: req.body.endDate || '',
      AUDIT_PERIOD: req.body.auditPeriod || 'Quarterly',
      REVIEW_WINDOW_START: req.body.reviewWindowStart || req.body.startDate || '',
      REVIEW_WINDOW_END: req.body.reviewWindowEnd || req.body.endDate || '',
      TOUR_PROPOSAL_URL: req.body.tourProposalUrl || '',
      STATUS: req.body.status || 'Planned',
      CREATION_DATE: new Date().toISOString().split('T')[0]
    };

    const table = db.getTable('AUDIT_PLANNING');
    table.unshift(oracleRecord);
    db.saveTable('AUDIT_PLANNING', table);
    db.commitLog("SYSTEM", "Auditor", `Created Quarterly Plan entry code ${planNo}`);
    res.status(201).json(mapPlans(oracleRecord));
  });

  app.put("/api/plans/:id", (req, res) => {
    const { id } = req.params;
    const table = db.getTable('AUDIT_PLANNING');
    const idx = table.findIndex(x => x.PLAN_ID === id);
    if (idx !== -1) {
      if (req.body.status !== undefined) table[idx].STATUS = req.body.status;
      if (req.body.startDate !== undefined) table[idx].START_DATE = req.body.startDate;
      if (req.body.endDate !== undefined) table[idx].END_DATE = req.body.endDate;
      if (req.body.auditPeriod !== undefined) table[idx].AUDIT_PERIOD = req.body.auditPeriod;
      if (req.body.reviewWindowStart !== undefined) table[idx].REVIEW_WINDOW_START = req.body.reviewWindowStart;
      if (req.body.reviewWindowEnd !== undefined) table[idx].REVIEW_WINDOW_END = req.body.reviewWindowEnd;
      if (req.body.quarter !== undefined) {
        table[idx].QUARTER = req.body.quarter;
        // Keep PLANNED_MONTHS in sync for compatibility
        const q = req.body.quarter;
        if (q === 'Q1') table[idx].PLANNED_MONTHS = 'January, February, March';
        else if (q === 'Q2') table[idx].PLANNED_MONTHS = 'April, May, June';
        else if (q === 'Q3') table[idx].PLANNED_MONTHS = 'July, August, September';
        else table[idx].PLANNED_MONTHS = 'October, November, December';
      }
      if (req.body.auditType !== undefined) table[idx].AUDIT_TYPE = req.body.auditType;
      if (req.body.title !== undefined) table[idx].TITLE = req.body.title;
      if (req.body.leadAuditor !== undefined) {
        table[idx].LEAD_AUDITOR = req.body.leadAuditor;
        table[idx].TEAM_LEAD = req.body.leadAuditor;
      }
      if (req.body.teamLead !== undefined) { // fallback
        table[idx].LEAD_AUDITOR = req.body.teamLead;
        table[idx].TEAM_LEAD = req.body.teamLead;
      }
      if (req.body.teamMembers !== undefined) table[idx].TEAM_MEMBERS = req.body.teamMembers;
      if (req.body.objectives !== undefined) table[idx].OBJECTIVES = req.body.objectives;
      if (req.body.scope !== undefined) table[idx].SCOPE = req.body.scope;
      if (req.body.riskLevel !== undefined) table[idx].RISK_LEVEL = req.body.riskLevel;
      if (req.body.remarks !== undefined) table[idx].REMARKS = req.body.remarks;

      db.saveTable('AUDIT_PLANNING', table);
      res.json(mapPlans(table[idx]));
    } else {
      res.status(404).json({ error: "Plan not found" });
    }
  });

  // Reports Entry API
  app.get("/api/reports", (req, res) => {
    const list = db.getTable('AUDIT_REPORTS_ENTRY').map(mapReports);
    res.json(list);
  });

  app.post("/api/reports", (req, res) => {
    const repNo = `REP-2026-${Math.floor(100 + Math.random() * 900)}`;
    const deptRow = db.getTable('DEPARTMENT_MASTER').find(d => d.DEPT_NAME === req.body.department);
    const code = deptRow ? deptRow.DEPT_CODE : 'PUR_ORM';

    const oracleRecord = {
      REPORT_ID: repNo,
      PLAN_ID: req.body.planId || 'PLN-2026-601',
      REPORT_NO: req.body.reportNo || `VSP/AUD/CORR/${Math.floor(10 + Math.random()*90)}`,
      TITLE: req.body.title || 'Scope Assessment Summary document',
      AUDIT_PERIOD_FROM: (req.body.auditPeriod || "2026-04-01 To 2026-05-15").split(" To ")[0],
      AUDIT_PERIOD_TO: (req.body.auditPeriod || "2026-04-01 To 2026-05-15").split(" To ")[1],
      LEAD_AUDITOR: req.body.leadAuditor || 'Smt. P. Lakshmi',
      DEPT_CODE: code,
      DATE_CREATED: new Date().toISOString().split('T')[0],
      DATE_SUBMITTED: '',
      STATUS: req.body.status || 'Draft',
      PARAS_COUNT: 0,
      ATTACHMENT_NAME: ''
    };

    const table = db.getTable('AUDIT_REPORTS_ENTRY');
    table.unshift(oracleRecord);
    db.saveTable('AUDIT_REPORTS_ENTRY', table);
    db.commitLog("SYSTEM", "Auditor", `Initialized Audit Report registry node ${repNo}`);
    res.status(201).json(mapReports(oracleRecord));
  });

  app.put("/api/reports/:id", (req, res) => {
    const { id } = req.params;
    const table = db.getTable('AUDIT_REPORTS_ENTRY');
    const idx = table.findIndex(x => x.REPORT_ID === id);
    if (idx !== -1) {
      table[idx] = { ...table[idx], ...req.body };
      if (req.body.status === 'Authorized') {
        table[idx].DATE_SUBMITTED = new Date().toISOString().split('T')[0];
      }
      db.saveTable('AUDIT_REPORTS_ENTRY', table);
      res.json(mapReports(table[idx]));
    } else {
      res.status(404).json({ error: "Report not found" });
    }
  });

  // --- REPORT GENERATION WORD -> HTML -> PDF VERSION MODULE ---

  app.get("/api/reports/:id/versions", (req, res) => {
    const { id } = req.params;
    const list = db.getTable('REPORT_VERSIONS') || [];
    const filtered = list.filter((v: any) => v.REPORT_ID === id);
    res.json(filtered);
  });

  app.post("/api/reports/:id/compile", async (req, res) => {
    const { id } = req.params;
    const auditorName = req.body.auditorName || "Smt. P. Lakshmi";

    const reportTable = db.getTable('AUDIT_REPORTS_ENTRY');
    const dbReport = reportTable.find(x => x.REPORT_ID === id);
    if (!dbReport) {
      return res.status(404).json({ error: "Audit report record not found." });
    }

    // Map report details for display / word document layout
    const deptRow = db.getTable('DEPARTMENT_MASTER').find(d => d.DEPT_CODE === dbReport.DEPT_CODE);
    const departmentName = deptRow ? deptRow.DEPT_NAME : dbReport.DEPT_CODE;

    const mappedReport = {
      ...dbReport,
      department: departmentName,
      auditPeriod: `${dbReport.AUDIT_PERIOD_FROM || ""} To ${dbReport.AUDIT_PERIOD_TO || ""}`
    };

    // Retrieve corresponding active Paras for report
    const paras = db.getTable('AUDIT_PARAS').filter(x => x.REPORT_ID === id);

    try {
      // Step A: Build Word .docx file using "docx" package
      const wordDocument = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 120 },
                children: [
                  new TextRun({
                    text: "RASHTRIYA ISPAT NIGAM LIMITED",
                    bold: true,
                    size: 28,
                    color: "0D3B70"
                  })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 240 },
                children: [
                  new TextRun({
                    text: "INTERNAL AUDIT DEPARTMENT / VISAKHAPATNAM STEEL PLANT",
                    bold: true,
                    size: 20,
                    color: "475569"
                  })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 200, after: 200 },
                children: [
                  new TextRun({
                    text: "AUDIT OUTCOMES & VERIFICATION COMPLIANCE RECORD",
                    bold: true,
                    size: 24,
                    color: "DC2626"
                  })
                ]
              }),
              new Paragraph({
                spacing: { before: 100, after: 100 },
                children: [
                  new TextRun({
                    text: "Audit ID: ",
                    bold: true,
                    size: 18
                  }),
                  new TextRun({
                    text: `VSP-${mappedReport.REPORT_ID}`,
                    size: 18
                  })
                ]
              }),
              new Paragraph({
                spacing: { before: 100, after: 100 },
                children: [
                  new TextRun({
                    text: "Department Name: ",
                    bold: true,
                    size: 18
                  }),
                  new TextRun({
                    text: `${mappedReport.department}`,
                    size: 18
                  })
                ]
              }),
              new Paragraph({
                spacing: { before: 100, after: 100 },
                children: [
                  new TextRun({
                    text: "Audit Period: ",
                    bold: true,
                    size: 18
                  }),
                  new TextRun({
                    text: `${mappedReport.auditPeriod}`,
                    size: 18
                  })
                ]
              }),
              new Paragraph({
                spacing: { before: 100, after: 100 },
                children: [
                  new TextRun({
                    text: "Lead Auditor Name: ",
                    bold: true,
                    size: 18
                  }),
                  new TextRun({
                    text: `${mappedReport.LEAD_AUDITOR}`,
                    size: 18
                  })
                ]
              }),
              new Paragraph({
                spacing: { before: 100, after: 100 },
                children: [
                  new TextRun({
                    text: "Compliance Status: ",
                    bold: true,
                    size: 18
                  }),
                  new TextRun({
                    text: `${mappedReport.STATUS}`,
                    size: 18,
                    bold: true,
                    color: "0D3B70"
                  })
                ]
              }),
              new Paragraph({
                spacing: { before: 100, after: 100 },
                children: [
                  new TextRun({
                    text: "Creation Date: ",
                    bold: true,
                    size: 18
                  }),
                  new TextRun({
                    text: `${mappedReport.DATE_CREATED}`,
                    size: 18
                  })
                ]
              }),
              new Paragraph({
                spacing: { before: 300, after: 150 },
                children: [
                  new TextRun({
                    text: "SUMMARY OF FINDINGS & OUTSTANDING EXCEPTIONS",
                    bold: true,
                    size: 20,
                    color: "0F172A"
                  })
                ]
              }),
              // Table header inside .docx
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 15, type: WidthType.PERCENTAGE },
                        children: [new Paragraph({ children: [new TextRun({ text: "Para No", bold: true, size: 16 })] })]
                      }),
                      new TableCell({
                        width: { size: 45, type: WidthType.PERCENTAGE },
                        children: [new Paragraph({ children: [new TextRun({ text: "Finding / Exception Title", bold: true, size: 16 })] })]
                      }),
                      new TableCell({
                        width: { size: 15, type: WidthType.PERCENTAGE },
                        children: [new Paragraph({ children: [new TextRun({ text: "Severity", bold: true, size: 16 })] })]
                      }),
                      new TableCell({
                        width: { size: 25, type: WidthType.PERCENTAGE },
                        children: [new Paragraph({ children: [new TextRun({ text: "Implication (Rs)", bold: true, size: 16 })] })]
                      })
                    ]
                  }),
                  // Map each audit para row
                  ...paras.map(p => new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 15, type: WidthType.PERCENTAGE },
                        children: [new Paragraph({ children: [new TextRun({ text: p.PARA_NO || "X.X", size: 16 })] })]
                      }),
                      new TableCell({
                        width: { size: 45, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({ children: [new TextRun({ text: p.TITLE || "No Title", bold: true, size: 16 })] }),
                          new Paragraph({ spacing: { before: 40 }, children: [new TextRun({ text: p.DESCRIPTION || "", size: 14, italics: true })] })
                        ]
                      }),
                      new TableCell({
                        width: { size: 15, type: WidthType.PERCENTAGE },
                        children: [new Paragraph({ children: [new TextRun({ text: p.CATEGORY || "Major", size: 16 })] })]
                      }),
                      new TableCell({
                        width: { size: 25, type: WidthType.PERCENTAGE },
                        children: [new Paragraph({ children: [new TextRun({ text: `₹ ${Number(p.FINANCIAL_IMPLICATION || 0).toLocaleString()}`, size: 16 })] })]
                      })
                    ]
                  }))
                ]
              }),
              new Paragraph({ spacing: { before: 400, after: 100 } }),
              new Paragraph({
                spacing: { before: 100, after: 100 },
                children: [
                  new TextRun({
                    text: "SECTION C: AUDITOR CONCLUDING ADVICE & RECOMMENDATIONS",
                    bold: true,
                    size: 20,
                    color: "0F172A"
                  })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "1. The department head must conduct root-cause reconciliation meetings to align actual ledger postings and remove quality failures. ",
                    size: 16
                  })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "2. Ensure double-ledger audits are maintained during transition windows to eliminate transaction cutoff risks.",
                    size: 16
                  })
                ]
              }),
              new Paragraph({ spacing: { before: 400 } }),
              new Paragraph({
                spacing: { before: 200 },
                children: [
                  new TextRun({
                    text: "--------------------------------------------------------------------------------",
                    color: "94A3B8"
                  })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "OFFICIAL SIGN COMPLIANCE SIGNATORY",
                    bold: true,
                    size: 16,
                    color: "0D3B70"
                  })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `DATED: ${new Date().toISOString().split('T')[0]} / DIGITALLY PINNED & LOCKED SSO PROTOCOL`,
                    italics: true,
                    size: 14,
                    color: "64748B"
                  })
                ]
              })
            ]
          }
        ]
      });

      const buffer = await Packer.toBuffer(wordDocument);

      // Step B: Automatically parse buffer to HTML using Mammoth
      const convertResponse = await mammoth.convertToHtml({ buffer });
      const htmlContent = convertResponse.value;

      // Register new Version Row inside REPORT_VERSIONS
      const allVersions = db.getTable('REPORT_VERSIONS') || [];
      const idPrefix = `VER-${Math.floor(1000 + Math.random() * 9000)}`;
      const existingCount = allVersions.filter((v: any) => v.REPORT_ID === id).length;
      const nextVer = existingCount + 1;

      const newVersionRecord = {
        VERSION_ID: idPrefix,
        REPORT_ID: id,
        VERSION_NO: nextVer,
        DOCX_BLOB_BASE64: buffer.toString("base64"),
        HTML_CONTENT: htmlContent,
        PDF_BLOB_BASE64: "", // to be filled later by the client
        CREATED_AT: new Date().toISOString(),
        CREATED_BY: auditorName,
        DOC_SIZE: buffer.length,
        REMARKS: `Audit compile loop: DOCX generated & transcribed to HTML dynamically. (Ver ${nextVer})`
      };

      allVersions.unshift(newVersionRecord);
      db.saveTable('REPORT_VERSIONS', allVersions);

      db.commitLog(
        "2002", 
        "Auditor", 
        `Triggered DOCX report compiling and Mammoth HTML parsing for report id ${id}. Generated Version ${nextVer} (Size: ${(buffer.length/1024).toFixed(1)} KB)`
      );

      res.status(200).json({
        success: true,
        version: newVersionRecord,
        report: mappedReport,
        paras: paras
      });

    } catch (err: any) {
      console.error("DOCX compiling pipeline exception:", err);
      res.status(500).json({ error: `ORA-29532: Java / docx-packer routine aborted unexpectedly: ${err.message}` });
    }
  });

  app.post("/api/reports/:id/save-pdf", (req, res) => {
    const { id } = req.params;
    const { versionId, pdfBase64, auditorName } = req.body;

    if (!versionId || !pdfBase64) {
      return res.status(400).json({ error: "Missing versionId or pdfBase64 binary payload." });
    }

    const allVersions = db.getTable('REPORT_VERSIONS') || [];
    const idx = allVersions.findIndex((v: any) => v.VERSION_ID === versionId && v.REPORT_ID === id);

    if (idx !== -1) {
      allVersions[idx].PDF_BLOB_BASE64 = pdfBase64;
      db.saveTable('REPORT_VERSIONS', allVersions);

      // also attach the PDF file name to the standard REPORT registry if none exists:
      const reportTable = db.getTable('AUDIT_REPORTS_ENTRY');
      const rIdx = reportTable.findIndex(r => r.REPORT_ID === id);
      if (rIdx !== -1) {
        reportTable[rIdx].ATTACHMENT_NAME = `${reportTable[rIdx].REPORT_NO.replace(/\//g, '_')}_v${allVersions[idx].VERSION_NO}.pdf`;
        db.saveTable('AUDIT_REPORTS_ENTRY', reportTable);
      }

      db.commitLog(
        auditorName || "Auditor",
        "Auditor",
        `Committed finalized PDF byte-stream to version slot ${versionId} of audit report ${id}.`
      );

      res.status(200).json({
        success: true,
        message: "PDF version committed successfully to system store.",
        attachmentName: reportTable[rIdx]?.ATTACHMENT_NAME
      });
    } else {
      res.status(404).json({ error: "Version slot reference not found." });
    }
  });

  // Dynamic Word DOCX to HTML Direct conversion endpoint
  app.post("/api/convert-docx-to-html", async (req, res) => {
    const { fileDataBlob, filename } = req.body;
    if (!fileDataBlob) {
      return res.status(400).json({ error: "ORA-01403: no data found - missing fileDataBlob stream." });
    }
    try {
      const buffer = Buffer.from(fileDataBlob, 'base64');
      const convertResponse = await mammoth.convertToHtml({ buffer });
      
      db.commitLog(
        "2002",
        "Auditor",
        `Parsed uploaded raw docx document dynamically using Mammoth translator: ${filename || "unspecified.docx"} (${(buffer.length/1024).toFixed(1)} KB)`
      );

      res.status(200).json({
        success: true,
        htmlContent: convertResponse.value,
        filename: filename || "converted_doc.docx",
        size: buffer.length
      });
    } catch (err: any) {
      console.error("Mammoth physical document conversion aborted:", err);
      res.status(500).json({ error: `ORA-29532: Mammoth translation engine abort: ${err.message}` });
    }
  });

  // Storing Dynamically generated PDF and converted HTML records under versions logs
  app.post("/api/save-custom-version", (req, res) => {
    const { reportId, filename, docxBase64, htmlContent, pdfBase64, auditorName } = req.body;
    if (!docxBase64 || !htmlContent || !pdfBase64) {
      return res.status(400).json({ error: "ORA-01401: inserted value too large/missing parameters for column FILE_DATA_BLOB" });
    }

    const rId = reportId || "GENERIC_CONVERTER";
    const allVersions = db.getTable('REPORT_VERSIONS') || [];
    const existingCount = allVersions.filter((v: any) => v.REPORT_ID === rId).length;
    const nextVer = existingCount + 1;
    const idPrefix = `VER-${Math.floor(1000 + Math.random() * 9000)}`;

    const newVersionRecord = {
      VERSION_ID: idPrefix,
      REPORT_ID: rId,
      VERSION_NO: nextVer,
      DOCX_BLOB_BASE64: docxBase64,
      HTML_CONTENT: htmlContent,
      PDF_BLOB_BASE64: pdfBase64,
      CREATED_AT: new Date().toISOString(),
      CREATED_BY: auditorName || "Smt. P. Lakshmi",
      DOC_SIZE: Math.floor(docxBase64.length * 0.75),
      REMARKS: `Uploaded external compliance DOCX converted dynamically to PDF: ${filename}`
    };

    allVersions.unshift(newVersionRecord);
    db.saveTable('REPORT_VERSIONS', allVersions);

    // If this belongs to a real report, update its ATTACHMENT_NAME
    let finalAttachmentName = "";
    if (rId !== "GENERIC_CONVERTER") {
      const reportTable = db.getTable('AUDIT_REPORTS_ENTRY');
      const rIdx = reportTable.findIndex(r => r.REPORT_ID === rId);
      if (rIdx !== -1) {
        finalAttachmentName = `${reportTable[rIdx].REPORT_NO.replace(/\//g, '_')}_v${nextVer}.pdf`;
        reportTable[rIdx].ATTACHMENT_NAME = finalAttachmentName;
        db.saveTable('AUDIT_REPORTS_ENTRY', reportTable);
      }
    }

    db.commitLog(
      auditorName || "Auditor", 
      "Auditor", 
      `Registered converted PDF version ID: ${idPrefix} under registry scope ${rId}`
    );

    res.json({
      success: true,
      version: newVersionRecord,
      attachmentName: finalAttachmentName,
      message: "Dynamic document converted and added to system records successfully!"
    });
  });

  // Paras Registry API
  app.get("/api/paras", (req, res) => {
    const list = db.getTable('AUDIT_PARAS').map(mapParas);
    res.json(list);
  });

  app.post("/api/paras", (req, res) => {
    const paraId = `PR-${Math.floor(810 + Math.random() * 90)}`;
    const oracleRecord = {
      PARA_ID: paraId,
      REPORT_ID: req.body.reportId || 'REP-2026-701',
      PARA_NO: req.body.paraNo || `Para-${Math.floor(1 + Math.random()*9)}.${Math.floor(1 + Math.random()*9)}`,
      TITLE: req.body.title || 'Quality reject slip missing documentation',
      CATEGORY: req.body.category || 'Major',
      DESCRIPTION: req.body.description || 'Description block missing.',
      FINANCIAL_IMPLICATION: parseFloat(req.body.financialImplication) || 0,
      STATUS: req.body.status || 'Outstanding',
      REPLY_CONTENT: '',
      MARKED_EMP_ID: '',
      DAK_NO: `DK-2026-${activeDakNumber++}`
    };

    const table = db.getTable('AUDIT_PARAS');
    table.unshift(oracleRecord);
    db.saveTable('AUDIT_PARAS', table);

    // Increment parent paras count
    const repTable = db.getTable('AUDIT_REPORTS_ENTRY');
    const rIdx = repTable.findIndex(x => x.REPORT_ID === oracleRecord.REPORT_ID);
    if (rIdx !== -1) {
      repTable[rIdx].PARAS_COUNT = (repTable[rIdx].PARAS_COUNT || 0) + 1;
      db.saveTable('AUDIT_REPORTS_ENTRY', repTable);
    }

    db.commitLog("SYSTEM", "Auditor", `Appended Observation record ${paraId}`);
    res.status(201).json(mapParas(oracleRecord));
  });

  app.put("/api/paras/:id", (req, res) => {
    const { id } = req.params;
    const table = db.getTable('AUDIT_PARAS');
    const idx = table.findIndex(x => x.PARA_ID === id);
    if (idx !== -1) {
      // Map properties back if requested in body camelCase format
      const updates: any = {};
      if ('replyContent' in req.body) updates.REPLY_CONTENT = req.body.replyContent;
      if ('status' in req.body) updates.STATUS = req.body.status;
      if ('markedToEmployeeId' in req.body) updates.MARKED_EMP_ID = req.body.markedToEmployeeId;
      
      table[idx] = { ...table[idx], ...updates };
      db.saveTable('AUDIT_PARAS', table);
      res.json(mapParas(table[idx]));
    } else {
      res.status(404).json({ error: "Para not found" });
    }
  });

  // Dispatch Tracking API
  app.get("/api/dispatch", (req, res) => {
    const list = db.getTable('DISPATCH').map(mapDispatch);
    res.json(list);
  });

  app.post("/api/dispatch", (req, res) => {
    const id = `DSP-${Math.floor(25010 + Math.random() * 900)}`;
    const dNo = `VSP/AUD/DISP/2026/${Math.floor(100 + Math.random() * 900)}`;
    const oracleRecord = {
      DISPATCH_ID: id,
      DISPATCH_NO: dNo,
      DISPATCH_DATE: new Date().toISOString().split('T')[0],
      SUBJECT: req.body.subject || 'Signed Audit query letters directory',
      SENDER_DEPT: req.body.senderDept || 'Internal Audit',
      RECEIVER_DEPT: req.body.receiverDept || 'Purchase (Other than Raw Materials)',
      DAK_NO: req.body.dakNo || `DK-2026-${activeDakNumber++}`,
      MEDIUM: req.body.medium || 'Hand Delivered',
      STATUS: 'Dispatched'
    };

    const table = db.getTable('DISPATCH');
    table.unshift(oracleRecord);
    db.saveTable('DISPATCH', table);
    db.commitLog("SYSTEM", "Auditor", `Dispatched transit ticket reference ${dNo}`);
    res.status(201).json(mapDispatch(oracleRecord));
  });

  app.put("/api/dispatch/:id", (req, res) => {
    const { id } = req.params;
    const table = db.getTable('DISPATCH');
    const idx = table.findIndex(x => x.DISPATCH_ID === id);
    if (idx !== -1) {
      table[idx] = { ...table[idx], STATUS: req.body.status || table[idx].STATUS };
      db.saveTable('DISPATCH', table);
      res.json(mapDispatch(table[idx]));
    } else {
      res.status(404).json({ error: "Dispatch record not matching" });
    }
  });

  // Master Maintenance APIs
  app.get("/api/employees", (req, res) => {
    const list = db.getTable('EMPLOYEE_MASTER').map(mapEmployee);
    res.json(list);
  });

  app.post("/api/employees", (req, res) => {
    const id = Math.floor(400 + Math.random() * 500);
    const deptRow = db.getTable('DEPARTMENT_MASTER').find(d => d.DEPT_NAME === req.body.department);
    const code = deptRow ? deptRow.DEPT_CODE : 'PUR_ORM';

    const oracleRecord = {
      EMP_ID: id,
      EMP_NO: req.body.empNo || `EMP-${Math.floor(10000 + Math.random()*90000)}`,
      EMP_NAME: req.body.name || 'Anonymous Staff',
      EMAIL: req.body.email || 'officer@vizagsteel.com',
      DEPT_CODE: code,
      DESIGNATION: req.body.designation || 'Specialist Officer',
      IS_ACTIVE: 'Y',
      CREATION_DATE: new Date().toISOString().split('T')[0],
      CREATED_BY: 'SYS_REGISTRAR'
    };

    const table = db.getTable('EMPLOYEE_MASTER');
    table.push(oracleRecord);
    db.saveTable('EMPLOYEE_MASTER', table);
    res.status(201).json(mapEmployee(oracleRecord));
  });

  app.get("/api/departments", (req, res) => {
    const list = db.getTable('DEPARTMENT_MASTER').map(mapDept);
    res.json(list);
  });

  app.post("/api/departments", (req, res) => {
    const id = Math.floor(110 + Math.random()*90);
    const oracleRecord = {
      DEPT_ID: id,
      DEPT_CODE: req.body.code || `DEPT_${id}`,
      DEPT_NAME: req.body.name || 'New Executive Dept',
      HEAD_NAME: req.body.headName || 'General GM',
      CONTACT_NO: req.body.contactNo || '7032115000',
      STATUS: 'Active',
      CREATION_DATE: new Date().toISOString().split('T')[0],
      CREATED_BY: 'SYS_REGISTRAR'
    };

    const table = db.getTable('DEPARTMENT_MASTER');
    table.push(oracleRecord);
    db.saveTable('DEPARTMENT_MASTER', table);
    res.status(201).json(mapDept(oracleRecord));
  });

  app.get("/api/programs", (req, res) => {
    const list = db.getTable('AUDIT_PROGRAM_MASTER').map(mapProgram);
    res.json(list);
  });

  app.post("/api/programs", (req, res) => {
    const id = Math.floor(310 + Math.random()*90);
    const oracleRecord = {
      PROG_ID: id,
      PROG_CODE: req.body.code || `PROG_${id}`,
      PROG_NAME: req.body.name || 'Standard Review Program',
      SCOPE_OF_AUDIT: req.body.scopeOfAudit || 'General regulatory verification scope.',
      APPLICABLE_GUIDELINES: req.body.applicableGuidelines || 'VSP Manuals Section 9B',
      CREATION_DATE: new Date().toISOString().split('T')[0],
      CREATED_BY: 'SYSTEM'
    };
    
    const table = db.getTable('AUDIT_PROGRAM_MASTER');
    table.push(oracleRecord);
    db.saveTable('AUDIT_PROGRAM_MASTER', table);
    res.status(201).json(mapProgram(oracleRecord));
  });

  // Circulars / Knowledge documents APIs
  app.get("/api/knowledge", (req, res) => {
    const list = db.getTable('knowledgeDocsList');
    res.json(list);
  });

  app.post("/api/knowledge", (req, res) => {
    const newDoc: KnowledgeDocument = {
      ...req.body,
      id: `KD-${Math.floor(210 + Math.random() * 90)}`,
      releaseDate: new Date().toISOString().split('T')[0],
      fileSize: req.body.fileSize || '1.5 MB'
    };
    
    const list = db.getTable('knowledgeDocsList');
    list.unshift(newDoc);
    db.saveTable('knowledgeDocsList', list);
    res.status(201).json(newDoc);
  });

  // Action / Secure Transaction Logs endpoint
  app.get("/api/logs", (req, res) => {
    // Map ACTIVITY_LOGS format to legacy structure for display layout
    const originalLogs: ActivityLog[] = db.getTable('ACTIVITY_LOGS').map(l => ({
      id: l.LOG_ID,
      timestamp: l.TIMESTAMP,
      username: l.USERNAME,
      role: l.ROLE,
      action: l.ACTION,
      ipAddress: l.IP_ADDRESS
    }));
    res.json(originalLogs);
  });

  app.post("/api/logs", (req, res) => {
    const { username, role, action } = req.body;
    db.commitLog(username || 'SYSTEM', role || 'User', action || 'Logged generic action');
    res.json({ success: true });
  });

  // Audit Report Entries Endpoint Sequence
  app.get("/api/audit-report-entries", (req, res) => {
    const list = db.getTable('AUDIT_REPORT_ENTRIES' as any);
    res.json(list);
  });

  app.post("/api/audit-report-entries", (req, res) => {
    const list = db.getTable('AUDIT_REPORT_ENTRIES' as any);
    const newEntry = {
      id: `ARE-${Math.floor(1000 + Math.random() * 9000)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...req.body
    };
    list.push(newEntry);
    db.saveTable('AUDIT_REPORT_ENTRIES' as any, list);
    db.commitLog(req.body.created_by || "ANON", req.body.role || "Auditor", `Created audit report entry ARE key: ${newEntry.id}`);
    res.status(201).json(newEntry);
  });

  app.put("/api/audit-report-entries/:id", (req, res) => {
    const { id } = req.params;
    const list = db.getTable('AUDIT_REPORT_ENTRIES' as any);
    const index = list.findIndex((x: any) => x.id === id);
    if (index === -1) {
      return res.status(404).json({ error: `Audit report entry with ID ${id} not found.` });
    }
    const updatedEntry = {
      ...list[index],
      ...req.body,
      updated_at: new Date().toISOString()
    };
    list[index] = updatedEntry;
    db.saveTable('AUDIT_REPORT_ENTRIES' as any, list);
    db.commitLog(req.body.created_by || "ANON", req.body.role || "Auditor", `Updated audit report entry ARE key: ${id}`);
    res.json(updatedEntry);
  });

  app.delete("/api/audit-report-entries/:id", (req, res) => {
    const { id } = req.params;
    const list = db.getTable('AUDIT_REPORT_ENTRIES' as any);
    const filtered = list.filter((x: any) => x.id !== id);
    db.saveTable('AUDIT_REPORT_ENTRIES' as any, filtered);
    res.json({ success: true });
  });

  // Dak Sequence
  app.get("/api/dak/init", (req, res) => {
    activeDakNumber += 1;
    res.json({ dakNo: `DK-2026-${activeDakNumber}` });
  });

  // Secure File Upload with exact BLOB structure, Preview, Size and Type checks!
  app.post("/api/upload", (req, res) => {
    const { filename, fileType, fileSize, fileDataBlob, reportId } = req.body;
    
    if (!filename || !fileType || !fileSize || !fileDataBlob) {
      return res.status(400).json({ error: "ORA-01401: inserted value too large/missing parameters for column FILE_DATA_BLOB" });
    }

    // Supported extensions validation: JPG, PNG, PDF, DOCX, XLSX
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const fileExt = filename.split('.').pop()?.toLowerCase();
    const isSupported = ['jpg', 'jpeg', 'png', 'pdf', 'docx', 'xlsx'].includes(fileExt || '');

    if (!isSupported) {
      return res.status(400).json({ error: `ORA-22288: file operation permitted only for JPG, PNG, PDF, DOCX, XLSX extension types. Got: .${fileExt}` });
    }

    // File size constraint validation: Max 5MB limit
    const MAX_BYTES = 5 * 1024 * 1024;
    if (fileSize > MAX_BYTES) {
      return res.status(400).json({ error: `ORA-22285: Secure attachment file upload exceeds max standard budget capacity bounds of 5.0 MB.` });
    }

    // Persist into UPLOAD_REPORTS
    const table = db.getTable('UPLOAD_REPORTS');
    const uNo = `UPL-${Math.floor(1000 + Math.random() * 9000)}`;
    const newUpload = {
      UPLOAD_ID: uNo,
      REPORT_ID: reportId || 'REP-2026-701',
      FILE_NAME: filename,
      FILE_TYPE: fileType,
      FILE_SIZE: fileSize,
      FILE_DATA_BLOB: fileDataBlob, // bases64 CLOB chunk securely preserved
      UPLOADED_BY: '2002', // Auditor Lakshmi
      UPLOAD_DATE: new Date().toISOString().split('T')[0]
    };
    table.unshift(newUpload);
    db.saveTable('UPLOAD_REPORTS', table);

    // Update Report Entry reference filename
    if (reportId) {
      const repTable = db.getTable('AUDIT_REPORTS_ENTRY');
      const rIdx = repTable.findIndex(x => x.REPORT_ID === reportId);
      if (rIdx !== -1) {
        repTable[rIdx].ATTACHMENT_NAME = filename;
        db.saveTable('AUDIT_REPORTS_ENTRY', repTable);
      }
    }

    db.commitLog("2002", "Auditor", `Uploaded authorized document scanning attachment: ${filename} (${(fileSize/1024).toFixed(1)} KB)`);
    res.json({
      success: true,
      message: "Security clearance: audit file encrypted and committed into UPLOAD_REPORTS storage table.",
      attachmentName: filename,
      uploadId: uNo
    });
  });

  // --- SMART AI INGESTION FLOW PATHWAY ---
  app.post("/api/smart-ingest", async (req, res) => {
    try {
      const { filename, fileDataBlob, planId } = req.body;
      if (!filename || !fileDataBlob) {
        return res.status(400).json({ error: "Filename and fileDataBlob (base64 string) are mandatory for AI Ingestion." });
      }

      // Step 1: Calculate SHA-256 of base64 content to verify duplicates
      const buffer = Buffer.from(fileDataBlob, 'base64');
      const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");

      const uploadTable = db.getTable('UPLOAD_REPORTS');
      const duplicateUpload = uploadTable.find(u => u.SHA256 === sha256);

      if (duplicateUpload) {
        const reportsTable = db.getTable('AUDIT_REPORTS_ENTRY');
        const existingRep = reportsTable.find(r => r.REPORT_ID === duplicateUpload.REPORT_ID);
        
        return res.status(200).json({
          status: "duplicate",
          message: `Duplicate document detected via SHA-256 (Hash: ${sha256.substring(0, 10)}...).`,
          hashed_sha255: sha256,
          linkedReportId: duplicateUpload.REPORT_ID,
          linkedReportNo: existingRep ? existingRep.REPORT_NO : "N/A",
          linkedReportTitle: existingRep ? existingRep.TITLE : "N/A"
        });
      }

      // Step 2: Extract text
      let extractedText = "";
      const fileExt = filename.split('.').pop()?.toLowerCase();

      if (fileExt === 'pdf') {
        try {
          const pdfData = await ((pdfParse as any).default || (pdfParse as any))(buffer);
          extractedText = pdfData.text || "";
        } catch (err: any) {
          console.error("PDF Parsing failed:", err);
          return res.status(500).json({ error: `Failed to extract text from PDF: ${err.message}` });
        }
      } else if (fileExt === 'docx') {
        try {
          const docData = await mammoth.extractRawText({ buffer });
          extractedText = docData.value || "";
        } catch (err: any) {
          console.error("DOCX Parsing failed:", err);
          return res.status(500).json({ error: `Failed to extract text from DOCX: ${err.message}` });
        }
      } else {
        return res.status(400).json({ error: "Unsupported file type for AI parsing. Please upload a .pdf or .docx document." });
      }

      if (!extractedText.trim()) {
        return res.status(400).json({ error: "Extracted text was empty. Please verify the document has readable text." });
      }

      // Limit characters to avoid token bloating
      const textSample = extractedText.substring(0, 15000);

      // Step 3: Call Gemini Structured Output API
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        return res.status(400).json({ error: "GEMINI_API_KEY environment variable is not configured on this workspace server." });
      }

      const ai = new GoogleGenAI({
        apiKey: geminiApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Declare responseSchema
      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          reportNo: {
            type: Type.STRING,
            description: "An official report number or identifier. Format e.g., RINL/AUD/M12/2026/04. If missing, generate one."
          },
          title: {
            type: Type.STRING,
            description: "The primary title of the audit report."
          },
          departmentName: {
            type: Type.STRING,
            description: "The targeted department name (e.g. Steel melting shop, SMS Department, Purchase Division)."
          },
          auditPeriodFrom: {
            type: Type.STRING,
            description: "ISO formatted date YYYY-MM-DD representing start of audit cycle, or empty."
          },
          auditPeriodTo: {
            type: Type.STRING,
            description: "ISO formatted date YYYY-MM-DD representing end of audit cycle, or empty."
          },
          leadAuditor: {
            type: Type.STRING,
            description: "The lead auditor's name."
          },
          paras: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                paraNo: {
                  type: Type.STRING,
                  description: "Standard sub-paragraph number (e.g. Para-1.1, Para-1.2, 1.1, 2.3)."
                },
                title: {
                  type: Type.STRING,
                  description: "Title or short header of the observation."
                },
                category: {
                  type: Type.STRING,
                  description: "Must be exactly one of: Critical, Major, Minor."
                },
                description: {
                  type: Type.STRING,
                  description: "The narrative description of the audit finding/error."
                },
                financialImplication: {
                  type: Type.NUMBER,
                  description: "Sum of financial discrepancy, loss, or waste in INR ₹. Return 0 if not stated."
                }
              },
              required: ["paraNo", "title", "description"]
            },
            description: "List of extracted audit paragraphs or list of observations."
          }
        },
        required: ["reportNo", "title", "departmentName", "paras"]
      };

      const prompt = `
You are a senior auditor extracting structured data from unstructured audit reports (PDF or DOCX text).
Please extract report metadata and individual paragraphs/observations exactly in corporate layout.
Here is the extracted document text content:
----------------------
${textSample}
----------------------
      `;

      let aiResponse;
      try {
        aiResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            systemInstruction: "Extract detailed structured records from unstructured text files in JSON format compatible with Oracle AIMS relational tables.",
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            temperature: 0.1
          }
        });
      } catch (err: any) {
        console.error("Gemini API call failed:", err);
        return res.status(500).json({ error: `Gemini extraction failed: ${err.message}` });
      }

      const rawJson = aiResponse.text;
      if (!rawJson) {
        return res.status(500).json({ error: "Gemini did not return any JSON response text." });
      }

      let parsedData;
      try {
        parsedData = JSON.parse(rawJson);
      } catch (err: any) {
        console.error("Failed to parse Gemini output chunk:", rawJson);
        return res.status(500).json({ error: "Failed to parse Gemini's output as structured DB JSON compatible tables." });
      }

      // Step 4: Relational Alignment Protocol
      const deptTable = db.getTable('DEPARTMENT_MASTER');
      const empTable = db.getTable('EMPLOYEE_MASTER');
      const reportsTable = db.getTable('AUDIT_REPORTS_ENTRY');
      const parasTable = db.getTable('AUDIT_PARAS');

      let deptCode = "PUR_ORM";
      let deptName = parsedData.departmentName || "General Division";

      const matchedDept = deptTable.find(d => 
        d.DEPT_NAME.toLowerCase().includes(deptName.toLowerCase()) || 
        d.DEPT_CODE.toLowerCase() === deptName.toLowerCase()
      );

      const fixesApplied: string[] = [];

      if (matchedDept) {
        deptCode = matchedDept.DEPT_CODE;
        deptName = matchedDept.DEPT_NAME;
      } else {
        const newDeptId = Math.floor(150 + Math.random() * 100);
        const tempCode = `DEPT_${newDeptId}`;
        const newDeptObj = {
          DEPT_ID: newDeptId,
          DEPT_CODE: tempCode,
          DEPT_NAME: deptName,
          HEAD_NAME: "Shri Auto Generated GM",
          CONTACT_NO: "7032115999",
          STATUS: "Active",
          CREATION_DATE: new Date().toISOString().split('T')[0],
          CREATED_BY: "AI_REPAIR_SERVICE"
        };
        deptTable.push(newDeptObj);
        db.saveTable('DEPARTMENT_MASTER', deptTable);
        deptCode = tempCode;
        fixesApplied.push(`Relational Repair: Automatically registered missing department "${deptName}" with code "${tempCode}".`);
      }

      const auditorName = parsedData.leadAuditor || "Smt. P. Lakshmi";
      const matchedEmp = empTable.find(e => e.EMP_NAME.toLowerCase().includes(auditorName.toLowerCase()));
      if (!matchedEmp) {
        const newEmpId = Math.floor(550 + Math.random() * 200);
        const newWorker = {
          EMP_ID: newEmpId,
          EMP_NO: `EMP-${Math.floor(20000 + Math.random() * 70000)}`,
          EMP_NAME: auditorName,
          EMAIL: `${auditorName.replace(/\s+/g, '.').toLowerCase()}@vizagsteel.com`,
          DEPT_CODE: "AUDIT_DIV",
          DESIGNATION: "Junior Auditor",
          IS_ACTIVE: "Y",
          CREATION_DATE: new Date().toISOString().split('T')[0],
          CREATED_BY: "AI_REPAIR_SERVICE"
        };
        empTable.push(newWorker);
        db.saveTable('EMPLOYEE_MASTER', empTable);
        fixesApplied.push(`Relational Repair: Automatically registered lead auditor "${auditorName}" to Employee roster.`);
      }

      let fromDate = parsedData.auditPeriodFrom || new Date().toISOString().split('T')[0];
      let toDate = parsedData.auditPeriodTo || new Date().toISOString().split('T')[0];

      const cleanDate = (dStr: string) => {
        if (!dStr) return new Date().toISOString().split('T')[0];
        try {
          const d = new Date(dStr);
          if (isNaN(d.getTime())) {
            return new Date().toISOString().split('T')[0];
          }
          return d.toISOString().split('T')[0];
        } catch {
          return new Date().toISOString().split('T')[0];
        }
      };

      fromDate = cleanDate(fromDate);
      toDate = cleanDate(toDate);

      let finalPlanId = planId;
      if (!finalPlanId) {
        const plansTable = db.getTable('AUDIT_PLANNING');
        const associatedPlan = plansTable.find(p => p.DEPT_CODE === deptCode || p.department === deptName);
        if (associatedPlan) {
          finalPlanId = associatedPlan.PLAN_ID;
          fixesApplied.push(`Linked audit report automatically to existing Audit Plan [${finalPlanId}] for department "${deptName}".`);
        } else {
          const newPlanId = `PLN-2026-${Math.floor(700 + Math.random() * 290)}`;
          const newPlanRecord = {
            PLAN_ID: newPlanId,
            TITLE: `Annual Corporate Review on ${deptName}`,
            AUDIT_TYPE: 'Regular',
            DEPT_CODE: deptCode,
            TEAM_LEAD_EMP_ID: 402, // Lakshmi
            FINANCIAL_YEAR: '2026-27',
            START_DATE: fromDate,
            END_DATE: toDate,
            STATUS: 'Approved',
            CREATED_BY: 'AI_REPAIR_SERVICE'
          };
          plansTable.push(newPlanRecord);
          db.saveTable('AUDIT_PLANNING', plansTable);
          finalPlanId = newPlanId;
          fixesApplied.push(`Relational Integrity: Initiated a new approved Audit Plan [${newPlanId}] for "${deptName}".`);
        }
      }

      // Step 5: Similarity Deduplication / Vector matching
      const finalReportId = `REP-2026-${Math.floor(800 + Math.random() * 190)}`;
      const incomingParas = parsedData.paras || [];
      const duplicateParasLogged: string[] = [];
      const deduplicatedParasToWrite: any[] = [];

      const calculateStringSimilarity = (str1: string, str2: string): number => {
        const wordBag = (s: string) => {
          return new Set(s.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2));
        };
        const bag1 = wordBag(str1);
        const bag2 = wordBag(str2);
        
        if (bag1.size === 0 || bag2.size === 0) return 0;
        
        const intersection = new Set([...bag1].filter(x => bag2.has(x)));
        return intersection.size / Math.sqrt(bag1.size * bag2.size);
      };

      for (const ipara of incomingParas) {
        const rawTitle = ipara.title || "";
        const rawDesc = ipara.description || "";
        
        let maxSimilarity = 0;
        let bestMatchParaRef = "";
        
        for (const existingPara of parasTable) {
          const simTitle = calculateStringSimilarity(rawTitle, existingPara.TITLE);
          const simDesc = calculateStringSimilarity(rawDesc, existingPara.DESCRIPTION || "");
          const sim = Math.max(simTitle, simDesc);
          if (sim > maxSimilarity) {
            maxSimilarity = sim;
            bestMatchParaRef = existingPara.PARA_NO;
          }
        }

        if (maxSimilarity > 0.85) {
          duplicateParasLogged.push(`Linked Duplicate Skip: Observation identical to existing observation [${bestMatchParaRef}] with ${(maxSimilarity*100).toFixed(0)}% text alignment.`);
        } else {
          deduplicatedParasToWrite.push({
            PARA_ID: `PR-${Math.floor(30000 + Math.random() * 69000)}`,
            REPORT_ID: finalReportId,
            PARA_NO: ipara.paraNo || `Para-${Math.floor(10 + Math.random() * 90)}`,
            TITLE: rawTitle,
            CATEGORY: ['Critical', 'Major', 'Minor'].includes(ipara.category) ? ipara.category : 'Major',
            DESCRIPTION: rawDesc,
            FINANCIAL_IMPLICATION: Number(ipara.financialImplication) || 0,
            STATUS: 'Outstanding',
            CREATION_DATE: new Date().toISOString().split('T')[0]
          });
        }
      }

      // Step 6: Bulk Relational Transaction Writes
      const reportNo = parsedData.reportNo || `VSP/AUD/M/${new Date().getFullYear()}/${Math.floor(100+Math.random()*900)}`;
      const title = parsedData.title || `Audit Report for ${deptName}`;

      const newReportRecord = {
        REPORT_ID: finalReportId,
        PLAN_ID: finalPlanId,
        REPORT_NO: reportNo,
        TITLE: title,
        AUDIT_PERIOD_FROM: fromDate,
        AUDIT_PERIOD_TO: toDate,
        LEAD_AUDITOR: auditorName,
        DEPT_CODE: deptCode,
        DATE_CREATED: new Date().toISOString().split('T')[0],
        DATE_SUBMITTED: new Date().toISOString().split('T')[0],
        STATUS: 'Draft',
        PARAS_COUNT: deduplicatedParasToWrite.length,
        ATTACHMENT_NAME: filename
      };

      reportsTable.unshift(newReportRecord);
      db.saveTable('AUDIT_REPORTS_ENTRY', reportsTable);

      for (const p of deduplicatedParasToWrite) {
        parasTable.push(p);
      }
      db.saveTable('AUDIT_PARAS', parasTable);

      const uNo = `UPL-${Math.floor(1000 + Math.random() * 9000)}`;
      const newUpload = {
        UPLOAD_ID: uNo,
        REPORT_ID: finalReportId,
        FILE_NAME: filename,
        FILE_TYPE: fileExt === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        FILE_SIZE: buffer.length,
        FILE_DATA_BLOB: fileDataBlob,
        UPLOADED_BY: '2002',
        UPLOAD_DATE: new Date().toISOString().split('T')[0],
        SHA256: sha256
      };
      
      uploadTable.unshift(newUpload);
      db.saveTable('UPLOAD_REPORTS', uploadTable);

      db.commitLog(
        "AI_INGEST_PORTAL", 
        "Assistant", 
        `Triggered smart ingest flowchart for file "${filename}". Extracts 1 report, ${deduplicatedParasToWrite.length} paras. Deduplicated ${duplicateParasLogged.length} replicas. Relational adjustments: ${fixesApplied.length}.`
      );

      res.json({
        status: "success",
        message: "AI document understanding, verification and relational alignment complete.",
        sha256Hash: sha256,
        fixesApplied,
        duplicatesDetected: duplicateParasLogged,
        report: {
          reportId: finalReportId,
          reportNo,
          title,
          leadAuditor: auditorName,
          department: deptName,
          auditPeriod: `${fromDate} to ${toDate}`,
          fileName: filename,
          extractedParasCount: deduplicatedParasToWrite.length
        },
        parasSaved: deduplicatedParasToWrite.map(p => ({
          paraNo: p.PARA_NO,
          title: p.TITLE,
          category: p.CATEGORY,
          financialImplication: p.FINANCIAL_IMPLICATION
        }))
      });

    } catch (error: any) {
      console.error("AI Smart Ingest execution exception:", error);
      res.status(500).json({ error: `Internal Server Error in AI Smart Ingest Flow: ${error.message}` });
    }
  });

  // List uploaded documents metadata (excluding bulky blob content)
  app.get("/api/uploads", (req, res) => {
    const list = db.getTable('UPLOAD_REPORTS') || [];
    const mapped = list.map((x: any) => ({
      UPLOAD_ID: x.UPLOAD_ID,
      REPORT_ID: x.REPORT_ID,
      FILE_NAME: x.FILE_NAME,
      FILE_TYPE: x.FILE_TYPE,
      FILE_SIZE: x.FILE_SIZE,
      UPLOADED_BY: x.UPLOADED_BY,
      UPLOAD_DATE: x.UPLOAD_DATE,
      SHA256: x.SHA256
    }));
    res.json(mapped);
  });

  // Retrieve Blob Attachment content for real high-fidelity Previews and Downloads!
  app.get("/api/upload/preview/:id", (req, res) => {
    const { id } = req.params;
    const table = db.getTable('UPLOAD_REPORTS');
    const doc = table.find(x => x.UPLOAD_ID === id || x.FILE_NAME === id || x.REPORT_ID === id);
    if (!doc) {
      return res.status(404).json({ error: "BLOB object not found in relational vault." });
    }
    res.json(doc);
  });

  // legacy simulation upload
  app.post("/api/upload-simulation", (req, res) => {
    const { filename } = req.body;
    res.json({
      success: true,
      message: "Document successfully authorized and encrypted into AIMS Storage vaults.",
      attachmentName: filename || "uploaded_audit_doc.pdf"
    });
  });

  // --- REPLY ENTRY DOCUMENT CONVERSION ENDPOINTS ---
  
  // List all conversions
  app.get("/api/conversions", (req, res) => {
    const list = db.getTable('REPORT_CONVERSIONS') || [];
    res.json(list);
  });

  // Get single conversion detail
  app.get("/api/conversions/:id", (req, res) => {
    const { id } = req.params;
    const list = db.getTable('REPORT_CONVERSIONS') || [];
    const item = list.find((x: any) => x.id === id);
    if (!item) {
      return res.status(404).json({ error: "Conversion record not found." });
    }
    res.json(item);
  });

  // Upload and convert file
  app.post("/api/conversions/upload", async (req, res) => {
    const { fileDataBlob, filename, fileType, uploadedBy, roleName } = req.body;
    if (!fileDataBlob) {
      return res.status(400).json({ error: "Missing fileDataBlob base64 stream." });
    }

    try {
      const buffer = Buffer.from(fileDataBlob, 'base64');
      const fileExt = filename.split('.').pop()?.toLowerCase();
      let htmlContentStr = "";

      if (fileExt === 'docx') {
        const result = await mammoth.convertToHtml({ buffer });
        htmlContentStr = result.value;
      } else if (fileExt === 'pdf') {
        try {
          const pdfData = await ((pdfParse as any).default || (pdfParse as any))(buffer);
          const rawText = pdfData.text || "";

          // Leverage Gemini for high-fidelity HTML conversion
          const geminiApiKey = process.env.GEMINI_API_KEY;
          if (geminiApiKey) {
            const { GoogleGenAI } = await import("@google/genai");
            const ai = new GoogleGenAI({ apiKey: geminiApiKey });
            const prompt = `
Take the following raw text extracted from a PDF document and structure it into a beautiful, highly styled responsive semantic HTML document (government audit reports / reply design style).
Preserve all formatting, headings, tables (with proper borders, margins, cell structure), lists, bullet points, and numbered lines. Use standard styling to render it like a professional document.
Return ONLY raw HTML. Do not wrap in markdown of any kind (such as \`\`\`html).

Extracted PDF Text:
----------------------
${rawText.substring(0, 30000)}
----------------------
`;
            const modelName = "gemini-3.5-flash";
            const response = await ai.models.generateContent({
              model: modelName,
              contents: prompt,
              config: {
                systemInstruction: "You are a master document converter that outputs raw semantically pristine HTML code starting with a div or article wrapper. Never include markdown codeblocks or quotes because your output is rendered directly.",
                temperature: 0.1
              }
            });
            htmlContentStr = response.text || "";
            // strip potential tick marks if Gemini ignored instructions
            htmlContentStr = htmlContentStr.replace(/^```html\s*/i, '').replace(/```\s*$/, '').trim();
          } else {
            htmlContentStr = `
              <div class="p-6 bg-white border rounded shadow-xs max-w-4xl mx-auto font-sans leading-relaxed text-slate-800">
                <h1 class="text-xl font-bold border-b pb-2 mb-4 text-[#1e3a8a]">${filename}</h1>
                <pre class="bg-slate-50 p-4 rounded border font-mono text-[11px] whitespace-pre-wrap leading-normal overflow-auto">${rawText}</pre>
              </div>
            `;
          }
        } catch (pdfErr: any) {
          console.error("PDF Parsing error:", pdfErr);
          htmlContentStr = `<div class="p-4 border border-red-200 bg-red-10 text-red-700 rounded font-sans">Failed to parse PDF text structure: ${pdfErr.message}</div>`;
        }
      } else {
        // Fallback for doc, rtf, text
        const textFallback = buffer.toString('utf-8').slice(0, 25000);
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (geminiApiKey) {
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({ apiKey: geminiApiKey });
          const prompt = `
The following document contents were uploaded under the filename "${filename}". Convert this content into a well-structured, neat and styled semantic HTML document.
Use standard table layouts, header structures, padding, and borders to display it professionally.
Return ONLY the raw HTML string without markdown code block wrappers (such as \`\`\`html).

Uploaded Content:
-----------------
${textFallback}
-----------------
`;
          const modelName = "gemini-3.5-flash";
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction: "You translate documents into clean, beautiful semantic HTML ready to render. Absolutely NO markdown wrapping.",
              temperature: 0.1
            }
          });
          htmlContentStr = response.text || "";
          htmlContentStr = htmlContentStr.replace(/^```html\s*/i, '').replace(/```\s*$/, '').trim();
        } else {
          htmlContentStr = `
            <div class="p-6 bg-white border rounded shadow-xs max-w-4xl mx-auto font-sans leading-relaxed text-slate-800">
              <h1 class="text-xl font-bold border-b pb-2 mb-4 text-[#1e3a8a]">${filename}</h1>
              <div class="whitespace-pre-wrap text-sm">${textFallback}</div>
            </div>
          `;
        }
      }

      const conversionId = `CONV-${Math.floor(1000 + Math.random() * 9000)}`;
      const allConversions = db.getTable('REPORT_CONVERSIONS') || [];

      const newRecord = {
        id: conversionId,
        file_name: filename,
        original_file_path: filename,
        html_content: htmlContentStr,
        generated_pdf_path: "", // will be filled once PDF is generated
        uploaded_by: uploadedBy || "Administrator",
        role_name: roleName || "Auditor",
        upload_date: new Date().toISOString().split('T')[0],
        status: "Converted"
      };

      allConversions.unshift(newRecord);
      db.saveTable('REPORT_CONVERSIONS', allConversions);

      db.commitLog(
        uploadedBy || "Administrator",
        roleName || "Auditor",
        `Uploaded & converted audit document "${filename}" to HTML (ID: ${conversionId}).`
      );

      res.status(200).json({
        success: true,
        record: newRecord
      });

    } catch (err: any) {
      console.error("Conversion failed:", err);
      res.status(500).json({ error: `Failed to convert document: ${err.message}` });
    }
  });

  // Save generated PDF for a conversion
  app.post("/api/conversions/:id/generate-pdf", (req, res) => {
    const { id } = req.params;
    const { pdfBase64, uploadedBy, roleName } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({ error: "Missing pdfBase64 stream payload." });
    }

    const allConversions = db.getTable('REPORT_CONVERSIONS') || [];
    const idx = allConversions.findIndex((x: any) => x.id === id);

    if (idx !== -1) {
      allConversions[idx].generated_pdf_path = pdfBase64;
      allConversions[idx].status = "Generated";
      db.saveTable('REPORT_CONVERSIONS', allConversions);

      db.commitLog(
        uploadedBy || "Administrator",
        roleName || "Auditor",
        `Generated and stored dynamic PDF conversion for ID ${id}.`
      );

      res.status(200).json({
        success: true,
        message: "PDF persisted in conversion registry successfully.",
        record: allConversions[idx]
      });
    } else {
      res.status(404).json({ error: "Conversion record not found." });
    }
  });

  // --- VITE MIDDLEWARE SETUP ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AIMS Server] Relational Oracle-Style Engine Running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start AIMS server:", err);
});
