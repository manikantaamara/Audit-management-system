import { useState } from 'react';
import { 
  Calendar, FileText, Reply, Send, Database, BarChart2, BookOpen, 
  ChevronDown, ChevronRight, Landmark, Search, Star, Clock, Heart,
  Folder, File, Users, HeartHandshake, ShieldAlert, Award, ArrowUpRight, Grid, Layout
} from 'lucide-react';

import { UserRole, getRoleDisplayName } from '../types';

interface SidebarProps {
  activeMenu: string;
  onSelectMenu: (menu: string) => void;
  userRole: UserRole;
}

interface SidebarSubItem {
  key: string;
  label: string;
  roles?: string[];
}

interface SidebarItem {
  key: string;
  label: string;
  icon: any;
  subItems: SidebarSubItem[];
}

export default function Sidebar({ activeMenu, onSelectMenu, userRole }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom Oracle forms tree open state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'planning': true,
    'reports_entry': true,
    'replies': true,
    'reply_entry_group': true,
    'dispatch': false,
    'masters': false,
    'knowledge': false,
    'reports': false,
    'tl_lead_assignment': true,
    'tl_monitoring_tracking': true,
    'tl_verification_reviewed': true,
    'tl_terminal_archive': true,
    'rev_advisory_review': true,
    'rev_verification_remarks': true,
    'rev_action_cycles': true,
    'rev_library_reporting': true,
    'aud_execution_console': true,
    'aud_records_entry': true,
    'aud_document_ingestion': true,
    'aud_archives_library': true,
  });

  const toggleSection = (sec: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sec]: !prev[sec]
    }));
  };

  // Dynamically compute Standard Oracle Forms items based on active role
  const getNavItemsByRole = (): SidebarItem[] => {
    if (userRole === 'Team Lead') {
      return [
        {
          key: 'tl_permission_matrix_node',
          label: '🔑 Permissions & Dashboard',
          icon: ShieldAlert,
          subItems: [
            { key: 'role_matrix_dashboard', label: 'TL Action Center & Matrix' },
            { key: 'work_assignment_board', label: '   └── Work Assignment Board' }
          ]
        },
        {
          key: 'tl_lead_assignment',
          label: 'Lead Assignment & Workload',
          icon: Users,
          subItems: [
            { key: 'tl_audit_assignment', label: 'Audit Assignment Terminal' },
            { key: 'tl_team_workload', label: 'Team Workload Management' },
            { key: 'tl_team_perf', label: 'Team Performance Reports' }
          ]
        },
        {
          key: 'tl_monitoring_tracking',
          label: 'Audit Monitoring & Status',
          icon: Grid,
          subItems: [
            { key: 'tl_audit_monitoring', label: 'Audit Monitoring Console' },
            { key: 'tl_status_tracking', label: 'Audit Status Tracking' },
            { key: 'tl_pending_audits', label: 'Pending Audits Ledger' }
          ]
        },
        {
          key: 'tl_records_entry',
          label: 'Records & Entry Forms',
          icon: FileText,
          subItems: [
            { key: 'tl_report_entry', label: 'Report Entry' }
          ]
        },
        {
          key: 'tl_verification_reviewed',
          label: 'Report Verification Panel',
          icon: Award,
          subItems: [
            { key: 'tl_verify_reports', label: 'Verification of Reviewed Reports' },
            { key: 'tl_pending_reviews', label: 'Pending Reviews Tracker' }
          ]
        },
        {
          key: 'reply_entry_group',
          label: 'Reply Entry',
          icon: Reply,
          subItems: [
            { key: 'report_preview_pdf', label: 'Report Preview & PDF Generator' },
            { key: 'conversion_history', label: 'Conversion History' }
          ]
        }
      ];
    }

    if (userRole === 'Reviewer') {
      return [
        {
          key: 'rev_permission_matrix_node',
          label: '🔑 Permissions & Dashboard',
          icon: ShieldAlert,
          subItems: [
            { key: 'role_matrix_dashboard', label: 'Department HOD Admin Matrix' },
            { key: 'work_assignment_board', label: '   └── Work Assignment Board' }
          ]
        },
        {
          key: 'rev_advisory_review',
          label: 'Advisory Review Console',
          icon: Award,
          subItems: [
            { key: 'rev_dashboard', label: 'Review Dashboard Summary' },
            { key: 'rev_pending_alerts', label: 'Pending Reviews Alert Node' },
            { key: 'rev_report_review', label: 'Audit Report Review Term' }
          ]
        },
        {
          key: 'rev_records_entry',
          label: 'Records & Entry Forms',
          icon: FileText,
          subItems: [
            { key: 'rev_report_entry', label: 'Report Entry' }
          ]
        },
        {
          key: 'rev_verification_remarks',
          label: 'Verification & Remarks',
          icon: FileText,
          subItems: [
            { key: 'rev_entry', label: 'Review Entry Form' },
            { key: 'rev_evidence_verify', label: 'Evidence Verification' },
            { key: 'rev_remarks_entry', label: 'Review Remarks Node' }
          ]
        },
        {
          key: 'rev_action_cycles',
          label: 'Action & Cycle Management',
          icon: Reply,
          subItems: [
            { key: 'rev_correction_requests', label: 'Correction Requests' },
            { key: 'rev_re_review', label: 'Re-Review Lifecycle Control' },
            { key: 'rev_history', label: 'Review History Audit Trail' }
          ]
        },
        {
          key: 'reply_entry_group',
          label: 'Reply Entry',
          icon: Reply,
          subItems: [
            { key: 'report_preview_pdf', label: 'Report Preview & PDF Generator' },
            { key: 'conversion_history', label: 'Conversion History' }
          ]
        }
      ];
    }

    if (userRole === 'Auditor') {
      return [
        {
          key: 'aud_permission_matrix_node',
          label: '🔑 Permissions & Dashboard',
          icon: ShieldAlert,
          subItems: [
            { key: 'role_matrix_dashboard', label: 'Auditor Action Center & Matrix' },
            { key: 'work_assignment_board', label: '   └── Work Assignment Board' }
          ]
        },
        {
          key: 'planning',
          label: 'Audit Planning',
          icon: Calendar,
          subItems: [
            { key: 'annual_plans', label: 'Annual Plan Generation' },
            { key: 'yearly_planning', label: 'Yearly Planning' },
            { key: 'tour_proposals', label: 'Tour Proposal' },
            { key: 'schedule_planning', label: 'Schedule Planning' },
            { key: 'generated_audit_calendar', label: '   └── Generated Audit Calendar' }
          ]
        },
        {
          key: 'aud_execution_console',
          label: 'Auditor Execution Console',
          icon: ShieldAlert,
          subItems: [
            { key: 'aud_assigned_audits', label: 'Assigned Audits Ledger' },
            { key: 'aud_execution', label: 'Audit Execution Module' },
            { key: 'aud_status_tracking', label: 'Audit Status Tracking Registry' }
          ]
        },
        {
          key: 'aud_records_entry',
          label: 'Records & Entry Forms',
          icon: FileText,
          subItems: [
            { key: 'aud_report_entry', label: 'Report Entry Terminal' },
            { key: 'aud_reply_entry', label: 'Reply Entry Component' },
            { key: 'aud_rework_requests', label: 'Rework Requests Redressal' }
          ]
        },
        {
          key: 'aud_document_ingestion',
          label: 'Document Ingestion Vault',
          icon: Send,
          subItems: [
            { key: 'aud_upload_evidence', label: 'Upload Evidence Records' },
            { key: 'aud_upload_docs', label: 'Upload Documents Hub' }
          ]
        },
        {
          key: 'reply_entry_group',
          label: 'Reply Entry',
          icon: Reply,
          subItems: [
            { key: 'report_preview_pdf', label: 'Report Preview & PDF Generator' },
            { key: 'conversion_history', label: 'Conversion History' }
          ]
        }
      ];
    }

    // Default HOD (has all groups)
    return [
      {
        key: 'hod_permission_matrix_node',
        label: '🔑 Permissions & Dashboard',
        icon: ShieldAlert,
        subItems: [
          { key: 'role_matrix_dashboard', label: 'Auditor HOD Executive Matrix' },
          { key: 'work_assignment_board', label: '   └── Work Assignment Board' }
        ]
      },
      {
        key: 'planning',
        label: 'Audit Planning (HOD Only)',
        icon: Calendar,
        subItems: [
          { key: 'annual_plans', label: 'Annual Plan Generation' },
          { key: 'yearly_planning', label: 'Yearly Planning' },
          { key: 'schedule_planning', label: 'Schedule Planning' },
          { key: 'previous_audit_data', label: 'Previous Audit Data' }
        ]
      },
      {
        key: 'reports_entry',
        label: 'Audit Reports Entry',
        icon: FileText,
        subItems: [
          { key: 'upload_jpg_word_pdf', label: 'Upload JPG/WORD/PDF Report' },
          { key: 'pending_reports', label: 'Still Pending for Upload Report' },
          { key: 'status_transfer', label: 'Status of Transfer' },
          { key: 'show_reports_status', label: 'Show Reports Status' },
          { key: 'check_swap_role', label: 'Check/Swap Role' }
        ]
      },
      {
        key: 'replies',
        label: 'Reply Entry',
        icon: Reply,
        subItems: [
          { key: 'reply_details', label: 'Reply Details Entry Screen' },
          { key: 'reply_marking', label: 'Reply Marking' },
          { key: 'reply_remarking', label: 'Reply Re-Marking (Correction)' },
          { key: 'audits_list', label: 'Audits List' },
          { key: 'report_preview_pdf', label: 'Report Preview & PDF Generator' },
          { key: 'conversion_history', label: 'Conversion History' }
        ]
      },
      {
        key: 'dispatch',
        label: 'Dispatch Terminal',
        icon: Send,
        subItems: [
          { key: 'dispatch_tracking', label: 'Dispatch Tracking' },
          { key: 'dispatch_status', label: 'Dispatch Status' }
        ]
      },
      {
        key: 'masters',
        label: 'Master Maintenance',
        icon: Database,
        subItems: [
          { key: 'code_master', label: 'Code Master Maintenance' },
          { key: 'programs_master', label: 'Audit Program Master' },
          { key: 'employee_master', label: 'Employee Master' },
          { key: 'department_master', label: 'Department Master' },
          { key: 'dak_initializer', label: 'Dak Number Initialization' },
          { key: 'excel_import', label: 'AIMS Master Data Import' }
        ]
      },
      {
        key: 'reports',
        label: 'Reports System',
        icon: BarChart2,
        subItems: [
          { key: 'para_history', label: 'Audit Para History' },
          { key: 'para_history_dir', label: 'Audit Para History - Directorate Wise' },
          { key: 'paras_listing', label: 'Paras Listing' },
          { key: 'pending_paras_listing', label: 'Pending Paras Listing' },
          { key: 'dir_pending_summary', label: 'Directorate Wise Pending Paras Summary Memo' },
          { key: 'dir_settled_memo', label: 'Directorate Wise Paras Settled Memo' },
          { key: 'pending_paras_detail', label: 'Pending Paras Detail Report' },
          { key: 'dir_paras_period', label: 'Directorate Wise Paras Details During a Period' },
          { key: 'exception_dates', label: 'Exception Report Between Dates' },
          { key: 'reports_pending', label: 'Reports Pending' },
          { key: 'reviews_pending', label: 'Reviews Pending' },
          { key: 'audit_prog_master', label: 'Audit Programme Master' }
        ]
      }
    ];
  };

  const navItems = getNavItemsByRole();

  // Side list for Allied Oracle Applications exactly as requested
  const alliedApps = [
    { key: 'app_aime_3_tier', label: 'AIMS 3 Tier Production System', color: 'text-sky-400' },
    { key: 'app_attendance', label: 'Daily Attendance Recording System', color: 'text-amber-400' },
    { key: 'app_assets', label: 'IT Assets Management System', color: 'text-emerald-400' },
    { key: 'app_qms', label: 'IT QMS Tools', color: 'text-pink-400' },
    { key: 'app_oasis', label: 'OASIS System', color: 'text-teal-400' },
    { key: 'app_health', label: 'Occupational Health Management', color: 'text-red-400' },
    { key: 'app_bills', label: 'Online Medical Bills Tracking System', color: 'text-purple-400' },
    { key: 'app_quality_circles', label: 'Quality Circles Management System', color: 'text-orange-400' }
  ];

  // We filter deep nested items based on the search query
  const filteredNavItems = navItems.map(item => {
    const matchedSubItems = item.subItems.filter(sub => 
      sub.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return {
      ...item,
      subItems: matchedSubItems
    };
  }).filter(item => item.subItems.length > 0);

  return (
    <div className="flex shrink-0 min-h-full border-r border-[#cbd5e1] select-none font-sans">
      
      {/* 1. FAR LEFT SIDE PANEL: Oracle Applications Side Panel (SSO & Favorites) */}
      <aside className="w-[60px] bg-slate-900 flex flex-col items-center py-4 border-r border-slate-950 gap-5 shrink-0">
        <div className="flex flex-col items-center gap-1 mb-2">
          <Landmark className="w-6 h-6 text-yellow-500" />
          <span className="text-[7.5px] text-slate-300 font-bold uppercase tracking-widest font-mono text-center">RINL SSO</span>
        </div>

        {/* Dynamic Collapse Handle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 px-1.5 rounded bg-blue-950 text-yellow-400 border border-blue-800 hover:text-white hover:bg-blue-900 transition-all cursor-pointer shadow-sm text-[10px] flex items-center justify-center font-mono font-bold leading-none animate-pulse-subtle"
          title={collapsed ? "Expand navigation tree menu" : "Collapse navigation tree menu"}
        >
          {collapsed ? '▶' : '◀'}
        </button>

        {/* Small grouping icons for Visited/Favorites */}
        <div className="flex flex-col gap-2 w-full px-1 border-b border-slate-800 pb-3">
          <button 
            id="allied-quick-btn-most"
            onClick={() => { onSelectMenu('dashboard'); alert('Displaying most visited analytics panel.'); }}
            className={`p-2 rounded-xs hover:bg-slate-850 flex flex-col items-center text-slate-400 hover:text-white cursor-pointer group`}
            title="Most Visited Programs"
          >
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-[7.5px] mt-0.5 scale-90 group-hover:block uppercase tracking-tight font-extrabold text-[7px]">MOST</span>
          </button>
          
          <button 
            id="allied-quick-btn-fav"
            onClick={() => { onSelectMenu('dashboard'); alert('Oracle Favorite Forms initialized. Right-click any menu node to add a favorite.'); }}
            className="p-2 rounded-xs hover:bg-slate-850 flex flex-col items-center text-slate-400 hover:text-white cursor-pointer group"
            title="My Favorites"
          >
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-[7.5px] mt-0.5 scale-90 uppercase tracking-tight font-extrabold text-[7px]">FAV</span>
          </button>

          <button 
            id="allied-quick-btn-recent"
            onClick={() => { onSelectMenu('dashboard'); }}
            className="p-2 rounded-xs hover:bg-slate-850 flex flex-col items-center text-slate-400 hover:text-white cursor-pointer group"
            title="Recent Visited Forms"
          >
            <Heart className="w-4 h-4 text-rose-400" />
            <span className="text-[7.5px] mt-0.5 scale-90 uppercase tracking-tight font-extrabold text-[7px]" >RECENT</span>
          </button>
        </div>

        {/* Oracle Allied Applications Icons List */}
        <div className="flex-1 flex flex-col gap-3 w-full px-1 items-center overflow-y-auto">
          <p className="text-[7.5px] text-slate-450 text-slate-500 font-extrabold tracking-wider text-center uppercase">ALLIED</p>
          
          {alliedApps.map((app) => (
            <button
              id={`allied-app-btn-${app.key}`}
              key={app.key}
              onClick={() => onSelectMenu(app.key)}
              className={`p-2.5 rounded-sm flex flex-col items-center justify-center transition-all cursor-pointer text-center relative w-11 h-11 border ${
                activeMenu === app.key
                  ? 'bg-blue-900 border-yellow-500 text-white shadow-sm font-bold'
                  : 'bg-slate-850 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={app.label}
            >
              <Layout className="w-4 h-4" />
              <span className="text-[6.5px] scale-90 font-black tracking-tighter mt-1 block uppercase leading-none overflow-hidden text-ellipsis w-10 truncate font-mono">
                {app.key.replace('app_', '').substring(0, 4)}
              </span>
            </button>
          ))}
        </div>

        {/* Version Code info */}
        <div className="mt-auto pt-2 text-center select-none font-mono text-[8px] text-slate-600 font-bold border-t border-slate-800 w-full">
          V12.2c
        </div>
      </aside>

      {/* 2. MAIN ORACLE FORMS TREE MENU PATH (Light Gray Layout with Government PSU aesthetic) */}
      <aside className={`${collapsed ? 'w-0 border-r-0' : 'w-[270px] border-r border-[#cbd5e1]'} bg-[#f8fafc] flex flex-col text-slate-800 overflow-hidden transition-all duration-300 font-sans`}>
        
        {/* Navigation Head / Title */}
        <div className="bg-[#1e3a8a] text-white px-3.5 py-3 flex items-center justify-between border-b border-blue-900 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-3 bg-yellow-400 rounded-xs" />
            <div>
              <p className="text-[10px] font-bold text-slate-300 font-mono tracking-widest uppercase">Oracle forms</p>
              <p className="text-[12px] font-black uppercase tracking-normal">AIMS Tree Navigator</p>
            </div>
          </div>
          <button 
            id="sidebar-vsp-dashboard-home-btn"
            onClick={() => onSelectMenu('dashboard')}
            className="hover:scale-105 transition-all text-[11px] bg-blue-950 px-2 py-0.5 rounded-sm border border-blue-800 font-bold text-white uppercase text-center shrink-0 cursor-pointer shadow-3xs"
          >
            Dashboard
          </button>
        </div>

        {/* Interactive Search Tool Filter */}
        <div className="p-2 bg-[#f1f5f9] border-b border-[#e2e8f0] shrink-0">
          <div className="relative">
            <input
              id="oracle-forms-menu-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter menu nodes (e.g. 'Para')"
              className="w-full text-[11px] pl-7 pr-2.5 py-1.5 bg-white border border-[#cbd5e1] text-slate-800 placeholder-slate-400 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Tree Navigator Folders */}
        <div className="flex-1 overflow-y-auto py-2.5 text-xs font-sans">
          <div className="space-y-1.5 px-2">
            
            {filteredNavItems.length === 0 ? (
              <div className="text-center py-10 font-mono text-[10px] text-slate-400 italic">
                Node key not matched.
              </div>
            ) : (
              filteredNavItems.map((item) => {
                const IconComponent = item.icon;
                const isSectionOpen = openSections[item.key] || searchQuery.length > 0;
                
                return (
                  <div key={item.key} className="border border-[#e2e8f0] rounded-sm bg-white overflow-hidden shadow-3xs" id={`sidemenu-folder-${item.key}`}>
                    {/* Header trigger button with Folder style */}
                    <button
                      id={`sidebar-folder-trigger-${item.key}`}
                      onClick={() => toggleSection(item.key)}
                      className="w-full text-left px-3 py-2 bg-[#f8fafc] hover:bg-[#f1f5f9] border-b border-[#f1f5f9] flex items-center justify-between text-slate-800 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2 font-bold uppercase tracking-wide text-[10.5px] text-[#1e3a8a]">
                        <Folder className="w-3.5 h-3.5 text-yellow-500 fill-yellow-250 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      <div className="text-slate-500 font-mono">
                        {isSectionOpen ? '-' : '+'}
                      </div>
                    </button>

                    {/* Subitems Tree */}
                    {isSectionOpen && (
                      <div className="bg-white py-1 text-[11px]" id={`sidemenu-leaf-nodes-${item.key}`}>
                        {item.subItems.map((sub) => {
                          const isSelected = activeMenu === sub.key;
                          return (
                            <button
                              id={`sidebar-leaf-node-btn-${sub.key}`}
                              key={sub.key}
                              onClick={() => {
                                onSelectMenu(sub.key);
                              }}
                              className={`w-full text-left px-4 py-1.5 hover:bg-[#f1f7ff] border-b border-slate-50 flex items-center gap-2 font-sans font-medium transition-all group ${
                                isSelected 
                                  ? 'bg-blue-50 text-[#1e3a8a] font-bold border-l-[3px] border-[#1e3a8a]' 
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              <File className={`w-3 h-3 shrink-0 ${isSelected ? 'text-blue-700' : 'text-slate-400'}`} />
                              <span className="leading-snug truncate">
                                {sub.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}

          </div>
        </div>

        {/* Oracle Station Info card footer */}
        <div className="p-2.5 bg-[#f1f5f9] border-t border-[#cbd5e1] text-[9.5px] font-mono text-slate-500 space-y-1 shrink-0 select-none">
          <div className="flex justify-between font-bold">
            <span className="text-[#1d4ed8]">ROLE DEPLOYMENT:</span>
            <span className="text-slate-800">{userRole}</span>
          </div>
          <p className="text-[9.5px] leading-tight">NODE AUTH: VSP-CORE-SSO-77</p>
        </div>

      </aside>

    </div>
  );
}
