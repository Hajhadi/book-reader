import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  Sliders,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  BookOpen,
  RefreshCw,
  Eye,
} from 'lucide-react';
import {
  extractTextFromFile,
  extractViaServerGemini,
  detectCorruptedText,
  CorruptionCheckResult,
} from '../utils/pdfParser';
import { countWords } from '../utils/segmenter';
import { SAMPLE_BOOKS, SampleBookItem } from '../data/sampleBooks';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProcessBook: (data: {
    title: string;
    author: string;
    rawText: string;
    targetWords: number;
    fileName?: string;
  }) => Promise<void>;
  onSelectSample: (sample: SampleBookItem) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onProcessBook,
  onSelectSample,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'samples'>('upload');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [targetWords, setTargetWords] = useState(1350);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [currentUploadedFile, setCurrentUploadedFile] = useState<File | null>(null);
  const [corruptionWarning, setCorruptionWarning] = useState<CorruptionCheckResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessExtractedText = (text: string, file: File) => {
    const corruption = detectCorruptedText(text);
    if (corruption.isCorrupted) {
      setCorruptionWarning(corruption);
    } else {
      setCorruptionWarning(null);
    }

    setExtractedText(text);

    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(cleanName);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError(null);
    setCorruptionWarning(null);
    setIsParsing(true);
    setSelectedFileName(file.name);
    setCurrentUploadedFile(file);
    setParseProgress('Extracting manuscript text...');

    try {
      const text = await extractTextFromFile(file, (msg) => setParseProgress(msg));
      if (!text || text.trim().length === 0) {
        throw new Error('فایل خالی است یا متنی از آن قابل استخراج نبود.');
      }
      handleProcessExtractedText(text, file);
    } catch (err: any) {
      console.error('File parsing error:', err);
      setParseError(err.message || 'خطا در استخراج متن فایل.');
    } finally {
      setIsParsing(false);
      setParseProgress('');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setParseError(null);
    setCorruptionWarning(null);
    setIsParsing(true);
    setSelectedFileName(file.name);
    setCurrentUploadedFile(file);
    setParseProgress('Extracting manuscript text...');

    try {
      const text = await extractTextFromFile(file, (msg) => setParseProgress(msg));
      handleProcessExtractedText(text, file);
    } catch (err: any) {
      setParseError(err.message || 'خطا در استخراج متن فایل.');
    } finally {
      setIsParsing(false);
      setParseProgress('');
    }
  };

  const handleForceAIExtraction = async () => {
    if (!currentUploadedFile) return;
    setIsParsing(true);
    setParseProgress('Decoding PDF with AI Multi-Modal Engine (Gemini)...');
    setParseError(null);

    try {
      const cleanText = await extractViaServerGemini(currentUploadedFile);
      if (!cleanText || cleanText.trim().length === 0) {
        throw new Error('AI extraction returned empty text.');
      }
      setExtractedText(cleanText);
      setCorruptionWarning(null);
    } catch (err: any) {
      setParseError('AI extraction failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsParsing(false);
      setParseProgress('');
    }
  };

  const handleSubmit = async () => {
    const textToProcess = activeTab === 'upload' ? extractedText : pastedText;

    if (!textToProcess || textToProcess.trim().length === 0) {
      setParseError('لطفاً ابتدا فایل کتاب را آپلود کرده یا متن آن را وارد نمایید.');
      return;
    }

    const finalTitle = title.trim() || 'Untitled Audiobook';
    const finalAuthor = author.trim() || 'Unknown Author';

    setIsParsing(true);
    setParseProgress('Segmenting unabridged text into 10-minute episodes...');
    try {
      await onProcessBook({
        title: finalTitle,
        author: finalAuthor,
        rawText: textToProcess,
        targetWords,
        fileName: selectedFileName || undefined,
      });
      onClose();
    } catch (err: any) {
      setParseError(err.message || 'خطا در تقسیم‌بندی و پردازش کتاب.');
    } finally {
      setIsParsing(false);
      setParseProgress('');
    }
  };

  const activeWords = activeTab === 'upload' ? countWords(extractedText || '') : countWords(pastedText);
  const estimatedEpisodes = Math.max(1, Math.round(activeWords / targetWords));

  // Check pasted text for corruption too
  const pasteCorruption = activeTab === 'paste' ? detectCorruptedText(pastedText) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-base">Audiobook Manuscript Ingestion</h3>
              <p className="text-xs text-zinc-400">
                100% Unabridged processing into 10-minute episodes (صوت فارسی)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-zinc-800 px-6 bg-zinc-950/40 text-xs font-medium">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3 px-3 border-b-2 font-medium transition flex items-center gap-2 ${
              activeTab === 'upload'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload File (PDF / TXT / MD)
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`py-3 px-3 border-b-2 font-medium transition flex items-center gap-2 ${
              activeTab === 'paste'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Paste Manuscript Text
          </button>
          <button
            onClick={() => setActiveTab('samples')}
            className={`py-3 px-3 border-b-2 font-medium transition flex items-center gap-2 ${
              activeTab === 'samples'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Curated Classics
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {parseError && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs space-y-2.5">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <div className="flex-1 text-right">
                  <p className="font-semibold text-red-300">{parseError}</p>
                  {(parseError.includes('سقف') || parseError.includes('quota') || parseError.includes('429')) && (
                    <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                      💡 راهکار فوری: استخراج و تقسیم‌بندی کامل کتاب به قسمت‌های ۱۰ دقیقه‌ای از طریق درج متن (تب دوم) یا فایل‌های متنی متداول (TXT) به‌صورت نامحدود و بدون مصرف سهمیه انجام می‌شود.
                    </p>
                  )}
                </div>
              </div>
              {(parseError.includes('سقف') || parseError.includes('quota') || parseError.includes('429')) && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('paste');
                      setParseError(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>رفتن به تب درج متن (Paste Text)</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Corruption warning banner if font encoding issues were detected */}
          {(corruptionWarning?.isCorrupted || pasteCorruption?.isCorrupted) && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-amber-300">
                    هشدار کاراکترهای ناخوانا در فایل پی‌دی‌اف (Corrupted PDF Font Encoding Detected)
                  </p>
                  <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                    متن استخراج‌شده شامل نشانه‌های باینری یا فونت آسیب‌دیده است. با کلیک روی دکمه زیر، فایل با موتور چندوجهی هوش مصنوعی مجدداً بازگشایی و اصلاح می‌شود.
                  </p>
                </div>
              </div>
              {currentUploadedFile && (
                <div className="pt-1 flex justify-end">
                  <button
                    onClick={handleForceAIExtraction}
                    disabled={isParsing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isParsing ? 'animate-spin' : ''}`} />
                    استخراج و اصلاح هوشمند با Gemini AI
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: File Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-700 hover:border-amber-500/60 rounded-xl p-8 text-center cursor-pointer bg-zinc-950/40 hover:bg-zinc-950/70 transition flex flex-col items-center justify-center gap-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md,.text"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {isParsing ? (
                  <div className="flex flex-col items-center gap-2 text-amber-400 py-4">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-xs font-semibold">{parseProgress || 'در حال استخراج متن کتاب...'}</p>
                    <p className="text-[11px] text-zinc-400">بدون حذف حتی یک کلمه (Unabridged Extraction)</p>
                  </div>
                ) : extractedText ? (
                  <div className="flex flex-col items-center gap-3 w-full py-2">
                    <div className="h-11 w-11 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <Check className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 mb-1">
                        فایل کتاب شما با موفقیت خوانده شد
                      </span>
                      <p className="font-bold text-zinc-100 text-sm">{selectedFileName}</p>
                      <p className="text-xs text-amber-400 font-mono mt-0.5">
                        {countWords(extractedText).toLocaleString()} کلمه • ~{estimatedEpisodes} قسمت ۱۰ دقیقه‌ای
                      </p>
                    </div>

                    {/* Immediate Action Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubmit();
                      }}
                      className="mt-2 flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 text-zinc-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-95 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>تأیید و تبدیل به قسمت‌های ۱۰ دقیقه‌ای</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="text-[11px] text-zinc-400 hover:text-zinc-200 underline mt-1"
                    >
                      انتخاب یک فایل دیگر (Choose different file)
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-medium text-zinc-200">
                        فایل کتاب خود را به اینجا بکشید یا برای انتخاب فایل{' '}
                        <span className="text-amber-400 underline font-semibold">کلیک کنید</span>
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        پشتیبانی کامل از فایل‌های PDF، متنی (TXT) و Markdown
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Text Preview Snippet so user can see it is clean */}
              {extractedText && (
                <div className="rounded-xl bg-zinc-950/80 border border-zinc-800 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="flex items-center gap-1.5 font-medium text-zinc-300">
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      پیش‌نمایش متن استخراج‌شده (First 200 characters):
                    </span>
                    <button
                      type="button"
                      onClick={handleForceAIExtraction}
                      disabled={isParsing}
                      className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 underline"
                    >
                      <RefreshCw className="w-3 h-3" />
                      استخراج مجدد با هوش مصنوعی
                    </button>
                  </div>
                  <p className="font-mono text-xs text-zinc-300 bg-zinc-900 p-2.5 rounded-lg border border-zinc-800/80 line-clamp-3 leading-relaxed select-all">
                    {extractedText.slice(0, 300)}...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Paste Manuscript */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-zinc-300">
                Manuscript Full Text (Chapters, Headings, Unabridged Content)
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste the book text here... Every single word will be preserved into 10-minute episodes."
                rows={9}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3.5 text-xs text-zinc-200 font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-500/60 leading-relaxed resize-none"
              />
              <div className="flex justify-between items-center text-[11px] text-zinc-400 font-mono">
                <span>{countWords(pastedText).toLocaleString()} words</span>
                <span>~{Math.round((countWords(pastedText) / 135) * 10) / 10} minutes total listening</span>
              </div>
            </div>
          )}

          {/* TAB 3: Curated Samples */}
          {activeTab === 'samples' && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-400 mb-2">
                Select a ready-to-process manuscript to test the multi-episode segmentation pipeline:
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {SAMPLE_BOOKS.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => {
                      onSelectSample(sample);
                      onClose();
                    }}
                    className="p-3 rounded-xl bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-amber-500/40 text-left transition flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-medium text-zinc-200 text-sm">{sample.title}</h4>
                      <p className="text-xs text-zinc-400">
                        {sample.author} • {sample.genre}
                      </p>
                    </div>
                    <div className="text-right text-xs font-mono">
                      <span className="text-amber-400 font-semibold">{sample.wordCount.toLocaleString()} w</span>
                      <p className="text-[10px] text-zinc-500">~{sample.expectedEpisodes} episodes</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Book Metadata inputs if not in samples tab */}
          {activeTab !== 'samples' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Book Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. The Time Machine"
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/60"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Author Name</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. H. G. Wells"
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/60"
                />
              </div>
            </div>
          )}

          {/* Segmentation Settings */}
          {activeTab !== 'samples' && (
            <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/90 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  10-Minute Episode Target Calibration
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {targetWords} words (~10.0 min @ 135 WPM)
                </span>
              </div>
              <input
                type="range"
                min="1200"
                max="1500"
                step="25"
                value={targetWords}
                onChange={(e) => setTargetWords(Number(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
                <span>1,200 w (~8.8 min)</span>
                <span>Standard Audiobook: 1,350 w</span>
                <span>1,500 w (~11.1 min)</span>
              </div>

              {activeWords > 0 && (
                <div className="text-xs text-zinc-300 pt-2 border-t border-zinc-800/60 flex items-center justify-between font-mono">
                  <span>تعداد اپیزودهای ۱۰ دقیقه‌ای:</span>
                  <span className="text-emerald-400 font-bold">
                    {estimatedEpisodes} قسمت صوتی (~{(activeWords / 135).toFixed(0)} دقیقه کل)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Persian Audio Output Guarantee */}
          {activeTab !== 'samples' && (
            <div className="p-3.5 rounded-xl bg-purple-950/25 border border-purple-800/40 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-purple-200">
                <span className="text-base">🇮🇷</span>
                <div>
                  <span className="font-semibold block">تنظیم خروجی صوتی به زبان فارسی</span>
                  <span className="text-[11px] text-zinc-400">
                    کتاب به هر زبانی که باشد، خروجی صوتی و متن گویندگی به فارسی شیوا و بدون حذف تولید می‌شود.
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                فعال
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab !== 'samples' && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/80">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isParsing || activeWords === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition disabled:opacity-40 cursor-pointer"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال پردازش و تقسیم‌بندی کتاب...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>تبدیل به قسمت‌های ۱۰ دقیقه‌ای (شروع استودیو)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
