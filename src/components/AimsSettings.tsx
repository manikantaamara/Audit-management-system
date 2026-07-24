import React, { useState, useEffect } from 'react';
import { Settings, ShieldAlert, Logs, Save, RefreshCcw, UserCheck, Trash2 } from 'lucide-react';
import { User, ActivityLog } from '../types';

interface AimsSettingsProps {
  currentUser: User;
  users: User[];
  onAddUser: (u: Partial<User>) => void;
}

export default function AimsSettings({ currentUser, users, onAddUser }: AimsSettingsProps) {
  const [activeSegment, setActiveSegment] = useState<'profile' | 'users' | 'logs'>('profile');
  
  // Settings profile states
  const [dbBackupInterval, setDbBackupInterval] = useState('24 Hours');
  const [systemAlertEmail, setSystemAlertEmail] = useState('audit-alerts@vizagsteel.com');
  const [concurrencyLimit, setConcurrencyLimit] = useState('150');

  // New admin employee state
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<'Auditor' | 'HOD' | 'Reviewer' | 'Team Lead'>('Auditor');
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState('Internal Audit');
  const [newDesig, setNewDesig] = useState('');

  // Activity log logs state
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Retrieve logs
  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const response = await fetch('/api/logs');
      const data = await response.json();
      setLogs(data);
    } catch {
      console.log('Error acquiring system logs.');
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [activeSegment]);

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newName || !newDesig) {
      alert('Ensure you populate all user profiles completely.');
      return;
    }
    
    onAddUser({
      username: newUsername.toLowerCase(),
      role: newRole,
      name: newName,
      department: newDept,
      designation: newDesig
    });

    alert(`User Account for ${newName} initialized into active sign-on database successfully!`);
    setNewUsername('');
    setNewName('');
    setNewDesig('');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    alert('System settings stored! Changes successfully written to oracle-config-parameters table.');
  };

  return (
    <div id="aims-settings-page" className="p-6 space-y-6 font-sans animate-fade-in">
      
      {/* Configuration Header bar */}
      <div className="bg-white border border-slate-300 p-4 rounded-sm shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-800" />
            AIMS Settings & Identity Management
          </h2>
          <p className="text-xs text-slate-500 font-medium font-sans">Administrate security access credentials, modify automated triggers, and query central auditable user activity ledger.</p>
        </div>
        <div className="flex gap-2">
          <button 
            id="settings-tab-btn-cfg"
            onClick={() => setActiveSegment('profile')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xs transition-all cursor-pointer ${
              activeSegment === 'profile' ? 'bg-blue-800 text-white shadow-xs' : 'bg-slate-105 bg-slate-100 text-slate-750 hover:bg-slate-205 hover:bg-slate-200'
            }`}
          >
            System Configuration
          </button>
          <button 
            id="settings-tab-btn-usr"
            onClick={() => setActiveSegment('users')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xs transition-all cursor-pointer ${
              activeSegment === 'users' ? 'bg-blue-800 text-white shadow-xs' : 'bg-slate-100 text-slate-705 hover:bg-slate-200'
            }`}
          >
            User Management ({users.length})
          </button>
          <button 
            id="settings-tab-btn-logs"
            onClick={() => setActiveSegment('logs')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xs transition-all cursor-pointer ${
              activeSegment === 'logs' ? 'bg-blue-800 text-white shadow-xs' : 'bg-slate-100 text-slate-705 hover:bg-slate-200'
            }`}
          >
            Activity Audit Logs
          </button>
        </div>
      </div>

      {activeSegment === 'profile' && (
        <form onSubmit={handleSaveSettings} className="bg-white border border-slate-300 rounded-sm shadow-md overflow-hidden max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-gov-blue-800 to-blue-900 text-white p-4">
            <span className="text-[10px] font-mono tracking-widest text-slate-300 font-bold uppercase block">SECURE_RESOURCES</span>
            <h3 className="text-sm font-bold">General Oracle DB Link Configuration</h3>
          </div>

          <div className="p-6 space-y-4 font-sans text-xs">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="oracle-input-label block mb-1">Relational Database Backup Schedule</label>
                <select 
                  id="cfg-backup-select"
                  value={dbBackupInterval}
                  onChange={(e) => setDbBackupInterval(e.target.value)}
                  className="oracle-field-value w-full"
                >
                  <option value="1 Hour">Every Hour</option>
                  <option value="12 Hours">Every 12 Hours</option>
                  <option value="24 Hours">Every 24 Hours (Recommended)</option>
                  <option value="Weekly">Weekly Scheduled Pool</option>
                </select>
              </div>
              <div>
                <label className="oracle-input-label block mb-1">Max Concurrency Limits (ERP Gateways)</label>
                <input 
                  id="cfg-concurrency-input"
                  type="number"
                  value={concurrencyLimit}
                  onChange={(e) => setConcurrencyLimit(e.target.value)}
                  className="oracle-field-value w-full" 
                />
              </div>
            </div>

            <div>
              <label className="oracle-input-label block mb-1">System Security Notification Email List</label>
              <input 
                id="cfg-notif-email"
                type="email"
                value={systemAlertEmail}
                onChange={(e) => setSystemAlertEmail(e.target.value)}
                className="oracle-field-value w-full" 
                required
              />
            </div>

            <div className="bg-slate-50 border p-4 text-slate-500 font-sans space-y-1 rounded-sm">
              <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">CVC Audit Secure Protocol Signatures</span>
              <p className="text-[11px] leading-relaxed">
                Security clearance level is automatically aligned to the host container server. Cryptographic handshakes ensure all outwards dispatch letters and PDF certificates are encrypted on transaction completion.
              </p>
            </div>

            <button
              id="cfg-save-btn"
              type="submit"
              className="w-full btn-primary-gov py-2.5 font-bold gap-1.5"
            >
              <Save className="w-4 h-4" />
              COMMIT MODIFICATIONS TO SYSTEM (UPDATE)
            </button>
          </div>
        </form>
      )}

      {activeSegment === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-1 bg-white border border-slate-300 rounded-sm shadow-sm">
            <div className="bg-slate-100 p-3 border-b text-xs font-bold text-slate-800">
              PROVISION NEW PRIVILEGED USER
            </div>
            
            <form onSubmit={handleUserSubmit} className="p-4 space-y-4">
              <div>
                <label className="oracle-input-label block mb-1">Unified Sign-On ID (Username)</label>
                <input 
                  id="usr-mgmt-username"
                  type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)}
                  placeholder="e.g. auditor_sharma" className="oracle-field-value w-full" required 
                />
              </div>
              <div>
                <label className="oracle-input-label block mb-1">User Full Name</label>
                <input 
                  id="usr-mgmt-fullname"
                  type="text" value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="Shri Anurag Sharma" className="oracle-field-value w-full" required 
                />
              </div>
              <div>
                <label className="oracle-input-label block mb-1">Target Department Role Allocation</label>
                <select 
                  id="usr-mgmt-role"
                  value={newRole} onChange={e => setNewRole(e.target.value as any)}
                  className="oracle-field-value w-full text-xs"
                >
                  <option value="Auditor">Field Auditor Representative</option>
                  <option value="HOD">Department HOD Manager</option>
                  <option value="Reviewer">CAE Advisory Reviewer</option>
                  <option value="Team Lead">Team Lead</option>
                </select>
              </div>
              <div>
                <label className="oracle-input-label block mb-1">Work Plant Section Designation / Department</label>
                <input 
                  id="usr-mgmt-desig"
                  type="text" value={newDesig} onChange={e => setNewDesig(e.target.value)}
                  placeholder="e.g. Chief Accountant" className="oracle-field-value w-full" required 
                />
              </div>
              <button 
                id="usr-mgmt-user-submit"
                type="submit" className="w-full btn-primary-gov py-2 mt-2 gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                INSERT USER TRANSACTION
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white border border-slate-300 p-4 rounded-sm shadow-sm">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-widest block mb-3 border-b pb-2">Active Privileged User Directory</span>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="bg-slate-50 border-b text-[10px] uppercase font-bold text-slate-500">
                    <th className="p-2.5">Sign On ID</th>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Assigned Class Role</th>
                    <th className="p-2.5 font-bold">Designation</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {users.map(u => (
                    <tr id={`user-mgmt-row-${u.id}`} key={u.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono text-blue-900 font-bold">{u.username}</td>
                      <td className="p-2.5 font-bold text-slate-900">{u.name}</td>
                      <td className="p-2.5 font-semibold text-[10px]">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full ${
                          u.role === 'Auditor' ? 'bg-indigo-100 text-indigo-900' :
                          u.role === 'Reviewer' ? 'bg-green-100 text-green-900' :
                          u.role === 'Team Lead' ? 'bg-orange-105 bg-orange-100 text-orange-900' :
                          'bg-slate-100 text-slate-700'
                        }`}>{u.role}</span>
                      </td>
                      <td className="p-2.5 text-slate-600 italic">{u.designation} ({u.department})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSegment === 'logs' && (
        <div className="bg-white border border-slate-300 rounded-sm shadow-md overflow-hidden">
          <div className="bg-slate-100 border-b p-4 flex justify-between items-center text-xs font-bold text-slate-800 uppercase">
            <span>AIMS Security System Audit Logs</span>
            <button
              id="logs-refresh-btn"
              onClick={fetchLogs}
              className="flex items-center gap-1 hover:text-blue-800 bg-white border px-2 py-1 rounded cursor-pointer text-[11px]"
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
              Query Oracle Logs DB
            </button>
          </div>

          <div className="p-4">
            <div className="overflow-y-auto max-h-96 border rounded">
              <table className="w-full text-left font-mono text-[11px]">
                <thead>
                  <tr className="bg-slate-50 p-2 border-b text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    <th className="p-3">Reference ID</th>
                    <th className="p-3">Timeline (UTC)</th>
                    <th className="p-3">ID Operator</th>
                    <th className="p-3">Action Completed</th>
                    <th className="p-3 text-right">Target IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-600">
                  {logs.map((log) => (
                    <tr id={`log-item-row-${log.id}`} key={log.id} className="hover:bg-slate-100">
                      <td className="p-3 text-blue-900 font-bold">{log.id}</td>
                      <td className="p-3">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-3 font-semibold text-slate-850 text-slate-800">{log.username} ({log.role})</td>
                      <td className="p-3 text-slate-700 font-medium">{log.action}</td>
                      <td className="p-3 text-right text-slate-400">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
