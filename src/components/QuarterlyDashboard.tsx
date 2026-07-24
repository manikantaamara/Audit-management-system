import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, Clock, Search, ShieldAlert, AlertTriangle, Eye, RefreshCw, MessageSquare, Send, Paperclip, X
} from 'lucide-react';
import { AuditPlan, AuditPara, AuditReport, UserRole, getRoleDisplayName } from '../types';

interface QuarterlyDashboardProps {
  plans: AuditPlan[];
  reports: AuditReport[];
  paras: AuditPara[];
  currentUser: { id: string; username: string; name: string; role: UserRole; department?: string; designation?: string; };
  onSelectMenu: (menu: string) => void;
  onUpdatePara?: (id: string, updates: Partial<AuditPara>) => Promise<void>;
  onUpdatePlan?: (id: string, updates: Partial<AuditPlan>) => Promise<void>;
  onRoleDepartmentRedirect?: (role: UserRole, departmentId: string) => void;
  assignments?: any[];
  onUpdateAssignmentStatus?: (id: string, status: any, comment?: string) => void;
}

export default function QuarterlyDashboard({ 
  plans, 
  reports, 
  paras, 
  currentUser, 
  onSelectMenu,
  assignments = [],
  onUpdateAssignmentStatus
}: QuarterlyDashboardProps) {
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedJobFilterStatus, setSelectedJobFilterStatus] = useState<string>('ALL');
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [showStatusModal, setShowStatusModal] = useState<any | null>(null);
  const [activeComment, setActiveComment] = useState<string>('');
  const [statusCommentText, setStatusCommentText] = useState<string>('');

  // 1. Core Visibility and filtering: "only see tasks assigned to them and tasks assigned to lower-level users"
  const filteredDashboardAssignments = useMemo(() => {
    let list = assignments || [];

    list = list.filter(a => {
      // Is it assigned to me?
      const isAssignedToMe = (String(a.employeeId) === String(currentUser.id)) ||
                             (a.employeeName.toLowerCase().includes(currentUser.name.toLowerCase()));
                             
      // Is it assigned by me?
      const isAssignedByMe = (a.assignedByRole === currentUser.role) ||
                             (a.assignedById && String(a.assignedById) === String(currentUser.id)) ||
                             (a.assignedByName && a.assignedByName.toLowerCase().includes(currentUser.name.toLowerCase()));

      let assigned_role_converted = a.assigned_role;
      if (!assigned_role_converted) {
        if (a.assignTo === 'Auditor') assigned_role_converted = 'Auditor';
        else if (a.assignTo === 'Reviewer') assigned_role_converted = 'Reviewer';
        else if (a.assignTo === 'Team Lead' || a.assignTo === 'Audit Team') assigned_role_converted = 'Team Leader';
      }

      if (currentUser.role === 'Auditor') {
        return isAssignedToMe || (assigned_role_converted === 'Auditor');
      }

      if (currentUser.role === 'Team Lead') {
        const isAssignedToLead = isAssignedToMe || (assigned_role_converted === 'Team Leader');
        return isAssignedToLead || isAssignedByMe;
      }

      if (currentUser.role === 'Reviewer') { // Department HOD
        const isAssignedToReviewer = isAssignedToMe || (assigned_role_converted === 'Reviewer');
        return isAssignedToReviewer || isAssignedByMe;
      }

      if (currentUser.role === 'HOD') { // Auditor HOD
        return isAssignedByMe || (!a.assignedByRole && assigned_role_converted === 'Team Leader'); // shows default preloaded seed tasks
      }

      return true;
    });

    if (searchQuery) {
      list = list.filter(a =>
        a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.workTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.employeeName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedJobFilterStatus !== 'ALL') {
      list = list.filter(a => {
        if (selectedJobFilterStatus === 'PENDING') return a.status === 'Pending' || a.status === 'Assigned';
        if (selectedJobFilterStatus === 'IN_PROGRESS') return a.status === 'In Progress';
        if (selectedJobFilterStatus === 'UNDER_REVIEW') return a.status === 'Under Review';
        if (selectedJobFilterStatus === 'REJECTED') return a.status === 'Rejected';
        if (selectedJobFilterStatus === 'COMPLETED') return a.status === 'Completed';
        return true;
      });
    }

    return list;
  }, [assignments, currentUser, searchQuery, selectedJobFilterStatus]);

  // Dynamic KPI counts based on the filtered visible list
  const kpis = useMemo(() => {
    let rootList = assignments || [];
    // Enforce role-based viewing boundaries for counts first style
    const visibleList = rootList.filter(a => {
      const isAssignedToMe = (String(a.employeeId) === String(currentUser.id)) ||
                             (a.employeeName.toLowerCase().includes(currentUser.name.toLowerCase()));
      const isAssignedByMe = (a.assignedByRole === currentUser.role) ||
                             (a.assignedById && String(a.assignedById) === String(currentUser.id));
      
      let assigned_role_converted = a.assigned_role;
      if (!assigned_role_converted) {
        if (a.assignTo === 'Auditor') assigned_role_converted = 'Auditor';
        else if (a.assignTo === 'Reviewer') assigned_role_converted = 'Reviewer';
        else if (a.assignTo === 'Team Lead' || a.assignTo === 'Audit Team') assigned_role_converted = 'Team Leader';
      }

      if (currentUser.role === 'Auditor') return isAssignedToMe || (assigned_role_converted === 'Auditor');
      if (currentUser.role === 'Team Lead') return isAssignedToMe || (assigned_role_converted === 'Team Leader') || isAssignedByMe;
      if (currentUser.role === 'Reviewer') return isAssignedToMe || (assigned_role_converted === 'Reviewer') || isAssignedByMe;
      if (currentUser.role === 'HOD') return isAssignedByMe || (!a.assignedByRole && assigned_role_converted === 'Team Leader');
      return true;
    });

    const total = visibleList.length;
    const pending = visibleList.filter(j => j.status === 'Pending' || j.status === 'Assigned').length;
    const inProgress = visibleList.filter(j => j.status === 'In Progress').length;
    const underReview = visibleList.filter(j => j.status === 'Under Review').length;
    const completed = visibleList.filter(j => j.status === 'Completed').length;
    const rejected = visibleList.filter(j => j.status === 'Rejected').length;
    return { total, pending, inProgress, underReview, completed, rejected };
  }, [assignments, currentUser]);

  const getAssignedByLabel = (job: any) => {
    if (job.assignedByRole) {
      const namePart = job.assignedByName ? ` (${job.assignedByName})` : '';
      return `${getRoleDisplayName(job.assignedByRole)}${namePart}`;
    }
    // Deep backward mapping fallback
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-extrabold';
      case 'In Progress':
        return 'bg-sky-950/60 border border-sky-500/30 text-sky-400 font-extrabold';
      case 'Under Review':
        return 'bg-purple-950/60 border border-purple-500/30 text-purple-400 font-extrabold';
      case 'Rejected':
        return 'bg-red-950/60 border border-red-500/30 text-red-400 font-extrabold';
      case 'Pending':
      case 'Assigned':
      default:
        return 'bg-yellow-950/60 border border-yellow-500/30 text-yellow-400 font-extrabold';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-rose-950/30 border border-rose-900/60 text-rose-400 font-bold';
      case 'High':
        return 'bg-amber-950/30 border border-amber-900/60 text-amber-400 font-bold';
      case 'Medium':
        return 'bg-indigo-950/30 border border-indigo-900/60 text-indigo-400';
      default:
        return 'bg-slate-900 border border-slate-700 text-slate-400';
    }
  };

  const handlePostComment = (jobId: string) => {
    if (!activeComment.trim()) return;
    if (onUpdateAssignmentStatus) {
      onUpdateAssignmentStatus(jobId, selectedAssignment.status, activeComment.trim());
      
      // Update selected assignment in memory to show comments instantly
      setSelectedAssignment((prev: any) => {
        if (!prev) return null;
        return {
          ...prev,
          comments: [
            ...(prev.comments || []),
            {
              author: currentUser.name,
              role: currentUser.role,
              text: activeComment.trim(),
              timestamp: new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString()
            }
          ]
        };
      });
    }
    setActiveComment('');
  };

  const executeStatusTransition = (status: string) => {
    if (onUpdateAssignmentStatus && showStatusModal) {
      onUpdateAssignmentStatus(showStatusModal.id, status, statusCommentText.trim() || `Status updated to ${status}.`);
      setShowStatusModal(null);
      setStatusCommentText('');
      alert(`Success: Task status changed to ${status}.`);
    }
  };

  return (
    <div id="aims-task-simplified-dashboard" className="p-6 space-y-6 font-sans text-slate-200 bg-[#0b1329] min-h-screen">
      
      {/* Sleek, Task-Focused Minimal Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-slate-900 to-indigo-950 border border-slate-800 p-5 rounded-md shadow-lg gap-4">
        <div>
          <span className="bg-yellow-500 text-slate-950 text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-widest block w-max mb-1.5">
            AIMS Core System
          </span>
          <h2 className="text-lg font-black uppercase text-white tracking-wide">
            💼 Internal Workspace Task Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Active Professional: <strong className="text-yellow-400">{currentUser.name}</strong> ({getRoleDisplayName(currentUser.role)})
          </p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => onSelectMenu('work_assignment_board')}
            className="bg-yellow-600 hover:bg-yellow-700 text-slate-950 font-black tracking-wider uppercase px-4 py-2 text-xs rounded border-none cursor-pointer transition-all"
          >
            Assignment Form &rarr;
          </button>
        </div>
      </div>

      {/* Dynamic Filter Badges & Task Counter Ribbons */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 select-none">
        {[
          { key: 'ALL', label: 'All Operations', count: kpis.total, style: 'text-indigo-400 border-indigo-500/20' },
          { key: 'PENDING', label: 'Pending', count: kpis.pending, style: 'text-yellow-400 border-yellow-500/20' },
          { key: 'IN_PROGRESS', label: 'Active Progress', count: kpis.inProgress, style: 'text-sky-400 border-sky-500/20' },
          { key: 'UNDER_REVIEW', label: 'Under Review', count: kpis.underReview, style: 'text-purple-400 border-purple-500/20' },
          { key: 'REJECTED', label: 'Rejected', count: kpis.rejected, style: 'text-rose-400 border-rose-500/20' },
          { key: 'COMPLETED', label: 'Completed', count: kpis.completed, style: 'text-emerald-400 border-emerald-500/20' }
        ].map(card => (
          <button
            key={card.key}
            type="button"
            onClick={() => setSelectedJobFilterStatus(card.key)}
            className={`p-3 rounded-sm border text-left bg-slate-900/60 hover:bg-slate-950 transition-all flex flex-col justify-between h-16 cursor-pointer ${
              selectedJobFilterStatus === card.key ? 'border-yellow-500 bg-slate-950 ring-1 ring-yellow-500/10' : card.style.split(' ')[1]
            }`}
          >
            <span className="text-[9px] font-mono uppercase font-bold text-slate-400 tracking-wider truncate block">{card.label}</span>
            <span className={`text-[18px] font-mono font-black ${card.style.split(' ')[0]}`}>{card.count}</span>
          </button>
        ))}
      </div>

      {/* Live Workspace Search Panel */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-md flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input 
          type="text" 
          placeholder="Filter live task titles, scopes, employee names..." 
          className="bg-transparent border-none text-white focus:outline-none w-full text-xs"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white cursor-pointer p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Core Simplified Tasks Table */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 font-mono font-extrabold uppercase text-[9.5px] border-b border-slate-800 tracking-wider">
                <th className="p-3.5">Assigned Tasks</th>
                <th className="p-3.5">Task Status</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5">Priority</th>
                <th className="p-3.5">Assigned By</th>
                <th className="p-3.5">Assigned To</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-slate-300 font-medium font-sans">
              {filteredDashboardAssignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500 italic font-mono text-xs">
                    No active assignments matching criteria are currently registered/visible for your role profile.
                  </td>
                </tr>
              ) : (
                filteredDashboardAssignments.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-900/30 transition-colors">
                    
                    {/* Column 1: Assigned Tasks (Title & ID) */}
                    <td className="p-3.5 max-w-[240px]">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-black text-yellow-400">{job.id}</span>
                          <span className="text-[9px] bg-slate-900 px-1.5 py-0.2 rounded text-slate-400 font-mono">{job.department}</span>
                        </div>
                        <p className="font-bold text-white text-[12.5px] truncate" title={job.workTitle}>{job.workTitle}</p>
                        <p className="text-[10.5px] text-slate-400 line-clamp-1 leading-tight font-sans mt-0.5">{job.description}</p>
                      </div>
                    </td>

                    {/* Column 2: Task Status */}
                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`text-[9.5px] px-2.5 py-1 rounded font-mono font-black uppercase inline-block ${getStatusBadgeColor(job.status)}`}>
                        {job.status}
                      </span>
                    </td>

                    {/* Column 3: Due Date */}
                    <td className="p-3.5 whitespace-nowrap font-mono font-bold text-slate-300">
                      {job.dueDate}
                    </td>

                    {/* Column 4: Priority */}
                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`text-[9.5px] px-2 py-0.5 rounded font-mono tracking-wider uppercase inline-block ${getPriorityBadgeColor(job.priority)}`}>
                        {job.priority}
                      </span>
                    </td>

                    {/* Column 5: Assigned By */}
                    <td className="p-3.5 text-[11.5px] text-indigo-200">
                      {getAssignedByLabel(job)}
                    </td>

                    {/* Column 6: Assigned To */}
                    <td className="p-3.5 text-[11.5px] text-amber-200">
                      {getAssignedToLabel(job)}
                    </td>

                    {/* Actions Column */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedAssignment(job)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 text-[10.5px] font-bold rounded cursor-pointer transition-all flex items-center gap-1"
                          title="View comments, descriptions and parameters"
                        >
                          <Eye className="w-3 h-3 text-slate-400" /> Details
                        </button>

                        <button
                          onClick={() => {
                            setShowStatusModal(job);
                            setStatusCommentText('');
                          }}
                          className="bg-[#1e3a8a] text-white hover:bg-blue-900 px-2.5 py-1 text-[10.5px] font-mono font-bold rounded cursor-pointer transition-all flex items-center gap-1 shadow-sm"
                          title="Transition task status"
                        >
                          <RefreshCw className="w-3 h-3 text-yellow-400" /> Status
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Details and Comment Sheet Overlay Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-3xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0f172a] border border-slate-800 rounded-md shadow-2xl max-w-2xl w-full h-max max-h-[90vh] overflow-hidden flex flex-col font-sans">
            
            <div className="bg-slate-900 p-4 border-b border-slate-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-yellow-400">TASK_RECORD: {selectedAssignment.id}</span>
              </div>
              <button 
                onClick={() => setSelectedAssignment(null)} 
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              
              <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-slate-400 text-[10px]">
                  <span className="font-mono font-bold uppercase">Assigner: {getAssignedByLabel(selectedAssignment)}</span>
                  <span className="font-mono">Created: {selectedAssignment.assignedDate || '22/05/2026'}</span>
                </div>
                
                <h3 className="text-sm font-black text-white uppercase border-b border-slate-800 pb-1.5 leading-normal">{selectedAssignment.workTitle}</h3>
                <p className="text-slate-300 leading-relaxed text-[11.5px] whitespace-pre-line bg-slate-900/60 p-3 rounded border border-slate-800/40">{selectedAssignment.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10.5px] pt-1">
                  <div>
                    <span className="block text-slate-500 font-mono uppercase text-[9px]">Assignee</span>
                    <strong className="text-slate-200">{selectedAssignment.employeeName}</strong>
                  </div>
                  <div>
                    <span className="block text-slate-500 font-mono uppercase text-[9px]">Department</span>
                    <strong className="text-slate-200 font-semibold">{selectedAssignment.department}</strong>
                  </div>
                  <div>
                    <span className="block text-slate-500 font-mono uppercase text-[9px]">Priority</span>
                    <span className={`text-[9.5px] px-2 py-0.2 rounded font-mono font-bold mt-0.5 inline-block ${getPriorityBadgeColor(selectedAssignment.priority)}`}>{selectedAssignment.priority}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 font-mono uppercase text-[9px]">Target Date</span>
                    <strong className="text-slate-200 font-mono">{selectedAssignment.dueDate}</strong>
                  </div>
                </div>
              </div>

              {selectedAssignment.remarksHOD && (
                <div className="border border-yellow-500/20 bg-yellow-500/5 p-3 rounded text-[11px]">
                  <strong className="text-yellow-400 block font-mono uppercase text-[9px] mb-0.5">Special Directive Remarks:</strong>
                  <p className="text-slate-300 leading-relaxed">{selectedAssignment.remarksHOD}</p>
                </div>
              )}

              {/* Supporting Document Attachment Link */}
              <div className="border border-slate-800 p-3 bg-slate-950 rounded flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-slate-500" />
                  <span className="font-bold text-slate-300">Supporting Attachment:</span>
                </div>
                {selectedAssignment.attachmentName ? (
                  <span className="font-mono text-cyan-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded font-bold text-[10.5px]">
                    💾 {selectedAssignment.attachmentName}
                  </span>
                ) : (
                  <span className="text-slate-500 font-mono italic">No file attached</span>
                )}
              </div>

              {/* Dedicated Review Comments Thread */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase text-slate-400 font-mono tracking-widest border-b border-slate-800 pb-1">Discussion &amp; Update History</h4>
                
                <div className="max-h-40 overflow-y-auto space-y-2.5 bg-slate-950 border border-slate-850 p-3 rounded">
                  {!selectedAssignment.comments || selectedAssignment.comments.length === 0 ? (
                    <p className="text-[10.5px] text-slate-550 text-slate-500 italic text-center py-4 font-mono">No communication logs recorded on the buffer.</p>
                  ) : (
                    selectedAssignment.comments.map((comment: any, index: number) => (
                      <div key={index} className="space-y-1 border-b border-slate-900 pb-2 last:border-b-0 last:pb-0">
                        <div className="flex justify-between items-center text-[9px]">
                          <span className="font-bold text-yellow-400 uppercase">{comment.author} ({getRoleDisplayName(comment.role)})</span>
                          <span className="font-mono text-slate-500">{comment.timestamp}</span>
                        </div>
                        <p className="text-slate-200 text-[11px] leading-relaxed select-all">{comment.text}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Send action chat bar */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type message, report link, or query feedback..."
                    className="flex-grow bg-slate-950 border border-slate-800 p-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-yellow-500 rounded text-white"
                    value={activeComment}
                    onChange={(e) => setActiveComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePostComment(selectedAssignment.id)}
                  />
                  <button
                    onClick={() => handlePostComment(selectedAssignment.id)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-slate-950 font-extrabold px-4 py-1 rounded flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Send className="w-3.5 h-3.5 white" /> Send
                  </button>
                </div>
              </div>

              {/* Commit and exit */}
              <div className="flex justify-end pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-2 rounded cursor-pointer"
                >
                  Return to Workspace
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Task Status Transitions Overlay Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-3xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0f172a] border border-slate-800 rounded-md shadow-2xl max-w-sm w-full overflow-hidden flex flex-col font-sans text-xs">
            
            <div className="bg-slate-900 text-white p-3.5 border-b border-slate-800 flex justify-between items-center font-mono">
              <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Transition Workflow Status</span>
              <button onClick={() => setShowStatusModal(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="bg-slate-950 border border-slate-850 p-3 rounded-md">
                <h4 className="font-bold text-white uppercase text-[11px] truncate">{showStatusModal.workTitle}</h4>
                <p className="text-[10px] text-slate-400 mt-1">
                  Current Status: <strong className="text-yellow-400 uppercase font-mono">{showStatusModal.status}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Select Transition Node:</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Pending', 'In Progress', 'Under Review', 'Rejected', 'Completed'] as const).map(state => (
                    <button
                      key={state}
                      onClick={() => executeStatusTransition(state)}
                      className={`py-2 px-1 border uppercase font-mono font-bold transition-all cursor-pointer text-center text-[10px] rounded ${
                        showStatusModal.status === state 
                          ? 'bg-yellow-500 border-yellow-600 text-slate-950 font-black shadow-sm' 
                          : 'bg-slate-900 hover:bg-slate-950 text-slate-350 border-slate-800'
                      }`}
                    >
                      {state}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Historical remarks comment (optional):</label>
                <textarea
                  rows={2}
                  placeholder="Record reason or current progress details..."
                  className="w-full bg-slate-950 border border-slate-800 p-2 focus:outline-none focus:ring-1 focus:ring-yellow-500 text-white rounded text-[11px]"
                  value={statusCommentText}
                  onChange={(e) => setStatusCommentText(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded cursor-pointer"
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
