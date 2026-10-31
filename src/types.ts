export interface VoiceConfig {
  gender: 'Male' | 'Female' | 'Gender-Neutral';
  pitch: string; // e.g. "Mid-Low (-1.5 st)"
  pace: string; // e.g. "135 - 145 WPM (Moderate)"
  emotionalTone: string; // e.g. "Warm, measured, suspenseful"
  recommendedVoice: 'Zephyr' | 'Kore' | 'Puck' | 'Fenrir' | 'Charon';
  geminiVoice?: string;
  elevenLabsSuggestion?: string;
  azureVoice?: string;
  productionNotes?: string;
}

export interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  persianTitle?: string;
  chapterTitle?: string;
  isChapterStart: boolean;
  isChapterEnd: boolean;
  isChapterSplit: boolean;
  partNumber?: number;
  totalPartsInChapter?: number;
  wordCount: number;
  persianWordCount?: number;
  estimatedMinutes: number; // e.g. 9.8 or 10.2
  rawText: string;
  persianText?: string;
  introBridge?: string;
  outroBridge?: string;
  persianIntroBridge?: string;
  persianOutroBridge?: string;
  voiceConfig: VoiceConfig;
  status: 'ready' | 'processing' | 'generating_audio';
  audioUrl?: string;
  audioGeneratedWith?: string;
  podcastAudioUrl?: string;
  podcastGeneratedWith?: string;
  podcastDialogue?: Array<{
    speaker: string;
    name: string;
    text: string;
  }>;
  isTranslatingToPersian?: boolean;
}

export interface Book {
  id: string;
  title: string;
  persianTitle?: string;
  author: string;
  genre: string;
  mood: string;
  totalWords: number;
  totalCharacters: number;
  rawText: string;
  episodes: Episode[];
  globalVoiceConfig: VoiceConfig;
  integrityVerified: boolean;
  createdAt: string;
  fileName?: string;
  audioLanguage: 'fa' | 'original'; // Default 'fa' (Persian)
  isUserUploaded?: boolean;
}

export interface SegmentationSettings {
  targetWordsPerEpisode: number; // default ~1350 words (approx 10 minutes at 135-140 WPM)
  minWordsPerEpisode: number; // 1150
  maxWordsPerEpisode: number; // 1550
  preferredWpm: number; // 135
  preserveOriginalParagraphs: boolean;
  generateBridges: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  relatedEpisodeId?: string;
}
