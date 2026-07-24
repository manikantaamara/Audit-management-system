import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Search, FileText, CheckCircle, Clock, AlertTriangle, 
  Trash2, Edit, ChevronDown, Check, UserPlus, Paperclip, X, Eye, 
  MessageSquare, Send, RefreshCw, BarChart2, ShieldAlert, Award
} from 'lucide-react';
import { User, Employee, UserRole, getRoleDisplayName } from '../types';

export interface WorkAssignment {
  id: string;
  assignTo: 'Auditor' | 'Team Lead' | 'Audit Team' | 'Reviewer';
  assigned_role?: 'Auditor' | 'Reviewer' | 'Team Leader' | 'Team Lead';
  employeeId: string;
  employeeName: string;
  department: string;
  workTitle: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate: string;
  estimatedDays: number;
  remarksHOD?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Rejected' | 'Under Review' | string;
  assignedDate: string;
  attachmentName?: string;
  comments?: Array<{
    author: string;
    role: string;
    text: string;
    timestamp: string;
  }>;
  assignedByRole?: string;
  assignedByName?: string;
  assignedById?: string;
}

export function getAssignedRole(a: WorkAssignment): 'Auditor' | 'Reviewer' | 'Team Leader' {
  if (a.assigned_role) {
    if (a.assigned_role === 'Team Lead' || a.assigned_role === 'Team Leader') return 'Team Leader';
    return a.assigned_role as 'Auditor' | 'Reviewer';
  }
  // Fallbacks
  if (a.assignTo === 'Auditor') return 'Auditor';
  if (a.assignTo === 'Team Lead') return 'Team Leader';
  if (a.assignTo === 'Reviewer') return 'Reviewer';
  
  const nameLower = a.employeeName.toLowerCase();
  if (nameLower.includes('bose') || nameLower.includes('reviewer') || a.assignTo === 'Audit Team') {
    return 'Reviewer';
  }
  if (nameLower.includes('satyanarayana') || nameLower.includes('lead')) {
    return 'Team Leader';
  }
  return 'Auditor';
}

export interface WorkAssignmentBoardProps {
  currentUser: User;
  onSelectMenu: (menu: string) => void;
  employees: Employee[];
  assignments: WorkAssignment[];
  onAddAssignment: (assignment: WorkAssignment) => void;
  onUpdateAssignmentStatus: (id: string, status: WorkAssignment['status'], comment?: string) => void;
  onUpdateAssignment: (assignment: WorkAssignment) => void;
  onAddComment: (assignmentId: string, text: string) => void;
}

export const DEPARTMENTS_LIST = [
  'Finance', 'Materials', 'Production', 'Safety', 'Projects', 
  'HR', 'Marketing', 'Stores', 'Maintenance', 'Energy', 'IT'
];

export default function WorkAssignmentBoard({
  currentUser,
  onSelectMenu,
  employees,
  assignments,
  onAddAssignment,
  onUpdateAssignmentStatus,
  onUpdateAssignment,
  onAddComment
}: WorkAssignmentBoardProps) {
  
  const activeRole = currentUser.role;

  // Determining who can assign work based on strict hierarchy (anyone except general Auditor)
  const canAssignWork = activeRole === 'HOD' || activeRole === 'Team Lead' || activeRole === 'Reviewer';

  // State mapping target role key
  const [assignTo, setAssignTo] = useState<'Auditor' | 'Team Lead' | 'Audit Team' | 'Reviewer'>('Auditor');
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [empSearch, setEmpSearch] = useState('');
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  const [auditDept, setAuditDept] = useState('Finance');
  const [workTitle, setWorkTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [dueDate, setDueDate] = useState('2026-06-30');
  const [estDays, setEstDays] = useState(10);
  const [remarksHOD, setRemarksHOD] = useState('');
  
  // Attachments simulation
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Search & Filter state for grid
  const [gridSearch, setGridSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Detail Modal & Edit States
  const [selectedAssignment, setSelectedAssignment] = useState<WorkAssignment | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeComment, setActiveComment] = useState('');
  const [statusProgressComment, setStatusProgressComment] = useState('');
  const [showStatusProgressModal, setShowStatusProgressModal] = useState<WorkAssignment | null>(null);

  // Editing state for complete re-assignment / edit
  const [editWorkTitle, setEditWorkTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [editDept, setEditDept] = useState('Finance');
  const [editDueDate, setEditDueDate] = useState('');
  const [editEstDays, setEditEstDays] = useState(10);
  const [editRemarks, setEditRemarks] = useState('');

  // Fallback personnel list if API list is empty
  const defaultPersonnel = [
    { id: '2', name: 'Smt. P. Lakshmi', department: 'Internal Audit', designation: 'Senior Manager (Audit)', role: 'Auditor' },
    { id: '5', name: 'Shri T.V. Satyanarayana', department: 'Internal Audit', designation: 'AGM (Audit)', role: 'Team Lead' },
    { id: '405', name: 'Shri J.C. Bose', department: 'Audit Advisory Board', designation: 'Chief Audit Executive (CAE)', role: 'Reviewer' },
    { id: '10', name: 'Shri R. Kumar', department: 'Accounts', designation: 'Senior Accounts Officer', role: 'Auditor' },
    { id: '11', name: 'Smt. A. Prasad', department: 'Materials Development', designation: 'Manager (Procurement)', role: 'Auditor' },
    { id: '12', name: 'Shri S. Rao', department: 'Projects Coordination', designation: 'Senior Engineer', role: 'Auditor' },
  ];

  // Restructuring active assignTo selection target when the logged-in user switches roles
  useEffect(() => {
    if (activeRole === 'HOD') {
      setAssignTo('Team Lead');
    } else if (activeRole === 'Team Lead') {
      setAssignTo('Reviewer');
    } else if (activeRole === 'Reviewer') {
      setAssignTo('Auditor');
    }
    setSelectedEmp(null);
    setEmpSearch('');
  }, [activeRole]);

  // Filtered employees for search dropdown strictly according to strict hierarchy
  const filteredEmployees = useMemo(() => {
    const list = (employees && employees.length > 0 ? employees : defaultPersonnel) as any[];
    
    // Non-skipping hierarchy locks:
    let filteredList = list;
    if (activeRole === 'HOD') {
      // Auditor HOD assigns to either Team Leads or Auditors depending on selected assignTo
      filteredList = list.filter(emp => emp.role === assignTo);
    } else if (activeRole === 'Team Lead') {
      // Team Leads assign ONLY to Department HODs ('Reviewer')
      filteredList = list.filter(emp => emp.role === 'Reviewer');
    } else if (activeRole === 'Reviewer') {
      // Department HODs assign ONLY to Auditors
      filteredList = list.filter(emp => emp.role === 'Auditor');
    } else {
      filteredList = [];
    }

    if (!empSearch) return filteredList;
    return filteredList.filter(emp => 
      emp.name.toLowerCase().includes(empSearch.toLowerCase()) ||
      emp.department.toLowerCase().includes(empSearch.toLowerCase())
    );
  }, [employees, empSearch, activeRole, assignTo]);

  // Drag Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validTypes = ['.pdf', '.docx', '.xlsx', '.jpg', '.png'];
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (validTypes.includes(fileExt)) {
        setUploadedFile(file.name);
        setUploadError('');
      } else {
        setUploadError('Invalid format. Accepted types: PDF, DOCX, XLSX, JPG, PNG');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file.name);
      setUploadError('');
    }
  };

  // Generate Next ID
  const nextId = useMemo(() => {
    const defaultPrefix = 'WA-2026-';
    if (!assignments || assignments.length === 0) return `${defaultPrefix}001`;
    const numericIds = assignments.map(a => {
      const parts = a.id.split('-');
      const num = parseInt(parts[parts.length - 1]);
      return isNaN(num) ? 0 : num;
    });
    const maxNum = Math.max(...numericIds, 0);
    return `${defaultPrefix}${String(maxNum + 1).padStart(3, '0')}`;
  }, [assignments]);

  // Handle Submit Form
  const handleAssignSubmit = (status: WorkAssignment['status']) => {
    if (!workTitle.trim()) {
      alert('Please fill out the Work Title.');
      return;
    }
    const assigneeName = selectedEmp ? selectedEmp.name : (empSearch || 'Unassigned');
    const assigneeId = selectedEmp ? selectedEmp.id : 'temp-id';

    let targetAssignTo: 'Auditor' | 'Team Lead' | 'Audit Team' | 'Reviewer' = 'Auditor';
    let assigned_role: 'Auditor' | 'Reviewer' | 'Team Leader' | 'Team Lead' = 'Auditor';

    if (activeRole === 'HOD') {
      if (assignTo === 'Auditor') {
        targetAssignTo = 'Auditor';
        assigned_role = 'Auditor';
      } else {
        targetAssignTo = 'Team Lead';
        assigned_role = 'Team Leader';
      }
    } else if (activeRole === 'Team Lead') {
      targetAssignTo = 'Reviewer';
      assigned_role = 'Reviewer';
    } else if (activeRole === 'Reviewer') {
      targetAssignTo = 'Auditor';
      assigned_role = 'Auditor';
    }

    const newAssignment: WorkAssignment = {
      id: nextId,
      assignTo: targetAssignTo,
      assigned_role: assigned_role,
      employeeId: assigneeId,
      employeeName: assigneeName,
      department: auditDept,
      workTitle,
      description,
      priority,
      dueDate,
      estimatedDays: estDays,
      remarksHOD,
      status,
      assignedDate: new Date().toISOString().split('T')[0],
      attachmentName: uploadedFile || undefined,
      comments: [],
      // Strictly tracks assigning entity to separate visible scoping
      assignedByRole: activeRole,
      assignedByName: currentUser.name,
      assignedById: currentUser.id
    };

    onAddAssignment(newAssignment);
    
    // Reset form
    setWorkTitle('');
    setDescription('');
    setRemarksHOD('');
    setSelectedEmp(null);
    setEmpSearch('');
    setUploadedFile(null);
    setUploadError('');
    alert(`Success: Work assignment ${newAssignment.id} created successfully as ${status}!`);
  };

  const handleResetForm = () => {
    setSelectedEmp(null);
    setEmpSearch('');
    setAuditDept('Finance');
    setWorkTitle('');
    setDescription('');
    setPriority('Medium');
    setDueDate('2026-06-30');
    setEstDays(10);
    setRemarksHOD('');
    setUploadedFile(null);
    setUploadError('');
  };

  // Filter Grid Assignments strictly according to: "Each role should only see the tasks assigned to them and tasks they have assigned to lower-level users."
  const filteredGridAssignments = useMemo(() => {
    let list = assignments || [];

    list = list.filter(a => {
      // Is it assigned to me?
      const isAssignedToMe = (String(a.employeeId) === String(currentUser.id)) ||
                             (a.employeeName.toLowerCase().includes(currentUser.name.toLowerCase()));
                             
      // Is it assigned by me?
      const isAssignedByMe = (a.assignedByRole === activeRole) ||
                             (a.assignedById && String(a.assignedById) === String(currentUser.id)) ||
                             (a.assignedByName && a.assignedByName.toLowerCase().includes(currentUser.name.toLowerCase()));

      let assigned_role_converted = a.assigned_role;
      if (!assigned_role_converted) {
        if (a.assignTo === 'Auditor') assigned_role_converted = 'Auditor';
        else if (a.assignTo === 'Reviewer') assigned_role_converted = 'Reviewer';
        else if (a.assignTo === 'Team Lead' || a.assignTo === 'Audit Team') assigned_role_converted = 'Team Leader';
      }

      if (activeRole === 'Auditor') {
        return isAssignedToMe || (assigned_role_converted === 'Auditor');
      }

      if (activeRole === 'Team Lead') {
        const isAssignedToLead = isAssignedToMe || (assigned_role_converted === 'Team Leader');
        return isAssignedToLead || isAssignedByMe;
      }

      if (activeRole === 'Reviewer') { // Department HOD
        const isAssignedToReviewer = isAssignedToMe || (assigned_role_converted === 'Reviewer');
        return isAssignedToReviewer || isAssignedByMe;
      }

      if (activeRole === 'HOD') { // Auditor HOD
        return isAssignedByMe || (!a.assignedByRole && assigned_role_converted === 'Team Leader');
      }

      return true;
    });

    // Grid filters
    if (gridSearch) {
      list = list.filter(a => 
        a.id.toLowerCase().includes(gridSearch.toLowerCase()) ||
        a.employeeName.toLowerCase().includes(gridSearch.toLowerCase()) ||
        a.workTitle.toLowerCase().includes(gridSearch.toLowerCase())
      );
    }
    if (deptFilter !== 'ALL') {
      list = list.filter(a => a.department === deptFilter);
    }
    if (statusFilter !== 'ALL') {
      list = list.filter(a => a.status === statusFilter);
    }

    return list;
  }, [assignments, activeRole, currentUser.name, currentUser.id, gridSearch, deptFilter, statusFilter]);

  // KPIs
  const kpis = useMemo(() => {
    const total = filteredGridAssignments.length;
    const pending = filteredGridAssignments.filter(a => a.status === 'Pending').length;
    const inProgress = filteredGridAssignments.filter(a => a.status === 'In Progress').length;
    const completed = filteredGridAssignments.filter(a => a.status === 'Completed').length;
    const underReview = filteredGridAssignments.filter(a => a.status === 'Under Review').length;
    const rejected = filteredGridAssignments.filter(a => a.status === 'Rejected').length;

    return { total, pending, inProgress, completed, underReview, rejected };
  }, [filteredGridAssignments]);

  // Open Edit Mode for Modal
  const startEditAction = (wa: WorkAssignment) => {
    setEditWorkTitle(wa.workTitle);
    setEditDesc(wa.description);
    setEditPriority(wa.priority);
    setEditDept(wa.department);
    setEditDueDate(wa.dueDate);
    setEditEstDays(wa.estimatedDays);
    setEditRemarks(wa.remarksHOD || '');
    setIsEditing(true);
  };

  // Save Edit Mode changes
  const saveEditAction = (wa: WorkAssignment) => {
    const updated: WorkAssignment = {
      ...wa,
      workTitle: editWorkTitle,
      description: editDesc,
      priority: editPriority,
      department: editDept,
      dueDate: editDueDate,
      estimatedDays: editEstDays,
      remarksHOD: editRemarks
    };
    onUpdateAssignment(updated);
    setSelectedAssignment(updated);
    setIsEditing(false);
    alert('Changes saved successfully into AIMS Database Buffer!');
  };

  // Add Dynamic Comment
  const submitComment = (id: string) => {
    if (!activeComment.trim()) return;
    onAddComment(id, activeComment.trim());
    setActiveComment('');
    // Refresh output states locally
    const updatedAssign = assignments.find(a => a.id === id);
    if (updatedAssign) {
      setSelectedAssignment({
        ...updatedAssign,
        comments: [
          ...(updatedAssign.comments || []),
          {
            author: currentUser.name,
            role: currentUser.role,
            text: activeComment.trim(),
            timestamp: new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString()
          }
        ]
      });
    }
  };

  const getPriorityBadgeColor = (p: string) => {
    switch (p) {
      case 'Critical':
        return 'bg-red-100 border border-red-300 text-red-900 font-bold';
      case 'High':
        return 'bg-amber-100 border border-amber-300 text-amber-950 font-bold';
      case 'Medium':
        return 'bg-blue-100 border border-blue-200 text-blue-900 font-bold';
      default:
        return 'bg-slate-100 border border-slate-200 text-slate-800 font-medium';
    }
  };

  const getStatusBadgeColor = (s: string) => {
    switch (s) {
      case 'Completed':
        return 'bg-green-100 border border-green-300 text-green-900 font-bold';
      case 'In Progress':
        return 'bg-sky-100 border border-sky-300 text-sky-900 font-bold';
      case 'Under Review':
        return 'bg-purple-100 border border-purple-300 text-purple-900 font-bold';
      case 'Rejected':
        return 'bg-red-100 border border-red-300 text-red-900 font-bold';
      case 'Pending':
      default:
        return 'bg-yellow-55 bg-yellow-100 border border-yellow-300 text-yellow-950 font-bold';
    }
  };

  const getAssignedByLabel = (job: any) => {
    if (job.assignedByRole) {
      const namePart = job.assignedByName ? ` (${job.assignedByName})` : '';
      return `${getRoleDisplayName(job.assignedByRole)}${namePart}`;
    }
    // Deep fallback
    let assignedRole = job.assigned_role;
    if (!assignedRole) {
      if (job.assignTo === 'Auditor') assignedRole = 'Auditor';
      else if (job.assignTo === 'Reviewer') assignedRole = 'Reviewer';
      else if (job.assignTo === 'Team Lead' || job.assignTo === 'Audit Team') assignedRole = 'Team Leader';
    }
    if (assignedRole === 'Auditor') return 'Department HOD';
    if (assignedRole === 'Reviewer') return 'Team Lead';
    return 'Auditor HOD';
  };

  const getAssignedToLabel = (job: any) => {
    let roleKey = job.assignTo;
    if (roleKey === 'Reviewer') roleKey = 'Reviewer';
    else if (roleKey === 'Team Lead') roleKey = 'Team Lead';
    else if (roleKey === 'Auditor') roleKey = 'Auditor';
    
    return `${getRoleDisplayName(roleKey)} (${job.employeeName})`;
  };

  return (
    <div className="p-6 space-y-6 font-sans text-slate-800 relative animate-fade-in" id="work-assignment-workspace">
      
      {/* Title block with Oracle system labels */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-sm shadow-md border-b-2 border-yellow-500 gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1 bg-yellow-400 text-slate-950 text-[9px] font-bold px-1.5 py-0.5 rounded-xs w-max uppercase font-mono">
            AIMS_FORM: HOD_WORK_BOARD_V12
          </div>
          <h2 className="text-base sm:text-lg font-black uppercase tracking-wide flex items-center gap-2">
            💼 Work Assignment Management Console
          </h2>
          <p className="text-xs text-slate-350 mt-1 font-medium">
            Active Professional: <strong className="text-yellow-400 font-extrabold">{currentUser.name}</strong> ({getRoleDisplayName(currentUser.role)}) | Access Status: <strong className="text-white font-mono uppercase">{canAssignWork ? 'Full Assigner Authority' : 'Assigned Tasks View Only'}</strong>
          </p>
        </div>
        
        <div className="flex gap-2 shrink-0">
          <button 
            onClick={() => onSelectMenu('dashboard')} 
            className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 px-3 py-1.5 text-xs rounded transition-all font-bold cursor-pointer uppercase font-mono tracking-wider"
          >
            AIMS Dashboard
          </button>
        </div>
      </div>

      {/* KPI Cards section (Styled like existing Dashboard Statistics Section) */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4" id="wa-kpi-blocks">
        
        <div className="bg-white border-t-4 border-slate-500 rounded-sm shadow-xs p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Total Handled</div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-2xl font-black text-slate-800 font-mono">{kpis.total}</span>
            <span className="bg-slate-50 text-slate-700 text-[9px] font-bold px-1.5 py-0.2 rounded border">AIMS</span>
          </div>
        </div>

        <div className="bg-white border-t-4 border-yellow-500 rounded-sm shadow-xs p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Pending Work</div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-2xl font-black text-amber-700 font-mono">{kpis.pending}</span>
            <span className="bg-yellow-50 text-yellow-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded border border-yellow-200">PENDING</span>
          </div>
        </div>

        <div className="bg-white border-t-4 border-sky-500 rounded-sm shadow-xs p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">In Progress</div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-2xl font-black text-indigo-900 font-mono">{kpis.inProgress}</span>
            <span className="bg-sky-50 text-sky-850 text-[9px] font-bold px-1.5 py-0.2 rounded border border-sky-200 font-mono">ACTIVE</span>
          </div>
        </div>

        <div className="bg-white border-t-4 border-purple-500 rounded-sm shadow-xs p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Under Review</div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-2xl font-black text-purple-900 font-mono">{kpis.underReview}</span>
            <span className="bg-purple-50 text-purple-900 text-[9px] font-bold px-1.5 py-0.2 rounded border border-purple-200">VERIFY</span>
          </div>
        </div>

        <div className="bg-white border-t-4 border-red-500 rounded-sm shadow-xs p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Rejected Tasks</div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-2xl font-black text-red-700 font-mono">{kpis.rejected}</span>
            <span className="bg-red-50 text-red-900 text-[9px] font-black px-1.5 py-0.2 rounded border border-red-200">REWORK</span>
          </div>
        </div>

        <div className="bg-white border-t-4 border-green-600 rounded-sm shadow-xs p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Completed</div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-2xl font-black text-green-800 font-mono">{kpis.completed}</span>
            <span className="bg-green-50 text-green-850 text-[9px] font-bold px-1.5 py-0.2 rounded border border-green-200 font-mono">RESOLVED</span>
          </div>
        </div>

      </div>

      {/* Main Container Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COMPONENT: CREATION PANEL (Visible to Auditor HOD, Team Lead, Department HOD in hierarchy) */}
        {canAssignWork ? (
          <div className="lg:col-span-1 bg-white border-2 border-slate-350 rounded-sm shadow-sm overflow-hidden" id="wa-hod-creation-container">
            <div className="bg-[#1e3a8a] text-white p-3 border-b flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest font-mono">Create Work Assignment</span>
              <span className="text-[9px] bg-blue-950 font-semibold px-2 py-0.5 rounded border border-blue-800 text-yellow-400">HIERARCHY_OK</span>
            </div>

            <div className="p-4 space-y-4 text-xs font-sans">
              
              {/* Hierarchy Flow Banner */}
              <div className="bg-blue-50 border border-blue-250 p-2.5 rounded text-[11px] text-blue-950 space-y-1">
                <span className="font-extrabold block text-[10px] uppercase font-mono tracking-tight text-blue-900">Strict Hierarchy Enforced:</span>
                {activeRole === 'HOD' && <p className="font-medium">As <strong>Auditor HOD</strong>, you are assigning work only to <strong>Team Leads</strong>.</p>}
                {activeRole === 'Team Lead' && <p className="font-medium">As <strong>Team Lead</strong>, you are assigning work only to <strong>Department HODs</strong>.</p>}
                {activeRole === 'Reviewer' && <p className="font-medium">As <strong>Department HOD</strong>, you are assigning work only to <strong>Auditors</strong>.</p>}
              </div>

              {/* Assignment ID */}
              <div>
                <label className="block text-[11px] font-black text-slate-600 uppercase font-mono mb-1">Generated Assignment ID:</label>
                <input 
                  type="text" 
                  value={nextId}
                  disabled
                  className="w-full bg-[#f1f5f9] border border-slate-300 p-2 text-[11px] font-mono font-bold text-slate-800 select-all cursor-not-allowed" 
                />
              </div>

              {/* Target Perspective lock display */}
              <div>
                <label className="block text-[11px] font-black text-slate-600 uppercase font-mono mb-1">Target Role Selection:</label>
                {activeRole === 'HOD' ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setAssignTo('Team Lead'); setSelectedEmp(null); setEmpSearch(''); }}
                      className={`flex-1 py-1.5 px-3 text-[10.5px] font-bold rounded-sm border font-mono uppercase transition-colors cursor-pointer ${assignTo === 'Team Lead' ? 'bg-[#1a365d] border-[#1a365d] text-white font-extrabold' : 'bg-slate-50 border-slate-300 text-slate-705 hover:bg-slate-100'}`}
                    >
                      Team Lead
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAssignTo('Auditor'); setSelectedEmp(null); setEmpSearch(''); }}
                      className={`flex-1 py-1.5 px-3 text-[10.5px] font-bold rounded-sm border font-mono uppercase transition-colors cursor-pointer ${assignTo === 'Auditor' ? 'bg-[#1a365d] border-[#1a365d] text-white font-extrabold' : 'bg-slate-50 border-slate-300 text-slate-750 hover:bg-slate-100'}`}
                    >
                      Auditor
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-100 border border-slate-300 p-2 text-[11px] font-mono font-extrabold text-[#113a7c] uppercase rounded-xs">
                    🎯 {getRoleDisplayName(assignTo === 'Reviewer' ? 'Reviewer' : assignTo === 'Team Lead' ? 'Team Lead' : assignTo)}
                  </div>
                )}
              </div>

              {/* Searchable Eligible Employee Selector */}
              <div className="relative">
                <label className="block text-[11px] font-black text-slate-700 uppercase font-mono mb-1">Search &amp; Select {getRoleDisplayName(assignTo === 'Reviewer' ? 'Reviewer' : assignTo === 'Team Lead' ? 'Team Lead' : assignTo)} Employee:</label>
                <div className="relative">
                  <input
                    id="searchable-employee-textbox"
                    type="text"
                    placeholder="Type name to filter matching accounts..."
                    value={selectedEmp ? selectedEmp.name : empSearch}
                    onChange={(e) => {
                      setSelectedEmp(null);
                      setEmpSearch(e.target.value);
                      setShowEmpDropdown(true);
                    }}
                    onFocus={() => setShowEmpDropdown(true)}
                    className="w-full bg-slate-50 border border-slate-300 p-2 font-medium focus:ring-1 focus:ring-blue-600"
                  />
                  <ChevronDown className="w-4.5 h-4.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer" onClick={() => setShowEmpDropdown(!showEmpDropdown)} />
                </div>

                {/* Dropdown Options */}
                {showEmpDropdown && (
                  <div className="absolute left-0 right-0 mt-1 max-h-48 bg-white border border-slate-300 shadow-md rounded-xs select-none z-50 overflow-y-auto divide-y">
                    {filteredEmployees.length === 0 ? (
                      <div className="p-3 text-slate-400 italic text-[11px] text-center">No matching {getRoleDisplayName(assignTo === 'Reviewer' ? 'Reviewer' : assignTo === 'Team Lead' ? 'Team Lead' : assignTo)} found</div>
                    ) : (
                      filteredEmployees.map(emp => (
                        <div
                          key={emp.id}
                          onClick={() => {
                            setSelectedEmp(emp);
                            setEmpSearch(emp.name);
                            setShowEmpDropdown(false);
                          }}
                          className="p-2 hover:bg-blue-50 transition-all cursor-pointer flex justify-between items-center"
                        >
                          <div>
                            <p className="font-bold text-slate-900 text-[11px]">{emp.name}</p>
                            <p className="text-[10px] text-slate-500">{emp.designation} &bull; {emp.department}</p>
                          </div>
                          <span className="bg-neutral-100 text-[8.5px] border border-neutral-300 text-slate-600 p-0.5 rounded font-mono font-bold uppercase">{getRoleDisplayName(emp.role)}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Department Option Dropdown */}
              <div>
                <label className="block text-[11px] font-black text-slate-600 uppercase font-mono mb-1">Audit department (VSP Cluster):</label>
                <select
                  value={auditDept}
                  onChange={(e) => setAuditDept(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 p-2 font-medium focus:ring-1 focus:ring-blue-600"
                >
                  {DEPARTMENTS_LIST.map(dept => (
                    <option key={dept} value={dept}>{dept} Directorate</option>
                  ))}
                </select>
              </div>

              {/* Work Title textfield */}
              <div>
                <label className="block text-[11px] font-black text-slate-600 uppercase font-mono mb-1">Work Title / Scope Heading:</label>
                <input
                  type="text"
                  placeholder="e.g. Verify Vendor Accounting Ledger"
                  value={workTitle}
                  onChange={(e) => setWorkTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 p-2 font-semibold focus:ring-1 focus:ring-blue-600 text-slate-900"
                />
              </div>

              {/* Detailed work description */}
              <div>
                <label className="block text-[11px] font-black text-slate-600 uppercase font-mono mb-1">Detailed Work Description:</label>
                <textarea
                  rows={3}
                  placeholder="Review vendor receipts, match GRNs with physical passcodes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 p-2 font-medium focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Priority & Date row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase font-mono mb-1">Job Priority:</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-350 p-2 font-bold text-red-950 focus:ring-1"
                  >
                    <option value="Low">Low Regular Cycle</option>
                    <option value="Medium">Medium Standard</option>
                    <option value="High">⚠️ High Core Scope</option>
                    <option value="Critical">🚨 Critical CVC Directive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase font-mono mb-1">Target Due Date:</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2 font-mono font-bold focus:ring-1"
                  />
                </div>
              </div>

              {/* Est Days */}
              <div>
                <label className="block text-[11px] font-black text-slate-600 uppercase font-mono mb-1">Estimated Completion Days:</label>
                <input
                  type="number"
                  min="1"
                  value={estDays}
                  onChange={(e) => setEstDays(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-300 p-2 font-semibold font-mono"
                />
              </div>

              {/* Remarks From Assigner HOD */}
              <div>
                <label className="block text-[11px] font-black text-[#1c3e72] uppercase font-mono mb-1">Directive Remarks (Optional):</label>
                <textarea
                  rows={2}
                  placeholder="Insert review notes, parameters or references..."
                  value={remarksHOD}
                  onChange={(e) => setRemarksHOD(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 p-2"
                />
              </div>

              {/* Attachment Drag & Drop section */}
              <div className="mt-2 text-xs">
                <span className="block text-[11px] font-black text-slate-600 uppercase font-mono mb-1">Supporting Documentation (Optional):</span>
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded p-3 text-center transition-all ${
                    isDragging ? 'bg-indigo-50 border-indigo-500 scale-95' : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <Paperclip className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  {uploadedFile ? (
                    <div className="flex items-center justify-center gap-1.5 text-blue-900 font-bold">
                      <span className="text-[11px] truncate w-40">{uploadedFile}</span>
                      <button type="button" onClick={() => setUploadedFile(null)} className="text-red-500 hover:text-red-700 cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[10px] text-slate-500">Drag files here or</p>
                      <label className="inline-block mt-1 text-[10px] text-blue-700 font-extrabold hover:underline cursor-pointer uppercase tracking-tight">
                        Choose Document
                        <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.docx,.xlsx,.jpg,.png" />
                      </label>
                    </div>
                  )}
                  {uploadError && <p className="text-[9.5px] text-red-500 font-bold mt-1 font-mono">{uploadError}</p>}
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t mt-3">
                <button
                  type="button"
                  onClick={() => handleAssignSubmit('Pending')}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10.5px] uppercase tracking-wider py-2 rounded shadow-3xs cursor-pointer text-center"
                >
                  Save Pending Draft
                </button>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-[10.5px] py-2 rounded cursor-pointer text-center"
                >
                  Reset Form
                </button>
              </div>

            </div>
          </div>
        ) : (
          /* Work Scope Policy callout for read-only users */
          <div className="lg:col-span-1 bg-white border-t-4 border-yellow-500 p-5 rounded-sm shadow-xs space-y-4" id="wa-read-only-policy-container">
            <h4 className="text-xs font-black uppercase text-[#12365e] border-b pb-2 tracking-wider flex items-center gap-1.5">
              <Award className="w-4.5 h-4.5 text-blue-900" />
              AIMS Assignment Governance
            </h4>
            <p className="text-xs leading-relaxed text-slate-600">
              Under current Visakhapatnam PSU strict hierarchy Guidelines, only parent roles can distribute assignments directly committed to security profiles.
            </p>
            <div className="bg-slate-50 border p-3 rounded-xs font-mono text-[10.5px] text-slate-700 space-y-1">
              <span className="font-bold text-slate-900 block">SYSTEM HIERARCHY RULES:</span>
              <p>&bull; Auditor HOD &rarr; Team Lead</p>
              <p>&bull; Team Lead &rarr; Department HOD</p>
              <p>&bull; Department HOD &rarr; Auditor</p>
              <p>&bull; Auditor (Lowest Level - Read Only Assigning)</p>
            </div>
            <p className="text-[10px] text-slate-400 italic font-mono leading-relaxed">
              To create new tasks, swap your active session role at the top-right header menu swapper to simulate an assigner level in this branch.
            </p>
          </div>
        )}

        {/* RIGHT & MID COMPONENT: ASSIGNMENT TRACKING GRID */}
        <div className="lg:col-span-2 space-y-4" id="wa-grid-container">
          
          {/* Filters & Workspace header */}
          <div className="bg-white border-2 border-slate-350 p-4 rounded-sm shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-2 mb-2 gap-2">
              <span className="text-xs font-black uppercase text-[#1e3a8a] tracking-wider flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-yellow-500" />
                Live Work Assignment Tracking Database
              </span>
              <span className="bg-[#e2e8f0] text-slate-800 text-[9.5px] font-mono font-bold px-2 py-0.5 rounded">
                RECORDS LOADED: {filteredGridAssignments.length}
              </span>
            </div>

            {/* Quick interactive search/filter fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              
              {/* Search text field */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter by ID, Employee, Title..."
                  value={gridSearch}
                  onChange={(e) => setGridSearch(e.target.value)}
                  className="w-full text-[11px] pl-7 pr-2.5 py-1.5 bg-slate-50 border border-[#cbd5e1] text-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1.5" />
              </div>

              {/* Department filter dropdown */}
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full text-[11px] p-1.5 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-1"
              >
                <option value="ALL">All Departments</option>
                {DEPARTMENTS_LIST.map(dept => (
                  <option key={dept} value={dept}>{dept} Dept</option>
                ))}
              </select>

              {/* Status filter dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-[11px] p-1.5 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-1"
              >
                <option value="ALL">All Statuses (Pending, In Progress ...)</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Under Review">Under Review</option>
                <option value="Rejected">Rejected</option>
                <option value="Completed">Completed</option>
              </select>

            </div>
          </div>

          {/* Grid Table */}
          <div className="bg-white border border-slate-300 rounded-sm shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold font-mono text-[9px] uppercase border-b border-slate-950">
                    <th className="p-3">ID</th>
                    <th className="p-2.5">Due Date</th>
                    <th className="p-2.5">Priority</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Assigned By</th>
                    <th className="p-2.5">Assigned To</th>
                    <th className="p-2.5">Work Title</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredGridAssignments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-slate-400 italic text-xs font-mono bg-slate-50">
                        No work matching criteria has been registered.
                      </td>
                    </tr>
                  ) : (
                    filteredGridAssignments.map((wa) => (
                      <tr key={wa.id} className="hover:bg-slate-50 transition-all">
                        {/* ID */}
                        <td className="p-2.5 font-bold font-mono text-blue-900 border-r">{wa.id}</td>
                        {/* Due Date */}
                        <td className="p-2.5 font-mono font-bold text-slate-700 whitespace-nowrap">{wa.dueDate}</td>
                        {/* Priority */}
                        <td className="p-2.5">
                          <span className={`text-[8.5px] px-2 py-0.5 rounded font-mono uppercase tracking-wide inline-block ${getPriorityBadgeColor(wa.priority)}`}>
                            {wa.priority}
                          </span>
                        </td>
                        {/* Status */}
                        <td className="p-2.5">
                          <span className={`text-[8.5px] px-2 py-0.5 rounded font-mono uppercase inline-block ${getStatusBadgeColor(wa.status)}`}>
                            {wa.status}
                          </span>
                        </td>
                        {/* Assigned By */}
                        <td className="p-2.5 text-slate-600 font-bold text-[11px] whitespace-nowrap">
                          {getAssignedByLabel(wa)}
                        </td>
                        {/* Assigned To */}
                        <td className="p-2.5 text-slate-800 font-bold text-[11px] whitespace-nowrap">
                          {getAssignedToLabel(wa)}
                        </td>
                        {/* Work Title */}
                        <td className="p-2.5 font-semibold text-slate-800 max-w-[140px] truncate" title={wa.workTitle}>{wa.workTitle}</td>
                        {/* Actions */}
                        <td className="p-2.5 text-center flex items-center justify-center gap-1">
                          
                          {/* Viewer Details */}
                          <button
                            id={`wa-action-view-${wa.id}`}
                            onClick={() => {
                              setSelectedAssignment(wa);
                              setIsEditing(false);
                            }}
                            className="bg-slate-100 hover:bg-blue-100 text-slate-800 hover:text-blue-900 p-1 border hover:border-blue-400 rounded transition-all cursor-pointer shadow-3xs"
                            title="View full details and comments"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Workflow update for user */}
                          <button
                            id={`wa-action-status-${wa.id}`}
                            onClick={() => setShowStatusProgressModal(wa)}
                            className="bg-sky-50 hover:bg-sky-100 text-sky-900 p-1 border border-sky-200 rounded transition-all cursor-pointer shadow-3xs"
                            title="Change status or workflow step"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          {/* Detail Edit (HOD or assigner) */}
                          {canAssignWork && (
                            <button
                              id={`wa-action-edit-${wa.id}`}
                              onClick={() => {
                                setSelectedAssignment(wa);
                                startEditAction(wa);
                              }}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-900 p-1 border border-amber-200 rounded cursor-pointer"
                              title="Edit fields"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}

                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      {/* DETAILED VIEW & COMMENTING SHEET MODAL COMPONENT */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-3xs flex items-center justify-center p-4 z-50 animate-fade-in" id="wa-details-modal">
          <div className="bg-white border-2 border-slate-900 rounded-sm shadow-2xl max-w-2xl w-full h-max max-h-[90vh] overflow-hidden flex flex-col font-sans">
            
            {/* Header */}
            <div className="bg-[#1e3a8a] text-white p-3.5 border-b border-slate-950 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-yellow-400" />
                <span className="text-xs font-black uppercase font-mono tracking-wider">AIMS_DOCUMENT_RECORD: {selectedAssignment.id}</span>
              </div>
              <button 
                onClick={() => { setSelectedAssignment(null); setIsEditing(false); }} 
                className="p-1 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Container */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs font-sans">
              
              {isEditing ? (
                /* EDIT FORM SHEET */
                <div className="space-y-3.5" id="wa-modal-edit-inputs">
                  <h4 className="text-xs font-black uppercase text-[#1e3a8a]">Edit Work Order Assignment Record</h4>
                  
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 mb-1">Audit department (VSP Cluster):</label>
                    <select
                      value={editDept}
                      onChange={(e) => setEditDept(e.target.value)}
                      className="w-full bg-slate-50 border p-1.5 focus:ring-1"
                    >
                      {DEPARTMENTS_LIST.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 mb-1">Work Title / Scope Heading:</label>
                    <input
                      type="text"
                      className="w-full border p-2 focus:ring-1 font-semibold text-slate-800"
                      value={editWorkTitle}
                      onChange={(e) => setEditWorkTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 mb-1">Detailed Work Description:</label>
                    <textarea
                      rows={3}
                      className="w-full border p-2"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10.5px] font-bold text-[#1e3a8a] mb-1">Priority Rating:</label>
                      <select
                        className="w-full border p-2"
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value as any)}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-600 mb-1">Target Due Date:</label>
                      <input
                        type="date"
                        className="w-full border p-2 font-mono"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-600 mb-1">Estimated Days:</label>
                      <input
                        type="number"
                        className="w-full border p-2 font-mono"
                        value={editEstDays}
                        onChange={(e) => setEditEstDays(parseInt(e.target.value) || 12)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 mb-1">Directive Remarks:</label>
                    <textarea
                      rows={2}
                      className="w-full border p-2"
                      value={editRemarks}
                      onChange={(e) => setEditRemarks(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="bg-neutral-100 hover:bg-neutral-200 text-slate-800 font-bold px-4 py-2 text-xs rounded transition-all cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => saveEditAction(selectedAssignment)}
                      className="bg-blue-900 hover:bg-blue-950 text-white font-extrabold px-5 py-2 text-xs rounded shadow-3xs cursor-pointer"
                    >
                      Commit Database Block
                    </button>
                  </div>

                </div>
              ) : (
                /* READ ONLY PRECISE VIEW */
                <div className="space-y-4" id="wa-modal-read-only">
                  <div className="border border-slate-200 bg-slate-50 p-4 rounded-xs space-y-3">
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="font-mono text-[10px] font-bold">ASSIGNED BY: <strong className="text-slate-800">{getAssignedByLabel(selectedAssignment)}</strong></span>
                      <span className="font-mono text-[10px] font-bold">DATE: <strong className="text-slate-800">{selectedAssignment.assignedDate}</strong></span>
                    </div>

                    <h3 className="text-sm font-black text-slate-900 uppercase border-b pb-1 mb-1">{selectedAssignment.workTitle}</h3>
                    <p className="text-slate-705 leading-relaxed text-[11px] bg-white p-3 border border-slate-200 rounded shadow-3xs whitespace-pre-line">{selectedAssignment.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px]">
                      <div>
                        <span className="block text-slate-400 font-mono uppercase">Assignee</span>
                        <strong className="text-slate-800 text-[10px]">{selectedAssignment.employeeName}</strong>
                      </div>
                      <div>
                        <span className="block text-slate-400 font-mono uppercase">Department</span>
                        <strong className="text-slate-800 font-semibold">{selectedAssignment.department}</strong>
                      </div>
                      <div>
                        <span className="block text-slate-400 font-mono uppercase">Priority</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold inline-block mt-0.5 ${getPriorityBadgeColor(selectedAssignment.priority)}`}>{selectedAssignment.priority}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 font-mono uppercase">Target Date</span>
                        <strong className="text-slate-800 font-mono">{selectedAssignment.dueDate}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Attachment documentation element */}
                  <div className="border border-slate-200 p-3 bg-white rounded-xs flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-slate-400" />
                      <span className="font-bold text-slate-700">Supporting Attachment:</span>
                    </div>
                    {selectedAssignment.attachmentName ? (
                      <span className="font-mono text-blue-900 hover:underline cursor-pointer bg-blue-50 px-2 py-0.5 border border-blue-200 rounded font-bold text-[10.5px]">
                        💾 {selectedAssignment.attachmentName}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono italic">No attachment uploaded</span>
                    )}
                  </div>

                  {/* Comments Feed Area */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-black uppercase text-slate-700 font-mono tracking-wider border-b pb-1">Review Audit Comments Board</h4>
                    <div className="max-h-40 overflow-y-auto space-y-2.5 bg-slate-900 border rounded p-3">
                      {!selectedAssignment.comments || selectedAssignment.comments.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic text-center py-4 font-mono">No review feed comments on the task buffer.</p>
                      ) : (
                        selectedAssignment.comments.map((comment, index) => (
                          <div key={index} className="space-y-0.5 border-b border-slate-800 pb-1.5">
                            <div className="flex justify-between items-center text-[9px] text-slate-400">
                              <span className="font-bold text-yellow-350 text-yellow-300 uppercase">{comment.author} ({getRoleDisplayName(comment.role)})</span>
                              <span className="font-mono">{comment.timestamp}</span>
                            </div>
                            <p className="text-slate-100 text-[10.5px] leading-relaxed select-all">{comment.text}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Write new comment */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add specific comments, roadblocks, or findings..."
                        className="flex-1 border p-2 focus:ring-1 text-[11px]"
                        value={activeComment}
                        onChange={(e) => setActiveComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && submitComment(selectedAssignment.id)}
                      />
                      <button
                        onClick={() => submitComment(selectedAssignment.id)}
                        className="bg-blue-900 hover:bg-blue-950 text-white font-extrabold px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Reply
                      </button>
                    </div>
                  </div>

                  {/* Close modal button */}
                  <div className="flex justify-end border-t pt-3">
                    <button
                      type="button"
                      onClick={() => { setSelectedAssignment(null); setIsEditing(false); }}
                      className="bg-[#1e3a8a] text-white hover:bg-blue-950 font-extrabold px-6 py-2.5 text-xs rounded transition-all cursor-pointer"
                    >
                      AIMS Commit &amp; Return
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* QUICK STATUS CHANGE MODAL COMPONENT */}
      {showStatusProgressModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-3xs flex items-center justify-center p-4 z-50 animate-fade-in" id="wa-status-modal">
          <div className="bg-white border-2 border-slate-900 rounded-sm shadow-2xl max-w-md w-full overflow-hidden flex flex-col font-sans">
            
            <div className="bg-slate-950 text-white p-3.5 border-b border-slate-900 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-yellow-400">Update Task Status Workflow</span>
              <button onClick={() => { setShowStatusProgressModal(null); setStatusProgressComment(''); }} className="p-1 text-slate-300 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs font-sans">
              <div className="bg-[#f8fafc] border p-3 rounded-xs font-medium">
                <h4 className="font-bold text-slate-905 text-slate-905 uppercase">Task: {showStatusProgressModal.workTitle}</h4>
                <p className="text-[10px] text-slate-500 mt-1">Current Status: <strong className="text-[#104a7c] uppercase font-mono">{showStatusProgressModal.status}</strong></p>
              </div>

              {/* Status transition nodes representing ALL the status options requested */}
              <div className="space-y-2">
                <label className="block text-[10.5px] font-bold text-slate-700 uppercase font-mono">Transition Workflow Status:</label>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  
                  {(['Pending', 'In Progress', 'Under Review', 'Rejected', 'Completed'] as const).map(state => (
                    <button
                      key={state}
                      onClick={() => {
                        onUpdateAssignmentStatus(showStatusProgressModal.id, state, statusProgressComment || `Status set to ${state} by session user.`);
                        setShowStatusProgressModal(null);
                        setStatusProgressComment('');
                        alert(`Task state transitioned to ${state} successfully.`);
                      }}
                      className={`py-2 px-1 border uppercase font-mono font-bold hover:bg-[#f1f7ff] transition-all cursor-pointer text-center rounded ${
                        showStatusProgressModal.status === state 
                          ? 'bg-blue-900 border-blue-950 text-white hover:bg-blue-950' 
                          : 'bg-white text-slate-700'
                      }`}
                    >
                      {state}
                    </button>
                  ))}

                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-600 uppercase font-mono mb-1">Status comments memo (Optional):</label>
                <textarea
                  rows={2}
                  placeholder="Record why status was modified..."
                  className="w-full border p-2 focus:ring-1 font-medium bg-slate-50"
                  value={statusProgressComment}
                  onChange={(e) => setStatusProgressComment(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t mt-3">
                <button
                  type="button"
                  onClick={() => { setShowStatusProgressModal(null); setStatusProgressComment(''); }}
                  className="bg-neutral-100 hover:bg-neutral-200 text-slate-700 font-bold px-4 py-2 rounded cursor-pointer"
                >
                  Cancel
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
