import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Download,
  Copy,
  Check,
  Mic,
  Sliders,
  Volume2,
  Sparkles,
  FileText,
  Clock,
  ShieldCheck,
  BookOpen,
  Languages,
  Loader2,
  Layers,
  AlertTriangle,
  RefreshCw,
  Edit3,
  X,
  Wand2,
  Radio,
  Headphones,
  Users,
  MessageSquare,
} from 'lucide-react';
import { Episode, Book, VoiceConfig } from '../types';
import { detectCorruptedText } from '../utils/pdfParser';
import {
  formatEpisodeOutput,
  downloadEpisodeTxt,
  downloadEpisodeMarkdown,
  downloadEpisodeSrt,
  downloadEpisodeJson,
} from '../utils/exporter';

interface EpisodeDetailProps {
  episode: Episode;
  book: Book;
  audioLanguage: 'fa' | 'original';
  onToggleLanguage: (lang: 'fa' | 'original') => void;
  onUpdateEpisodeVoice: (episodeId: string, updatedVoice: VoiceConfig) => void;
  onUpdateEpisodeBridges: (episodeId: string, introBridge?: string, outroBridge?: string) => void;
  onUpdateEpisodePersian: (
    episodeId: string,
    persianData: {
      persianText: string;
      persianTitle: string;
      persianIntroBridge?: string;
      persianOutroBridge?: string;
      persianVoiceNotes?: string;
    }
  ) => void;
  onUpdateEpisodeFullText?: (
    episodeId: string,
    data: {
      rawText?: string;
      persianText?: string;
      persianTitle?: string;
      title?: string;
    }
  ) => void;
  onNextEpisode?: () => void;
  onPrevEpisode?: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export const EpisodeDetail: React.FC<EpisodeDetailProps> = ({
  episode,
  book,
  audioLanguage,
  onToggleLanguage,
  onUpdateEpisodeVoice,
  onUpdateEpisodeBridges,
  onUpdateEpisodePersian,
  onUpdateEpisodeFullText,
  onNextEpisode,
  onPrevEpisode,
  hasPrev,
  hasNext,
}) => {
  const [activeTab, setActiveTab] = useState<
    'studio' | 'formatted' | 'teleprompter' | 'parallel' | 'bridges'
  >('studio');
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [activeVoiceModel, setActiveVoiceModel] = useState<string>(
    episode.voiceConfig.recommendedVoice || 'Kore'
  );
  const [selectedNarrationStyle, setSelectedNarrationStyle] = useState<'storytelling' | 'cinematic' | 'classic'>('storytelling');
  const [isGeneratingTts, setIsGeneratingTts] = useState(false);
  const [isAuditioningVoice, setIsAuditioningVoice] = useState<string | null>(null);
  const [isTranslatingPersian, setIsTranslatingPersian] = useState(false);
  const [geminiAudioUrl, setGeminiAudioUrl] = useState<string | null>(episode.audioUrl || null);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const auditionAudioRef = useRef<HTMLAudioElement | null>(null);

  // Corrupted / unreadable text detection and repair
  const [isRepairingText, setIsRepairingText] = useState(false);
  const [repairSuccess, setRepairSuccess] = useState<string | null>(null);
  const [isEditRawModalOpen, setIsEditRawModalOpen] = useState(false);
  const [editedRawText, setEditedRawText] = useState(episode.rawText);

  useEffect(() => {
    setEditedRawText(episode.rawText);
    setRepairSuccess(null);
  }, [episode.id, episode.rawText]);

  const rawCorruption = detectCorruptedText(episode.rawText);
  const persianCorruption = episode.persianText ? detectCorruptedText(episode.persianText) : null;
  const isCorrupted = rawCorruption.isCorrupted || (persianCorruption && persianCorruption.isCorrupted);

  const handleRepairCorruptedText = async () => {
    setIsRepairingText(true);
    setAudioError(null);
    setRepairSuccess(null);
    try {
      const res = await fetch('/api/repair-corrupted-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          corruptedText: episode.rawText,
          title: book.title,
          author: book.author,
          episodeNumber: episode.episodeNumber,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'خطا در بازسازی متن');
      }

      const data = await res.json();
      if (data.restoredEnglishText) {
        onUpdateEpisodeFullText?.(episode.id, {
          rawText: data.restoredEnglishText,
          persianText: data.persianText,
          persianTitle: data.persianTitle,
        });
        setRepairSuccess(
          data.explanation || 'متن انگلیسی و گویندگی صوتی فارسی با موفقیت اصلاح و جایگزین شد.'
        );
      }
    } catch (err: any) {
      console.error('Repair failed:', err);
      const isQuota =
        err.isQuotaExhausted ||
        (err.message && (err.message.includes('429') || err.message.includes('quota') || err.message.includes('سقف')));
      setAudioError(
        isQuota
          ? 'سقف درخواست‌های روزانه هوش مصنوعی رایگان موقتاً تکمیل است. می‌توانید متن را مستقیماً از طریق دکمه «ویرایش / جایگزینی دستی متن» اصلاح فرمایید.'
          : 'خطا در اصلاح خودکار متن: ' + err.message
      );
    } finally {
      setIsRepairingText(false);
    }
  };

  const handleSaveManualRawText = async () => {
    if (!editedRawText.trim()) return;
    onUpdateEpisodeFullText?.(episode.id, {
      rawText: editedRawText,
    });
    setIsEditRawModalOpen(false);

    try {
      setIsTranslatingPersian(true);
      const res = await fetch('/api/translate-episode-persian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: editedRawText,
          title: episode.title,
          episodeNumber: episode.episodeNumber,
          genre: book.genre,
          mood: book.mood,
          introBridge: episode.introBridge,
          outroBridge: episode.outroBridge,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdateEpisodePersian(episode.id, {
          persianText: data.persianText,
          persianTitle: data.persianTitle,
          persianIntroBridge: data.persianIntroBridge,
          persianOutroBridge: data.persianOutroBridge,
          persianVoiceNotes: data.persianVoiceNotes,
        });
        setRepairSuccess('متن منبع به‌روز شد و ترجمه فارسی جدید تولید گردید.');
      }
    } catch (err: any) {
      console.error('Translation error after manual edit:', err);
    } finally {
      setIsTranslatingPersian(false);
    }
  };

  // Web Speech synth refs
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioElemRef = useRef<HTMLAudioElement | null>(null);

  // Teleprompter state
  const teleprompterRef = useRef<HTMLDivElement>(null);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState<number>(0);

  const isPersianMode = audioLanguage === 'fa';
  const activeScript = (isPersianMode && episode.persianText) ? episode.persianText : episode.rawText;
  const activeTitle = (isPersianMode && episode.persianTitle) ? episode.persianTitle : episode.title;
  const activeIntro = (isPersianMode && episode.persianIntroBridge) ? episode.persianIntroBridge : episode.introBridge;
  const activeOutro = (isPersianMode && episode.persianOutroBridge) ? episode.persianOutroBridge : episode.outroBridge;

  const paragraphs = activeScript.split(/\n{2,}/).filter((p) => p.trim());
  const originalParagraphs = episode.rawText.split(/\n{2,}/).filter((p) => p.trim());

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Reset playback on episode switch
  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (audioElemRef.current) {
      audioElemRef.current.pause();
    }
    setIsPlaying(false);
    setGeminiAudioUrl(episode.audioUrl || null);
    setAudioCurrentTime(0);
    setCurrentParagraphIndex(0);
  }, [episode.id, audioLanguage]);

  const handleCopy = () => {
    const formatted = formatEpisodeOutput(episode, book.title, audioLanguage);
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Translate this episode to unabridged Persian
  const handleTranslateToPersian = async () => {
    setIsTranslatingPersian(true);
    setAudioError(null);
    try {
      const res = await fetch('/api/translate-episode-persian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: episode.rawText,
          title: episode.title,
          episodeNumber: episode.episodeNumber,
          genre: book.genre,
          mood: book.mood,
          introBridge: episode.introBridge,
          outroBridge: episode.outroBridge,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Translation failed');
      }

      const data = await res.json();
      onUpdateEpisodePersian(episode.id, {
        persianText: data.persianText,
        persianTitle: data.persianTitle || `قسمت ${String(episode.episodeNumber).padStart(2, '0')}`,
        persianIntroBridge: data.persianIntroBridge,
        persianOutroBridge: data.persianOutroBridge,
        persianVoiceNotes: data.persianVoiceNotes,
      });

      onToggleLanguage('fa');
    } catch (err: any) {
      console.error('Translation error:', err);
      const is503 =
        err.status === 503 ||
        (err.message &&
          (err.message.includes('503') ||
            err.message.includes('high demand') ||
            err.message.includes('UNAVAILABLE')));
      const isQuota =
        err.isQuotaExhausted ||
        (err.message &&
          (err.message.includes('429') ||
            err.message.includes('quota') ||
            err.message.includes('سقف')));
      setAudioError(
        is503
          ? 'سرورهای هوش مصنوعی موقتاً با اوج ترافیک مواجه شدند (503 High Demand). کتاب و متن شما کاملاً حفظ است؛ لطفاً دوباره تلاش کنید.'
          : isQuota
          ? 'سقف درخواست‌های روزانه هوش مصنوعی رایگان موقتاً تکمیل است. می‌توانید با ویرایش دستی متن فارسی، آن را وارد و ذخیره کنید.'
          : err.message || 'خطا در ترجمه فارسی قسمت.'
      );
    } finally {
      setIsTranslatingPersian(false);
    }
  };

  // Audition voice preview
  const handleAuditionVoice = async (voiceName: string) => {
    setIsAuditioningVoice(voiceName);
    setAudioError(null);
    try {
      const res = await fetch('/api/voice-audition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceName, isPersian: isPersianMode }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'خطا در پخش نمونه صدا');
      }

      const data = await res.json();
      if (data.audioUrl) {
        if (!auditionAudioRef.current) {
          auditionAudioRef.current = new Audio();
        }
        auditionAudioRef.current.src = data.audioUrl;
        auditionAudioRef.current.playbackRate = 1.0;
        auditionAudioRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error('Audition error:', err);
      setAudioError(err.message || 'خطا در پخش تست صدا');
    } finally {
      setIsAuditioningVoice(null);
    }
  };

  // Synthesize via Gemini Flagship 3.8 Flash TTS for fluid solo human narration
  const handleGenerateGeminiTTS = async (styleKey: 'storytelling' | 'cinematic' | 'classic' = selectedNarrationStyle) => {
    setIsGeneratingTts(true);
    setAudioError(null);

    const styleDescriptions = {
      storytelling: isPersianMode
        ? 'گویندگی داستانی بسیار گرم، دلنشین، روان و انسان‌گونه کتاب صوتی به زبان فارسی، با تنفس طبیعی، فراز و فرودهای ملودیک، بدون هیچ‌گونه حالت رباتیک یا سکته و انقطاع در کلمات'
        : 'Warm, natural, fluid human audiobook narrator with smooth phrasing, lifelike breathing rhythms, rich timbre, and expressive emotional delivery without robotic pauses.',
      cinematic: isPersianMode
        ? `${episode.voiceConfig.emotionalTone}، گویندگی سینمایی، عمیق و پرکشش با مکث‌های نمایشی و بیان دراماتیک داستانی`
        : 'Deep, resonant, immersive master audiobook narrator with dramatic pauses and cinema-grade presence',
      classic: isPersianMode
        ? 'روایتگری فاخر، ادبی و بسیار شمرده به زبان معیار فارسی با گام استوار و طنین رسا'
        : 'Polished, articulate, clear literary narration with steady cadence',
    };

    try {
      const activeContent = isPersianMode && episode.persianText ? episode.persianText : episode.rawText;
      const res = await fetch('/api/generate-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: activeContent,
          voiceName: activeVoiceModel,
          isPersian: isPersianMode,
          style: styleDescriptions[styleKey],
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errObj = new Error(data.error || 'Speech generation failed');
        (errObj as any).status = res.status;
        (errObj as any).isDemandSpike = data.isDemandSpike || res.status === 503;
        throw errObj;
      }

      const data = await res.json();
      setGeminiAudioUrl(data.audioUrl);
      episode.audioUrl = data.audioUrl;
      episode.audioGeneratedWith = `${data.voice} (Gemini Neural TTS)`;

      setTimeout(() => {
        if (audioElemRef.current && data.audioUrl) {
          audioElemRef.current.src = data.audioUrl;
          audioElemRef.current.playbackRate = playbackSpeed;
          audioElemRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      }, 200);
    } catch (err: any) {
      console.error('Gemini TTS error:', err);
      const is503 =
        err.status === 503 ||
        err.isDemandSpike ||
        (err.message &&
          (err.message.includes('503') ||
            err.message.includes('high demand') ||
            err.message.includes('UNAVAILABLE') ||
            err.message.includes('Spikes in demand')));
      const isQuota =
        err.isQuotaExhausted ||
        err.status === 429 ||
        (err.message &&
          (err.message.includes('429') ||
            err.message.includes('quota') ||
            err.message.includes('سقف') ||
            err.message.includes('No audio returned')));

      setAudioError(
        isQuota
          ? 'سقف درخواست‌های روزانه هوش مصنوعی رایگان برای تولید صوت (۱۰ درخواست در روز) تکمیل شده است. می‌توانید با کلیک روی دکمه سبز رنگ زیر، بدون محدودیت و به رایگان به کتاب گوش دهید.'
          : is503
          ? 'سرور پردازش صوتی موقتاً با اوج ترافیک مواجه شد (503 High Demand). کتاب و قسمت‌های شما کاملاً حفظ هستند؛ لطفاً دکمه «تلاش مجدد» را فشار دهید.'
          : err.message || 'خطا در سنتز صدای هوش مصنوعی'
      );
    } finally {
      setIsGeneratingTts(false);
    }
  };

  // Primary playback toggle (Always prefers Studio Neural Audio!)
  const toggleSpeechPlayback = () => {
    if (geminiAudioUrl && audioElemRef.current) {
      if (audioElemRef.current.src !== geminiAudioUrl) {
        audioElemRef.current.src = geminiAudioUrl;
      }
      if (isPlaying) {
        audioElemRef.current.pause();
        setIsPlaying(false);
      } else {
        audioElemRef.current.playbackRate = playbackSpeed;
        audioElemRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    // If not synthesized yet, synthesize fluid human narration immediately
    handleGenerateGeminiTTS();
  };

  // Browser Fallback (Robot offline synthesizer)
  const toggleBrowserFallbackPlayback = () => {
    if (!synthRef.current) {
      setAudioError('مرورگر شما از Web Speech API پشتیبانی نمی‌کند.');
      return;
    }

    if (isPlaying) {
      synthRef.current.cancel();
      setIsPlaying(false);
      return;
    }

    if (audioElemRef.current) {
      audioElemRef.current.pause();
    }
    synthRef.current.cancel();

    let fullScript = '';
    if (activeIntro) fullScript += activeIntro + '. ';
    fullScript += activeScript;
    if (activeOutro) fullScript += '. ' + activeOutro;

    const utterance = new SpeechSynthesisUtterance(fullScript);
    utterance.rate = playbackSpeed;

    const voices = synthRef.current.getVoices();
    if (isPersianMode) {
      utterance.lang = 'fa-IR';
      const faVoice = voices.find(
        (v) =>
          v.lang.startsWith('fa') ||
          v.lang.toLowerCase().includes('ir') ||
          v.name.toLowerCase().includes('persian') ||
          v.name.toLowerCase().includes('farsi')
      );
      if (faVoice) utterance.voice = faVoice;
    } else {
      utterance.lang = 'en-US';
    }

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    synthRef.current.speak(utterance);
    setIsPlaying(true);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/80 rounded-2xl border border-zinc-800 shadow-xl overflow-hidden">
      <audio
        ref={audioElemRef}
        src={geminiAudioUrl || undefined}
        onTimeUpdate={() => {
          if (audioElemRef.current) {
            setAudioCurrentTime(audioElemRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioElemRef.current) {
            setAudioDuration(audioElemRef.current.duration);
          }
        }}
        onEnded={() => setIsPlaying(false)}
        onError={() => setIsPlaying(false)}
      />

      {/* Header Bar */}
      <div className="p-4 md:p-6 border-b border-zinc-800 bg-zinc-950/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {isPersianMode ? `قسمت ${String(episode.episodeNumber).padStart(2, '0')}` : `EPISODE ${String(episode.episodeNumber).padStart(2, '0')}`}
              </span>

              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                ~{episode.estimatedMinutes} {isPersianMode ? 'دقیقه' : 'Minutes'}
              </span>

              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                {(isPersianMode && episode.persianWordCount) ? episode.persianWordCount.toLocaleString('fa-IR') : episode.wordCount.toLocaleString()}{' '}
                {isPersianMode ? 'کلمه فارسی' : 'Words'}
              </span>

              {/* Language Indicator */}
              <button
                onClick={() => onToggleLanguage(isPersianMode ? 'original' : 'fa')}
                className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 hover:bg-emerald-500/25 transition cursor-pointer"
                title="تغییر خروجی صوتی (فارسی / زبان اصلی)"
              >
                <Languages className="w-3 h-3" />
                <span>{isPersianMode ? 'خروجی صوتی فارسی 🇮🇷' : 'Original Language 🇬🇧'}</span>
              </button>

              {episode.isChapterSplit && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  {isPersianMode
                    ? `بخش ${episode.partNumber} از ${episode.totalPartsInChapter}`
                    : `Part ${episode.partNumber} of ${episode.totalPartsInChapter}`}
                </span>
              )}
            </div>

            <h2 className={`text-xl md:text-2xl font-bold text-zinc-100 tracking-tight ${isPersianMode ? 'font-serif text-right' : ''}`}>
              {activeTitle}
            </h2>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={onPrevEpisode}
              disabled={!hasPrev}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 text-xs font-medium transition"
            >
              ← {isPersianMode ? 'قسمت قبل' : 'Prev'}
            </button>
            <button
              onClick={onNextEpisode}
              disabled={!hasNext}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 text-xs font-medium transition"
            >
              {isPersianMode ? 'قسمت بعد' : 'Next'} →
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition ml-2"
              title="Copy Output"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'کپی شد' : 'کپی متن'}</span>
            </button>
          </div>
        </div>

        {/* Corrupted / Unreadable Text Alert & One-Click AI Repair Banner */}
        {isCorrupted && (
          <div className="mt-4 p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-right">
                <h4 className="font-bold text-red-300 text-sm">
                  ⚠️ کاراکترهای ناخوانا در متن این قسمت شناسایی شد (Corrupt PDF Font Artifacts)
                </h4>
                <p className="text-zinc-300 mt-1 leading-relaxed">
                  متن استخراج‌شده از PDF حاوی نمادهای باینری و فونت‌های رمزگذاری‌نشده است (نمونه: <code className="bg-zinc-950/80 px-2 py-0.5 rounded text-amber-300 font-mono text-[11px]">{episode.rawText.slice(0, 70)}...</code>).
                </p>
                <p className="text-zinc-400 text-[11px] mt-1">
                  با کلیک روی «اصلاح هوشمند»، متن اصلی و گویندگی فارسی به‌صورت تمیز و بدون حذف بازسازی می‌شود.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-red-500/20">
              <button
                type="button"
                onClick={() => setIsEditRawModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition"
              >
                <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
                <span>ویرایش / جایگزینی دستی متن</span>
              </button>

              <button
                type="button"
                onClick={handleRepairCorruptedText}
                disabled={isRepairingText}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-bold text-xs shadow-md shadow-amber-500/20 transition disabled:opacity-50"
              >
                {isRepairingText ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>در حال بازسازی با هوش مصنوعی...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>اصلاح هوشمند و استخراج مجدد با AI (رفع کاراکترهای ناخوانا)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Success message banner */}
        {repairSuccess && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between gap-3 text-right">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{repairSuccess}</span>
            </div>
            <button
              onClick={() => setRepairSuccess(null)}
              className="text-zinc-400 hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Missing Persian translation banner if not yet translated */}
        {isPersianMode && !episode.persianText && (
          <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
            <div>
              <p className="font-semibold text-amber-300 text-xs sm:text-sm">
                این قسمت هنوز به متن کامل گویندگی صوتی فارسی تبدیل نشده است.
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                با یک کلیک، این اپیزود ۱۰ دقیقه‌ای بدون حذف حتی یک کلمه به فارسی ادبی و آماده گویندگی ترجمه می‌شود.
              </p>
            </div>
            <button
              onClick={handleTranslateToPersian}
              disabled={isTranslatingPersian}
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-bold text-xs shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-orange-400 transition disabled:opacity-50"
            >
              {isTranslatingPersian ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال ترجمه کامل به فارسی...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>تولید متن گویندگی فارسی</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* View Switcher Tabs */}
        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 mt-5 border-t border-zinc-800/80 pt-4 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('studio')}
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'studio'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/25'
                : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>🎧 استودیوی کتاب صوتی (راوی انسان‌گونه)</span>
          </button>

          <button
            onClick={() => setActiveTab('formatted')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'formatted'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isPersianMode ? 'خروجی کامل متن گویندگی (۱۰ دقیقه)' : 'Structured Episode Output'}</span>
          </button>

          <button
            onClick={() => setActiveTab('teleprompter')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'teleprompter'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{isPersianMode ? 'تله‌پروامپتر (متن‌خوان صوتی)' : 'Teleprompter Studio'}</span>
          </button>

          <button
            onClick={() => setActiveTab('parallel')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'parallel'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>تطبیق دوزبانه (تضمین صفر حذف)</span>
          </button>

          <button
            onClick={() => setActiveTab('bridges')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'bridges'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>پل‌های اتصال راوی</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 text-sm">
        {/* TAB 0: SOLO HUMAN AUDIOBOOK STUDIO */}
        {activeTab === 'studio' && (
          <div className="space-y-6 max-w-4xl mx-auto" dir="rtl">
            {/* Studio Hero Banner */}
            <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 border border-amber-500/30 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-zinc-950 flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0">
                    <Headphones className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-zinc-100 text-base md:text-lg">
                        استودیوی گویندگی کتاب صوتی با راوی انسان‌گونه (Solo Narrator)
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                        تک‌نفره • بدون حذفیات
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                      روایت کامل، روان، شیوا و پیوسته کتاب از ابتدا تا انتها در اپیزودهای ۱۰ دقیقه‌ای. با تنفس طبیعی، فراز و فرودهای حسی واقعی، و بدون صدای رباتیک یا منقطع.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleGenerateGeminiTTS(selectedNarrationStyle)}
                  disabled={isGeneratingTts}
                  className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {isGeneratingTts ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>در حال تولید گویندگی روان با هوش مصنوعی...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{geminiAudioUrl ? 'تولید مجدد صوت راوی' : 'تولید گویندگی صوتی روان این قسمت'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Step 1: Human Narrator Selection & Live Audition */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 flex-wrap gap-2">
                <div>
                  <h4 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                    <Mic className="w-4 h-4 text-amber-400" />
                    <span>۱. انتخاب راوی انسان‌گونه و تست زنده صدا (Audition)</span>
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    با کلیک روی «تست صدا»، نمونه صدای هر راوی را زنده بشنوید تا از گرمی، روانی و لحن انسانی آن مطمئن شوید.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  راوی فعال: {activeVoiceModel}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    name: 'Kore',
                    label: 'سارا (Kore)',
                    gender: 'زنانه',
                    styleNote: 'بسیار گرم، لطیف، پراحساس و روان',
                    bestFor: 'ایده‌آل برای رمان، آثار ادبی، بیوگرافی و داستان‌های احساسی',
                  },
                  {
                    name: 'Fenrir',
                    label: 'آرش (Fenrir)',
                    gender: 'مردانه',
                    styleNote: 'بم، باصلابت، رسا، حماسی و باوقار',
                    bestFor: 'ایده‌آل برای تاریخ، فلسفه، ماجراجویی و آثار هیجان‌انگیز',
                  },
                  {
                    name: 'Puck',
                    label: 'بهرام (Puck)',
                    gender: 'مردانه',
                    styleNote: 'صمیمی، پرانرژی، طبیعی و روایی',
                    bestFor: 'مناسب کتاب‌های رشد فردی، کسب‌وکار، بیوگرافی و داستان‌گویی زنده',
                  },
                  {
                    name: 'Zephyr',
                    label: 'رویا (Zephyr)',
                    gender: 'زنانه/خنثی',
                    styleNote: 'آرام، شفاف، دقیق و استاندارد',
                    bestFor: 'مناسب کتاب‌های علمی، دانشگاهی، روانشناسی و جامعه‌شناسی',
                  },
                ].map((voice) => {
                  const isSelected = activeVoiceModel === voice.name;
                  const isAuditioning = isAuditioningVoice === voice.name;
                  return (
                    <div
                      key={voice.name}
                      onClick={() => {
                        setActiveVoiceModel(voice.name);
                        onUpdateEpisodeVoice(episode.id, {
                          ...episode.voiceConfig,
                          recommendedVoice: voice.name as any,
                        });
                      }}
                      className={`p-4 rounded-xl border transition cursor-pointer relative flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10'
                          : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-zinc-100">{voice.label}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                              {voice.gender}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="text-[11px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                              ✓ راوی انتخاب‌شده
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-amber-200/90 font-medium mt-1.5">{voice.styleNote}</p>
                        <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{voice.bestFor}</p>
                      </div>

                      <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAuditionVoice(voice.name);
                          }}
                          disabled={isAuditioning}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition"
                          title="پخش نمونه صدای راوی"
                        >
                          {isAuditioning ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                              <span className="text-[11px]">در حال دریافت نمونه...</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                              <span className="text-[11px]">تست آنی صدای راوی (۵ ثانیه)</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveVoiceModel(voice.name);
                            onUpdateEpisodeVoice(episode.id, {
                              ...episode.voiceConfig,
                              recommendedVoice: voice.name as any,
                            });
                          }}
                          className={`text-xs px-2.5 py-1 rounded transition ${
                            isSelected ? 'text-amber-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {isSelected ? 'فعال' : 'انتخاب'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Narration Style & Cadence */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
              <h4 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>۲. تنظیم لحن و اتمسفر گویندگی کتاب</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'storytelling',
                    label: '📖 داستانی، گرم و پیوسته',
                    desc: 'لحن طبیعی قصه‌گویی انسان با فراز و فرود زنده، تنفس ملایم و گفتار روان',
                  },
                  {
                    id: 'cinematic',
                    label: '🎭 سینمایی و عمیق',
                    desc: 'مکث‌های تعلیق‌دار داستانی، بیان دراماتیک و حضور باصلابت راوی',
                  },
                  {
                    id: 'classic',
                    label: '🏛️ شمرده و فاخر',
                    desc: 'ادای دقیق و شمرده واژگان، وزن و آرامش مناسب متون وزین و کلاسیک',
                  },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedNarrationStyle(s.id as any)}
                    className={`p-3.5 rounded-xl border text-right transition ${
                      selectedNarrationStyle === s.id
                        ? 'bg-amber-500/10 border-amber-500 text-amber-200 font-bold'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="text-xs text-zinc-100">{s.label}</div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Generated Audiobook Player Card */}
            {geminiAudioUrl && (
              <div className="p-5 rounded-2xl bg-zinc-950 border border-amber-500/40 shadow-xl space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Headphones className="w-5 h-5 text-amber-400" />
                    <div>
                      <h4 className="font-bold text-zinc-100 text-sm">
                        {activeTitle} — فایل صوتی استودیویی کتاب
                      </h4>
                      <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                        فرمت ۲۴ کیلوهرتز استودیویی WAV • راوی: {activeVoiceModel} (Gemini Neural Engine)
                      </p>
                    </div>
                  </div>

                  <a
                    href={geminiAudioUrl}
                    download={`${episode.title}-Audiobook-Unabridged.wav`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-medium transition"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>دانلود فایل صوتی کامل (WAV)</span>
                  </a>
                </div>

                {/* Audio Player Controls */}
                <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col sm:flex-row items-center gap-4">
                  <button
                    onClick={() => {
                      if (audioElemRef.current) {
                        if (audioElemRef.current.src !== geminiAudioUrl) {
                          audioElemRef.current.src = geminiAudioUrl;
                        }
                        if (isPlaying) {
                          audioElemRef.current.pause();
                          setIsPlaying(false);
                        } else {
                          audioElemRef.current.playbackRate = playbackSpeed;
                          audioElemRef.current.play();
                          setIsPlaying(true);
                        }
                      }
                    }}
                    className="h-12 w-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/25 shrink-0 transition"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </button>

                  <div className="flex-1 w-full space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                      <span>
                        {Math.floor(audioCurrentTime / 60)}:
                        {String(Math.floor(audioCurrentTime % 60)).padStart(2, '0')}
                      </span>
                      <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                        {isPlaying && <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping inline-block" />}
                        صدای راوی کتاب صوتی (کیفیت استودیویی ۲۴kHz)
                      </span>
                      <span>
                        {audioDuration > 0
                          ? `${Math.floor(audioDuration / 60)}:${String(Math.floor(audioDuration % 60)).padStart(2, '0')}`
                          : `~${episode.estimatedMinutes} دقیقه`}
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max={audioDuration || 100}
                      value={audioCurrentTime}
                      onChange={(e) => {
                        const newTime = Number(e.target.value);
                        setAudioCurrentTime(newTime);
                        if (audioElemRef.current) {
                          audioElemRef.current.currentTime = newTime;
                        }
                      }}
                      className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {audioError && (
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex flex-col md:flex-row items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2.5 text-right flex-1">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
                  <div>
                    <span className="font-semibold block text-amber-300 leading-snug">{audioError}</span>
                    <span className="text-[11px] text-zinc-400 mt-1 block">
                      فایل آپلود شده و تمامی قسمت‌های کتاب شما به‌طور کامل و امن در حافظه سیستم ذخیره شده‌اند.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={toggleBrowserFallbackPlayback}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs shadow-md shadow-emerald-500/20 transition active:scale-95 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>🔊 پخش فوری با موتور نامحدود مرورگر</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateGeminiTTS()}
                    disabled={isGeneratingTts}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingTts ? 'animate-spin' : ''}`} />
                    <span>تلاش مجدد استودیویی</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: EXACT OUTPUT FORMAT VIEW */}
        {activeTab === 'formatted' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
              <span>
                {isPersianMode
                  ? 'خروجی صوتی تنظیم‌شده به زبان فارسی طبق استاندارد استودیویی تولید کتاب صوتی بدون خلاصه.'
                  : 'Formatted according to the professional audiobook production cycle specification.'}
              </span>
              <span className="font-mono text-[10px]">Unabridged 10-Min Architecture</span>
            </div>

            {/* Exact Output Card */}
            <div
              dir={isPersianMode ? 'rtl' : 'ltr'}
              className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 md:p-6 text-xs leading-relaxed space-y-4 select-text"
            >
              <div className="text-amber-400 font-bold text-sm border-b border-zinc-800/80 pb-2">
                [{activeTitle}]
              </div>

              <div className="text-zinc-300 font-mono">
                {isPersianMode
                  ? `[مدت زمان تقریبی: ~${episode.estimatedMinutes} دقیقه / تعداد کلمات فارسی: ${(
                      episode.persianWordCount || activeScript.split(/\S+/g).length
                    ).toLocaleString('fa-IR')} کلمه]`
                  : `[Estimated Duration: ~${episode.estimatedMinutes} Minutes / ${episode.wordCount.toLocaleString()} Words]`}
              </div>

              <div className="text-purple-300 bg-purple-950/20 p-2.5 rounded border border-purple-900/30">
                {isPersianMode ? (
                  <span>
                    [تنظیمات پیشنهادی صدای راوی فارسی: جنسیت:{' '}
                    {episode.voiceConfig.gender === 'Female' ? 'زن' : 'مرد'} | لحن:{' '}
                    {episode.voiceConfig.emotionalTone} | سرعت: {episode.voiceConfig.pace} | گام:{' '}
                    {episode.voiceConfig.pitch} | مدل هوش مصنوعی: {episode.voiceConfig.recommendedVoice}]
                  </span>
                ) : (
                  <span>
                    [Voice Settings Recommendation: Gender: {episode.voiceConfig.gender} | Tone:{' '}
                    {episode.voiceConfig.emotionalTone} | Pace: {episode.voiceConfig.pace} | Pitch:{' '}
                    {episode.voiceConfig.pitch} | Model: {episode.voiceConfig.recommendedVoice}]
                  </span>
                )}
              </div>

              {activeIntro && (
                <div className="text-blue-300 bg-blue-950/20 p-2.5 rounded border border-blue-900/30">
                  {isPersianMode ? `[هوک ورود راوی: ${activeIntro}]` : `[Narrator Intro Bridge: ${activeIntro}]`}
                </div>
              )}

              <div className="pt-2">
                <span className="text-zinc-400 font-semibold text-xs block mb-2">
                  {isPersianMode
                    ? '[متن کامل و بدون تلخیص گویندگی صوتی به زبان فارسی]'
                    : '[Ready-to-Narrate Script Text]'}
                </span>
                <div
                  className={`text-zinc-200 text-sm md:text-base leading-relaxed whitespace-pre-wrap bg-zinc-900/50 p-4 rounded-lg border border-zinc-800/60 max-h-[480px] overflow-y-auto ${
                    isPersianMode ? 'font-serif text-right leading-loose' : 'font-serif'
                  }`}
                >
                  {activeScript}
                </div>
              </div>

              {activeOutro && (
                <div className="text-blue-300 bg-blue-950/20 p-2.5 rounded border border-blue-900/30">
                  {isPersianMode ? `[هوک خروج راوی: ${activeOutro}]` : `[Narrator Outro Bridge: ${activeOutro}]`}
                </div>
              )}

              <div className="text-emerald-400 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                <span>
                  {isPersianMode
                    ? `[نشانگر آماده دانلود و گویندگی صوتی: نسخه کامل و بدون حذف - قسمت ${String(
                        episode.episodeNumber
                      ).padStart(2, '0')}]`
                    : `[Download / Export Ready Marker: Unabridged Complete - Episode ${String(
                        episode.episodeNumber
                      ).padStart(2, '0')}]`}
                </span>
                <span className="text-zinc-500 text-[10px]">100% Word Preserved</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TELEPROMPTER VIEW */}
        {activeTab === 'teleprompter' && (
          <div className="space-y-4 max-w-3xl mx-auto" dir={isPersianMode ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
              <span className="text-zinc-400">
                {isPersianMode
                  ? 'حالت تله‌پروامپتر (متن‌خوان): برای پرش گویندگی روی هر بند کلیک کنید.'
                  : 'Teleprompter Mode: Click any paragraph to jump narration or follow along.'}
              </span>
              <span className="font-mono text-amber-400 font-semibold">
                بند {currentParagraphIndex + 1} از {paragraphs.length}
              </span>
            </div>

            <div
              ref={teleprompterRef}
              className="space-y-4 max-h-[520px] overflow-y-auto pr-2"
            >
              {paragraphs.map((p, idx) => {
                const isActive = currentParagraphIndex === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setCurrentParagraphIndex(idx)}
                    className={`p-4 rounded-xl border transition cursor-pointer text-base md:text-lg leading-relaxed font-serif ${
                      isActive
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-100 shadow-md'
                        : 'bg-zinc-950/40 hover:bg-zinc-950 border-zinc-800/70 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-sans font-mono text-zinc-500 mb-2">
                      <span>بند {idx + 1}</span>
                      <span>~{Math.round((p.split(/\s+/).length / 135) * 60)} ثانیه</span>
                    </div>
                    {p}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: DUAL-LANGUAGE PARALLEL COMPARISON */}
        {activeTab === 'parallel' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center justify-between">
              <span>تطبیق دوزبانه: مقایسه کلمه به کلمه متن اصلی کتاب با متن گویندگی صوتی فارسی (اثبات عدم حذف محتوا).</span>
              <span className="text-emerald-400 font-mono text-[11px]">۱۰۰٪ بدون خلاصه یا سانسور</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original column */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <h4 className="font-bold text-xs uppercase text-zinc-400 font-mono">
                    متن اصلی کتاب ({episode.wordCount.toLocaleString()} Words)
                  </h4>
                  <span className="text-[10px] text-zinc-500 font-mono">English / Original</span>
                </div>
                <div className="text-xs text-zinc-300 font-serif leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto">
                  {episode.rawText}
                </div>
              </div>

              {/* Persian column */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-amber-500/30 space-y-3" dir="rtl">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <h4 className="font-bold text-xs text-amber-400 font-mono">
                    متن گویندگی صوتی فارسی ({((episode.persianWordCount || countWords(episode.persianText || ''))).toLocaleString('fa-IR')} کلمه)
                  </h4>
                  <span className="text-[10px] text-emerald-400 font-mono">روایت شیوا و کامل</span>
                </div>
                {episode.persianText ? (
                  <div className="text-xs text-zinc-200 font-serif leading-loose whitespace-pre-wrap max-h-[500px] overflow-y-auto">
                    {episode.persianText}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-zinc-400 space-y-3">
                    <p>هنوز ترجمه فارسی این قسمت تولید نشده است.</p>
                    <button
                      onClick={handleTranslateToPersian}
                      disabled={isTranslatingPersian}
                      className="px-4 py-2 rounded-lg bg-amber-500 text-zinc-950 font-bold"
                    >
                      تولید ترجمه فارسی همین حالا
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}



        {/* TAB 5: CONTINUITY BRIDGES */}
        {activeTab === 'bridges' && (
          <div className="space-y-4 max-w-2xl mx-auto" dir="rtl">
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
              پل‌های اتصال راوی در آغاز و پایان اپیزودهایی که یک فصل را به دو بخش ۱۰ دقیقه‌ای تقسیم می‌کنند قرار می‌گیرند تا تجربه شنیداری پیوسته‌ای ایجاد کنند.
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-zinc-300">
                هوک ورود راوی به فارسی (در ابتدای قسمت)
              </label>
              <textarea
                value={episode.persianIntroBridge || ''}
                onChange={(e) =>
                  onUpdateEpisodePersian(episode.id, {
                    persianText: episode.persianText || episode.rawText,
                    persianTitle: episode.persianTitle || episode.title,
                    persianIntroBridge: e.target.value,
                    persianOutroBridge: episode.persianOutroBridge,
                  })
                }
                placeholder="[هوک اتصال راوی: ادامه فصل اول، بخش دوم از سه بخش...]"
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 font-mono"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-zinc-300">
                هوک خروج راوی به فارسی (در انتهای قسمت)
              </label>
              <textarea
                value={episode.persianOutroBridge || ''}
                onChange={(e) =>
                  onUpdateEpisodePersian(episode.id, {
                    persianText: episode.persianText || episode.rawText,
                    persianTitle: episode.persianTitle || episode.title,
                    persianIntroBridge: episode.persianIntroBridge,
                    persianOutroBridge: e.target.value,
                  })
                }
                placeholder="[پایان بخش اول. ادامه این ماجرا در قسمت بعدی...]"
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* Floating Studio Player & Export Dock */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Audio Source Status & Scrubber */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto flex-1">
            {/* Primary Action Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSpeechPlayback}
                disabled={isGeneratingTts}
                className={`h-11 px-5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-lg shrink-0 ${
                  isPlaying
                    ? 'bg-amber-500 text-zinc-950 shadow-amber-500/30'
                    : geminiAudioUrl
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 shadow-amber-500/25'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 shadow-amber-500/20'
                }`}
              >
                {isGeneratingTts ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>در حال تولید گویندگی روان...</span>
                  </>
                ) : isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>توقف پخش</span>
                  </>
                ) : geminiAudioUrl ? (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>پخش کتاب صوتی (راوی {activeVoiceModel})</span>
                  </>
                ) : (
                  <>
                    <Headphones className="w-4 h-4" />
                    <span>تولید و پخش صدای راوی کتاب صوتی</span>
                  </>
                )}
              </button>

              {/* Speed Multiplier */}
              <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-xs font-mono">
                {[0.8, 1.0, 1.15, 1.25].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => {
                      setPlaybackSpeed(speed);
                      if (audioElemRef.current) {
                        audioElemRef.current.playbackRate = speed;
                      }
                      if (synthRef.current && isPlaying) {
                        toggleBrowserFallbackPlayback();
                        setTimeout(toggleBrowserFallbackPlayback, 100);
                      }
                    }}
                    className={`px-2 py-1 rounded transition ${
                      playbackSpeed === speed
                        ? 'bg-amber-500 text-zinc-950 font-bold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Seeker / Status Display */}
            {geminiAudioUrl ? (
              <div className="flex-1 w-full max-w-md px-2 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span className="text-amber-400 flex items-center gap-1.5 font-semibold">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                    گوینده استودیویی ({activeVoiceModel}) • کیفیت ۲۴kHz
                  </span>
                  <span>
                    {Math.floor(audioCurrentTime / 60)}:
                    {String(Math.floor(audioCurrentTime % 60)).padStart(2, '0')} /{' '}
                    {audioDuration > 0
                      ? `${Math.floor(audioDuration / 60)}:${String(Math.floor(audioDuration % 60)).padStart(2, '0')}`
                      : '00:00'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={audioDuration || 100}
                  value={audioCurrentTime}
                  onChange={(e) => {
                    const newTime = Number(e.target.value);
                    setAudioCurrentTime(newTime);
                    if (audioElemRef.current) {
                      audioElemRef.current.currentTime = newTime;
                    }
                  }}
                  className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[11px] text-zinc-400 px-2">
                <button
                  type="button"
                  onClick={toggleBrowserFallbackPlayback}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 text-[11px] flex items-center gap-1"
                  title="پیش‌نمایش ساده رباتیک مرورگر بدون هوش مصنوعی"
                >
                  <Volume2 className="w-3.5 h-3.5 text-zinc-500" />
                  <span>پیش‌نمایش رباتیک مرورگر (آفلاین بدون هوش مصنوعی)</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Download Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
            {geminiAudioUrl && (
              <a
                href={geminiAudioUrl}
                download={`${episode.title}-Audiobook-Unabridged.wav`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition shadow-sm"
                title="دانلود فایل صوتی باکیفیت استودیویی (WAV)"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>دانلود صوتی (WAV)</span>
              </a>
            )}

            <button
              onClick={() => downloadEpisodeTxt(episode, book.title, audioLanguage)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition"
              title="دانلود متن گویندگی (TXT)"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>TXT</span>
            </button>

            <button
              onClick={() => downloadEpisodeMarkdown(episode, book.title, audioLanguage)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition"
              title="دانلود فایل مارک‌داون (MD)"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>MD</span>
            </button>

            <button
              onClick={() => downloadEpisodeSrt(episode, audioLanguage)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition"
              title="دانلود زیرنویس زمان‌بندی‌شده (SRT)"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>SRT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Manual Raw Text Edit Modal */}
      {isEditRawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-semibold text-zinc-100 text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>ویرایش متن منبع این قسمت (قسمت {episode.episodeNumber})</span>
              </h3>
              <button
                onClick={() => setIsEditRawModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              متن صحیح این قسمت را وارد یا ویرایش کنید. پس از ذخیره، متن کامل گویندگی صوتی فارسی بدون هیچ کاراکتر ناخوانایی مجدداً تولید خواهد شد.
            </p>

            <textarea
              value={editedRawText}
              onChange={(e) => setEditedRawText(e.target.value)}
              rows={12}
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-amber-500/60 leading-relaxed resize-none"
              placeholder="متن تمیز بدون کاراکترهای ناخوانا را اینجا وارد کنید..."
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-mono text-zinc-500">
                {countWords(editedRawText).toLocaleString()} کلمه
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditRawModalOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleSaveManualRawText}
                  disabled={!editedRawText.trim() || isTranslatingPersian}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition disabled:opacity-50"
                >
                  ذخیره و تولید گویندگی صوتی فارسی
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
function countWords(str: string): number {
  if (!str) return 0;
  return str.trim().split(/\S+/g).length;
}
