import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FileDropzone({ files, setFiles, accept = { 'application/pdf': ['.pdf'] }, multiple = true, hideFileList = false }) {
  const onDrop = useCallback((acceptedFiles) => {
    if (multiple) {
      setFiles((prev) => [...prev, ...acceptedFiles]);
    } else {
      setFiles(acceptedFiles);
    }
  }, [multiple, setFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept,
    multiple 
  });

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-2xl">
      <div 
        {...getRootProps()} 
        className={`
          border-2 border-dashed rounded-3xl p-12 transition-all cursor-pointer
          flex flex-col items-center justify-center text-center
          ${isDragActive ? 'border-accent bg-accent/5 scale-[0.98]' : 'border-slate-200 hover:border-accent/50 hover:bg-slate-50'}
        `}
      >
        <input {...getInputProps()} />
        <div className="w-16 h-16 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mb-4">
          <Upload size={32} />
        </div>
        <h4 className="text-xl font-bold text-slate-800 mb-1">
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </h4>
        <p className="text-slate-500">
          or click to browse from your computer
        </p>
      </div>

      <AnimatePresence>
        {!hideFileList && files.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-6 space-y-3"
          >
            {files.map((file, index) => (
              <div 
                key={`${file.name}-${index}`}
                className="glass p-4 rounded-2xl flex items-center gap-4 group"
              >
                <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center">
                  <File size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button 
                  onClick={() => removeFile(index)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
