import { ilovepdfService } from './ilovepdfService';
import JSZip from 'jszip';

export const pdfService = {
  /**
   * Merges multiple PDF files into one using iLovePDF API.
   * @param {File[]} files - Array of File objects.
   * @returns {Promise<Uint8Array>} - The merged PDF data.
   */
  mergePDFs: async (files) => {
    const fileObjects = files.map(f => ({ file: f }));
    const arrayBuffer = await ilovepdfService.runTool('merge', fileObjects);
    return new Uint8Array(arrayBuffer);
  },

  /**
   * Splits a PDF into multiple files or extracts specific ranges using iLovePDF API.
   * @param {File} file - The PDF file.
   * @param {string} range - e.g., "1-3, 5".
   * @returns {Promise<Uint8Array[]>} - Array of split PDF data.
   */
  splitPDF: async (file, range) => {
    // Sanitize ranges
    const ranges = range.split(',').map(r => r.trim()).filter(Boolean).join(',');
    
    const arrayBuffer = await ilovepdfService.runTool('split', [{ file }], {
      split_mode: 'ranges',
      ranges: ranges
    });

    return getArrayOfPdfsOrZip(arrayBuffer);
  },

  /**
   * Rotates specific pages of a PDF using iLovePDF API.
   * @param {File} file 
   * @param {number} rotation - 0, 90, 180, 270.
   * @returns {Promise<Uint8Array>}
   */
  rotatePDF: async (file, rotation) => {
    const arrayBuffer = await ilovepdfService.runTool('rotate', [{ file, options: { rotate: rotation } }]);
    return new Uint8Array(arrayBuffer);
  },

  /**
   * Compresses a PDF using iLovePDF API.
   */
  compressPDF: async (file, level = 'recommended') => {
    const arrayBuffer = await ilovepdfService.runTool('compress', [{ file }], {
      compression_level: level
    });
    return new Uint8Array(arrayBuffer);
  },
  
  /**
   * Converts an image to a PDF with options using iLovePDF API.
   */
  imageToPDF: async (imageFile, options = {}) => {
    const { orientation = 'portrait', pageSize = 'A4', margin = 0 } = options;
    
    // Map pagesize to iLovePDF options (fit, A4, letter)
    let ilovePdfPageSize = 'A4';
    if (pageSize.toLowerCase() === 'letter') ilovePdfPageSize = 'letter';
    if (pageSize.toLowerCase() === 'fit') ilovePdfPageSize = 'fit';

    const arrayBuffer = await ilovepdfService.runTool('imagepdf', [{ file: imageFile }], {
      orientation,
      margin,
      pagesize: ilovePdfPageSize,
      merge_after: true
    });
    
    return new Uint8Array(arrayBuffer);
  },

  /**
   * Protects a PDF using iLovePDF API.
   * @param {File[]} files 
   * @param {string} password 
   */
  protectPDF: async (files, password) => {
    const fileObjects = files.map(f => ({ file: f }));
    const arrayBuffer = await ilovepdfService.runTool('protect', fileObjects, {
      password
    });
    
    return getArrayOfPdfsOrZip(arrayBuffer);
  },

  /**
   * Unlocks a PDF using iLovePDF API.
   * @param {File[]} files 
   * @param {string} password 
   */
  unlockPDF: async (files, password) => {
    const fileObjects = files.map(f => ({ file: f, options: { password } }));
    const arrayBuffer = await ilovepdfService.runTool('unlock', fileObjects);
    
    return getArrayOfPdfsOrZip(arrayBuffer);
  }
};

async function getArrayOfPdfsOrZip(arrayBuffer) {
  const uint8Array = new Uint8Array(arrayBuffer);
  if (uint8Array.length >= 4 && uint8Array[0] === 0x50 && uint8Array[1] === 0x4B) {
    // ZIP file
    const zip = new (JSZip.default || JSZip)();
    const zipContent = await zip.loadAsync(arrayBuffer);
    const pdfs = [];
    for (const [filename, zipEntry] of Object.entries(zipContent.files)) {
      if (!zipEntry.dir && filename.endsWith('.pdf')) {
        const pdfData = await zipEntry.async('uint8array');
        pdfs.push(pdfData);
      }
    }
    return pdfs;
  }
  return [uint8Array];
}
