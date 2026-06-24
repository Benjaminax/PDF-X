import { useState } from 'react';
import FileDropzone from '../common/FileDropzone';
import { pdfService } from '../../services/pdfService';
import { ShieldCheck, Lock, Unlock, Loader2, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { downloadFile } from '../../utils/download';
import JSZip from 'jszip';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function SecurityTool() {
  const [files, setFiles] = useState([]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mode, setMode] = useState('protect'); // 'protect' or 'unlock'
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Calculate password strength (0-4)
  const getPasswordStrength = (pwd) => {
    if (!pwd) return 0;
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd) && /[!@#$%^&*]/.test(pwd)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const strengthColors = ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-green-500', 'text-green-600'];

  // Reset feedback when files change or mode changes
  // useEffect removed to avoid cascading renders

  const validateInputs = () => {
    if (files.length === 0) {
      setFeedback('Please add PDF files first.');
      return false;
    }
    if (!password) {
      setFeedback('Please enter a password.');
      return false;
    }
    if (mode === 'protect' && password.length < 4) {
      setFeedback('Password must be at least 4 characters.');
      return false;
    }
    if (mode === 'protect' && password !== confirmPassword) {
      setFeedback('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleSecurity = async () => {
    setFeedback('');
    if (!validateInputs()) return;
    
    setIsProcessing(true);
    const startTime = Date.now();
    let successCount = 0;
    let failedCount = 0;
    const failedFiles = [];

    try {
      let resultPdfs;
      if (mode === 'unlock') {
        resultPdfs = await pdfService.unlockPDF(files, password);
      } else {
        resultPdfs = await pdfService.protectPDF(files, password);
      }

      if (resultPdfs.length === 1) {
        downloadFile(resultPdfs[0], `${mode === 'protect' ? 'protected' : 'unlocked'}-${files[0].name}`);
        successCount = 1;
      } else if (resultPdfs.length > 1) {
        const zip = new (JSZip.default || JSZip)();
        resultPdfs.forEach((pdfBytes, index) => {
          zip.file(`${mode === 'protect' ? 'protected' : 'unlocked'}-${files[index].name}`, pdfBytes);
        });
        const content = await zip.generateAsync({ type: 'blob' });
        downloadFile(content, `${mode === 'protect' ? 'protected' : 'unlocked'}-batch.zip`, 'application/zip');
        successCount = resultPdfs.length;
      }
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      setFeedback(`✓ ${mode === 'protect' ? 'Protected' : 'Unlocked'} ${successCount} PDF(s) in ${duration}s`);
      
      setTimeout(() => {
        
        setFeedback('');
      }, 4000);
    } catch (error) {
      console.error('Security operation failed:', error);
      const errorMsg = error.message || 'Failed to process security operation.';
      setFeedback(`✗ ${errorMsg}`);
      alert(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full max-w-6xl">
      <div className="flex-1 w-full">
        <FileDropzone files={files} setFiles={setFiles} multiple={true} />
      </div>
      
      <div className="w-full lg:w-72 glass-card p-6 space-y-6 animate-in fade-in slide-in-from-right-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-lg text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            <Settings className="text-accent" size={18} />
            SETTINGS
          </h3>
          {files.length > 2 && (
            <span className="bg-yellow-100 text-yellow-700 text-[8px] px-2 py-0.5 rounded-full font-black">
              BATCH
            </span>
          )}
        </div>

        <div className="flex p-1 bg-slate-50 dark:bg-zinc-800/50 rounded-xl">
          <button 
            onClick={() => {
              setMode('protect');
              setPassword('');
              setConfirmPassword('');
              setFeedback('');
            }}
            className={cn("flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all", mode === 'protect' ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-sm" : "text-slate-400")}
          >
            PROTECT
          </button>
          <button 
            onClick={() => {
              setMode('unlock');
              setPassword('');
              setConfirmPassword('');
              setFeedback('');
            }}
            className={cn("flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all", mode === 'unlock' ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-sm" : "text-slate-400")}
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
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-50 dark:border-zinc-800 focus:border-accent outline-none font-mono text-sm transition-all bg-white dark:bg-zinc-900/50 text-slate-900 dark:text-zinc-100"
            />
            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-zinc-600" size={16} />
          </div>
          
          {/* Password Strength Indicator - Only in PROTECT mode */}
          {mode === 'protect' && password && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Strength</span>
                <span className={cn("text-[9px] font-bold uppercase", strengthColors[passwordStrength])}>
                  {strengthLabels[passwordStrength] || 'Weak'}
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-250",
                    passwordStrength === 0 && "w-[25%] bg-red-500",
                    passwordStrength === 1 && "w-[40%] bg-orange-500",
                    passwordStrength === 2 && "w-[60%] bg-yellow-500",
                    passwordStrength === 3 && "w-[80%] bg-green-500",
                    passwordStrength === 4 && "w-full bg-green-600"
                  )}
                />
              </div>
            </div>
          )}
        </div>

        {/* Password Confirmation - Only in PROTECT mode */}
        {mode === 'protect' && (
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Confirm Password
            </label>
            <div className="relative">
              <input 
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-50 dark:border-zinc-800 focus:border-accent outline-none font-mono text-sm transition-all bg-white dark:bg-zinc-900/50 text-slate-900 dark:text-zinc-100"
              />
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-zinc-600" size={16} />
            </div>
            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider">Passwords do not match</p>
            )}
            {password && confirmPassword && password === confirmPassword && (
              <p className="text-[9px] text-green-500 font-bold uppercase tracking-wider">✓ Passwords match</p>
            )}
          </div>
        )}

        {/* Feedback Message */}
        {feedback && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "p-3 rounded-xl text-[10px] font-bold uppercase tracking-wider text-center",
              feedback.startsWith('✓') 
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
            )}
          >
            {feedback}
          </motion.div>
        )}

        <button
          onClick={handleSecurity}
          disabled={
            files.length === 0 || 
            !password || 
            (mode === 'protect' && password !== confirmPassword) ||
            isProcessing
          }
          className={cn(
            "w-full bg-accent hover:opacity-90 text-slate-900 py-4 rounded-2xl flex items-center justify-center gap-2 text-sm mt-4 font-black shadow-lg shadow-accent/10 transition-all",
            (files.length === 0 || !password || (mode === 'protect' && password !== confirmPassword) || isProcessing) && "opacity-50 cursor-not-allowed grayscale"
          )}
        >
          {isProcessing ? <Loader2 className="animate-spin" size={18} /> : mode === 'protect' ? <Lock size={18} /> : <Unlock size={18} />}
          {isProcessing ? 'PROCESSING...' : mode === 'protect' ? `PROTECT${files.length > 1 ? ` (${files.length})` : ''}` : `UNLOCK${files.length > 1 ? ` (${files.length})` : ''}`}
        </button>
      </div>
    </div>
  );
}
