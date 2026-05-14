import React, { useState } from 'react';
import FileDropzone from '../common/FileDropzone';
import { PDFDocument } from 'pdf-lib';
import { ShieldCheck, Lock, Unlock, Download, Loader2, CheckCircle2, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadFile } from '../../utils/download';
import JSZip from 'jszip';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function SecurityTool() {
  const [files, setFiles] = useState([]);
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('protect'); // 'protect' or 'unlock'
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSecurity = async () => {
    if (files.length === 0 || !password) return;
    
    setIsProcessing(true);
    try {
      if (files.length === 1) {
        const fileBytes = await files[0].arrayBuffer();
        let pdfDoc;
        
        if (mode === 'unlock') {
          pdfDoc = await PDFDocument.load(fileBytes, { password });
        } else {
          pdfDoc = await PDFDocument.load(fileBytes);
        }

        const pdfBytes = await pdfDoc.save();
        downloadFile(pdfBytes, `${mode === 'protect' ? 'protected' : 'unlocked'}-${files[0].name}`);
      } else {
        const zip = new (JSZip.default || JSZip)();
        for (const file of files) {
          const fileBytes = await file.arrayBuffer();
          let pdfDoc;
          if (mode === 'unlock') {
            pdfDoc = await PDFDocument.load(fileBytes, { password });
          } else {
            pdfDoc = await PDFDocument.load(fileBytes);
          }
          const pdfBytes = await pdfDoc.save();
          zip.file(`${mode === 'protect' ? 'protected' : 'unlocked'}-${file.name}`, pdfBytes);
        }
        const content = await zip.generateAsync({ type: 'blob' });
        downloadFile(content, `${mode === 'protect' ? 'Protected' : 'Unlocked'}-Batch.zip`, 'application/zip');
      }
      
      setIsDone(true);
      setTimeout(() => setIsDone(false), 3000);
    } catch (error) {
      console.error('Security operation failed:', error);
      alert(error.message.includes('password') ? 'Incorrect password provided.' : 'Failed to process security operation.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full max-w-6xl">
      <div className="flex-1 w-full">
        <FileDropzone files={files} setFiles={setFiles} multiple={true} />
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

        <div className="flex p-1 bg-slate-50 rounded-xl">
          <button 
            onClick={() => setMode('protect')}
            className={cn("flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all", mode === 'protect' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")}
          >
            PROTECT
          </button>
          <button 
            onClick={() => setMode('unlock')}
            className={cn("flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all", mode === 'unlock' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")}
          >
            UNLOCK
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {mode === 'protect' ? 'Set Password' : 'Enter Password'}
          </label>
          <div className="relative">
            <input 
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-50 focus:border-accent outline-none font-mono text-sm transition-all"
            />
            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          </div>
        </div>

        <button
          onClick={handleSecurity}
          disabled={!password || files.length === 0 || isProcessing}
          className={cn(
            "w-full bg-accent hover:opacity-90 text-slate-900 py-4 rounded-2xl flex items-center justify-center gap-2 text-sm mt-4 font-black shadow-lg shadow-accent/10 transition-all",
            (!password || files.length === 0 || isProcessing) && "opacity-50 cursor-not-allowed grayscale"
          )}
        >
          {isProcessing ? <Loader2 className="animate-spin" size={18} /> : mode === 'protect' ? <Lock size={18} /> : <Unlock size={18} />}
          {isProcessing ? 'PROCESSING...' : mode === 'protect' ? 'PROTECT PDF' : 'UNLOCK PDF'}
        </button>
      </div>
    </div>
  );
}
