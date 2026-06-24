import { promises as fs } from 'fs';
import { PDFDocument } from 'pdf-lib';

async function run() {
  try {
    const fileBytes = await fs.readFile('encrypted.pdf');
    const pdfDoc = await PDFDocument.load(fileBytes, { password: 'test' });
    const unlockedBytes = await pdfDoc.save();
    await fs.writeFile('unlocked.pdf', unlockedBytes);
    console.log('Unlocked successfully!');
  } catch (e) {
    console.error('Failed to unlock:', e.message);
  }
}
run();
