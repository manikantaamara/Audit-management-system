import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, ChevronRight, ChevronLeft, ArrowRight, RotateCcw, 
  CheckCircle2, AlertTriangle, HelpCircle, AlertCircle, Sparkles, LogIn
} from 'lucide-react';
import { User, UserRole, getRoleDisplayName } from '../types';

interface RoleAccessConsoleProps {
  currentUser: User;
  onImpersonate: (role: UserRole, deptId: string) => void;
  onRestoreHOD: () => void;
  isCurrentlyImpersonating: boolean;
  impersonationState: {
    originalUser: User;
    impersonatedRole: UserRole;
    impersonatedDept: string;
  } | null;
}

export default function RoleAccessConsole({ 
  currentUser, 
  onImpersonate, 
  onRestoreHOD,
  isCurrentlyImpersonating,
  impersonationState
}: RoleAccessConsoleProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole>('Auditor');
  const [departmentId, setDepartmentId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Update selected role and dept if impersonation changed externally
  useEffect(() => {
    if (impersonationState) {
      setSelectedRole(impersonationState.impersonatedRole);
      setDepartmentId(impersonationState.impersonatedDept);
    } else {
      setSelectedRole('Auditor');
      setDepartmentId('');
    }
  }, [impersonationState]);

  // Clean success/error alerts after a delay
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const t = setTimeout(() => setErrorMsg(''), 4000);
      return () => clearTimeout(t);
    }
  }, [errorMsg]);

  // Input numeric only validator
  const handleDeptIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*$/.test(val)) {
      setDepartmentId(val);
      setErrorMsg('');
    }
  };

  const handleAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Exactly 6 digits constraint checking
    if (departmentId.length !== 6) {
      setErrorMsg('Validation Failure: Department ID must contain exactly 6 digits.');
      return;
    }

    if (!['Team Lead', 'Auditor', 'Reviewer'].includes(selectedRole)) {
      setErrorMsg('Permission Failure: Cannot impersonate HOD or Admin roles from this console.');
      return;
    }

    // Trigger parent state transition 
    onImpersonate(selectedRole, departmentId);
    setSuccessMsg(`Session penetrative access initialized for role: ${selectedRole} | Dept: ${departmentId}`);
  };

  const handleResetClick = () => {
    setDepartmentId('');
    setSelectedRole('Auditor');
    setErrorMsg('');
    setSuccessMsg('');
    if (isCurrentlyImpersonating) {
      onRestoreHOD();
      setSuccessMsg('Restored original HOD Admin session.');
    }
  };

  return (
    <div 
      className={`relative h-full flex flex-row shrink-0 transition-all duration-300 z-[900] ${
        isOpen ? 'w-80' : 'w-10'
      }`}
      id="role-access-console-sidebar"
    >
      {/* Toggle Tab Trigger Button */}
      <div className="absolute top-1/2 -left-4 -translate-y-1/2 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-305 border-slate-300 bg-white shadow-md hover:bg-slate-50 text-slate-700 cursor-pointer transition-all"
          title={isOpen ? "Collapse Access Console" : "Expand Access Console"}
          id="role-console-toggle-tab"
        >
          {isOpen ? <ChevronRight className="w-4.5 h-4.5" /> : <ChevronLeft className="w-4.5 h-4.5" />}
        </button>
      </div>

      {/* Main Drawer Console Panel */}
      <div className="h-full w-full bg-slate-900 border-l-2 border-slate-700 flex flex-col shadow-2xl relative overflow-hidden text-slate-100">
        
        {/* Decorative Grid Line styling for PSU system feeling */}
        <div className="absolute top-0 right-0 p-1 opacity-10 select-none pointer-events-none">
          <span className="text-[9px] font-mono">SYS_CON_189</span>
        </div>

        {isOpen ? (
          <div className="flex-1 flex flex-col justify-between h-full p-4 space-y-4">
            
            {/* Upper Action block */}
            <div className="space-y-4">
              
              {/* Header block with Dark Blue government style tone */}
              <div className="border-b border-slate-700 pb-3 flex items-center gap-2">
                <div className="p-1.5 bg-blue-900 border border-yellow-500 rounded-sm">
                  <Shield className="w-4 h-4 text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-xs font-black uppercase tracking-wider text-white font-mono" id="role-console-title">
                    Role Access Console
                  </h2>
                  <p className="text-[10px] text-slate-400">
                    AIMS HOD Improvised Impersonation Unit
                  </p>
                </div>
              </div>

              {/* Impersonated current session card */}
              <div 
                className={`p-3 border rounded-sm ${
                  isCurrentlyImpersonating 
                    ? 'bg-gradient-to-r from-blue-950 to-indigo-950 border-blue-500' 
                    : 'bg-slate-800 border-slate-700'
                }`}
                id="impersonation-session-card"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-bold font-mono tracking-widest text-slate-400 uppercase">
                    Current View Mode
                  </span>
                  <span className={`w-2 h-2 rounded-full ${isCurrentlyImpersonating ? 'bg-amber-400 animate-ping' : 'bg-green-500'}`}></span>
                </div>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Role:</span>
                    <span className={`font-bold ${isCurrentlyImpersonating ? 'text-amber-400' : 'text-green-400'}`}>
                      {getRoleDisplayName(currentUser.role)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Department:</span>
                    <span className="font-bold text-white max-w-[140px] truncate text-right text-[11px]" title={currentUser.department}>
                      {currentUser.department}
                    </span>
                  </div>
                  {isCurrentlyImpersonating && impersonationState && (
                    <div className="flex justify-between text-[10px] border-t border-slate-800 pt-1.5 mt-1 text-slate-400">
                      <span>Impersonated ID:</span>
                      <span className="font-bold text-blue-300">{impersonationState.impersonatedDept}</span>
                    </div>
                  )}
                </div>

                {isCurrentlyImpersonating && (
                  <button
                    onClick={handleResetClick}
                    className="w-full mt-3 bg-red-700 hover:bg-red-800 text-white font-black text-[10px] uppercase tracking-wider py-1.5 rounded-sm border border-red-600 transition-all cursor-pointer flex items-center justify-center gap-1"
                    id="return-hod-dashboard-btn"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Return to Auditor HOD Dashboard
                  </button>
                )}
              </div>

              {/* Form Input fields */}
              <form onSubmit={handleAccessSubmit} className="space-y-3.5 text-xs">
                
                {/* 1. Role dropdown selection */}
                <div>
                  <label htmlFor="console-role-select" className="block text-[10px] font-mono uppercase tracking-wider font-bold text-slate-300 mb-1">
                    Target Swapped Role:
                  </label>
                  <select 
                    id="console-role-select"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    className="w-full bg-slate-800 border border-slate-700 text-white font-semibold rounded-sm p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none focus:bg-slate-800"
                    required
                  >
                    <option value="Team Lead">{getRoleDisplayName('Team Lead')}</option>
                    <option value="Auditor">{getRoleDisplayName('Auditor')}</option>
                    <option value="Reviewer">{getRoleDisplayName('Reviewer')}</option>
                  </select>
                </div>

                {/* 2. Mandatory Numeric-only 6-digit Department ID input */}
                <div>
                  <label htmlFor="console-dept-input" className="block text-[10px] font-mono uppercase tracking-wider font-bold text-slate-300 mb-1">
                    Target Department ID:
                  </label>
                  <input 
                    id="console-dept-input"
                    type="text"
                    maxLength={6}
                    placeholder="Enter Department ID"
                    value={departmentId}
                    onChange={handleDeptIdChange}
                    className="w-full bg-slate-800 border border-slate-700 text-white font-mono rounded-sm p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder:text-slate-500 placeholder:normal-case"
                    required
                  />
                  <p className="text-[9px] text-slate-400 mt-1 block leading-relaxed italic">
                    Numeric only. Must be exactly 6 digits (e.g. 100001 - 100007).
                  </p>
                </div>

                {/* Messages center alerts */}
                {errorMsg && (
                  <div className="bg-red-950/80 border-l-2 border-red-500 p-2 text-[10px] text-red-300 flex items-start gap-1 rounded-2xs" id="console-error-box">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="bg-emerald-950/80 border-l-2 border-emerald-500 p-2 text-[10px] text-emerald-300 flex items-start gap-1 rounded-2xs" id="console-success-box">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Submit - Access and Reset Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleResetClick}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 py-2 rounded-sm font-bold uppercase tracking-wider text-[10px] cursor-pointer transition-all flex items-center justify-center gap-1"
                    id="console-reset-btn"
                    title="Reset entered values"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 text-white py-2 rounded-sm font-bold uppercase tracking-wider text-[10px] cursor-pointer transition-all flex items-center justify-center gap-1 shadow-md border border-blue-600"
                    id="console-access-btn"
                    title="Initialize impersonation role dashboard"
                  >
                    <LogIn className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Access</span>
                  </button>
                </div>

              </form>

            </div>

            {/* Help Block at the bottom */}
            <div className="bg-slate-850 bg-slate-800/40 p-2.5 rounded border border-slate-800 text-[9.5px] text-slate-400 leading-relaxed font-mono">
              <span className="font-bold text-yellow-400 uppercase flex items-center gap-1.5 mb-1">
                <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                INTEGRATED SECURITY AUDIT
              </span>
              Acting in an impersonated session allows visual tracking of role matrix, findings entry, draft clearance reviews, and outstanding non-conformities under that target department context. Keep log active.
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-6 text-slate-500 select-none">
            <span className="rotate-90 text-[10px] font-extrabold uppercase tracking-widest font-mono text-slate-400 whitespace-nowrap">
              ROLE ACCESS CONSOLE
            </span>
          </div>
        )}

      </div>
    </div>
  );
}
