import React, { useState } from 'react';
import { 
  Clock, Key, Cpu, Users, Award, Wifi, ShieldAlert, FileText, Check, AlertTriangle, 
  MapPin, Send, Database, FileSpreadsheet, Plus, HelpCircle, HeartPulse, HardDrive, Laptop, Receipt, Briefcase 
} from 'lucide-react';

interface AlliedAppsModuleProps {
  appKey: string;
  currentUser: { name: string; role: string; department: string };
}

export default function AlliedAppsModule({ appKey, currentUser }: AlliedAppsModuleProps) {
  // Common states for interactions inside the modules
  const [punchReason, setPunchReason] = useState('Offsite Duty');
  const [isPunching, setIsPunching] = useState(false);
  const [deviceOwner, setDeviceOwner] = useState(currentUser.name);
  const [deviceSerial, setDeviceSerial] = useState('VSP-LPT-' + Math.floor(1000 + Math.random() * 9000));
  const [assetsList, setAssetsList] = useState([
    { id: 1, name: 'Standard Corporate ThinkPad', serial: 'VSP-LPT-9804', ipAddress: '10.201.32.41', status: 'Assigned', date: '2025-04-12' },
    { id: 2, name: 'External LED Monitor 24"', serial: 'VSP-MON-4410', ipAddress: 'DHCP_LEAsED', status: 'Assigned', date: '2025-08-18' }
  ]);

  const [medicalBills, setMedicalBills] = useState([
    { id: 'MB-5541', patient: 'Self (Employee)', hospital: 'RINL General Hospital, Sector-6', amount: 4850, status: 'Passed - Refunded', date: '2026-05-10' },
    { id: 'MB-9902', patient: 'Mrs. Lakshmi (Spouse)', hospital: 'Empaneled Apollo Visakhapatnam', amount: 12400, status: 'Under Verification', date: '2026-05-27' }
  ]);
  const [newBillAmount, setNewBillAmount] = useState('');
  const [newBillPatient, setNewBillPatient] = useState('Self (Employee)');

  // DARS Punch simulation
  const handlePunchSimulate = () => {
    setIsPunching(true);
    setTimeout(() => {
      setIsPunching(false);
      alert(`SSO APPROVED: Card punch request registered successfully!\nStatus: Attendance regularized as [${punchReason}] with automatic VPN network token validation.`);
    }, 850);
  };

  // Asset creation simulation
  const handleAssetRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceSerial.trim()) return;
    setAssetsList(prev => [
      ...prev,
      {
        id: Date.now(),
        name: 'HP EliteBook Corporate Standard',
        serial: deviceSerial,
        ipAddress: `10.201.32.${Math.floor(100 + Math.random() * 150)}`,
        status: 'Assigned',
        date: new Date().toLocaleDateString()
      }
    ]);
    alert(`IT Entitlement Registered: laptop serial "${deviceSerial}" issued under employee SSO.`);
    setDeviceSerial('');
  };

  // Medical Bills registration
  const handleAddBill = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newBillAmount);
    if (isNaN(amt) || amt <= 0) return alert('Enter a valid currency numeric amount.');
    setMedicalBills(prev => [
      ...prev,
      {
        id: 'MB-' + Math.floor(1000 + Math.random() * 9000),
        patient: newBillPatient,
        hospital: 'RINL Sector-6 Primary Dispensary',
        amount: amt,
        status: 'Under Verification',
        date: new Date().toLocaleDateString()
      }
    ]);
    alert('Medical reimbursement claim dispatched through Online SSO workflow gateway.');
    setNewBillAmount('');
  };

  const currentYear = '2026-27';

  return (
    <div className="p-6 font-sans space-y-6 animate-fade-in">
      
      {/* 1. Header ribbon showing what allied VSP app is being viewed */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-gradient-to-r from-slate-850 from-slate-800 to-blue-900 border border-slate-300 p-5 rounded-sm shadow-sm gap-4 text-white">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="bg-yellow-400 font-mono text-black text-[9px] px-1 rounded-xs font-bold leading-tight">VSP INTEGRATION SSO</span>
            <span className="text-xs font-semibold tracking-wider text-slate-350 text-slate-300">CORPORATE UTILITIES</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase mt-0.5">
            {appKey.replace('app_', '').replace(/_/g, ' ')}
          </h2>
          <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
            You are currently working inside the authenticated SSO session for {currentUser.name}. Privilege: {currentUser.role} Department: {currentUser.department}
          </p>
        </div>
        
        <div className="bg-slate-900/50 border border-slate-700/60 p-2 text-right font-mono text-[10px] text-slate-300 rounded-sm">
          <span>PORTAL SECURE TUNNEL: VSP-SSO-CONN</span>
          <span className="text-green-400 font-medium block">✓ AUTH_VERIFIED</span>
        </div>
      </div>

      {/* 2. Dynamic content based on the Allied Portal Selected */}
      {appKey === 'app_attendance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Card left: Punch details */}
          <div className="lg:col-span-1 bg-white border border-slate-300 rounded-sm shadow-sm">
            <div className="bg-slate-100 p-4 border-b">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-800" />
                SIMULATE REMOTE BIOMETRIC CARD SWIPE (DARS)
              </span>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                RINL guidelines permit virtual regularization swaps under active HOD authorizations for onsite audits at SMS, Coke Ovens, and Blast Furnace plant zones.
              </p>
              
              <div>
                <label className="oracle-input-label block mb-1">Punch Type / Reason Code:</label>
                <select 
                  value={punchReason}
                  onChange={(e) => setPunchReason(e.target.value)}
                  className="oracle-field-value w-full"
                >
                  <option value="Onsite Audit Duty - SMS Zone">Onsite Audit Duty - SMS Zone</option>
                  <option value="Coke Ovens Area Field Observation">Coke Ovens Area Field Observation</option>
                  <option value="HOD Pre-Scheduled Meeting">HOD Pre-Scheduled Meeting</option>
                  <option value="Offsite Duty - Head Office">Offsite Duty - Head Office</option>
                </select>
              </div>

              <div>
                <label className="oracle-input-label block mb-1">Calculated Terminal Swipe Time:</label>
                <input 
                  type="text" 
                  value={new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()} 
                  disabled 
                  className="oracle-field-value bg-slate-50 w-full text-slate-500 text-center font-mono cursor-not-allowed" 
                />
              </div>

              <button 
                onClick={handlePunchSimulate}
                disabled={isPunching}
                className="w-full bg-[#1e3a8a] text-white hover:bg-slate-900 shadow-sm text-xs font-black py-2.5 rounded-xs cursor-pointer tracking-wider uppercase"
              >
                {isPunching ? 'Contacting DARS Server Replica...' : 'DISPATCH CARD SWIPE'}
              </button>
            </div>
          </div>

          {/* Table right: Swipe History list */}
          <div className="lg:col-span-2 bg-white border border-slate-300 rounded-sm shadow-sm">
            <div className="bg-slate-100 p-4 border-b flex justify-between items-center">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">SECURE MONTHLY ATTENDANCE REGISTER (DARS)</span>
              <span className="bg-green-100 text-green-800 text-[10px] font-bold font-mono px-2 py-0.5 rounded">PRESENCE RATIO: 100%</span>
            </div>
            
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] tracking-wider uppercase text-slate-600 font-bold">
                    <th className="p-3">Shift Date</th>
                    <th className="p-3">In-Time Punch</th>
                    <th className="p-3">Out-Time Punch</th>
                    <th className="p-3">Status Roster</th>
                    <th className="p-3">Regularization Node</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-slate-800">
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-semibold">2026-05-28</td>
                    <td className="p-3 font-mono">09:00:12</td>
                    <td className="p-3 font-mono">17:34:02</td>
                    <td className="p-3 font-bold text-green-700">✓ PRESENT_DUTY</td>
                    <td className="p-3 text-slate-500 text-[11px]">VSP_PORTAL_WEB_SSO</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-semibold">2026-05-27</td>
                    <td className="p-3 font-mono">08:55:04</td>
                    <td className="p-3 font-mono">18:02:18</td>
                    <td className="p-3 font-bold text-green-700">✓ PRESENT_DUTY</td>
                    <td className="p-3 text-slate-500 text-[11px]">CARD_SWIPE_MAIN_GATE</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-semibold">2026-05-26</td>
                    <td className="p-3 font-mono">09:05:41</td>
                    <td className="p-3 font-mono">17:30:11</td>
                    <td className="p-3 font-bold text-[#1e3a8a]">✓ ONSITE_REGULARIZED</td>
                    <td className="p-3 text-indigo-700 font-bold text-[11px]">ROSTER_SHIFT_HOD_SIG</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-semibold">2026-05-25</td>
                    <td className="p-3 font-mono">08:58:12</td>
                    <td className="p-3 font-mono">17:42:09</td>
                    <td className="p-3 font-bold text-green-700">✓ PRESENT_DUTY</td>
                    <td className="p-3 text-slate-500 text-[11px]">CARD_SWIPE_MAIN_GATE</td>
                  </tr>
                </tbody>
              </table>
              <span className="text-[10px] text-slate-400 italic block mt-4 font-mono">
                System automatic synchronization complete with Visakhapatnam HOD roster calendars.
              </span>
            </div>
          </div>

        </div>
      )}

      {appKey === 'app_assets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Card left: Register asset layout */}
          <div className="lg:col-span-1 bg-white border border-slate-300 rounded-sm shadow-sm">
            <div className="bg-slate-100 p-4 border-b">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Laptop className="w-5 h-5 text-indigo-800" />
                REGISTER REMAINING ENTITLEMENT ASSETS
              </span>
            </div>
            <form onSubmit={handleAssetRegister} className="p-4 space-y-4">
              <div>
                <label className="oracle-input-label block mb-1">Approved Custodian Owner:</label>
                <input 
                  type="text" 
                  value={deviceOwner} 
                  onChange={(e) => setDeviceOwner(e.target.value)}
                  className="oracle-field-value w-full"
                  required 
                />
              </div>

              <div>
                <label className="oracle-input-label block mb-1">Hardware Serial Registration No:</label>
                <input 
                  type="text" 
                  value={deviceSerial} 
                  onChange={(e) => setDeviceSerial(e.target.value)}
                  placeholder="e.g. VSP-LPT-2291"
                  className="oracle-field-value w-full"
                  required 
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-[#1e3a8a] text-white hover:bg-slate-900 shadow-sm text-xs font-black py-2 text-center uppercase cursor-pointer rounded-xs"
              >
                COMMIT ASSET TO LANDSCAPE SYSTEM
              </button>
            </form>
          </div>

          {/* Table right: Asset schema register */}
          <div className="lg:col-span-2 bg-white border border-slate-300 rounded-sm shadow-sm">
            <div className="bg-slate-100 p-4 border-b flex justify-between items-center">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">IT LANDSCAPE DATABASE REGISTER (ITAMS)</span>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold font-mono px-2 py-0.5 rounded">TOTAL COUNT: {assetsList.length} ITEMS</span>
            </div>
            
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] tracking-wider uppercase text-slate-600 font-bold">
                    <th className="p-3">Asset Classification</th>
                    <th className="p-3">Serial Reference</th>
                    <th className="p-3">Enterprise IP Address</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Verification Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-slate-800 font-medium">
                  {assetsList.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{asset.name}</td>
                      <td className="p-3 font-mono text-indigo-900 font-bold">{asset.serial}</td>
                      <td className="p-3 font-mono">{asset.ipAddress}</td>
                      <td className="p-3">
                        <span className="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 font-bold rounded-sm border border-green-200 font-mono">
                          {asset.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 font-mono text-[10px]">{asset.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[10px] text-slate-400 italic mt-3 font-mono uppercase">
                * SYSTEM NOTICE: External devices requires gate passes signed by central Security Section &amp; IT HOD.
              </p>
            </div>
          </div>

        </div>
      )}

      {appKey === 'app_qms' && (
        <div className="bg-white border border-slate-300 rounded-sm shadow-sm">
          <div className="bg-slate-100 p-4 border-b">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              ISO-9001 QUALITY PROCESSES DOCUMENT CHECKLIST (IT QMS TOOLS)
            </span>
          </div>
          <div className="p-5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 border border-dashed text-center rounded-sm space-y-2 bg-slate-50">
                <span className="text-[10px] bg-indigo-100 text-[#1e3a8a] px-2 py-0.5 rounded font-black font-mono">ISO-9001:2015</span>
                <p className="text-xs font-bold text-slate-800 mt-1 uppercase">Process Guidelines</p>
                <span className="text-[10.5px] text-green-700 font-mono block font-bold">✓ COMPLIANT_OK</span>
              </div>
              <div className="p-4 border border-dashed text-center rounded-sm space-y-2 bg-slate-50">
                <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-black font-mono">CMMI-LEVEL 3</span>
                <p className="text-xs font-bold text-slate-800 mt-1 uppercase">Engineering Standard</p>
                <span className="text-[10.5px] text-amber-700 font-mono block font-bold">✓ VERIFIED_AUDIT</span>
              </div>
              <div className="p-4 border border-dashed text-center rounded-sm space-y-2 bg-slate-50">
                <span className="text-[10px] bg-red-100 text-red-900 px-2 py-0.5 rounded font-black font-mono">ISO-27001</span>
                <p className="text-xs font-bold text-slate-800 mt-1 uppercase">Information Security</p>
                <span className="text-[10.5px] text-green-700 font-mono block font-bold">✓ COMPLIANT_OK</span>
              </div>
              <div className="p-4 border border-dashed text-center rounded-sm space-y-2 bg-slate-50">
                <span className="text-[10px] bg-purple-100 text-purple-900 px-2 py-0.5 rounded font-black font-mono">ITIL-FRAMEWORK</span>
                <p className="text-xs font-bold text-slate-800 mt-1 uppercase">Technical Service Book</p>
                <span className="text-[10.5px] text-green-700 font-mono block font-bold">✓ CERT_ACTIVE</span>
              </div>
            </div>

            <div className="overflow-x-auto border rounded-sm">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] tracking-wider uppercase text-slate-600 font-bold p-3">
                    <th className="p-3">Procedure No</th>
                    <th className="p-3">Quality Guideline / Document Title</th>
                    <th className="p-3">Last Audited Interval</th>
                    <th className="p-3">Owner Directorate</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-slate-800 font-medium">
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-blue-900">VSP-QMS-PRC-441</td>
                    <td className="p-3 font-bold text-slate-800">Software Configuration Control and Branch Vouchers</td>
                    <td className="p-3 font-mono">Q1_FY_2026-27</td>
                    <td className="p-3 uppercase">IT &amp; ERP Systems Division</td>
                    <td className="p-3"><span className="text-emerald-700 font-bold">✓ ACTIVE_DEPLOYED</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-blue-900">VSP-QMS-PRC-512</td>
                    <td className="p-3 font-bold text-slate-800">Database Disaster Backups &amp; Multi-Zone Redundancy Protocols</td>
                    <td className="p-3 font-mono">Q3_FY_2025-26</td>
                    <td className="p-3 uppercase">Database Admin Cell</td>
                    <td className="p-3"><span className="text-emerald-700 font-bold">✓ ACTIVE_DEPLOYED</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {appKey === 'app_oasis' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Card left: Pay Summary Details */}
          <div className="lg:col-span-1 bg-white border border-slate-300 rounded-sm shadow-sm space-y-4 p-4">
            <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-3 text-white rounded-xs">
              <span className="text-[10px] font-mono text-blue-200 tracking-wider font-bold">RINL OFFICIAL RECORD</span>
              <p className="text-sm font-black uppercase mt-0.5">OASIS ESS PORTAL STATEMENT</p>
            </div>
            
            <div className="space-y-2 text-xs border-b pb-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Employee Basic Code:</span>
                <span className="font-mono font-bold text-slate-800">VSP-EM-84091</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Grade / Cadre:</span>
                <span className="font-bold text-slate-800">E5 (Senior Executive)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Corporate Basic Pay:</span>
                <span className="font-mono font-bold text-slate-800">₹83,400.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Industrial Dearness Allowance (IDA):</span>
                <span className="font-mono font-bold text-green-700">₹34,861.20 (41.8%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">House Rent Allowance (HRA):</span>
                <span className="font-mono font-bold text-[#1e3a8a]">₹13,344.00 (16%)</span>
              </div>
            </div>

            <div className="space-y-2 text-xs bg-indigo-50/55 p-3 rounded-xs border border-indigo-100">
              <p className="font-bold uppercase text-[#1e3a8a] text-[10.5px]">EPF &amp; Gratuity Snapshot</p>
              <div className="flex justify-between mt-1">
                <span className="text-slate-600">Employee Contribution:</span>
                <span className="font-mono font-bold">₹10,008.00 / month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Cumulative Provident Balance:</span>
                <span className="font-mono font-extrabold text-[#1d4ed8]">₹18,44,812.00</span>
              </div>
            </div>
          </div>

          {/* Table right: Monthly Payslip vouchers */}
          <div className="lg:col-span-2 bg-white border border-slate-300 rounded-sm shadow-sm">
            <div className="bg-slate-100 p-4 border-b">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">MONTHLY COMPENSATIONS LEDGER &amp; TAX SCHEMAS (OASIS)</span>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] tracking-wider uppercase text-slate-600 font-bold">
                      <th className="p-3">Salary Slip ID</th>
                      <th className="p-3">Accounting Cycle</th>
                      <th className="p-3">Gross Earnings</th>
                      <th className="p-3">Statutory Deductions</th>
                      <th className="p-3">Disbursed Take-home</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-slate-805 font-medium">
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-blue-900 font-bold">SLP-2026-05</td>
                      <td className="p-3 font-semibold">May 2026</td>
                      <td className="p-3 font-mono">₹1,31,605.20</td>
                      <td className="p-3 font-mono text-red-700">₹14,810.00</td>
                      <td className="p-3 font-mono text-green-800 font-bold">₹1,16,795.20</td>
                      <td className="p-3"><button onClick={() => alert('Tax report Form 16 & HTML Pay Slip generated under download directory.')} className="text-[#1e3a8a] font-bold hover:underline">Download Slip</button></td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-blue-900 font-bold">SLP-2026-04</td>
                      <td className="p-3 font-semibold">April 2026</td>
                      <td className="p-3 font-mono">₹1,31,605.20</td>
                      <td className="p-3 font-mono text-red-700">₹14,810.00</td>
                      <td className="p-3 font-mono text-green-800 font-bold">₹1,16,795.20</td>
                      <td className="p-3"><button onClick={() => alert('Download requested.')} className="text-[#1e3a8a] font-bold hover:underline">Download Slip</button></td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-blue-900 font-bold">SLP-2026-03</td>
                      <td className="p-3 font-semibold">March 2026</td>
                      <td className="p-3 font-mono">₹1,28,402.10</td>
                      <td className="p-3 font-mono text-red-700">₹14,502.00</td>
                      <td className="p-3 font-mono text-green-800 font-bold">₹1,13,900.10</td>
                      <td className="p-3"><button onClick={() => alert('Download requested.')} className="text-[#1e3a8a] font-bold hover:underline">Download Slip</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}

      {appKey === 'app_health' && (
        <div className="bg-white border border-slate-300 rounded-sm shadow-sm">
          <div className="bg-slate-100 p-4 border-b">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              OCCUPATIONAL HEALTH ADVISORY &amp; EPIDEMIOLOGICAL SCREENING (OHMS)
            </span>
          </div>
          <div className="p-5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-2">
                <div className="flex items-center gap-2 text-rose-700">
                  <HeartPulse className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">CHEST X-RAY &amp; SPIROMETRY</span>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Required annually for plant-floor personnel in Blast Furnace, SMS, and Sinter Plant.
                </p>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">NEXT REVIEW: 2026-10-18</span>
                  <span className="bg-green-100 text-green-900 font-mono font-bold text-[10px] px-2 py-0.5 rounded">✓ FIT_SAFE</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-[#cbd5e1] rounded-sm space-y-2">
                <div className="flex items-center gap-2 text-teal-700">
                  <Cpu className="w-5 h-5 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider">AUDIOMETRY TESTING</span>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Verifies safe audiological levels for turbine generators and raw mills employees.
                </p>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">NORMAL RANGE: 25dB</span>
                  <span className="bg-green-100 text-green-900 font-mono font-bold text-[10px] px-2 py-0.5 rounded">✓ FIT_SAFE</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-2">
                <div className="flex items-center gap-2 text-blue-700">
                  <Users className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider font-sans">DUST EXPOSURE MATRIX</span>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Real-time microgram measurements for respirable suspended particulate contents.
                </p>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">LIMIT: 1.5mg/m3</span>
                  <span className="bg-teal-50 text-teal-800 border-teal-200 border font-mono font-bold text-[10px] px-2 py-0.5 rounded">✓ SAFE: 0.81</span>
                </div>
              </div>

            </div>

            <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 p-3.5 rounded-sm text-xs leading-relaxed">
              <span className="font-extrabold text-[#115e59] uppercase block font-sans">Corporate Medical Fit Certifications: Active</span>
              Your occupational health dossier index indicates a stellar fitness tier. Gate passes synced successfully with DARS security systems and SSO verification registers.
            </div>
          </div>
        </div>
      )}

      {appKey === 'app_bills' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form left */}
          <div className="lg:col-span-1 bg-white border border-slate-300 rounded-sm shadow-sm">
            <div className="bg-slate-100 p-4 border-b">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-800" />
                DRAFT NEW MEDICAL CLAIM (OMBTS)
              </span>
            </div>
            <form onSubmit={handleAddBill} className="p-4 space-y-4">
              <div>
                <label className="oracle-input-label block mb-1">Target Patient Identity:</label>
                <select 
                  value={newBillPatient}
                  onChange={(e) => setNewBillPatient(e.target.value)}
                  className="oracle-field-value w-full"
                >
                  <option value="Self (Employee)">Self (Employee)</option>
                  <option value="Mrs. Lakshmi (Spouse)">Mrs. Lakshmi (Spouse)</option>
                  <option value="Master Shiva (Son)">Master Shiva (Son)</option>
                  <option value="Smt. Parvathi (Dependent Mother)">Smt. Parvathi (Dependent Mother)</option>
                </select>
              </div>

              <div>
                <label className="oracle-input-label block mb-1">Total Entitled Bill Amount (INR):</label>
                <input 
                  type="number" 
                  value={newBillAmount}
                  onChange={(e) => setNewBillAmount(e.target.value)}
                  placeholder="e.g. 5400"
                  className="oracle-field-value w-full"
                  required 
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-[#1e3a8a] text-white hover:bg-slate-900 hover:scale-101 border cursor-pointer border-blue-950 transition-all font-black text-xs py-2.5 rounded-xs uppercase tracking-wide"
              >
                SUBMIT CLAIM REIMBURSEMENT
              </button>
            </form>
          </div>

          {/* Table right */}
          <div className="lg:col-span-2 bg-white border border-slate-300 rounded-sm shadow-sm">
            <div className="bg-slate-100 p-4 border-b">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">REGISTERED REIMBURSEMENTS HISTORY</span>
            </div>
            
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] tracking-wider uppercase text-slate-600 font-bold">
                    <th className="p-3">Claim Voucher ID</th>
                    <th className="p-3">Patient Identity</th>
                    <th className="p-3">Primary Empaneled Facility</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date Dispatched</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-slate-800 font-medium font-sans">
                  {medicalBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-blue-900">{bill.id}</td>
                      <td className="p-3 font-bold">{bill.patient}</td>
                      <td className="p-3 text-slate-600">{bill.hospital}</td>
                      <td className="p-3 font-bold font-mono text-slate-900">₹{bill.amount.toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold uppercase ${
                          bill.status.includes('Passed') ? 'text-emerald-700' : 'text-amber-700 animate-pulse'
                        }`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 font-mono text-[10px]">{bill.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {appKey === 'app_quality_circles' && (
        <div className="bg-white border border-slate-300 rounded-sm shadow-sm">
          <div className="bg-slate-100 p-4 border-b">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              QUALITY CIRCLES &amp; LEAN KAIZEN CONTRIVANCES (QCMS)
            </span>
          </div>
          <div className="p-5 space-y-6">
            <p className="text-xs text-slate-600 leading-relaxed">
              Quality Circles in Visakhapatnam Steel Plant encourages grassroots workforce squads to identify production roadblocks, enhance scrap collection ratios, and optimize power grid loads.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm text-center space-y-2">
                <span className="bg-blue-100 text-[#1e3a8a] text-[10px] px-2 py-0.5 rounded font-black font-mono">SMS CELL: "AGNI"</span>
                <p className="text-xs font-bold text-slate-800 mt-1">Ladle Leakage Reduction</p>
                <p className="text-[11px] text-emerald-800 font-mono block font-bold mt-1">₹14.8 Lakhs saved/yr</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm text-center space-y-2">
                <span className="bg-[#fef3c7] text-[#92400e] text-[10px] px-2 py-0.5 rounded font-black font-mono">COKE OVENS: "SURYAPUTRA"</span>
                <p className="text-xs font-bold text-slate-800 mt-1">Coal Pre-Heating Rake Optimization</p>
                <p className="text-[11px] text-emerald-800 font-mono block font-bold mt-1">₹28.4 Lakhs saved/yr</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm text-center space-y-2">
                <span className="bg-purple-100 text-purple-900 text-[10px] px-2 py-0.5 rounded font-black font-mono">POWER DIVISION: "VIDYUT"</span>
                <p className="text-xs font-bold text-slate-800 mt-1">Co-Generation Gas Boiler Streamlining</p>
                <p className="text-[11px] text-emerald-800 font-mono block font-bold mt-1">₹44.5 Lakhs saved/yr</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {appKey === 'app_aime_3_tier' && (
        <div className="bg-white border border-slate-300 rounded-sm shadow-sm">
          <div className="bg-slate-100 p-4 border-b">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              AIMS 3 TIER PRODUCTION SYSTEM ARCHITECTURE MODEL
            </span>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-center">
              <div className="p-5 bg-slate-50 border border-slate-250 rounded-sm space-y-2">
                <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center font-bold text-blue-900 mx-auto">1</div>
                <h4 className="text-xs font-bold text-slate-800 uppercase">Tier 1: Web Interface Gateways</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">Runs in reverse-proxy secure SSL sandbox forwarding to Port 3000 container setups dynamically.</p>
                <span className="bg-green-100 text-green-900 text-[9px] px-2 py-0.5 font-bold font-mono rounded">EXCELLENT</span>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-250 rounded-sm space-y-2">
                <div className="bg-teal-100 w-10 h-10 rounded-full flex items-center justify-center font-bold text-teal-900 mx-auto">2</div>
                <h4 className="text-xs font-bold text-slate-800 uppercase">Tier 2: Business &amp; API Logical Layer</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">Integrated Express.js routing engine validating document upload hashes, dispatch books and para sequences.</p>
                <span className="bg-green-100 text-green-905 text-[9px] px-2 py-0.5 font-bold font-mono rounded">STABLE_ACTIVE</span>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-250 rounded-sm space-y-2">
                <div className="bg-amber-100 w-10 h-10 rounded-full flex items-center justify-center font-bold text-amber-900 mx-auto">3</div>
                <h4 className="text-xs font-bold text-slate-800 uppercase">Tier 3: Database Storage Replica</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">Simulated relational key-store with active DAK Sequencers, audit program schema registries and activity watchdog.</p>
                <span className="bg-amber-100 text-amber-905 text-[9px] px-2 py-0.5 font-bold font-mono rounded">LOCAL_DB_ONLINE</span>
              </div>
            </div>

            <div className="pt-4 border-t border-dashed text-center text-xs text-slate-400 font-mono uppercase">
              * SECURE BACKEND SYSTEM INTEGRATION IS FULLY ARMED.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
