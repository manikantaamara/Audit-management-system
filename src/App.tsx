import { useState, useEffect } from 'react';
import { 
  Calendar, FileText, Reply, Send, Database, BarChart2, BookOpen, 
  Settings, Landmark, ArrowRight, ShieldCheck, Activity, Users, FileSignature, Lock
} from 'lucide-react';

import { 
  User, AuditPlan, AuditReport, AuditPara, DispatchItem, 
  Employee, Department, AuditProgram, KnowledgeDocument, ActivityLog, UserRole, getRoleDisplayName
} from './types';

// Component imports
import Login from './components/Login';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import AuditPlanning from './components/AuditPlanning';
import QuarterlyDashboard from './components/QuarterlyDashboard';
import ReportEntry from './components/ReportEntry';
import ReplyEntryComponent from './components/ReplyEntryComponent';
import DispatchModule from './components/DispatchModule';
import MasterMaintenance from './components/MasterMaintenance';
import ReportsModule from './components/ReportsModule';
import KnowledgeDocs from './components/KnowledgeDocs';
import AimsSettings from './components/AimsSettings';
import AlliedAppsModule from './components/AlliedAppsModule';
import RightCalendarPanel from './components/RightCalendarPanel';
import ExcelImport from './components/ExcelImport';
import EnterpriseAIMSFormsContainer from './components/EnterpriseAIMSFormsContainer';
import SchedulePlanning from './components/SchedulePlanning';
import RoleAccessConsole from './components/RoleAccessConsole';
import PreviousAuditData from './components/PreviousAuditData';
import GeneratedAuditCalendar from './components/GeneratedAuditCalendar';
import WorkAssignmentBoard, { WorkAssignment, getAssignedRole } from './components/WorkAssignmentBoard';
import ReportPreviewGenerator from './components/ReportPreviewGenerator';
import ConversionHistory from './components/ConversionHistory';

const INITIAL_ASSIGNMENTS: WorkAssignment[] = [
  {
    id: 'WA-2026-001',
    assignTo: 'Team Lead',
    employeeId: '5',
    employeeName: 'Shri T.V. Satyanarayana',
    department: 'Materials',
    workTitle: 'Materials Supply Late Contract Liquidated Damages Audit',
    description: 'Verify if materials supplied after contract delivery dates were penalized with correct liquidating damages. Check particularly for late entries near quarter end cutoff.',
    priority: 'High',
    dueDate: '2026-06-25',
    estimatedDays: 14,
    remarksHOD: 'CVC Guideline Clause 4.2 check is essential.',
    status: 'Assigned',
    assignedDate: '2026-06-01',
    comments: [
      {
        author: 'Shri T.V. Satyanarayana',
        role: 'Team Lead',
        text: 'Acknowledge work order. Will coordinate with materials division for log files.',
        timestamp: '11:20 AM 02/06/2026'
      }
    ]
  },
  {
    id: 'WA-2026-002',
    assignTo: 'Auditor',
    employeeId: '2',
    employeeName: 'Smt. P. Lakshmi',
    department: 'Finance',
    workTitle: 'Audit High Value Procurement Limits Concurrency Check',
    description: 'Conduct comprehensive validation of high risk procurement limit approvals exceeding ₹50 Lakhs. Match board stamps with internal Oracle ledger.',
    priority: 'Critical',
    dueDate: '2026-06-15',
    estimatedDays: 7,
    remarksHOD: 'Urgent inspection requested by Ministry auditors in upcoming session.',
    status: 'In Progress',
    assignedDate: '2026-06-03',
    comments: [
      {
        author: 'Smt. P. Lakshmi',
        role: 'Auditor',
        text: 'Initiated audit checks. Physically comparing ledger entries with scan records.',
        timestamp: '4:15 PM 04/06/2026'
      }
    ]
  },
  {
    id: 'WA-2026-003',
    assignTo: 'Auditor',
    employeeId: '10',
    employeeName: 'Shri R. Kumar',
    department: 'Production',
    workTitle: 'Coke Ovens Blast Furnace Fuel Entry Log Inspection',
    description: 'Audit production fuel registers for coal and coke consumption. Track discrepancies in physical coke stocks vs digital Oracle ledger values.',
    priority: 'Medium',
    dueDate: '2026-06-30',
    estimatedDays: 10,
    remarksHOD: 'Random spot checks are required to satisfy external auditors.',
    status: 'Pending',
    assignedDate: '2026-06-05',
    comments: []
  }
];

export default function App() {
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [originalHODUser, setOriginalHODUser] = useState<User | null>(null);
  const [impersonationState, setImpersonationState] = useState<{
    originalUser: User;
    impersonatedRole: UserRole;
    impersonatedDept: string;
  } | null>(null);
  
  // Navigation states
  const [activeMenu, setActiveMenu] = useState<string>('dashboard');

  // Relational Database States
  const [plans, setPlans] = useState<AuditPlan[]>([]);
  const [reports, setReports] = useState<AuditReport[]>([]);
  const [paras, setParas] = useState<AuditPara[]>([]);
  const [dispatchItems, setDispatchItems] = useState<DispatchItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<AuditProgram[]>([]);
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDocument[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [currDepartmentIdFilter, setCurrDepartmentIdFilter] = useState<string | null>(null);

  // Dynamic Assignments & Notifications Hub
  const [assignments, setAssignments] = useState<WorkAssignment[]>(() => {
    const saved = localStorage.getItem('aims_work_assignments');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return INITIAL_ASSIGNMENTS;
  });

  const [customNotifications, setCustomNotifications] = useState<Array<{ id: string; text: string; time: string }>>(() => {
    const saved = localStorage.getItem('aims_custom_notifications');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return [
      { id: 'cn-init-1', text: 'New assignment board loaded under Permissions & Dashboard.', time: 'Just now' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('aims_work_assignments', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('aims_custom_notifications', JSON.stringify(customNotifications));
  }, [customNotifications]);

  const handleAddAssignment = (newAssignment: WorkAssignment) => {
    const assigned_role = getAssignedRole(newAssignment);
    const updatedAssignment = { ...newAssignment, assigned_role };
    setAssignments(prev => [updatedAssignment, ...prev]);
    const text = `New Work Assignment: ${newAssignment.id} - "${newAssignment.workTitle}" assigned to ${newAssignment.employeeName}.`;
    setCustomNotifications(prev => [{ id: `cn-${Date.now()}`, text, time: 'Just now', targetRole: assigned_role }, ...prev]);
  };

  const handleUpdateAssignmentStatus = (id: string, status: any, commentStr?: string) => {
    setAssignments(prev => prev.map(a => {
      if (a.id === id) {
        const comments = [...(a.comments || [])];
        if (commentStr) {
          comments.push({
            author: sessionUser ? sessionUser.name : 'System',
            role: sessionUser ? sessionUser.role : 'System',
            text: commentStr,
            timestamp: new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString()
          });
        }
        return { ...a, status, comments };
      }
      return a;
    }));

    const target = assignments.find(a => a.id === id);
    if (target) {
      const assigned_role = getAssignedRole(target);
      const text = `Assignment ${id} updated to ${status} status by ${sessionUser?.name || 'System'}.`;
      setCustomNotifications(prev => [{ id: `cn-${Date.now()}`, text, time: 'Just now', targetRole: assigned_role }, ...prev]);
    }
  };

  const handleUpdateAssignment = (updated: WorkAssignment) => {
    setAssignments(prev => prev.map(a => a.id === updated.id ? updated : a));
    const text = `Assignment ${updated.id} details edited and updated in master ledger by HOD.`;
    setCustomNotifications(prev => [{ id: `cn-${Date.now()}`, text, time: 'Just now' }, ...prev]);
  };

  const handleAddAssignmentComment = (assignmentId: string, textStr: string) => {
    setAssignments(prev => prev.map(a => {
      if (a.id === assignmentId) {
        const comments = [...(a.comments || [])];
        comments.push({
          author: sessionUser ? sessionUser.name : 'System',
          role: sessionUser ? sessionUser.role : 'System',
          text: textStr,
          timestamp: new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString()
        });
        return { ...a, comments };
      }
      return a;
    }));
  };

  // Fetch all state upon initialization
  const loadDatabaseState = async () => {
    try {
      const [plansRes, reportsRes, parasRes, dispRes, empRes, deptRes, progRes, knowRes, logRes] = await Promise.all([
        fetch('/api/plans').then(r => r.json()),
        fetch('/api/reports').then(r => r.json()),
        fetch('/api/paras').then(r => r.json()),
        fetch('/api/dispatch').then(r => r.json()),
        fetch('/api/employees').then(r => r.json()),
        fetch('/api/departments').then(r => r.json()),
        fetch('/api/programs').then(r => r.json()),
        fetch('/api/knowledge').then(r => r.json()),
        fetch('/api/logs').then(r => r.json()),
      ]);

      setPlans(plansRes);
      setReports(reportsRes);
      setParas(parasRes);
      setDispatchItems(dispRes);
      setEmployees(empRes);
      setDepartments(deptRes);
      setPrograms(progRes);
      setKnowledgeDocs(knowRes);
      setActivityLogs(logRes);
    } catch (err) {
      console.error("Failed to fetch state from AIMS relational db node:", err);
    }
  };

  useEffect(() => {
    loadDatabaseState();
    (window as any).AimsReloadState = loadDatabaseState;
    return () => {
      delete (window as any).AimsReloadState;
    };
  }, []);

  const handleLoginSuccess = (user: User, tokenStr: string) => {
    setSessionUser(user);
    setToken(tokenStr);
    setActiveMenu('dashboard');
    loadDatabaseState();
    if (user.role === 'HOD') {
      setOriginalHODUser(user);
    }
  };

  const handleLogout = () => {
    setSessionUser(null);
    setToken(null);
    setCurrDepartmentIdFilter(null);
    setActiveMenu('dashboard');
    setOriginalHODUser(null);
    setImpersonationState(null);
  };

  // Role Swap capabilities (Main Features 3B Check/Swap Role)
  const handleRoleSwap = (newRole: UserRole) => {
    if (!sessionUser) return;
    setCurrDepartmentIdFilter(null);
    
    let name = sessionUser.name;
    let department = sessionUser.department;
    let designation = sessionUser.designation;
    let username = sessionUser.username;
    let id = sessionUser.id;

    if (newRole === 'Auditor') {
      id = '2';
      username = 'auditor';
      name = 'Smt. P. Lakshmi';
      department = 'Internal Audit';
      designation = 'Senior Manager (Audit)';
    } else if (newRole === 'HOD') {
      id = '3';
      username = 'hod_finance';
      name = 'Shri A. Srinivasa Rao';
      department = 'Finance & Accounts';
      designation = 'DGM (F&A)';
    } else if (newRole === 'Reviewer') {
      id = '4';
      username = 'reviewer';
      name = 'Shri J.C. Bose';
      department = 'Audit Advisory Board';
      designation = 'Chief Audit Executive (CAE)';
    } else if (newRole === 'Team Lead') {
      id = '5';
      username = 'team_lead';
      name = 'Shri T.V. Satyanarayana';
      department = 'Internal Audit';
      designation = 'Assistant General Manager (AGM)';
    }

    const updatedUser: User = { 
      id, 
      username, 
      role: newRole, 
      name, 
      department, 
      designation 
    };
    setSessionUser(updatedUser);
    if (newRole === 'Team Lead' || newRole === 'Reviewer' || newRole === 'Auditor') {
      setActiveMenu('role_matrix_dashboard');
    } else {
      setActiveMenu('dashboard');
    }
    
    // Log role swap activity
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: username, 
        role: newRole, 
        action: `Swapped role representation to ${newRole} (Active profile: ${name})` 
      })
    }).then(() => loadDatabaseState());
  };

  const handleImpersonate = (newRole: UserRole, departmentId: string) => {
    if (!sessionUser) return;

    // Cache HOD user if switching from HOD
    let baseHOD = originalHODUser;
    if (!baseHOD) {
      if (sessionUser.role === 'HOD') {
        baseHOD = sessionUser;
        setOriginalHODUser(sessionUser);
      } else {
        console.error("Non-HOD users cannot initialize impersonated views.");
        return;
      }
    }

    setImpersonationState({
      originalUser: baseHOD,
      impersonatedRole: newRole,
      impersonatedDept: departmentId
    });

    handleRoleDepartmentRedirect(newRole, departmentId);
  };

  const handleRestoreHOD = () => {
    const backupHOD = originalHODUser || (impersonationState ? impersonationState.originalUser : null);
    if (!backupHOD) return;

    setSessionUser(backupHOD);
    setCurrDepartmentIdFilter(null);
    setImpersonationState(null);
    setActiveMenu('dashboard');
    setOriginalHODUser(backupHOD); // Keep HOD profile referenced

    // Audit log restoration
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: backupHOD.username,
        role: 'HOD',
        action: `HOD restored session, exiting impersonation mode`
      })
    }).then(() => loadDatabaseState());
  };

  const handleRoleDepartmentRedirect = (newRole: UserRole, departmentId: string) => {
    if (!sessionUser) return;
    
    // 1. Update the filter state
    setCurrDepartmentIdFilter(departmentId);

    // 2. Map department ID to professional name 
    let mappedDept = `Dept #${departmentId}`;
    const cleanId = departmentId.trim();
    if (cleanId.endsWith('02') || cleanId.includes('102')) mappedDept = 'Purchase (Raw Materials)';
    else if (cleanId.endsWith('05') || cleanId.includes('105')) mappedDept = 'Coke Ovens Division';
    else if (cleanId.endsWith('06') || cleanId.includes('106')) mappedDept = 'Steel Melting Shop';
    else if (cleanId.endsWith('08') || cleanId.includes('108')) mappedDept = 'Finance & Accounts';
    else if (cleanId.endsWith('09') || cleanId.includes('109')) mappedDept = 'Blast Furnace Dept';
    else mappedDept = 'Coke Ovens Division';

    // 3. Formulate user profile swapping data
    let name = sessionUser.name;
    let username = sessionUser.username;
    let designation = sessionUser.designation;
    let id = sessionUser.id;

    if (newRole === 'Auditor') {
      id = '2';
      username = 'auditor';
      name = 'Smt. P. Lakshmi';
      designation = 'Senior Manager (Audit)';
    } else if (newRole === 'Reviewer') {
      id = '5';
      username = 'reviewer';
      name = 'Shri J.C. Bose';
      designation = 'Chief Audit Executive (CAE)';
    } else if (newRole === 'Team Lead') {
      id = '1';
      username = 'team_lead';
      name = 'Shri T.V. Satyanarayana';
      designation = 'Assistant General Manager (AGM)';
    }

    setSessionUser({
      id,
      username,
      role: newRole,
      name,
      department: mappedDept,
      designation
    });

    // 4. Set active menu to Role Matrix Dashboard so they arrive at the redirected view
    setActiveMenu('role_matrix_dashboard');

    // 5. Audit log penetration activity
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: sessionUser.username,
        role: sessionUser.role,
        action: `HOD penetrated to role ${newRole} for Department ID #${departmentId} (${mappedDept})`
      })
    }).then(() => loadDatabaseState());
  };

  // --- POST / PUT MUTATION WRAPPERS ---

  const handleCreatePlan = async (plan: Partial<AuditPlan>) => {
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan)
      });
      if (res.ok) loadDatabaseState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePlan = async (id: string, updates: Partial<AuditPlan>) => {
    try {
      const res = await fetch(`/api/plans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) loadDatabaseState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateReport = async (report: Partial<AuditReport>) => {
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
      if (res.ok) loadDatabaseState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateReport = async (id: string, updates: Partial<AuditReport>) => {
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) loadDatabaseState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePara = async (para: Partial<AuditPara>) => {
    try {
      const res = await fetch('/api/paras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(para)
      });
      if (res.ok) loadDatabaseState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePara = async (id: string, updates: Partial<AuditPara>) => {
    try {
      const res = await fetch(`/api/paras/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) loadDatabaseState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateDispatch = async (disp: Partial<DispatchItem>) => {
    try {
      const res = await fetch('/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(disp)
      });
      if (res.ok) loadDatabaseState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateDispatch = async (id: string, updates: Partial<DispatchItem>) => {
    try {
      const res = await fetch(`/api/dispatch/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) loadDatabaseState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateDepartment = async (dept: Partial<Department>) => {
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dept)
      });
      if (res.ok) loadDatabaseState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateEmployee = async (emp: Partial<Employee>) => {
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emp)
      });
      if (res.ok) loadDatabaseState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProgram = async (prog: Partial<AuditProgram>) => {
    try {
      const res = await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prog)
      });
      if (res.ok) loadDatabaseState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadDoc = async (doc: Partial<KnowledgeDocument>) => {
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc)
      });
      if (res.ok) loadDatabaseState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddUser = async (user: Partial<User>) => {
    // Basic mock addition
    const newUser = {
      ...user,
      id: `USR-${Math.floor(100 + Math.random() * 900)}`
    };
    alert('Mocking secure user provision command. Refresh active sign-on cache.');
    // We append locally or we could save. We'll simply append locally so it updates immediately.
    // In production we save this in relational system
    loadDatabaseState();
  };

  // Compute department-filtered subsets when a target filter id is provided
  const getFilteredData = () => {
    if (!currDepartmentIdFilter) {
      return { 
        filteredPlans: plans, 
        filteredReports: reports, 
        filteredParas: paras 
      };
    }
    const id = currDepartmentIdFilter.trim();
    const deptKeyword = (() => {
      if (id.endsWith('02') || id.includes('102')) return 'purchase';
      if (id.endsWith('05') || id.includes('105')) return 'coke ovens';
      if (id.endsWith('06') || id.includes('106')) return 'steel melting';
      if (id.endsWith('08') || id.includes('108')) return 'finance';
      if (id.endsWith('09') || id.includes('109')) return 'blast furnace';
      return '';
    })();

    const filteredPlans = plans.filter(p => {
      const deptStr = p.department.toLowerCase();
      const codeStr = (p.deptCode || '').toLowerCase();
      const codePart = id.substring(Math.max(0, id.length - 3));
      
      return (
        (deptKeyword && deptStr.includes(deptKeyword)) ||
        deptStr.includes(id) ||
        codeStr.includes(id) ||
        (codePart && codeStr.includes(codePart))
      );
    });
    
    const filteredReports = reports.filter(r => {
      const deptStr = r.department.toLowerCase();
      const codeStr = (r.deptCode || r.department || '').toLowerCase();
      const codePart = id.substring(Math.max(0, id.length - 3));

      return (
        (deptKeyword && deptStr.includes(deptKeyword)) ||
        deptStr.includes(id) ||
        codeStr.includes(id) ||
        (codePart && codeStr.includes(codePart))
      );
    });

    const filteredParas = paras.filter(p => {
      const parentReport = reports.find(r => r.id === p.reportId);
      if (parentReport) {
        const deptStr = parentReport.department.toLowerCase();
        const codeStr = (parentReport.deptCode || parentReport.department || '').toLowerCase();
        const codePart = id.substring(Math.max(0, id.length - 3));

        return (
          (deptKeyword && deptStr.includes(deptKeyword)) ||
          deptStr.includes(id) ||
          codeStr.includes(id) ||
          (codePart && codeStr.includes(codePart))
        );
      }
      return true;
    });

    return { filteredPlans, filteredReports, filteredParas };
  };

  const { filteredPlans, filteredReports, filteredParas } = getFilteredData();

  // If not authenticated, force the Gov Sign-On page layout
  if (!sessionUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }  // CENTRAL ROUTING VIEW CONTROLLER
  const renderCentralModuleView = () => {
    // Role-based Access Control Guard Block
    const role = sessionUser?.role || 'HOD';

    // Premium Menu Access Security Check (Matches exact new permission architecture)
    const isMenuAuthorized = (menu: string, activeRole: string): boolean => {
      const freePass = [
        'role_matrix_dashboard', 'work_assignment_board', 'report_preview_pdf', 'conversion_history',
        'dashboard', 'settings_page', 'allied_apps_hub'
      ];
      if (freePass.includes(menu)) return true;

      // Auditor HOD holds supreme access across ALL menus
      if (activeRole === 'HOD') return true;

      // Team Lead
      if (activeRole === 'Team Lead') {
        const forbiddenForTL = [
          'dispatch_tracking', 'dispatch_status', 'code_master', 'programs_master', 'employee_master', 'department_master', 'dak_initializer', 'excel_import'
        ];
        if (forbiddenForTL.includes(menu)) return false;
        return true;
      }

      // Department HOD (Reviewer - Can View, Create, Edit, Assign. Cannot Review, Verify, Approve, or Close)
      if (activeRole === 'Reviewer') {
        const forbiddenForReviewer = [
          'rev_report_review', 'rev_evidence_verify', 'rev_remarks_entry', 'rev_correction_requests', 'rev_re_review', 'rev_history', 'rev_knowledge', 'rev_reports_comp',
          'dispatch_tracking', 'dispatch_status', 'code_master', 'programs_master', 'employee_master', 'department_master', 'dak_initializer', 'excel_import'
        ];
        if (forbiddenForReviewer.includes(menu)) return false;
        return true;
      }

      // Auditor (Can only View and participate in Review. Cannot Create, Edit, Assign, Verify, Approve, or Close)
      if (activeRole === 'Auditor') {
        const allowedForAuditor = [
          'yearly_planning', 'schedule_planning', 'tour_proposals', 'generated_audit_calendar',
          'aud_assigned_audits', 'aud_execution', 'aud_status_tracking',
          'aud_report_entry', 'aud_reply_entry', 'aud_rework_requests',
          'aud_upload_evidence', 'aud_upload_docs', 'reply_details', 'reply_marking', 'reply_remarking', 'audits_list'
        ];
        return allowedForAuditor.includes(menu);
      }

      return false;
    };

    if (!isMenuAuthorized(activeMenu, role)) {
      return (
        <div className="bg-red-50 border-2 border-red-500 rounded-sm p-6 space-y-4 animate-fade-in text-red-950 my-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Lock className="w-8 h-8 text-red-700 animate-bounce" />
            <div>
              <h3 className="text-base font-black uppercase font-mono tracking-wide">WORKFLOW SECURITY WARNING (GATEWAY VALIDATION BLOCK)</h3>
              <p className="text-xs font-semibold text-red-800">Your currently selected role perspective ({getRoleDisplayName(role as any)}) is NOT authorized to access the requested task workspace.</p>
            </div>
          </div>
          <div className="text-xs bg-white border border-red-200 p-4 rounded font-mono space-y-2">
            <p className="font-bold uppercase text-red-900 border-b pb-1">Validation Audit Trail logs:</p>
            <p>&bull; TIMESTAMP: {new Date().toISOString()}</p>
            <p>&bull; BLOCK_EVENT_ID: EVT-{Math.floor(Math.random() * 89999 + 10000)}</p>
            <p>&bull; ATTEMPTED_WORKSPACE: {activeMenu.toUpperCase()}</p>
            <p>&bull; AUTH_ROLE_LEVEL: {role.replace(' ', '_').toUpperCase()}</p>
            <p>&bull; CORE_VERDICT: DENIED_BY_WORKFLOW_ENGINEER_RULE</p>
          </div>
          <p className="text-xs text-slate-500 italic font-medium">This session access was intercepted and safely constrained according to the updated Auditor Action Center guidelines.</p>
          <button
            onClick={() => setActiveMenu('role_matrix_dashboard')}
            className="bg-red-900 hover:bg-neutral-900 border border-red-950 font-mono text-white text-[10.5px] font-bold py-2.5 px-6 rounded-xs uppercase tracking-wide cursor-pointer shadow-sm transition-all"
          >
            ← Returns safely to Active Dashboard Matrix
          </button>
        </div>
      );
    }

    switch (activeMenu) {
      case 'dashboard':
        return (
          <QuarterlyDashboard 
            plans={filteredPlans} 
            reports={filteredReports} 
            paras={filteredParas} 
            currentUser={sessionUser}
            onSelectMenu={(menu) => setActiveMenu(menu)} 
            onUpdatePara={handleUpdatePara}
            onUpdatePlan={handleUpdatePlan}
            onRoleDepartmentRedirect={handleRoleDepartmentRedirect}
            assignments={assignments}
            onUpdateAssignmentStatus={handleUpdateAssignmentStatus}
          />
        );

      case 'deprecated_old_dashboard':
        return (
          <div id="aims-dashboard-home" className="p-6 space-y-6 font-sans">
            
            {/* Quick Metrics Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-slate-300 p-5 rounded-sm shadow-sm gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2.5 rounded text-blue-900 border border-blue-200">
                  <Landmark className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {sessionUser.name.toLowerCase().includes('saiy') ? 'welcome dr.n.v .Saiy' : `Welcome, ${sessionUser.name}`}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">Logged in with <span className="text-blue-900 font-bold uppercase">{sessionUser.role}</span> credentials | Internal Audit Division Node Gateway No. 18</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button 
                  id="dashboard-quick-btn-plan"
                  onClick={() => setActiveMenu('annual_plans')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 text-xs rounded border border-slate-305 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Annual Plan
                </button>
                <button 
                  id="dashboard-quick-btn-entry"
                  onClick={() => setActiveMenu('report_entry')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 text-xs rounded border border-slate-305 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Reports Entry
                </button>
                <button 
                  id="dashboard-quick-btn-reply"
                  onClick={() => setActiveMenu('reply_details')}
                  className="bg-slate-105 bg-slate-100 hover:bg-slate-205 hover:bg-slate-200 text-slate-805 text-slate-800 font-bold px-3 py-1.5 text-xs rounded border border-slate-305 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Reply className="w-3.5 h-3.5 text-slate-505 text-slate-500" />
                  Reply Entry
                </button>
              </div>
            </div>

            {/* Oracle ERP Stats summary cards block */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Active Audit Plans Progress */}
              <div className="bg-white border border-slate-300 rounded-sm shadow-xs p-5 space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-blue-900" />
                    YEARLY PLANS PROGRESSION
                  </span>
                  <span className="bg-blue-50 text-blue-900 text-[10px] font-bold px-2 py-0.5 rounded font-mono">2026-27</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Approved Plans:</span>
                    <span className="font-bold text-slate-800">{plans.filter(p => p.status === 'Approved').length} Plans</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Draft Scheduling:</span>
                    <span className="font-bold text-slate-800">{plans.filter(p => p.status === 'Draft').length} Drafts</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-900" 
                      style={{ width: `${(plans.filter(p => p.status === 'Approved').length / plans.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono italic block">Oracle status code: PLN_PROGRESS_OK</span>
                </div>
              </div>

              {/* Card 2: Risk and Paras Indicators */}
              <div className="bg-white border border-slate-300 rounded-sm shadow-xs p-5 space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileSignature className="w-4 h-4 text-amber-600" />
                    PARAS CONCURRENCY SUMMARY
                  </span>
                  <span className="bg-amber-50 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded font-mono">REALTIME</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Outstanding Paras:</span>
                    <span className="font-bold text-slate-800">{paras.filter(p => p.status !== 'Settled').length} outstanding</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Resolved/Settled:</span>
                    <span className="font-bold text-green-700">{paras.filter(p => p.status === 'Settled').length} Cleared</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Implication Values:</span>
                    <span className="font-bold text-slate-800 font-mono">₹{(paras.reduce((s, p) => s + p.financialImplication, 0) / 100000).toFixed(1)} Lakhs</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Registry and Dispatch Stats */}
              <div className="bg-white border border-slate-300 rounded-sm shadow-xs p-5 space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-purple-700" />
                    MAILS & RESIDENT CONTACTS
                  </span>
                  <span className="bg-purple-50 text-purple-900 text-[10px] font-bold px-2 py-0.5 rounded font-mono">GATEWAY</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Registered Employees:</span>
                    <span className="font-bold text-slate-800">{employees.length} Personnel</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Dispatch Track Items:</span>
                    <span className="font-bold text-slate-800">{dispatchItems.length} Enout Mails</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pending Deliveries:</span>
                    <span className="font-bold text-purple-800">{dispatchItems.filter(i => i.status === 'Dispatched').length} Active</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Central Panel section: Audit Workflow Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left & Middle: Recent Audits and quick tables */}
              <div className="lg:col-span-2 bg-white border border-slate-300 rounded-sm shadow-sm">
                <div className="bg-slate-105 bg-slate-100 p-4 border-b flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-850 uppercase tracking-wider block">PENDING CORRECTION AUDIT REPORTS</span>
                </div>

                <div className="p-4 overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] tracking-wider uppercase text-slate-705 text-slate-600 font-bold">
                        <th className="p-2.5">Report No</th>
                        <th className="p-2.5">Facility / Section</th>
                        <th className="p-2.5">Audit Report Subject</th>
                        <th className="p-2.5 font-bold text-center">Active Paras</th>
                        <th className="p-2.5 text-right">Action Gate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 text-slate-800">
                      {reports.map((rep) => (
                        <tr id={`dashboard-report-row-${rep.id}`} key={rep.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono font-bold text-blue-900">
                            <span className="bg-blue-100/50 px-1.5 py-0.5 rounded text-[10px]">{rep.reportNo}</span>
                          </td>
                          <td className="p-2.5 text-slate-600 font-semibold text-[11px]">{rep.department}</td>
                          <td className="p-2.5">
                            <p className="font-bold text-slate-900 text-xs">{rep.title}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Voucher: {rep.id} &bull; Created: {rep.dateCreated}</p>
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold text-rose-800">
                            {rep.parasCount} Findings
                          </td>
                          <td className="p-2.5 text-right whitespace-nowrap">
                            <button
                              id={`dash-view-rep-btn-${rep.id}`}
                              onClick={() => setActiveMenu('report_entry')}
                              className="text-[11px] font-bold text-blue-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              Enter / Review Para
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Sidebar: Quick Intranet Activity Logger */}
              <div className="lg:col-span-1 bg-white border border-slate-300 rounded-sm shadow-sm flex flex-col justify-between">
                <div className="bg-slate-100 p-4 border-b">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">SECURE ACTIVITY WATCHDOG LOGGER</span>
                </div>

                <div className="p-4 flex-1 overflow-y-auto max-h-80 space-y-3 text-[11px] font-mono">
                  {activityLogs.slice(0, 5).map(log => (
                    <div key={log.id} className="border-b border-dashed pb-2 space-y-0.5">
                      <div className="flex justify-between font-bold text-slate-700">
                        <span>@{log.username} ({log.role})</span>
                        <span className="text-slate-455 text-slate-405">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-805 text-slate-800 mt-0.5">{log.action}</p>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-slate-50 border-t text-center">
                  <button
                    id="dash-expand-logs-btn"
                    onClick={() => setActiveMenu('settings_page')}
                    className="text-[11px] font-bold text-blue-800 hover:underline"
                  >
                    View All Oracle Transaction Logs
                  </button>
                </div>
              </div>

            </div>

          </div>
        );

      case 'annual_plans':
      case 'yearly_planning':
      case 'tour_proposals':
        return (
          <AuditPlanning 
            plans={plans} 
            onCreatePlan={handleCreatePlan} 
            onUpdatePlan={handleUpdatePlan} 
            currentUser={sessionUser}
            activeMenu={activeMenu}
          />
        );

      case 'schedule_planning':
        return (
          <SchedulePlanning 
            userRole={sessionUser.role}
            userName={sessionUser.name}
          />
        );

      case 'previous_audit_data':
        return (
          <PreviousAuditData />
        );

      case 'generated_audit_calendar':
        return (
          <GeneratedAuditCalendar />
        );

      case 'report_entry':
      case 'review_entry':
      case 'category_change':
      case 'report_generator':
      case 'transaction_audit':
      case 'upload_jpg_word_pdf':
      case 'ai_document_ingestion':
      case 'pending_reports':
      case 'status_transfer':
      case 'show_reports_status':
      case 'check_swap_role':
        return (
          <ReportEntry 
            reports={reports} 
            paras={paras} 
            plans={plans}
            onCreateReport={handleCreateReport} 
            onUpdateReport={handleUpdateReport} 
            onCreatePara={handleCreatePara} 
            onUpdatePara={handleUpdatePara} 
            currentUser={sessionUser || { id: '', username: '', name: 'Guest', role: 'HOD' }}
            onChangeRole={handleRoleSwap}
            activeMenu={activeMenu}
          />
        );

      case 'reply_details':
      case 'reply_marking':
      case 'reply_remarking':
      case 'audits_list':
        return (
          <ReplyEntryComponent 
            paras={paras} 
            reports={reports} 
            employees={employees}
            onUpdatePara={handleUpdatePara} 
            currentUser={sessionUser || { id: '', username: '', name: 'Guest', role: 'HOD', department: 'Coke Ovens' }}
            activeMenu={activeMenu}
          />
        );

      case 'report_preview_pdf':
        return (
          <ReportPreviewGenerator 
            currentUser={sessionUser}
          />
        );

      case 'conversion_history':
        return (
          <ConversionHistory 
            currentUser={sessionUser}
            onSelectMenu={(menu) => setActiveMenu(menu)}
          />
        );

      case 'dispatch_tracking':
      case 'dispatch_status':
        return (
          <DispatchModule 
            dispatchItems={dispatchItems} 
            onCreateDispatch={handleCreateDispatch} 
            onUpdateDispatch={handleUpdateDispatch} 
          />
        );

      case 'code_master':
      case 'department_master':
      case 'employee_master':
      case 'programs_master':
      case 'dak_initializer':
        return (
          <MasterMaintenance 
            departments={departments} 
            employees={employees} 
            programs={programs}
            onCreateDepartment={handleCreateDepartment}
            onCreateEmployee={handleCreateEmployee}
            onCreateProgram={handleCreateProgram}
            activeMenu={activeMenu}
          />
        );

      case 'excel_import':
        return (
          <ExcelImport 
            onSuccess={loadDatabaseState} 
          />
        );

      case 'para_history':
      case 'para_history_dir':
      case 'paras_listing':
      case 'pending_paras_listing':
      case 'dir_pending_summary':
      case 'dir_settled_memo':
      case 'pending_paras_detail':
      case 'dir_paras_period':
      case 'exception_dates':
      case 'reports_pending':
      case 'reviews_pending':
      case 'audit_prog_master':
        return (
          <ReportsModule 
            paras={filteredParas} 
            reports={filteredReports} 
            departments={departments} 
            activeMenu={activeMenu}
          />
        );

      case 'circulars':
      case 'policies':
      case 'guidelines':
      case 'sops':
        return (
          <KnowledgeDocs 
            documents={knowledgeDocs} 
            onUploadDoc={handleUploadDoc} 
            activeMenu={activeMenu}
          />
        );

      case 'app_aime_3_tier':
      case 'app_attendance':
      case 'app_assets':
      case 'app_qms':
      case 'app_oasis':
      case 'app_health':
      case 'app_bills':
      case 'app_quality_circles':
        return (
          <AlliedAppsModule 
            appKey={activeMenu}
            currentUser={sessionUser || { id: '', username: '', name: 'Guest', role: 'HOD', department: 'Coke Ovens' }}
          />
        );

      case 'work_assignment_board':
        return (
          <WorkAssignmentBoard 
            currentUser={sessionUser}
            onSelectMenu={(menu) => setActiveMenu(menu)}
            employees={employees}
            assignments={assignments}
            onAddAssignment={handleAddAssignment}
            onUpdateAssignmentStatus={handleUpdateAssignmentStatus}
            onUpdateAssignment={handleUpdateAssignment}
            onAddComment={handleAddAssignmentComment}
          />
        );

      case 'settings_page':
        return (
          <AimsSettings 
            currentUser={sessionUser} 
            users={[
              { id: '1', username: 'team_lead', role: 'Team Lead', name: 'Shri T.V. Satyanarayana', department: 'Internal Audit', designation: 'Assistant General Manager (AGM)' },
              { id: '2', username: 'auditor', role: 'Auditor', name: 'Smt. P. Lakshmi', department: 'Internal Audit', designation: 'Senior Manager (Audit)' },
              { id: '3', username: 'hod_finance', role: 'HOD', name: 'Shri A. Srinivasa Rao', department: 'Finance & Accounts', designation: 'DGM (F&A)' },
              { id: '4', username: 'reviewer', role: 'Reviewer', name: 'Shri J.C. Bose', department: 'Audit Advisory Board', designation: 'Chief Audit Executive (CAE)' },
            ]} 
            onAddUser={handleAddUser}
          />
        );

      case 'role_matrix_dashboard':
      // Team Lead Menu Cases:
      case 'tl_audit_assignment':
      case 'tl_team_workload':
      case 'tl_team_perf':
      case 'tl_audit_monitoring':
      case 'tl_status_tracking':
      case 'tl_pending_audits':
      case 'tl_report_entry':
      case 'tl_verify_reports':
      case 'tl_pending_reviews':
      case 'tl_dispatch_tracking':
      case 'tl_knowledge_bank':
      case 'tl_reports_analytics':
      // Reviewer Menu Cases:
      case 'rev_dashboard':
      case 'rev_pending_alerts':
      case 'rev_report_review':
      case 'rev_entry':
      case 'rev_evidence_verify':
      case 'rev_remarks_entry':
      case 'rev_report_entry':
      case 'rev_correction_requests':
      case 'rev_re_review':
      case 'rev_history':
      case 'rev_knowledge':
      case 'rev_reports_comp':
      // Auditor Menu Cases:
      case 'aud_assigned_audits':
      case 'aud_execution':
      case 'aud_status_tracking':
      case 'aud_report_entry':
      case 'aud_reply_entry':
      case 'aud_rework_requests':
      case 'aud_upload_evidence':
      case 'aud_upload_docs':
      case 'aud_history':
      case 'aud_knowledge':
        return (
          <EnterpriseAIMSFormsContainer
            reports={filteredReports}
            paras={filteredParas}
            plans={filteredPlans}
            currentUser={sessionUser}
            activeMenu={activeMenu}
            onSelectMenu={(menu) => setActiveMenu(menu)}
            onUpdatePara={handleUpdatePara}
            onUpdateReport={handleUpdateReport}
            onUpdatePlan={handleUpdatePlan}
            onCreatePara={handleCreatePara}
            onCreateReport={handleCreateReport}
          />
        );

      default:
        return <div className="p-6 text-xs text-slate-500 italic font-mono">NODE CASE NOT BINDED: {activeMenu}</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-900 selection:text-white pt-[58px]">
      
      {/* Global Header */}
      <Header 
        currentUser={sessionUser} 
        onLogout={handleLogout} 
        onChangeRole={handleRoleSwap} 
        customNotifications={customNotifications}
      />

      <div className="flex-1 flex overflow-hidden">
        
        {/* Navigation Sidebar */}
        <Sidebar 
          activeMenu={activeMenu} 
          onSelectMenu={(menu) => setActiveMenu(menu)} 
          userRole={sessionUser.role} 
        />

        {/* Central Workspace Container */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          
          {/* Global Breadcrumb for high fidelity Oracle systems */}
          <div className="bg-slate-100 border-b border-slate-205 border-slate-200 px-6 py-2 flex items-center justify-between text-[11px] font-sans font-semibold text-slate-650 text-slate-600">
            <div className="flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-blue-900" />
              <span>AIMS GATEWAY</span>
              <span>&bull;</span>
              <span className="uppercase text-blue-900 font-bold">{activeMenu.replace('_', ' ')}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="bg-green-105 bg-green-50 text-green-805 text-green-800 border-green-205 border border-green-200 text-[10px] font-bold font-mono px-2 py-0.5 rounded">
                SECURE SSL COUPLING: AES_256_GCM
              </span>
              <button 
                id="header-shortcut-settings"
                onClick={() => setActiveMenu('settings_page')}
                className="hover:text-blue-900 cursor-pointer"
                title="Open system configuration settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {currDepartmentIdFilter && (
            <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-2.5 flex items-center justify-between text-[11px] font-bold text-amber-900 shadow-xs leading-relaxed" id="penetration-notice-banner">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span>
                  <strong>ROLE PENETRATION STATUS:</strong> Acting on behalf of target Department <strong>ID #{currDepartmentIdFilter}</strong> ({
                    (() => {
                      const cleanId = currDepartmentIdFilter.trim();
                      if (cleanId.endsWith('02') || cleanId.includes('102')) return 'Purchase (Raw Materials)';
                      if (cleanId.endsWith('05') || cleanId.includes('105')) return 'Coke Ovens Division';
                      if (cleanId.endsWith('06') || cleanId.includes('106')) return 'Steel Melting Shop';
                      if (cleanId.endsWith('08') || cleanId.includes('108')) return 'Finance & Accounts';
                      if (cleanId.endsWith('09') || cleanId.includes('109')) return 'Blast Furnace Dept';
                      return 'Coke Ovens Division';
                    })()
                  }). Restricted dashboard registers and analytics loaded securely.
                </span>
              </div>
              <button
                onClick={() => {
                  setCurrDepartmentIdFilter(null);
                }}
                className="bg-yellow-200 hover:bg-yellow-300 text-amber-950 font-bold px-2 py-0.5 rounded text-[9px] uppercase border border-yellow-300 shadow-sm transition-all cursor-pointer shrink-0"
              >
                Clear Filter
              </button>
            </div>
          )}

          <div className="max-w-7xl mx-auto w-full">
            {renderCentralModuleView()}
          </div>
          
        </main>

        {/* Right Collapsible Role Access Console for HOD / Impersonation sessions */}
        {(sessionUser.role === 'HOD' || originalHODUser !== null || impersonationState !== null) && (
          <RoleAccessConsole 
            currentUser={sessionUser}
            onImpersonate={handleImpersonate}
            onRestoreHOD={handleRestoreHOD}
            isCurrentlyImpersonating={impersonationState !== null}
            impersonationState={impersonationState}
          />
        )}

        {/* Right Collapsible Executive Calendar Panel */}
        <RightCalendarPanel 
          plans={plans}
          reports={reports}
          paras={paras}
          onUpdatePlan={handleUpdatePlan}
        />

      </div>

    </div>
  );
}
