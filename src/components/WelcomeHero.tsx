import React from 'react';
import {
  Upload,
  BookOpen,
  Mic,
  Clock,
  ShieldCheck,
  FileCheck2,
  Sparkles,
  ArrowRight,
  Sliders,
  AudioWaveform,
} from 'lucide-react';
import { Book as BookType } from '../types';
import { SAMPLE_BOOKS, SampleBookItem } from '../data/sampleBooks';

interface WelcomeHeroProps {
  currentBook?: BookType | null;
  onOpenUpload: () => void;
  onSelectSampleBook: (book: SampleBookItem) => void;
  onOpenChat: () => void;
}

export const WelcomeHero: React.FC<WelcomeHeroProps> = ({
  currentBook,
  onOpenUpload,
  onSelectSampleBook,
  onOpenChat,
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 via-zinc-900/50 to-zinc-950 p-6 md:p-10 mb-8 shadow-2xl">
      {/* Background ambient glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Welcome Banner */}
      <div className="max-w-3xl relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Professional Audiobook Producer & TTS Script Optimizer</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-zinc-100 leading-tight mb-4">
          Transform any book into an{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200">
            unabridged 10-minute
          </span>{' '}
          audiobook series.
        </h1>

        <p className="text-sm md:text-base text-zinc-300 leading-relaxed mb-4">
          Welcome! I am your AI Audio-Book Producer, TTS Script Optimizer, and Content Architect. 
          Every single word of your book is meticulously preserved with <strong className="text-zinc-100">zero content loss</strong>,
          segmented into natural 10-minute listening episodes, enriched with custom voice direction, 
          tone settings, and ready-to-narrate export formats.
        </p>

        {/* Active Uploaded Book Indicator */}
        {currentBook?.isUserUploaded && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between gap-3 text-xs md:text-sm text-emerald-200 mb-6 flex-wrap">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <div>
                <span className="font-bold text-emerald-300 block">
                  کتاب اختصاصی شما فعال است: «{currentBook.title}»
                </span>
                <span className="text-[11px] text-zinc-300">
                  {currentBook.totalWords.toLocaleString()} کلمه • {currentBook.episodes.length} قسمت ۱۰ دقیقه‌ای آماده گویندگی صوتی
                </span>
              </div>
            </div>
            <button
              onClick={onOpenUpload}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition cursor-pointer"
            >
              آپلود فایل جدید
            </button>
          </div>
        )}

        {/* Persian Audio Output Guarantee Callout */}
        <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center gap-3 text-xs md:text-sm text-amber-200 mb-6">
          <span className="text-xl">🇮🇷</span>
          <div>
            <span className="font-bold block text-amber-300">
              خروجی صوتی به زبان فارسی برای تمامی کتاب‌ها
            </span>
            <span className="text-zinc-300 text-xs">
              هر کتابی با هر زبانی (انگلیسی، فرانسوی، آلمانی، عربی و...) که آپلود کنید، خروجی صوتی و متن گویندگی آن به صورت کامل، شیوا و بدون حذف به زبان فارسی تولید خواهد شد.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 mb-10">
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-bold text-sm shadow-lg shadow-amber-500/25 transition active:scale-95 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>{currentBook?.isUserUploaded ? 'آپلود یا تعویض کتاب (PDF, TXT, MD)' : 'آپلود کتاب خودتان (PDF, TXT, MD)'}</span>
          </button>

          <button
            onClick={onOpenChat}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-800/90 hover:bg-zinc-700/90 text-zinc-200 font-medium text-sm border border-zinc-700 transition"
          >
            <Mic className="w-4 h-4 text-amber-400" />
            <span>دستیار هوش مصنوعی تهیه کتاب</span>
          </button>
        </div>
      </div>

      {/* Step-by-Step Production Process */}
      <div className="relative z-10 border-t border-zinc-800/80 pt-8 mt-2">
        <h2 className="text-xs uppercase tracking-wider font-mono text-zinc-400 font-semibold mb-4">
          How I Process Your Book Step-by-Step
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs mb-3">
                01
              </div>
              <h3 className="font-semibold text-zinc-200 text-sm mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Unabridged Ingestion
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Zero content loss. Every paragraph, preface, and dialogue is cataloged with 100% mathematical word parity.
              </p>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono mt-3">100% Word Match</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs mb-3">
                02
              </div>
              <h3 className="font-semibold text-zinc-200 text-sm mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                10-Min Segmentation
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Targeting 1,200 to 1,500 words per episode (~135 WPM). Pauses at natural chapter or scene thresholds.
              </p>
            </div>
            <span className="text-[10px] text-amber-400 font-mono mt-3">~1,350 Words/Ep</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs mb-3">
                03
              </div>
              <h3 className="font-semibold text-zinc-200 text-sm mb-1 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                Tone & Voice Casting
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                AI analyzes mood, genre, and emotional arc to assign exact Voice Settings: Gender, Tone, Pitch & Pace.
              </p>
            </div>
            <span className="text-[10px] text-purple-400 font-mono mt-3">Gemini & ElevenLabs</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs mb-3">
                04
              </div>
              <h3 className="font-semibold text-zinc-200 text-sm mb-1 flex items-center gap-1.5">
                <AudioWaveform className="w-3.5 h-3.5 text-blue-400" />
                Continuity Bridges
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Smooth, brief narrator hooks added when chapters split across episodes to preserve flawless listening flow.
              </p>
            </div>
            <span className="text-[10px] text-blue-400 font-mono mt-3">Seamless Transitions</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs mb-3">
                05
              </div>
              <h3 className="font-semibold text-zinc-200 text-sm mb-1 flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-orange-400" />
                Studio Export & TTS
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Exact prompt format, individual TXT/MD/SRT downloads, live voice preview, and full Audiobook ZIP bundle.
              </p>
            </div>
            <span className="text-[10px] text-orange-400 font-mono mt-3">Ready-to-Narrate</span>
          </div>
        </div>
      </div>

      {/* Instant Demo Books Selection */}
      <div className="relative z-10 border-t border-zinc-800/80 pt-6 mt-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="text-xs uppercase tracking-wider font-mono text-zinc-300 font-semibold">
              Or Test Instantly with Curated Sample Books
            </span>
          </div>
          <span className="text-xs text-zinc-500">Click any title to load immediately</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SAMPLE_BOOKS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onSelectSampleBook(sample)}
              className="text-left p-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-800 hover:border-amber-500/40 transition group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-amber-400/90 font-medium mb-1">
                  <span>{sample.genre.split('&')[0]}</span>
                  <span className="text-zinc-500 font-mono text-[11px]">
                    ~{sample.expectedEpisodes} Episodes (10m)
                  </span>
                </div>
                <h4 className="font-semibold text-sm text-zinc-100 group-hover:text-amber-300 transition">
                  {sample.title}
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">by {sample.author}</p>
                <p className="text-[11px] text-zinc-500 line-clamp-2 mt-2 leading-relaxed">
                  {sample.description}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400 font-mono border-t border-zinc-800/70 pt-2.5 mt-3">
                <span className="text-zinc-400 text-[11px]">{sample.wordCount.toLocaleString()} words</span>
                <span className="inline-flex items-center gap-1 text-amber-400 group-hover:translate-x-0.5 transition text-xs font-sans font-medium">
                  Load Manuscript <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
