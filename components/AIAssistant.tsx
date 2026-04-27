
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Sparkles, Loader2, Mic, MicOff, BrainCircuit, Globe, ChevronRight, Activity, Zap, ExternalLink, MapPin, Link as LinkIcon, Info, X, MessageSquare, Cpu } from 'lucide-react';
import { geminiAssistant, GroundingLink } from '../services/geminiService';
import { Appointment, Client } from '../types';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { translations, Language } from '../services/translations';

// Base64 utilities (keeping these as they are used for audio)
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array) {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const AIAssistant: React.FC<{ 
  appointments: Appointment[], 
  clients: Client[], 
  externalEvents?: any[],
  language: Language 
}> = ({ appointments, clients, externalEvents = [], language }) => {
  const t = translations[language];
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: t.aiGreeting }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isDeepStrategy, setIsDeepStrategy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input;
    setInput("");
    
    const displayMsg = isDeepStrategy ? `[Deep Strategy] ${userMsg}` : userMsg;
    setMessages(prev => [...prev, { role: 'user', content: displayMsg }]);
    setIsLoading(true);
    
    try {
      // Create unified events for the assistant
      const allEvents = [
        ...appointments.map(a => ({ ...a, source: 'EasyBookly' })),
        ...externalEvents.map(e => ({
          id: e.id,
          service: 'External Focus',
          title: e.title,
          date: e.start.split('T')[0],
          time: (e.start.includes('T') ? e.start.split('T')[1] : '00:00').substring(0, 5),
          status: 'confirmed',
          source: e.provider || 'Calendar'
        }))
      ];

      if (isDeepStrategy) {
        // Deep Strategy uses Direct Gemini API with Grounding
        if (typeof (window as any).aistudio !== 'undefined') {
          const hasKey = await (window as any).aistudio.hasSelectedApiKey();
          if (!hasKey) {
            await (window as any).aistudio.openSelectKey();
          }
        }

        let apiKey = (window as any).GEMINI_API_KEY || (window as any).API_KEY;
        if (!apiKey) {
          apiKey = typeof process !== 'undefined' ? (process.env.GEMINI_API_KEY || process.env.API_KEY) : undefined;
        }

        if (!apiKey) {
          throw new Error("API Key required for Deep Strategy mode.");
        }

        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: [
            { role: 'user', parts: [{ text: `System Context: You are a elite business strategy consultant for EasyBookly. 
              Schedule Data: ${JSON.stringify(allEvents)}. 
              Task: Analyze the request with deep strategic foresight. Use Google Search to find relevant market trends or competitors if needed.
              Current Request: ${userMsg}` }] }
          ],
          config: {
            tools: [{ googleSearch: {} }]
          }
        });

        const groundingLinks = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
          uri: chunk.web?.uri || "",
          title: chunk.web?.title || "Reference Source"
        })).filter((l: any) => l.uri) || [];

        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response.text || "Strategic insight complete.", 
          links: groundingLinks 
        }]);
      } else {
        const response = await geminiAssistant.analyzeSchedule(allEvents as any, clients, userMsg);
        setMessages(prev => [...prev, { role: 'assistant', content: response.text, links: response.links }]);
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `${t.aiError} ${error.message || ""}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoiceMode = async () => {
    if (isVoiceMode) {
      setIsVoiceMode(false);
      if (sessionRef.current) sessionRef.current.close();
      return;
    }

    if (typeof (window as any).aistudio !== 'undefined') {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
    }

    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    const outputNode = outputAudioContext.createGain();
    outputNode.connect(outputAudioContext.destination);
    
    let nextStartTime = 0;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsVoiceMode(true);
      
      let apiKey = (window as any).GEMINI_API_KEY || (window as any).API_KEY;

      if (!apiKey) {
        // Fallback to process.env if available (for some local dev setups)
        apiKey = typeof process !== 'undefined' ? (process.env.GEMINI_API_KEY || process.env.API_KEY) : undefined;
      }

      if (!apiKey || apiKey === '' || apiKey === 'undefined') {
        const confirmed = window.confirm("Voice Intelligence requires an API key. Would you like to select one now?");
        if (confirmed) {
          (window as any).aistudio?.openSelectKey();
        }
        setIsVoiceMode(false);
        return;
      }
      
      const ai = new GoogleGenAI({ apiKey });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } },
          systemInstruction: `You are the EasyBookly Intelligence Core. Answer questions about the schedule briefly. Access to ${appointments.length + externalEvents.length} total events.`,
        },
        callbacks: {
          onopen: () => {
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ audio: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64EncodedAudioString) {
              nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
              const audioBuffer = await decodeAudioData(
                decode(base64EncodedAudioString),
                outputAudioContext,
                24000,
                1,
              );
              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNode);
              source.start(nextStartTime);
              nextStartTime = nextStartTime + audioBuffer.duration;
            }
          },
          onclose: () => setIsVoiceMode(false),
          onerror: () => setIsVoiceMode(false),
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      setIsVoiceMode(false);
    }
  };

  return (
    <>
      {/* Floating Robot Mascot */}
      <motion.div 
        className="fixed bottom-8 right-8 z-[999]"
        initial={{ y: 0 }}
        animate={{ 
          y: isOpen ? -20 : [0, -10, 0],
        }}
        transition={{ 
          y: {
            duration: isOpen ? 0.3 : 3,
            repeat: isOpen ? 0 : Infinity,
            ease: "easeInOut"
          }
        }}
      >
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`relative group p-4 rounded-full shadow-2xl transition-all ${
            isOpen 
            ? 'bg-rose-500 hover:bg-rose-600 scale-90' 
            : 'bg-brand-blue hover:bg-brand-dark scale-110'
          }`}
        >
          {/* Robotic "Antenna" or Interaction Ring */}
          <div className="absolute -top-1 -right-1 flex gap-0.5">
             <div className={`w-2 h-2 rounded-full ${isLoading || isVoiceMode ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 opacity-50'}`} />
          </div>

          {/* Robot Eyes / Core */}
          <div className="relative flex items-center justify-center">
            {isOpen ? <X className="text-white" size={24} /> : (
              <div className="relative">
                <Bot className="text-white" size={28} />
                <motion.div 
                  className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-2"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-1 h-1 bg-emerald-400 rounded-full shadow-[0_0_5px_#10b981]" />
                  <div className="w-1 h-1 bg-emerald-400 rounded-full shadow-[0_0_5px_#10b981]" />
                </motion.div>
              </div>
            )}
          </div>

          {/* Tooltip */}
          {!isOpen && (
            <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-brand-dark text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl transition-all pointer-events-none">
              {t.aiTooltip}
            </div>
          )}
        </button>
      </motion.div>

      {/* Chat Interface Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
            className="fixed bottom-28 right-8 w-[400px] max-h-[600px] h-[70vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-[998] flex flex-col"
          >
            <header className="px-6 py-5 bg-brand-dark text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Cpu className="text-brand-blue" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">{t.aiHeader}</h3>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDeepStrategy ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    <span className="text-[10px] font-black uppercase tracking-tighter opacity-60">
                      {isDeepStrategy ? t.activeDeepStrategy : t.aiStatus}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsDeepStrategy(!isDeepStrategy)}
                  title={t.deepStrategy}
                  className={`p-2 rounded-xl transition-all ${isDeepStrategy ? 'bg-amber-400 text-brand-dark shadow-[0_0_15px_rgba(251,191,36,0.5)]' : 'hover:bg-white/10 text-white/60 hover:text-white'}`}
                >
                  <Zap size={18}/>
                </button>
                <button 
                  onClick={toggleVoiceMode}
                  className={`p-2 rounded-xl transition-all ${isVoiceMode ? 'bg-rose-500 text-white animate-pulse' : 'hover:bg-white/10 text-white/60 hover:text-white'}`}
                >
                  {isVoiceMode ? <MicOff size={18}/> : <Mic size={18}/>}
                </button>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 custom-scroll">
              {isDeepStrategy && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-2 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-amber-900 uppercase tracking-wider">{t.activeDeepStrategy}</h4>
                      <p className="text-[10px] text-amber-700 font-medium leading-normal mt-1">{t.deepStrategyDesc}</p>
                    </div>
                  </div>
                </motion.div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-brand-blue text-white rounded-2xl rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-none shadow-sm'} p-4 text-xs font-medium leading-relaxed`}>
                    {msg.content}
                    
                    {msg.links && msg.links.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                         {msg.links.map((link: any, idx: number) => (
                           <a key={idx} href={link.uri} target="_blank" className="inline-flex items-center gap-2 px-2 py-1 bg-slate-100 text-slate-600 rounded text-[9px] font-bold hover:bg-slate-200">
                             <LinkIcon size={8} /> {link.title.substring(0, 15)}...
                           </a>
                         ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                   <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3 shadow-sm">
                      <div className="flex gap-1">
                         <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 h-1 bg-slate-400 rounded-full" />
                         <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1 h-1 bg-slate-400 rounded-full" />
                         <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1 h-1 bg-slate-400 rounded-full" />
                      </div>
                   </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-100">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={t.aiPlaceholder}
                  className="w-full bg-slate-100 border-none rounded-2xl px-5 py-3 pr-12 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-blue/20 placeholder:text-slate-400"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-brand-blue text-white rounded-xl flex items-center justify-center hover:bg-brand-dark transition-all disabled:opacity-20"
                >
                  <Send size={14} />
                </button>
              </div>
              <p className="text-[9px] text-center text-slate-400 mt-3 font-bold uppercase tracking-widest">{t.aiPowered}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;
