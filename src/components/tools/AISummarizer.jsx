import React, { useState } from 'react';
import FileDropzone from '../common/FileDropzone';
import { ocrService } from '../../services/ocrService';
import { aiService } from '../../services/aiService';
import { jsPDF } from 'jspdf';
import { Sparkles, Loader2, BrainCircuit, Quote, Download, Settings, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadFile } from '../../utils/download';
import JSZip from 'jszip';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function AISummarizer() {
  const [files, setFiles] = useState([]);
  const [summary, setSummary] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');

  const downloadSummary = () => {
    downloadFile(summary, `summary-${files[0].name.split('.')[0]}.txt`, 'text/plain');
  };

  const downloadSummaryAsPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('AI Executive Summary', 15, 20);
    doc.setFontSize(11);
    const splitText = doc.splitTextToSize(summary, 180);
    doc.text(splitText, 15, 35);
    doc.save(`Summary-${files[0].name.split('.')[0]}.pdf`);
  };

  const handleSummarize = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    setSummary('');
    try {
      if (files.length === 1) {
        const file = files[0];
        setProgress('Extracting text from PDF...');
        const text = await ocrService.extractTextFromPDF(file);
        
        if (!text.trim()) {
          throw new Error('No text found in PDF. Try using OCR first.');
        }

        setProgress('Analyzing with AI (this may take a minute)...');
        const aiSummary = await aiService.summarize(text);
        setSummary(aiSummary);
        downloadFile(aiSummary, `Summary-${files[0].name.split('.')[0]}.txt`, 'text/plain');
      } else {
        const zip = new (JSZip.default || JSZip)();
        for (const file of files) {
          setProgress(`Processing: ${file.name}...`);
          const text = await ocrService.extractTextFromPDF(file);
          if (!text.trim()) continue;
          
          const aiSummary = await aiService.summarize(text);
          zip.file(`Summary-${file.name.split('.')[0]}.txt`, aiSummary);
        }
        const content = await zip.generateAsync({ type: 'blob' });
        downloadFile(content, 'Summaries-Batch.zip', 'application/zip');
        setSummary('Batch summarization complete! Check your downloads.');
      }
    } catch (error) {
      console.error('Summarization failed:', error);
      alert(error.message || 'Failed to summarize PDF. Make sure it contains readable text.');
    } finally {
      setIsProcessing(false);
      setProgress('');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full max-w-6xl">
      <div className="flex-1 w-full">
        <FileDropzone 
          files={files} 
          setFiles={setFiles} 
          multiple={true}
          accept={{ 'application/pdf': ['.pdf'] }} 
        />
      </div>
      
      <div className="w-full lg:w-72 bg-white border border-slate-100 p-6 rounded-[1.5rem] space-y-6 animate-in fade-in slide-in-from-right-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
            <Settings className="text-accent" size={18} />
            SETTINGS
          </h3>
          {files.length > 2 && (
            <span className="bg-yellow-100 text-yellow-700 text-[8px] px-2 py-0.5 rounded-full font-black">
              BATCH
            </span>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-[11px] text-slate-400 font-medium leading-relaxed uppercase tracking-wider">
            {files.length > 1 
              ? `AI will analyze ${files.length} PDFs.`
              : 'Our AI will generate a concise summary.'}
          </p>
        </div>

        <button
          onClick={handleSummarize}
          disabled={files.length === 0 || isProcessing}
          className={cn(
            "w-full bg-accent hover:opacity-90 text-slate-900 py-4 rounded-2xl flex items-center justify-center gap-2 text-sm mt-4 font-black shadow-lg shadow-accent/10 transition-all",
            (files.length === 0 || isProcessing) && "opacity-50 cursor-not-allowed grayscale"
          )}
        >
          {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <BrainCircuit size={18} />}
          {isProcessing ? 'THINKING...' : 'SUMMARIZE PDF'}
        </button>

        {progress && (
          <p className="text-[10px] text-accent font-black text-center animate-pulse uppercase tracking-widest">
            {progress}
          </p>
        )}
      </div>

      <AnimatePresence>
        {summary && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-12 w-full max-w-4xl bg-white border border-slate-100 p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 text-indigo-100 -rotate-12">
              <Quote size={80} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-accent text-slate-900 rounded-xl flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <h4 className="text-xl font-bold text-slate-800 tracking-tight">AI Executive Summary</h4>
              </div>

              <div className="text-slate-700 leading-relaxed text-lg font-medium italic">
                "{summary}"
              </div>

              <div className="mt-10 pt-8 border-t border-indigo-100 flex justify-between items-center text-sm">
                <div className="flex gap-2 items-center">
                  <span className="text-slate-400 mr-2">Download:</span>
                  <button 
                    onClick={downloadSummary}
                    className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <Download size={14} /> TXT
                  </button>
                  <button 
                    onClick={downloadSummaryAsPDF}
                    className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <FileText size={14} /> PDF
                  </button>
                </div>
                <button 
                  onClick={() => setSummary('')}
                  className="text-slate-500 font-medium hover:underline"
                >
                  Summarize Another
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
