import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
  Copy,
  Check,
  BookOpen,
  Volume2,
  Sliders,
  ShieldCheck,
  Minimize2,
} from 'lucide-react';
import { Book, ChatMessage } from '../types';

interface AIProducerChatProps {
  isOpen: boolean;
  onClose: () => void;
  currentBook: Book | null;
  onOpenUpload: () => void;
}

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-msg',
  role: 'assistant',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  content: `### سلام! به استودیوی تولید کتاب صوتی هوش مصنوعی خوش آمدید 🎙️
**Welcome to your AI Audio-Book Production Studio!**

من **تولیدکننده تخصصی کتاب صوتی، بهینه‌ساز اسکریپت‌های TTS و معمار محتوا** هستم.

🌟 **قابلیت اصلی: تبدیل هر کتاب با هر زبانی به خروجی صوتی فارسی!**  
کتاب شما به هر زبانی (انگلیسی، فرانسوی، آلمانی، عربی یا فارسی) که آپلود شود، آن را به یک سریال کتاب صوتیِ **کامل، بدون تلخیص و ۱۰ دقیقه‌ای به زبان فارسی** تبدیل می‌کنم.

---

### مراحل پردازش گام‌به‌گام:
۱. **ثبت و بازخوانی کامل (بدون حذف حتی یک کلمه):**  
تمامی پاراگراف‌ها، توصیفات و گفتگوها با دقت ریاضی و ۱۰۰٪ کامل حفظ می‌شوند و هیچ بخشی خلاصه یا حذف نمی‌گردد.

۲. **تقسیم هوشمندانه به اپیزودهای ۱۰ دقیقه‌ای:**  
متن دقیقاً به بخش‌های حدود ۱,۲۰۰ تا ۱,۵۰۰ کلمه (معادل ۱۰ دقیقه گویندگی با سرعت ۱۳۵ کلمه بر دقیقه) تقسیم شده و مکث‌ها با پایان فصل‌ها و صحنه‌ها هماهنگ می‌شود.

۳. **ترجمه ادبی و گویندگی صوتی به زبان فارسی:**  
متن به فارسی شیوا، روان و آماده‌ی گویندگی درمی‌آید و تنظیمات صدای راوی فارسی (لحن گویندگی، گام صدا، سرعت بیان، جنسیت صدا) برای موتورهای TTS پیکربندی می‌شود.

۴. **خروجی و دانلود استاندارد:**  
امکان دانلود متن فارسی، زیرنویس فارسی (SRT)، پیش‌نمایش صوتی و دانلود کامل پکیج در قالب یک فایل ZIP.

---

👉 برای شروع، کتاب خود را آپلود کنید یا از نمونه‌های کلاسیک بالا انتخاب نمایید. هر سوالی دارید به فارسی بپرسید!`,
};

export const AIProducerChat: React.FC<AIProducerChatProps> = ({
  isOpen,
  onClose,
  currentBook,
  onOpenUpload,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/producer-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          currentBookContext: currentBook
            ? {
                title: currentBook.title,
                totalWords: currentBook.totalWords,
                episodeCount: currentBook.episodes.length,
                genre: currentBook.genre,
                mood: currentBook.mood,
                recommendedVoice: currentBook.globalVoiceConfig.recommendedVoice,
                gender: currentBook.globalVoiceConfig.gender,
              }
            : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reach AI Producer');
      }

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `assistant-err-${Date.now()}`,
        role: 'assistant',
        content: `I encountered an issue processing that request: ${err.message}. Please verify your API key or ask a direct question about your book.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-sm text-zinc-100">AI Audio-Book Producer</h3>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <p className="text-[11px] text-zinc-400">TTS Script Optimizer & Content Architect</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Active book status bar if available */}
      {currentBook && (
        <div className="px-4 py-2 bg-zinc-900/60 border-b border-zinc-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-zinc-300 truncate max-w-[280px]">
            <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{currentBook.title}</span>
          </div>
          <span className="text-amber-400 font-mono font-medium">
            {currentBook.episodes.length} eps (10m)
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs md:text-sm">
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="h-7 w-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`group relative max-w-[85%] rounded-2xl p-4 leading-relaxed ${
                  isUser
                    ? 'bg-amber-500 text-zinc-950 font-medium rounded-tr-none'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none shadow-md'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed">
                  {m.content}
                </div>

                <div
                  className={`flex items-center justify-between mt-2 pt-1 border-t text-[10px] font-mono ${
                    isUser ? 'border-amber-600/30 text-zinc-800' : 'border-zinc-800 text-zinc-500'
                  }`}
                >
                  <span>{m.timestamp}</span>
                  {!isUser && (
                    <button
                      onClick={() => copyToClipboard(m.content, idx)}
                      className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1 text-zinc-400 hover:text-zinc-200 ml-2"
                      title="Copy response"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {isUser && (
                <div className="h-7 w-7 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3">
            <div className="h-7 w-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-none p-3.5 text-zinc-400 flex items-center gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Analyzing tone, pacing & audio script...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-2 border-t border-zinc-800/80 bg-zinc-950/60 overflow-x-auto flex gap-1.5 no-scrollbar">
        {[
          'چگونه صوت فارسی بدون حذف کلمات تولید می‌شود؟',
          'بهترین صدای راوی فارسی برای این کتاب؟',
          'تنظیم ریتم و مکث‌های گویندگی فارسی',
          'Zero content loss guarantee?',
        ].map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            className="shrink-0 px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 hover:text-zinc-100 transition"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-900/90">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your AI Audio-Book Producer..."
            disabled={isLoading}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/60"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-9 w-9 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 flex items-center justify-center transition shadow-md shadow-amber-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
