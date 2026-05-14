import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Set up worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const ocrService = {
  /**
   * Performs OCR on an image file.
   * @param {File | Blob} image 
   * @returns {Promise<string>}
   */
  recognizeText: async (image) => {
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(image);
    await worker.terminate();
    return text;
  },

  /**
   * Converts a PDF page to a Canvas/Blob for OCR.
   * @param {File} file 
   * @param {number} pageNum 
   * @returns {Promise<Blob>}
   */
  pdfPageToImage: async (file, pageNum = 1) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    const page = await pdf.getPage(pageNum);
    
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  },

  /**
   * Extracts text directly from PDF pages without OCR.
   * @param {File} file 
   * @returns {Promise<string>}
   */
  extractTextFromPDF: async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = '';

    for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n\n';
    }

    return fullText;
  }
};
