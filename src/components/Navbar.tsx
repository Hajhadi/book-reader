import React from 'react';
import { Book, Download, Upload, Bot, ShieldCheck, Headphones, Sparkles } from 'lucide-react';
import { Book as BookType } from '../types';
import { downloadCompleteAudiobookZip } from '../utils/exporter';

interface NavbarProps {
  currentBook: BookType | null;
  onOpenUpload: () => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
  onOpenToneModal?: () => void;
  audioLanguage: 'fa' | 'original';
  onToggleLanguage: (lang: 'fa' | 'original') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentBook,
  onOpenUpload,
  onToggleChat,
  isChatOpen,
  onOpenToneModal,
  audioLanguage,
  onToggleLanguage,
}) => {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExportZip = async () => {
    if (!currentBook) return;
    try {
      setIsExporting(true);
      await downloadCompleteAudiobookZip(currentBook, audioLanguage);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md px-4 lg:px-8 py-3">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 text-zinc-950">
            <Headphones className="w-5 h-5 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg tracking-tight text-zinc-100">AetherVox</span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                Producer AI
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Unabridged 10-Minute Episode Architect & TTS Optimizer
            </p>
          </div>
        </div>

        {/* Current Book Info if active */}
        {currentBook && (
          <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            {currentBook.isUserUploaded ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                کتاب شما
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/25">
                کتاب نمونه
              </span>
            )}
            <Book className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-medium text-zinc-100 max-w-[180px] truncate" title={currentBook.title}>
              {currentBook.title}
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-amber-400 font-mono font-medium">{currentBook.episodes.length} قسمت</span>
            <span className="text-zinc-500">•</span>
            <div className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">Unabridged</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Persian Audio Output Toggle Button */}
          <button
            onClick={() => onToggleLanguage(audioLanguage === 'fa' ? 'original' : 'fa')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              audioLanguage === 'fa'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
            title="تغییر زبان خروجی صوتی کتاب (فارسی / زبان اصلی)"
          >
            <span className="text-sm">🇮🇷</span>
            <span>{audioLanguage === 'fa' ? 'صوت فارسی (فعال)' : 'خروجی فارسی'}</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 transition"
          >
            <Upload className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">{currentBook ? 'Change Book' : 'Upload Book'}</span>
            <span className="sm:hidden">Upload</span>
          </button>

          {currentBook && (
            <button
              onClick={handleExportZip}
              disabled={isExporting}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold shadow-md shadow-amber-500/20 transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isExporting ? 'Packaging...' : 'Export Package (ZIP)'}
              </span>
              <span className="sm:hidden">ZIP</span>
            </button>
          )}

          <button
            onClick={onToggleChat}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border transition ${
              isChatOpen
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-300'
            }`}
            title="Open AI Producer Assistant"
          >
            <Bot className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Producer AI</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
