export interface ColumnDefinition {
  name: string;
  type: 'NUMBER' | 'VARCHAR2' | 'DATE' | 'BLOB' | 'CLOB' | 'CHAR';
  length?: number;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey?: boolean;
  referencesTable?: string;
  referencesColumn?: string;
  defaultValue?: string;
  label: string;
}

export interface TableDefinition {
  tableName: string;
  description: string;
  columns: ColumnDefinition[];
}

export const oracleSchema: TableDefinition[] = [
  {
    tableName: 'DEPARTMENT_MASTER',
    description: 'Corporate division and department master table with HOD lookup references.',
    columns: [
      { name: 'DEPT_ID', type: 'NUMBER', isNullable: false, isPrimaryKey: true, label: 'Department ID' },
      { name: 'DEPT_CODE', type: 'VARCHAR2', length: 20, isNullable: false, isPrimaryKey: false, label: 'Department Oracle Code' },
      { name: 'DEPT_NAME', type: 'VARCHAR2', length: 120, isNullable: false, isPrimaryKey: false, label: 'Department Corporate Name' },
      { name: 'HEAD_NAME', type: 'VARCHAR2', length: 100, isNullable: false, isPrimaryKey: false, label: 'Department Head (HOD)' },
      { name: 'CONTACT_NO', type: 'VARCHAR2', length: 30, isNullable: true, isPrimaryKey: false, label: 'Intercom Contact Number' },
      { name: 'STATUS', type: 'VARCHAR2', length: 15, isNullable: false, isPrimaryKey: false, defaultValue: 'Active', label: 'Department Status' },
      { name: 'CREATION_DATE', type: 'DATE', isNullable: false, isPrimaryKey: false, label: 'Creation Timestamp' },
      { name: 'CREATED_BY', type: 'VARCHAR2', length: 50, isNullable: false, isPrimaryKey: false, label: 'Oracle Operator' }
    ]
  },
  {
    tableName: 'EMPLOYEE_MASTER',
    description: 'VSP enterprise staff directory with departmental alignment links.',
    columns: [
      { name: 'EMP_ID', type: 'NUMBER', isNullable: false, isPrimaryKey: true, label: 'Employee ID' },
      { name: 'EMP_NO', type: 'VARCHAR2', length: 15, isNullable: false, isPrimaryKey: false, label: 'Personal Ticket No' },
      { name: 'EMP_NAME', type: 'VARCHAR2', length: 100, isNullable: false, isPrimaryKey: false, label: 'Employee Full Name' },
      { name: 'EMAIL', type: 'VARCHAR2', length: 100, isNullable: false, isPrimaryKey: false, label: 'Official Intranet Email' },
      { name: 'DEPT_CODE', type: 'VARCHAR2', length: 20, isNullable: false, isPrimaryKey: false, isForeignKey: true, referencesTable: 'DEPARTMENT_MASTER', referencesColumn: 'DEPT_CODE', label: 'Assigned Department' },
      { name: 'DESIGNATION', type: 'VARCHAR2', length: 100, isNullable: false, isPrimaryKey: false, label: 'Official Grade Designation' },
      { name: 'IS_ACTIVE', type: 'CHAR', length: 1, isNullable: false, isPrimaryKey: false, defaultValue: 'Y', label: 'Active status code (Y/N)' },
      { name: 'CREATION_DATE', type: 'DATE', isNullable: false, isPrimaryKey: false, label: 'Registry Date' },
      { name: 'CREATED_BY', type: 'VARCHAR2', length: 50, isNullable: false, isPrimaryKey: false, label: 'Recorded By' }
    ]
  },
  {
    tableName: 'AUDIT_PROGRAM_MASTER',
    description: 'Standard guidelines, master audit scripts and operational scoping scopes.',
    columns: [
      { name: 'PROG_ID', type: 'NUMBER', isNullable: false, isPrimaryKey: true, label: 'Audit Program ID' },
      { name: 'PROG_CODE', type: 'VARCHAR2', length: 20, isNullable: false, isPrimaryKey: false, label: 'Program Code Reference' },
      { name: 'PROG_NAME', type: 'VARCHAR2', length: 180, isNullable: false, isPrimaryKey: false, label: 'Audit Program Subject' },
      { name: 'SCOPE_OF_AUDIT', type: 'CLOB', isNullable: false, isPrimaryKey: false, label: 'Detailed Scope Specifications' },
      { name: 'APPLICABLE_GUIDELINES', type: 'VARCHAR2', length: 1000, isNullable: true, isPrimaryKey: false, label: 'Regulatory Circular References' },
      { name: 'CREATION_DATE', type: 'DATE', isNullable: false, isPrimaryKey: false, label: 'Entry Date' },
      { name: 'CREATED_BY', type: 'VARCHAR2', length: 50, isNullable: false, isPrimaryKey: false, label: 'Auditor Registry Operator' }
    ]
  },
  {
    tableName: 'USER_MASTER',
    description: 'System authentication profile registrar including password hash states.',
    columns: [
      { name: 'USER_ID', type: 'NUMBER', isNullable: false, isPrimaryKey: true, label: 'User ID' },
      { name: 'USER_NAME', type: 'VARCHAR2', length: 30, isNullable: false, isPrimaryKey: false, label: 'System Access Username' },
      { name: 'PASSWORD_HASH', type: 'VARCHAR2', length: 100, isNullable: false, isPrimaryKey: false, label: 'Encrypted Security Token' },
      { name: 'ROLE_CODE', type: 'VARCHAR2', length: 20, isNullable: false, isPrimaryKey: false, isForeignKey: true, referencesTable: 'ROLE_MASTER', referencesColumn: 'ROLE_CODE', label: 'System Access Role' },
      { name: 'FULL_NAME', type: 'VARCHAR2', length: 100, isNullable: false, isPrimaryKey: false, label: 'Officer Full Name' },
      { name: 'DEPT_CODE', type: 'VARCHAR2', length: 20, isNullable: false, isPrimaryKey: false, label: 'Corporate Division' },
      { name: 'DESIGNATION', type: 'VARCHAR2', length: 100, isNullable: true, isPrimaryKey: false, label: 'Intranet Corporate Grade' },
      { name: 'CREATION_DATE', type: 'DATE', isNullable: false, isPrimaryKey: false, label: 'Sys Registered Date' }
    ]
  },
  {
    tableName: 'ROLE_MASTER',
    description: 'RBAC Authorization tier matrix supporting dynamic view bindings.',
    columns: [
      { name: 'ROLE_CODE', type: 'VARCHAR2', length: 20, isNullable: false, isPrimaryKey: true, label: 'Role Key Code' },
      { name: 'ROLE_NAME', type: 'VARCHAR2', length: 60, isNullable: false, isPrimaryKey: false, label: 'Tier Authority Descriptor' },
      { name: 'DESCRIPTION', type: 'VARCHAR2', length: 250, isNullable: true, isPrimaryKey: false, label: 'Detailed Permissions Description' }
    ]
  },
  {
    tableName: 'STATUS_MASTER',
    description: 'Global audit states reference repository (Outstanding, Pending response, Settled, etc).',
    columns: [
      { name: 'STATUS_CODE', type: 'VARCHAR2', length: 20, isNullable: false, isPrimaryKey: true, label: 'Status Key Code' },
      { name: 'STATUS_NAME', type: 'VARCHAR2', length: 60, isNullable: false, isPrimaryKey: false, label: 'Status Human Label' },
      { name: 'DISPLAY_COLOR', type: 'VARCHAR2', length: 25, isNullable: false, isPrimaryKey: false, label: 'Display Tailwind Hex/CSS Color' }
    ]
  },
  {
    tableName: 'AUDIT_PLANNING',
    description: 'Annual corporate audit itineraries, dates, tour plans, and execute state logs.',
    columns: [
      { name: 'PLAN_ID', type: 'VARCHAR2', length: 30, isNullable: false, isPrimaryKey: true, label: 'Audit Scheme ID' },
      { name: 'TITLE', type: 'VARCHAR2', length: 200, isNullable: false, isPrimaryKey: false, label: 'Comprehensive Objective Title' },
      { name: 'QUARTER', type: 'VARCHAR2', length: 10, isNullable: false, isPrimaryKey: false, label: 'Audit Target Planning Quarter (Q1-Q4)' },
      { name: 'AUDIT_TYPE', type: 'VARCHAR2', length: 25, isNullable: false, isPrimaryKey: false, label: 'Audit Classification Category' },
      { name: 'DEPT_CODE', type: 'VARCHAR2', length: 20, isNullable: false, isPrimaryKey: false, isForeignKey: true, referencesTable: 'DEPARTMENT_MASTER', referencesColumn: 'DEPT_CODE', label: 'Department Scoped' },
      { name: 'PLANNED_MONTHS', type: 'VARCHAR2', length: 120, isNullable: false, isPrimaryKey: false, label: 'Intended Execution Month Blocks' },
      { name: 'TEAM_LEAD', type: 'VARCHAR2', length: 100, isNullable: false, isPrimaryKey: false, label: 'Assigned Directing Lead Auditor' },
      { name: 'START_DATE', type: 'DATE', isNullable: true, isPrimaryKey: false, label: 'Estimated Commissioning Date' },
      { name: 'END_DATE', type: 'DATE', isNullable: true, isPrimaryKey: false, label: 'Estimated Decommission Date' },
      { name: 'TOUR_PROPOSAL_URL', type: 'VARCHAR2', length: 250, isNullable: true, isPrimaryKey: false, label: 'Linked Tour Itinerary file link' },
      { name: 'STATUS', type: 'VARCHAR2', length: 20, isNullable: false, isPrimaryKey: false, defaultValue: 'Draft', label: 'Current Plan Status' },
      { name: 'CREATION_DATE', type: 'DATE', isNullable: false, isPrimaryKey: false, label: 'Created On' }
    ]
  },
  {
    tableName: 'AUDIT_REPORTS_ENTRY',
    description: 'Official Audit reports detailing outcomes, scope statements, and summary logs.',
    columns: [
      { name: 'REPORT_ID', type: 'VARCHAR2', length: 30, isNullable: false, isPrimaryKey: true, label: 'Corporate Report ID' },
      { name: 'PLAN_ID', type: 'VARCHAR2', length: 30, isNullable: false, isPrimaryKey: false, isForeignKey: true, referencesTable: 'AUDIT_PLANNING', referencesColumn: 'PLAN_ID', label: 'Parent Audit Plan reference' },
      { name: 'REPORT_NO', type: 'VARCHAR2', length: 60, isNullable: false, isPrimaryKey: false, label: 'RINL Reference Letter No' },
      { name: 'TITLE', type: 'VARCHAR2', length: 200, isNullable: false, isPrimaryKey: false, label: 'Audit Report Subject' },
      { name: 'AUDIT_PERIOD_FROM', type: 'DATE', isNullable: false, isPrimaryKey: false, label: 'Start Coverage' },
      { name: 'AUDIT_PERIOD_TO', type: 'DATE', isNullable: false, isPrimaryKey: false, label: 'End Coverage' },
      { name: 'LEAD_AUDITOR', type: 'VARCHAR2', length: 100, isNullable: false, isPrimaryKey: false, label: 'Authoring Controller Inspector' },
      { name: 'DEPT_CODE', type: 'VARCHAR2', length: 20, isNullable: false, isPrimaryKey: false, isForeignKey: true, referencesTable: 'DEPARTMENT_MASTER', referencesColumn: 'DEPT_CODE', label: 'Audited Division Code' },
      { name: 'DATE_CREATED', type: 'DATE', isNullable: false, isPrimaryKey: false, label: 'Draught Date' },
      { name: 'DATE_SUBMITTED', type: 'DATE', isNullable: true, isPrimaryKey: false, label: 'Submission Date' },
      { name: 'STATUS', type: 'VARCHAR2', length: 20, isNullable: false, isPrimaryKey: false, defaultValue: 'Draft', label: 'Report Validation Tier' },
      { name: 'PARAS_COUNT', type: 'NUMBER', isNullable: false, isPrimaryKey: false, defaultValue: '0', label: 'Linked Observation Records count' },
      { name: 'ATTACHMENT_NAME', type: 'VARCHAR2', length: 250, isNullable: true, isPrimaryKey: false, label: 'Authorized Signed PDF / Scan attachment' }
    ]
  },
  {
    tableName: 'REPLY_ENTRY',
    description: 'Oracle-style online response memos logged by counter-signatory HODs.',
    columns: [
      { name: 'REPLY_ID', type: 'VARCHAR2', length: 30, isNullable: false, isPrimaryKey: true, label: 'System Response Tracking ID' },
      { name: 'DEPT_CODE', type: 'VARCHAR2', length: 20, isNullable: false, isPrimaryKey: false, isForeignKey: true, referencesTable: 'DEPARTMENT_MASTER', referencesColumn: 'DEPT_CODE', label: 'Replying department' },
      { name: 'AUDIT_PERIOD_FROM', type: 'DATE', isNullable: false, isPrimaryKey: false, label: 'Period Coverage From' },
      { name: 'AUDIT_PERIOD_TO', type: 'DATE', isNullable: false, isPrimaryKey: false, label: 'Period Coverage To' },
      { name: 'IOM_FROM', type: 'VARCHAR2', length: 100, isNullable: false, isPrimaryKey: false, label: 'IOM issuing officer' },
      { name: 'IOM_TO', type: 'VARCHAR2', length: 100, isNullable: false, isPrimaryKey: false, label: 'IOM addressing target GM' },
      { name: 'REF_NO', type: 'VARCHAR2', length: 100, isNullable: false, isPrimaryKey: false, label: 'Official Intranet Reference No' },
      { name: 'COPY_TO', type: 'VARCHAR2', length: 250, isNullable: true, isPrimaryKey: false, label: 'Copied Counterparts (CC)' },
      { name: 'IOM_DATE', type: 'DATE', isNullable: false, isPrimaryKey: false, label: 'IOM signed execution date' },
      { name: 'CREATION_DATE', type: 'DATE', isNullable: false, isPrimaryKey: false, label: 'Timestamp' }
    ]
  },
  {
    tableName: 'DISPATCH',
    description: 'DAK dispatch log records for physical and virtual files.',
    columns: [
      { name: 'DISPATCH_ID', type: 'VARCHAR2', length: 30, isNullable: false, isPrimaryKey: true, label: 'Dispatch Record ID' },
      { name: 'DISPATCH_NO', type: 'VARCHAR2', length: 60, isNullable: false, isPrimaryKey: false, label: 'Gov Outward Register No' },
      { name: 'DISPATCH_DATE', type: 'DATE', isNullable: false, isPrimaryKey: false, label: 'Outward Date' },
      { name: 'SUBJECT', type: 'VARCHAR2', length: 250, isNullable: false, isPrimaryKey: false, label: 'Brief Subject matter label' },
      { name: 'SENDER_DEPT', type: 'VARCHAR2', length: 50, isNullable: false, isPrimaryKey: false, label: 'Originator Office' },
      { name: 'RECEIVER_DEPT', type: 'VARCHAR2', length: 50, isNullable: false, isPrimaryKey: false, label: 'Recipient Corporate division' },
      { name: 'DAK_NO', type: 'VARCHAR2', length: 30, isNullable: false, isPrimaryKey: false, label: 'Intranet Secure DAK Code' },
      { name: 'MEDIUM', type: 'VARCHAR2', length: 35, isNullable: false, isPrimaryKey: false, label: 'Registered transit mode' },
      { name: 'STATUS', type: 'VARCHAR2', length: 30, isNullable: false, isPrimaryKey: false, defaultValue: 'Dispatched', label: 'Delivery Status Code' }
    ]
  },
  {
    tableName: 'AUDIT_PARAS',
    description: 'Specific audit queries, outstanding queries, monetary values, and replies.',
    columns: [
      { name: 'PARA_ID', type: 'VARCHAR2', length: 30, isNullable: false, isPrimaryKey: true, label: 'Para ID Reference' },
      { name: 'REPORT_ID', type: 'VARCHAR2', length: 30, isNullable: false, isPrimaryKey: false, isForeignKey: true, referencesTable: 'AUDIT_REPORTS_ENTRY', referencesColumn: 'REPORT_ID', label: 'Parent report number' },
      { name: 'PARA_NO', type: 'VARCHAR2', length: 25, isNullable: false, isPrimaryKey: false, label: 'Section Para code (e.g. 1.1)' },
      { name: 'TITLE', type: 'VARCHAR2', length: 220, isNullable: false, isPrimaryKey: false, label: 'Direct Observation title' },
      { name: 'CATEGORY', type: 'VARCHAR2', length: 25, isNullable: false, isPrimaryKey: false, label: 'Priority Severity categorization' },
      { name: 'DESCRIPTION', type: 'CLOB', isNullable: false, isPrimaryKey: false, label: 'Detailed Core Observation Description' },
      { name: 'FINANCIAL_IMPLICATION', type: 'NUMBER', isNullable: false, isPrimaryKey: false, defaultValue: '0', label: 'Loss Implication value (INR ₹)' },
      { name: 'STATUS', type: 'VARCHAR2', length: 20, isNullable: false, isPrimaryKey: false, defaultValue: 'Outstanding', label: 'Current Para state code' },
      { name: 'REPLY_CONTENT', type: 'CLOB', isNullable: true, isPrimaryKey: false, label: 'HOD Counter-justification statement' },
      { name: 'MARKED_EMP_ID', type: 'VARCHAR2', length: 30, isNullable: true, isPrimaryKey: false, isForeignKey: true, referencesTable: 'EMPLOYEE_MASTER', referencesColumn: 'EMP_ID', label: 'Officially Assigned Respondent' },
      { name: 'DAK_NO', type: 'VARCHAR2', length: 30, isNullable: true, isPrimaryKey: false, label: 'Associated DAK tracking barcode' }
    ]
  },
  {
    tableName: 'REVIEW_TRACKING',
    description: 'Review logs, correction history notes, and auditor evaluation comments.',
    columns: [
      { name: 'REVIEW_ID', type: 'VARCHAR2', length: 30, isNullable: false, isPrimaryKey: true, label: 'Audit Revision ID' },
      { name: 'PARA_ID', type: 'VARCHAR2', length: 30, isNullable: false, isPrimaryKey: false, isForeignKey: true, referencesTable: 'AUDIT_PARAS', referencesColumn: 'PARA_ID', label: 'Target Para section link' },
      { name: 'REVIEWER_ID', type: 'VARCHAR2', length: 30, isNullable: false, isPrimaryKey: false, label: 'Reviewer Office Ticket' },
      { name: 'COMMENTS', type: 'CLOB', isNullable: false, isPrimaryKey: false, label: 'Reviewer Evaluation feedback comment' },
      { name: 'ACTION_TAKEN', type: 'VARCHAR2', length: 1000, isNullable: true, isPrimaryKey: false, label: 'Remedial actions verified' },
      { name: 'STATUS_ASSIGNED', type: 'VARCHAR2', length: 20, isNullable: false, isPrimaryKey: false, label: 'Assigned status outcome' },
      { name: 'REVIEW_DATE', type: 'DATE', isNullable: false, isPrimaryKey: false, label: 'Review Timestamp' }
    ]
  },
  {
    tableName: 'UPLOAD_REPORTS',
    description: 'Secure attachments logs, document BLOB hash metadata storage, files list.',
    columns: [
      { name: 'UPLOAD_ID', type: 'VARCHAR2', length: 30, isNullable: false, isPrimaryKey: true, label: 'Attachment Hash ID' },
      { name: 'REPORT_ID', type: 'VARCHAR2', length: 30, isNullable: false, isPrimaryKey: false, label: 'Associated parent document code' },
      { name: 'FILE_NAME', type: 'VARCHAR2', length: 250, isNullable: false, isPrimaryKey: false, label: 'Physical document filename' },
      { name: 'FILE_TYPE', type: 'VARCHAR2', length: 60, isNullable: false, isPrimaryKey: false, label: 'Mime extension identifier (PDF/JPG)' },
      { name: 'FILE_SIZE', type: 'NUMBER', isNullable: false, isPrimaryKey: false, label: 'Size (Bytes)' },
      { name: 'FILE_DATA_BLOB', type: 'CLOB', isNullable: false, isPrimaryKey: false, label: 'Base64 Local Storage vault chunk' },
      { name: 'UPLOADED_BY', type: 'VARCHAR2', length: 50, isNullable: false, isPrimaryKey: false, label: 'Operator Username' },
      { name: 'UPLOAD_DATE', type: 'DATE', isNullable: false, isPrimaryKey: false, label: 'Operation timestamp' }
    ]
  },
  {
    tableName: 'ACTIVITY_LOGS',
    description: 'Internal security and Oracle audit logs tracker.',
    columns: [
      { name: 'LOG_ID', type: 'VARCHAR2', length: 30, isNullable: false, isPrimaryKey: true, label: 'Security Log Key' },
      { name: 'TIMESTAMP', type: 'DATE', isNullable: false, isPrimaryKey: false, label: 'Timestamp' },
      { name: 'USERNAME', type: 'VARCHAR2', length: 40, isNullable: false, isPrimaryKey: false, label: 'Intranet Operator Username' },
      { name: 'ROLE', type: 'VARCHAR2', length: 25, isNullable: false, isPrimaryKey: false, label: 'Access Tier' },
      { name: 'ACTION', type: 'VARCHAR2', length: 250, isNullable: false, isPrimaryKey: false, label: 'Activity transaction message' },
      { name: 'IP_ADDRESS', type: 'VARCHAR2', length: 50, isNullable: false, isPrimaryKey: false, label: 'System IP Address' }
    ]
  }
];
