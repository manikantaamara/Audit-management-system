import { useState, useEffect } from 'react';
import { LogOut, Bell, Shield, Layers, HelpCircle, HardDrive } from 'lucide-react';
import { User, UserRole, getRoleDisplayName } from '../types';

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
  onChangeRole: (newRole: UserRole) => void;
  customNotifications?: Array<{ id: string; text: string; time: string }>;
}

export default function Header({ currentUser, onLogout, onChangeRole, customNotifications = [] }: HeaderProps) {
  const [timeStr, setTimeStr] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(d.toLocaleDateString() + ' ' + d.toLocaleTimeString());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const defaultNotifs = [
    { id: 'dn-1', text: "Revised Para 1.2 marked to MM Dept requires active classification update.", time: "10 mins ago" },
    { id: 'dn-2', text: "Audit Plan PLN-2026-002 submitted to CAE Review Board.", time: "1 hour ago" },
    { id: 'dn-3', text: "CVC Memo 44 guideline document uploaded into Knowledge Bank.", time: "Yesterday" }
  ];

  const allNotifications = [...customNotifications, ...defaultNotifs].filter((n: any) => {
    if (n.targetRole) {
      if (currentUser.role === 'Auditor' && n.targetRole === 'Auditor') return true;
      if (currentUser.role === 'Reviewer' && n.targetRole === 'Reviewer') return true;
      if (currentUser.role === 'Team Lead' && n.targetRole === 'Team Leader') return true;
      return false;
    }
    return true;
  });

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-[1000] bg-gradient-to-r from-gov-blue-900 via-gov-blue-800 to-indigo-950 border-b-2 border-yellow-500 text-white flex items-center justify-between px-6 py-2.5 shadow-md">
      
      {/* Branding */}
      <div className="flex items-center gap-3">
        <div className="bg-white p-1 rounded-sm shadow-sm hidden sm:block">
          <img 
            src="/src/assets/images/aims_gov_emblem_1779951913381.png" 
            alt="RINL Emblem" 
            className="h-8 w-8 object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="bg-yellow-400 font-mono text-black text-[9px] px-1 py-0.2 rounded-xs font-bold leading-tight">PSU-AIMS</span>
            <span className="text-xs font-semibold tracking-wider text-slate-300">INTERNAL AUDIT DIVISION</span>
          </div>
          <h1 className="text-sm sm:text-base font-bold tracking-tight text-white uppercase sm:block">
            RINL - Visakhapatnam Steel Plant
          </h1>
        </div>
      </div>

      {/* System Status Indicators & Active Role Controls */}
      <div className="flex items-center gap-4">
        
        {/* Real-time Clock */}
        <div className="hidden lg:flex flex-col text-right font-mono text-[11px] border-r border-blue-800 pr-4 text-blue-200">
          <span>STATION GATEWAY: 10.210.45.18</span>
          <span className="text-yellow-300 font-medium">{timeStr}</span>
        </div>



        {/* Active Role Swap Controller (Sec. 3B - Check/Swap Role) */}
        <div className="flex items-center gap-1.5 bg-blue-950/80 border border-blue-700/60 px-2 py-1 rounded-sm">
          <Layers className="w-3.5 h-3.5 text-yellow-300" />
          <span className="text-[10px] font-bold uppercase text-slate-300 hidden sm:inline">Role:</span>
          <select 
            id="role-swapper-menu"
            value={currentUser.role}
            onChange={(e) => onChangeRole(e.target.value as UserRole)}
            className="bg-transparent text-[11px] font-bold text-white focus:outline-none cursor-pointer"
            title="Swap perspective immediately to test specific module permissions"
          >
            <option value="HOD" className="bg-slate-800 text-white font-bold">{getRoleDisplayName('HOD')} (SMS/CO/FIN)</option>
            <option value="Team Lead" className="bg-slate-800 text-white font-bold">{getRoleDisplayName('Team Lead')} (AGM Satyanarayana)</option>
            <option value="Reviewer" className="bg-slate-800 text-white font-bold">{getRoleDisplayName('Reviewer')} (CAE Bose)</option>
            <option value="Auditor" className="bg-slate-800 text-white font-bold">{getRoleDisplayName('Auditor')} (Smt. Lakshmi)</option>
          </select>
        </div>

        {/* Notifications Panel */}
        <div className="relative">
          <button 
            id="notification-bell-btn"
            onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }}
            className="p-1.5 hover:bg-white/10 rounded-full transition-all relative cursor-pointer"
          >
            <Bell className="w-4.5 h-4.5 text-blue-100" />
            {allNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-[9px] font-bold text-white w-4 h-4 rounded-full flex items-center justify-center">
                {allNotifications.length}
              </span>
            )}
          </button>

          {showNotif && (
            <div id="aims-notification-dropdown" className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-300 shadow-xl rounded-sm z-50 text-slate-800">
              <div className="bg-slate-100 border-b border-slate-200 py-2 px-3 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">System Notifications</span>
                <span className="text-[10px] font-bold text-blue-700 uppercase">{allNotifications.length} Pending</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {allNotifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-slate-50 transition-all">
                    <p className="text-xs text-slate-705 text-slate-700 leading-relaxed font-sans">{n.text}</p>
                    <span className="text-[10px] font-medium text-slate-400 block mt-1 font-mono">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Badge Profile Dropdown */}
        <div className="relative">
          <button 
            id="user-profile-toggle"
            onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}
            className="flex items-center gap-2 hover:bg-white/10 p-1.5 rounded-sm transition-all text-left cursor-pointer"
          >
            <div className="bg-blue-900 border border-yellow-500 rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold text-white shadow-sm font-mono uppercase">
              {currentUser.username[0]}
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-bold leading-none text-white">{currentUser.name}</p>
              <p className="text-[9px] text-blue-200 leading-none mt-1 font-semibold">{currentUser.designation}</p>
            </div>
          </button>

          {showProfile && (
            <div id="aims-user-dropdown" className="absolute right-0 mt-2.5 w-60 bg-white border border-slate-300 shadow-xl rounded-sm z-50 text-slate-800">
              <div className="p-4 border-b border-slate-200">
                <p className="text-xs font-bold text-slate-800">{currentUser.name}</p>
                <p className="text-[11px] text-slate-500">{currentUser.designation}</p>
                <span className="inline-block bg-blue-100 text-blue-800 text-[9px] font-bold px-2 py-0.5 rounded-full mt-2 uppercase font-mono tracking-wider">
                  {getRoleDisplayName(currentUser.role)} PRIVILEGES
                </span>
              </div>
              <div className="py-1">
                <div className="px-4 py-2 text-[11px] text-slate-400 uppercase font-bold tracking-wider">Departmental Node</div>
                <div className="px-4 text-xs font-bold text-slate-700 pb-2 border-b border-slate-100">{currentUser.department}</div>
                <button
                  id="user-logout-btn"
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-700 hover:bg-neutral-100 text-left cursor-pointer transition-all font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out of Gateway
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </header>
  );
}
