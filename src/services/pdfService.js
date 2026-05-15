import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Ensure pdfjs worker is set for rendering pages when running in browser
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export const pdfService = {
  /**
   * Merges multiple PDF files into one.
   * @param {File[]} files - Array of File objects.
   * @returns {Promise<Uint8Array>} - The merged PDF data.
   */
  mergePDFs: async (files) => {
    const mergedPdf = await PDFDocument.create();
    
    for (const file of files) {
      const fileBytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(fileBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    
    return await mergedPdf.save({ useObjectStreams: true });
  },

  /**
   * Splits a PDF into multiple files or extracts specific ranges.
   * @param {File} file - The PDF file.
   * @param {string} range - e.g., "1-3, 5".
   * @returns {Promise<Uint8Array[]>} - Array of split PDF data.
   */
  splitPDF: async (file, range) => {
    const fileBytes = await file.arrayBuffer();
    const pdf = await PDFDocument.load(fileBytes);
    const totalPages = pdf.getPageCount();
    
    // Simple range parsing logic
    const ranges = range.split(',').map(r => r.trim());
    const results = [];

    for (const r of ranges) {
      let start, end;
      if (r.includes('-')) {
        [start, end] = r.split('-').map(Number);
      } else {
        start = end = Number(r);
      }

      if (isNaN(start) || isNaN(end)) continue;

      // Normalize range (handle cases like 5-3 or out of bounds)
      const actualStart = Math.max(1, Math.min(start, end));
      const actualEnd = Math.min(totalPages, Math.max(start, end));

      if (actualStart > totalPages || actualEnd < 1) continue;

      const newPdf = await PDFDocument.create();
      const pagesToCopy = Array.from({ length: actualEnd - actualStart + 1 }, (_, i) => actualStart + i - 1);
      const copiedPages = await newPdf.copyPages(pdf, pagesToCopy);
      copiedPages.forEach((page) => newPdf.addPage(page));
      
      results.push(await newPdf.save({ useObjectStreams: true }));
    }

    return results;
  },

  /**
   * Rotates specific pages of a PDF.
   * @param {File} file 
   * @param {number} rotation - 0, 90, 180, 270.
   * @returns {Promise<Uint8Array>}
   */
  rotatePDF: async (file, rotation) => {
    const fileBytes = await file.arrayBuffer();
    const pdf = await PDFDocument.load(fileBytes);
    const pages = pdf.getPages();
    
    pages.forEach(page => {
      page.setRotation({ type: 'degrees', angle: rotation });
    });

    return await pdf.save({ useObjectStreams: true });
  },

  /**
   * Compresses a PDF (best effort client-side).
   * Note: Real compression usually involves image re-encoding which is heavy.
   * This version will try to optimize the PDF structure.
   */
  compressPDF: async (file, level = 'recommended') => {
    const fileBytes = await file.arrayBuffer();

    // Map UI levels to JPEG quality (0-1)
    const qualityMap = {
      extreme: 0.45,
      recommended: 0.7,
      less: 0.95
    };

    const quality = qualityMap[level] ?? 0.7;

    try {
      // Load source PDF with pdfjs to render pages to canvas
      const srcPdf = await pdfjsLib.getDocument({ data: fileBytes }).promise;
      const pageCount = srcPdf.numPages;

      const outPdf = await PDFDocument.create();

      // Helper: convert dataURL to Uint8Array
      const dataURLToUint8 = (dataURL) => {
        const base64 = dataURL.split(',')[1];
        const binary = atob(base64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
      };

      // For each page, render to canvas, re-encode as JPEG with chosen quality,
      // and embed into new PDF. This produces much better compression for image-heavy PDFs.
      for (let p = 1; p <= pageCount; p++) {
        const page = await srcPdf.getPage(p);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const ctx = canvas.getContext('2d');

        await page.render({ canvasContext: ctx, viewport }).promise;

        // Convert canvas to JPEG dataURL with quality
        const dataURL = canvas.toDataURL('image/jpeg', quality);
        const imgBytes = dataURLToUint8(dataURL);

        const extImg = await outPdf.embedJpg(imgBytes);
        const { width: imgW, height: imgH } = extImg.size();

        const pagePdf = outPdf.addPage([imgW, imgH]);
        pagePdf.drawImage(extImg, { x: 0, y: 0, width: imgW, height: imgH });
      }

      return await outPdf.save({ useObjectStreams: true });
    } catch (err) {
      // Fallback: if rendering fails (e.g., environment restrictions), return original PDF with object stream optimization
      console.warn('compressPDF rendering fallback:', err);
      const pdf = await PDFDocument.load(fileBytes);
      return await pdf.save({ useObjectStreams: true });
    }
  },
  
  /**
   * Converts an image to a PDF with options.
   */
  imageToPDF: async (imageFile, options = {}) => {
    const { orientation = 'portrait', pageSize = 'a4', margin = 0 } = options;
    const pdfDoc = await PDFDocument.create();
    
    const imageBytes = await imageFile.arrayBuffer();
    let image;
    if (imageFile.type === 'image/jpeg' || imageFile.type === 'image/jpg') {
      image = await pdfDoc.embedJpg(imageBytes);
    } else {
      image = await pdfDoc.embedPng(imageBytes);
    }

    const { width: imgWidth, height: imgHeight } = image;
    
    // Define page dimensions
    let pageWidth, pageHeight;
    if (pageSize === 'a4') {
      [pageWidth, pageHeight] = [595.28, 841.89];
    } else if (pageSize === 'letter') {
      [pageWidth, pageHeight] = [612, 792];
    } else {
      // "fit" mode
      [pageWidth, pageHeight] = [imgWidth + margin * 2, imgHeight + margin * 2];
    }

    // Swap for landscape
    if (orientation === 'landscape' && pageSize !== 'fit') {
      [pageWidth, pageHeight] = [pageHeight, pageWidth];
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Calculate image size to fit page with margins
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;
    const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
    
    const finalWidth = imgWidth * scale;
    const finalHeight = imgHeight * scale;

    // Center image
    const x = (pageWidth - finalWidth) / 2;
    const y = (pageHeight - finalHeight) / 2;

    page.drawImage(image, {
      x,
      y,
      width: finalWidth,
      height: finalHeight,
    });

    return await pdfDoc.save({ useObjectStreams: true });
  }
};
