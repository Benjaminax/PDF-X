/**
 * Triggers a file download in the browser.
 * @param {Blob | Uint8Array} data - The file data.
 * @param {string} filename - The name of the file.
 * @param {string} mimeType - The MIME type of the file.
 */
export const downloadFile = (data, filename, mimeType = 'application/pdf') => {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // Required for Firefox and some Chrome versions
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
};
