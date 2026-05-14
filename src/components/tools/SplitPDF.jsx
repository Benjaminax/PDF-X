import React, { useState } from 'react';
import FileDropzone from '../common/FileDropzone';
import { pdfService } from '../../services/pdfService';
import { PDFDocument } from 'pdf-lib';
import { Scissors, Download, Loader2, Archive, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import JSZip from 'jszip';
import { downloadFile } from '../../utils/download';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function SplitPDF() {
  const [files, setFiles] = useState([]);
  const [range, setRange] = useState('');
  const [splitMode, setSplitMode] = useState('custom'); // 'custom' or 'fixed'
  const [fixedInterval, setFixedInterval] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSplit = async () => {
    if (files.length === 0 || (splitMode === 'custom' && !range)) return;
    
    setIsProcessing(true);
    try {
      let finalRange = range;
      if (splitMode === 'fixed') {
        const pdfBytes = await files[0].arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pageCount = pdfDoc.getPageCount();
        const ranges = [];
        for (let i = 1; i <= pageCount; i += fixedInterval) {
          const end = Math.min(i + fixedInterval - 1, pageCount);
          ranges.push(i === end ? `${i}` : `${i}-${end}`);
        }
        finalRange = ranges.join(', ');
      }

      const splitPdfs = await pdfService.splitPDF(files[0], finalRange);
      
      if (splitPdfs.length === 1) {
        downloadFile(splitPdfs[0], `split-${files[0].name}`);
      } else if (splitPdfs.length > 1) {
        const zip = new (JSZip.default || JSZip)();
        splitPdfs.forEach((pdfBytes, index) => {
          zip.file(`page-${index + 1}-${files[0].name}`, pdfBytes);
        });
        const content = await zip.generateAsync({ type: 'blob' });
        downloadFile(content, `split-${files[0].name}.zip`, 'application/zip');
      }
    } catch (error) {
      console.error('Split failed:', error);
      alert('Failed to split PDF. Please check the page range format.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full max-w-5xl">
      <div className="flex-1 w-full">
        <FileDropzone files={files} setFiles={setFiles} multiple={false} />
      </div>
      
      <div className="w-full lg:w-72 bg-white border border-slate-100 p-6 rounded-[1.5rem] space-y-6 animate-in fade-in slide-in-from-right-4 shadow-sm">
        <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
          <Settings className="text-accent" size={18} />
          SETTINGS
        </h3>

        <div className="space-y-4">
          <div className="flex p-1 bg-slate-50 rounded-xl">
            <button 
              onClick={() => setSplitMode('custom')}
              className={cn("flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all", splitMode === 'custom' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")}
            >
              CUSTOM
            </button>
            <button 
              onClick={() => setSplitMode('fixed')}
              className={cn("flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all", splitMode === 'fixed' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")}
            >
              FIXED
            </button>
          </div>

          {splitMode === 'custom' ? (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page Ranges</label>
              <input 
                type="text"
                placeholder="e.g. 1-3, 5"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border-2 border-slate-50 focus:border-accent outline-none font-mono text-xs"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Split Configuration</label>
              <div className="space-y-2">
                <button 
                  onClick={() => setFixedInterval(1)}
                  className={cn(
                    "w-full py-2 rounded-xl border-2 text-[10px] font-black transition-all",
                    fixedInterval === 1 ? "border-accent bg-accent/5 text-slate-900" : "border-slate-50 text-slate-400"
                  )}
                >
                  SPLIT EVERY PAGE
                </button>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    min="1"
                    placeholder="Pages"
                    value={fixedInterval}
                    onChange={(e) => setFixedInterval(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-slate-50 focus:border-accent outline-none font-bold text-slate-700 text-sm"
                  />
                  <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">Pages / File</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleSplit}
          disabled={files.length === 0 || isProcessing || (splitMode === 'custom' && !range)}
          className={cn(
            "w-full bg-accent hover:opacity-90 text-slate-900 py-4 rounded-2xl flex items-center justify-center gap-2 text-sm mt-4 font-black shadow-lg shadow-accent/10 transition-all",
            (files.length === 0 || isProcessing || (splitMode === 'custom' && !range)) && "opacity-50 cursor-not-allowed grayscale"
          )}
        >
          {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Scissors size={18} />}
          {isProcessing ? 'SPLITTING...' : 'SPLIT PDF'}
        </button>
      </div>
    </div>
  );
}
