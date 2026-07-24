import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Clock, Bell, UserCheck, AlertTriangle, 
  ChevronLeft, ChevronRight, CheckCircle2, Pin, Volume2, Plus, 
  Trash2, X, Check, CalendarDays, Edit, HelpCircle, RefreshCw
} from 'lucide-react';

interface RightCalendarPanelProps {
  plans: any[];
  reports: any[];
  paras: any[];
  onUpdatePlan?: (id: string, updates: any) => Promise<void>;
}

export default function RightCalendarPanel({ plans, reports, paras, onUpdatePlan }: RightCalendarPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Set benchmark date dynamically to the live system current date
  const liveDate = new Date();
  const benchmarkYear = liveDate.getFullYear();
  const benchmarkMonthIdx = liveDate.getMonth(); // 0-indexed
  const benchmarkDay = liveDate.getDate();

  // Active viewing date states
  const [currentYear, setCurrentYear] = useState<number>(benchmarkYear);
  const [currentMonth, setCurrentMonth] = useState<number>(benchmarkMonthIdx); // 0-indexed month
  const [selectedDay, setSelectedDay] = useState<number | null>(benchmarkDay);

  // Custom persistent reminders state keyed by "YYYY-MM-DD"
  const [reminders, setReminders] = useState<{ [key: string]: Array<{ id: string; text: string; type: string }> }>({});
  const [newReminderText, setNewReminderText] = useState('');
  const [newReminderType, setNewReminderType] = useState('meeting'); // 'meeting', 'deadline', 'milestone', 'target'

  // Rescheduling state for selected audit from the side panel
  const [reschedulingPlanId, setReschedulingPlanId] = useState<string | null>(null);
  const [reschedStartDate, setReschedStartDate] = useState('');
  const [reschedEndDate, setReschedEndDate] = useState('');
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);

  // Quick Direct Date Scheduler target
  const [quickSchedPlanId, setQuickSchedPlanId] = useState<string | null>(null);

  // Load reminders on initialization
  useEffect(() => {
    try {
      const stored = localStorage.getItem('aims_calendar_reminders');
      if (stored) {
        setReminders(JSON.parse(stored));
      } else {
        // Seed default reminders
        const defaultReminders = {
          '2026-05-28': [{ id: 'seed-1', text: 'AGM audit progress sync with SMS managers (14:30 HR)', type: 'meeting' }],
          '2026-05-29': [{ id: 'seed-2', text: 'Environmental clearance audit submission for Coke Ovens', type: 'deadline' }],
          '2026-06-01': [{ id: 'seed-3', text: 'AIMS Interactive Executive Calendar goes Live!', type: 'milestone' }],
          '2026-06-08': [{ id: 'seed-4', text: 'Brief regulatory targets assessment at GMT Core Room', type: 'target' }],
        };
        setReminders(defaultReminders);
        localStorage.setItem('aims_calendar_reminders', JSON.stringify(defaultReminders));
      }
    } catch (e) {
      console.error("Failed to load local calendar reminders:", e);
    }
  }, []);

  // Save reminders to localStorage
  const saveRemindersToStorage = (updatedReminders: typeof reminders) => {
    setReminders(updatedReminders);
    try {
      localStorage.setItem('aims_calendar_reminders', JSON.stringify(updatedReminders));
    } catch (e) {
      console.error("Failed to save reminders:", e);
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Dynamic grid calculation helpers
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOffset = (year: number, month: number) => {
    // getDay() gives 0 for Sunday, 1 for Monday...
    const firstDay = new Date(year, month, 1).getDay();
    // Wrap to match: Mo, Tu, We, Th, Fr, Sa, Su start
    // If Sunday(0), offset is 6. If Mon(1), offset is 0. If Tue(2), offset is 1...
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
    setSelectedDay(null);
  };

  // Reset to today
  const handleJumpToToday = () => {
    setCurrentYear(benchmarkYear);
    setCurrentMonth(benchmarkMonthIdx);
    setSelectedDay(benchmarkDay);
  };

  const activeDaysCount = getDaysInMonth(currentYear, currentMonth);
  const emptyPrefixCount = getFirstDayOffset(currentYear, currentMonth);

  // Selected date key formatted as YYYY-MM-DD
  const getSelectedDateKey = () => {
    if (selectedDay === null) return '';
    const m = String(currentMonth + 1).padStart(2, '0');
    const d = String(selectedDay).padStart(2, '0');
    return `${currentYear}-${m}-${d}`;
  };

  // Add reminder
  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderText.trim() || selectedDay === null) return;
    
    const key = getSelectedDateKey();
    const dayReminders = reminders[key] || [];
    const newRem = {
      id: `rem-${Date.now()}`,
      text: newReminderText.trim(),
      type: newReminderType
    };

    const updated = {
      ...reminders,
      [key]: [...dayReminders, newRem]
    };

    saveRemindersToStorage(updated);
    setNewReminderText('');
  };

  // Delete reminder
  const handleDeleteReminder = (key: string, id: string) => {
    const list = reminders[key] || [];
    const updatedList = list.filter(r => r.id !== id);
    const updated = {
      ...reminders,
      [key]: updatedList
    };
    if (updatedList.length === 0) {
      delete updated[key];
    }
    saveRemindersToStorage(updated);
  };

  // Extract planned audits overlapping with a specific date
  const getAuditsForDate = (dateString: string) => {
    if (!dateString) return [];
    return plans.filter(p => {
      if (!p.startDate || !p.endDate) return false;
      return dateString >= p.startDate && dateString <= p.endDate;
    });
  };

  // Reschedule Audit Form Submission
  const handleRescheduleSubmit = async (planId: string) => {
    if (!reschedStartDate || !reschedEndDate) {
      alert("Please choose both Start Date and End Date!");
      return;
    }
    if (reschedEndDate < reschedStartDate) {
      alert("Audit End Date cannot precede the Start Date.");
      return;
    }

    if (!onUpdatePlan) {
      alert("Database mutation wrapper is unavailable.");
      return;
    }

    setIsUpdatingDate(true);
    try {
      await onUpdatePlan(planId, {
        startDate: reschedStartDate,
        endDate: reschedEndDate,
        status: 'Approved'
      });
      alert(`Audit [${planId}] rescheduled successfully!`);
      setReschedulingPlanId(null);
    } catch (err) {
      console.error("Failed to reschedule plan:", err);
      alert("Error writing dates to database index.");
    } finally {
      setIsUpdatingDate(false);
    }
  };

  // Initialize schedule form
  const initiateReschedule = (plan: any) => {
    setReschedulingPlanId(plan.id);
    setReschedStartDate(plan.startDate || '');
    setReschedEndDate(plan.endDate || '');
  };

  const selectedDateKey = getSelectedDateKey();
  const auditsOnSelectedDay = getAuditsForDate(selectedDateKey);
  const activeRemindersForSelectedDay = selectedDateKey ? (reminders[selectedDateKey] || []) : [];

  // Filter unscheduled or draft audits to present as quick actionable schedule targets
  const unscheduledAudits = plans.filter(p => !p.startDate || !p.endDate);

  // Dynamic collections for requested specific views
  const dynamicUpcomingAudits = plans
    .filter(p => p.startDate && p.status !== 'Completed')
    .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''))
    .slice(0, 3);

  const dynamicAuditDeadlines = (reports || [])
    .filter(r => r.status !== 'Authorized')
    .map(r => ({
      id: r.id,
      title: r.title,
      reportNo: r.reportNo || r.id,
      department: r.department,
      deadlineDate: r.dateSubmitted || r.dateCreated || '2026-06-15',
    })).slice(0, 3);

  const dynamicDeptVisits = plans
    .filter(p => p.department && p.startDate)
    .map(p => ({
      id: p.id,
      title: p.title,
      department: p.department,
      visitDate: p.startDate,
      teamLead: p.teamLead || 'Senior Auditor'
    })).slice(0, 3);

  if (!isOpen) {
    return (
      <button 
        id="toggle-calendar-panel-collapsed"
        onClick={() => setIsOpen(true)}
        className="w-12 bg-slate-900 border-l border-slate-950 text-indigo-400 hover:text-white flex flex-col items-center py-6 gap-6 cursor-pointer hover:bg-slate-850 transition-all shrink-0 select-none"
        title="Open Executive Calendar Panel"
      >
        <CalendarIcon className="w-5 h-5 animate-bounce" />
        <span className="text-[9px] font-black uppercase tracking-widest font-mono select-none [writing-mode:vertical-lr] text-slate-350">
          Executive Calendar
        </span>
        <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse mt-auto" />
        <Bell className="w-4 h-4 text-rose-400" />
      </button>
    );
  }

  return (
    <aside id="executive-calendar-right-panel" className="w-[325px] bg-slate-900 text-slate-100 flex flex-col border-l border-slate-950 font-sans select-none shrink-0 overflow-y-auto">
      
      {/* 1. Panel Header */}
      <div className="bg-[#1e3a8a] py-3.5 px-4 flex items-center justify-between border-b border-blue-950 text-white shrink-0 shadow-md">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4.5 h-4.5 text-yellow-400 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider font-mono">Executive Roster Grid</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={handleJumpToToday}
            className="text-[9px] font-bold bg-blue-900 text-yellow-300 hover:bg-blue-950 px-1.5 py-0.5 rounded border border-blue-800 cursor-pointer uppercase transition-all"
            title="Reset view to today: June 1, 2026"
          >
            Today
          </button>
          <button 
            id="toggle-calendar-panel-expanded"
            onClick={() => setIsOpen(false)}
            className="p-1 text-slate-300 hover:text-white hover:bg-blue-950 rounded cursor-pointer transition-all"
            title="Collapse Panel"
          >
            <ChevronRight className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1">
        
        {/* 2. DYNAMIC CALENDAR ENGINE WIDGET */}
        <div className="bg-[#0f172a] border border-[#1e293b] p-3 rounded shadow-inner space-y-2.5">
          <div className="flex justify-between items-center bg-slate-950/40 p-1.5 rounded border border-slate-800">
            <span className="text-[10px] font-black tracking-wider text-slate-300 font-mono uppercase">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <div className="flex gap-1">
              <button 
                onClick={handlePrevMonth} 
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer transition-all"
                title="Previous Month"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={handleNextMonth} 
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer transition-all"
                title="Next Month"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Calendar Grid Header (Mon to Sun representation) */}
          <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-slate-500 uppercase tracking-wider">
            <span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span>
          </div>

          {/* Days Grid Rendering */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
            {/* Blanks */}
            {Array.from({ length: emptyPrefixCount }).map((_, i) => (
              <span key={`empty-${i}`} className="p-1 text-slate-700 font-mono select-none">-</span>
            ))}
            
            {/* Real Days of the Active Month */}
            {Array.from({ length: activeDaysCount }).map((_, i) => {
              const dayNum = i + 1;
              const formattedMonth = String(currentMonth + 1).padStart(2, '0');
              const formattedDay = String(dayNum).padStart(2, '0');
              const dayStr = `${currentYear}-${formattedMonth}-${formattedDay}`;

              const isSelected = selectedDay === dayNum;
              const isToday = currentYear === benchmarkYear && currentMonth === benchmarkMonthIdx && dayNum === benchmarkDay;

              // Check if any scheduled audits match this day
              const auditsMatchingDay = getAuditsForDate(dayStr);
              const hasAudits = auditsMatchingDay.length > 0;

              // Check if reminders exist
              const hasReminders = (reminders[dayStr] || []).length > 0;

              return (
                <button
                  id={`calendar-grid-day-${dayNum}`}
                  key={`day-${dayNum}`}
                  onClick={() => {
                    setSelectedDay(dayNum);
                    setReschedulingPlanId(null);
                    setQuickSchedPlanId(null);
                  }}
                  className={`py-1.5 w-full flex flex-col items-center justify-center rounded-sm transition-all relative font-mono cursor-pointer font-bold ${
                    isSelected 
                      ? 'bg-blue-600 text-white font-extrabold shadow-sm scale-102 border border-blue-400' 
                      : isToday 
                        ? 'bg-amber-950 text-amber-300 border border-amber-600 font-extrabold'
                        : 'text-slate-300 hover:bg-slate-850 hover:text-slate-100'
                  }`}
                >
                  <span className="text-[10px]">{dayNum}</span>
                  
                  {/* Indicators Overlay */}
                  <div className="absolute bottom-0.5 flex gap-0.5 justify-center items-center">
                    {hasAudits && (
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" title={`${auditsMatchingDay.length} planned audit active`} />
                    )}
                    {hasReminders && (
                      <span className="w-1 h-1 bg-rose-500 rounded-full" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 📋 Corporate Roster Panels (Upcoming Audits, Audit Deadlines, Department Visits) */}
        <div id="aims-roster-panels" className="space-y-4 bg-[#0f172a] border border-[#1e293b] p-3 rounded shadow-inner select-none font-sans">
          
          {/* Section A: Upcoming Audits */}
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-black uppercase text-amber-400 tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-800 pb-1">
              <CalendarIcon className="w-3.5 h-3.5 text-amber-400" />
              Upcoming Audits ({dynamicUpcomingAudits.length})
            </h4>
            
            {dynamicUpcomingAudits.length > 0 ? (
              <div className="space-y-1.5">
                {dynamicUpcomingAudits.map(ua => (
                  <div key={ua.id} className="bg-slate-950 p-2 rounded border border-slate-800 text-[10px] space-y-1 hover:border-amber-400/40 transition-colors">
                    <div className="flex justify-between items-start">
                      <span className="font-extrabold text-[#94a3b8] font-mono">[{ua.id}]</span>
                      <span className="text-[8.5px] font-mono text-amber-500 bg-amber-500/5 px-1 py-0.2 rounded">
                        {ua.startDate}
                      </span>
                    </div>
                    <p className="text-slate-200 font-bold leading-tight line-clamp-1">{ua.title}</p>
                    <p className="text-[9px] text-slate-400 font-medium">Dept: <strong className="text-slate-300">{ua.department}</strong></p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[9.5px] text-slate-500 italic px-1">No upcoming scheduled audits found.</p>
            )}
          </div>

          {/* Section B: Audit Deadlines */}
          <div className="space-y-1.5 pt-1">
            <h4 className="text-[10px] font-black uppercase text-rose-400 tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-800 pb-1">
              <Bell className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              Audit Deadlines ({dynamicAuditDeadlines.length})
            </h4>
            
            {dynamicAuditDeadlines.length > 0 ? (
              <div className="space-y-1.5">
                {dynamicAuditDeadlines.map(ad => (
                  <div key={ad.id} className="bg-slate-950 p-2 rounded border border-slate-800 text-[10px] space-y-1 hover:border-rose-400/40 transition-colors font-sans">
                    <div className="flex justify-between items-start">
                      <span className="font-extrabold text-[#94a3b8] font-mono text-[9px]">REP-{ad.reportNo}</span>
                      <span className="text-[8.5px] font-mono text-rose-400 bg-rose-500/5 px-1 py-0.2 rounded">
                        Due: {ad.deadlineDate}
                      </span>
                    </div>
                    <p className="text-slate-200 font-bold leading-tight line-clamp-1">{ad.title}</p>
                    <p className="text-[9px] text-slate-400 font-medium">Section: <strong className="text-slate-350">{ad.department}</strong></p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1.5 font-sans">
                <div className="bg-slate-950 p-2 rounded border border-slate-800 text-[10px] space-y-1">
                  <div className="flex justify-between items-start font-sans">
                    <span className="font-extrabold text-[#94a3b8] font-mono">DRAFT-Q1-ENV</span>
                    <span className="text-[8.5px] font-mono text-rose-400 bg-rose-500/5 px-1 py-0.2 rounded">
                      Due: 2026-06-15
                    </span>
                  </div>
                  <p className="text-slate-205 text-slate-200 font-bold leading-tight line-clamp-1 font-sans">Environmental Compliance Report Draft</p>
                  <p className="text-[9px] text-slate-400 font-medium font-sans">Section: <strong className="text-slate-300">Coke Ovens Dept</strong></p>
                </div>
              </div>
            )}
          </div>

          {/* Section C: Department Visits */}
          <div className="space-y-1.5 pt-1">
            <h4 className="text-[10px] font-black uppercase text-sky-400 tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-800 pb-1">
              <CalendarDays className="w-3.5 h-3.5 text-sky-405 text-sky-400" />
              Department Visits ({dynamicDeptVisits.length})
            </h4>
            
            {dynamicDeptVisits.length > 0 ? (
              <div className="space-y-1.5 font-sans">
                {dynamicDeptVisits.map(dv => (
                  <div key={dv.id} className="bg-slate-950 p-2 rounded border border-slate-800 text-[10px] space-y-1 hover:border-sky-400/40 transition-colors font-sans">
                    <div className="flex justify-between items-start font-sans">
                      <span className="font-mono text-sky-455 text-sky-400 text-[8.5px]">{dv.visitDate}</span>
                      <span className="text-[8.5px] text-slate-400 font-bold font-sans">
                        {dv.teamLead}
                      </span>
                    </div>
                    <p className="text-slate-205 text-slate-200 font-bold leading-tight line-clamp-1 font-sans">{dv.department}</p>
                    <p className="text-[9px] text-slate-400 line-clamp-1 font-sans">Field: <span className="text-slate-300 font-semibold">{dv.title}</span></p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[9.5px] text-slate-500 italic px-1 font-sans">No active site visit routes mapped.</p>
            )}
          </div>

        </div>

        {/* 3. DETAILED ACTION SHEET FOR CORRESPONDING DAY */}
        {selectedDay !== null && (
          <div className="space-y-3">
            <div className="bg-slate-850 border border-slate-800 p-3 rounded">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                <span className="text-[10px] text-yellow-400 font-black uppercase tracking-wider font-mono flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Schedules on {monthNames[currentMonth].substring(0, 3)} {selectedDay}, {currentYear}
                </span>
                {selectedDateKey === '2026-06-01' && (
                  <span className="text-[8.5px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded font-mono animate-pulse">
                    LIVE TODAY
                  </span>
                )}
              </div>

              {/* A. Scheduled Audits */}
              <div className="space-y-2">
                <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-wider font-mono">
                  &bull; Scheduled Audit Operations ({auditsOnSelectedDay.length})
                </h4>

                {auditsOnSelectedDay.length > 0 ? (
                  <div className="space-y-2">
                    {auditsOnSelectedDay.map(pa => {
                      const isRescheduling = reschedulingPlanId === pa.id;
                      
                      return (
                        <div key={pa.id} className="bg-slate-905 bg-slate-900/60 p-2 border-l-2 border-blue-500 rounded-xs space-y-1.5">
                          <div className="flex justify-between items-start">
                            <span className="text-[9.5px] font-black text-blue-400 font-mono">[{pa.id}]</span>
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded-full ${
                              pa.status === 'Approved' ? 'bg-green-950 text-green-400 border border-green-900' : 'bg-slate-800 text-slate-350'
                            }`}>
                              {pa.status}
                            </span>
                          </div>
                          
                          <p className="text-[10.5px] font-semibold text-slate-200 leading-tight">{pa.title}</p>
                          
                          <div className="text-[9px] text-slate-450 text-slate-400 space-y-0.5">
                            <p><strong>Dept:</strong> {pa.department}</p>
                            <p><strong>Lead:</strong> {pa.teamLead} ({pa.auditType})</p>
                            <p className="font-mono text-yellow-400"><strong>Period:</strong> {pa.startDate} to {pa.endDate}</p>
                          </div>

                          {/* Reschedule trigger form */}
                          {isRescheduling ? (
                            <div className="bg-slate-950 p-2 mt-1 rounded border border-slate-850 space-y-2">
                              <p className="text-[8.5px] font-bold uppercase text-yellow-400">Change Audit Boundaries:</p>
                              <div className="space-y-1">
                                <label className="text-[8.5px] block text-slate-500 uppercase font-mono">From:</label>
                                <input 
                                  type="date" 
                                  value={reschedStartDate}
                                  onChange={e => setReschedStartDate(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700 text-[10px] px-1.5 py-0.5 rounded text-slate-100"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8.5px] block text-slate-500 uppercase font-mono">To:</label>
                                <input 
                                  type="date" 
                                  value={reschedEndDate}
                                  onChange={e => setReschedEndDate(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-705 border-slate-700 text-[10px] px-1.5 py-0.5 rounded text-slate-100"
                                />
                              </div>
                              <div className="flex gap-1 pt-1.5">
                                <button
                                  type="button"
                                  disabled={isUpdatingDate}
                                  onClick={() => handleRescheduleSubmit(pa.id)}
                                  className="flex-1 bg-green-700 text-white font-bold text-[9px] py-1 rounded hover:bg-green-800 cursor-pointer disabled:opacity-55"
                                >
                                  {isUpdatingDate ? 'Locking...' : 'Lock Date'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setReschedulingPlanId(null)}
                                  className="bg-slate-800 text-[9px] px-2 rounded hover:text-white cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => initiateReschedule(pa)}
                              className="w-full flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-750 text-slate-350 hover:text-white text-[9.5px] py-1 mt-1 rounded font-bold cursor-pointer transition-all border border-slate-700"
                            >
                              <Edit className="w-3 h-3 text-yellow-400" />
                              Update Audit Plan Dates
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 italic px-1">No active corporate audits running today.</p>
                )}
              </div>

              {/* B. Reminders & Note Roster */}
              <div className="space-y-2 mt-4 pt-3 border-t border-slate-800">
                <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-wider font-mono">
                  &bull; Dynamic Notes / Reminders ({activeRemindersForSelectedDay.length})
                </h4>

                {activeRemindersForSelectedDay.length > 0 ? (
                  <div className="space-y-1.5">
                    {activeRemindersForSelectedDay.map(rem => (
                      <div key={rem.id} className="text-[10px] bg-slate-900 p-2 rounded-sm border-l-2 border-rose-500 text-slate-300 flex items-start gap-1 justify-between group">
                        <div className="flex items-start gap-1">
                          <Pin className="w-2.5 h-2.5 shrink-0 text-rose-500 mt-0.5" />
                          <div className="leading-tight">
                            <span className="text-[8.5px] font-extrabold uppercase text-rose-400 block font-mono">{rem.type}</span>
                            <p className="text-slate-205 text-slate-200 font-medium">{rem.text}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteReminder(selectedDateKey, rem.id)}
                          className="text-slate-500 hover:text-rose-405 hover:text-rose-400 p-0.5 cursor-pointer rounded"
                          title="Purge Event"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 italic px-1">No operational roster notes added for this date.</p>
                )}

                {/* Form to submit a dynamic note */}
                <form onSubmit={handleAddReminder} className="space-y-2 pt-2">
                  <div className="flex gap-1.5 items-center">
                    <input 
                      type="text" 
                      value={newReminderText}
                      onChange={(e) => setNewReminderText(e.target.value)}
                      placeholder="Add event reminder text..." 
                      className="flex-1 bg-slate-950 border border-slate-800 rounded text-[10px] px-2 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium placeholder-slate-600"
                    />
                    <button 
                      type="submit" 
                      className="bg-[#1e3a8a] hover:bg-[#1a337a] text-white rounded px-2.5 py-1 text-[10px] font-extrabold cursor-pointer border border-[#172d6b]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex gap-1 justify-between">
                    {['meeting', 'deadline', 'milestone', 'target'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewReminderType(type)}
                        className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                          newReminderType === type 
                            ? 'bg-rose-950 text-rose-350 border border-rose-800 font-black shadow-xs' 
                            : 'bg-slate-950 text-slate-500 hover:bg-slate-850'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </form>
              </div>

            </div>

            {/* C. QUICK UNSCHEDULED BACKLOG - SCHEDULER ENTRY HOOK */}
            {unscheduledAudits.length > 0 && (
              <div className="bg-slate-850 border border-slate-800 p-3 rounded">
                <span className="text-[9.5px] text-emerald-400 font-black uppercase tracking-wider font-mono block mb-1.5">
                  ★ UNPLANNED AUDITS BACKLOG ({unscheduledAudits.length})
                </span>
                
                <div className="space-y-1.5 max-h-[145px] overflow-y-auto">
                  {unscheduledAudits.map(ub => {
                    const isTarget = quickSchedPlanId === ub.id;

                    return (
                      <div key={ub.id} className="bg-[#0f172a] rounded p-2 border border-slate-800 flex flex-col gap-1.5">
                        <div className="flex justify-between items-start">
                          <span className="text-[9.5px] font-bold text-slate-350 font-mono">{ub.id}</span>
                          <span className="text-[8px] bg-slate-900 border border-slate-800 px-1 py-0.2 rounded font-mono text-slate-450 text-slate-400">
                            {ub.department.substring(0, 15)}...
                          </span>
                        </div>
                        <p className="text-[10px] font-semibold text-slate-300 leading-snug">{ub.title}</p>
                        
                        {isTarget ? (
                          <div className="bg-slate-950/60 p-1.5 rounded space-y-2 mt-1 border border-slate-850">
                            <div className="grid grid-cols-2 gap-1.5">
                              <div>
                                <label className="text-[8px] uppercase block text-slate-500 font-mono">Start Date</label>
                                <input 
                                  type="date" 
                                  value={reschedStartDate}
                                  onChange={e => setReschedStartDate(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700 text-[9.5px] p-1 rounded text-slate-100"
                                />
                              </div>
                              <div>
                                <label className="text-[8px] uppercase block text-slate-500 font-mono">End Date</label>
                                <input 
                                  type="date" 
                                  value={reschedEndDate}
                                  onChange={e => setReschedEndDate(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700 text-[9.5px] p-1 rounded text-slate-100"
                                />
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                disabled={isUpdatingDate}
                                onClick={() => handleRescheduleSubmit(ub.id)}
                                className="flex-1 bg-green-700 hover:bg-green-800 font-black text-[9px] py-1 text-white rounded cursor-pointer"
                              >
                                Lock Schedule
                              </button>
                              <button
                                type="button"
                                onClick={() => setQuickSchedPlanId(null)}
                                className="text-[9px] bg-slate-800 hover:bg-slate-750 px-2 rounded cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setQuickSchedPlanId(ub.id);
                              // prefill with currently picked day on the grid
                              const dkey = getSelectedDateKey();
                              setReschedStartDate(dkey);
                              setReschedEndDate(dkey);
                            }}
                            className="bg-emerald-950 text-emerald-400 border border-emerald-900 hover:bg-emerald-900 hover:text-emerald-300 rounded font-black text-[9px] py-1 w-full text-center cursor-pointer transition-all uppercase"
                          >
                            Schedule This Audit
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. REGULATORY ALERTS IN MARGINS */}
        <div className="space-y-1.5 pt-1.5 border-t border-slate-850">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
            VSP Regulatory Target Alerts
          </span>
          <div className="bg-[#1c1917] p-2.5 border border-stone-850 rounded-sm text-[10px] leading-relaxed text-slate-350 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-rose-400 font-mono">
              <Volume2 className="w-3.5 h-3.5 shrink-0 text-rose-400 animate-pulse" />
              <span>CVC TIMELINES ACTIVE</span>
            </div>
            <p>Replies to Special Paras must be committed within 15 calendar days of central registry dispatch logs, else ORA-AUD exception raises auto-red flags.</p>
          </div>
        </div>

      </div>

      {/* 5. Footer Security indicators */}
      <div className="bg-slate-950 p-3.5 border-t border-slate-850 text-center font-mono text-[9px] text-slate-500">
        SYSTEM SECURED BY: GIGABAK-VSP
      </div>

    </aside>
  );
}
