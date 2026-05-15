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
import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import { entranceAnimation, titleReveal, magneticEffect } from './utils/animationUtils';

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

const toolGroups = [
  {
    group: 'General',
    items: [
      { id: 'dashboard', name: 'Dashboard', icon: LayoutGrid, color: 'text-slate-600', bgColor: 'bg-slate-100', desc: 'Overview of all tools' },
    ]
  },
  {
    group: 'Edit & Optimize',
    items: [
      { id: 'merge', name: 'Merge PDF', icon: Merge, color: 'text-red-500', bgColor: 'bg-red-50', desc: 'Combine PDFs in the order you want with the easiest PDF merger available.' },
      { id: 'split', name: 'Split PDF', icon: Scissors, color: 'text-orange-500', bgColor: 'bg-orange-50', desc: 'Separate one page or a whole set for easy conversion into independent PDF files.' },
      { id: 'compress', name: 'Compress PDF', icon: Zap, color: 'text-green-500', bgColor: 'bg-green-50', desc: 'Reduce file size while optimizing for maximal PDF quality.' },
    ]
  },
  {
    group: 'Convert',
    items: [
      { id: 'img-to-pdf', name: 'Images to PDF', icon: FileImage, color: 'text-yellow-500', bgColor: 'bg-yellow-50', desc: 'Convert JPG, PNG, BMP and more to PDF. Easily adjust orientation and margins.' },
      { id: 'latex', name: 'LaTeX to PDF', icon: Sigma, color: 'text-blue-500', bgColor: 'bg-blue-50', desc: 'Render LaTeX math formulas or documents and export them as professional PDFs.' },
    ]
  },
  {
    group: 'AI & Advanced',
    items: [
      { id: 'ocr', name: 'OCR & Text', icon: FileSearch, color: 'text-rose-500', bgColor: 'bg-rose-50', desc: 'Convert scanned PDF and images into editable text documents.' },
      { id: 'ai-tools', name: 'AI Summarizer', icon: Sparkles, color: 'text-indigo-500', bgColor: 'bg-indigo-50', desc: 'Get the key points from any PDF instantly using advanced AI.' },
    ]
  },
  {
    group: 'Security',
    items: [
      { id: 'security', name: 'Protect PDF', icon: ShieldCheck, color: 'text-slate-700', bgColor: 'bg-slate-100', desc: 'Encrypt your PDF with a password to prevent unauthorized access.' },
    ]
  }
];

const allTools = toolGroups.flatMap(group => group.items);

function CustomCursor() {
  const cursorRef = useRef(null);

  useGSAP(() => {
    const moveCursor = (e) => {
      gsap.to(cursorRef.current, {
        x: e.clientX - 10,
        y: e.clientY - 10,
        duration: 0.15,
        ease: 'none',
      });
    };
    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  });

  return <div ref={cursorRef} className="custom-cursor hidden lg:block" />;
}

function BackgroundElements() {
  return (
    <>
      <div className="bg-blur-element bg-accent w-[500px] h-[500px] -top-20 -left-20" />
      <div className="bg-blur-element bg-indigo-500 w-[400px] h-[400px] bottom-0 right-0 opacity-10" />
    </>
  );
}

export default function App() {
  const [activeTool, setActiveTool] = useState(() => localStorage.getItem('activeTool') || 'dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  const mainHeaderRef = useRef(null);

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

  useGSAP(() => {
    entranceAnimation('.sidebar-item', 0.03);
    if (mainHeaderRef.current) titleReveal(mainHeaderRef.current);
  }, [activeTool]);

  return (
    <LayoutGroup>
      <div className="flex h-screen overflow-hidden text-slate-900 dark:text-zinc-100 transition-colors duration-300 bg-slate-50 dark:bg-black">
        <div className="grain-overlay" />
        <CustomCursor />
        <BackgroundElements />

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
            width: isSidebarOpen ? 280 : 88,
            x: 0 
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={cn(
            "glass z-40 flex flex-col fixed lg:relative h-full transition-transform lg:translate-x-0 border-r border-white/20 dark:border-white/5 shadow-2xl",
            !isSidebarOpen && "lg:translate-x-0 -translate-x-full lg:w-[88px]"
          )}
        >
          {/* Sidebar Header */}
          <div className={cn(
            "p-6 flex items-center transition-all duration-300",
            isSidebarOpen ? "justify-between gap-3" : "flex-col justify-center gap-6"
          )}>
            <div className={cn("flex items-center gap-3 overflow-hidden", !isSidebarOpen && "flex-col")}>
              <motion.div layout className="w-10 h-10 bg-accent rounded-2xl flex items-center justify-center text-slate-900 shadow-lg shadow-accent/30 shrink-0">
                <Type size={22} strokeWidth={3} />
              </motion.div>
              {isSidebarOpen && (
                <motion.div
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col"
                >
                  <h1 className="font-black text-xl tracking-tighter text-slate-900 dark:text-white leading-tight">
                    PDF<span className="text-accent">GRAVITY</span>
                  </h1>
                </motion.div>
              )}
            </div>
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="hidden lg:flex p-2 text-slate-400 hover:text-accent hover:bg-accent/5 rounded-xl transition-all"
            >
              {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-2 space-y-6 overflow-y-auto scrollbar-hide">
            {toolGroups.map((group, idx) => (
              <div key={idx} className="space-y-2">
                {isSidebarOpen && (
                  <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400/80 dark:text-zinc-400 mb-3">
                    {group.group}
                  </h3>
                )}
                {!isSidebarOpen && <div className="h-px bg-white/5 mx-4 mb-4" />}
                <div className="space-y-1">
                  {group.items.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => setActiveTool(tool.id)}
                      className={cn(
                        "sidebar-item",
                        activeTool === tool.id 
                          ? "sidebar-item-active" 
                          : "sidebar-item-inactive",
                        !isSidebarOpen ? "justify-center px-0" : "gap-4"
                      )}
                    >
                      {activeTool === tool.id && (
                        <motion.div 
                          layoutId="active-pill"
                          className="absolute left-0 w-1.5 h-8 bg-accent rounded-r-full shadow-[0_0_15px_rgba(156,240,39,0.5)]"
                        />
                      )}
                      <tool.icon 
                        size={22} 
                        className={cn(
                          "transition-transform duration-300",
                          activeTool === tool.id ? "text-accent scale-110" : tool.color
                        )} 
                      />
                      {isSidebarOpen && (
                        <motion.span layout className="flex-1 text-left text-[13px] font-bold tracking-tight">{tool.name}</motion.span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-white/20 dark:border-white/5 space-y-2">

            <div className="flex flex-col gap-1">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={cn(
                  "sidebar-item sidebar-item-inactive",
                  !isSidebarOpen && "justify-center px-0"
                )}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                {isSidebarOpen && <span className="text-[13px] font-bold">Theme</span>}
              </button>
              <button 
                className={cn(
                  "sidebar-item sidebar-item-inactive",
                  !isSidebarOpen && "justify-center px-0"
                )}
              >
                <Settings size={20} />
                {isSidebarOpen && <span className="text-[13px] font-bold">Settings</span>}
              </button>
            </div>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 relative overflow-y-auto p-4 lg:p-6 mt-16 lg:mt-0 scrollbar-hide">
          <header ref={mainHeaderRef} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
            <div className="flex items-center gap-4">
              {activeTool !== 'dashboard' && (
                <button 
                  onClick={() => setActiveTool('dashboard')}
                  className={cn(
                    "w-12 h-12 glass border border-white/20 rounded-xl flex items-center justify-center shadow-sm transition-all group",
                    allTools.find(t => t.id === activeTool)?.color
                  )}
                >
                  {React.createElement(allTools.find(t => t.id === activeTool)?.icon, { size: 24, className: "group-hover:scale-110 transition-transform" })}
                </button>
              )}
              <div>
                <h2 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-zinc-100 tracking-tighter">
                  {allTools.find(t => t.id === activeTool)?.name.toUpperCase()}
                </h2>
                <p className="text-xs text-slate-400 dark:text-zinc-400 font-bold uppercase tracking-widest">
                  {allTools.find(t => t.id === activeTool)?.desc.substring(0, 80)}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              <div className="hidden sm:flex glass px-4 py-2 rounded-full items-center gap-2 text-[10px] font-black text-slate-400 dark:text-zinc-400">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                SYSTEM SECURE
              </div>
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
  const containerRef = useRef(null);

  useGSAP(() => {
    entranceAnimation('.tool-card', 0.05);
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {allTools.filter(t => t.id !== 'dashboard').map((tool) => (
        <ToolCard key={tool.id} tool={tool} onSelectTool={onSelectTool} />
      ))}
    </div>
  );
}

function ToolCard({ tool, onSelectTool }) {
  const cardRef = useRef(null);

  useEffect(() => {
    if (cardRef.current && window.innerWidth > 1024) {
      return magneticEffect(cardRef.current, 0.15);
    }
  }, []);

  return (
    <motion.div
      ref={cardRef}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="tool-card glass-card p-8 cursor-pointer group flex flex-col items-center text-center relative overflow-hidden"
      onClick={() => onSelectTool(tool.id)}
    >
      <div className={cn(
        "w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-6 transition-all duration-500 group-hover:rotate-6 shadow-xl", 
        tool.bgColor,
        "dark:bg-zinc-900/80"
      )}>
        <tool.icon size={28} className={tool.color} />
      </div>
      
      <h4 className="font-black text-lg text-slate-800 dark:text-zinc-100 mb-3 tracking-tight">
        {tool.name}
      </h4>
      
      <p className="text-[11px] text-slate-400 dark:text-zinc-400 leading-relaxed font-medium">
        {tool.desc}
      </p>

      <div className="mt-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0 flex items-center gap-2 text-[10px] font-black text-accent uppercase tracking-widest">
        Access Tool <ChevronRight size={14} />
      </div>

      <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
  );
}
