export type UserRole = 'Auditor' | 'HOD' | 'Reviewer' | 'Team Lead';

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  'HOD': 'Auditor HOD',
  'Team Lead': 'Team Lead',
  'Reviewer': 'Department HOD',
  'Auditor': 'Auditor'
};

export function getRoleDisplayName(role: string): string {
  if (role === 'HOD') return 'Auditor HOD';
  if (role === 'Reviewer') return 'Department HOD';
  if (role === 'Team Lead') return 'Team Lead';
  if (role === 'Auditor') return 'Auditor';
  return role;
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  department: string;
  designation: string;
}

export interface AuditPlan {
  id: string;
  title: string;
  financialYear?: string;
  quarter: string;
  auditType: 'Internal' | 'External' | 'Compliance' | 'Operational' | string;
  department: string;
  plannedMonths: string[];
  teamLead: string;
  leadAuditor: string;
  teamMembers?: string;
  objectives?: string;
  scope?: string;
  riskLevel?: 'Low' | 'Medium' | 'High' | string;
  remarks?: string;
  startDate?: string;
  endDate?: string;
  auditPeriod?: 'Quarterly' | 'Yearly' | string;
  reviewWindowStart?: string;
  reviewWindowEnd?: string;
  tourProposalUrl?: string;
  status: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled' | string;
  createdAt: string;
}

export interface AuditPara {
  id: string;
  reportId: string;
  paraNo: string;
  title: string;
  category: 'Critical' | 'Major' | 'Minor';
  description: string;
  financialImplication: number;
  status: 'Outstanding' | 'Under Review' | 'Settled';
  replyContent?: string;
  markedToEmployeeId?: string;
  dakNo?: string;
}

export interface AuditReport {
  id: string;
  planId: string;
  reportNo: string;
  title: string;
  auditPeriod: string;
  leadAuditor: string;
  department: string;
  dateCreated: string;
  dateSubmitted?: string;
  status: 'Draft' | 'Under_Review' | 'Authorized';
  parasCount: number;
  attachmentName?: string;
}

export interface DispatchItem {
  id: string;
  dispatchNo: string;
  date: string;
  subject: string;
  senderDept: string;
  receiverDept: string;
  dakNo: string;
  medium: 'Hand Delivered' | 'Registered Post' | 'Intranet Email';
  status: 'Dispatched' | 'Acknowledged';
}

export interface Employee {
  id: string;
  empNo: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  active: boolean;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  headName: string;
  contactNo: string;
}

export interface AuditProgram {
  id: string;
  code: string;
  name: string;
  scopeOfAudit: string;
  applicableGuidelines: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  docType: 'Circular' | 'Guideline' | 'Policy' | 'SOP';
  releaseDate: string;
  referenceNo: string;
  fileSize: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  username: string;
  role: string;
  action: string;
  ipAddress: string;
}
