import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, Navigation, AlertCircle, RefreshCw } from 'lucide-react';
import { DispatchItem } from '../types';

interface DispatchModuleProps {
  dispatchItems: DispatchItem[];
  onCreateDispatch: (d: Partial<DispatchItem>) => void;
  onUpdateDispatch: (id: string, updates: Partial<DispatchItem>) => void;
}

export default function DispatchModule({ dispatchItems, onCreateDispatch, onUpdateDispatch }: DispatchModuleProps) {
  const [dakNo, setDakNo] = useState('');
  const [subject, setSubject] = useState('');
  const [receiverDept, setReceiverDept] = useState('Coke Ovens Department');
  const [medium, setMedium] = useState<'Hand Delivered' | 'Registered Post' | 'Intranet Email'>('Intranet Email');
  const [isGeneratingDak, setIsGeneratingDak] = useState(false);

  // Auto initialize sequencer
  const triggerDakGeneration = async () => {
    setIsGeneratingDak(true);
    try {
      const res = await fetch('/api/dak/init');
      const data = await res.json();
      if (data && data.dakNo) {
        setDakNo(data.dakNo);
      }
    } catch {
      setDakNo(`DK-2026-${Math.floor(6000 + Math.random() * 1000)}`);
    } finally {
      setIsGeneratingDak(false);
    }
  };

  useEffect(() => {
    triggerDakGeneration();
  }, []);

  const handleDispatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dakNo || !subject) {
      alert('Specify a correct DAK Number and dispatch subject summary.');
      return;
    }

    onCreateDispatch({
      dakNo,
      subject,
      senderDept: 'Internal Audit',
      receiverDept,
      medium,
      status: 'Dispatched'
    });

    alert('Document registered inside Dispatch Book. Sequential stamp generated.');
    setSubject('');
    triggerDakGeneration();
  };

  return (
    <div id="aims-dispatch-module" className="p-6 space-y-6 animate-fade-in font-sans">
      
      {/* Banner */}
      <div className="bg-white border border-slate-300 p-4 rounded-sm shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Send className="w-5 h-5 text-blue-800" />
          Dispatch Module Terminal
        </h2>
        <p className="text-xs text-slate-500">Log all physical/digital memo distributions. Align DAK (Dak Number) protocols with state ERP tracking systems.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Dispatch Form */}
        <div className="lg:col-span-1 bg-white border border-slate-300 rounded-sm shadow-sm">
          <div className="bg-slate-100 border-b border-slate-200 p-3 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-widest">FORM: REGISTER_DISPATCH</span>
          </div>

          <form onSubmit={handleDispatchSubmit} className="p-4 space-y-4">
            <div>
              <label className="oracle-input-label block mb-1">Assigned Sequenced Dak Number</label>
              <div className="flex gap-2">
                <input
                  id="dispatch-dak-input"
                  type="text"
                  value={dakNo}
                  onChange={(e) => setDakNo(e.target.value)}
                  className="oracle-field-value flex-1 font-mono text-blue-900 font-bold bg-slate-50"
                  required
                  readOnly
                />
                <button
                  id="dispatch-seq-btn"
                  type="button"
                  onClick={triggerDakGeneration}
                  disabled={isGeneratingDak}
                  className="bg-slate-200 hover:bg-slate-300 px-2 py-1 text-slate-700 text-xs font-bold rounded-sm border border-slate-300 cursor-pointer"
                  title="Generate dynamic DAK Sequence"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingDak ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div>
              <label className="oracle-input-label block mb-1">Dispatch Subject Matter</label>
              <textarea
                id="dispatch-subject-textarea"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="VSP/AUD/CO/2026/01 Circularization regarding Slag Spillage Recovery Plan"
                className="oracle-field-value w-full h-24"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="oracle-input-label block mb-1">Target Receiver Dept</label>
                <select
                  id="dispatch-receiver-select"
                  value={receiverDept}
                  onChange={(e) => setReceiverDept(e.target.value)}
                  className="oracle-field-value w-full text-xs"
                >
                  <option value="Coke Ovens Department">Coke Ovens</option>
                  <option value="Blast Furnace Dept">Blast Furnace</option>
                  <option value="SMS-2 Department">SMS-2 Dept</option>
                  <option value="Finance & Accounts">Finance & Accounts</option>
                  <option value="Materials Management">Materials Mgmt</option>
                  <option value="Wire Rod Mill Unit">Wire Rod Mill</option>
                </select>
              </div>
              <div>
                <label className="oracle-input-label block mb-1">Postal Medium</label>
                <select
                  id="dispatch-medium-select"
                  value={medium}
                  onChange={(e) => setMedium(e.target.value as any)}
                  className="oracle-field-value w-full text-xs"
                >
                  <option value="Intranet Email">Intranet Email</option>
                  <option value="Hand Delivered">Hand Delivered</option>
                  <option value="Registered Post">Registered Post (Speed)</option>
                </select>
              </div>
            </div>

            <button
              id="dispatch-submit-btn"
              type="submit"
              className="w-full btn-primary-gov py-2 mt-2 gap-1.5"
            >
              <Navigation className="w-4 h-4" />
              REGISTER OUTWARD DISPATCH
            </button>
          </form>
        </div>

        {/* Dispatch list table (Sent/Received Status) */}
        <div className="lg:col-span-2 bg-white border border-slate-300 rounded-sm shadow-sm">
          <div className="bg-slate-100 border-b border-slate-200 p-3 flex justify-between items-center text-xs font-bold text-slate-800 uppercase">
            <span>REGISTER: DISPATCH_TRACKING_BOOK</span>
            <span className="font-mono text-[10px] text-slate-400">INDEXED: REAL_TIME</span>
          </div>

          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] tracking-wider uppercase text-slate-600">
                    <th className="p-3">Track No &amp; Date</th>
                    <th className="p-3">Dak Sequence No</th>
                    <th className="p-3">Receiver Section</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Delivery Medium</th>
                    <th className="p-3 text-right">Acknowledgement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {dispatchItems.map((item) => (
                    <tr id={`dispatch-row-${item.id}`} key={item.id} className="hover:bg-slate-50 transition-all font-medium text-slate-750">
                      <td className="p-3">
                        <p className="font-mono font-bold text-blue-900">{item.dispatchNo}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{item.date}</p>
                      </td>
                      <td className="p-3 font-mono text-purple-800 font-bold text-[11px]">{item.dakNo}</td>
                      <td className="p-3">
                        <span className="bg-slate-105 bg-slate-100 border border-slate-200 text-slate-800 px-2 py-0.5 rounded-sm">
                          {item.receiverDept}
                        </span>
                      </td>
                      <td className="p-3 max-w-xs truncate text-[11px] translate-y-0.5" title={item.subject}>
                        {item.subject}
                      </td>
                      <td className="p-3">
                        <span className="text-slate-500 font-semibold text-[10px] uppercase font-mono">{item.medium}</span>
                      </td>
                      <td className="p-3 text-right">
                        {item.status === 'Dispatched' ? (
                          <button
                            id={`ack-dispatch-btn-${item.id}`}
                            onClick={() => {
                              onUpdateDispatch(item.id, { status: 'Acknowledged' });
                              alert('Acknowledging receipt of dispatch and locking delivery. Status set to Acknowledged.');
                            }}
                            className="bg-yellow-100 hover:bg-yellow-250 hover:bg-amber-100 border border-yellow-350 text-yellow-900 font-bold px-2 py-1 text-[10px] rounded hover:border-amber-400 cursor-pointer transition-all"
                          >
                            Mark Acknowledged
                          </button>
                        ) : (
                          <span className="bg-green-100 border border-green-200 text-green-800 text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase">
                            ✓ ACKNOWLEDGED
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
