import React, { useState } from 'react';
import { 
  LayoutGrid, 
  Merge, 
  Scissors, 
  Zap, 
  FileImage, 
  ShieldCheck, 
  FileSearch, 
  Type,
  Settings,
  HelpCircle,
  ChevronRight,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Moon,
  Sun,
  Sigma
} from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import MergePDF from './components/tools/MergePDF';
import SplitPDF from './components/tools/SplitPDF';
import ImageToPDF from './components/tools/ImageToPDF';
import CompressPDF from './components/tools/CompressPDF';
import OCRTool from './components/tools/OCRTool';
import AISummarizer from './components/tools/AISummarizer';
import SecurityTool from './components/tools/SecurityTool';
import LaTeXToPDF from './components/tools/LaTeXToPDF';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const tools = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutGrid, color: 'text-slate-600', bgColor: 'bg-slate-100', desc: 'Overview of all tools' },
  { id: 'merge', name: 'Merge PDF', icon: Merge, color: 'text-red-500', bgColor: 'bg-red-50', desc: 'Combine PDFs in the order you want with the easiest PDF merger available.' },
  { id: 'split', name: 'Split PDF', icon: Scissors, color: 'text-orange-500', bgColor: 'bg-orange-50', desc: 'Separate one page or a whole set for easy conversion into independent PDF files.' },
  { id: 'compress', name: 'Compress PDF', icon: Zap, color: 'text-green-500', bgColor: 'bg-green-50', desc: 'Reduce file size while optimizing for maximal PDF quality.' },
  { id: 'img-to-pdf', name: 'Images to PDF', icon: FileImage, color: 'text-yellow-500', bgColor: 'bg-yellow-50', desc: 'Convert JPG, PNG, BMP and more to PDF. Easily adjust orientation and margins.' },
  { id: 'security', name: 'Protect PDF', icon: ShieldCheck, color: 'text-slate-700', bgColor: 'bg-slate-100', desc: 'Encrypt your PDF with a password to prevent unauthorized access.' },
  { id: 'ocr', name: 'OCR & Text', icon: FileSearch, color: 'text-rose-500', bgColor: 'bg-rose-50', desc: 'Convert scanned PDF and images into editable text documents.' },
  { id: 'ai-tools', name: 'AI Summarizer', icon: Sparkles, color: 'text-indigo-500', bgColor: 'bg-indigo-50', desc: 'Get the key points from any PDF instantly using advanced AI.' },
  { id: 'latex', name: 'LaTeX to PDF', icon: Sigma, color: 'text-blue-500', bgColor: 'bg-blue-50', desc: 'Render LaTeX math formulas or documents and export them as professional PDFs.' },
];

export default function App() {
  const [activeTool, setActiveTool] = useState(() => localStorage.getItem('activeTool') || 'dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    localStorage.setItem('activeTool', activeTool);
  }, [activeTool]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  return (
    <LayoutGroup>
      <div className="flex h-screen overflow-hidden text-slate-900 dark:text-slate-100 transition-colors duration-300">
        {/* Mobile Top Bar */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 glass z-30 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-slate-900 shadow-md shadow-accent/20">
              <Type size={18} strokeWidth={3} />
            </div>
            <span className="font-black text-lg tracking-tighter">PDFGRAVITY</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 text-slate-500"
          >
            <LayoutGrid size={24} />
          </button>
        </div>

        <motion.aside 
          layout
          initial={false}
          animate={{ 
            width: isSidebarOpen ? 240 : 72,
            x: 0 
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={cn(
            "glass z-40 flex flex-col fixed lg:relative h-full transition-transform lg:translate-x-0 border-r border-white/20 dark:border-white/5",
            !isSidebarOpen && "lg:translate-x-0 -translate-x-full lg:w-[72px]"
          )}
        >
          <div className="p-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <motion.div layout className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center text-slate-900 shadow-lg shadow-accent/30 shrink-0">
                <Type size={20} strokeWidth={3} />
              </motion.div>
              {isSidebarOpen && (
                <motion.h1 
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-black text-lg tracking-tighter text-slate-900 dark:text-white whitespace-nowrap"
                >
                  PDF<span className="text-accent">GRAVITY</span>
                </motion.h1>
              )}
            </div>
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="hidden lg:block p-1.5 text-slate-400 hover:text-accent hover:bg-accent/5 rounded-lg transition-all"
            >
              {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </button>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto scrollbar-hide">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={cn(
                  "w-full flex items-center gap-4 px-3 py-2.5 rounded-xl transition-all group relative overflow-hidden",
                  activeTool === tool.id 
                    ? `bg-accent/10 dark:bg-accent/20 text-slate-900 dark:text-white font-black` 
                    : "text-slate-500 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-800/40"
                )}
              >
                {activeTool === tool.id && (
                  <motion.div 
                    layoutId="active-pill"
                    className="absolute left-0 w-1 h-6 bg-accent rounded-r-full"
                  />
                )}
                <tool.icon size={20} className={cn(activeTool === tool.id ? "text-accent" : tool.color)} />
                {isSidebarOpen && (
                  <motion.span layout className="flex-1 text-left text-sm whitespace-nowrap">{tool.name}</motion.span>
                )}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-white/20 dark:border-white/5 space-y-1">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-full flex items-center gap-4 px-3 py-2.5 text-slate-500 dark:text-slate-400 hover:bg-white/30 dark:hover:bg-slate-800/30 rounded-xl transition-all"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              {isSidebarOpen && <span className="text-sm font-medium">{isDarkMode ? 'Light' : 'Dark'}</span>}
            </button>
            <button 
              className="w-full flex items-center gap-4 px-3 py-2.5 text-slate-500 dark:text-slate-400 hover:bg-white/30 dark:hover:bg-slate-800/30 rounded-xl transition-all"
            >
              <Settings size={20} />
              {isSidebarOpen && <span className="text-sm font-medium">Settings</span>}
            </button>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 relative overflow-y-auto p-4 lg:p-6 mt-16 lg:mt-0 scrollbar-hide">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
            <div className="flex items-center gap-4">
              {activeTool !== 'dashboard' && (
                <button 
                  onClick={() => setActiveTool('dashboard')}
                  className={cn(
                    "w-12 h-12 glass border border-white/20 rounded-xl flex items-center justify-center shadow-sm transition-all group",
                    tools.find(t => t.id === activeTool)?.color
                  )}
                >
                  {React.createElement(tools.find(t => t.id === activeTool)?.icon, { size: 24, className: "group-hover:scale-110 transition-transform" })}
                </button>
              )}
              <div>
                <h2 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                  {tools.find(t => t.id === activeTool)?.name.toUpperCase()}
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                  {tools.find(t => t.id === activeTool)?.desc.substring(0, 80)}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              <div className="hidden sm:flex glass px-4 py-2 rounded-full items-center gap-2 text-[10px] font-black text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                SYSTEM SECURE
              </div>
              <button 
                className="flex-1 md:flex-none btn-primary text-[11px]"
              >
                UPGRADE PRO
              </button>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTool}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4, type: 'spring', damping: 25 }}
              className="w-full pb-20"
            >
              {activeTool === 'dashboard' && <Dashboard onSelectTool={setActiveTool} />}
              {activeTool === 'merge' && <MergePDF />}
              {activeTool === 'split' && <SplitPDF />}
              {activeTool === 'img-to-pdf' && <ImageToPDF />}
              {activeTool === 'compress' && <CompressPDF />}
              {activeTool === 'ocr' && <OCRTool />}
              {activeTool === 'ai-tools' && <AISummarizer />}
              {activeTool === 'security' && <SecurityTool />}
              {activeTool === 'latex' && <LaTeXToPDF />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </LayoutGroup>
  );
}

function Dashboard({ onSelectTool }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {tools.filter(t => t.id !== 'dashboard').map((tool) => (
        <motion.div
          key={tool.id}
          whileHover={{ y: -8, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="glass-card p-8 cursor-pointer group flex flex-col items-center text-center relative overflow-hidden transition-all duration-500"
          onClick={() => onSelectTool(tool.id)}
        >
          <div className={cn(
            "w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-6 transition-all duration-500 group-hover:rotate-6 shadow-xl", 
            tool.bgColor,
            "dark:bg-slate-800/80"
          )}>
            <tool.icon size={28} className={tool.color} />
          </div>
          
          <h4 className="font-black text-lg text-slate-800 dark:text-slate-100 mb-3 tracking-tight">
            {tool.name}
          </h4>
          
          <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
            {tool.desc}
          </p>

          <div className="mt-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0 flex items-center gap-2 text-[10px] font-black text-accent uppercase tracking-widest">
            Access Tool <ChevronRight size={14} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
