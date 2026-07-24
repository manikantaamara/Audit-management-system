import React, { useState, useRef } from 'react';
import { 
  FileText, Upload, CheckCircle2, RotateCw, AlertTriangle, 
  Download, Printer, Table, Database, Eye, ShieldAlert, BookOpen
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportPreviewGeneratorProps {
  currentUser: { 
    name: string; 
    id?: string; 
    username?: string; 
    role: string; 
    department?: string; 
    designation?: string 
  };
}

interface ConversionRecord {
  id: string;
  file_name: string;
  original_file_path: string;
  html_content: string;
  generated_pdf_path: string;
  uploaded_by: string;
  role_name: string;
  upload_date: string;
  status: string;
}

export default function ReportPreviewGenerator({ currentUser }: ReportPreviewGeneratorProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorText, setErrorText] = useState('');
  
  // Current active conversion record
  const [record, setRecord] = useState<ConversionRecord | null>(null);
  
  // PDF state
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);
  const [generatedPdfBase64, setGeneratedPdfBase64] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setErrorText('');

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setErrorText('');
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const validateAndProcessFile = (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    const allowed = ['docx', 'pdf', 'rtf', 'doc', 'txt'];
    
    if (!ext || !allowed.includes(ext)) {
      setErrorText(`Failed Validation: System requires .docx, .pdf, or .rtf/txt formats. Provided: .${ext || 'unspecified'}`);
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setErrorText(`Overflow Violation: File size is ${(selectedFile.size / (1024 * 1024)).toFixed(1)}MB. Limit strictly capped at 50MB.`);
      return;
    }

    setFile(selectedFile);
    uploadAndConvert(selectedFile);
  };

  const uploadAndConvert = (targetFile: File) => {
    setIsProcessing(true);
    setRecord(null);
    setPdfReady(false);
    setGeneratedPdfBase64('');
    setErrorText('');

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const rawResult = e.target?.result as string;
        const b64Data = rawResult.split(',')[1];

        const payload = {
          fileDataBlob: b64Data,
          filename: targetFile.name,
          fileType: targetFile.type,
          uploadedBy: currentUser.name || "Shri R.K. Murthy",
          roleName: currentUser.role || "Auditor HOD"
        };

        const response = await fetch('/api/conversions/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Server error during conversion compilation.');
        }

        const data = await response.json();
        if (data.success && data.record) {
          setRecord(data.record);
        } else {
          throw new Error('No conversion record returned by database.');
        }
      } catch (err: any) {
        console.error("Conversion pipeline failure:", err);
        setErrorText(`AIMS Exception: ${err.message}`);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setErrorText('Failed to read file from filesystem.');
      setIsProcessing(false);
    };

    reader.readAsDataURL(targetFile);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Compile PDF locally and upload to database
  const handleGeneratePdf = async () => {
    if (!record) return;
    setIsGeneratingPdf(true);
    setErrorText('');

    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate government portal compiling delay

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);

      // 1. RINL Government Header Branding
      doc.setFillColor(30, 58, 138); // deep blue
      doc.rect(margin, margin, contentWidth, 12, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text("VISAKHAPATNAM STEEL PLANT - RECONCILED REPORT PORTAL", margin + 5, margin + 7.5);

      // Gold strip
      doc.setFillColor(234, 179, 8); // yellow gold
      doc.rect(margin, margin + 12, contentWidth, 1.5, 'F');

      // Metadata card
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, margin + 18, contentWidth, 32, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.rect(margin, margin + 18, contentWidth, 32, 'D');

      doc.setTextColor(30, 58, 138);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.text("OFFICIAL SYSTEM CONVERSION DISPATCH VERIFICATION", margin + 4, margin + 24);

      doc.setTextColor(100, 116, 139);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text(`Conversion Ref: AIMS-${record.id}  |  Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, margin + 4, margin + 29);

      // Meta grid
      let gridY = margin + 35;
      const gridItems = [
        ["FILE NAME:", record.file_name, "ROLE COMPILED:", record.role_name],
        ["UPLOADED BY:", record.uploaded_by, "UPLOAD DATE:", record.upload_date]
      ];

      gridItems.forEach(row => {
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(51, 65, 85);
        doc.text(row[0], margin + 4, gridY);
        doc.setFont("Helvetica", "normal");
        doc.text(row[1], margin + 32, gridY);

        doc.setFont("Helvetica", "bold");
        doc.text(row[2], margin + 105, gridY);
        doc.setFont("Helvetica", "normal");
        doc.text(row[3], margin + 130, gridY);
        gridY += 5;
      });

      // Render content
      let currentY = margin + 57;
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(8.5);

      // Helper parser to read preview and insert nicely structured paragraphs and tables
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = record.html_content;

      const children = Array.from(tempDiv.childNodes);
      
      const tableHeaders: string[][] = [];
      const tableRows: string[][][] = [];
      let isReadingTable = false;

      // Extract details
      children.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          const tagName = element.tagName.toLowerCase();

          if (tagName === 'table') {
            const currentHeaders: string[] = [];
            const currentRows: string[][] = [];
            
            // th columns
            element.querySelectorAll('th').forEach(th => {
              currentHeaders.push(th.innerText.trim());
            });

            // trtd
            element.querySelectorAll('tr').forEach(tr => {
              const row: string[] = [];
              tr.querySelectorAll('td').forEach(td => {
                row.push(td.innerText.trim());
              });
              if (row.length > 0) {
                currentRows.push(row);
              }
            });

            if (currentHeaders.length > 0 || currentRows.length > 0) {
              tableHeaders.push(currentHeaders);
              tableRows.push(currentRows);
            }
          }
        }
      });

      // Write title of parsed doc
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 58, 138);
      doc.text("DOCUMENT DOCUMENTATION BODY", margin, currentY);
      currentY += 6;

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);

      // Standard text layout summary
      const textSummary = tempDiv.innerText.replace(/\s+/g, ' ').substring(0, 500).trim();
      const wrappedText = doc.splitTextToSize(textSummary + "... [See structured table grid breakdown below]", contentWidth);
      doc.text(wrappedText, margin, currentY);
      currentY += (wrappedText.length * 4.5) + 6;

      // Render tables using high fidelity autoTable
      if (tableRows.length > 0) {
        tableRows.forEach((rows, tIdx) => {
          const headers = tableHeaders[tIdx] && tableHeaders[tIdx].length > 0 
            ? tableHeaders[tIdx] 
            : rows[0] ? rows[0].map((_, i) => `Col ${i + 1}`) : ["Column Data"];
          
          const filteredRows = tableHeaders[tIdx] && tableHeaders[tIdx].length > 0 ? rows : rows.slice(1);

          if (currentY > pageHeight - 40) {
            doc.addPage();
            currentY = margin + 10;
          }

          autoTable(doc, {
            head: [headers],
            body: filteredRows,
            startY: currentY,
            margin: { left: margin, right: margin },
            styles: { fontSize: 7.5, cellPadding: 2, font: "Helvetica" },
            headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: "bold" },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            didDrawPage: (data) => {
              currentY = data.cursor ? data.cursor.y + 8 : currentY;
            }
          });
        });
      } else {
        // Just text format
        const textFull = doc.splitTextToSize(tempDiv.innerText, contentWidth);
        let textY = currentY;
        textFull.forEach((line: string) => {
          if (textY > pageHeight - 20) {
            doc.addPage();
            textY = margin + 15;
          }
          doc.text(line, margin, textY);
          textY += 4.5;
        });
        currentY = textY;
      }

      // Add standard footer to each page
      const totalPages = (doc.internal as any).getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
        
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.text("AIMS AUDIT SUITE - INTEGRAL GOVERNMENT CONVERSION KERNEL", margin, pageHeight - 8);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 15, pageHeight - 8);
      }

      // Convert to base64
      const b64String = doc.output('datauristring').split(',')[1];
      
      // Save base64 using /api/conversions/:id/generate-pdf
      const patchResponse = await fetch(`/api/conversions/${record.id}/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pdfBase64: b64String,
          uploadedBy: currentUser.name,
          roleName: currentUser.role
        })
      });

      if (!patchResponse.ok) {
        throw new Error('Failed to commit compiled PDF version to relational ledger.');
      }

      const patchData = await patchResponse.json();
      if (patchData.success) {
        setRecord(patchData.record);
        setGeneratedPdfBase64(b64String);
        setPdfReady(true);
      } else {
        throw new Error('Metadata mismatch returning from commit.');
      }

    } catch (e: any) {
      console.error(e);
      setErrorText(`PDF Compilation Error: ${e.message}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!generatedPdfBase64 || !record) return;
    
    const binary = atob(generatedPdfBase64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `AIMS_CONVERSION_${record.file_name.replace(/\.[^/.]+$/, "")}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 space-y-4 font-sans bg-slate-100 min-h-screen text-slate-800 pb-10" id="aims-pdf-generation-flow">
      {/* 1. Header of Core Module */}
      <div className="bg-[#1e3a8a] text-white p-4 rounded border-b-[3px] border-yellow-500 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-5 bg-yellow-400 rounded-xs inline-block" />
            <h1 className="text-lg font-black uppercase tracking-wide">Reply Entry Document Converter</h1>
          </div>
          <p className="text-[11px] text-blue-200 mt-1 font-mono tracking-widest uppercase">RINL ERP INTERNAL AUDIT STAGE 1-5 SECURE PIPELINE</p>
        </div>
        <div className="bg-blue-950 px-3 py-1.5 rounded border border-blue-800 text-right shrink-0 select-none">
          <p className="text-[10px] text-slate-400 font-bold uppercase leading-none">ACTIVE USER SECURITY CONTEXT</p>
          <p className="text-[11px] text-yellow-400 font-mono font-bold mt-0.5">{currentUser.name} | {currentUser.role}</p>
        </div>
      </div>

      {errorText && (
        <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded shadow-2xs flex items-start gap-2.5 font-mono animate-fade-in">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <span className="font-black uppercase">Exception Flagged:</span> {errorText}
          </div>
        </div>
      )}

      {/* Grid Layout containing Form uploads & File details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* SECTION 1: Upload Report Card */}
        <div className="bg-white border border-[#cbd5e1] rounded p-4 shadow-3xs flex flex-col justify-between min-h-[220px]" id="upload-report-card">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
              <Upload className="w-4 h-4 text-blue-700" />
              <h2 className="text-xs font-black uppercase tracking-wider text-blue-900">Upload Portal Document (.docx, .pdf, .rtf)</h2>
            </div>
            
            <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
              Upload compliance audit reports, reply submissions, or corrections directly. Submissions undergo automatic high-fidelity Mammoth parsing and real-time schema mapping. Max limit 50MB.
            </p>
          </div>

          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
            className={`flex-1 border-2 border-dashed rounded p-3 flex flex-col items-center justify-center transition-all cursor-pointer select-none text-center ${
              dragActive 
                ? 'border-blue-600 bg-blue-50' 
                : 'border-slate-350 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <input 
              ref={fileInputRef}
              type="file"
              onChange={handleChange}
              accept=".docx,.pdf,.rtf,.doc,.txt"
              className="hidden"
            />
            {isProcessing ? (
              <div className="space-y-2">
                <RotateCw className="w-8 h-8 text-blue-800 animate-spin mx-auto" />
                <p className="text-xs font-bold text-blue-800">Processing document structures...</p>
                <p className="text-[9.5px] text-slate-400 font-mono uppercase">Committing temporary base64 buffers</p>
              </div>
            ) : (
              <div className="space-y-1.5 p-3">
                <div className="bg-white p-2.5 rounded-full border shadow-3xs w-11 h-11 flex items-center justify-center mx-auto">
                  <FileText className="w-5 h-5 text-blue-700" />
                </div>
                <p className="text-xs font-bold text-slate-700">Drag & drop files or click to browser files</p>
                <p className="text-[9.5px] text-slate-400 font-mono">Accepts DOCX, DOC, PDF, RTF (Max 50MB)</p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: File Details Card */}
        <div className="bg-white border border-[#cbd5e1] rounded p-4 shadow-3xs flex flex-col justify-between min-h-[220px]" id="file-details-card">
          <div className="w-full">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
              <Database className="w-4 h-4 text-[#1e3a8a]" />
              <h2 className="text-xs font-black uppercase tracking-wider text-[#1e3a8a]">Extracted File Metadata Records</h2>
            </div>

            {record ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono leading-relaxed p-1">
                <div className="border border-slate-100 p-2 rounded bg-slate-50">
                  <p className="text-[9px] font-bold text-slate-400">PHYSICAL DATABASE AUTO KEY</p>
                  <p className="text-slate-800 font-black">{record.id}</p>
                </div>
                <div className="border border-slate-100 p-2 rounded bg-slate-50">
                  <p className="text-[9px] font-bold text-slate-400">UPLOADED FILE NAME</p>
                  <p className="text-slate-800 font-black truncate" title={record.file_name}>{record.file_name}</p>
                </div>
                <div className="border border-slate-100 p-2 rounded bg-slate-50">
                  <p className="text-[9px] font-bold text-slate-400">SYSTEM PARSING ENGINE</p>
                  <p className="text-emerald-700 font-black flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready (High Fidelity)
                  </p>
                </div>
                <div className="border border-slate-100 p-2 rounded bg-slate-50">
                  <p className="text-[9px] font-bold text-slate-400">UPLOADER SECURITY ID</p>
                  <p className="text-slate-800 font-black">{record.uploaded_by}</p>
                </div>
                <div className="border border-slate-100 p-2 rounded bg-slate-50">
                  <p className="text-[9px] font-bold text-slate-400">UPLOADER DESIGNATION ROLE</p>
                  <p className="text-blue-700 font-black">{record.role_name}</p>
                </div>
                <div className="border border-slate-100 p-2 rounded bg-slate-50">
                  <p className="text-[9px] font-bold text-slate-400">REGISTRY TIMESTAMP</p>
                  <p className="text-slate-800 font-black">{record.upload_date}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                <ShieldAlert className="w-8 h-8 text-slate-300 stroke-1" />
                <p className="text-xs mt-2 italic font-medium">Please upload an audit document to view relator mapping.</p>
              </div>
            )}
          </div>

          {/* SECTION 4: Actions Bar */}
          {record && (
            <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2 justify-end" id="actions-bar">
              <button
                onClick={handleGeneratePdf}
                disabled={isGeneratingPdf}
                className={`px-3.5 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-3xs transition-all ${
                  isGeneratingPdf 
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                    : pdfReady 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                      : 'bg-blue-800 hover:bg-blue-900 text-white'
                }`}
              >
                {isGeneratingPdf ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    Compiling Vector PDF...
                  </>
                ) : pdfReady ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    PDF Successfully Compiled!
                  </>
                ) : (
                  <>
                    <Printer className="w-3.5 h-3.5" />
                    Generate PDF
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadPdf}
                disabled={!pdfReady}
                className={`px-3.5 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-3xs transition-all ${
                  pdfReady 
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-blue-950 font-black border-b-[2.5px] border-yellow-700' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </button>
            </div>
          )}
        </div>

      </div>

      {/* SECTION 3: HTML Preview Panel */}
      <div className="bg-white border border-[#cbd5e1] rounded shadow-3xs overflow-hidden" id="html-preview-panel">
        <div className="bg-[#f8fafc] border-b border-slate-205 border-slate-200 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-800" />
            <h2 className="text-xs font-black uppercase tracking-wider text-blue-950">High-Fidelity HTML Preview Render Layout</h2>
          </div>
          <span className="bg-blue-105 bg-blue-100 text-[#1e3a8a] text-[9.5px] font-mono px-2 py-0.5 rounded font-black uppercase border border-blue-200">
            {record ? record.file_name.split('.').pop()?.toUpperCase() : 'NO FILE'} Rendering
          </span>
        </div>

        <div className="p-4 md:p-6 bg-slate-50 min-h-[250px] max-h-[600px] overflow-y-auto">
          {record ? (
            <div 
              className="prose prose-sm prose-slate max-w-none bg-white p-6 rounded border shadow-2xs leading-relaxed text-slate-800 markdown-body"
              id="aims-compiled-markup-render"
              dangerouslySetInnerHTML={{ __html: record.html_content }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center">
              <BookOpen className="w-10 h-10 text-slate-350 stroke-1 animate-pulse-subtle" />
              <p className="text-xs font-black uppercase tracking-wider mt-3">Ready for conversion pipeline</p>
              <p className="text-[10px] text-slate-450 mt-1 max-w-sm">
                AIMS parser will automatically compile headings, margins, font alignments, and lists to pristine HTML.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 5: Real-time Integration Check grid */}
      {record && (
        <div className="bg-white border border-[#cbd5e1] rounded p-4 shadow-3xs" id="integration-check-grid">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-black uppercase tracking-wider text-emerald-900">AIMS Relational Integration & Commitment Status</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono select-none">
            
            <div className="border border-emerald-100 bg-emerald-50/50 p-2.5 rounded text-center">
              <span className="block text-[8px] text-slate-400 uppercase font-bold">SQL SCHEMA TARGET</span>
              <span className="font-extrabold text-slate-800">report_conversions</span>
            </div>

            <div className="border border-emerald-100 bg-emerald-50/50 p-2.5 rounded text-center">
              <span className="block text-[8px] text-slate-400 uppercase font-bold">STATUS CELL VALUES</span>
              <span className="font-extrabold text-[#115e59]">{record.status}</span>
            </div>

            <div className="border border-emerald-100 bg-emerald-50/50 p-2.5 rounded text-center">
              <span className="block text-[8px] text-slate-400 uppercase font-bold">PDF STORED BYTES</span>
              <span className="font-extrabold text-blue-800">
                {record.generated_pdf_path ? `${(record.generated_pdf_path.length / 1024).toFixed(1)} KB` : '0.00 KB (Pending)'}
              </span>
            </div>

            <div className="border border-emerald-100 bg-emerald-50/50 p-2.5 rounded text-center">
              <span className="block text-[8px] text-slate-400 uppercase font-bold">SYSTEM COMMIT LINK</span>
              <span className="font-extrabold text-emerald-700 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> SECURE SAVED
              </span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
