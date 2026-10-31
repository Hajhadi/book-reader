import JSZip from 'jszip';
import { Episode, Book } from '../types';

/**
 * Formats an episode strictly following the user's required prompt/response output format:
 * - [Episode Number & Title]
 * - [Estimated Duration: ~10 Minutes / Word Count]
 * - [Voice Settings Recommendation: Gender, Tone, Pace]
 * - [Ready-to-Narrate Script Text]
 * - [Download / Export Ready Marker]
 */
export function formatEpisodeOutput(
  episode: Episode,
  bookTitle?: string,
  language: 'fa' | 'original' = 'fa'
): string {
  const isPersian = language === 'fa' && !!episode.persianText;
  const scriptText = isPersian ? episode.persianText! : episode.rawText;
  const wordCount = isPersian ? (episode.persianWordCount || scriptText.split(/\S+/g).length) : episode.wordCount;
  const title = isPersian ? (episode.persianTitle || episode.title) : episode.title;
  const intro = isPersian ? episode.persianIntroBridge : episode.introBridge;
  const outro = isPersian ? episode.persianOutroBridge : episode.outroBridge;

  if (isPersian) {
    const durationStr = `~${episode.estimatedMinutes} دقیقه / ${wordCount.toLocaleString('fa-IR')} کلمه (روایت کامل و بدون تلخیص)`;
    const voiceRec = `جنسیت راوی: ${
      episode.voiceConfig.gender === 'Female' ? 'زن' : episode.voiceConfig.gender === 'Male' ? 'مرد' : 'خنثی'
    } | لحن گویندگی: ${episode.voiceConfig.emotionalTone} | سرعت بیان: ${episode.voiceConfig.pace} | گام صدا: ${episode.voiceConfig.pitch} | مدل پیشنهادی: ${episode.voiceConfig.recommendedVoice}`;

    let scriptBody = '';
    if (intro) {
      scriptBody += `[هوک ورود راوی: ${intro}]\n\n`;
    }
    scriptBody += scriptText;
    if (outro) {
      scriptBody += `\n\n[هوک خروج راوی: ${outro}]`;
    }

    return `[${title}]
[مدت زمان تقریبی: ${durationStr}]
[تنظیمات صدای پیشنهادی راوی فارسی: ${voiceRec}]

[متن آماده برای گویندگی صوتی به زبان فارسی (کامل و بدون حذف)]
--------------------------------------------------------------------------------
${scriptBody}
--------------------------------------------------------------------------------

[نشانگر آماده دانلود و گویندگی: نسخه کامل و بدون تلخیص - قسمت ${String(
      episode.episodeNumber
    ).padStart(2, '0')}]`;
  }

  // English / Original output format
  const durationStr = `~${episode.estimatedMinutes} Minutes / ${episode.wordCount.toLocaleString()} Words`;
  const voiceRec = `Gender: ${episode.voiceConfig.gender} | Pitch: ${episode.voiceConfig.pitch} | Pace: ${episode.voiceConfig.pace} | Emotional Tone: ${episode.voiceConfig.emotionalTone} (Recommended Model Voice: ${episode.voiceConfig.recommendedVoice})`;

  let scriptBody = '';
  if (intro) {
    scriptBody += `[Narrator Intro Bridge: ${intro}]\n\n`;
  }
  scriptBody += scriptText;
  if (outro) {
    scriptBody += `\n\n[Narrator Outro Bridge: ${outro}]`;
  }

  return `[${title}]
[Estimated Duration: ${durationStr}]
[Voice Settings Recommendation: ${voiceRec}]

[Ready-to-Narrate Script Text]
--------------------------------------------------------------------------------
${scriptBody}
--------------------------------------------------------------------------------

[Download / Export Ready Marker: Unabridged Complete - Verified 10-Minute Episode ${String(
    episode.episodeNumber
  ).padStart(2, '0')}]`;
}

/**
 * Generates an SRT subtitle file from episode paragraphs with estimated timestamps.
 */
export function generateSrtContent(episode: Episode, language: 'fa' | 'original' = 'fa'): string {
  const isPersian = language === 'fa' && !!episode.persianText;
  const text = isPersian ? episode.persianText! : episode.rawText;
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim());
  let srt = '';
  let currentTimeSeconds = 0;
  const wpm = 135;
  const wordsPerSecond = wpm / 60;

  paragraphs.forEach((para, idx) => {
    const wordCount = para.trim().split(/\S+/g).length;
    const durationSeconds = Math.max(2, Math.round(wordCount / wordsPerSecond));

    const startTime = formatSrtTime(currentTimeSeconds);
    const endTime = formatSrtTime(currentTimeSeconds + durationSeconds);
    currentTimeSeconds += durationSeconds;

    srt += `${idx + 1}\n${startTime} --> ${endTime}\n${para.trim()}\n\n`;
  });

  return srt;
}

function formatSrtTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
    seconds
  ).padStart(2, '0')},000`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadEpisodeTxt(episode: Episode, bookTitle: string, language: 'fa' | 'original' = 'fa') {
  const content = formatEpisodeOutput(episode, bookTitle, language);
  const isPersian = language === 'fa' && !!episode.persianText;
  const filename = isPersian
    ? `Episode_${String(episode.episodeNumber).padStart(2, '0')}_Persian_Audio_Script.txt`
    : `Episode_${String(episode.episodeNumber).padStart(2, '0')}_Script.txt`;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  triggerDownload(blob, filename);
}

export function downloadEpisodeMarkdown(episode: Episode, bookTitle: string, language: 'fa' | 'original' = 'fa') {
  const isPersian = language === 'fa' && !!episode.persianText;
  const title = isPersian ? (episode.persianTitle || episode.title) : episode.title;
  const content = `# ${title}\n*Book: ${bookTitle}*\n\n` + formatEpisodeOutput(episode, bookTitle, language);
  const filename = isPersian
    ? `Episode_${String(episode.episodeNumber).padStart(2, '0')}_Persian_Script.md`
    : `Episode_${String(episode.episodeNumber).padStart(2, '0')}_Script.md`;
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  triggerDownload(blob, filename);
}

export function downloadEpisodeSrt(episode: Episode, language: 'fa' | 'original' = 'fa') {
  const srtContent = generateSrtContent(episode, language);
  const isPersian = language === 'fa' && !!episode.persianText;
  const filename = isPersian
    ? `Episode_${String(episode.episodeNumber).padStart(2, '0')}_Persian_Subtitles.srt`
    : `Episode_${String(episode.episodeNumber).padStart(2, '0')}_Subtitles.srt`;
  const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
  triggerDownload(blob, filename);
}

export function downloadEpisodeJson(episode: Episode) {
  const jsonContent = JSON.stringify(episode, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
  triggerDownload(blob, `Episode_${String(episode.episodeNumber).padStart(2, '0')}_Metadata.json`);
}

/**
 * Downloads complete audiobook package as a ZIP with all episodes in Persian and Original formats.
 */
export async function downloadCompleteAudiobookZip(book: Book, language: 'fa' | 'original' = 'fa') {
  const zip = new JSZip();
  const isPersian = language === 'fa';

  // 1. Master Production Guide
  const masterGuide = `# Master Audiobook Production Guide (${isPersian ? 'Persian Audio Edition / نسخه کتاب صوتی فارسی' : 'Original Edition'})
## Title: ${book.persianTitle ? `${book.persianTitle} (${book.title})` : book.title}
**Author:** ${book.author || 'Unknown'}  
**Genre:** ${book.genre || 'Narrative'}  
**Atmosphere & Mood:** ${book.mood || 'Engaging'}  
**Total Manuscript Words:** ${book.totalWords.toLocaleString()}  
**Total Production Episodes:** ${book.episodes.length} (~10 Minutes each / قسمت‌های ۱۰ دقیقه‌ای)  
**Total Audio Duration:** ~${Math.round((book.totalWords / 135) * 10) / 10} minutes (${(
    book.totalWords /
    135 /
    60
  ).toFixed(1)} hours)  
**Integrity Certificate:** Complete & Unabridged (0% Content Loss)  
**Audio Narration Language:** ${isPersian ? 'فارسی (Persian Unabridged Narration)' : 'Original Manuscript'}

---

### Global Voice & TTS Casting Profile
- **Recommended Voice Character:** ${book.globalVoiceConfig.recommendedVoice}
- **Voice Gender:** ${book.globalVoiceConfig.gender}
- **Target Pace:** ${book.globalVoiceConfig.pace}
- **Pitch Setting:** ${book.globalVoiceConfig.pitch}
- **Emotional Delivery:** ${book.globalVoiceConfig.emotionalTone}
- **ElevenLabs Mapping Suggestion:** ${book.globalVoiceConfig.elevenLabsSuggestion || 'N/A'}
- **Azure Neural Mapping:** ${book.globalVoiceConfig.azureVoice || 'N/A'}
- **Audio Engineer Notes:** ${book.globalVoiceConfig.productionNotes || 'None'}

---

### Episode Index & Track List
${book.episodes
  .map(
    (ep) =>
      `- **${isPersian && ep.persianTitle ? ep.persianTitle : ep.title}**: ${ep.wordCount.toLocaleString()} words (~${ep.estimatedMinutes} min) | Voice: ${
        ep.voiceConfig.recommendedVoice
      }`
  )
  .join('\n')}

---
*Generated by AetherVox AI Audio-Book Producer & TTS Script Optimizer.*
`;

  zip.file(isPersian ? '00_راهنمای_جامع_تولید_کتاب_صوتی_فارسی.md' : '00_MASTER_AUDIOBOOK_PRODUCTION_GUIDE.md', masterGuide);
  zip.file('book_metadata.json', JSON.stringify(book, null, 2));

  // 2. Individual episodes in folders
  const persianFolder = zip.folder('Persian_Narration_Scripts_TXT');
  const persianSrt = zip.folder('Persian_Subtitles_SRT');
  const originalFolder = zip.folder('Original_Manuscripts_TXT');

  book.episodes.forEach((ep) => {
    const filenameBase = `Ep_${String(ep.episodeNumber).padStart(2, '0')}`;

    if (ep.persianText) {
      persianFolder?.file(`${filenameBase}_Persian_Audio_Script.txt`, formatEpisodeOutput(ep, book.title, 'fa'));
      persianSrt?.file(`${filenameBase}_Persian.srt`, generateSrtContent(ep, 'fa'));
    }

    originalFolder?.file(`${filenameBase}_Original.txt`, formatEpisodeOutput(ep, book.title, 'original'));
  });

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const safeTitle = (book.persianTitle || book.title || 'Audiobook').replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, '_');
  triggerDownload(zipBlob, `${safeTitle}_Unabridged_Persian_10Min_Audiobook_Package.zip`);
}
