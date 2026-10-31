import React, { useState } from 'react';
import {
  Play,
  Download,
  FileText,
  Clock,
  Mic,
  ArrowRight,
  Sparkles,
  Search,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Episode, Book } from '../types';
import { detectCorruptedText } from '../utils/pdfParser';
import { downloadEpisodeTxt, downloadEpisodeMarkdown } from '../utils/exporter';

interface EpisodeListProps {
  book: Book;
  selectedEpisode: Episode;
  onSelectEpisode: (episode: Episode) => void;
  onPlayEpisode: (episode: Episode) => void;
  isPlayingEpisodeId: string | null;
  audioLanguage: 'fa' | 'original';
}

export const EpisodeList: React.FC<EpisodeListProps> = ({
  book,
  selectedEpisode,
  onSelectEpisode,
  onPlayEpisode,
  isPlayingEpisodeId,
  audioLanguage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredEpisodes = book.episodes.filter(
    (ep) =>
      ep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ep.persianTitle && ep.persianTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      ep.rawText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ep.persianText && ep.persianText.toLowerCase().includes(searchQuery.toLowerCase())) ||
      String(ep.episodeNumber).includes(searchQuery)
  );

  const handleCopyScript = (episode: Episode, e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = audioLanguage === 'fa' && episode.persianText ? episode.persianText : episode.rawText;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(episode.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/60 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-950/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-zinc-100">Episode Production Queue</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {book.episodes.length} Episodes
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">~10 min each</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter episodes by chapter or content..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/60"
          />
        </div>
      </div>

      {/* Episode Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[750px]">
        {filteredEpisodes.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-500">
            No episodes matching "{searchQuery}"
          </div>
        ) : (
          filteredEpisodes.map((ep) => {
            const isSelected = selectedEpisode.id === ep.id;
            const isPlaying = isPlayingEpisodeId === ep.id;

            return (
              <div
                key={ep.id}
                onClick={() => onSelectEpisode(ep)}
                className={`group p-3.5 rounded-xl border transition cursor-pointer relative ${
                  isSelected
                    ? 'bg-zinc-800/90 border-amber-500/70 shadow-lg shadow-amber-500/5'
                    : 'bg-zinc-950/40 hover:bg-zinc-800/50 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                {/* Active selection accent line */}
                {isSelected && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-amber-500 rounded-r" />
                )}

                <div className="flex items-start justify-between gap-3 pl-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono font-bold text-amber-400">
                        EP {String(ep.episodeNumber).padStart(2, '0')}
                      </span>

                      {ep.isChapterSplit && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-500/15 text-blue-300 border border-blue-500/25">
                          Part {ep.partNumber}/{ep.totalPartsInChapter}
                        </span>
                      )}

                      {ep.introBridge && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-purple-500/15 text-purple-300 border border-purple-500/25">
                          +Intro Bridge
                        </span>
                      )}

                      {ep.persianText ? (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 flex items-center gap-0.5">
                          <span>🇮🇷</span> فارسی
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
                          نیاز به ترجمه
                        </span>
                      )}

                      {detectCorruptedText(ep.rawText).isCorrupted && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-0.5" title="کاراکترهای ناخوانا به دلیل فونت PDF">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          اصلاح متن
                        </span>
                      )}

                      {ep.audioUrl && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/25 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          صوت
                        </span>
                      )}
                    </div>

                    <h4 className={`font-semibold text-sm text-zinc-100 truncate group-hover:text-amber-300 transition ${
                      audioLanguage === 'fa' && ep.persianTitle ? 'font-serif text-amber-200' : ''
                    }`}>
                      {audioLanguage === 'fa' && ep.persianTitle ? ep.persianTitle : (ep.chapterTitle || ep.title)}
                    </h4>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono mt-1.5">
                      <span className="flex items-center gap-1 text-zinc-300">
                        <Clock className="w-3 h-3 text-amber-400/80" />
                        ~{ep.estimatedMinutes} min
                      </span>
                      <span>•</span>
                      <span>{ep.wordCount.toLocaleString()} words</span>
                      <span>•</span>
                      <span className="text-zinc-400">{ep.voiceConfig.recommendedVoice}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayEpisode(ep);
                      }}
                      className={`p-2 rounded-lg transition ${
                        isPlaying
                          ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/30'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white'
                      }`}
                      title={isPlaying ? 'Pause Narration' : 'Preview Episode Narration'}
                    >
                      <Play className={`w-3.5 h-3.5 ${isPlaying ? 'fill-zinc-950' : 'fill-current'}`} />
                    </button>

                    <button
                      onClick={(e) => handleCopyScript(ep, e)}
                      className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition"
                      title="Copy Ready-to-Narrate Script"
                    >
                      {copiedId === ep.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadEpisodeTxt(ep, book.title);
                      }}
                      className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition"
                      title="Download Episode TXT"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer stats */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950/60 text-xs text-zinc-400 flex items-center justify-between font-mono">
        <span>Target: 1,200 - 1,500 w</span>
        <span className="text-emerald-400 flex items-center gap-1 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Zero Omission
        </span>
      </div>
    </div>
  );
};
