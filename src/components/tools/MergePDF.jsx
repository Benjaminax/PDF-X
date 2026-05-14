import React, { useState } from 'react';
import FileDropzone from '../common/FileDropzone';
import { pdfService } from '../../services/pdfService';
import { Merge, Download, Loader2, CheckCircle2, GripVertical, File, X, Settings } from 'lucide-react';
import { motion, Reorder } from 'framer-motion';
import { downloadFile } from '../../utils/download';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function MergePDF() {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleMerge = async () => {
    if (files.length < 2) return;
    
    setIsProcessing(true);
    try {
      const mergedPdfBytes = await pdfService.mergePDFs(files);
      downloadFile(mergedPdfBytes, `merged-${files[0].name}`);
      setIsDone(true);
      setTimeout(() => setIsDone(false), 3000);
    } catch (error) {
      console.error('Merge failed:', error);
      alert('Failed to merge PDFs. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full max-w-6xl">
      <div className="flex-1 w-full space-y-6">
        <FileDropzone files={files} setFiles={setFiles} hideFileList={true} multiple={true} />
        
        {files.length > 0 && (
          <div className="w-full">
            <h4 className="text-xs font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">Drag to reorder pages</h4>
            <Reorder.Group 
              axis="y" 
              values={files} 
              onReorder={setFiles}
              className="space-y-2"
            >
              {files.map((file, index) => (
                <Reorder.Item 
                  key={`${file.name}-${index}`} 
                  value={file}
                  className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-4 cursor-grab active:cursor-grabbing group shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="text-slate-300 group-hover:text-accent transition-colors">
                    <GripVertical size={20} />
                  </div>
                  <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center">
                    <File size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button 
                    onClick={() => setFiles(files.filter((_, i) => i !== index))}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <X size={18} />
                  </button>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}
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
            {files.length < 2 
              ? 'Add at least 2 PDF files to combine them into one single document.'
              : `Combine ${files.length} PDFs into one.`}
          </p>
        </div>

        <button
          onClick={handleMerge}
          disabled={files.length < 2 || isProcessing}
          className={cn(
            "w-full bg-accent hover:opacity-90 text-slate-900 py-4 rounded-2xl flex items-center justify-center gap-2 text-sm mt-4 font-black shadow-lg shadow-accent/10 transition-all",
            (files.length < 2 || isProcessing) && "opacity-50 cursor-not-allowed grayscale"
          )}
        >
          {isProcessing ? <Loader2 className="animate-spin" size={18} /> : isDone ? <CheckCircle2 size={18} /> : <Merge size={18} />}
          {isProcessing ? 'MERGING...' : isDone ? 'DONE!' : 'MERGE PDF'}
        </button>
      </div>
    </div>
  );
}
