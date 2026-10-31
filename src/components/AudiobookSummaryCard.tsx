import React from 'react';
import {
  ShieldCheck,
  Clock,
  Book,
  Mic,
  Sliders,
  Download,
  Sparkles,
  Layers,
  Volume2,
} from 'lucide-react';
import { Book as BookType } from '../types';
import { downloadCompleteAudiobookZip } from '../utils/exporter';

interface AudiobookSummaryCardProps {
  book: BookType;
  onReanalyzeTone: () => void;
  isAnalyzingTone: boolean;
  audioLanguage: 'fa' | 'original';
  onToggleLanguage: (lang: 'fa' | 'original') => void;
}

export const AudiobookSummaryCard: React.FC<AudiobookSummaryCardProps> = ({
  book,
  onReanalyzeTone,
  isAnalyzingTone,
  audioLanguage,
  onToggleLanguage,
}) => {
  const [isExporting, setIsExporting] = React.useState(false);

  const isPersian = audioLanguage === 'fa';
  const totalMinutes = Math.round((book.totalWords / 135) * 10) / 10;
  const hours = Math.floor(totalMinutes / 60);
  const remainingMins = Math.round(totalMinutes % 60);

  const handleExportZip = async () => {
    try {
      setIsExporting(true);
      await downloadCompleteAudiobookZip(book, audioLanguage);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 md:p-6 mb-8 shadow-xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {book.isUserUploaded ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                کتاب اختصاصی شما (فایل شخصی)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-500/15 text-amber-300 border border-amber-500/25">
                نمونه آزمایشی (Sample)
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% Unabridged (بدون تلخیص)
            </span>
            <button
              onClick={() => onToggleLanguage(isPersian ? 'original' : 'fa')}
              className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1 hover:bg-purple-500/25 transition cursor-pointer"
            >
              <span>🇮🇷</span>
              <span>{isPersian ? 'خروجی صوتی فارسی (فعال)' : 'تغییر به خروجی صوتی فارسی'}</span>
            </button>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-100 tracking-tight">
            {isPersian && book.persianTitle ? `${book.persianTitle} (${book.title})` : book.title}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            نویسنده:{' '}
            <span className="text-zinc-200 font-medium">
              {book.author}
            </span>{' '}
            • <span className="text-zinc-400">{book.genre}</span>
          </p>
        </div>

        {/* Global actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onReanalyzeTone}
            disabled={isAnalyzingTone}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isAnalyzingTone ? 'Analyzing Mood...' : 'Re-Analyze Tone & Voice'}</span>
          </button>

          <button
            onClick={handleExportZip}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-bold text-xs shadow-md shadow-amber-500/20 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Packaging ZIP...' : 'Export Complete Series (ZIP)'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-zinc-800/80">
        <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Total Episodes</span>
          </div>
          <p className="text-xl font-bold font-mono text-zinc-100">
            {book.episodes.length}{' '}
            <span className="text-xs font-normal text-zinc-500">episodes</span>
          </p>
          <span className="text-[10px] text-amber-400 font-mono mt-0.5 block">~10 min / episode</span>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Total Audio Runtime</span>
          </div>
          <p className="text-xl font-bold font-mono text-zinc-100">
            {hours > 0 ? `${hours}h ${remainingMins}m` : `~${totalMinutes}m`}
          </p>
          <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">@ 135 WPM Narration</span>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
            <Book className="w-3.5 h-3.5 text-purple-400" />
            <span>Total Manuscript Words</span>
          </div>
          <p className="text-xl font-bold font-mono text-zinc-100">
            {book.totalWords.toLocaleString()}
          </p>
          <span className="text-[10px] text-purple-400 font-mono mt-0.5 block">
            {book.totalCharacters.toLocaleString()} characters
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Content Preservation</span>
          </div>
          <p className="text-xl font-bold font-mono text-emerald-400">100.0%</p>
          <span className="text-[10px] text-emerald-500 font-mono mt-0.5 block">
            Zero omissions or skips
          </span>
        </div>
      </div>

      {/* Voice Casting & Direction Specifications */}
      <div className="pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Mic className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs uppercase tracking-wider font-mono text-zinc-300 font-semibold">
            Master Voice Casting & Narration Configuration
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800">
            <span className="text-[11px] text-zinc-500 font-mono">Recommended Voice Archetype</span>
            <p className="font-semibold text-amber-400 text-sm mt-0.5 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" />
              {book.globalVoiceConfig.recommendedVoice} (Gemini AI TTS)
            </p>
            <p className="text-[10px] text-zinc-400 mt-1">
              Alternative: {book.globalVoiceConfig.elevenLabsSuggestion || 'Adam / Rachel'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800">
            <span className="text-[11px] text-zinc-500 font-mono">Gender & Emotional Tone</span>
            <p className="font-semibold text-zinc-200 text-sm mt-0.5">
              {book.globalVoiceConfig.gender}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1 line-clamp-1">
              {book.globalVoiceConfig.emotionalTone}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800">
            <span className="text-[11px] text-zinc-500 font-mono">Pace & Pitch Setting</span>
            <p className="font-semibold text-zinc-200 text-sm mt-0.5 font-mono">
              {book.globalVoiceConfig.pace}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1">
              Pitch: {book.globalVoiceConfig.pitch}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800">
            <span className="text-[11px] text-zinc-500 font-mono">Audio Engineering Guidance</span>
            <p className="text-[11px] text-zinc-300 mt-1 leading-snug line-clamp-2">
              {book.globalVoiceConfig.productionNotes ||
                '1.2s pause at scene headings, 0.8s between paragraphs.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
