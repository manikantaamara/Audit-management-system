import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter, Printer, Download,
  RefreshCw, Info, CheckCircle2, User, Building, Clock, MapPin, Search, Grid, Eye
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Rebuilt calendar schedule schema for visual events
interface CalendarEvent {
  id: string;
  deptId: string;
  deptName: string;
  deptHead: string;
  category: string;
  auditor: string;
  plannedDate: string; // YYYY-MM-DD
  durationDays: number;
  status: 'Planned' | 'Assigned' | 'In Progress' | 'Completed';
  priority: 'High' | 'Medium' | 'Low';
  cycle: string;
}

export default function GeneratedAuditCalendar() {
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(5); // June (0-indexed 5)

  // Pre-populated realistic audit events corresponding to active cycles
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: 'AUD-CAL-301',
      deptId: '100001',
      deptName: 'SMS Department',
      deptHead: 'Shri S. Raghavan',
      category: 'Operations',
      auditor: 'Smt. P. Lakshmi',
      plannedDate: '2026-06-03',
      durationDays: 3,
      status: 'Assigned',
      priority: 'High',
      cycle: '1 Month'
    },
    {
      id: 'AUD-CAL-302',
      deptId: '100002',
      deptName: 'Coke Ovens',
      deptHead: 'Shri V. K. Sharma',
      category: 'Fuel & Coal',
      auditor: 'Shri K. Somasekhar',
      plannedDate: '2026-06-10',
      durationDays: 4,
      status: 'In Progress',
      priority: 'High',
      cycle: '2 Months'
    },
    {
      id: 'AUD-CAL-303',
      deptId: '100003',
      deptName: 'Power Plant',
      deptHead: 'Dr. A. K. Banerjee',
      category: 'Utility Operations',
      auditor: 'Smt. P. Lakshmi',
      plannedDate: '2026-06-15',
      durationDays: 2,
      status: 'Planned',
      priority: 'Medium',
      cycle: '3 Months'
    },
    {
      id: 'AUD-CAL-304',
      deptId: '100004',
      deptName: 'Mechanical Maintenance',
      deptHead: 'Shri M. N. Rao',
      category: 'Engineering Services',
      auditor: 'Shri J.C. Bose',
      plannedDate: '2026-06-22',
      durationDays: 5,
      status: 'Planned',
      priority: 'Medium',
      cycle: '6 Months'
    },
    {
      id: 'AUD-CAL-305',
      deptId: '100006',
      deptName: 'Blast Furnace',
      deptHead: 'Shri D. K. Sahoo',
      category: 'Core Operations',
      auditor: 'Shri K. Somasekhar',
      plannedDate: '2026-06-08',
      durationDays: 4,
      status: 'Assigned',
      priority: 'High',
      cycle: '2 Months'
    },
    {
      id: 'AUD-CAL-306',
      deptId: '100007',
      deptName: 'Rolling Mills',
      deptHead: 'Shri S. K. Nayak',
      category: 'Production Rolling',
      auditor: 'Shri J.C. Bose',
      plannedDate: '2026-06-18',
      durationDays: 3,
      status: 'In Progress',
      priority: 'High',
      cycle: '3 Months'
    },
    {
      id: 'AUD-CAL-307',
      deptId: '100009',
      deptName: 'Oxygen Plant',
      deptHead: 'Shri R. K. Sen',
      category: 'Gas Utility',
      auditor: 'Shri K. Somasekhar',
      plannedDate: '2026-06-25',
      durationDays: 2,
      status: 'Planned',
      priority: 'Low',
      cycle: '1 Month'
    },
    {
      id: 'AUD-CAL-308',
      deptId: '100005',
      deptName: 'Utilities Department',
      deptHead: 'Shri P. Vasubabu',
      category: 'Water & Power Services',
      auditor: 'Smt. P. Lakshmi',
      plannedDate: '2026-05-12',
      durationDays: 3,
      status: 'Completed',
      priority: 'Medium',
      cycle: '1 Month'
    },
    {
      id: 'AUD-CAL-309',
      deptId: '100008',
      deptName: 'Central Stores',
      deptHead: 'Shri T. K. Roy',
      category: 'Materials Inventory',
      auditor: 'Smt. P. Lakshmi',
      plannedDate: '2026-05-20',
      durationDays: 4,
      status: 'Completed',
      priority: 'Medium',
      cycle: '12 Months'
    }
  ]);

  // Filters State
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [auditorFilter, setAuditorFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected event for detail spotlight overlay
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Re-generate loading simulation
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string>('');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchStatus = statusFilter === 'All' || e.status === statusFilter;
      const matchAuditor = auditorFilter === 'All' || e.auditor === auditorFilter;
      const matchSearch = searchQuery === '' || 
        e.deptName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.deptId.includes(searchQuery) ||
        e.auditor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchAuditor && matchSearch;
    });
  }, [events, statusFilter, auditorFilter, searchQuery]);

  // Selected element detail matching
  const activeEventDetails = useMemo(() => {
    return events.find(e => e.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Build high-performance monthly grid matrix array
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const cells = [];
    
    // Previous month trailing buffer cells
    const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({
        dayNumber: prevMonthTotalDays - i,
        isCurrentMonth: false,
        fullDateStr: `${currentMonth === 0 ? currentYear - 1 : currentYear}-${String(currentMonth === 0 ? 12 : currentMonth).padStart(2, '0')}-${String(prevMonthTotalDays - i).padStart(2, '0')}`
      });
    }

    // Current month active cells
    for (let i = 1; i <= totalDaysInMonth; i++) {
      cells.push({
        dayNumber: i,
        isCurrentMonth: true,
        fullDateStr: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      });
    }

    // Next month starting leading buffer cells
    const remainingSlots = 42 - cells.length; // standard 6-row calendar has 42 cells
    for (let i = 1; i <= remainingSlots; i++) {
      cells.push({
        dayNumber: i,
        isCurrentMonth: false,
        fullDateStr: `${currentMonth === 11 ? currentYear + 1 : currentYear}-${String(currentMonth === 11 ? 1 : currentMonth + 2).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      });
    }

    return cells;
  }, [currentYear, currentMonth]);

  // Maps events specific to a day
  const getEventsForDay = (dateStr: string) => {
    return filteredEvents.filter(e => {
      // Simple exact match or spans over duration
      if (e.plannedDate === dateStr) return true;
      
      const eventTime = new Date(e.plannedDate).getTime();
      const cellTime = new Date(dateStr).getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;
      const endTime = eventTime + (e.durationDays - 1) * oneDayMs;
      
      return cellTime >= eventTime && cellTime <= endTime;
    });
  };

  // Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  // Mock Calendar Automated Generator Execution Flow
  const handleRegenerateCalendar = () => {
    setIsGenerating(true);
    setGenerationProgress(5);
    
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          
          // Randomize / reschedule events dates slightly to simulate generation
          setEvents(prevEvents => prevEvents.map(e => {
            if (e.status !== 'Completed') {
              const dayOffset = Math.floor(Math.random() * 8) - 4; // Shift dynamic days slightly
              const originalDate = new Date(e.plannedDate);
              originalDate.setDate(originalDate.getDate() + dayOffset);
              const formatted = originalDate.toISOString().split('T')[0];
              return {
                ...e,
                plannedDate: formatted
              };
            }
            return e;
          }));
          
          showToast('AIMS Core Engine recalculated audit target periods and optimized schedule dates.');
          return 100;
        }
        return prev + 15;
      });
    }, 150);
  };

  // Export to PDF
  const handlePrintPDF = () => {
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      doc.setFillColor(15, 32, 67);
      doc.rect(0, 0, 297, 24, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text("VISAKHAPATNAM STEEL PLANT - INTERNAL AUDIT OFFICE", 14, 10);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`GENERATED AUDIT CALENDAR REGISTRY - ${months[currentMonth].toUpperCase()} ${currentYear}`, 14, 16);
      doc.text(`DATE SYSTEM EXPORTED: 2026-06-06 | SECURE PRIVILEGES: AUDITOR NODE`, 14, 21);

      const headers = [['Audit ID', 'Dept', 'HOD', 'Category', 'Target Date', 'Duration', 'Lead Auditor', 'System Status']];
      const rows = filteredEvents.map(e => [
        e.id, `${e.deptId} - ${e.deptName}`, e.deptHead, e.category, e.plannedDate, `${e.durationDays} Days`, e.auditor, e.status
      ]);

      autoTable(doc, {
        head: headers,
        body: rows,
        startY: 28,
        theme: 'striped',
        headStyles: { fillColor: [11, 47, 89], textColor: [255, 255, 255], fontSize: 8.5 },
        bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
      });

      doc.save(`AIMS_Generated_Audit_Calendar_${months[currentMonth]}_${currentYear}.pdf`);
      showToast("Generated audit calendar printed as official system PDF.");
    } catch (err) {
      console.error(err);
      alert("Error printing PDF document.");
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    try {
      let csv = 'Audit ID,Dept ID,Department Name,Department Head,Category,Planned Date,Duration Days,Lead Auditor,Status\r\n';
      filteredEvents.forEach(e => {
        csv += `"${e.id}","${e.deptId}","${e.deptName}","${e.deptHead}","${e.category}","${e.plannedDate}",${e.durationDays},"${e.auditor}","${e.status}"\r\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `AIMS_Audit_Calendar_${months[currentMonth]}_${currentYear}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Calendar spreadsheet records exported effectively.");
    } catch (err) {
      console.error(err);
      alert("Error saving spreadsheet document.");
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in font-sans text-slate-800" id="aims-generated-calendar-root">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-6 bg-slate-900 border-l-4 border-l-yellow-400 text-white p-4 rounded shadow-2xl z-50 flex items-center gap-3 text-xs font-mono max-w-sm animate-bounce" id="calendar-toast">
          <CheckCircle2 className="w-5 h-5 text-yellow-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header bar area */}
      <div className="bg-white border border-slate-300 p-4 rounded-sm shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] text-slate-400 font-bold font-mono tracking-wider block uppercase mb-1">
            Home &gt; Audit Planning &gt; Generated Audit Calendar
          </span>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-indigo-950" />
            Generated Audit Calendar
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Dynamic system calendar showing planned schedule dates, allocation intervals, and operational timeframes.
          </p>
        </div>

        <div className="flex gap-2">
          <button 
            id="calendar-btn-csv"
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black rounded-xs border border-slate-350 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            Excel Export
          </button>
          
          <button 
            id="calendar-btn-pdf"
            onClick={handlePrintPDF}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black rounded-xs border border-slate-350 flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            Print Calendar (PDF)
          </button>

          <button 
            id="calendar-btn-regenerate"
            disabled={isGenerating}
            onClick={handleRegenerateCalendar}
            className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-black text-xs uppercase tracking-wider rounded-sm transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Recalculating...' : 'Regenerate Calendar'}
          </button>
        </div>
      </div>

      {/* GENERATION PROGRESS BAR */}
      {isGenerating && (
        <div className="bg-slate-100 border border-slate-200 p-4 rounded-sm animate-pulse flex flex-col gap-2" id="calendar-generation-progress">
          <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-blue-900 animate-spin" />
              AIMS PLANNING CORE ENGINE: RE-CALCULATING TARGET SCHEDULE PERIODS...
            </span>
            <span>{generationProgress}%</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-blue-900 h-2 transition-all duration-150" 
              style={{ width: `${generationProgress}%` }}
            />
          </div>
          <p className="text-[9.5px] text-slate-400 italic">
            Scanning active frequencies, checking lead auditor workloads, and balancing operational sector downtime. Please wait.
          </p>
        </div>
      )}

      {/* SEARCH AND FILTERS PANEL */}
      <div className="bg-slate-50 border border-slate-350 p-4 rounded-sm grid grid-cols-1 md:grid-cols-4 gap-4" id="calendar-filter-bar">
        <div>
          <label htmlFor="search-input" className="block text-[11px] font-bold text-slate-700 mb-1">
            Search Department/ID/Auditor
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input 
              id="search-input"
              type="text" 
              placeholder="e.g. Coke Ovens or SMS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 bg-white border border-slate-300 rounded-sm p-1.5 text-xs focus:outline-none focus:border-blue-900 text-slate-800 font-medium"
            />
          </div>
        </div>

        <div>
          <label htmlFor="status-select" className="block text-[11px] font-bold text-slate-700 mb-1">
            Audit Status
          </label>
          <select 
            id="status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-sm p-1.5 text-xs focus:outline-none focus:border-blue-900 font-semibold"
          >
            <option value="All">All Statuses</option>
            <option value="Planned">Planned</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div>
          <label htmlFor="auditor-select" className="block text-[11px] font-bold text-slate-700 mb-1">
            Lead Auditor
          </label>
          <select 
            id="auditor-select"
            value={auditorFilter}
            onChange={(e) => setAuditorFilter(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-sm p-1.5 text-xs focus:outline-none focus:border-blue-900 font-semibold"
          >
            <option value="All">All Lead Auditors</option>
            <option value="Smt. P. Lakshmi">Smt. P. Lakshmi</option>
            <option value="Shri K. Somasekhar">Shri K. Somasekhar</option>
            <option value="Shri J.C. Bose">Shri J.C. Bose</option>
          </select>
        </div>

        {/* Dynamic info strip */}
        <div className="bg-slate-100 border border-slate-250 p-2 px-3 rounded-xs flex items-center gap-2 text-xs">
          <Info className="w-4 h-4 text-slate-500 shrink-0" />
          <div className="text-[11px] text-slate-650 leading-tight">
            Showing <strong className="text-slate-900">{filteredEvents.length}</strong> active planned audit periods generated for this sector index.
          </div>
        </div>
      </div>

      {/* CORE CALENDAR WORKSPACE: CALENDAR GRID + SIDE DETAIL BAR */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="calendar-workspace-grid">
        
        {/* Left 3 Cols: Month Control + Calendar Grid */}
        <div className="lg:col-span-3 bg-white border border-slate-300 rounded-sm shadow-sm flex flex-col justify-between">
          
          {/* Calendar Controller Bar */}
          <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <h2 className="text-sm font-mono font-black tracking-widest uppercase">
                {months[currentMonth]} {currentYear}
              </h2>
            </div>

            <div className="flex items-center gap-1.5">
              <button 
                onClick={handlePrevMonth}
                className="p-1 px-2.5 bg-slate-800 hover:bg-slate-750 text-white rounded border border-slate-700 hover:border-slate-500 text-xs font-mono font-bold cursor-pointer flex items-center gap-1"
                title="Previous Month"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                PREV
              </button>

              <button 
                onClick={() => {
                  setCurrentMonth(5);
                  setCurrentYear(2026);
                }}
                className="p-1 px-3 bg-slate-850 hover:bg-slate-750 text-yellow-400 rounded border border-slate-700 text-xs font-mono font-bold cursor-pointer"
              >
                RESET (JUNE 2026)
              </button>

              <button 
                onClick={handleNextMonth}
                className="p-1 px-2.5 bg-slate-800 hover:bg-slate-750 text-white rounded border border-slate-700 hover:border-slate-500 text-xs font-mono font-bold cursor-pointer flex items-center gap-1"
                title="Next Month"
              >
                NEXT
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Weekday Titles Row */}
          <div className="grid grid-cols-7 text-center font-mono font-bold text-[10px] tracking-wider bg-slate-100 border-b text-slate-500 uppercase py-1.5">
            <div>Sunday</div>
            <div>Monday</div>
            <div>Tuesday</div>
            <div>Wednesday</div>
            <div>Thursday</div>
            <div>Friday</div>
            <div>Saturday</div>
          </div>

          {/* Monthly Day Grid */}
          <div className="grid grid-cols-7 grid-rows-6 divide-x divide-y divide-slate-200 border-b border-slate-200 min-h-[500px]">
            {calendarCells.map((cell, idx) => {
              const dayEvents = getEventsForDay(cell.fullDateStr);
              const isToday = cell.fullDateStr === '2026-06-06';

              return (
                <div 
                  key={idx} 
                  className={`p-1.5 min-h-[90px] flex flex-col justify-between transition-all ${
                    cell.isCurrentMonth ? 'bg-white' : 'bg-slate-50/50'
                  } ${isToday ? 'bg-yellow-50/30' : ''}`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-mono font-bold ${
                      cell.isCurrentMonth ? (isToday ? 'text-blue-900 bg-yellow-300 font-extrabold px-1 rounded-sm' : 'text-slate-900') : 'text-slate-400'
                    }`}>
                      {cell.dayNumber}
                    </span>
                    {isToday && (
                      <span className="text-[7.5px] uppercase font-mono font-extrabold text-slate-500 tracking-wider">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Day Events stack inside cell block */}
                  <div className="mt-1 space-y-1 overflow-hidden flex-1 flex flex-col justify-end">
                    {dayEvents.map(event => {
                      // Compact short tag highlight
                      const isStart = event.plannedDate === cell.fullDateStr;
                      return (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEventId(event.id);
                          }}
                          className={`text-[9px] px-1 py-0.5 rounded-xs truncate font-mono cursor-pointer border hover:translate-x-0.5 transition-transform flex items-center justify-between ${
                            event.status === 'Completed' ? 'bg-green-50 border-green-200 text-green-800' :
                            event.status === 'In Progress' ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold' :
                            event.status === 'Assigned' ? 'bg-indigo-50 border-indigo-200 text-indigo-800' :
                            'bg-slate-100 border-slate-250 text-slate-800'
                          }`}
                          title={`${event.id}: ${event.deptName} (${event.auditor})`}
                        >
                          <span className="truncate">
                            {isStart ? '★' : '↳'} {event.deptName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* COLOR LEGEND INDICATORS */}
          <div className="bg-slate-50 p-3 px-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-4 flex-wrap text-[11px] font-mono font-semibold">
              <span className="text-slate-400 select-none">Status Legend:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-100 border border-slate-350 block" />
                <span>Planned</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-indigo-50 border border-indigo-300 block" />
                <span>Assigned</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-50 border border-amber-300 block" />
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-green-50 border border-green-300 block" />
                <span>Completed</span>
              </div>
            </div>

            <span className="text-[10px] text-slate-400 font-mono tracking-widest font-black uppercase">
              AIMS NODE ID: CAL_GEN_300
            </span>
          </div>

        </div>

        {/* Right 1 Col: Spotlight Detailed Inspector Panel */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Calendar Audit Detail Inspector */}
          <div className="bg-white border border-slate-300 rounded-sm shadow-sm flex flex-col justify-between min-h-[380px]">
            <div className="bg-slate-100 p-3 border-b flex justify-between items-center text-[11px] font-bold text-slate-800 uppercase tracking-widest font-mono">
              <span>DETAIL INSPECTOR</span>
              {activeEventDetails && (
                <span className="bg-indigo-100 text-indigo-900 border border-indigo-200 px-1.5 py-0.2 text-[8.5px] rounded-xs font-mono font-bold uppercase">
                  ACTIVE
                </span>
              )}
            </div>

            {activeEventDetails ? (
              <div className="p-4 space-y-4 text-xs flex-1">
                <div className="bg-slate-900 text-yellow-400 p-3 rounded-xs font-mono border-b border-yellow-400">
                  <div className="text-[10px] text-slate-400">AUDIT ID KEY</div>
                  <div className="text-sm font-extrabold tracking-wider">{activeEventDetails.id}</div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="font-bold text-slate-400 text-[10px] block uppercase font-mono">CORE DEPARTMENT</span>
                    <div className="text-slate-900 font-extrabold text-[12px] flex items-center gap-1.5 mt-0.5">
                      <Building className="w-4 h-4 text-blue-900 shrink-0" />
                      {activeEventDetails.deptId} - {activeEventDetails.deptName}
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-slate-400 text-[10px] block uppercase font-mono">DEPARTMENT HEAD (HOD)</span>
                    <div className="text-slate-800 font-semibold mt-0.5">{activeEventDetails.deptHead}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-bold text-slate-400 text-[10px] block uppercase font-mono">CATEGORY</span>
                      <div className="text-slate-700 font-medium mt-0.5">{activeEventDetails.category}</div>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 text-[10px] block uppercase font-mono">CYCLE PERIOD</span>
                      <div className="text-indigo-900 font-bold font-mono mt-0.5">{activeEventDetails.cycle}</div>
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-slate-400 text-[10px] block uppercase font-mono">ASSIGNED AUDITOR</span>
                    <div className="text-slate-800 font-bold flex items-center gap-1.5 mt-0.5">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {activeEventDetails.auditor}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-bold text-slate-400 text-[10px] block uppercase font-mono">PLANNED DATE</span>
                      <div className="text-slate-800 font-mono font-bold mt-0.5">{activeEventDetails.plannedDate}</div>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 text-[10px] block uppercase font-mono">DURATION</span>
                      <div className="text-slate-800 font-bold mt-0.5">{activeEventDetails.durationDays} Days</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div>
                      <span className="font-bold text-slate-400 text-[10px] block uppercase font-mono">PRIORITY LEVEL</span>
                      <span className={`inline-block mt-0.5 text-[9px] px-2 py-0.2 rounded font-mono font-extrabold uppercase ${
                        activeEventDetails.priority === 'High' ? 'bg-red-50 text-red-700 border border-red-200' :
                        activeEventDetails.priority === 'Medium' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {activeEventDetails.priority}
                      </span>
                    </div>

                    <div>
                      <span className="font-bold text-slate-400 text-[10px] block uppercase font-mono">AUDIT STATUS</span>
                      <span className={`inline-block mt-0.5 text-[9px] px-2 py-0.2 rounded font-mono font-extrabold uppercase ${
                        activeEventDetails.status === 'Completed' ? 'bg-green-50 text-green-700 border border-green-200' :
                        activeEventDetails.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border border-amber-250 animate-pulse' :
                        activeEventDetails.status === 'Assigned' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        'bg-slate-100 text-slate-700 border'
                      }`}>
                        {activeEventDetails.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 italic flex-1 flex flex-col justify-center items-center gap-2">
                <Grid className="w-8 h-8 text-slate-300" />
                <span className="text-[11px] leading-relaxed">
                  Click on any scheduled event block or date in the calendar month grid to load full audit specifications.
                </span>
              </div>
            )}

            <div className="bg-slate-50 p-3 border-t text-center">
              {activeEventDetails ? (
                <button
                  onClick={() => setSelectedEventId(null)}
                  className="w-full py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xs font-mono text-[10px] uppercase font-bold tracking-wider cursor-pointer"
                >
                  Unselect / Clear Spotlight
                </button>
              ) : (
                <span className="text-[10px] font-mono text-slate-400 block py-1 uppercase select-none">
                  AIMS SPOTLIGHT CONSOLE
                </span>
              )}
            </div>
          </div>

          {/* Quick Informational Guide */}
          <div className="bg-slate-900 border border-slate-800 font-mono text-white p-4 rounded-sm flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-yellow-400 font-bold uppercase tracking-wider">
              <Info className="w-4 h-4" />
              <span>Planning Guidelines</span>
            </div>
            <p className="text-[10.5px] text-slate-300 leading-relaxed font-semibold">
              The calendar displays optimized timeslots derived automatically using department audit cycles. Auditor assignments ensure balance with physical limits.
            </p>
            <div className="text-[8.5px] border-t border-slate-800/80 pt-2 text-slate-500 font-black tracking-widest uppercase">
              VISAKHAPATNAM STEEL PLANT SERVICES
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
