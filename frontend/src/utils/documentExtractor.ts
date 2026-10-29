import JSZip from 'jszip';

/**
 * Extracts plain text from a Word .docx file ArrayBuffer
 */
export async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const docXmlFile = zip.file('word/document.xml');
    if (!docXmlFile) {
      return '';
    }

    const xmlText = await docXmlFile.async('text');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

    // Extract all paragraphs
    const paragraphs = xmlDoc.getElementsByTagName('w:p');
    const lines: string[] = [];

    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      const textNodes = p.getElementsByTagName('w:t');
      let line = '';
      for (let j = 0; j < textNodes.length; j++) {
        line += textNodes[j].textContent || '';
      }
      const trimmed = line.trim();
      if (trimmed) {
        lines.push(trimmed);
      }
    }

    // Also extract text from tables
    if (lines.length === 0) {
      const allTextNodes = xmlDoc.getElementsByTagName('w:t');
      let combined = '';
      for (let i = 0; i < allTextNodes.length; i++) {
        combined += (allTextNodes[i].textContent || '') + ' ';
      }
      return combined.trim();
    }

    return lines.join('\n\n');
  } catch (err) {
    console.warn('Error extracting docx text with JSZip:', err);
    return '';
  }
}

/**
 * Extracts text from a PDF ArrayBuffer using pdfjs-dist or lightweight stream parsing
 */
export async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  try {
    const pdfjs = await import('pdfjs-dist');
    // Configure worker
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
    }

    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
    const pdf = await loadingTask.promise;
    const pageTexts: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .filter(Boolean);
      if (pageStrings.length > 0) {
        pageTexts.push(pageStrings.join(' '));
      }
    }

    return pageTexts.join('\n\n');
  } catch (err) {
    console.warn('PDF.js extraction failed, attempting fallback stream reader:', err);
    try {
      const bytes = new Uint8Array(buffer);
      const str = new TextDecoder('latin1').decode(bytes);
      const matches = str.match(/\(([^()]{2,})\)\s*Tj/g) || [];
      const extracted = matches
        .map((m) => m.replace(/^\(/, '').replace(/\)\s*Tj$/, '').trim())
        .filter((t) => t.length > 1 && !/[^\x20-\x7E]/.test(t));
      if (extracted.length > 10) {
        return extracted.join(' ');
      }
    } catch {}
    return '';
  }
}

/**
 * Converts a Base64 string to an ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64.replace(/\s/g, ''));
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Universal text extraction helper from File or Blob
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const filename = file.name.toLowerCase();

  if (filename.endsWith('.docx') || file.type.includes('wordprocessingml')) {
    const buffer = await file.arrayBuffer();
    const text = await extractDocxText(buffer);
    if (text) return text;
  }

  if (filename.endsWith('.pdf') || file.type === 'application/pdf') {
    const buffer = await file.arrayBuffer();
    const text = await extractPdfText(buffer);
    if (text) return text;
  }

  if (
    filename.endsWith('.txt') ||
    filename.endsWith('.md') ||
    filename.endsWith('.json') ||
    filename.endsWith('.csv') ||
    file.type.startsWith('text/')
  ) {
    try {
      return await file.text();
    } catch {}
  }

  return '';
}

/**
 * Re-extracts text from stored base64 data if document extractedText is empty
 */
export async function extractTextFromBase64(base64: string, filename: string): Promise<string> {
  try {
    const lowerName = filename.toLowerCase();
    const buffer = base64ToArrayBuffer(base64);

    if (lowerName.endsWith('.docx') || lowerName.includes('word')) {
      return await extractDocxText(buffer);
    }
    if (lowerName.endsWith('.pdf')) {
      return await extractPdfText(buffer);
    }
    if (lowerName.endsWith('.txt') || lowerName.endsWith('.md')) {
      return new TextDecoder('utf-8').decode(buffer);
    }
  } catch (e) {
    console.warn('extractTextFromBase64 error:', e);
  }
  return '';
}
