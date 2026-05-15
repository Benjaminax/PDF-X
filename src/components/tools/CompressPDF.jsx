import React, { useState } from 'react';
import FileDropzone from '../common/FileDropzone';
import { pdfService } from '../../services/pdfService';
import { Zap, Download, Loader2, CheckCircle2, Settings } from 'lucide-react';
import { downloadFile } from '../../utils/download';
import JSZip from 'jszip';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function CompressPDF() {
  const [files, setFiles] = useState([]);
  const [level, setLevel] = useState('recommended'); // 'extreme', 'recommended', 'less'
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleCompress = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    try {
        if (files.length === 1) {
        const compressedBytes = await pdfService.compressPDF(files[0], level);
        downloadFile(compressedBytes, `compressed-${files[0].name}`);
      } else {
        const zip = new (JSZip.default || JSZip)();
        for (const file of files) {
          const compressedBytes = await pdfService.compressPDF(file, level);
          zip.file(`compressed-${file.name}`, compressedBytes);
        }
        const content = await zip.generateAsync({ type: 'blob' });
        downloadFile(content, 'Compressed-Batch.zip', 'application/zip');
      }
      setIsDone(true);
      setTimeout(() => setIsDone(false), 3000);
    } catch (error) {
      console.error('Compression failed:', error);
      alert('Failed to compress PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full max-w-5xl">
      <div className="flex-1 w-full">
        <FileDropzone files={files} setFiles={setFiles} multiple={true} />
      </div>
      
      <div className="w-full lg:w-72 glass-card p-6 space-y-6 animate-in fade-in slide-in-from-right-4">
        <h3 className="font-black text-lg text-slate-800 dark:text-zinc-100 flex items-center gap-2">
          <Settings className="text-accent" size={18} />
          SETTINGS
        </h3>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Compression Level</label>
          <div className="space-y-2">
            {[
              { id: 'extreme', title: 'Extreme', desc: 'Lower quality' },
              { id: 'recommended', title: 'Recommended', desc: 'Good balance' },
              { id: 'less', title: 'Minimal', desc: 'High quality' }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setLevel(opt.id)}
                className={cn(
                  "w-full p-3 rounded-xl border-2 transition-all text-left",
                  level === opt.id ? "border-accent bg-accent/5" : "border-slate-50 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800"
                )}
              >
                <p className={cn("font-black text-xs", level === opt.id ? "text-slate-900 dark:text-zinc-100" : "text-slate-700 dark:text-zinc-300")}>{opt.title}</p>
                <p className="text-[10px] text-slate-400 font-medium">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleCompress}
          disabled={files.length === 0 || isProcessing}
          className={cn(
            "w-full bg-accent hover:opacity-90 text-slate-900 py-4 rounded-2xl flex items-center justify-center gap-2 text-sm mt-4 font-black shadow-lg shadow-accent/10 transition-all",
            (files.length === 0 || isProcessing) && "opacity-50 cursor-not-allowed grayscale"
          )}
        >
          {isProcessing ? <Loader2 className="animate-spin" size={18} /> : isDone ? <CheckCircle2 size={18} /> : <Zap size={18} />}
          {isProcessing ? 'OPTIMIZING...' : isDone ? 'DONE!' : 'COMPRESS PDF'}
        </button>
      </div>
    </div>
  );
}
