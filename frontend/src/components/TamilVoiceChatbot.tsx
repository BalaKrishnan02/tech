import React, { useState, useEffect, useRef } from 'react';
import {
  Mic, MicOff, Send, Volume2, VolumeX, Trash2,
  Sparkles, X, CheckCircle2, AlertCircle, Zap, Globe, Languages
} from 'lucide-react';
import { api, BACKEND_URL } from '../services/api';
import type { ChatMessage } from '../types';

interface TamilVoiceChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRegionId?: string;
  selectedRegionName?: string;
}

interface QuestionCategory {
  id: string;
  label: string;
  questions: string[];
}

export const TamilVoiceChatbot: React.FC<TamilVoiceChatbotProps> = ({
  isOpen,
  onClose,
  selectedRegionId,
  selectedRegionName
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isAutoSpeak, setIsAutoSpeak] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Dual language mic listening & translation controls
  const [micLang, setMicLang] = useState<'ta-IN' | 'en-US'>('ta-IN');
  const [responseLang, setResponseLang] = useState<'en' | 'ta'>('en');

  const sessionIdRef = useRef<string>(`sess_${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const isListeningIntentRef = useRef<boolean>(false);
  const baseTextRef = useRef<string>('');
  const currentInputTextRef = useRef<string>('');
  const restartTimeoutRef = useRef<any>(null);

  const QUESTION_CATEGORIES: QuestionCategory[] = [
    {
      id: 'weather',
      label: '🌦️ 2026 Weather',
      questions: [
        'What is the weather today in Chennai?',
        'What is the 24-hour rainfall forecast?',
        'Is there any active cyclone or depression in the Bay of Bengal?',
        'Current temperature, humidity, and wind conditions'
      ]
    },
    {
      id: 'rain',
      label: '🌧️ Oct 2026 Rain',
      questions: [
        'How much rainfall was recorded in October 2026?',
        'What was today\'s rainfall accumulation in mm?',
        'How does this month\'s rainfall compare with the normal baseline?',
        'Which day recorded the peak 2026 rainfall?'
      ]
    },
    {
      id: 'floods',
      label: '🌊 Flood Locations',
      questions: [
        'Which areas and locations are flooded right now?',
        'Is Velachery or Mudichur inundated?',
        'How many square kilometers are submerged in 2026?',
        'Is the flood water level rising or receding today?'
      ]
    },
    {
      id: 'dams',
      label: '💧 Dam & Reservoirs',
      questions: [
        'What is the water level in Chembarambakkam reservoir?',
        'How much water is being discharged from Poondi or Mettur dam?',
        'Are Chembarambakkam sluice gates open today?',
        'Current storage percentage of Chennai city reservoirs'
      ]
    },
    {
      id: 'history',
      label: '📊 2015 vs 2026',
      questions: [
        'Compare the 2026 floods with 2015 and Cyclone Michaung (2023).',
        'Why is 2026 flood damage lower than 2015?',
        'What infrastructure improvements were made since 2015?'
      ]
    },
    {
      id: 'relief',
      label: '🚨 Helplines & Relief',
      questions: [
        'What are the emergency helpline numbers?',
        'How many relief camps are active in Chennai?',
        'What safety precautions should residents in flood zones take?'
      ]
    },
    {
      id: 'satellite',
      label: '🛰️ Satellite & Radar',
      questions: [
        'What does the latest Sentinel-1 radar satellite show?',
        'How does SAR radar map floods through heavy cloud cover?',
        'What evidence and data sources support these findings?'
      ]
    }
  ];

  // Keep currentInputTextRef in sync with inputText state
  useEffect(() => {
    currentInputTextRef.current = inputText;
  }, [inputText]);

  // Turn off mic listening when assistant panel is closed
  useEffect(() => {
    if (!isOpen) {
      isListeningIntentRef.current = false;
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isListeningIntentRef.current = false;
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Initialize Speech Recognition (Web Speech API) with continuous listening
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = micLang;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        // Discard any trailing results if user has already pressed Send / stopped
        if (!isListeningIntentRef.current) return;

        let sessionTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          sessionTranscript += event.results[i][0].transcript;
        }

        const base = baseTextRef.current.trim();
        let combined = '';
        if (base) {
          if (sessionTranscript) {
            const clean = sessionTranscript.trimStart();
            combined = `${base} ${clean}`;
          } else {
            combined = base;
          }
        } else {
          combined = sessionTranscript.trimStart();
        }

        currentInputTextRef.current = combined;
        setInputText(combined);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        // Normal pause between words / sentences or intentional rotation - do not stop listening!
        if (event.error === 'no-speech' || event.error === 'aborted') {
          return;
        }

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          isListeningIntentRef.current = false;
          setIsListening(false);
          setSpeechError('Microphone access denied. Please allow microphone permissions in your browser.');
          return;
        }

        if (event.error === 'audio-capture') {
          isListeningIntentRef.current = false;
          setIsListening(false);
          setSpeechError('No microphone detected. Please check your microphone connection.');
          return;
        }

        if (event.error === 'network') {
          // Network fluctuation with speech cloud, will reconnect via onend if still active
          return;
        }

        setSpeechError(`Speech error: ${event.error}`);
      };

      recognition.onend = () => {
        // If user is still actively speaking, keep mic ON across word pauses and session restarts
        if (isListeningIntentRef.current) {
          baseTextRef.current = currentInputTextRef.current;
          if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current);
          }
          // Seamlessly restart recognition so user can take pauses without mic turning off
          restartTimeoutRef.current = setTimeout(() => {
            if (isListeningIntentRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (err) {
                console.debug('Recognition restart handled:', err);
              }
            }
          }, 150);
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Update speech recognition language dynamically when micLang changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = micLang;
      if (isListeningIntentRef.current) {
        baseTextRef.current = currentInputTextRef.current;
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    }
  }, [micLang]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: `### Welcome to the 2026 AI Disaster & Digital Twin Assistant\n\nI provide **instant real-time 2026 meteorological telemetry, day-to-day weather forecasts, October 2026 rainfall records, flood inundation maps (Velachery, Mudichur, etc.), Chembarambakkam reservoir discharge status, and emergency helplines**${
            selectedRegionName ? ` for **${selectedRegionName}**` : ''
          }.\n\n🎙️ **Bilingual Speech Input Active**: You can speak in **Tamil (தமிழ்)** or **English (EN)** into the mic; I will learn and answer you in **English** automatically!`,
          language: 'en',
          is_evidence_complete: true,
          created_at: new Date().toISOString()
        }
      ]);
    }
  }, [selectedRegionName]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setSpeechError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening || isListeningIntentRef.current) {
      // Manual stop by clicking mic or done button
      isListeningIntentRef.current = false;
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      try {
        recognitionRef.current.stop();
      } catch (err) {}
      setIsListening(false);
    } else {
      // Start listening continuously
      setSpeechError(null);
      isListeningIntentRef.current = true;
      baseTextRef.current = currentInputTextRef.current;
      setIsListening(true);
      try {
        recognitionRef.current.lang = micLang;
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Recognition start exception:', err);
        setTimeout(() => {
          if (isListeningIntentRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.error('Recognition start retry failed:', e);
            }
          }
        }, 200);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isSending) return;

    // Turn off mic listening immediately when Send is clicked
    isListeningIntentRef.current = false;
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {}
    }
    setIsListening(false);
    baseTextRef.current = '';
    currentInputTextRef.current = '';

    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      language: micLang === 'ta-IN' ? 'ta' : 'en',
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsSending(true);

    try {
      const resp = await api.sendChatMessage(text, selectedRegionId, sessionIdRef.current, responseLang);
      setMessages(prev => [...prev, resp]);

      // If user enabled auto-voice, speak instantly using browser speech
      if (resp.audio_url) {
        playAudio(resp.audio_url, resp.content);
      } else if (resp.content && isAutoSpeak) {
        speakWithBrowser(resp.content);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, there was an issue retrieving the real-time telemetry. Please try again.',
          language: 'en',
          is_evidence_complete: false,
          missing_data_explanation: err.message,
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const speakWithBrowser = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      // Remove markdown characters for clean speech
      const clean = text
        .replace(/🌐 \*\[[^\]]+\]\*/g, '')
        .replace(/[*#_`|]/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/--+/g, '')
        .replace(/\n+/g, '. ');
      
      // Read top sentences for concise, immediate audio
      const sentences = clean
        .split('.')
        .map(s => s.trim())
        .filter(s => s.length > 5)
        .slice(0, 3)
        .join('. ') + '.';

      const utterance = new SpeechSynthesisUtterance(sentences);
      utterance.lang = responseLang === 'ta' ? 'ta-IN' : 'en-US';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const playAudio = (url?: string, textFallback?: string) => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (url) {
      const fullAudioUrl = url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
      const audio = new Audio(fullAudioUrl);
      audioPlayerRef.current = audio;
      setCurrentAudioUrl(fullAudioUrl);
      setIsPlayingAudio(true);

      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => {
        if (textFallback) speakWithBrowser(textFallback);
        else setIsPlayingAudio(false);
      };
      audio.play().catch(e => {
        console.warn('Audio play exception, using speech synthesis fallback:', e);
        if (textFallback) speakWithBrowser(textFallback);
        else setIsPlayingAudio(false);
      });
    } else if (textFallback) {
      speakWithBrowser(textFallback);
    }
  };

  const stopAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  };

  const clearChat = async () => {
    await api.clearChat(sessionIdRef.current);
    setMessages([]);
  };

  // Filtered questions based on selected category
  const activeQuestions = selectedCategory === 'all'
    ? [
        'What is the weather today in Chennai?',
        'How much rainfall was recorded in October 2026?',
        'Which areas and locations are flooded right now?',
        'What is the water level in Chembarambakkam reservoir?',
        'Compare the 2026 floods with 2015 and Cyclone Michaung (2023).',
        'What are the emergency helpline numbers?',
        'What does the latest Sentinel-1 radar satellite show?'
      ]
    : QUESTION_CATEGORIES.find(c => c.id === selectedCategory)?.questions || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200 font-sans">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Sparkles className="w-5 h-5 text-cyan-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm tracking-wide">
                2026 AI Disaster Intelligence
              </h3>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" />
                Fast
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Bilingual Voice & Text • Instant English Translation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Response Language Toggle */}
          <button
            onClick={() => setResponseLang(prev => prev === 'en' ? 'ta' : 'en')}
            className="px-2 py-1 rounded-lg text-[10px] font-semibold border border-blue-400/30 bg-blue-500/20 text-cyan-200 hover:bg-blue-500/30 transition-all flex items-center gap-1"
            title="Toggle Assistant Response Language (English / Tamil)"
          >
            <Languages className="w-3 h-3 text-cyan-300" />
            <span>{responseLang === 'en' ? 'EN Reply' : 'தமிழ் Reply'}</span>
          </button>

          {/* Auto-Voice Toggle */}
          <button
            onClick={() => setIsAutoSpeak(!isAutoSpeak)}
            className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
              isAutoSpeak
                ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title={isAutoSpeak ? "Auto-Voice is ON (click to mute)" : "Auto-Voice is OFF (click to enable auto-speech)"}
          >
            {isAutoSpeak ? <Volume2 className="w-4 h-4 text-cyan-300" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={clearChat}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 text-xs transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Close Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-2.5 py-1 rounded-full whitespace-nowrap text-[11px] font-medium transition-all ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
          }`}
        >
          🌟 Featured
        </button>
        {QUESTION_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap text-[11px] font-medium transition-all ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Suggested Quick Prompts Horizontal Scroll */}
      <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 pl-1">
          Ask:
        </span>
        {activeQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            className="bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 hover:border-blue-300 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all shadow-2xs font-medium text-[11px]"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs shadow-sm leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-br-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                }`}
              >
                {/* Message Content with Markdown rendering */}
                <div className="prose prose-xs max-w-none text-xs">
                  {msg.content.split('\n').map((line, lIdx) => {
                    if (line.startsWith('### ')) {
                      return <h4 key={lIdx} className="font-bold text-slate-900 text-xs mt-2 mb-1 border-b pb-1">{line.replace('### ', '')}</h4>;
                    }
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return <p key={lIdx} className="font-bold text-slate-800 my-0.5">{line.replace(/\*\*/g, '')}</p>;
                    }
                    if (line.startsWith('- ')) {
                      return (
                        <div key={lIdx} className="flex items-start gap-1.5 my-0.5">
                          <span className="text-blue-500 shrink-0">•</span>
                          <span>
                            {line.substring(2).split('**').map((part, pIdx) =>
                              pIdx % 2 === 1 ? <strong key={pIdx} className="font-semibold text-slate-900">{part}</strong> : part
                            )}
                          </span>
                        </div>
                      );
                    }
                    if (line.startsWith('|')) {
                      return (
                        <div key={lIdx} className="overflow-x-auto my-1 font-mono text-[10px] bg-slate-50 p-1 rounded border border-slate-200">
                          {line}
                        </div>
                      );
                    }
                    if (line.includes('🌐 *[')) {
                      return (
                        <div key={lIdx} className="bg-blue-50 text-blue-800 px-2 py-1 rounded border border-blue-200 font-medium text-[11px] mb-2 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-blue-600" />
                          <span>Understood from Tamil query • Responding in English</span>
                        </div>
                      );
                    }
                    return line ? (
                      <p key={lIdx} className="my-1">
                        {line.split('**').map((part, pIdx) =>
                          pIdx % 2 === 1 ? <strong key={pIdx} className="font-semibold text-slate-900">{part}</strong> : part
                        )}
                      </p>
                    ) : <div key={lIdx} className="h-1"></div>;
                  })}
                </div>

                {/* Evidence citations */}
                {msg.evidence_sources && msg.evidence_sources.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] space-y-1 text-slate-500">
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Ground-Truth Evidence Provenance:
                    </span>
                    {msg.evidence_sources.map((src, sIdx) => (
                      <div key={sIdx} className="bg-slate-50 px-2 py-0.5 rounded text-[10px] text-slate-600 border border-slate-100">
                        • {src.source} <span className="text-slate-400">({src.type})</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Missing Data Warning */}
                {msg.missing_data_explanation && (
                  <div className="mt-2 bg-amber-50 border border-amber-200 rounded p-1.5 text-[10px] text-amber-800 flex items-start gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                    <span>{msg.missing_data_explanation}</span>
                  </div>
                )}

                {/* Instant Audio Playback Control */}
                {!isUser && (msg.audio_url || msg.content) && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      onClick={() => (isPlayingAudio ? stopAudio() : playAudio(msg.audio_url, msg.content))}
                      className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all"
                    >
                      {isPlayingAudio ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-rose-600" />
                          <span>Stop Voice</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Listen ({responseLang === 'ta' ? 'Tamil' : 'English'})</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-center gap-2 text-slate-500 text-xs pl-2 bg-white p-2 rounded-xl border border-slate-200 w-fit shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></span>
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]"></span>
            <span className="text-[11px] font-medium">Translating & querying 2026 telemetry...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice Recognition Error Alert */}
      {speechError && (
        <div className="p-2.5 bg-rose-50 border-t border-rose-200 text-rose-800 text-[11px] flex items-center justify-between">
          <span>{speechError}</span>
          <button onClick={() => setSpeechError(null)} className="text-rose-600 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Listening Indicator with Dual Language Awareness */}
      {isListening && (
        <div className="p-2.5 bg-blue-50 border-t border-blue-200 text-blue-800 text-xs flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
            <span className="font-semibold">
              Listening in {micLang === 'ta-IN' ? 'தமிழ் (Tamil)' : 'English (US)'}... (Mic stays on through pauses until Send)
            </span>
          </div>
          <button
            onClick={toggleListening}
            className="text-xs bg-red-500 hover:bg-red-600 text-white px-2.5 py-1 rounded-md font-medium transition-colors"
          >
            Done
          </button>
        </div>
      )}

      {/* Chat Input Bar with Dual Mic Language Switch */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-1.5"
        >
          {/* Microphone Button & Language Pill */}
          <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2 rounded-lg transition-all ${
                isListening
                  ? 'bg-red-500 text-white shadow-md shadow-red-500/30 animate-pulse'
                  : 'text-slate-700 hover:text-blue-600 hover:bg-white'
              }`}
              title={isListening ? "Listening... click to stop" : `Click to speak (${micLang === 'ta-IN' ? 'Tamil' : 'English'})`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Mic Language Selector Toggle Button (Tamil / English) */}
            <button
              type="button"
              onClick={() => setMicLang(prev => prev === 'ta-IN' ? 'en-US' : 'ta-IN')}
              className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all ${
                micLang === 'ta-IN'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-blue-600 text-white shadow-xs'
              }`}
              title="Click to toggle mic listening language: Tamil (தமிழ்) or English (EN)"
            >
              {micLang === 'ta-IN' ? 'தமிழ்' : 'EN'}
            </button>
          </div>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              currentInputTextRef.current = e.target.value;
              baseTextRef.current = e.target.value;
            }}
            placeholder={micLang === 'ta-IN' ? "Ask in Tamil or English (e.g. மழை எவ்வளவு?)..." : "Ask in English or Tamil (e.g. weather today)..."}
            className="flex-1 bg-slate-100 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-transparent focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white shadow-sm shadow-blue-500/25 transition-all"
            title="Send Question"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
          <span>Mic: <b className="text-slate-600">{micLang === 'ta-IN' ? 'Tamil (தமிழ்)' : 'English (EN)'}</b> • Output: <b className="text-slate-600">{responseLang === 'en' ? 'English (Auto-Translate)' : 'Tamil'}</b></span>
          <span>Fast Real-Time Ground-Truth Telemetry</span>
        </div>
      </div>
    </div>
  );
};
