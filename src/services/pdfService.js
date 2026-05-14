import { PDFDocument } from 'pdf-lib';

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
    
    return await mergedPdf.save();
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
      const newPdf = await PDFDocument.create();
      let start, end;
      
      if (r.includes('-')) {
        [start, end] = r.split('-').map(Number);
      } else {
        start = end = Number(r);
      }

      if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages) continue;

      const pagesToCopy = Array.from({ length: end - start + 1 }, (_, i) => start + i - 1);
      const copiedPages = await newPdf.copyPages(pdf, pagesToCopy);
      copiedPages.forEach((page) => newPdf.addPage(page));
      
      results.push(await newPdf.save());
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

    return await pdf.save();
  },

  /**
   * Compresses a PDF (best effort client-side).
   * Note: Real compression usually involves image re-encoding which is heavy.
   * This version will try to optimize the PDF structure.
   */
  compressPDF: async (file) => {
    const fileBytes = await file.arrayBuffer();
    const pdf = await PDFDocument.load(fileBytes);
    
    // pdf-lib's save({ useObjectStreams: true }) provides some compression
    return await pdf.save({ useObjectStreams: true });
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

    return await pdfDoc.save();
  }
};
