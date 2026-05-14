import React, { useState } from 'react';
import FileDropzone from '../common/FileDropzone';
import { PDFDocument } from 'pdf-lib';
import { FileImage, Download, Loader2, CheckCircle2, Archive, Files, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { downloadFile } from '../../utils/download';
import JSZip from 'jszip';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function ImageToPDF() {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  
  // Options State (iLovePDF Style)
  const [orientation, setOrientation] = useState('portrait');
  const [pageSize, setPageSize] = useState('A4');
  const [margin, setMargin] = useState('none');
  const [mergeAll, setMergeAll] = useState(true);

  const PAGE_SIZES = {
    'A4': { width: 595, height: 842 },
    'Letter': { width: 612, height: 792 },
    'Fit': null
  };

  const MARGINS = {
    'none': 0,
    'small': 20,
    'big': 50
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    try {
      const processImage = async (pdfDoc, file) => {
        const imageBytes = await file.arrayBuffer();
        let image;
        if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
          image = await pdfDoc.embedJpg(imageBytes);
        } else if (file.type === 'image/png') {
          image = await pdfDoc.embedPng(imageBytes);
        } else return null;

        const m = MARGINS[margin];
        let pWidth, pHeight;

        if (pageSize === 'Fit') {
          pWidth = image.width + (m * 2);
          pHeight = image.height + (m * 2);
        } else {
          const dims = PAGE_SIZES[pageSize];
          pWidth = orientation === 'portrait' ? dims.width : dims.height;
          pHeight = orientation === 'portrait' ? dims.height : dims.width;
        }

        const page = pdfDoc.addPage([pWidth, pHeight]);
        
        // Calculate scale to fit image in page minus margins
        const availableWidth = pWidth - (m * 2);
        const availableHeight = pHeight - (m * 2);
        const scale = Math.min(availableWidth / image.width, availableHeight / image.height);
        
        const scaledWidth = image.width * scale;
        const scaledHeight = image.height * scale;

        page.drawImage(image, {
          x: (pWidth - scaledWidth) / 2,
          y: (pHeight - scaledHeight) / 2,
          width: scaledWidth,
          height: scaledHeight,
        });
        return true;
      };

      if (mergeAll) {
        const pdfDoc = await PDFDocument.create();
        for (const file of files) {
          await processImage(pdfDoc, file);
        }
        const pdfBytes = await pdfDoc.save();
        downloadFile(pdfBytes, `${files[0].name.split('.')[0]}-merged.pdf`);
      } else {
        const zip = new (JSZip.default || JSZip)();
        for (const file of files) {
          const pdfDoc = await PDFDocument.create();
          await processImage(pdfDoc, file);
          const pdfBytes = await pdfDoc.save();
          zip.file(`${file.name.split('.')[0]}.pdf`, pdfBytes);
        }
        const content = await zip.generateAsync({ type: 'blob' });
        downloadFile(content, 'Converted-Images-Batch.zip', 'application/zip');
      }
      setIsDone(true);
      setTimeout(() => setIsDone(false), 3000);
    } catch (error) {
      console.error('Conversion failed:', error);
      alert('Failed to convert images to PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full max-w-6xl">
      <div className="flex-1 w-full">
        <FileDropzone 
          files={files} 
          setFiles={setFiles} 
          multiple={true}
          accept={{ 'image/*': ['.jpg', '.jpeg', '.png'] }} 
        />
      </div>

      <div className="w-full lg:w-80 glass p-8 rounded-[2rem] space-y-8 animate-in fade-in slide-in-from-right-4">
        <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
          <Settings className="text-accent" size={20} />
          Options
        </h3>

        {/* Orientation */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Orientation</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'portrait', label: 'Portrait', icon: '▯' },
              { id: 'landscape', label: 'Landscape', icon: '▭' }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setOrientation(opt.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                  orientation === opt.id ? "border-accent bg-accent/5 text-accent" : "border-slate-100 text-slate-400 hover:bg-slate-50"
                )}
              >
                <span className="text-2xl leading-none">{opt.icon}</span>
                <span className="text-xs font-bold">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Page Size */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Page Size</label>
          <select 
            value={pageSize}
            onChange={(e) => setPageSize(e.target.value)}
            className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-accent outline-none font-bold text-slate-700 appearance-none bg-slate-50/50"
          >
            <option value="A4">A4 (297x210 mm)</option>
            <option value="Letter">Letter (US)</option>
            <option value="Fit">Fit (Same as image)</option>
          </select>
        </div>

        {/* Margin */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Margin</label>
          <div className="grid grid-cols-3 gap-2">
            {['none', 'small', 'big'].map(opt => (
              <button
                key={opt}
                onClick={() => setMargin(opt)}
                className={cn(
                  "py-3 rounded-xl border-2 transition-all text-xs font-bold capitalize",
                  margin === opt ? "border-accent bg-accent/5 text-accent" : "border-slate-100 text-slate-400 hover:bg-slate-50"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Batch Detection / Options */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Conversion Mode</label>
            {files.length > 2 && (
              <span className="bg-yellow-100 text-yellow-700 text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                BATCH DETECTED
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => setMergeAll(true)}
              className={cn(
                "w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-3",
                mergeAll ? "border-accent bg-accent/5" : "border-slate-50 hover:bg-slate-50"
              )}
            >
              <div className={cn("p-2 rounded-lg", mergeAll ? "bg-accent text-slate-900" : "bg-slate-100 text-slate-400")}>
                <Files size={18} />
              </div>
              <div>
                <p className={cn("font-bold text-sm", mergeAll ? "text-slate-900" : "text-slate-700")}>Merge into One PDF</p>
                <p className="text-[10px] text-slate-400">All images in a single document</p>
              </div>
            </button>

            <button
              onClick={() => setMergeAll(false)}
              className={cn(
                "w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-3",
                !mergeAll ? "border-accent bg-accent/5" : "border-slate-50 hover:bg-slate-50"
              )}
            >
              <div className={cn("p-2 rounded-lg", !mergeAll ? "bg-accent text-slate-900" : "bg-slate-100 text-slate-400")}>
                <Archive size={18} />
              </div>
              <div>
                <p className={cn("font-bold text-sm", !mergeAll ? "text-slate-900" : "text-slate-700")}>Individual PDFs (ZIP)</p>
                <p className="text-[10px] text-slate-400">Each image becomes its own PDF</p>
              </div>
            </button>
          </div>
        </div>

        <button
          onClick={handleConvert}
          disabled={files.length === 0 || isProcessing}
          className={cn(
            "w-full bg-accent hover:opacity-90 text-slate-900 py-5 rounded-[1.5rem] flex items-center justify-center gap-3 text-lg mt-4 font-black shadow-xl shadow-accent/20 transition-all",
            (files.length === 0 || isProcessing) && "opacity-50 cursor-not-allowed grayscale"
          )}
        >
          {isProcessing ? <Loader2 className="animate-spin" size={24} /> : isDone ? <CheckCircle2 size={24} /> : <Download size={24} />}
          {isProcessing ? 'Converting...' : isDone ? 'Done!' : 'Convert to PDF'}
        </button>
      </div>
    </div>
  );
}
