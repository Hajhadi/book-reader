/**
 * Document & PDF parsing utility with corruption detection and Gemini AI fallback.
 */

export interface CorruptionCheckResult {
  isCorrupted: boolean;
  reason?: string;
  confidence: number;
}

/**
 * Detects if a text string consists of binary artifacts, broken font encoding glyphs,
 * or stripped PDF deflate stream characters (e.g., "{ { ^ u", "CO l| r x ) 1s y Dv{").
 */
export function detectCorruptedText(text: string): CorruptionCheckResult {
  if (!text || text.trim().length === 0) {
    return { isCorrupted: false, confidence: 0 };
  }

  const sample = text.slice(0, 3000);
  const totalChars = sample.length;
  if (totalChars < 50) return { isCorrupted: false, confidence: 0 };

  // 1. Check for strange symbol density (typical of raw PDF flate streams)
  const strangeSymbols = sample.match(/[\{\}\[\]\^\~\\\|\<\>\`\_\%\*\$\#\@\=\+\/]/g) || [];
  const symbolRatio = strangeSymbols.length / totalChars;

  // 2. Check for recurring binary stream sequences like "{ { ^ u" or "x ) 1s"
  const hasRepeatingArtifacts = /\{\s*\{\s*\^|\[\s*\+\s*gY|\^\s*u\s*\{\s*\{|\b[a-zA-Z]\s+[a-zA-Z]\s+[a-zA-Z]\b.*\{/i.test(
    sample
  );

  // 3. Check for high density of common English or Persian words
  const englishWords =
    /\b(the|and|that|have|for|not|with|you|this|but|his|from|they|say|her|she|or|an|will|my|one|all|would|there|their|what|so|up|out|if|about|who|get|which|go|me|when|make|can|like|time|no|just|him|know|take|people|into|year|your|good|some|could|them|see|other|than|then|now|look|only|come|its|over|think|also|back|after|use|two|how|our|work|first|well|way|even|new|want|because|any|these|give|day|most|us|said|chapter)\b/gi;
  const englishMatches = sample.match(englishWords) || [];

  const persianWords =
    /\b(و|در|به|از|که|این|را|با|است|برای|آن|یک|خود|تا|کرد|بر|هم|نیز|رفت|گفت|بود|شد|می|او|فصل|کتاب)\b/g;
  const persianMatches = sample.match(persianWords) || [];

  const totalRecognizedWords = englishMatches.length + persianMatches.length;
  const words = sample.trim().split(/\s+/).filter(Boolean);
  const recognizedRatio = words.length > 0 ? totalRecognizedWords / words.length : 0;

  // 4. Letter ratio vs non-printable / symbols
  const letters = sample.match(/[\p{L}]/gu) || [];
  const letterRatio = letters.length / totalChars;

  // If high symbol ratio (> 10%) and low recognized words (< 8%)
  if (symbolRatio > 0.08 && recognizedRatio < 0.08) {
    return {
      isCorrupted: true,
      reason: 'متن حاوی کاراکترهای باینری و به هم ریخته است (High symbol noise / broken font encoding)',
      confidence: 0.96,
    };
  }

  // If recurring stream artifacts appear
  if (hasRepeatingArtifacts && recognizedRatio < 0.12) {
    return {
      isCorrupted: true,
      reason: 'علائم جریان باینری PDF شناسایی شد (PDF binary stream corruption artifacts)',
      confidence: 0.98,
    };
  }

  // Very low letter ratio on a medium/large sample
  if (letterRatio < 0.45 && totalChars > 200) {
    return {
      isCorrupted: true,
      reason: 'نسبت حروف معنادار بسیار پایین است (Low recognizable letter ratio)',
      confidence: 0.92,
    };
  }

  return { isCorrupted: false, confidence: 0 };
}

/**
 * Converts a File object to a Base64 string for server processing.
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Extract clean text using Gemini Multi-Modal document parser.
 */
export async function extractViaServerGemini(file: File): Promise<string> {
  const base64 = await fileToBase64(file);
  const res = await fetch('/api/parse-document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileBase64: base64,
      mimeType: file.type || 'application/pdf',
      fileName: file.name,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = err.error || 'Server extraction failed';
    const errorObj = new Error(message);
    (errorObj as any).isQuotaExhausted = err.isQuotaExhausted || res.status === 429;
    throw errorObj;
  }

  const data = await res.json();
  return data.text || '';
}

/**
 * Strips known PDF deflate stream noise artifacts while preserving genuine words.
 */
export function cleanCorruptedBinaryNoise(text: string): string {
  if (!text) return '';
  return text
    .replace(/\{\s*\{\s*\^\s*u/g, '')
    .replace(/\^\s*u\s*\{\s*\{/g, '')
    .replace(/\[\s*\+\s*gY[^\]]*\]/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extracts plain text from an uploaded file (TXT, Markdown, or PDF).
 * Uses proper CMap font tables for pdfjs-dist and routes to Gemini Multi-Modal parser when needed.
 */
export async function extractTextFromFile(
  file: File,
  onProgress?: (status: string) => void
): Promise<string> {
  const fileName = file.name.toLowerCase();

  // 1. Text and Markdown files (UTF-8 direct decode - zero AI quota required)
  if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.text')) {
    onProgress?.('در حال خواندن فایل متنی...');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = (e.target?.result as string) || '';
        const check = detectCorruptedText(text);
        if (check.isCorrupted) {
          console.warn('Text file flagged with possible corruption:', check.reason);
        }
        resolve(text);
      };
      reader.onerror = () => reject(new Error('خطا در خواندن فایل متنی'));
      reader.readAsText(file);
    });
  }

  // 2. PDF Files
  if (fileName.endsWith('.pdf') || file.type === 'application/pdf') {
    onProgress?.('در حال خواندن و استخراج محتوای کامل کتاب از فایل PDF...');

    // A. Priority 1: High-Speed Native Server Extraction (zero AI quota, preserves 100% of text)
    try {
      const serverText = await extractViaServerGemini(file);
      if (serverText && serverText.trim().length > 100) {
        onProgress?.('متن کامل کتاب با موفقیت استخراج شد.');
        return serverText;
      }
    } catch (serverErr: any) {
      console.warn('Server-side extraction failed, trying client-side fallback:', serverErr);
      if (serverErr.isQuotaExhausted) {
        // If server flagged quota, proceed to client-side extraction
      }
    }

    // B. Priority 2: Client-side pdfjs extraction
    onProgress?.('در حال استخراج صفحات با موتور درون‌برنامه‌ای...');
    let clientExtractedText = '';
    let clientExtractionFailed = false;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfjsLib = await import('pdfjs-dist');
      const pdfVersion = pdfjsLib.version || '4.10.38';

      if (pdfjsLib.GlobalWorkerOptions) {
        try {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfVersion}/build/pdf.worker.min.mjs`;
        } catch {
          // fallback without external worker
        }
      }

      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfVersion}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfVersion}/standard_fonts/`,
        useSystemFonts: true,
      });

      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;
      let fullText = '';

      const maxPagesToScan = Math.min(numPages, 300);
      onProgress?.(`استخراج صفحات پی‌دی‌اف (صفحه ۱ تا ${maxPagesToScan})...`);

      for (let pageNum = 1; pageNum <= maxPagesToScan; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        let pageText = '';
        let lastY: number | null = null;

        for (const item of textContent.items as any[]) {
          if (!item.str) continue;
          if (item.hasEOL || (lastY !== null && Math.abs((item.transform?.[5] ?? 0) - lastY) > 6)) {
            pageText += '\n';
          } else if (pageText.length > 0 && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
            pageText += ' ';
          }
          pageText += item.str;
          lastY = item.transform ? item.transform[5] : null;
        }

        if (pageText.trim()) {
          fullText += `\n\n--- Page ${pageNum} ---\n\n` + pageText.trim();
        }
      }

      clientExtractedText = fullText.trim();
    } catch (clientErr) {
      console.warn('Client-side pdfjs extraction warning:', clientErr);
      clientExtractionFailed = true;
    }

    if (!clientExtractionFailed && clientExtractedText.length > 100) {
      const cleaned = cleanCorruptedBinaryNoise(clientExtractedText);
      onProgress?.('متن کتاب با موفقیت استخراج شد.');
      return cleaned;
    }

    throw new Error(
      'امکان استخراج مستقیم متن از این فایل PDF وجود نداشت. لطفاً متن کتاب را کپی کرده و در تب «Paste Manuscript Text» قرار دهید یا از فایل TXT استفاده کنید.'
    );
  }

  // 3. Fallback FileReader
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || '');
    reader.onerror = () => reject(new Error('امکان خواندن فایل وجود ندارد'));
    reader.readAsText(file);
  });
}
