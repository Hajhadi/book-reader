import React, { useState, useEffect } from 'react';
import { Book, Episode, VoiceConfig, SegmentationSettings } from './types';
import {
  segmentBookIntoEpisodes,
  DEFAULT_SEGMENTATION_SETTINGS,
  DEFAULT_VOICE_CONFIG,
  verifyManuscriptIntegrity,
  countWords,
} from './utils/segmenter';
import { SAMPLE_BOOKS, SampleBookItem } from './data/sampleBooks';
import { Navbar } from './components/Navbar';
import { WelcomeHero } from './components/WelcomeHero';
import { AudiobookSummaryCard } from './components/AudiobookSummaryCard';
import { EpisodeList } from './components/EpisodeList';
import { EpisodeDetail } from './components/EpisodeDetail';
import { UploadModal } from './components/UploadModal';
import { AIProducerChat } from './components/AIProducerChat';

const STORAGE_KEY = 'aethervox_active_book';

export default function App() {
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAnalyzingTone, setIsAnalyzingTone] = useState(false);
  const [playingEpisodeId, setPlayingEpisodeId] = useState<string | null>(null);
  const [audioLanguage, setAudioLanguage] = useState<'fa' | 'original'>('fa'); // Persian audio output default

  // Helper to persist current book to localStorage
  const saveBookToStorage = (book: Book) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(book));
    } catch (e) {
      console.warn('Could not save book to localStorage:', e);
    }
  };

  // Restore user's uploaded book on mount, or fallback to sample book if first visit
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: Book = JSON.parse(saved);
        if (parsed && parsed.episodes && parsed.episodes.length > 0) {
          setCurrentBook(parsed);
          setSelectedEpisode(parsed.episodes[0] || null);
          setAudioLanguage('fa');
          return;
        }
      }
    } catch (err) {
      console.warn('Error reading book from storage:', err);
    }

    // Default to first sample book only if no saved user book exists
    loadSampleBook(SAMPLE_BOOKS[0], false);
  }, []);

  const loadSampleBook = (sample: SampleBookItem, persist = true) => {
    const defaultVoice: VoiceConfig = {
      ...DEFAULT_VOICE_CONFIG,
      recommendedVoice: sample.recommendedVoice,
      gender: sample.recommendedVoice === 'Kore' ? 'Female' : 'Gender-Neutral',
    };

    const episodes = segmentBookIntoEpisodes(
      sample.text,
      sample.title,
      DEFAULT_SEGMENTATION_SETTINGS,
      defaultVoice,
      sample.persianText
    );

    const integrity = verifyManuscriptIntegrity(sample.text, episodes);

    const newBook: Book = {
      id: sample.id,
      title: sample.title,
      persianTitle: sample.persianTitle,
      author: sample.author,
      genre: sample.genre,
      mood: sample.mood,
      totalWords: countWords(sample.text),
      totalCharacters: sample.text.length,
      rawText: sample.text,
      episodes,
      globalVoiceConfig: defaultVoice,
      integrityVerified: integrity.isComplete,
      createdAt: new Date().toISOString(),
      audioLanguage: 'fa',
      isUserUploaded: false,
    };

    setCurrentBook(newBook);
    setSelectedEpisode(episodes[0] || null);
    setAudioLanguage('fa');

    if (persist) {
      saveBookToStorage(newBook);
    }
  };

  const handleProcessBook = async ({
    title,
    author,
    rawText,
    targetWords,
    fileName,
  }: {
    title: string;
    author: string;
    rawText: string;
    targetWords: number;
    fileName?: string;
  }) => {
    setIsAnalyzingTone(true);

    const settings: SegmentationSettings = {
      ...DEFAULT_SEGMENTATION_SETTINGS,
      targetWordsPerEpisode: targetWords,
      minWordsPerEpisode: Math.round(targetWords * 0.85),
      maxWordsPerEpisode: Math.round(targetWords * 1.15),
    };

    let voiceConfig: VoiceConfig = { ...DEFAULT_VOICE_CONFIG };

    // Request AI Tone & Voice analysis from server
    try {
      const res = await fetch('/api/analyze-tone-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          author,
          textSample: rawText.slice(0, 3500),
        }),
      });

      if (res.ok) {
        const analysis = await res.json();
        voiceConfig = {
          gender: analysis.gender || 'Gender-Neutral',
          pitch: analysis.pitch || 'Medium (0 st)',
          pace: analysis.pace || '135 - 145 WPM (Moderate)',
          emotionalTone: analysis.emotionalTone || 'Warm, clear narrative',
          recommendedVoice: analysis.recommendedVoice || 'Zephyr',
          elevenLabsSuggestion: analysis.ttsMapping?.elevenLabsSuggestion,
          azureVoice: analysis.ttsMapping?.azureVoice,
          productionNotes: analysis.productionNotes,
        };
      }
    } catch (err) {
      console.warn('Tone analysis fallback used:', err);
    } finally {
      setIsAnalyzingTone(false);
    }

    const episodes = segmentBookIntoEpisodes(rawText, title, settings, voiceConfig);
    const integrity = verifyManuscriptIntegrity(rawText, episodes);

    const isAlreadyPersian = /[\u0600-\u06FF]/.test(rawText.slice(0, 1000));

    // If the text is already Persian, populate persianText directly
    if (isAlreadyPersian) {
      episodes.forEach((ep) => {
        ep.persianText = ep.rawText;
        ep.persianTitle = ep.title;
        ep.persianWordCount = ep.wordCount;
      });
    }

    const newBook: Book = {
      id: `book-${Date.now()}`,
      title,
      persianTitle: isAlreadyPersian ? title : undefined,
      author,
      genre: 'Processed Manuscript',
      mood: voiceConfig.emotionalTone,
      totalWords: countWords(rawText),
      totalCharacters: rawText.length,
      rawText,
      episodes,
      globalVoiceConfig: voiceConfig,
      integrityVerified: integrity.isComplete,
      createdAt: new Date().toISOString(),
      fileName,
      audioLanguage: 'fa',
      isUserUploaded: true,
    };

    setCurrentBook(newBook);
    setSelectedEpisode(episodes[0] || null);
    setAudioLanguage('fa');
    saveBookToStorage(newBook);

    // If the manuscript was not in Persian, automatically translate Episode 1 to Persian in the background
    if (!isAlreadyPersian && episodes.length > 0) {
      const ep1 = episodes[0];
      try {
        const res = await fetch('/api/translate-episode-persian', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: ep1.rawText,
            title: ep1.title,
            episodeNumber: ep1.episodeNumber,
            genre: newBook.genre,
            mood: newBook.mood,
            introBridge: ep1.introBridge,
            outroBridge: ep1.outroBridge,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          handleUpdateEpisodePersian(ep1.id, {
            persianText: data.persianText,
            persianTitle: data.persianTitle || `قسمت ۰۱`,
            persianIntroBridge: data.persianIntroBridge,
            persianOutroBridge: data.persianOutroBridge,
          });
        }
      } catch (err) {
        console.warn('Auto translation of ep1 deferred to user action:', err);
      }
    }
  };

  const handleUpdateEpisodePersian = (
    episodeId: string,
    persianData: {
      persianText: string;
      persianTitle: string;
      persianIntroBridge?: string;
      persianOutroBridge?: string;
      persianVoiceNotes?: string;
    }
  ) => {
    if (!currentBook) return;

    const updatedEpisodes = currentBook.episodes.map((ep) =>
      ep.id === episodeId
        ? {
            ...ep,
            persianText: persianData.persianText,
            persianTitle: persianData.persianTitle,
            persianIntroBridge: persianData.persianIntroBridge,
            persianOutroBridge: persianData.persianOutroBridge,
            persianWordCount: countWords(persianData.persianText),
          }
        : ep
    );

    const updatedBook: Book = {
      ...currentBook,
      episodes: updatedEpisodes,
    };
    setCurrentBook(updatedBook);
    saveBookToStorage(updatedBook);

    if (selectedEpisode?.id === episodeId) {
      setSelectedEpisode({
        ...selectedEpisode,
        persianText: persianData.persianText,
        persianTitle: persianData.persianTitle,
        persianIntroBridge: persianData.persianIntroBridge,
        persianOutroBridge: persianData.persianOutroBridge,
        persianWordCount: countWords(persianData.persianText),
      });
    }
  };

  const handleUpdateEpisodeFullText = (
    episodeId: string,
    data: {
      rawText?: string;
      persianText?: string;
      persianTitle?: string;
      title?: string;
    }
  ) => {
    if (!currentBook) return;

    const updatedEpisodes = currentBook.episodes.map((ep) => {
      if (ep.id !== episodeId) return ep;
      const updatedRaw = data.rawText !== undefined ? data.rawText : ep.rawText;
      const updatedPersian = data.persianText !== undefined ? data.persianText : ep.persianText;
      return {
        ...ep,
        rawText: updatedRaw,
        wordCount: countWords(updatedRaw),
        persianText: updatedPersian,
        persianWordCount: updatedPersian ? countWords(updatedPersian) : ep.persianWordCount,
        title: data.title || ep.title,
        persianTitle: data.persianTitle || ep.persianTitle,
      };
    });

    const updatedBook: Book = {
      ...currentBook,
      episodes: updatedEpisodes,
    };
    setCurrentBook(updatedBook);
    saveBookToStorage(updatedBook);

    if (selectedEpisode?.id === episodeId) {
      const ep = updatedEpisodes.find((e) => e.id === episodeId);
      if (ep) setSelectedEpisode(ep);
    }
  };

  const handleReanalyzeTone = async () => {
    if (!currentBook) return;
    setIsAnalyzingTone(true);

    try {
      const res = await fetch('/api/analyze-tone-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentBook.title,
          author: currentBook.author,
          textSample: currentBook.rawText.slice(0, 3500),
        }),
      });

      if (res.ok) {
        const analysis = await res.json();
        const updatedVoice: VoiceConfig = {
          gender: analysis.gender || currentBook.globalVoiceConfig.gender,
          pitch: analysis.pitch || currentBook.globalVoiceConfig.pitch,
          pace: analysis.pace || currentBook.globalVoiceConfig.pace,
          emotionalTone: analysis.emotionalTone || currentBook.globalVoiceConfig.emotionalTone,
          recommendedVoice:
            analysis.recommendedVoice || currentBook.globalVoiceConfig.recommendedVoice,
          elevenLabsSuggestion: analysis.ttsMapping?.elevenLabsSuggestion,
          azureVoice: analysis.ttsMapping?.azureVoice,
          productionNotes: analysis.productionNotes,
        };

        const updatedEpisodes = currentBook.episodes.map((ep) => ({
          ...ep,
          voiceConfig: { ...updatedVoice },
        }));

        setCurrentBook({
          ...currentBook,
          genre: analysis.genre || currentBook.genre,
          mood: analysis.mood || currentBook.mood,
          globalVoiceConfig: updatedVoice,
          episodes: updatedEpisodes,
        });

        if (selectedEpisode) {
          const refreshed = updatedEpisodes.find((ep) => ep.id === selectedEpisode.id);
          if (refreshed) setSelectedEpisode(refreshed);
        }
      }
    } catch (err) {
      console.error('Failed to reanalyze tone:', err);
    } finally {
      setIsAnalyzingTone(false);
    }
  };

  const handleUpdateEpisodeVoice = (episodeId: string, updatedVoice: VoiceConfig) => {
    if (!currentBook) return;

    const updatedEpisodes = currentBook.episodes.map((ep) =>
      ep.id === episodeId ? { ...ep, voiceConfig: updatedVoice } : ep
    );

    setCurrentBook({
      ...currentBook,
      episodes: updatedEpisodes,
    });

    if (selectedEpisode?.id === episodeId) {
      setSelectedEpisode({ ...selectedEpisode, voiceConfig: updatedVoice });
    }
  };

  const handleUpdateEpisodeBridges = (
    episodeId: string,
    introBridge?: string,
    outroBridge?: string
  ) => {
    if (!currentBook) return;

    const updatedEpisodes = currentBook.episodes.map((ep) =>
      ep.id === episodeId ? { ...ep, introBridge, outroBridge } : ep
    );

    setCurrentBook({
      ...currentBook,
      episodes: updatedEpisodes,
    });

    if (selectedEpisode?.id === episodeId) {
      setSelectedEpisode({ ...selectedEpisode, introBridge, outroBridge });
    }
  };

  // Episode navigation
  const currentIndex = currentBook && selectedEpisode
    ? currentBook.episodes.findIndex((e) => e.id === selectedEpisode.id)
    : -1;

  const hasPrev = currentIndex > 0;
  const hasNext = currentBook ? currentIndex < currentBook.episodes.length - 1 : false;

  const handlePrevEpisode = () => {
    if (currentBook && hasPrev) {
      setSelectedEpisode(currentBook.episodes[currentIndex - 1]);
    }
  };

  const handleNextEpisode = () => {
    if (currentBook && hasNext) {
      setSelectedEpisode(currentBook.episodes[currentIndex + 1]);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950">
      {/* Top Navbar */}
      <Navbar
        currentBook={currentBook}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onToggleChat={() => setIsChatOpen((prev) => !prev)}
        isChatOpen={isChatOpen}
        audioLanguage={audioLanguage}
        onToggleLanguage={(lang) => setAudioLanguage(lang)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
        {/* Step-by-Step Onboarding Hero */}
        <WelcomeHero
          currentBook={currentBook}
          onOpenUpload={() => setIsUploadModalOpen(true)}
          onSelectSampleBook={loadSampleBook}
          onOpenChat={() => setIsChatOpen(true)}
        />

        {/* Active Audiobook Master Card */}
        {currentBook && (
          <AudiobookSummaryCard
            book={currentBook}
            onReanalyzeTone={handleReanalyzeTone}
            isAnalyzingTone={isAnalyzingTone}
            audioLanguage={audioLanguage}
            onToggleLanguage={(lang) => setAudioLanguage(lang)}
          />
        )}

        {/* Master Studio 2-Column Workstation */}
        {currentBook && selectedEpisode && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: 10-Min Episode Queue */}
            <div className="lg:col-span-4 xl:col-span-4">
              <EpisodeList
                book={currentBook}
                selectedEpisode={selectedEpisode}
                onSelectEpisode={(ep) => setSelectedEpisode(ep)}
                onPlayEpisode={(ep) => {
                  setSelectedEpisode(ep);
                  setPlayingEpisodeId((prev) => (prev === ep.id ? null : ep.id));
                }}
                isPlayingEpisodeId={playingEpisodeId}
                audioLanguage={audioLanguage}
              />
            </div>

            {/* Right Column: Full Episode Production Workspace */}
            <div className="lg:col-span-8 xl:col-span-8 min-h-[720px]">
              <EpisodeDetail
                episode={selectedEpisode}
                book={currentBook}
                audioLanguage={audioLanguage}
                onToggleLanguage={(lang) => setAudioLanguage(lang)}
                onUpdateEpisodeVoice={handleUpdateEpisodeVoice}
                onUpdateEpisodeBridges={handleUpdateEpisodeBridges}
                onUpdateEpisodePersian={handleUpdateEpisodePersian}
                onUpdateEpisodeFullText={handleUpdateEpisodeFullText}
                onPrevEpisode={handlePrevEpisode}
                onNextEpisode={handleNextEpisode}
                hasPrev={hasPrev}
                hasNext={hasNext}
              />
            </div>
          </div>
        )}
      </main>

      {/* Upload & Calibration Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onProcessBook={handleProcessBook}
        onSelectSample={loadSampleBook}
      />

      {/* AI Producer Assistant Conversational Panel */}
      <AIProducerChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentBook={currentBook}
        onOpenUpload={() => {
          setIsChatOpen(false);
          setIsUploadModalOpen(true);
        }}
      />
    </div>
  );
}
