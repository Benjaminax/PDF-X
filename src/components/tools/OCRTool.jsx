import { useState } from 'react';
import FileDropzone from '../common/FileDropzone';
import { ocrService } from '../../services/ocrService';
import { jsPDF } from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import { FileSearch, Copy, Download, Loader2, CheckCircle2, FileText, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadFile } from '../../utils/download';
import JSZip from 'jszip';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function OCRTool() {
  const [files, setFiles] = useState([]);
  const [resultText, setResultText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [progress, setProgress] = useState('');

  const handleOCR = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    setResultText('');
    try {
      const zip = new (JSZip.default || JSZip)();
      let totalText = '';
      let successCount = 0;
      const failedFiles = [];

      for (let fileIdx = 0; fileIdx < files.length; fileIdx++) {
        const file = files[fileIdx];
        setProgress(`Processing ${file.name}...`);
        try {
          if (file.type === 'application/pdf') {
            const pdfBytes = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const pageCount = pdfDoc.getPageCount();

            let docText = '';
            for (let i = 1; i <= pageCount; i++) {
              setProgress(`Scanning ${file.name} - Page ${i}/${pageCount}...`);
              const imageBlob = await ocrService.pdfPageToImage(file, i);
              const text = await ocrService.recognizeText(imageBlob);
              docText += `--- Page ${i} ---\n\n${text}\n\n`;
            }

            if (files.length === 1) {
              totalText = docText;
            } else {
              zip.file(`OCR-${file.name.split('.')[0]}.txt`, docText);
            }
          } else {
            const text = await ocrService.recognizeText(file);
            if (files.length === 1) {
              totalText = text;
            } else {
              zip.file(`OCR-${file.name.split('.')[0]}.txt`, text);
            }
          }

          successCount++;
        } catch (fileError) {
          console.error(`Failed processing ${file.name}:`, fileError);
          failedFiles.push({ name: file.name, error: fileError.message || String(fileError) });
        }
      }

      // Finalize results and provide user feedback
      if (files.length === 1) {
        if (successCount === 1) {
          setResultText(totalText);
          downloadFile(totalText, `OCR-${files[0].name.split('.')[0]}.txt`, 'text/plain');
        } else {
          throw new Error(`Failed to process file: ${files[0].name}`);
        }
      } else {
        if (successCount > 0) {
          const content = await zip.generateAsync({ type: 'blob' });
          downloadFile(content, 'OCR-Batch.zip', 'application/zip');
          setResultText(`Batch processing complete: ${successCount} succeeded, ${failedFiles.length} failed.`);
        } else {
          throw new Error('All files failed during OCR processing.');
        }
      }

      if (failedFiles.length > 0) {
        // Show a concise error summary
        const summary = failedFiles.map(f => `${f.name}: ${f.error}`).join('\n');
        alert(`Some files failed during OCR:\n${summary}`);
      }
    } catch (error) {
      console.error('OCR failed:', error);
      alert('Failed to extract text. Make sure the file is clear and readable.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(resultText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const downloadText = () => {
    downloadFile(resultText, `text-${files[0].name.split('.')[0]}.txt`, 'text/plain');
  };

  const downloadAsPDF = () => {
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(resultText, 180);
    doc.text(splitText, 15, 20);
    doc.save(`OCR-${files[0].name.split('.')[0]}.pdf`);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full max-w-6xl">
        <div className="flex-1 w-full">
          <FileDropzone 
            files={files} 
            setFiles={setFiles} 
            multiple={true}
            accept={{ 
              'image/*': ['.jpg', '.jpeg', '.png'],
              'application/pdf': ['.pdf']
            }} 
          />
        </div>

        <div className="w-full lg:w-72 glass-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-xs text-slate-800 dark:text-slate-100 flex items-center gap-2 uppercase tracking-widest">
              <Settings className="text-accent" size={16} />
              Parameters
            </h3>
            {files.length > 2 && (
              <span className="bg-accent/20 text-accent text-[8px] px-2 py-0.5 rounded-full font-black">
                BATCH
              </span>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-relaxed uppercase tracking-widest">
              {files.length > 1 
                ? `Scanning ${files.length} documents for text extraction.`
                : 'Intelligent character recognition system ready.'}
            </p>
          </div>

          <button
            onClick={handleOCR}
            disabled={files.length === 0 || isProcessing}
            className={cn(
              "btn-primary w-full flex items-center justify-center gap-3 text-xs",
              (files.length === 0 || isProcessing) && "opacity-50 cursor-not-allowed grayscale"
            )}
          >
            {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <FileSearch size={16} />}
            {isProcessing ? 'SCANNING...' : 'EXTRACT TEXT'}
          </button>

          {progress && (
            <p className="text-[10px] text-accent font-black text-center animate-pulse uppercase tracking-widest">
              {progress}
            </p>
          )}
        </div>
      </div>

      <AnimatePresence>
        {resultText && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="mt-12 w-full max-w-4xl glass-card p-8"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">EXTRACTED CONTENT</h4>
                <p className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-widest">Digital Text Output Stream</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={copyToClipboard}
                  className="btn-secondary px-6 py-3 flex items-center gap-2 text-xs font-bold"
                >
                  {isCopied ? <CheckCircle2 size={18} className="text-accent" /> : <Copy size={18} />}
                  {isCopied ? 'COPIED!' : 'COPY'}
                </button>
                <button 
                  onClick={downloadText}
                  className="btn-secondary px-4 py-3 flex items-center gap-2 text-[10px] font-black"
                >
                  <Download size={14} />
                  TXT
                </button>
                <button 
                  onClick={downloadAsPDF}
                  className="btn-secondary px-4 py-3 flex items-center gap-2 text-[10px] font-black"
                >
                  <FileText size={14} />
                  PDF
                </button>
              </div>
            </div>
            <div className="bg-slate-50/50 dark:bg-zinc-900/50 p-8 rounded-[2rem] border border-slate-100 dark:border-white/5 min-h-[300px] max-h-[600px] overflow-y-auto whitespace-pre-wrap text-slate-700 dark:text-zinc-300 font-mono text-sm leading-relaxed scrollbar-hide shadow-inner">
              {resultText}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
