import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, CheckCircle2, RotateCw, AlertCircle, FileCode, Printer, Table, ShieldCheck, History, Upload, Eye, FileUp, Sparkles, RefreshCw
} from 'lucide-react';
import { AuditReport, AuditPara } from '../types';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportGeneratorTabProps {
  reports: AuditReport[];
  paras: AuditPara[];
  currentUser: { name: string; id?: string; username?: string; role: string; department?: string; designation?: string };
  onUpdateReport: (id: string, updates: Partial<AuditReport>) => void;
}

interface ReportVersion {
  VERSION_ID: string;
  REPORT_ID: string;
  VERSION_NO: number;
  DOCX_BLOB_BASE64: string;
  HTML_CONTENT: string;
  PDF_BLOB_BASE64: string;
  CREATED_AT: string;
  CREATED_BY: string;
  DOC_SIZE: number;
  REMARKS: string;
}

interface UploadedFileInfo {
  UPLOAD_ID: string;
  REPORT_ID: string;
  FILE_NAME: string;
  FILE_TYPE: string;
  FILE_SIZE: number;
  UPLOADED_BY: string;
  UPLOAD_DATE: string;
}

export default function ReportGeneratorTab({ 
  reports, paras, currentUser, onUpdateReport 
}: ReportGeneratorTabProps) {
  // Modes: 
  // 'upload_docx': Convert manual docx file uploaded locally
  const [activeWorkflow, setActiveWorkflow] = useState<'aims_compiles' | 'upload_docx' | 'uploaded_history'>('upload_docx');
  
  const [selectedReportId, setSelectedReportId] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [compiledResult, setCompiledResult] = useState<{
    version: ReportVersion;
    report: AuditReport;
    paras: AuditPara[];
  } | null>(null);
  
  // Versions history log
  const [versionHistory, setVersionHistory] = useState<ReportVersion[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // System Uploaded Files Selection
  const [uploadedFilesList, setUploadedFilesList] = useState<UploadedFileInfo[]>([]);
  const [selectedUploadId, setSelectedUploadId] = useState('');
  const [loadingUploadsList, setLoadingUploadsList] = useState(false);

  // Manual Local Upload state
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [localFileBase64, setLocalFileBase64] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  // Standard steps configuration
  const [steps, setSteps] = useState<{ label: string; status: 'idle' | 'running' | 'success' | 'failed'; desc?: string }[]>([
    { label: "Word Document Loaded", status: 'idle', desc: "Compiles page layout, borders, margins, and relational metadata elements." },
    { label: "HTML Generated", status: 'idle', desc: "Transcribes OpenXML word structures, tables, and typography nodes dynamically via Mammoth." },
    { label: "PDF Generated Successfully", status: 'idle', desc: "Injects corporate RINL branding, page headers, footers, generation date, and page numbers." },
  ]);

  // Preview options
  const [previewTab, setPreviewTab] = useState<'preview' | 'html'>('preview');

  // Dynamic live HTML preview state updating in real time as conversion happens
  const [liveHtmlContent, setLiveHtmlContent] = useState<string>('');
  const [isLiveConverting, setIsLiveConverting] = useState<boolean>(false);

  const streamHtmlIntoPreview = async (fullHtml: string) => {
    setLiveHtmlContent('');
    setIsLiveConverting(true);
    
    // Split HTML by typical block-level nodes/tags to render step-by-step
    const blocks: string[] = [];
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = fullHtml;
    
    const children = Array.from(tempDiv.childNodes);
    if (children.length === 0) {
      setLiveHtmlContent(fullHtml);
      setIsLiveConverting(false);
      return;
    }

    children.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        blocks.push((node as HTMLElement).outerHTML);
      } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        blocks.push(`<span>${node.textContent}</span>`);
      }
    });

    let cumulativeHtml = `
      <div class="border-b-2 border-slate-250 pb-2 mb-4 font-sans flex justify-between items-center bg-[#0d3b70] text-slate-100 p-2.5 rounded-sm">
        <div>
          <h2 class="text-xs font-black tracking-wide uppercase text-white">OpenXML Word Converter</h2>
          <span class="text-[8.5px] font-mono text-emerald-450 text-emerald-300 uppercase tracking-widest block mt-0.5 animate-pulse">● Streaming Parsed Blocks via Mammoth Parser...</span>
        </div>
        <span class="bg-[#0b2f59] border border-slate-700 text-slate-300 text-[8.5px] font-mono p-1 rounded font-bold">
          Total Blocks: ${blocks.length}
        </span>
      </div>
      <div class="space-y-3 prose prose-sm max-w-none text-slate-800">
    `;

    setLiveHtmlContent(cumulativeHtml + `</div>`);
    await new Promise(r => setTimeout(r, 400));

    const totalSteps = blocks.length;
    // Set nice visible delay to see the real-time layout changes
    const delay = Math.max(120, Math.min(350, 4500 / (totalSteps || 1)));

    for (let i = 0; i < blocks.length; i++) {
      cumulativeHtml += `<div class="animate-fade-in transition-all duration-300 my-2">${blocks[i]}</div>`;
      setLiveHtmlContent(cumulativeHtml + `</div>`);
      await new Promise(r => setTimeout(r, delay));
    }

    setIsLiveConverting(false);
  };

  // Load versions history for standard compile
  const fetchVersionHistory = async (reportId: string) => {
    if (!reportId) return;
    setLoadingHistory(true);
    try {
      const response = await fetch(`/api/reports/${reportId}/versions`);
      if (response.ok) {
        const list = await response.json();
        setVersionHistory(list);
      }
    } catch (err) {
      console.error("Failed to load version history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Load system uploaded docx files
  const fetchSystemUploadedFiles = async () => {
    setLoadingUploadsList(true);
    try {
      const response = await fetch('/api/uploads');
      if (response.ok) {
        const list = await response.json();
        // filter for docx documents
        const docxList = list.filter((f: any) => {
          const nameLower = f.FILE_NAME.toLowerCase();
          return nameLower.endsWith('.docx') || f.FILE_TYPE.includes('word') || f.FILE_TYPE.includes('officedocument.wordprocessingml');
        });
        setUploadedFilesList(docxList);
      }
    } catch (err) {
      console.error("Failed to load uploaded files list:", err);
    } finally {
      setLoadingUploadsList(false);
    }
  };

  useEffect(() => {
    if (activeWorkflow === 'uploaded_history') {
      fetchSystemUploadedFiles();
      setCompiledResult(null);
      setErrorText('');
    } else if (activeWorkflow === 'aims_compiles') {
      if (selectedReportId) {
        fetchVersionHistory(selectedReportId);
      }
      setCompiledResult(null);
      setErrorText('');
    } else {
      setCompiledResult(null);
      setErrorText('');
      setLocalFile(null);
      setLocalFileBase64('');
    }
    // reset steps status
    setSteps(s => s.map(step => ({ ...step, status: 'idle' })));
  }, [activeWorkflow, selectedReportId]);

  const updateStepStatus = (index: number, status: 'running' | 'success' | 'failed') => {
    setSteps(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], status };
      return copy;
    });
  };

  // Corporate styling configuration
  const stampHeaderAndFooter = (doc: jsPDF, currentPage: number, totalPages: number) => {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    // Core header band
    doc.setFillColor(13, 59, 112); // RINL Blue (#0D3B70)
    doc.rect(margin, margin, contentWidth, 3.5, "F");

    // Main titles
    doc.setTextColor(13, 59, 112);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(13);
    doc.text("RASHTRIYA ISPAT NIGAM LIMITED", margin, margin + 9);

    doc.setTextColor(71, 85, 105);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("INTERNAL AUDIT DEPARTMENT | VISAKHAPATNAM STEEL PLANT", margin, margin + 13);

    // Divider
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(margin, margin + 15, pageWidth - margin, margin + 15);

    // Footer decorative divider
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

    doc.setTextColor(148, 163, 184);
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(7.5);
    doc.text("AIMS OFFICERS SECURE COMPLIANCE LEDGER", margin, pageHeight - 9);

    doc.setFont("Helvetica", "normal");
    doc.text(`Page ${currentPage} of ${totalPages}`, pageWidth - margin - 15, pageHeight - 9);
  };

  // Convert HTML markup blocks to PDF page flow
  const drawHtmlContentToPdf = (doc: jsPDF, htmlContent: string, startY: number) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    
    const margin = 15;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const contentWidth = pageWidth - (margin * 2);
    let y = startY;

    // Helper to safety block page boundary
    const checkPageSpan = (increment: number) => {
      if (y + increment > pageHeight - 18) {
        doc.addPage();
        y = margin + 22; // starting offset after header
      }
    };

    const processElement = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim() || "";
        if (text) {
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(51, 65, 85);
          const lines = doc.splitTextToSize(text, contentWidth);
          lines.forEach((line: string) => {
            checkPageSpan(5);
            doc.text(line, margin, y);
            y += 4.5;
          });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tagName = el.tagName.toUpperCase();

        if (tagName === "H1" || tagName === "H2" || tagName === "H3" || tagName === "H4") {
          const tText = el.textContent?.trim() || "";
          if (tText) {
            y += 3;
            checkPageSpan(8);
            doc.setFont("Helvetica", "bold");
            const size = tagName === "H1" ? 11.5 : tagName === "H2" ? 10 : 9;
            doc.setFontSize(size);
            doc.setTextColor(13, 59, 112); // RINL blue
            doc.text(tText, margin, y);
            y += size * 0.5 + 2;
          }
        } else if (tagName === "P") {
          const pText = el.textContent?.trim() || "";
          if (pText) {
            y += 1.5;
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(8.5);
            doc.setTextColor(51, 65, 85);
            const lines = doc.splitTextToSize(pText, contentWidth);
            lines.forEach((line: string) => {
              checkPageSpan(5);
              doc.text(line, margin, y);
              y += 4.2;
            });
            y += 1.5;
          }
        } else if (tagName === "TABLE") {
          const rows: any[] = [];
          const headers: any[] = [];
          
          const trs = el.querySelectorAll("tr");
          trs.forEach((tr, rIdx) => {
            const rowData: string[] = [];
            const cells = tr.querySelectorAll("td, th");
            cells.forEach((cell) => {
              rowData.push(cell.textContent?.trim() || "");
            });
            if (rIdx === 0 && tr.querySelector("th")) {
              headers.push(rowData);
            } else {
              rows.push(rowData);
            }
          });

          if (rows.length > 0 || headers.length > 0) {
            y += 3;
            checkPageSpan(12);
            
            autoTable(doc, {
              startY: y,
              margin: { left: margin, right: margin },
              head: headers.length > 0 ? headers : (rows.length > 0 ? [rows[0]] : undefined),
              body: headers.length > 0 ? rows : rows.slice(1),
              theme: 'grid',
              headStyles: {
                fillColor: [13, 59, 112],
                textColor: [255, 255, 255],
                fontSize: 7.5,
                fontStyle: 'bold'
              },
              bodyStyles: {
                fontSize: 7,
                textColor: [51, 65, 85]
              }
            });
            
            y = (doc as any).lastAutoTable.finalY + 6;
          }
        } else if (tagName === "UL" || tagName === "OL") {
          y += 1;
          const lis = el.querySelectorAll("li");
          lis.forEach((li, index) => {
            const marker = tagName === "UL" ? "•" : `${index + 1}.`;
            const text = li.textContent?.trim() || "";
            if (text) {
              doc.setFont("Helvetica", "normal");
              doc.setFontSize(8.5);
              doc.setTextColor(51, 65, 85);
              const lines = doc.splitTextToSize(text, contentWidth - 6);
              lines.forEach((line: string, lIdx: number) => {
                checkPageSpan(5);
                if (lIdx === 0) {
                  doc.text(marker, margin + 2, y);
                  doc.text(line, margin + 7, y);
                } else {
                  doc.text(line, margin + 7, y);
                }
                y += 4.2;
              });
            }
          });
          y += 1.5;
        } else if (tagName === "IMG") {
          // Mammoth images conversion handle
          const src = el.getAttribute("src") || "";
          if (src.startsWith("data:image")) {
            try {
              y += 2;
              checkPageSpan(42);
              doc.addImage(src, "PNG", margin + 2, y, 60, 40);
              y += 43;
            } catch (imgErr) {
              console.error("Failed to add canvas image:", imgErr);
            }
          }
        } else {
          // Process child nodes recursively 
          if (el.childNodes.length > 0) {
            Array.from(el.childNodes).forEach(processElement);
          }
        }
      }
    };

    Array.from(tempDiv.childNodes).forEach(processElement);
    return y;
  };

  // Flow A: Assembling standard systems audit report compiling logic
  const handleStartPDFCompilation = async () => {
    if (!selectedReportId) return;

    setIsCompiling(true);
    setErrorText('');
    setCompiledResult(null);
    setLiveHtmlContent('');
    setIsLiveConverting(true);
    setSteps(s => s.map(step => ({ ...step, status: 'idle' })));

    try {
      // Step 1: Word Document Loaded
      updateStepStatus(0, 'running');

      const rObj = reports.find(r => r.id === selectedReportId);
      const titleText = rObj ? rObj.title : 'External Compliance Audit';
      const refNo = rObj ? rObj.reportNo : 'VSP/AUD-TEMP';
      const deptName = rObj ? rObj.department || "Internal Audit" : "Internal Audit";

      setLiveHtmlContent(`
        <div class="border-b-2 border-indigo-900 pb-2 mb-4 font-sans">
          <h2 class="text-sm font-bold text-indigo-900 tracking-wide uppercase">RASHTRIYA ISPAT NIGAM LIMITED</h2>
          <span class="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Word Document Buffer Loaded</span>
        </div>
        <p class="text-[10px] text-slate-500 font-mono italic animate-pulse">Reading Database relational record nodes...</p>
      `);

      await new Promise(r => setTimeout(r, 600));

      const response = await fetch(`/api/reports/${selectedReportId}/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditorName: currentUser.name })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "AIMS high-fidelity compile routine failed.");
      }

      const resData = await response.json();
      updateStepStatus(0, 'success');

      // Step 2: HTML Generated
      updateStepStatus(1, 'running');

      setLiveHtmlContent(`
        <div class="border-b-2 border-indigo-900 pb-2 mb-4 font-sans">
          <h2 class="text-sm font-bold text-indigo-900 tracking-wide uppercase">RASHTRIYA ISPAT NIGAM LIMITED</h2>
          <span class="text-[9px] text-indigo-600 font-black uppercase tracking-widest font-mono">HTML Stream Generation Started</span>
        </div>
        <div class="mt-4 p-3 bg-slate-50 border border-slate-200 text-[11px] font-sans rounded space-y-2">
          <h3 class="text-xs font-black text-slate-800">${titleText}</h3>
          <div class="grid grid-cols-2 gap-2 text-[10px] font-mono border-t pt-2 mt-1">
            <div><span class="font-bold text-slate-500">Ref No:</span> ${refNo}</div>
            <div><span class="font-bold text-slate-500">Dept:</span> ${deptName}</div>
            <div><span class="font-bold text-slate-500">Auditor:</span> ${currentUser.name}</div>
            <div><span class="font-bold text-slate-500">Status:</span> Draft</div>
          </div>
        </div>
        <div class="flex items-center gap-1.5 mt-3 text-[10px] text-yellow-600 font-bold animate-pulse font-mono">
          <span class="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
          Transcribing database record tables to HTML content...
        </div>
      `);

      await new Promise(r => setTimeout(r, 800));

      const { report, paras: reportParas, version } = resData;

      // Construct a dynamic HTML representation of paragraphs
      let parasHtml = '';
      if (reportParas && reportParas.length > 0) {
        parasHtml += `
          <table class="w-full text-left font-sans text-[10px] border-collapse border border-slate-200 mt-2">
            <thead>
              <tr class="bg-indigo-900 text-white font-bold">
                <th class="border p-1">Rule / Para</th>
                <th class="border p-1">Finding Exceptions &amp; Discoveries</th>
                <th class="border p-1 text-right font-mono">Implication</th>
              </tr>
            </thead>
            <tbody>
        `;
        
        for (let i = 0; i < reportParas.length; i++) {
          const p = reportParas[i];
          parasHtml += `
            <tr class="hover:bg-slate-50 border-b">
              <td class="border p-1 font-bold text-indigo-900">${p.paraNo || ('Para-' + (i+1))}</td>
              <td class="border p-1 font-sans">
                <span class="font-bold block text-slate-805 text-slate-800">${p.title || "Exception registered"}</span>
                <span class="text-slate-500 block text-[9px] leading-snug mt-0.5">${p.description || ""}</span>
              </td>
              <td class="border p-1 text-right font-mono text-indigo-950">₹ ${Number(p.financialImplication || 0).toLocaleString()}</td>
            </tr>
          `;
          
          setLiveHtmlContent(`
            <div class="border-b-2 border-indigo-900 pb-2 mb-4 font-sans">
              <h2 class="text-sm font-bold text-indigo-900 tracking-wide uppercase">RASHTRIYA ISPAT NIGAM LIMITED</h2>
              <span class="text-[9px] text-green-700 font-extrabold uppercase tracking-widest font-mono">Transcribing records dynamically...</span>
            </div>
            <div class="p-3 bg-slate-50 border border-slate-200 text-[11px] font-sans rounded space-y-2">
              <h3 class="text-xs font-black text-slate-800">${titleText}</h3>
              <div class="grid grid-cols-2 gap-2 text-[10px] font-mono border-t pt-2 mt-1">
                <div><span class="font-bold text-slate-500">Ref No:</span> ${refNo}</div>
                <div><span class="font-bold text-slate-500">Dept:</span> ${deptName}</div>
                <div><span class="font-bold text-slate-500">Auditor:</span> ${currentUser.name}</div>
                <div><span class="font-bold text-slate-500">Status:</span> Draft</div>
              </div>
            </div>
            <div class="mt-3">
              <span class="text-[9px] font-black font-mono uppercase text-red-600 block mb-1">Active Table Streams:</span>
              ${parasHtml}
              </tbody>
              </table>
            </div>
          `);
          
          await new Promise(r => setTimeout(r, 300));
        }
      }

      updateStepStatus(1, 'success');

      // Step 3: Run client-side jsPDF with autoTable layout compiling
      updateStepStatus(2, 'running');
      setLiveHtmlContent(prev => prev + `
        <div class="mt-4 border-t border-dashed pt-3 bg-sky-50/50 p-2 text-slate-850 rounded-sm border border-sky-100 font-sans">
          <span class="text-[9.5px] font-black uppercase text-indigo-900 font-mono tracking-wider block mb-1">SECTION C: AUDITOR ADVISE GUIDELINES</span>
          <ul class="text-[9px] text-slate-600 list-disc list-inside space-y-1">
            <li>Ensure double-ledger audits are maintained to remove cutoff variances.</li>
            <li>Implement direct corrective compliance reports as requested by board.</li>
          </ul>
        </div>
        <div class="flex items-center gap-1.5 mt-3 text-[10px] text-emerald-600 font-bold animate-pulse font-mono justify-end">
          <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
          Running client-side jsPDF layout compile...
        </div>
      `);

      await new Promise(r => setTimeout(r, 650));

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);

      // Welcome header visual box block
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, margin + 18, contentWidth, 19, "F");
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.6);
      doc.rect(margin, margin + 18, contentWidth, 19, "D");

      doc.setTextColor(220, 38, 38);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10.5);
      doc.text("AUDIT REPORT OUTCOMES & DISPATCH VERIFICATION RECORD", margin + 4, margin + 24);

      doc.setTextColor(71, 85, 105);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text(`AIMS Database PK Code: VSP-${report.id}  |  Compiled On: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin + 4, margin + 30);

      let currentY = margin + 42;
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(8.5);

      const metadataFields = [
        ["Audit ID / Voucher Name:", `VSP-${report.id}`],
        ["Report Reference Code:", report.reportNo],
        ["Target Facility Dept:", report.department || "General Master"],
        ["Audit Target Period:", report.auditPeriod],
        ["Lead Auditor in Charge:", report.leadAuditor],
        ["Registry Record Status:", report.status || "Draft"]
      ];

      metadataFields.forEach(([label, val]) => {
        doc.setFont("Helvetica", "bold");
        doc.text(label, margin + 1, currentY);
        doc.setFont("Helvetica", "normal");
        doc.text(val, margin + 45, currentY);
        currentY += 5;
      });

      currentY += 4;

      doc.setTextColor(13, 59, 112);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("SECTION 1: DISCOVERIES & OUTSTANDING CRITICAL EXCEPTIONS", margin, currentY);
      currentY += 4.5;

      const tableData = reportParas.map(p => [
        p.paraNo || "Para-1",
        `${p.title || "No Subject"}\n\nDescription: ${p.description || "Narrative details unspecified."}`,
        p.category || "Major",
        `Rs. ${Number(p.financialImplication || 0).toLocaleString()}`,
        p.status || "Outstanding"
      ]);

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [["Para No", "Finding / Exception Detail Summary", "Severity", "Implication (Rs)", "Current Status"]],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [13, 59, 112],
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 7,
          textColor: [51, 65, 85]
        },
        columnStyles: {
          0: { cellWidth: 16 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 16 },
          3: { cellWidth: 26 },
          4: { cellWidth: 22 }
        }
      });

      let finalTableY = (doc as any).lastAutoTable.finalY + 10;

      if (finalTableY > pageHeight - 50) {
        doc.addPage();
        finalTableY = margin + 22;
      }

      doc.setTextColor(13, 59, 112);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("SECTION 2: AUDITOR CONCLUDING ADVICE & COMPLIANCE PATHWAY", margin, finalTableY);
      finalTableY += 5;

      doc.setTextColor(71, 85, 105);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      
      const bullets = [
        "1. Material deviations require immediate review and joint corrective adjustments within 15 days.",
        "2. Ensure standard double-ledger compliance records are validated during transition windows to safeguard balance sheets.",
        "3. Responses to recommendations must be submitted via AIMS terminal tools under code CVC-2024 protocols."
      ];

      bullets.forEach(txt => {
        doc.text(txt, margin, finalTableY);
        finalTableY += 4;
      });

      finalTableY += 6;

      // Draw digital sign box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(pageWidth - margin - 72, finalTableY - 4, 72, 13, "DF");

      doc.setTextColor(13, 59, 112);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("APPROVED VIA AIMS SSO DESK", pageWidth - margin - 68, finalTableY + 1);

      doc.setTextColor(100, 116, 139);
      doc.setFont("Helvetica", "oblique");
      doc.setFontSize(6.5);
      doc.text(`Lockout Timestamp: ${new Date().toISOString().split('T')[0]} / GM AUDIT`, pageWidth - margin - 68, finalTableY + 5);

      const totalPageCount = doc.internal.pages.length - 1;
      for (let pIdx = 1; pIdx <= totalPageCount; pIdx++) {
        doc.setPage(pIdx);
        stampHeaderAndFooter(doc, pIdx, totalPageCount);
      }

      const pdfBase64 = doc.output('datauristring').split(',')[1];

      // Save PDF Base64 back to Version slot
      const pdfSaveResponse = await fetch(`/api/reports/${selectedReportId}/save-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionId: version.VERSION_ID,
          pdfBase64,
          auditorName: currentUser.name
        })
      });

      if (!pdfSaveResponse.ok) {
        throw new Error("Failed to commit final PDF byte-stream to relational version history.");
      }

      const savePdfResult = await pdfSaveResponse.json();
      updateStepStatus(2, 'success');

      // Update parent component status state if available
      onUpdateReport(selectedReportId, { attachmentName: savePdfResult.attachmentName });

      // Save Local preview structure
      setCompiledResult({
        version: {
          ...version,
          PDF_BLOB_BASE64: pdfBase64
        },
        report: report,
        paras: reportParas
      });

      setLiveHtmlContent(version.HTML_CONTENT);
      setIsLiveConverting(false);
      fetchVersionHistory(selectedReportId);

    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "An unexpected compile routine failure terminated our buffer pipeline.");
      setSteps(s => s.map(step => step.status === 'running' ? { ...step, status: 'failed' } : step));
      setIsLiveConverting(false);
    } finally {
      setIsCompiling(false);
    }
  };

  // Convert File object to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Handles manual Word file drag-and-drop or select and pipeline convert
  const handleLocalFileSelection = async (file: File) => {
    if (!file.name.endsWith('.docx')) {
      setErrorText("ORA-22288: file operation permitted only for real Word Document (.docx) extension files.");
      return;
    }
    setErrorText('');
    setLocalFile(file);
    try {
      const b64 = await fileToBase64(file);
      setLocalFileBase64(b64);
      // Reset steps indicator to idle
      setSteps(s => s.map(step => ({ ...step, status: 'idle' })));
    } catch (err) {
      setErrorText("Failed to translate document layout streams into system memories.");
    }
  };

  const handleCustomFormSubmitConversion = async () => {
    if (!localFileBase64 || !localFile) return;

    setIsCompiling(true);
    setErrorText('');
    setCompiledResult(null);
    setLiveHtmlContent('');
    setIsLiveConverting(true);
    setSteps(s => s.map(step => ({ ...step, status: 'idle' })));

    try {
      // Step 1: Word Document Loaded 
      updateStepStatus(0, 'running');
      await new Promise(r => setTimeout(r, 600));
      updateStepStatus(0, 'success');

      // Step 2: Convert Word (DOCX) base64 base stream to HTML 
      updateStepStatus(1, 'running');
      const response = await fetch('/api/convert-docx-to-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileDataBlob: localFileBase64,
          filename: localFile.name
        })
      });

      if (!response.ok) {
        const errObj = await response.json();
        throw new Error(errObj.error || "Mammoth conversion failed.");
      }

      const conversionResult = await response.json();
      const generatedHtml = conversionResult.htmlContent;
      
      // Stream HTML in real-time to the preview pane first!
      await streamHtmlIntoPreview(generatedHtml);
      updateStepStatus(1, 'success');

      // Step 3: Draw HTML elements into jsPDF and compile PDF bytes
      updateStepStatus(2, 'running');
      await new Promise(r => setTimeout(r, 700));

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);

      // Intro header badge block
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, margin + 18, contentWidth, 18, "F");
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.5);
      doc.rect(margin, margin + 18, contentWidth, 18, "D");

      doc.setTextColor(13, 59, 112);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text("CONVERTED EXTERNAL COMPLIANCE AUDIT AUDITING RECORD", margin + 4, margin + 24);

      doc.setTextColor(100, 116, 139);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.text(`Primary Source Document file: ${localFile.name}  |  Processed on: ${new Date().toLocaleDateString()}`, margin + 4, margin + 30);

      // Parse Mammoth HTML output into PDF blocks
      const finalY = drawHtmlContentToPdf(doc, generatedHtml, margin + 40);

      let finalSignY = finalY + 8;
      if (finalSignY > pageHeight - 30) {
        doc.addPage();
        finalSignY = margin + 22;
      }

      // Draw standard double-ledger signatures
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(pageWidth - margin - 72, finalSignY - 4, 72, 13, "DF");

      doc.setTextColor(13, 59, 112);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("VERIFIED VIA AIMS SSO AUTH", pageWidth - margin - 68, finalSignY + 1);

      doc.setTextColor(100, 116, 139);
      doc.setFont("Helvetica", "oblique");
      doc.setFontSize(6.5);
      doc.text(`System Time: ${new Date().toISOString().split('T')[0]} | SSO SECURE`, pageWidth - margin - 68, finalSignY + 5);

      const totalPageCount = doc.internal.pages.length - 1;
      for (let pIdx = 1; pIdx <= totalPageCount; pIdx++) {
        doc.setPage(pIdx);
        stampHeaderAndFooter(doc, pIdx, totalPageCount);
      }

      const pdfBase64 = doc.output('datauristring').split(',')[1];

      // Store in relational record databases
      const saveResponse = await fetch('/api/save-custom-version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: selectedReportId || "GENERIC_CONVERTER",
          filename: localFile.name,
          docxBase64: localFileBase64,
          htmlContent: generatedHtml,
          pdfBase64: pdfBase64,
          auditorName: currentUser.name
        })
      });

      if (!saveResponse.ok) {
        throw new Error("Relational storage commit failed back-end execution.");
      }

      const saveResult = await saveResponse.json();
      updateStepStatus(2, 'success');

      // Update Parent UI hook
      if (selectedReportId) {
        onUpdateReport(selectedReportId, { attachmentName: saveResult.attachmentName });
        fetchVersionHistory(selectedReportId);
      }

      setCompiledResult({
        version: saveResult.version,
        report: {
          id: selectedReportId || "UPLOADED",
          reportNo: "VSP/UPL-" + saveResult.version.VERSION_ID,
          title: localFile.name,
          department: currentUser.department || "Internal Audit",
          auditPeriod: "CURRENT REGISTRY",
          leadAuditor: currentUser.name,
          status: "Draft",
          dateInit: new Date().toISOString().split('T')[0],
          targetQuarter: "Q1"
        },
        paras: []
      });

      setLiveHtmlContent(saveResult.version.HTML_CONTENT);
      setIsLiveConverting(false);

    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "An unexpected exception terminated our manual translation pipeline.");
      setSteps(s => s.map(step => step.status === 'running' ? { ...step, status: 'failed' } : step));
      setIsLiveConverting(false);
    } finally {
      setIsCompiling(false);
    }
  };

  // Convert and ingest previously uploaded files Option
  const handleIngestSystemUploadedFile = async () => {
    if (!selectedUploadId) return;

    setIsCompiling(true);
    setErrorText('');
    setCompiledResult(null);
    setLiveHtmlContent('');
    setIsLiveConverting(true);
    setSteps(s => s.map(step => ({ ...step, status: 'idle' })));

    try {
      // Step 1: Loaded
      updateStepStatus(0, 'running');
      const docResponse = await fetch(`/api/upload/preview/${selectedUploadId}`);
      if (!docResponse.ok) {
        throw new Error("Failed to load BLOB segment from system uploads.");
      }
      const uploadedDocData = await docResponse.json();
      updateStepStatus(0, 'success');

      // Step 2: HTML Generated
      updateStepStatus(1, 'running');
      const response = await fetch('/api/convert-docx-to-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileDataBlob: uploadedDocData.FILE_DATA_BLOB,
          filename: uploadedDocData.FILE_NAME
        })
      });

      if (!response.ok) {
        throw new Error("Mammoth dynamic rendering failed on uploaded file.");
      }

      const conversionResult = await response.json();
      const generatedHtml = conversionResult.htmlContent;
      
      // Stream HTML in real-time to the preview pane!
      await streamHtmlIntoPreview(generatedHtml);
      updateStepStatus(1, 'success');

      // Step 3: Draw HTML elements into jsPDF and compile PDF bytes
      updateStepStatus(2, 'running');
      await new Promise(r => setTimeout(r, 600));

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);

      // Header block
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, margin + 18, contentWidth, 18, "F");
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.5);
      doc.rect(margin, margin + 18, contentWidth, 18, "D");

      doc.setTextColor(13, 59, 112);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text("CONVERTED DATABASE COMPLIANCE REGISTER RECORD", margin + 4, margin + 24);

      doc.setTextColor(100, 116, 139);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.text(`Primary Source Document file: ${uploadedDocData.FILE_NAME}  |  Processed on: ${new Date().toLocaleDateString()}`, margin + 4, margin + 30);

      // Render parsed layout
      const finalY = drawHtmlContentToPdf(doc, generatedHtml, margin + 40);

      let finalSignY = finalY + 8;
      if (finalSignY > pageHeight - 30) {
        doc.addPage();
        finalSignY = margin + 22;
      }

      // Draw signatures
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(pageWidth - margin - 72, finalSignY - 4, 72, 13, "DF");

      doc.setTextColor(13, 59, 112);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("VERIFIED VIA AIMS SSO AUTH", pageWidth - margin - 68, finalSignY + 1);

      doc.setTextColor(100, 116, 139);
      doc.setFont("Helvetica", "oblique");
      doc.setFontSize(6.5);
      doc.text(`Locked Stamp: ${new Date().toISOString().split('T')[0]} | AIMS AUDIT`, pageWidth - margin - 68, finalSignY + 5);

      const totalPageCount = doc.internal.pages.length - 1;
      for (let pIdx = 1; pIdx <= totalPageCount; pIdx++) {
        doc.setPage(pIdx);
        stampHeaderAndFooter(doc, pIdx, totalPageCount);
      }

      const pdfBase64 = doc.output('datauristring').split(',')[1];

      // Save PDF into histories
      const saveResponse = await fetch('/api/save-custom-version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: uploadedDocData.REPORT_ID || "GENERIC_CONVERTER",
          filename: uploadedDocData.FILE_NAME,
          docxBase64: uploadedDocData.FILE_DATA_BLOB,
          htmlContent: generatedHtml,
          pdfBase64: pdfBase64,
          auditorName: currentUser.name
        })
      });

      if (!saveResponse.ok) {
        throw new Error("System backend database save failed.");
      }

      const saveResult = await saveResponse.json();
      updateStepStatus(2, 'success');

      if (uploadedDocData.REPORT_ID) {
        onUpdateReport(uploadedDocData.REPORT_ID, { attachmentName: saveResult.attachmentName });
        fetchVersionHistory(uploadedDocData.REPORT_ID);
      }

      setCompiledResult({
        version: saveResult.version,
        report: {
          id: uploadedDocData.REPORT_ID || "UPLOADED",
          reportNo: "VSP/UPL-" + saveResult.version.VERSION_ID,
          title: uploadedDocData.FILE_NAME,
          department: currentUser.department || "Internal Audit",
          auditPeriod: "SYSTEM RECAP",
          leadAuditor: currentUser.name,
          status: "Draft",
          dateInit: new Date().toISOString().split('T')[0],
          targetQuarter: "Q1"
        },
        paras: []
      });

      setLiveHtmlContent(saveResult.version.HTML_CONTENT);
      setIsLiveConverting(false);

    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "Failed to process previous upload document conversion pipeline.");
      setSteps(s => s.map(step => step.status === 'running' ? { ...step, status: 'failed' } : step));
      setIsLiveConverting(false);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleDownloadDocx = (base64Data: string, filename: string) => {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = (base64Data: string, filename: string) => {
    if (!base64Data) {
      alert("This version does not have a compiled PDF structure yet. Re-run compilation to construct the visual layout.");
      return;
    }
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Input Selection & Compiler Step triggers */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* AIMS Compiles Option UI */}
          {activeWorkflow === 'aims_compiles' && (
            <div className="bg-white border border-slate-350 p-4 rounded-sm shadow-sm space-y-4">
              <h4 className="text-[11px] font-black uppercase text-slate-650 tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <Printer className="w-4 h-4 text-red-705 text-red-650" />
                SYSTEM REPORT SELECTOR
              </h4>

              <div>
                <label className="oracle-input-label block mb-1 text-slate-800 font-bold">Select Active Report Registry:</label>
                <select
                  id="aims-generate-report-select"
                  value={selectedReportId}
                  onChange={(e) => setSelectedReportId(e.target.value)}
                  className="oracle-field-value w-full text-xs"
                >
                  <option value="">-- Choose Audit Report Voucher --</option>
                  {reports.map((r) => (
                    <option key={r.id} value={r.id}>
                      [{r.reportNo}] {r.title.substring(0, 39)}...
                    </option>
                  ))}
                </select>
              </div>

              {selectedReportId ? (
                <button
                  id="start-report-pipeline-btn"
                  type="button"
                  disabled={isCompiling}
                  onClick={handleStartPDFCompilation}
                  className="w-full bg-red-700 hover:bg-red-800 disabled:bg-slate-300 text-white font-bold py-2.5 px-4 rounded-xs text-xs tracking-wider border-b-2 border-red-900 transition-all flex items-center justify-center gap-2 uppercase cursor-pointer animate-pulse"
                >
                  {isCompiling ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      Loading Conversion...
                    </>
                  ) : (
                    <>
                      <Printer className="w-4 h-4" />
                      Convert &amp; Generate PDF Report
                    </>
                  )}
                </button>
              ) : (
                <div className="text-center py-4 bg-slate-50 border border-slate-200 text-[10.5px] italic text-slate-400">
                  Select an audit report voucher above to launch conversion.
                </div>
              )}
            </div>
          )}

          {/* Upload DOCX manual Option UI */}
          {activeWorkflow === 'upload_docx' && (
            <div className="bg-white border border-slate-350 p-4 rounded-sm shadow-sm space-y-4">
              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded tracking-widest uppercase block w-max">
                LOCAL SANDBOX
              </span>
              <h4 className="text-[11px] font-black uppercase text-slate-650 tracking-wider flex items-center gap-2 border-b border-slate-100 pb-1.5">
                <FileUp className="w-4 h-4 text-emerald-600" />
                UPLOAD WORD FILING (.docx)
              </h4>

              {/* Optional Selected Report association */}
              <div>
                <label className="oracle-input-label block mb-1 text-slate-700 text-[10px] font-bold">Associate to existing Report (Optional):</label>
                <select
                  value={selectedReportId}
                  onChange={(e) => setSelectedReportId(e.target.value)}
                  className="oracle-field-value w-full text-xs"
                >
                  <option value="">-- Let standalone without association --</option>
                  {reports.map((r) => (
                    <option key={r.id} value={r.id}>
                      [{r.reportNo}] {r.title.substring(0, 39)}...
                    </option>
                  ))}
                </select>
              </div>

              {/* Drag n drop box */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={async (e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleLocalFileSelection(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => document.getElementById("local-word-uploader")?.click()}
                className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-red-600 bg-red-50/50' 
                    : localFile 
                    ? 'border-emerald-550 border-emerald-500 bg-emerald-50/10' 
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <input
                  id="local-word-uploader"
                  type="file"
                  accept=".docx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleLocalFileSelection(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <Upload className={`w-8 h-8 mx-auto mb-2 ${localFile ? 'text-emerald-600' : 'text-slate-400'}`} />
                {localFile ? (
                  <div>
                    <span className="text-xs font-bold text-slate-800 block truncate max-w-full">
                      {localFile.name}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {(localFile.size / 1024).toFixed(1)} KB (Selected)
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">
                      Drag and drop Word .docx file
                    </span>
                    <span className="text-[10.5px] text-slate-400">
                      or click to explore
                    </span>
                  </div>
                )}
              </div>

              {localFile ? (
                <button
                  type="button"
                  disabled={isCompiling}
                  onClick={handleCustomFormSubmitConversion}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-bold py-2.5 px-4 rounded-xs text-xs tracking-wider transition-all flex items-center justify-center gap-2 uppercase cursor-pointer"
                >
                  {isCompiling ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      Converting File...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      Convert DOCX to HTML &amp; PDF
                    </>
                  )}
                </button>
              ) : (
                <p className="text-[10px] text-center text-slate-400 font-mono">
                  Supported format: Microsoft Word (.docx) ONLY
                </p>
              )}
            </div>
          )}

          {/* Previously Uploaded Document selection Option UI */}
          {activeWorkflow === 'uploaded_history' && (
            <div className="bg-white border border-slate-350 p-4 rounded-sm shadow-sm space-y-4">
              <span className="bg-purple-100 text-purple-800 text-[9px] font-black px-2 py-0.5 rounded tracking-widest uppercase block w-max">
                LEDGER VAULTS
              </span>
              <h4 className="text-[11px] font-black uppercase text-slate-650 tracking-wider flex items-center gap-2 border-b border-slate-100 pb-1.5">
                <History className="w-4 h-4 text-purple-600" />
                SELECT PREVIOUS FILE UPLOAD
              </h4>

              {loadingUploadsList ? (
                <div className="text-center py-6 text-xs text-slate-400 italic">
                  Loading system uploads...
                </div>
              ) : uploadedFilesList.length === 0 ? (
                <div className="text-center py-6 text-[10.5px] text-slate-400 italic border border-dashed rounded bg-slate-50 p-4">
                  No previous .docx file uploads found in records ledger.
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="oracle-input-label block mb-1 text-slate-700 font-bold">Select Uploaded File:</label>
                    <select
                      value={selectedUploadId}
                      onChange={(e) => setSelectedUploadId(e.target.value)}
                      className="oracle-field-value w-full text-xs"
                    >
                      <option value="">-- Choose Vault Document --</option>
                      {uploadedFilesList.map((f) => (
                        <option key={f.UPLOAD_ID} value={f.UPLOAD_ID}>
                          [{f.UPLOAD_ID}] {f.FILE_NAME} ({(f.FILE_SIZE/1024).toFixed(1)} KB)
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedUploadId && (
                    <button
                      type="button"
                      disabled={isCompiling}
                      onClick={handleIngestSystemUploadedFile}
                      className="w-full bg-purple-700 hover:bg-purple-800 disabled:bg-slate-300 text-white font-bold py-2.5 px-4 rounded-xs text-xs tracking-wider transition-all flex items-center justify-center gap-2 uppercase cursor-pointer"
                    >
                      {isCompiling ? (
                        <>
                          <RotateCw className="w-4 h-4 animate-spin" />
                          Running Converter...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 text-purple-200" />
                          Parse &amp; Convert to PDF
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Workflow Steps Indicator */}
          {(isCompiling || steps.some(s => s.status !== 'idle')) && (
            <div className="bg-white border border-slate-350 p-4 rounded-sm shadow-sm space-y-4">
              <h4 className="text-[11px] font-black uppercase text-slate-650 tracking-wider border-b border-slate-100 pb-1.5">
                CONVERSION STATUS PIPELINE
              </h4>
              
              <div className="space-y-3.5">
                {steps.map((s, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start">
                    <span className={`shrink-0 mt-0.5 rounded-full p-0.5 ${
                      s.status === 'success' 
                        ? 'bg-green-100 text-green-700' 
                        : s.status === 'running'
                        ? 'bg-blue-100 text-blue-800 animate-pulse'
                        : s.status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-100 text-slate-350'
                    }`}>
                      {s.status === 'success' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : s.status === 'running' ? (
                        <RotateCw className="w-4 h-4 animate-spin" />
                      ) : s.status === 'failed' ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 opacity-50" />
                      )}
                    </span>
                    <div>
                      <h5 className="text-[11px] font-black uppercase text-slate-805 leading-none">
                        Step {idx+1}: {s.label}
                      </h5>
                      <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {errorText && (
                <div className="bg-red-50 border border-red-200 text-red-900 text-[10.5px] p-2.5 rounded-sm flex gap-1.5 items-start">
                  <AlertCircle className="w-4.5 h-4.5 text-red-700 shrink-0" />
                  <p className="leading-relaxed"><strong>System Exception:</strong> {errorText}</p>
                </div>
              )}
            </div>
          )}

          {/* Version History Table (displayed exclusively when appropriate) */}
          {selectedReportId && activeWorkflow === 'aims_compiles' && (
            <div className="bg-white border border-slate-350 rounded-sm shadow-sm overflow-hidden">
              <div className="bg-slate-100 p-2.5 border-b border-slate-200 flex justify-between items-center">
                <span className="text-[10.5px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-slate-600" />
                  Compiled Versions Record Log
                </span>
                <span className="bg-slate-200 text-[9px] font-bold font-mono px-1.5 py-0.5 rounded text-slate-600">
                  {versionHistory.length} versions
                </span>
              </div>

              {loadingHistory ? (
                <div className="p-6 text-center text-xs text-slate-400 italic">
                  Fetching historical vault entries...
                </div>
              ) : versionHistory.length === 0 ? (
                <div className="p-6 text-center text-[10.5px] text-slate-400 italic">
                  No compiled states registered. Generate a report above to create initial v1.
                </div>
              ) : (
                <div className="divide-y divide-slate-150 max-h-[250px] overflow-y-auto">
                  {versionHistory.map((v, i) => (
                    <div key={v.VERSION_ID} className="p-2.5 hover:bg-slate-50 text-[10.5px] space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900 text-xs">
                          Version {v.VERSION_NO}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500">
                          {new Date(v.CREATED_AT).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal italic font-mono">
                        ID: {v.VERSION_ID} ({ (v.DOC_SIZE/1024).toFixed(1) } KB)
                      </p>
                      <p className="text-[10px] text-slate-600 leading-normal">
                        Compiled by: <strong className="text-slate-705">{v.CREATED_BY}</strong>
                      </p>
                      
                      <div className="grid grid-cols-2 gap-1.5 pt-1.5">
                        <button
                          type="button"
                          onClick={() => handleDownloadDocx(v.DOCX_BLOB_BASE64, `${reports.find(r=>r.id === selectedReportId)?.reportNo.replace(/\//g, '_')}_v${v.VERSION_NO}.docx`)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-[9px] font-bold py-1 px-2 rounded border border-blue-200 flex items-center justify-center gap-1 cursor-pointer transition-all uppercase"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Docx (Word)
                        </button>
                        <button
                          type="button"
                          disabled={!v.PDF_BLOB_BASE64}
                          onClick={() => handleDownloadPdf(v.PDF_BLOB_BASE64, `${reports.find(r=>r.id === selectedReportId)?.reportNo.replace(/\//g, '_')}_v${v.VERSION_NO}.pdf`)}
                          className="bg-red-50 hover:bg-red-100 text-red-700 text-[9px] font-bold py-1 px-2 rounded border border-red-200 flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-40 disabled:hover:bg-red-50 uppercase"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          PDF File
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right: Rich Visual preview & styling */}
        <div className="lg:col-span-8">
          {isLiveConverting || (liveHtmlContent && !compiledResult) ? (
            <div className="bg-white border border-indigo-200 rounded-sm shadow-md overflow-hidden flex flex-col h-full">
              
              <div className="bg-[#0d3b70] border-b border-indigo-950 p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0 text-white animate-pulse">
                <div className="flex items-center gap-2">
                  <RotateCw className="w-4 h-4 text-emerald-400 animate-spin" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    REAL-TIME HTML CONVERSION PIPELINE ACTIVE
                  </span>
                </div>
                <div className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-widest bg-[#0b2f59] text-emerald-300 font-mono animate-pulse">
                  Rendering Live Conversions
                </div>
              </div>

              {/* Active preview display window */}
              <div className="p-6 bg-slate-100 flex-1 overflow-y-auto max-h-[600px] min-h-[450px]">
                <div className="bg-white rounded border border-slate-350 p-8 shadow-md max-w-[210mm] mx-auto min-h-[297mm] flex flex-col relative text-[11.5px] leading-relaxed font-sans text-slate-800">
                  
                  {/* Dynamic Stream Output */}
                  <div className="space-y-4 relative flex-1">
                    <div 
                      className="prose prose-sm max-w-none text-slate-800 space-y-3 overflow-hidden select-text"
                      dangerouslySetInnerHTML={{ __html: liveHtmlContent }} 
                    />
                  </div>

                  {/* Footers for live simulation */}
                  <div className="border-t border-dashed pt-3 mt-8 flex justify-between text-[9px] text-slate-400 font-sans font-medium">
                    <span>AIMS REPORTING CLOUD LEDGER SYSTEM</span>
                    <span className="flex items-center gap-1 font-semibold text-emerald-600">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                      Dynamic Render Active
                    </span>
                  </div>

                </div>
              </div>

              {/* Action Banner */}
              <div className="bg-slate-50 border-t border-slate-200 p-3 flex justify-between items-center text-[10px] text-slate-550 font-bold">
                <span>Mammoth parser compiling raw XML buffers straight to DOM trees...</span>
                <span className="text-indigo-900 font-mono">Status: Stream Active</span>
              </div>

            </div>
          ) : compiledResult ? (
            <div className="bg-white border border-slate-350 rounded-sm shadow-sm overflow-hidden flex flex-col">
              
              <div className="bg-slate-100 border-b border-slate-200 p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-700" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    DOCUMENT CONVERSION COMPLETED SUCCESSFULLY
                  </span>
                </div>
                
                {/* Mode Selector Toggle */}
                <div className="flex bg-slate-200 p-0.5 rounded gap-1 self-stretch sm:self-auto">
                  <button
                    onClick={() => setPreviewTab('preview')}
                    className={`flex-1 sm:flex-none px-2.5 py-1 text-[10px] uppercase font-bold rounded-xs transition-all cursor-pointer ${
                      previewTab === 'preview' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-800 font-medium'
                    }`}
                  >
                    📄 Layout Preview
                  </button>
                  <button
                    onClick={() => setPreviewTab('html')}
                    className={`flex-1 sm:flex-none px-2.5 py-1 text-[10px] uppercase font-bold rounded-xs transition-all cursor-pointer ${
                      previewTab === 'html' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-800 font-medium'
                    }`}
                  >
                    🔗 Raw HTML Layer
                  </button>
                </div>
              </div>

              {/* Active preview display window */}
              {previewTab === 'preview' ? (
                <div className="p-6 bg-slate-100 flex-1 overflow-y-auto max-h-[600px]">
                  <div className="bg-white rounded border border-slate-300 p-8 shadow-xs max-w-[210mm] mx-auto min-h-[297mm] flex flex-col relative text-[11px] leading-relaxed select-text font-serif text-slate-800">
                    
                    {/* Decorative Header */}
                    <div className="border-t-4 border-blue-900 pt-3 border-b pb-3 mb-6 font-sans">
                      <div className="flex justify-between items-start">
                        <div>
                          <h1 className="text-sm font-black text-blue-900 tracking-wider">RASHTRIYA ISPAT NIGAM LIMITED</h1>
                          <h2 className="text-[10px] font-black text-slate-500 tracking-widest mt-0.5">INTERNAL AUDIT OFFICE | VISAKHAPATNAM STEEL PLANT</h2>
                        </div>
                        <span className="bg-blue-50 border border-blue-200 rounded text-blue-800 px-2 py-1 text-[8px] font-black font-mono tracking-widest uppercase">
                          CVC COMPLIANT
                        </span>
                      </div>
                    </div>

                    {/* Content view */}
                    <div className="space-y-4 relative flex-1 font-sans">
                      <h3 className="text-base font-black text-slate-800 border-b pb-1">
                        {compiledResult.report.title}
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-4 bg-slate-550 bg-slate-50 border p-3 rounded text-[10px] font-mono">
                        <div>
                          <span className="font-bold text-slate-505 block">Report Reference No:</span>
                          <span className="text-slate-800">{compiledResult.report.reportNo}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-505 block">Voucher ID:</span>
                          <span className="text-slate-800">VSP-{compiledResult.report.id}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-505 block">Lead Auditor:</span>
                          <span className="text-slate-800 font-bold text-blue-900">{compiledResult.report.leadAuditor}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-505 block">Processing User:</span>
                          <span className="text-slate-800 uppercase font-black">{currentUser.name || "Authorized Auditor"}</span>
                        </div>
                      </div>

                      {/* Decoded Body visual */}
                      <div className="mt-4 border-t pt-4">
                        <span className="text-[9px] font-black text-red-700 tracking-wider block mb-2 uppercase font-mono">
                          Transcribed Document Body:
                        </span>
                        <div 
                          className="prose prose-sm max-w-none text-slate-850 text-slate-800 space-y-3"
                          dangerouslySetInnerHTML={{ __html: compiledResult.version.HTML_CONTENT }} 
                        />
                      </div>

                    </div>

                    {/* Footers for print simulation */}
                    <div className="border-t pt-2 mt-8 flex justify-between text-[9px] text-slate-400 font-sans">
                      <span>AIMS REPORTING CLOUD LEDGER RECORD SYSTEM</span>
                      <span>Page 1 of 1 (Simulation)</span>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-900 text-lime-400 font-mono text-[10px] overflow-x-auto overflow-y-auto max-h-[600px] select-all">
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-300">
                    &lt;!-- MAMMOTH HTML CONVERTED BINDING STREAM --&gt;
                  </div>
                  <pre className="mt-2 whitespace-pre-wrap">{compiledResult.version.HTML_CONTENT}</pre>
                </div>
              )}

              {/* Action Downloads Control Bar */}
              <div className="bg-slate-50 border-t border-slate-200 p-3.5 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="text-[10px] text-slate-500">
                  Secure PDF Hash dynamically cached and registered under token <strong>VER-{compiledResult.version.VERSION_ID}</strong>.
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(compiledResult.version.PDF_BLOB_BASE64, `${compiledResult.report.reportNo.replace(/\//g, '_')}_Report.pdf`)}
                    className="flex-1 sm:flex-none bg-red-800 hover:bg-red-900 text-white font-bold py-2 px-4 rounded-xs text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs uppercase"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF Report
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadDocx(compiledResult.version.DOCX_BLOB_BASE64, `${compiledResult.report.reportNo.replace(/\//g, '_')}_Report.docx`)}
                    className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-950 text-white font-bold py-2 px-4 rounded-xs text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs uppercase"
                  >
                    <Download className="w-4 h-4" />
                    Download Original (.docx)
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white border border-slate-350 rounded-sm shadow-sm h-full flex flex-col items-center justify-center text-center p-8 min-h-[400px]">
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-8 rounded-full">
                <FileCode className="w-12 h-12 text-slate-300 animate-pulse" />
              </div>
              <h3 className="text-sm font-bold text-slate-700 tracking-tight mt-4 uppercase">
                Document Preview Canvas
              </h3>
              <p className="text-[11px] text-slate-400 max-w-sm mt-1">
                Select your preferred compilation workflow from the top tabs, match a Word draft or load a local file, then click the conversion pipeline buttons to build high-contrast PDFs.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
