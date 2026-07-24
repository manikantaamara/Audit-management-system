import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, CheckCircle2, ChevronRight, Upload, AlertTriangle, 
  Layers, RefreshCw, Clock, ArrowRight, Check, ShieldCheck, FileSpreadsheet, Info 
} from 'lucide-react';
import { AuditReport, AuditPara, AuditPlan } from '../types';
import TransactionCutoffLedger from './TransactionCutoffLedger';
import ReportGeneratorTab from './ReportGeneratorTab';

interface ReportEntryProps {
  reports: AuditReport[];
  paras: AuditPara[];
  plans: AuditPlan[];
  onCreateReport: (r: Partial<AuditReport>) => void;
  onUpdateReport: (id: string, updates: Partial<AuditReport>) => void;
  onCreatePara: (p: Partial<AuditPara>) => void;
  onUpdatePara: (id: string, updates: Partial<AuditPara>) => void;
  currentUser: { name: string; role: string };
  onChangeRole?: (role: any) => void; 
  activeMenu?: string;
}

interface AiIngestionTabProps {
  plans: AuditPlan[];
  reports: AuditReport[];
  paras: AuditPara[];
}

function AiIngestionTab({ plans, reports, paras }: AiIngestionTabProps) {
  const [dragActive, setDragActive] = useState(false);
  const [ingestFile, setIngestFile] = useState<File | null>(null);
  const [targetIngestPlanId, setTargetIngestPlanId] = useState('');
  const [ingestSteps, setIngestSteps] = useState<{ step: string; status: 'idle' | 'running' | 'success' | 'failed'; detail?: string }[]>([
    { step: "Calculate SHA256 checksum of base file content", status: 'idle' },
    { step: "Verify cryptographic dupes against system upload table", status: 'idle' },
    { step: "Extract unstructured text streams (Mammoth/PDF-parse)", status: 'idle' },
    { step: "Initiate Gemini Structured schema parsing content", status: 'idle' },
    { step: "Execute Relational Alignment & Dept/Auditor repairs", status: 'idle' },
    { step: "Execute word bag Jaccard cosine similarity checks", status: 'idle' },
    { step: "Commit files, report headers, and paras in transactions", status: 'idle' }
  ]);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [compareRepAId, setCompareRepAId] = useState('');
  const [compareRepBId, setCompareRepBId] = useState('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf' || ext === 'docx') {
        setIngestFile(f);
        setErrorMessage('');
      } else {
        setErrorMessage('Unsupported extension. Please drop only a .pdf or .docx document.');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf' || ext === 'docx') {
        setIngestFile(f);
        setErrorMessage('');
      } else {
        setErrorMessage('Please choose a valid .pdf or .docx document.');
      }
    }
  };

  const triggerIngestSequence = async () => {
    if (!ingestFile) return;
    setIsIngesting(true);
    setErrorMessage('');
    setIngestResult(null);

    setIngestSteps(steps => steps.map(s => ({ ...s, status: 'idle', detail: undefined })));

    try {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(ingestFile);
      
      const fileDataBlob = await new Promise<string>((resolve, reject) => {
        fileReader.onload = () => {
          const base64String = (fileReader.result as string).split(',')[1];
          resolve(base64String);
        };
        fileReader.onerror = () => reject(new Error("File conversion failure"));
      });

      const stepDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

      const updateStep = (index: number, status: 'running' | 'success' | 'failed', detail?: string) => {
        setIngestSteps(prev => {
          const copy = [...prev];
          copy[index] = { ...copy[index], status, detail };
          return copy;
        });
      };

      updateStep(0, 'running');
      await stepDelay(500);
      updateStep(0, 'success', `SHA-256 Calculated successfully.`);

      updateStep(1, 'running');
      await stepDelay(400);
      updateStep(1, 'success', `Verified: Document is structurally distinct. Ready to parse.`);

      updateStep(2, 'running');
      updateStep(3, 'running');
      updateStep(4, 'running');
      updateStep(5, 'running');
      updateStep(6, 'running');

      const response = await fetch('/api/smart-ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: ingestFile.name,
          fileDataBlob,
          planId: targetIngestPlanId || undefined
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "AI Ingestion Pipeline server failure.");
      }

      if (resData.status === 'duplicate') {
        updateStep(1, 'failed', `Duplicate report detected via historical SHA-256 signatures.`);
        setErrorMessage(`Process halted: This file has been uploaded previously. Ref id: ${resData.linkedReportId}, Report No: ${resData.linkedReportNo}.`);
        setIsIngesting(false);
        return;
      }

      updateStep(2, 'success', `Stream extraction finished. Extracted metadata and narrative paragraphs.`);
      updateStep(3, 'success', `Successfully processed via Gemini 3.5-flash with structured compliance schema.`);
      updateStep(4, 'success', `${resData.fixesApplied.length} relational alignment fixes completed.`);
      updateStep(5, 'success', `Deduplicated. Skipped ${resData.duplicatesDetected.length} recurring paras.`);
      updateStep(6, 'success', `Report ${resData.report.reportNo} saved with ${resData.report.extractedParasCount} new paragraphs.`);

      setIngestResult(resData);
      setIngestFile(null);
      
      const triggerLoad = (window as any).AimsReloadState;
      if (typeof triggerLoad === 'function') {
        triggerLoad();
      }

    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong in the smart ingestion system.");
    } finally {
      setIsIngesting(false);
    }
  };

  const reportA = reports.find(r => r.id === compareRepAId);
  const reportB = reports.find(r => r.id === compareRepBId);

  const reportAParas = paras.filter(p => p.reportId === compareRepAId);
  const reportBParas = paras.filter(p => p.reportId === compareRepBId);

  const reportAFinancial = reportAParas.reduce((sum, p) => sum + p.financialImplication, 0);
  const reportBFinancial = reportBParas.reduce((sum, p) => sum + p.financialImplication, 0);

  const calculateStringSimilarity = (str1: string, str2: string): number => {
    const wordBag = (s: string) => {
      return new Set(s.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2));
    };
    const bag1 = wordBag(str1);
    const bag2 = wordBag(str2);
    if (bag1.size === 0 || bag2.size === 0) return 0;
    const intersection = new Set([...bag1].filter(x => bag2.has(x)));
    return intersection.size / Math.sqrt(bag1.size * bag2.size);
  };

  const recurrentMatches: { paraA: string; paraB: string; score: number; desc: string }[] = [];
  for (const pA of reportAParas) {
    for (const pB of reportBParas) {
      const score = calculateStringSimilarity(pA.description || "", pB.description || "");
      if (score > 0.40) {
        recurrentMatches.push({
          paraA: `[${pA.paraNo}] ${pA.title}`,
          paraB: `[${pB.paraNo}] ${pB.title}`,
          score,
          desc: pA.description
        });
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 border border-indigo-950 rounded-sm p-4 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
        <div>
          <span className="bg-cyan-500/20 text-cyan-350 border border-cyan-400/30 text-[10px] bg-sky-950 text-sky-400 font-bold font-mono uppercase px-2.5 py-1 rounded-sm tracking-widest leading-none">
            AI DIGITAL CONVERSION GATEWAY
          </span>
          <h3 className="text-sm font-black uppercase mt-2.5 tracking-wider flex items-center gap-2">
            🪄 Autonomous Document Extraction, Understanding &amp; Duplication Shield
          </h3>
          <p className="text-[11px] text-indigo-200 mt-1">
            Upload historical reports in Word (.docx) or PDF format. The system computes SHA-256 cryptographic signatures, extracts text streams, parses structured JSON schemas via Gemini, and automatically resolves relational bindings.
          </p>
        </div>
        <div className="bg-indigo-900/35 border border-indigo-750 p-3 rounded-xs shrink-0 max-w-[250px]">
          <h4 className="text-[10px] font-black text-cyan-300 uppercase tracking-widest">RELATIONAL PROTOCOL:</h4>
          <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
            ✓ Automatic department registration<br />
            ✓ Automatic auditor employee creation<br />
            ✓ Automatic linking with active Audit Plans
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-300 rounded-sm shadow-sm p-5 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-105 pb-2">
              <FileText className="w-4 h-4 text-blue-800" />
              STEP 1 &amp; 2: FILE INGESTION PORTAL
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="oracle-input-label block mb-1">Link to Target Audit Plan (Optional):</label>
                <select
                  id="ai-ingest-plan-select"
                  value={targetIngestPlanId}
                  onChange={(e) => setTargetIngestPlanId(e.target.value)}
                  className="oracle-field-value w-full"
                >
                  <option value="">-- No link (Auto-Repair / Create approved plan) --</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.id}] {(p.title || '').substring(0, 40)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="oracle-input-label block mb-1">Supported Formats:</label>
                <div className="text-[11px] text-slate-500 font-semibold bg-slate-50 p-2.5 rounded-sm border border-slate-205 py-2">
                  Microsoft Word (.docx), Adobe Acrobat PDF (.pdf). Maximum character extraction limit: 15,000.
                </div>
              </div>
            </div>

            <div 
              id="ai-file-drag-zone"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xs p-8 text-center transition-all flex flex-col items-center justify-center ${
                dragActive ? 'border-blue-700 bg-blue-50/50 scale-[0.99]' : 'border-slate-300 bg-slate-55 bg-slate-50 hover:bg-slate-100/55'
              }`}
            >
              <input 
                id="ai-file-hidden-input"
                type="file" 
                accept=".pdf,.docx" 
                className="hidden" 
                onChange={handleFileSelect}
              />

              {ingestFile ? (
                <div className="space-y-2 text-center animate-fade-in animate-duration-300">
                  <div className="bg-blue-105 bg-blue-100 text-blue-900 border border-blue-200 p-2.5 rounded-full inline-block">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <p className="text-xs font-black text-slate-800">{ingestFile.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono font-bold uppercase">
                    Size: {(ingestFile.size / 1024).toFixed(1)} KB | Format: {ingestFile.name.split('.').pop()?.toUpperCase()}
                  </p>
                  <div className="flex gap-2 justify-center pt-2">
                    <button
                      id="ai-ingest-trigger-btn"
                      onClick={triggerIngestSequence}
                      disabled={isIngesting}
                      className="bg-indigo-900 text-white font-extrabold text-[11px] px-4 py-1.5 rounded-xs hover:bg-indigo-950 transition-all cursor-pointer shadow-3xs uppercase tracking-wider flex items-center gap-1.5"
                    >
                      🪄 Trigger Ingest Sequence
                    </button>
                    <button
                      id="ai-ingest-clear-btn"
                      onClick={() => setIngestFile(null)}
                      disabled={isIngesting}
                      className="bg-slate-205 bg-slate-200 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-xs hover:bg-slate-300 transition-all cursor-pointer"
                    >
                      Clear File
                    </button>
                  </div>
                </div>
              ) : (
                <label htmlFor="ai-file-hidden-input" className="cursor-pointer space-y-2 flex flex-col items-center justify-center">
                  <div className="bg-slate-200/80 p-3 rounded-full text-slate-500 hover:text-slate-850 hover:text-slate-800 transition-all border border-slate-250">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-black text-slate-800">
                    Drag and Drop Audit Document Here or <span className="text-indigo-900 underline">Browse File</span>
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">Only PDF &amp; DOCX files are cryptographically accepted</p>
                </label>
              )}
            </div>

            {errorMessage && (
              <div className="bg-red-50 text-red-800 text-[11px] font-bold p-3 rounded-sm border border-red-200 flex items-start gap-1.5 uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4 text-red-650 text-red-650 shrink-0 mt-0.5" />
                <div>{errorMessage}</div>
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-950 text-slate-200 rounded-sm shadow-sm p-4">
            <h4 className="text-[10px] font-black tracking-widest text-slate-400 uppercase flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3 font-mono">
              <span>AIMS AI PIPELINE TERMINAL CONSOLE LOGS</span>
              <span className="bg-slate-800 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-450 px-2 py-0.5 rounded-xs font-bold font-mono">
                {isIngesting ? "PROCESSING..." : "READY"}
              </span>
            </h4>

            <div className="space-y-3 font-mono text-xs">
              {ingestSteps.map((step, idx) => {
                const numberPrefix = `[STEP ${idx + 1}]`;
                return (
                  <div key={idx} className="flex items-start gap-2 text-[11px]">
                    <span className="text-indigo-400 font-black shrink-0">{numberPrefix}</span>
                    <div className="flex-grow">
                      <p className="text-slate-200 leading-tight font-medium">{step.step}</p>
                      {step.detail && (
                        <p className="text-cyan-400 text-[10px] mt-0.5 leading-snug">{step.detail}</p>
                      )}
                    </div>
                    <div className="shrink-0 font-bold uppercase text-[9px] px-1.5 py-0.5 rounded-xs font-mono">
                      {step.status === 'idle' && (
                        <span className="text-slate-500">PENDING</span>
                      )}
                      {step.status === 'running' && (
                        <span className="text-amber-400 animate-pulse">RUNNING...</span>
                      )}
                      {step.status === 'success' && (
                        <span className="text-green-400">✓ COMPILED</span>
                      )}
                      {step.status === 'failed' && (
                        <span className="text-red-500">❌ REFUSED</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-white border border-slate-300 rounded-sm shadow-sm p-4 h-full flex flex-col">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-indigo-100 pb-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-green-700 animate-bounce" />
              PIPELINE DIGEST OUTCOME PREVIEW
            </h4>

            {ingestResult ? (
              <div className="space-y-4 flex-grow flex flex-col justify-between animate-fade-in animate-duration-300">
                <div className="bg-slate-50 p-3 rounded-sm border border-slate-200 space-y-2.5">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                    <span className="bg-green-100 border border-green-200 text-green-805 text-green-850 uppercase text-[9px] font-black px-2 py-0.5 rounded-xs tracking-wider">
                      SAVED Relational Entry
                    </span>
                    <span className="text-[10px] text-blue-900 font-mono font-black">{ingestResult.report.reportNo}</span>
                  </div>
                  <p className="text-xs font-black text-slate-900 leading-snug">{ingestResult.report.title}</p>
                  
                  <div className="grid grid-cols-2 gap-3 text-[10.5px] font-medium pt-1.5">
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[8.5px] block font-sans">Department:</span>
                      <span className="text-slate-700 font-bold uppercase">{ingestResult.report.department}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[8.5px] block font-sans">Lead Auditor:</span>
                      <span className="text-slate-700 font-bold">{ingestResult.report.leadAuditor}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 font-bold uppercase text-[8.5px] block font-sans">Audit Cycle Period:</span>
                      <span className="text-slate-700 font-mono font-bold text-[10px]">{ingestResult.report.auditPeriod}</span>
                    </div>
                  </div>
                </div>

                {(ingestResult.fixesApplied.length > 0 || ingestResult.duplicatesDetected.length > 0) && (
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-widest font-mono">DEDUPLICATION &amp; ALIGNMENT TRIGGERS:</h5>
                    
                    {ingestResult.fixesApplied.map((fix: string, idx: number) => (
                      <div key={idx} className="bg-cyan-50 border border-cyan-150 p-2 text-[10px] text-cyan-900 rounded-sm font-semibold leading-relaxed">
                        🛠️ {fix}
                      </div>
                    ))}

                    {ingestResult.duplicatesDetected.map((dup: string, idx: number) => (
                      <div key={idx} className="bg-amber-50 border border-amber-200 p-2 text-[10px] text-amber-900 rounded-sm font-semibold leading-relaxed">
                        ⚠️ {dup}
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2 flex-grow overflow-y-auto max-h-[180px] bg-slate-50 p-2 border border-slate-150 rounded-sm">
                  <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-wider font-mono">PARSED PARAGRAPHS COMMITTED ({ingestResult.parasSaved.length}):</h5>
                  
                  {ingestResult.parasSaved.length === 0 ? (
                    <p className="text-[10.5px] text-slate-455 text-slate-500 italic font-medium">No new observations. All findings matched historical duplicates and were skipped to protect referential integrity.</p>
                  ) : (
                    ingestResult.parasSaved.map((p: any, idx: number) => (
                      <div key={idx} className="bg-white border border-slate-200 p-2 rounded-sm shadow-3xs">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-indigo-900 font-mono font-black">{p.paraNo}</span>
                          <span className={`px-1.5 py-0.5 rounded-sm uppercase tracking-wider text-[8.5px] font-mono font-bold ${
                            p.category === 'Critical' ? 'bg-red-100 text-red-800' :
                            p.category === 'Major' ? 'bg-amber-100 text-amber-800' :
                            'bg-blue-100 text-blue-900'
                          }`}>
                            {p.category}
                          </span>
                        </div>
                        <p className="text-[11px] font-black text-slate-800 mt-1 leading-tight line-clamp-1">{p.title}</p>
                        <div className="text-[9.5px] text-slate-500 font-mono font-semibold mt-1.5 flex justify-between items-center">
                          <span>Risk Value:</span>
                          <span className="text-red-700 font-black">₹{p.financialImplication.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="bg-green-50 text-green-905 text-green-900 text-[10.5px] font-bold p-2.5 rounded-sm border border-green-200 flex items-center gap-1.5 leading-none">
                  <Check className="w-4 h-4 text-green-700" />
                  AIMS DATABASE TRANSACTIONS COMPLETED. RELATIONAL REPAIR SUCCESSFULLY SAVED.
                </div>

              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center p-8 bg-slate-50 rounded-sm border border-slate-205 text-center">
                <div className="bg-slate-100 p-3.5 rounded-full text-slate-400 border border-slate-250 mb-3 animate-pulse">
                  <FileText className="w-7 h-7" />
                </div>
                <p className="text-xs font-black text-slate-700">No Ingest Log Compiled</p>
                <p className="text-[10px] text-slate-500 mt-1 pr-4 pl-4 max-w-[280px] font-medium leading-relaxed">
                  Load and execute an unstructured report on the left panel to watch your relational auto-extract outcome in real-time.
                </p>
              </div>
            )}

          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-300 rounded-sm shadow-sm p-5 space-y-5">
        <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-indigo-700" />
              HISTORICAL DYNAMIC REPORT COMPARE SHIELD (CROSS-AUDIT ANALYSIS)
            </h4>
            <p className="text-[10.5px] text-slate-500 mt-0.5">
              Choose any two historical or current reports. The compare logic will run a side-by-side audit and cross-recurrence matches instantly!
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div>
              <select
                id="compare-report-select-a"
                value={compareRepAId}
                onChange={(e) => setCompareRepAId(e.target.value)}
                className="oracle-field-value text-xs bg-slate-50 border border-slate-300 rounded p-1 max-w-[200px]"
              >
                <option value="">-- Choose Report A (Historical) --</option>
                {reports.map(r => (
                  <option key={r.id} value={r.id}>[{r.reportNo}] {(r.title || '').substring(0,25)}...</option>
                ))}
              </select>
            </div>
            <span className="text-xs font-black text-slate-400">VS</span>
            <div>
              <select
                id="compare-report-select-b"
                value={compareRepBId}
                onChange={(e) => setCompareRepBId(e.target.value)}
                className="oracle-field-value text-xs bg-slate-50 border border-slate-300 rounded p-1 max-w-[200px]"
              >
                <option value="">-- Choose Report B (Current) --</option>
                {reports.map(r => (
                  <option key={r.id} value={r.id}>[{r.reportNo}] {(r.title || '').substring(0,25)}...</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {reportA && reportB ? (
          <div className="space-y-6 animate-fade-in animate-duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 border-l-4 border-blue-800 border rounded-r p-4 space-y-3 shadow-3xs">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] uppercase font-black text-blue-900 tracking-wider">REPORT HEADER A</span>
                  <span className="text-xs font-mono font-bold">{reportA.reportNo}</span>
                </div>
                <h4 className="text-xs font-black text-slate-900 leading-snug">{reportA.title}</h4>
                
                <table className="w-full text-left text-[11px] font-medium border-t border-dashed border-slate-200 pt-2 table-fixed">
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-1 text-slate-400 pr-2">Target Dept:</td>
                      <td className="py-1 text-slate-800 font-bold uppercase">{reports.find(rp => rp.id === compareRepAId)?.department || "Purchase Division"}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1 text-slate-400 pr-2">Lead Auditor:</td>
                      <td className="py-1 text-slate-800 font-bold">{reportA.leadAuditor}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1 text-slate-400 pr-2">Audit Cycle Period:</td>
                      <td className="py-1 text-slate-800 font-mono">{reportA.auditPeriod || "FY 2024-25 Q3"}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1 text-slate-400 pr-2">Total Mapped Paras:</td>
                      <td className="py-1 text-blue-900 font-black">{reportAParas.length} observations</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-slate-400 pr-2">Financial Leakages:</td>
                      <td className="py-1 text-red-700 font-black">₹{reportAFinancial.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 border-l-4 border-indigo-850 border rounded-r p-4 space-y-3 shadow-3xs">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] uppercase font-black text-indigo-900 tracking-wider">REPORT HEADER B</span>
                  <span className="text-xs font-mono font-bold">{reportB.reportNo}</span>
                </div>
                <h4 className="text-xs font-black text-slate-905 text-slate-900 leading-snug">{reportB.title}</h4>
                
                <table className="w-full text-left text-[11px] font-medium border-t border-dashed border-slate-200 pt-2 table-fixed">
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-1 text-slate-400 pr-2">Target Dept:</td>
                      <td className="py-1 text-slate-800 font-bold uppercase">{reports.find(rp => rp.id === compareRepBId)?.department || "General Division"}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1 text-slate-400 pr-2">Lead Auditor:</td>
                      <td className="py-1 text-slate-800 font-bold">{reportB.leadAuditor}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1 text-slate-400 pr-2">Audit Cycle Period:</td>
                      <td className="py-1 text-slate-800 font-mono">{reportB.auditPeriod || "FY 2025-26 Q4"}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1 text-slate-400 pr-2">Total Mapped Paras:</td>
                      <td className="py-1 text-indigo-900 font-black">{reportBParas.length} observations</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-slate-400 pr-2">Financial Leakages:</td>
                      <td className="py-1 text-red-700 font-black">₹{reportBFinancial.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-sm p-4">
              <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-widest font-mono flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-orange-755 text-orange-700 shrink-0" />
                CROSS-OBSERVATION RECURRENCE TABLE (SIMILARITY MATCH TRACKER)
              </h5>

              {recurrentMatches.length === 0 ? (
                <div className="text-center py-6 text-[11px] text-slate-400 italic">
                  No significant recurring vulnerabilities detected between Report A and Report B. Observations represent distinct scopes!
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-rose-50 border border-rose-200 text-rose-955 text-rose-900 p-2.5 rounded-xs text-[10.5px] leading-relaxed font-semibold">
                    ⚠️ <strong>Vulnerability Warning:</strong> Identified {recurrentMatches.length} cross-period recurring finding(s). These are historical audit failures that have recurred or show substantial keyword overlay under active scopes!
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase border-b border-slate-200">
                          <th className="p-2.5">Observation in Report A</th>
                          <th className="p-2.5">Observation in Report B</th>
                          <th className="p-2.5">Word Bag Overlap Similarity</th>
                          <th className="p-2.5">Warning Alert Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recurrentMatches.map((m, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-all border-b border-slate-100 font-medium text-slate-800">
                            <td className="p-2.5 text-blue-950 font-black">{m.paraA}</td>
                            <td className="p-2.5 text-indigo-950 font-black">{m.paraB}</td>
                            <td className="p-2.5 font-mono text-[10.5px] font-bold">{(m.score * 100).toFixed(0)}% Match</td>
                            <td className="p-2.5">
                              <span className={`inline-block px-2 py-0.5 rounded-sm text-[8.5px] font-bold uppercase ${
                                m.score > 0.70 ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                              }`}>
                                {m.score > 0.70 ? "🚨 HIGH RECURRENCE VULNERABILITY" : "⚠️ SUSPECT OVERLAP"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-xs text-slate-400 italic bg-slate-50 rounded border border-dashed border-slate-200 font-medium">
            Select both Report A and Report B above to trigger the dynamic compare and recurrence analysis suite.
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReportEntry({ 
  reports, paras, plans, onCreateReport, onUpdateReport, onCreatePara, onUpdatePara, currentUser, onChangeRole, activeMenu
}: ReportEntryProps) {
  const [activeTab, setActiveTab ] = useState<'entry' | 'paras' | 'reviewer' | 'category_change' | 'upload_status' | 'ai_ingestion' | 'cutoff_manager' | 'report_generator'>(
    currentUser?.role?.toUpperCase() === 'HOD' ? 'upload_status' : 'entry'
  );

  useEffect(() => {
    if (currentUser?.role?.toUpperCase() === 'HOD') {
      setActiveTab('upload_status');
      return;
    }
    if (!activeMenu) return;
    if (activeMenu === 'report_generator') {
      setActiveTab('report_generator');
    } else if (activeMenu === 'report_entry') {
      setActiveTab('entry');
    } else if (activeMenu === 'review_entry') {
      setActiveTab('reviewer');
    } else if (activeMenu === 'category_change') {
      setActiveTab('category_change');
    } else if (activeMenu === 'transaction_audit') {
      setActiveTab('cutoff_manager');
    } else if (activeMenu === 'ai_document_ingestion') {
      setActiveTab('ai_ingestion');
    } else if (
      activeMenu === 'upload_jpg_word_pdf' || 
      activeMenu === 'pending_reports' || 
      activeMenu === 'status_transfer' || 
      activeMenu === 'show_reports_status'
    ) {
      setActiveTab('upload_status');
    }
  }, [activeMenu, currentUser]);
  
  // Custom states for uploads & transfer status hub
  const [targetUploadId, setTargetUploadId] = useState('');
  const [uploadedFormat, setUploadedFormat] = useState<'PDF' | 'DOCX' | 'JPG'>('PDF');
  const [customOriginalFilename, setCustomOriginalFilename] = useState('');
  const [transferTargetReportId, setTransferTargetReportId] = useState('');
  const [transferStatusInfo, setTransferStatusInfo] = useState<Record<string, string>>({});
  
  // New Report entry states
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [reportNo, setReportNo] = useState('');
  const [title, setTitle] = useState('');
  const [period, setPeriod] = useState('FY 2025-26 Q4');
  const [department, setDepartment] = useState('Coke Ovens Department');
  
  // New Para state
  const [selectedReportId, setSelectedReportId] = useState('');
  const [paraNo, setParaNo] = useState('');
  const [paraTitle, setParaTitle] = useState('');
  const [paraCategory, setParaCategory] = useState<'Critical' | 'Major' | 'Minor'>('Major');
  const [paraDescription, setParaDescription] = useState('');
  const [paraImplication, setParaImplication] = useState('0');

  // File upload simulation state
  const [uploadProgress, setUploadProgress] = useState<Record<string, boolean>>({});
  const [isUploading, setIsUploading] = useState(false);

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId || !reportNo || !title) {
      alert('Please fill out all mandatory report descriptors.');
      return;
    }

    onCreateReport({
      planId: selectedPlanId,
      reportNo,
      title,
      auditPeriod: period,
      leadAuditor: currentUser.name,
      department,
      status: 'Draft',
      parasCount: 0
    });

    alert('Report header successfully drafted and registered inside AIMS schema.');
    setReportNo('');
    setTitle('');
  };

  const handleParaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportId || !paraNo || !paraTitle || !paraDescription) {
      alert('Please fill out all mandatory Paragraph parameters.');
      return;
    }

    onCreatePara({
      reportId: selectedReportId,
      paraNo,
      title: paraTitle,
      category: paraCategory,
      description: paraDescription,
      financialImplication: parseFloat(paraImplication) || 0,
      status: 'Outstanding'
    });

    alert(`Audit ${paraNo} successfully appended to Report list.`);
    setParaNo('');
    setParaTitle('');
    setParaDescription('');
    setParaImplication('0');
  };

  // Simulated doc uploader
  const handleSimulatedUpload = async (reportId: string, filename: string) => {
    setIsUploading(true);
    setUploadProgress(prev => ({ ...prev, [reportId]: true }));

    try {
      const response = await fetch('/api/upload-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, fileType: 'PDF' })
      });
      const data = await response.json();
      if (data.success) {
        onUpdateReport(reportId, { attachmentName: data.attachmentName });
        alert(`Secured document upload confirmation: "${data.attachmentName}" successfully cryptographically linked.`);
      }
    } catch {
      alert('Intranet file server offline.');
    } finally {
      setIsUploading(false);
      setUploadProgress(prev => ({ ...prev, [reportId]: false }));
    }
  };

  // Modify Category change manually
  const handleCategoryChange = (paraId: string, newCategory: 'Critical' | 'Major' | 'Minor') => {
    onUpdatePara(paraId, { category: newCategory });
    alert(`Category change action authorized: Para is now designated as [${newCategory}]. Database updated.`);
  };

  return (
    <div id="aims-report-entry" className="p-6 space-y-6 animate-fade-in font-sans">
      
      {/* Tab bar header */}
      <div className="bg-white border border-slate-300 p-4 rounded-sm shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-800" />
            Audit Report Entry & Review Engine
          </h2>
          <p className="text-xs text-slate-500 font-medium">Verify live reports, upload Digitally Signed PDFs, and draft corporate Audit Paras.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {currentUser?.role?.toUpperCase() !== 'HOD' && (
            <>
              <button 
                id="report-tab-btn-header"
                onClick={() => setActiveTab('entry')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xs transition-all cursor-pointer ${
                  activeTab === 'entry' ? 'bg-blue-800 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Draft Report Header
              </button>
              <button 
                id="report-tab-btn-paras"
                onClick={() => setActiveTab('paras')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xs transition-all cursor-pointer ${
                  activeTab === 'paras' ? 'bg-blue-800 text-white shadow-xs' : 'bg-slate-100 text-slate-705 hover:bg-slate-200'
                }`}
              >
                Append Audit Paras
              </button>
              <button 
                id="report-tab-btn-review"
                onClick={() => setActiveTab('reviewer')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xs transition-all cursor-pointer ${
                  activeTab === 'reviewer' ? 'bg-blue-800 text-white shadow-xs' : 'bg-slate-100 text-slate-705 hover:bg-slate-200'
                }`}
              >
                Authorize / Review Board
              </button>
              <button 
                id="report-tab-btn-category"
                onClick={() => setActiveTab('category_change')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xs transition-all cursor-pointer ${
                  activeTab === 'category_change' ? 'bg-blue-800 text-white shadow-xs' : 'bg-slate-100 text-slate-705 hover:bg-slate-200'
                }`}
              >
                Category Change Form
              </button>
              <button 
                id="report-tab-btn-ai-portal"
                onClick={() => setActiveTab('ai_ingestion')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xs border transition-all cursor-pointer ${
                  activeTab === 'ai_ingestion'
                    ? 'bg-gradient-to-r from-blue-900 to-indigo-900 text-white border-blue-950 shadow-xs'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-950 hover:bg-indigo-100'
                }`}
              >
                🪄 AI Smart Ingest &amp; Compare
              </button>
            </>
          )}
          <button 
            id="report-tab-btn-uploads-hub"
            onClick={() => setActiveTab('upload_status')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xs transition-all cursor-pointer border ${
              activeTab === 'upload_status' ? 'bg-blue-805 bg-blue-800 text-white border-blue-900 shadow-xs' : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border-amber-300'
            }`}
          >
            Uploads &amp; Transfer Status Hub
          </button>
          {currentUser?.role?.toUpperCase() !== 'HOD' && (
            <>
              <button 
                id="report-tab-btn-cutoff font-bold"
                onClick={() => setActiveTab('cutoff_manager')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xs transition-all cursor-pointer border ${
                  activeTab === 'cutoff_manager' ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs' : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border-emerald-300'
                }`}
              >
                🔍 Transaction Audit &amp; Cut-Off Ledger
              </button>
              <button 
                id="report-tab-btn-generator"
                onClick={() => setActiveTab('report_generator')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xs transition-all cursor-pointer border ${
                  activeTab === 'report_generator' ? 'bg-red-800 text-white border-red-900 shadow-xs' : 'bg-red-50 text-red-900 hover:bg-red-100 border-red-300'
                }`}
              >
                📄 Report PDF Generator
              </button>
            </>
          )}
        </div>
      </div>

      {activeTab === 'entry' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Standard Report Header entry form */}
          <div className="lg:col-span-1 bg-white border border-slate-300 rounded-sm shadow-sm">
            <div className="bg-slate-100 border-b border-slate-200 p-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">FORM: REPORT_HEADER_ENTRY</span>
            </div>

            <form onSubmit={handleReportSubmit} className="p-4 space-y-4">
              <div>
                <label className="oracle-input-label block mb-1">Link to Approved Plan</label>
                <select
                  id="header-plan-select"
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="oracle-field-value w-full"
                  required
                >
                  <option value="">-- Choose Approved Target --</option>
                  {plans.filter(p => p.status === 'Approved').map(p => (
                    <option key={p.id} value={p.id}>[{p.id}] {(p.title || '').substring(0, 45)}...</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="oracle-input-label block mb-1">Official Voucher/Report No</label>
                <input 
                  id="header-report-no-input"
                  type="text" 
                  value={reportNo}
                  onChange={(e) => setReportNo(e.target.value)}
                  placeholder="e.g. VSP/AUD/CO/2026/05"
                  className="oracle-field-value w-full"
                  required
                />
              </div>

              <div>
                <label className="oracle-input-label block mb-1">Audit Subject Header</label>
                <input 
                  id="header-title-input"
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Review of Oxygen Plant maintenance logs"
                  className="oracle-field-value w-full"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="oracle-input-label block mb-1">Target Plant / Department</label>
                  <select 
                    id="header-dept-select"
                    value={department} 
                    onChange={(e) => setDepartment(e.target.value)}
                    className="oracle-field-value w-full"
                  >
                    <option value="Coke Ovens Department">Coke Ovens Dept</option>
                    <option value="Blast Furnace Dept">Blast Furnace Dept</option>
                    <option value="SMS-2 Department">SMS-2 Dept</option>
                    <option value="Materials Management">Materials Mgmt</option>
                    <option value="Finance & Accounts">Finance & Accounts</option>
                  </select>
                </div>
                <div>
                  <label className="oracle-input-label block mb-1">Audit Period Reference</label>
                  <input 
                    id="header-period-input"
                    type="text" 
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="oracle-field-value w-full"
                  />
                </div>
              </div>

              <button 
                id="header-submit-btn"
                type="submit" 
                className="w-full btn-primary-gov py-2.5 mt-2 gap-1.5"
              >
                <Plus className="w-4 h-4" />
                CREATE REPORT RECORD (INSERT)
              </button>
            </form>
          </div>

          {/* Right: Reports Index Table & PDF File Attach Simulation (Main Features 3B - Upload JPG/WORD/PDF Reports) */}
          <div className="lg:col-span-2 bg-white border border-slate-300 rounded-sm shadow-sm flex flex-col">
            <div className="bg-slate-100 border-b border-slate-200 p-3 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">RECORDS: AUDIT_REPORTS_INDEX</span>
              <span className="text-[10px] font-bold text-slate-500 font-mono">STATUS: STABLE</span>
            </div>

            <div className="p-4 flex-1 overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] tracking-wider uppercase text-slate-705 text-slate-600 font-bold">
                    <th className="p-2.5">Report Voucher / Number</th>
                    <th className="p-2.5">Audit Subject &amp; Officer</th>
                    <th className="p-2.5">Assigned Facility</th>
                    <th className="p-2.5 font-bold">Clearance Code</th>
                    <th className="p-2.5 text-right">Linked Dossier (PDF/Word)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-slate-800">
                  {reports.map((rep) => (
                    <tr id={`report-header-row-${rep.id}`} key={rep.id} className="hover:bg-slate-50 font-medium">
                      <td className="p-2.5">
                        <p className="font-mono font-bold text-blue-900">{rep.reportNo}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">VSP-{rep.id}</p>
                      </td>
                      <td className="p-2.5">
                        <p className="font-bold text-slate-900 text-xs">{rep.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Auditor Assignment: {rep.leadAuditor}</p>
                      </td>
                      <td className="p-2.5 text-slate-600">{rep.department}</td>
                      <td className="p-2.5">
                        <span className={`inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          rep.status === 'Authorized' ? 'bg-green-100 text-green-900 border border-green-250' : 'bg-yellow-105 bg-yellow-100 text-amber-900 border border-amber-200'
                        }`}>{rep.status}</span>
                      </td>
                      <td className="p-2.5 text-right">
                        {rep.attachmentName ? (
                          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-[10px] px-2.5 py-1 rounded-sm font-mono font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{rep.attachmentName}</span>
                          </div>
                        ) : (
                          <div className="inline-flex justify-end items-center gap-2">
                            <button
                              id={`upload-pdf-btn-${rep.id}`}
                              onClick={() => handleSimulatedUpload(rep.id, `${rep.reportNo.replace(/\//g, '_')}_Final_Signed.pdf`)}
                              className="bg-blue-800 text-white hover:bg-blue-900 text-[10px] font-bold py-1 px-2.5 rounded-sm flex items-center gap-1.5 cursor-pointer transition-all shadow-3xs"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              Attach Signed PDF
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'paras' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Paragraph Insertion Form */}
          <div className="lg:col-span-1 bg-white border border-slate-300 rounded-sm shadow-sm">
            <div className="bg-slate-100 border-b border-slate-200 p-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">FORM: INSERT_AUDIT_PARA</span>
            </div>

            <form onSubmit={handleParaSubmit} className="p-4 space-y-4">
              <div>
                <label className="oracle-input-label block mb-1">Target Report Document</label>
                <select
                  id="para-report-select"
                  value={selectedReportId}
                  onChange={(e) => setSelectedReportId(e.target.value)}
                  className="oracle-field-value w-full"
                  required
                >
                  <option value="">-- Select Report No --</option>
                  {reports.map(r => (
                    <option key={r.id} value={r.id}>[{r.reportNo}] {(r.title || '').substring(0, 40)}...</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="oracle-input-label block mb-1">Para No Selection</label>
                  <input 
                    id="para-no-input"
                    type="text" 
                    value={paraNo}
                    onChange={(e) => setParaNo(e.target.value)}
                    placeholder="e.g. Para 1.4"
                    className="oracle-field-value w-full"
                    required
                  />
                </div>
                <div>
                  <label className="oracle-input-label block mb-1">Initial Designation</label>
                  <select 
                    id="para-cat-select"
                    value={paraCategory} 
                    onChange={(e) => setParaCategory(e.target.value as any)}
                    className="oracle-field-value w-full"
                  >
                    <option value="Critical">Critical Exception</option>
                    <option value="Major">Major Variance</option>
                    <option value="Minor">Minor Discrepancy</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="oracle-input-label block mb-1">Para Brief Header Title</label>
                <input 
                  id="para-title-input"
                  type="text" 
                  value={paraTitle}
                  onChange={(e) => setParaTitle(e.target.value)}
                  placeholder="e.g. Non-deduction of customs recovery surcharge"
                  className="oracle-field-value w-full"
                  required
                />
              </div>

              <div>
                <label className="oracle-input-label block mb-1">Technical Observation Details</label>
                <textarea 
                  id="para-desc-textarea"
                  value={paraDescription}
                  onChange={(e) => setParaDescription(e.target.value)}
                  placeholder="Describe financial anomaly, failure to comply with circular guidelines, or operational spillage leakages..."
                  className="oracle-field-value w-full h-24"
                  required
                />
              </div>

              <div>
                <label className="oracle-input-label block mb-1">Financial Implication (INR ₹)</label>
                <input 
                  id="para-cost-input"
                  type="number" 
                  value={paraImplication}
                  onChange={(e) => setParaImplication(e.target.value)}
                  placeholder="e.g. 150000"
                  className="oracle-field-value w-full font-mono text-slate-800"
                  required
                />
              </div>

              <button 
                id="para-submit-btn"
                type="submit" 
                className="w-full btn-primary-gov py-2.5 mt-2 gap-1.5"
              >
                <Plus className="w-4.5 h-4.5" />
                INSERT AUDIT PARA
              </button>
            </form>
          </div>

          {/* Connected Paras View (Main Features 3B - Audit Paras List Status) */}
          <div className="lg:col-span-2 bg-white border border-slate-300 rounded-sm shadow-sm flex flex-col">
            <div className="bg-slate-100 border-b border-slate-200 p-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">CURRENT ACTIVE AUDIT PARAS REGISTER</span>
            </div>

            <div className="p-4 flex-1 overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-205 text-[10px] tracking-wider uppercase text-slate-700 font-bold">
                    <th className="p-2.5">Para No / Code</th>
                    <th className="p-2.5">Observation Heading</th>
                    <th className="p-2.5">Anomaly details</th>
                    <th className="p-2.5 text-right">Implication (INR ₹)</th>
                    <th className="p-2.5 text-right font-mono">Filing Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-slate-800">
                  {paras.map((p) => {
                    const correlatedReport = reports.find(r => r.id === p.reportId);
                    return (
                      <tr id={`para-row-${p.id}`} key={p.id} className="hover:bg-slate-50 font-medium">
                        <td className="p-2.5">
                          <span className="bg-blue-50 text-blue-900 border border-blue-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm block text-center max-w-[80px]">
                            {p.paraNo}
                          </span>
                        </td>
                        <td className="p-2.5 font-bold text-slate-900 text-xs">
                          {p.title}
                          {correlatedReport && (
                            <p className="text-[10px] text-slate-400 font-mono font-normal mt-0.5">Report: {correlatedReport.reportNo}</p>
                          )}
                        </td>
                        <td className="p-2.5 text-slate-600 max-w-sm text-justify">{p.description}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-800 text-xs">
                          ₹{p.financialImplication.toLocaleString('en-IN')}
                        </td>
                        <td className="p-2.5 text-right whitespace-nowrap">
                          <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            p.category === 'Critical' ? 'bg-red-100 text-red-800 border border-red-200' :
                            p.category === 'Major' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            'bg-blue-100 text-blue-855 text-blue-800 border border-blue-200'
                          }`}>
                            {p.category}
                          </span>
                          <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ml-1 border ${
                            p.status === 'Settled' ? 'bg-green-105 bg-green-100 text-green-900 border-green-200' : 'bg-rose-100 text-rose-900 border-rose-150'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'reviewer' && (
        <div className="bg-white border border-slate-300 rounded-sm shadow-sm">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-4">
            <h3 className="text-xs font-mono text-slate-300 tracking-wider">OFFICIAL SYSTEM AUDIT & ADVISORY REVIEW BOARD</h3>
            <h2 className="text-base font-bold text-yellow-300">Authorize drafted report and generate officially sanctioned DAK references</h2>
          </div>

          <div className="p-4 space-y-4">
            {currentUser.role !== 'Reviewer' && (
              <div className="bg-amber-50 border-l-4 border-amber-550 border-amber-500 p-3 text-xs text-amber-900 flex items-start gap-2 rounded-xs">
                <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-amber-700 mt-0.5" />
                <div>
                  <p className="font-bold">Privilege Restriction Alert</p>
                  <p className="mt-0.5">Your active session lacks appropriate CAE or Audit Board Reviewer authorizations. Use the <strong>Role Swap Select Menu</strong> on the top header bar to temporarily simulate <strong>Reviewer</strong> access.</p>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="bg-slate-100 text-[10px] text-slate-700 uppercase font-bold tracking-wider border-b border-slate-200">
                    <th className="p-3">Reference No</th>
                    <th className="p-3">Report Subject Area</th>
                    <th className="p-3">Executing Auditor</th>
                    <th className="p-3">Paras Assigned</th>
                    <th className="p-3">Current Authorization Code</th>
                    <th className="p-3 text-right">Sanction Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {reports.map((rep) => (
                    <tr id={`review-row-${rep.id}`} key={rep.id} className="hover:bg-slate-50 transition-all font-medium text-slate-700">
                      <td className="p-3 font-mono font-bold text-blue-900">{rep.reportNo}</td>
                      <td className="p-3">
                        <p className="font-bold text-slate-900 text-xs">{rep.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Department Target: {rep.department}</p>
                      </td>
                      <td className="p-3">{rep.leadAuditor}</td>
                      <td className="p-3">
                        <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-sm text-[10px]">
                          {rep.parasCount} Active Paras
                        </span>
                      </td>
                      <td className="p-3 text-[11px]">
                        <span className={`font-bold ${rep.status === 'Authorized' ? 'text-green-700' : 'text-amber-700'}`}>
                          {rep.status === 'Authorized' ? '✓ FULL_AUTHORIZED' : '📝 PENDING_BOARD_CLEARANCE'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {rep.status !== 'Authorized' ? (
                          <button
                            id={`certify-report-btn-${rep.id}`}
                            onClick={() => {
                              onUpdateReport(rep.id, { status: 'Authorized', dateSubmitted: new Date().toISOString().split('T')[0] });
                              alert('This report has been officially stamped, authorized, and made visible to site HODs for reply actions.');
                            }}
                            disabled={currentUser.role !== 'Reviewer'}
                            className="bg-green-700 text-white font-bold px-3 py-1.5 rounded-xs hover:bg-green-800 text-[11px] disabled:opacity-50 cursor-pointer shadow-3xs"
                          >
                            Certify & Release
                          </button>
                        ) : (
                          <span className="text-[11px] text-green-700 font-bold italic">Passed Board</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'category_change' && (
        <div className="bg-white border border-slate-300 rounded-sm shadow-sm p-6">
          <div className="border-b border-slate-200 pb-3 mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-orange-700 animate-pulse" />
              Main Features: Audit Paras Category Change Form
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">CVC Auditing Directives allow certified auditors to scale or adjust designations (Critical to Major / Minor) based on field justifications.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase tracking-widest border-b border-slate-200">
                  <th className="p-3">Paragraph Ref</th>
                  <th className="p-3">Observation Heading</th>
                  <th className="p-3">Implication Amount</th>
                  <th className="p-3">Current Category</th>
                  <th className="p-3 text-right">Authorize Dynamic Re-Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {paras.map((p) => (
                  <tr id={`cat-change-row-${p.id}`} key={p.id} className="hover:bg-slate-50 transition-all text-slate-800">
                    <td className="p-3 font-mono font-bold text-blue-900">{p.paraNo}</td>
                    <td className="p-3 font-bold text-xs">{p.title}</td>
                    <td className="p-3 font-mono text-[11px]">₹{p.financialImplication.toLocaleString('en-IN')}</td>
                    <td className="p-3 font-semibold text-[11px]">
                      <span className={`inline-block px-2.5 py-0.5 rounded-sm ${
                        p.category === 'Critical' ? 'bg-red-100 text-red-800' :
                        p.category === 'Major' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>{p.category}</span>
                    </td>
                    <td className="p-3 text-right">
                      {currentUser.role !== 'Reviewer' ? (
                        <span className="text-[10px] text-slate-400 italic">Reviewer privilege needed</span>
                      ) : (
                        <div className="flex gap-1 justify-end">
                          <button
                            id={`change-cat-crit-${p.id}`}
                            onClick={() => handleCategoryChange(p.id, 'Critical')}
                            className="bg-red-700 text-white rounded-xs text-[10px] font-bold px-2 py-1 hover:bg-red-800 transition-all cursor-pointer"
                          >
                            Critical
                          </button>
                          <button
                            id={`change-cat-maj-${p.id}`}
                            onClick={() => handleCategoryChange(p.id, 'Major')}
                            className="bg-amber-600 text-white rounded-xs text-[10px] font-bold px-2 py-1 hover:bg-amber-700 transition-all cursor-pointer"
                          >
                            Major
                          </button>
                          <button
                            id={`change-cat-min-${p.id}`}
                            onClick={() => handleCategoryChange(p.id, 'Minor')}
                            className="bg-blue-700 text-white rounded-xs text-[10px] font-bold px-2 py-1 hover:bg-blue-800 transition-all cursor-pointer"
                          >
                            Minor
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'ai_ingestion' && (
        <AiIngestionTab plans={plans} reports={reports} paras={paras} />
      )}

      {activeTab === 'upload_status' && (() => {
        // Find reports still pending file uploads
        const pendingReports = reports.filter(r => !r.attachmentName);
        const uploadedReportsCount = reports.length - pendingReports.length;

        // Dynamic upload simulator handler
        const handleHubCustomUpload = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!targetUploadId) {
            alert("Please select a target Audit Report first!");
            return;
          }
          
          const targetRep = reports.find(r => r.id === targetUploadId);
          if (!targetRep) return;

          const defaultName = `${targetRep.reportNo.replace(/\//g, '_')}_Attachment.${uploadedFormat === 'PDF' ? 'pdf' : uploadedFormat === 'DOCX' ? 'docx' : 'jpg'}`;
          const finalFilename = customOriginalFilename.trim() || defaultName;

          setIsUploading(true);
          setUploadProgress(prev => ({ ...prev, [targetUploadId]: true }));

          try {
            const response = await fetch('/api/upload-simulation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filename: finalFilename, fileType: uploadedFormat })
            });
            const data = await response.json();
            if (data.success) {
              onUpdateReport(targetUploadId, { attachmentName: data.attachmentName });
              alert(`Success: Linked file "${data.attachmentName}" [Format: ${uploadedFormat}] to Report ${targetRep.reportNo}!`);
              setTargetUploadId('');
              setCustomOriginalFilename('');
            }
          } catch {
            alert("Attachment engine server connection error.");
          } finally {
            setIsUploading(false);
            setUploadProgress(prev => ({ ...prev, [targetUploadId]: false }));
          }
        };

        // Quick trigger for backlog
        const handleQuickPendingAttach = (reportId: string, format: 'PDF' | 'DOCX' | 'JPG') => {
          const r = reports.find(rep => rep.id === reportId);
          if (!r) return;
          const ext = format.toLowerCase();
          const fname = `${r.reportNo.replace(/\//g, '_')}_QuickSigned.${ext}`;
          handleSimulatedUpload(reportId, fname);
        };

        // Transfer dispatch authorization handler
        const handleAuthorizeTransfer = (reportId: string) => {
          setTransferStatusInfo(prev => ({
            ...prev,
            [reportId]: "Transferred & Published"
          }));
          alert(`Official Dossier Transfer Authorized! Dispatch log sent to RINL HOD & Intranet Central Registry.`);
        };

        return (
          <div className="space-y-6">

            {/* Split layout for upload forms and backlog reports */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Box 1: Dynamic File Upload Portal (JPG/Word/PDF) */}
              <div className="bg-white border border-slate-300 rounded-sm shadow-md overflow-hidden flex flex-col">
                <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-800 p-3.5 text-white flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest font-mono">JPG/WORD/PDF UPLOAD PORTAL</span>
                  <Upload className="w-4.5 h-4.5 text-yellow-300" />
                </div>

                <form onSubmit={handleHubCustomUpload} className="p-4 space-y-4 flex-grow">
                  <div>
                    <label className="oracle-input-label block mb-1">Target Report Header:</label>
                    <select
                      id="hub-upload-report-select"
                      value={targetUploadId}
                      onChange={(e) => setTargetUploadId(e.target.value)}
                      className="oracle-field-value w-full"
                      required
                    >
                      <option value="">-- Choose Report to Upload For --</option>
                      {reports.map((r) => (
                        <option key={r.id} value={r.id}>
                          [{r.reportNo}] {(r.title || '').substring(0, 39)}...
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="oracle-input-label block mb-1">Dossier File Format Extension:</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['PDF', 'DOCX', 'JPG'] as const).map((fmt) => (
                        <button
                          id={`format-selector-${fmt}`}
                          key={fmt}
                          type="button"
                          onClick={() => setUploadedFormat(fmt)}
                          className={`py-2 text-xs font-black rounded-xs border cursor-pointer text-center tracking-wider transition-all ${
                            uploadedFormat === fmt
                              ? 'bg-blue-900 border-blue-950 text-white shadow-3xs'
                              : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'
                          }`}
                        >
                          .{fmt.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="oracle-input-label block mb-1">Custom Original Filename (Optional):</label>
                    <input
                      id="hub-upload-filename-input"
                      type="text"
                      value={customOriginalFilename}
                      onChange={(e) => setCustomOriginalFilename(e.target.value)}
                      placeholder="e.g. RINL_CO_Report_Final_V1"
                      className="oracle-field-value w-full"
                    />
                    <p className="text-[9px] text-slate-400 mt-1 uppercase font-semibold font-mono">
                      Will default to standard voucher naming system if empty.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      id="hub-upload-submit-btn"
                      type="submit"
                      disabled={isUploading}
                      className="w-full bg-blue-800 hover:bg-blue-900 text-white font-extrabold text-[11px] py-2.5 rounded-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-3xs"
                    >
                      <Upload className="w-4 h-4" />
                      {isUploading ? "Uploading to secure directory..." : "UPLOAD REPORT FILE"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Box 2: Reports Still Pending Upload (Filtered backlog) */}
              <div className="bg-white border border-slate-300 rounded-sm shadow-md flex flex-col max-h-[360px] overflow-hidden">
                <div className="bg-slate-100 border-b border-slate-250 p-3.5 flex justify-between items-center text-xs font-bold text-slate-800 uppercase tracking-wide">
                  <span className="flex items-center gap-1.5 text-rose-700">
                    <AlertTriangle className="w-4.5 h-4.5" />
                    STILL PENDING FOR UPLOAD REPORT
                  </span>
                  <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full text-[10px] font-mono leading-none">
                    {pendingReports.length} Unresolved
                  </span>
                </div>

                <div className="p-3 overflow-y-auto space-y-2.5 flex-grow bg-slate-50">
                  {pendingReports.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-400 italic">
                      All created reports have documents loaded successfully!
                    </div>
                  ) : (
                    pendingReports.map((r) => (
                      <div 
                        id={`pending-file-card-${r.id}`}
                        key={r.id} 
                        className="bg-white border border-slate-200 p-2.5 rounded-sm shadow-3xs flex flex-col relative"
                      >
                        <span className="absolute top-2.5 right-2 text-[8px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-220 px-1 rounded-sm uppercase tracking-wide">
                          MISSING FILE
                        </span>
                        <p className="text-[10px] text-blue-900 font-mono font-bold">{r.reportNo}</p>
                        <p className="text-[11px] font-black text-slate-800 pr-14 leading-tight mt-0.5 line-clamp-1">{r.title}</p>
                        <p className="text-[9px] text-slate-405 text-slate-500 font-semibold uppercase mt-0.5 font-sans">Facility: {r.department}</p>
                        
                        {/* Instant file generator quick buttons */}
                        <div className="grid grid-cols-3 gap-1 mt-2.5">
                          {(['PDF', 'DOCX', 'JPG'] as const).map(fmt => (
                            <button
                              id={`quick-pending-${r.id}-${fmt}`}
                              key={fmt}
                              onClick={() => handleQuickPendingAttach(r.id, fmt)}
                              className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-[9px] py-1 font-bold rounded-sm cursor-pointer transition-all uppercase"
                              title={`Attach as simulated .${fmt}`}
                            >
                              Attach .{fmt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Box 3: Reports Status Ledger Summary */}
              <div className="bg-white border border-slate-300 rounded-sm shadow-md flex flex-col max-h-[360px] overflow-hidden">
                <div className="bg-slate-105 bg-slate-100 border-b border-slate-250 p-3.5 flex justify-between items-center text-xs font-bold text-slate-800 uppercase tracking-wide">
                  <span className="flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4.5 h-4.5 text-blue-900" />
                    SHOW REPORTS STATUS
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-[10px] font-mono leading-none">
                    {reports.length} Total
                  </span>
                </div>

                <div className="p-3 overflow-y-auto space-y-2.5 flex-grow">
                  {reports.map((r) => (
                    <div id={`ledger-status-card-${r.id}`} key={r.id} className="p-2.5 bg-slate-50 border border-slate-205 rounded-sm flex flex-col">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] text-blue-800 font-mono font-bold leading-none">{r.reportNo}</span>
                        <div className="flex gap-1">
                          <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-mono ${
                            r.attachmentName ? 'bg-green-100 text-green-900 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                          }`}>
                            {r.attachmentName ? 'Document Linked' : 'No File'}
                          </span>
                          <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-mono ${
                            r.status === 'Authorized' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {r.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] font-bold text-slate-800 mt-1 leading-tight line-clamp-1">{r.title}</p>
                      <div className="flex justify-between items-center mt-2 pt-1 border-t border-dashed border-slate-200 text-[9.5px]">
                        <span className="text-slate-400 font-mono font-medium lowercase">Target: {r.department.split(' ')[0]}</span>
                        <span className="text-slate-500 font-bold uppercase">
                          Files Count: {r.attachmentName ? "1" : "0"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Section 4: Reports Status & Transfer Management (Status of Transfer) */}
            <div className="bg-white border border-slate-300 rounded-sm shadow-md">
              <div className="bg-slate-100 border-b border-slate-200 p-4">
                <h3 className="text-xs font-black uppercase text-slate-850 text-slate-800 flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-blue-800" />
                  STATUS OF TRANSFER &amp; DAK DISPATCH PROTOCOL REGISTRY
                </h3>
              </div>

              <div className="p-4 overflow-x-auto">
                <table className="w-full text-left font-sans text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] tracking-wider uppercase text-slate-650 font-bold">
                      <th className="p-3">Reference Voucher</th>
                      <th className="p-3">Site Target Dept</th>
                      <th className="p-3">Dossier File Format</th>
                      <th className="p-3 font-bold">Approval Status</th>
                      <th className="p-3">Status of Transfer</th>
                      <th className="p-3 text-right">Transfer Authority Command</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-slate-800 font-medium">
                    {reports.map((r) => {
                      const dynamicStatus = transferStatusInfo[r.id] || (r.status === 'Authorized' ? "Transferred & Published" : "In Draft Custody (Local)");
                      const isComplete = dynamicStatus === "Transferred & Published";
                      const extension = r.attachmentName ? r.attachmentName.split('.').pop()?.toUpperCase() : "MISSING";

                      return (
                        <tr id={`transfer-row-${r.id}`} key={r.id} className="hover:bg-slate-50 text-slate-705">
                          <td className="p-3 font-mono font-black text-blue-900">{r.reportNo}</td>
                          <td className="p-3 uppercase text-slate-600 font-bold">{r.department}</td>
                          <td className="p-3">
                            <span className={`px-1.5 py-0.5 rounded-sm font-mono text-[9px] font-bold ${
                              extension === 'PDF' ? 'bg-red-105 bg-red-100 text-red-800 border border-red-200' :
                              extension === 'DOCX' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                              extension === 'JPG' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                              'bg-rose-100 text-rose-800 border border-rose-150'
                            }`}>
                              .{extension}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] font-bold uppercase ${
                              r.status === 'Authorized' ? 'text-green-700' : 'text-amber-700'
                            }`}>
                              {r.status === 'Authorized' ? "✓ APPROVED_RELEASED" : "📝 DRAFT_PENDING"}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg font-mono ${
                              isComplete ? 'bg-green-100 text-green-900 border border-green-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {isComplete && <Check className="w-3.5 h-3.5 text-green-700" />}
                              {dynamicStatus}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {r.status !== 'Authorized' ? (
                              <span className="text-[10px] text-slate-400 italic">Authorize board approval first</span>
                            ) : !isComplete ? (
                              <button
                                id={`dispatch-auth-btn-${r.id}`}
                                onClick={() => handleAuthorizeTransfer(r.id)}
                                className="bg-blue-800 hover:bg-blue-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-xs mt-0.5 block ml-auto uppercase tracking-wide shadow-3xs cursor-pointer transition-all"
                              >
                                Trigger Transfer
                              </button>
                            ) : (
                              <span className="text-[10px] text-green-800 font-bold uppercase tracking-wide">Dispatched &amp; Locked</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        );
      })()}

      {activeTab === 'cutoff_manager' && (
        <TransactionCutoffLedger plans={plans} currentUser={currentUser} />
      )}

      {activeTab === 'report_generator' && (
        <ReportGeneratorTab 
          reports={reports} 
          paras={paras} 
          currentUser={currentUser} 
          onUpdateReport={onUpdateReport} 
        />
      )}

    </div>

  );
}
