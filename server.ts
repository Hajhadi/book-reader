import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { PDFParse } from 'pdf-parse';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;

const SYSTEM_PRODUCER_PROMPT = `You are an expert AI Audio-Book Producer, TTS Script Optimizer, and Content Architect.
Your goal is to convert any uploaded book (PDF, TXT, or text in ANY language—English, French, German, Arabic, Spanish, etc.) into a complete, unabridged, multi-episode audiobook series.
CRITICAL CAPABILITY: When requested or by default, the audio narration output is converted into elegant, literary, unabridged Persian (زبان فارسی) for professional voice narration.

Core Objectives & Workflow:
1. Complete & Unabridged Processing:
   - Read and process the uploaded book sequentially from start to finish.
   - Ensure zero content loss. Do not summarize, skip, or omit paragraphs, chapters, or introductory/concluding notes.

2. Persian Audio Output (خروجی صوتی به زبان فارسی):
   - Translate and adapt the script into fluent, articulate literary Persian specifically engineered for audiobook narration and TTS.
   - Preserve every single sentence, thought, and dialogue in Persian without truncation.
   - Provide Persian voice direction tags: جنسیت صدا (Voice Gender), لحن گویندگی (Narrator Tone), گام صدا (Pitch), سرعت بیان (Pace ~130-140 WPM).

3. Episode Segmentation (10-Minute Episodes):
   - Divide the text into episodes where each episode takes approximately 10 minutes to listen to at normal engaging narration speed (roughly 1,200 to 1,500 words per episode).
   - End each episode at natural pausing points and generate smooth Persian continuity bridges (هوک اتصال راوی) if a chapter splits across episodes.

4. Output Format for Each Episode cycle:
   - [Episode Number & Title / عنوان و شماره قسمت به فارسی]
   - [Estimated Duration: ~10 Minutes / Word Count / مدت زمان تقریبی: حدود ۱۰ دقیقه]
   - [Voice Settings Recommendation: Gender, Tone, Pace / تنظیمات صدای راوی فارسی]
   - [Ready-to-Narrate Script Text / متن کامل گویندگی صوتی به فارسی (بدون تلخیص)]
   - [Download / Export Ready Marker]

If the user writes in Persian (فارسی), always respond in warm, professional Persian, explaining how any book in any language will have its audio output generated in Persian.`;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '60mb' }));
  app.use(express.urlencoded({ extended: true, limit: '60mb' }));

  const ai = process.env.GEMINI_API_KEY
    ? new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      })
    : null;

  const CANDIDATE_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
  ];

  function isQuotaError(err: any): boolean {
    const str = (err?.message || '') + ' ' + (typeof err === 'object' ? JSON.stringify(err) : '');
    return (
      str.includes('429') ||
      str.includes('RESOURCE_EXHAUSTED') ||
      str.includes('quota') ||
      str.includes('Quota exceeded') ||
      str.includes('rate-limit')
    );
  }

  function isTransientOrDemandError(err: any): boolean {
    const str = (err?.message || '') + ' ' + (typeof err === 'object' ? JSON.stringify(err) : '');
    const code = err?.status || err?.code || 0;
    return (
      code === 503 ||
      code === 429 ||
      str.includes('503') ||
      str.includes('UNAVAILABLE') ||
      str.includes('high demand') ||
      str.includes('Spikes in demand') ||
      str.includes('temporarily') ||
      str.includes('overloaded') ||
      str.includes('RESOURCE_EXHAUSTED')
    );
  }

  function cleanCorruptedBinaryNoise(text: string): string {
    if (!text) return '';
    return text
      .replace(/\{\s*\{\s*\^\s*u/g, '')
      .replace(/\^\s*u\s*\{\s*\{/g, '')
      .replace(/\[\s*\+\s*gY[^\]]*\]/g, '')
      .replace(/CO\s*l\|\s*r\s*x\s*\)/gi, '')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
      .replace(/[\{\}\[\]\^\~\\\|\<\>\`\_\%\*\$\#\@\=\+\/]{3,}/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Tries primary model first, and if quota (429) or high demand spike (503) is hit,
   * automatically waits briefly and falls back across alternative candidate models.
   */
  async function generateWithModelFallback(
    buildRequest: (modelName: string) => any
  ): Promise<any> {
    if (!ai) {
      throw new Error('Gemini API is not configured.');
    }

    let lastError: any = null;

    for (let i = 0; i < CANDIDATE_MODELS.length; i++) {
      const model = CANDIDATE_MODELS[i];
      try {
        const req = buildRequest(model);
        const response = await ai.models.generateContent({
          ...req,
          model,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} request failed:`, err?.message || err);

        // If it's a 503 high demand spike or quota, wait briefly and try next model
        if (isTransientOrDemandError(err)) {
          console.warn(`Transient/demand spike (503/429) on ${model}. Retrying with fallback model in 1.2s...`);
          await new Promise((resolve) => setTimeout(resolve, 1200));
          continue;
        }

        continue;
      }
    }

    if (isTransientOrDemandError(lastError)) {
      const isDemand = (lastError?.message || '').includes('503') || (lastError?.message || '').includes('high demand') || lastError?.status === 503;
      const errorMsg = isDemand
        ? 'سرورهای هوش مصنوعی موقتاً با بار ترافیکی بالا مواجه شدند (503 Spikes in demand). کتاب شما کاملاً محفوظ است؛ لطفاً دوباره تلاش کنید.'
        : 'سقف درخواست‌های روزانه هوش مصنوعی رایگان (Gemini Free Tier Quota) تکمیل شده است. می‌توانید متن کتاب را در تب «Paste Manuscript Text» قرار دهید یا از فایل متنی (TXT) استفاده فرمایید.';
      const outErr: any = new Error(errorMsg);
      outErr.isQuotaExhausted = !isDemand;
      outErr.isDemandSpike = isDemand;
      outErr.status = isDemand ? 503 : 429;
      throw outErr;
    }

    throw lastError;
  }

  // System status
  app.get('/api/status', (req, res) => {
    res.json({
      online: true,
      hasGemini: !!ai,
      message: 'AetherVox AI Audio-Book Production Server Active',
    });
  });

  // Analyze book genre, tone, and voice configuration
  app.post('/api/analyze-tone-voice', async (req, res) => {
    try {
      const { title, author, textSample } = req.body;
      if (!ai) {
        return res.json({
          genre: 'Literary & Narrative',
          mood: 'Engaging, thoughtful, and expressive',
          recommendedVoice: 'Zephyr',
          gender: 'Neutral / Versatile',
          pitch: 'Medium / Balanced (0 st)',
          pace: '135 - 145 WPM (Moderate, Natural Cadence)',
          emotionalTone: 'Warm, clear, and articulated with natural pause markers',
          ttsMapping: {
            geminiVoice: 'Zephyr',
            elevenLabsSuggestion: 'Adam or Rachel (Crisp & Conversational)',
            azureVoice: 'en-US-GuyNeural or en-US-JennyNeural',
          },
          productionNotes:
            'Maintain steady pacing through descriptive scenes. Insert 1.2s pause at scene breaks and 0.8s between narrative beats.',
        });
      }

      const prompt = `Analyze this book excerpt for professional audiobook production:
Title: ${title || 'Untitled Work'}
Author: ${author || 'Unknown'}
Sample text (first ~1,500 words):
"""
${(textSample || '').slice(0, 3500)}
"""

Provide a detailed audio-book production analysis in valid JSON format with this exact structure:
{
  "genre": "Genre description (e.g. Science Fiction, Victorian Gothic, Self-Development)",
  "mood": "Overall mood and atmosphere",
  "recommendedVoice": "Zephyr | Kore | Puck | Fenrir | Charon",
  "gender": "Male | Female | Gender-Neutral",
  "pitch": "Pitch description and semitone adjustment (e.g. Mid-Low (-1.5st))",
  "pace": "Pacing in WPM (e.g. 135 WPM (Measured, introspective))",
  "emotionalTone": "Emotional tone direction for narrator",
  "ttsMapping": {
    "geminiVoice": "Kore or Zephyr or Puck or Fenrir or Charon",
    "elevenLabsSuggestion": "Suggested ElevenLabs voice archetype",
    "azureVoice": "Suggested Azure Neural voice"
  },
  "productionNotes": "Specific advice on pauses, dialogue inflection, and cadence"
}`;

      try {
        const response = await generateWithModelFallback(() => ({
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        }));

        const parsed = JSON.parse(response.text || '{}');
        res.json(parsed);
      } catch (genErr: any) {
        // Fallback default if all AI models hit quota
        console.warn('Falling back to default voice config due to AI quota/error:', genErr.message);
        res.json({
          genre: 'کتاب داستانی و روایی',
          mood: 'عمیق، پویا و شنیدنی',
          recommendedVoice: 'Kore',
          gender: 'Female / Warm',
          pitch: 'Medium / Balanced (0 st)',
          pace: '۱۳۵ تا ۱۴۰ کلمه در دقیقه',
          emotionalTone: 'روایت گرم، شیوا و همراه با مکث‌های داستانی',
          ttsMapping: {
            geminiVoice: 'Kore',
            elevenLabsSuggestion: 'Rachel (Warm & Engaging)',
            azureVoice: 'fa-IR-DilaraNeural',
          },
          productionNotes: 'رعایت ضرب‌آهنگ پیوسته و مکث ۱ ثانیه‌ای میان بندها.',
          isQuotaExhausted: !!genErr.isQuotaExhausted,
        });
      }
    } catch (err: any) {
      console.error('Error analyzing tone/voice:', err);
      res.status(500).json({ error: err.message || 'Failed to analyze tone and voice' });
    }
  });

  // Generate bridge transition for split chapters
  app.post('/api/generate-transition', async (req, res) => {
    try {
      const { episodeNumber, title, previousExcerpt, nextExcerpt, isIntro } = req.body;
      const defaultBridge = isIntro
        ? `[قسمت ${episodeNumber}: در ادامه ماجرای قبل...]`
        : `[پایان این قسمت. ادامه داستان در قسمت ${Number(episodeNumber) + 1}...]`;

      if (!ai) {
        return res.json({ transition: defaultBridge });
      }

      const prompt = isIntro
        ? `You are an audiobook producer. We are splitting a book into 10-minute episodes with 100% unabridged content.
This is Episode ${episodeNumber} (${title}).
The previous episode ended with:
"${(previousExcerpt || '').slice(-400)}"
The current episode begins with:
"${(nextExcerpt || '').slice(0, 400)}"

Generate a smooth, brief, professional 1-2 sentence narrator continuity hook (e.g., "[Previously: ... Now, the journey continues with Chapter 3, Part 2.]"). Keep it under 35 words. Return plain text.`
        : `You are an audiobook producer. Episode ${episodeNumber} is concluding at an episode transition boundary.
The episode concludes with:
"${(previousExcerpt || '').slice(-400)}"

Generate a smooth, brief 1-sentence episode wrap-up note (e.g., "[End of Episode ${episodeNumber}. Continue to Episode ${Number(episodeNumber) + 1} for Part 2.]"). Keep it under 25 words. Return plain text.`;

      try {
        const response = await generateWithModelFallback(() => ({
          contents: prompt,
          config: {
            temperature: 0.4,
          },
        }));

        res.json({ transition: response.text?.trim() || defaultBridge });
      } catch (genErr) {
        res.json({ transition: defaultBridge });
      }
    } catch (err: any) {
      console.error('Error generating transition:', err);
      res.status(500).json({ error: err.message || 'Failed to generate transition' });
    }
  });

  // Interactive AI Producer Chat
  app.post('/api/producer-chat', async (req, res) => {
    try {
      const { messages, currentBookContext } = req.body;
      if (!ai) {
        return res.json({
          reply: `Welcome to AetherVox Audio-Book Producer! 
I am your dedicated AI Audio-Book Producer, TTS Script Optimizer, and Content Architect.

To convert your book into a complete, unabridged, multi-episode audio series:
1. **Upload your book file** (PDF, TXT, EPUB or paste text) in the upload tab.
2. I will inspect the full manuscript to guarantee **zero content loss**—preserving every single paragraph and chapter.
3. We segment the manuscript precisely into **10-minute listening episodes** (approx. 1,200 to 1,500 words per episode at 140 WPM).
4. Each episode is tagged with custom **Voice Configuration** (Pitch, Pace, Gender, Tone) and seamless continuity bridges.
5. You can preview narration in real-time or download individual scripts (TXT, Markdown, SRT) or the complete audiobook production package as a ZIP!`,
        });
      }

      let systemInstruction = SYSTEM_PRODUCER_PROMPT;
      if (currentBookContext && currentBookContext.title) {
        systemInstruction += `\n\nCURRENT WORKING BOOK:
Title: "${currentBookContext.title}"
Total Words: ${currentBookContext.totalWords || 'Unknown'}
Total Episodes Planned: ${currentBookContext.episodeCount || 'Pending'}
Genre & Tone: ${currentBookContext.genre || 'Unspecified'} (${currentBookContext.emotionalTone || ''})
Voice Config: ${currentBookContext.recommendedVoice || 'Zephyr'} (${currentBookContext.gender || 'Neutral'})`;
      }

      const formattedContents = (messages || []).map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      try {
        const response = await generateWithModelFallback(() => ({
          contents: formattedContents,
          config: {
            systemInstruction,
            temperature: 0.5,
          },
        }));

        res.json({ reply: response.text || '' });
      } catch (err: any) {
        if (err.isQuotaExhausted || isQuotaError(err)) {
          return res.json({
            reply: `سقف درخواست‌های روزانه هوش مصنوعی رایگان (Gemini Free Tier Quota) به پایان رسیده است. 
اما تمام قابلیت‌های اصلی نرم‌افزار، از جمله تقسیم‌بندی به اپیزودهای ۱۰ دقیقه‌ای، تله‌پروامپتر، ویرایش دستی و دانلود اسکریپت‌ها بدون نیاز به مصرف سهمیه فعال هستند. می‌توانید متن کتاب خود را در تب Paste Manuscript Text قرار دهید.`,
          });
        }
        throw err;
      }
    } catch (err: any) {
      console.error('Error in producer chat:', err);
      res.status(500).json({ error: err.message || 'Chat processing error' });
    }
  });

  // Unabridged Literary Persian Translation for Audiobook Narration
  app.post('/api/translate-episode-persian', async (req, res) => {
    try {
      const { text, title, episodeNumber, genre, mood, introBridge, outroBridge } = req.body;
      if (!ai) {
        return res.status(400).json({
          error: 'Gemini API is required for Persian literary translation.',
        });
      }

      if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: 'Text is required for translation' });
      }

      const prompt = `You are a master Persian literary translator and voice-over director.
Your task is to translate this unabridged 10-minute audiobook episode into fluent, evocative, eloquent Persian (فارسی شیوا و رسا برای کتاب صوتی).

Book Information:
- Episode: ${episodeNumber || '1'} (${title || 'Chapter'})
- Genre: ${genre || 'Literary'}
- Atmosphere / Mood: ${mood || 'Engaging'}

CRITICAL AUDIOBOOK RULES:
1. Zero Content Loss: Every single paragraph, sentence, thought, and dialogue must be fully translated. Do NOT summarize, skip, or truncate anything.
2. Voice & Narration Flow: Use natural, expressive spoken-literary Persian (زبان معیار، شیوا و گیرا) that sounds rhythmic and engaging when read aloud by a professional voice actor.
3. Natural Pacing: Maintain the exact paragraph breaks and narrative flow.

Source Episode Text to Translate:
"""
${text}
"""

${introBridge ? `Source Intro Bridge: "${introBridge}"` : ''}
${outroBridge ? `Source Outro Bridge: "${outroBridge}"` : ''}

Respond in valid JSON with this exact schema:
{
  "persianTitle": "عنوان فارسی قسمت (مثال: قسمت اول - ماشین زمان: بعد چهارم)",
  "persianText": "متن کامل، بدون حذف و شیوا به زبان فارسی برای گویندگی صوتی",
  "persianIntroBridge": "هوک ورود راوی به فارسی (در صورت وجود)",
  "persianOutroBridge": "هوک خروج راوی به فارسی (در صورت وجود)",
  "persianVoiceNotes": "راهنمای اختصاصی لحن، حس و مکث‌های گوینده به فارسی"
}`;

      try {
        const response = await generateWithModelFallback(() => ({
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.35,
          },
        }));

        const parsed = JSON.parse(response.text || '{}');
        res.json(parsed);
      } catch (genErr: any) {
        console.warn('Persian translation AI fallback:', genErr.message);
        if (genErr.isQuotaExhausted || isQuotaError(genErr)) {
          return res.status(429).json({
            error:
              'سقف سهمیه روزانه هوش مصنوعی رایگان به پایان رسیده است. می‌توانید متن فارسی این قسمت را مستقیماً از طریق دکمه «ویرایش دستی» در پنل اپیزود وارد نمایید.',
            isQuotaExhausted: true,
          });
        }
        throw genErr;
      }
    } catch (err: any) {
      console.error('Error translating episode to Persian:', err);
      res.status(500).json({ error: err.message || 'Failed to translate episode to Persian' });
    }
  });

  // Helper to clean and prepare smooth narrative text for TTS without awkward cutting
  function prepareNarrativeSpeechText(raw: string, maxChars = 2200): string {
    if (!raw) return '';
    // Strip markdown formatting that causes awkward pauses or spelling out characters
    const cleaned = raw
      .replace(/[*#_~`>[\]()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleaned.length <= maxChars) {
      return cleaned;
    }

    // Cut at sentence boundary to preserve natural breathing and sentence integrity
    const slice = cleaned.slice(0, maxChars);
    const lastPunctuation = Math.max(
      slice.lastIndexOf('.'),
      slice.lastIndexOf('!'),
      slice.lastIndexOf('؟'),
      slice.lastIndexOf('؛'),
      slice.lastIndexOf('?')
    );

    if (lastPunctuation > maxChars * 0.6) {
      return slice.slice(0, lastPunctuation + 1).trim();
    }

    const lastSpace = slice.lastIndexOf(' ');
    if (lastSpace > maxChars * 0.7) {
      return slice.slice(0, lastSpace).trim() + '.';
    }

    return slice.trim();
  }

  // Generate High-Fidelity Human Solo Audiobook Narration (Gemini 3.8 Flash TTS)
  app.post('/api/generate-tts', async (req, res) => {
    try {
      const { text, voiceName, style, isPersian } = req.body;
      if (!ai) {
        return res.status(400).json({
          error: 'Gemini API key is not configured.',
        });
      }

      if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: 'Text is required for TTS generation' });
      }

      const hasPersianChars = /[\u0600-\u06FF]/.test(text) || isPersian;
      // Target a concise paragraph chunk (~1200 chars) for optimal single-turn TTS reliability
      const speechText = prepareNarrativeSpeechText(text, 1200);

      // Keep style instructions short and focused to prevent model generating text explanation
      const ttsStyle = hasPersianChars
        ? 'Warm, natural Persian audiobook narrator with fluid storytelling cadence'
        : 'Warm, natural audiobook narrator with smooth storytelling cadence';

      const chosenVoice = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'].includes(voiceName)
        ? voiceName
        : (hasPersianChars ? 'Kore' : 'Zephyr');

      const targetModels = [
        'gemini-3.8-flash-lite-tts',
        'gemini-3.8-flash-tts',
      ];

      let base64Audio = '';
      let usedModel = targetModels[0];
      let lastErr: any = null;

      for (const model of targetModels) {
        // Try with concise style first, then bare text fallback if needed
        const attempts = [
          { text: speechText, speechMetadata: { style: ttsStyle } },
          { text: speechText },
        ];

        for (const partPayload of attempts) {
          try {
            const response = await ai.models.generateContent({
              model,
              contents: [
                {
                  role: 'user',
                  parts: [partPayload],
                },
              ],
              config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: chosenVoice },
                  },
                },
              },
            });

            // Find audio part across any candidate part
            for (const p of response.candidates?.[0]?.content?.parts || []) {
              if (p.inlineData?.data) {
                base64Audio = p.inlineData.data;
                usedModel = model;
                break;
              }
            }

            if (base64Audio) break;
          } catch (err: any) {
            lastErr = err;
            console.warn(`TTS attempt with ${model} failed:`, err?.message || err);
            if (isTransientOrDemandError(err)) {
              console.warn(`TTS demand spike on ${model}. Trying next attempt in 1.2s...`);
              await new Promise((r) => setTimeout(r, 1200));
            }
          }
        }

        if (base64Audio) break;
      }

      if (!base64Audio) {
        if (lastErr && (isQuotaError(lastErr) || isTransientOrDemandError(lastErr))) {
          throw lastErr;
        }
        const quotaErr: any = new Error(
          'سقف درخواست‌های روزانه هوش مصنوعی رایگان برای تولید صوت تکمیل شده است. می‌توانید از دکمه پخش فوری مرورگر استفاده فرمایید.'
        );
        quotaErr.isQuotaExhausted = true;
        quotaErr.status = 429;
        throw quotaErr;
      }

      res.json({
        audioUrl: `data:audio/wav;base64,${base64Audio}`,
        voice: chosenVoice,
        model: usedModel,
        charsNarrated: speechText.length,
      });
    } catch (err: any) {
      console.error('Error generating speech:', err);
      const isQuota = isQuotaError(err) || (err.message && (err.message.includes('quota') || err.message.includes('429') || err.message.includes('سقف')));
      const is503 = isTransientOrDemandError(err);
      const statusCode = isQuota ? 429 : is503 ? 503 : 500;
      res.status(statusCode).json({
        error: isQuota
          ? 'سقف درخواست‌های روزانه هوش مصنوعی رایگان برای تولید صوت (۱۰ درخواست در روز) تکمیل شده است. می‌توانید با کلیک روی «پخش فوری با موتور مرورگر» بدون محدودیت به کتاب گوش دهید.'
          : is503
          ? 'سرورهای پردازش صوتی موقتاً با اوج ترافیک مواجه شدند (503 High Demand). کتاب و قسمت‌های شما کاملاً حفظ هستند.'
          : (err.message || 'خطا در سنتز صدای هوش مصنوعی'),
        isQuotaExhausted: isQuota,
        isDemandSpike: is503,
      });
    }
  });

  // Rapid Voice Audition endpoint: Let user test a voice sample instantly
  app.post('/api/voice-audition', async (req, res) => {
    try {
      const { voiceName, isPersian } = req.body;
      if (!ai) {
        return res.status(400).json({ error: 'Gemini API not configured' });
      }

      const chosenVoice = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'].includes(voiceName)
        ? voiceName
        : 'Kore';

      const sampleText = isPersian !== false
        ? 'کتاب‌ها ما را به دنیاهایی می‌برند که هرگز ندیده‌ایم. این صدای راوی کتاب صوتی شماست.'
        : 'Books take us to worlds we have never seen. This is the narrator voice for your audiobook.';

      const sampleStyle = isPersian !== false
        ? 'Warm, fluid, human Persian audiobook narrator with captivating storytelling melody.'
        : 'Warm, fluid, human audiobook narrator with captivating storytelling melody.';

      const targetModels = [
        'gemini-3.8-flash-lite-tts',
        'gemini-3.8-flash-tts',
      ];
      let base64Audio = '';

      for (const model of targetModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: sampleText,
                    speechMetadata: {
                      style: sampleStyle,
                    },
                  },
                ],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: chosenVoice },
                },
              },
            },
          });

          base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
          if (base64Audio) break;
        } catch (e: any) {
          console.warn(`Audition with ${model} failed:`, e?.message);
          if (isTransientOrDemandError(e)) {
            await new Promise((r) => setTimeout(r, 800));
          }
        }
      }

      if (!base64Audio) {
        return res.status(503).json({
          error: 'سرویس تست صدا موقتاً به دلیل ترافیک در دسترس نیست. لطفاً مجدداً امتحان کنید.',
          isDemandSpike: true,
        });
      }

      res.json({
        audioUrl: `data:audio/wav;base64,${base64Audio}`,
        voice: chosenVoice,
      });
    } catch (err: any) {
      console.error('Audition error:', err);
      res.status(500).json({ error: err.message || 'Audition failed' });
    }
  });



  // Extract clean unabridged text from uploaded document (PDF) via native pdfParse & Gemini Multi-Modal parser
  app.post('/api/parse-document', async (req, res) => {
    try {
      const { fileBase64, mimeType, fileName } = req.body;
      if (!fileBase64) {
        return res.status(400).json({ error: 'No file data provided' });
      }

      const isPdf =
        (mimeType && mimeType.includes('pdf')) ||
        (fileName && fileName.toLowerCase().endsWith('.pdf'));

      // 1. Try Native Fast Server-side PDF Extraction (Zero AI Quota Needed)
      if (isPdf) {
        try {
          const buffer = Buffer.from(fileBase64, 'base64');
          const parser = new PDFParse({ data: buffer });
          const textResult = await parser.getText();
          let rawText = textResult?.text || '';
          await parser.destroy();

          // Clean up formatting and binary stream noise
          rawText = cleanCorruptedBinaryNoise(rawText);
          const words = rawText.split(/\s+/).filter(Boolean);

          if (rawText.trim().length > 100 && words.length > 25) {
            console.log(
              `Native PDF extraction succeeded for "${fileName}": ${words.length} words cataloged.`
            );
            return res.json({
              text: rawText.trim(),
              fileName: fileName || 'Uploaded Document',
              wordCount: words.length,
              characterCount: rawText.length,
              source: 'native-pdf-parser',
            });
          }
        } catch (pdfErr) {
          console.warn('Native PDFParse encountered issue, falling back to Gemini OCR:', pdfErr);
        }
      }

      // 2. Gemini Multi-Modal OCR Fallback (for scanned or non-standard PDFs)
      if (!ai) {
        return res.status(400).json({
          error:
            'متن این فایل نیاز به رمزگشایی دارد اما کلید هوش مصنوعی در دسترس نیست. لطفاً متن کتاب را کپی کرده و در تب Paste Manuscript Text قرار دهید.',
        });
      }

      const prompt = `You are an expert document and manuscript parser for unabridged audiobook production.
Extract the FULL, COMPLETE, and UNABRIDGED text of this entire book/document.

CRITICAL INSTRUCTIONS:
1. Complete & Unabridged: Extract 100% of the content: all chapters, headings, paragraphs, and dialogue. Zero omission, zero summarization.
2. Font & OCR Correction: Decode all embedded fonts properly. Never output scrambled font glyphs or binary stream noise.
3. Natural Flow: Preserve the natural reading order, chapter headers (e.g., "Chapter 1: ..."), and paragraph breaks.
4. Output Format: Output ONLY the extracted clean manuscript text without any introductory or meta commentary.`;

      try {
        const response = await generateWithModelFallback(() => ({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType || 'application/pdf',
                    data: fileBase64,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
          ],
          config: {
            temperature: 0.1,
          },
        }));

        const extractedText = response.text?.trim() || '';
        if (!extractedText) {
          return res.status(500).json({ error: 'متنی از فایل استخراج نشد.' });
        }

        const wordCount = extractedText.split(/\s+/).filter(Boolean).length;
        res.json({
          text: extractedText,
          fileName: fileName || 'Uploaded Document',
          wordCount,
          characterCount: extractedText.length,
          source: 'gemini-ocr',
        });
      } catch (genErr: any) {
        if (genErr.isQuotaExhausted || isQuotaError(genErr)) {
          return res.status(429).json({
            error:
              'سقف سهمیه هوش مصنوعی به پایان رسیده است. برای اجرای فوری بدون سهمیه، متن کتاب را کپی کرده و در تب «Paste Manuscript Text» قرار دهید یا از فایل متنی TXT استفاده نمایید.',
            isQuotaExhausted: true,
          });
        }
        throw genErr;
      }
    } catch (err: any) {
      console.error('Error parsing document:', err);
      res.status(500).json({ error: err.message || 'Failed to extract text from document.' });
    }
  });

  // Repair corrupted/unreadable text from broken PDF font encodings
  app.post('/api/repair-corrupted-text', async (req, res) => {
    try {
      const { corruptedText, title, author, episodeNumber } = req.body;
      if (!corruptedText || corruptedText.trim().length === 0) {
        return res.status(400).json({ error: 'متنی برای اصلاح ارائه نشده است.' });
      }

      const prompt = `The user uploaded a manuscript or chapter where font encoding in the PDF was corrupted or extracted as binary stream noise (e.g. "{ { ^ u", "CO l| r x ) 1s y Dv{").
Book Information:
- Title: "${title || 'Unknown Title'}"
- Author: "${author || 'Unknown Author'}"
- Episode / Chapter Number: "${episodeNumber || '1'}"

Corrupted Sample Text:
"""
${(corruptedText || '').slice(0, 4000)}
"""

Task:
1. Identify the actual text of this book/chapter based on the Title, Author, Chapter/Episode number, and any recognizable text fragments.
   - If this is a published classic or modern book (e.g. The Time Machine, The Picture of Dorian Gray, Alice in Wonderland, 1984, etc.), reconstruct the unabridged, authentic English text for this chapter/episode.
   - If it is another manuscript, clean out all binary glyph noise and salvage all readable text with grammatical coherence.
2. Translate the restored text into fluent, articulate literary Persian (فارسی شیوا و رسا برای کتاب صوتی) with zero content loss.

Respond in valid JSON with this exact schema:
{
  "restoredEnglishText": "Clean, complete, unabridged English text without any corrupt characters",
  "persianTitle": "عنوان فارسی قسمت",
  "persianText": "متن کامل و شیوا به زبان فارسی برای گویندگی صوتی بدون خلاصه سازی",
  "persianVoiceNotes": "توصیه و راهنمای گویندگی به فارسی",
  "explanation": "توضیح کوتاه در مورد رفع مشکل کاراکترهای ناخوانا"
}`;

      try {
        const response = await generateWithModelFallback(() => ({
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }));

        const parsed = JSON.parse(response.text || '{}');
        res.json(parsed);
      } catch (genErr: any) {
        console.warn('AI repair fallback to rule-based cleaner:', genErr.message);
        // If AI is offline or quota exhausted, execute algorithmic clean-up!
        const cleaned = cleanCorruptedBinaryNoise(corruptedText);
        res.json({
          restoredEnglishText: cleaned || 'Cleaned excerpt',
          persianTitle: `قسمت ${episodeNumber || '۱'}`,
          persianText: cleaned || 'متن پالایش‌شده بدون کاراکترهای ناخوانا',
          persianVoiceNotes: 'کاراکترهای ناخوانای جریان باینری با موفقیت حذف شدند.',
          explanation:
            'کاراکترهای ناخوانا با فیلتر هوشمند پاکسازی شدند. برای ویرایش دقیق‌تر می‌توانید از دکمه ویرایش دستی استفاده کنید.',
          isQuotaExhausted: !!(genErr.isQuotaExhausted || isQuotaError(genErr)),
        });
      }
    } catch (err: any) {
      console.error('Error repairing corrupted text:', err);
      res.status(500).json({ error: err.message || 'Failed to repair corrupted text.' });
    }
  });

  const httpServer = http.createServer(app);

  // Mount Vite or serve static files
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`AetherVox Audio-Book Producer server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
