import { promises as fs } from 'fs';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite';

async function run() {
  try {
    const fileBytes = await fs.readFile('test_pdf_1.pdf');
    // Is it encryptPDF(bytes, password)?
    const encryptedBytes = await encryptPDF(fileBytes, 'test'); 
    await fs.writeFile('encrypted.pdf', encryptedBytes);
    console.log('Encrypted successfully!');
  } catch (e) {
    console.error(e);
  }
}
run();
