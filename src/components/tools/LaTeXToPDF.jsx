import React, { useState, useEffect, useRef, useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import html2pdf from 'html2pdf.js';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Sigma, Download, Loader2, CheckCircle2, Settings, Type, FileText, AlignLeft, List, Table } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const DEFAULT_LATEX = `\\documentclass[12pt]{article}
\\usepackage[a4paper,margin=1in]{geometry}
\\usepackage{amsmath,amssymb,amsthm}
\\usepackage{physics}
\\usepackage{mathtools}
\\usepackage{bm}

\\begin{document}

\\title{Scientific Mathematical Compendium}
\\author{Research Division}
\\date{\\today}

\\maketitle

\\section*{Basic Algebra}
\\[ a+b=c \\]
\\[ x^2 + y^2 = z^2 \\]
\\[ (a+b)^2 = a^2 + 2ab + b^2 \\]
\\[ x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} \\]
\\[ \\sum_{i=1}^{n} i = \\frac{n(n+1)}{2} \\]

\\section*{Calculus}
\\[ \\lim_{x\\to\\infty}\\frac{1}{x}=0 \\]
\\[ \\frac{d}{dx}(\\sin x)=\\cos x \\]
\\[ \\int_0^1 x^2 \\, dx = \\frac{1}{3} \\]
\\[ \\nabla f(x,y) = \\left( \\frac{\\partial f}{\\partial x}, \\frac{\\partial f}{\\partial y} \\right) \\]

\\section*{Matrices}
\\[ \\begin{bmatrix} 1 & 2 \\\\ 3 & 4 \\end{bmatrix} \\]
\\[ \\det(A)=ad-bc \\]
\\[ \\bm{v}= \\begin{bmatrix} x\\\\ y\\\\ z \\end{bmatrix} \\]

\\section*{Physics & Advanced}
\\[ E=mc^2 \\]
\\[ \\vec{F}=q(\\vec{E}+\\vec{v}\\times\\vec{B}) \\]
\\[ \\nabla \\cdot \\vec{E} = \\frac{\\rho}{\\varepsilon_0} \\]
\\[ \\zeta(s) = \\sum_{n=1}^{\\infty} \\frac{1}{n^s} \\]
\\[ \\boxed{x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}} \\]

\\[ \\left\\{
\\begin{aligned}
2x+y&=5 \\\\
x-y&=1
\\end{aligned}
\\right. \\]

\\end{document}`;

export default function LaTeXToPDF() {
  const [latex, setLatex] = useState(DEFAULT_LATEX);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [pages, setPages] = useState([]);
  const previewRef = useRef(null);
  const measurerRef = useRef(null);

  const parsedHTML = useMemo(() => {
    let metadata = { title: '', author: '', date: '' };
    let text = latex;
    
    text = text.replace(/(^|[^\\])%.*$/gm, '$1');

    const bodyMatch = text.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
    if (bodyMatch) {
      text = bodyMatch[1];
    } else {
      text = text.replace(/\\documentclass[\s\S]*?\\begin\{document\}/g, '')
                 .replace(/\\usepackage[\s\S]*?(\n|$)/g, '')
                 .replace(/\\documentclass.*?(\n|$)/g, '');
    }

    const fullText = latex;
    const titleMatch = fullText.match(/\\title\{([\s\S]*?)\}/);
    if (titleMatch) metadata.title = titleMatch[1];
    
    const authorMatch = fullText.match(/\\author\{([\s\S]*?)\}/);
    if (authorMatch) metadata.author = authorMatch[1];
    
    const dateMatch = fullText.match(/\\date\{([\s\S]*?)\}/);
    if (dateMatch) {
      const dateVal = dateMatch[1].trim();
      metadata.date = dateVal === '\\today' 
        ? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) 
        : dateVal;
    }

    let content = text
      .replace(/\\title\{[\s\S]*?\}/g, '')
      .replace(/\\author\{[\s\S]*?\}/g, '')
      .replace(/\\date\{[\s\S]*?\}/g, '');

    content = content
      .replace(/\\maketitle/g, `
        <div class="text-center mb-12">
          <h1 class="text-3xl font-serif font-bold mb-2" style="color: #0f172a;">${metadata.title}</h1>
          <p class="text-lg font-serif mb-1" style="color: #0f172a;">${metadata.author}</p>
          <p class="text-base font-serif" style="color: #64748b;">${metadata.date}</p>
        </div>
      `)
      .replace(/\\LaTeX\\/g, 'L<sup>a</sup>T<sub>e</sub>X')
      .replace(/\\LaTeX/g, 'L<sup>a</sup>T<sub>e</sub>X')
      .replace(/\\TeX\\/g, 'T<sub>e</sub>X')
      .replace(/\\TeX/g, 'T<sub>e</sub>X')
      .replace(/\\copyright/g, '©');

    content = content.replace(/\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g, (match, body) => {
      try {
        const rendered = katex.renderToString(`\\begin{aligned}${body}\\end{aligned}`, { 
          displayMode: true, 
          throwOnError: false,
          trust: true
        });
        return `<div class="my-10 py-4 math-block" style="line-height: normal; page-break-inside: avoid;">${rendered}</div>`;
      } catch (e) { return match; }
    });

    content = content.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (match, body) => {
      const items = body.split('\\item').filter(i => i.trim()).map(i => `<li class="mb-2 pl-2">${i.trim()}</li>`).join('');
      return `<ul class="list-disc ml-8 mb-6 font-serif text-[11pt]">${items}</ul>`;
    });
    
    content = content.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, (match, body) => {
      const items = body.split('\\item').filter(i => i.trim()).map(i => `<li class="mb-2 pl-2">${i.trim()}</li>`).join('');
      return `<ol class="list-decimal ml-8 mb-6 font-serif text-[11pt]">${items}</ol>`;
    });

    content = content.replace(/\\begin\{tabular\}\{.*?\}[\s\S]*?\\end\{tabular\}/g, (match) => {
      const rows = match.split('\\\\').map(row => {
        const cells = row.replace(/\\begin\{tabular\}\{.*?\}|\\end\{tabular\}|\\hline/g, '').split('&').map(cell => {
          const protectedCell = cell.trim().replace(/\$/g, '<span>$</span>');
          return protectedCell ? `<td class="p-4 text-center" style="border: 1px solid #cbd5e1;">${protectedCell}</td>` : '';
        }).filter(Boolean).join('');
        return cells ? `<tr>${cells}</tr>` : '';
      }).filter(Boolean).join('');
      return `<table class="w-full border-collapse mb-8 font-serif" style="border: 1px solid #cbd5e1; page-break-inside: avoid;">${rows}</table>`;
    });

    content = content.replace(/\\\[([\s\S]*?)\\\]/g, (match, formula) => {
      return `<div class="my-10 py-4 flex justify-center math-block" style="line-height: normal; page-break-inside: avoid;">
                ${katex.renderToString(formula.trim(), { displayMode: true, throwOnError: false, trust: true })}
              </div>`;
    });
    
    content = content.replace(/\$([^\$]+?)\$/g, (match, formula) => {
      if (/^\d+(\.\d+)?$/.test(formula.trim())) return match;
      return `<span class="inline-math" style="line-height: normal;">${katex.renderToString(formula, { displayMode: false, throwOnError: false, trust: true })}</span>`;
    });

    content = content
      .replace(/\\section\*?\{(.*?)\}/g, '<h2 class="text-xl font-serif font-bold mt-8 mb-4 pb-1" style="color: #0f172a; border-bottom: 1px solid #e2e8f0;">$1</h2>')
      .replace(/\\subsection\*?\{(.*?)\}/g, '<h3 class="text-lg font-serif font-bold mt-6 mb-3" style="color: #0f172a;">$1</h3>')
      .replace(/\\textbf\{(.*?)\}/g, '<strong>$1</strong>')
      .replace(/\\textit\{(.*?)\}/g, '<em>$1</em>')
      .replace(/\\underline\{(.*?)\}/g, '<span style="text-decoration: underline;">$1</span>');

    content = content
      .replace(/\\\&/g, '&')
      .replace(/\\\$/g, '$')
      .replace(/\\\%/g, '%')
      .replace(/\\\_/g, '_')
      .replace(/\\\{/g, '{')
      .replace(/\\\}/g, '}');

    content = content.replace(/\\newpage/g, `
      <div class="my-12 relative no-print" style="border-top: 2px dashed #f1f5f9;">
        <span class="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2 text-[10px] font-bold" style="color: #cbd5e1;">PAGE BREAK</span>
      </div>
      <div class="html2pdf__page-break" style="height: 0; margin: 0; border: none;"></div>
    `);

    content = content.split('\n\n').map(p => {
      if (p.includes('<h') || p.includes('<div') || p.includes('<ul') || p.includes('<ol') || p.includes('<table') || p.includes('class="katex')) return p;
      const trimmed = p.trim();
      if (!trimmed) return '';
      return `<p class="mb-6 leading-normal font-serif text-[11pt] text-justify">${trimmed.replace(/\n/g, ' ')}</p>`;
    }).join('');

    return content;
  }, [latex]);

  useEffect(() => {
    const paginate = async () => {
      if (!measurerRef.current) return;
      measurerRef.current.innerHTML = parsedHTML;
      const elements = Array.from(measurerRef.current.children);
      const newPages = [];
      let currentPageHTML = '';
      let currentHeight = 0;
      const maxPageHeightPx = (297 - 50) * 3.78; 
      elements.forEach((el) => {
        const elHeight = el.offsetHeight + parseFloat(window.getComputedStyle(el).marginBottom);
        if (currentHeight + elHeight > maxPageHeightPx && currentPageHTML !== '') {
          newPages.push(currentPageHTML);
          currentPageHTML = el.outerHTML;
          currentHeight = elHeight;
        } else {
          currentPageHTML += el.outerHTML;
          currentHeight += elHeight;
        }
      });
      if (currentPageHTML) newPages.push(currentPageHTML);
      setPages(newPages.length > 0 ? newPages : [parsedHTML]);
    };
    paginate();
  }, [parsedHTML]);

  const handleDownload = async () => {
    if (!previewRef.current) return;
    setIsProcessing(true);
    
    try {
      const pageElements = previewRef.current.querySelectorAll('.page-block');
      if (pageElements.length === 0) return;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i];
        if (i > 0) pdf.addPage();

        // 794px x 1123px is the standard A4 @ 96DPI
        const canvas = await html2canvas(pageEl, {
          scale: 5, 
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: 794, 
          height: 1123,
          onclone: (clonedDoc) => {
            const katexElements = clonedDoc.querySelectorAll('.katex');
            katexElements.forEach(el => {
              el.style.lineHeight = '1.2';
              el.style.textRendering = 'optimizeLegibility';
            });

            const allElements = clonedDoc.getElementsByTagName('*');
            for (let j = 0; j < allElements.length; j++) {
              const el = allElements[j];
              const style = window.getComputedStyle(el);
              el.style.fontFamily = '"Times New Roman", Times, serif';
              
              // Force Consistent Line Spacing
              if (el.tagName === 'P' || el.tagName === 'LI') {
                el.style.lineHeight = '1.5';
                el.style.marginBottom = '1em';
              } else if (el.tagName.startsWith('H')) {
                el.style.lineHeight = '1.2';
              }

              if (style.color.includes('oklch')) el.style.color = '#0f172a';
              if (style.backgroundColor.includes('oklch')) el.style.backgroundColor = 'transparent';
            }
          }
        });

        // Use PNG for lossless line preservation
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save('scientific-document.pdf');
      setIsDone(true);
      setTimeout(() => setIsDone(false), 3000);
    } catch (error) {
      console.error('Live capture failed:', error);
      alert('Visual capture failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-8 items-start justify-center w-full max-w-[1600px] mx-auto px-4">
      <div 
        ref={measurerRef} 
        className="fixed -left-[9999px] top-0 w-[210mm] p-[1in] prose prose-slate invisible no-print"
        style={{ fontFamily: '"Times New Roman", Times, serif' }}
      />
      <div className="w-full xl:w-[450px] space-y-4 shrink-0">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center">
                <FileText size={18} />
              </div>
              <h4 className="font-black text-xs text-slate-800 dark:text-slate-100 uppercase tracking-widest">Document Editor</h4>
            </div>
          </div>
          <textarea
            value={latex}
            onChange={(e) => setLatex(e.target.value)}
            className="w-full h-[700px] p-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border-2 border-transparent focus:border-accent outline-none font-mono text-xs leading-loose text-slate-700 dark:text-slate-300 transition-all scrollbar-hide"
            placeholder="Write your LaTeX here..."
          />
          <div className="mt-6 flex flex-wrap gap-2">
            <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded-md uppercase">
              <AlignLeft size={10} /> Align
            </div>
            <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded-md uppercase">
              <List size={10} /> Lists
            </div>
            <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded-md uppercase">
              <Table size={10} /> Tables
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 w-full flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <FileText className="text-accent" size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">PAGINATED PREVIEW</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Smart A4 Physical Layout</p>
            </div>
          </div>
          <button
            onClick={handleDownload}
            disabled={isProcessing}
            className={cn("btn-primary flex items-center gap-2 text-xs py-2.5", isProcessing && "opacity-50 cursor-not-allowed")}
          >
            {isProcessing ? <Loader2 className="animate-spin" size={16} /> : isDone ? <CheckCircle2 size={16} /> : <Download size={16} />}
            {isProcessing ? 'EXPORTING...' : isDone ? 'EXPORTED!' : 'DOWNLOAD PDF'}
          </button>
        </div>
        <div className="w-full overflow-x-auto pb-24 scrollbar-hide">
          <div 
            ref={previewRef}
            className="flex flex-col items-center gap-12 pages-container"
          >
            {pages.map((pageHTML, index) => (
              <div 
                key={index}
                className="bg-white text-[#0f172a] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] w-[210mm] min-h-[297mm] p-[1in] box-border relative page-block"
                style={{ fontFamily: '"Times New Roman", Times, serif' }}
              >
                <div className="absolute top-4 right-8 text-[9px] font-black text-slate-300 uppercase tracking-widest no-print">
                  Page {index + 1}
                </div>
                <div 
                  className="prose prose-slate max-w-none prose-headings:font-serif prose-p:font-serif"
                  dangerouslySetInnerHTML={{ __html: pageHTML }} 
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
