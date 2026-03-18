
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, Mic, MicOff, BrainCircuit, Globe, ChevronRight, Activity, Zap, ExternalLink, MapPin, Link as LinkIcon, Info } from 'lucide-react';
import { geminiAssistant, GroundingLink } from '../services/geminiService';
import { Appointment, Client } from '../types';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

// Fix: Manual base64 encoding for raw PCM audio streaming
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Fix: Manual base64 decoding for raw PCM audio playback
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Fix: Custom audio decoding for raw PCM data streams
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

// Fix: Utility to create PCM blobs for real-time input
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

const AIAssistant: React.FC<{ appointments: Appointment[], clients: Client[] }> = ({ appointments, clients }) => {
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: "Hello! I'm your EasyBookly Intelligence core. I can analyze your upcoming sessions, optimize your availability, or help with client prep. How can I assist you?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);
    
    try {
      const response = await geminiAssistant.analyzeSchedule(appointments, clients, userMsg);
      setMessages(prev => [...prev, { role: 'assistant', content: response.text, links: response.links }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Protocol error. Neural sync interrupted." }]);
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

    // Check for API key selection for advanced Live model
    if (typeof (window as any).aistudio !== 'undefined') {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
        // Assume success and proceed as per guidelines
      }
    }

    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    const outputNode = outputAudioContext.createGain();
    outputNode.connect(outputAudioContext.destination);
    
    let nextStartTime = 0;
    const sources = new Set<AudioBufferSourceNode>();
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsVoiceMode(true);
      // Use process.env.API_KEY for selected key
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } },
          systemInstruction: `You are the EasyBookly Intelligence Core. Answer questions about the schedule briefly. Access to ${appointments.length} appointments.`,
        },
        callbacks: {
          onopen: () => {
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
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
              sources.add(source);
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
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm max-w-5xl mx-auto">
      <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-blue/20">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-bold text-brand-dark">AI Intelligence Hub</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Powered by Google Gemini</p>
          </div>
        </div>
        <button 
          onClick={toggleVoiceMode}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${isVoiceMode ? 'bg-rose-500 text-white animate-pulse' : 'bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20'}`}
        >
          {isVoiceMode ? <MicOff size={14}/> : <Mic size={14}/>}
          {isVoiceMode ? 'Stop Voice' : 'Voice Mode'}
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30 custom-scroll">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-brand-blue text-white' : 'bg-slate-200 text-slate-600'}`}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-brand-blue text-white' : 'bg-white border border-slate-200 text-slate-700 shadow-sm'}`}>
                {msg.content}
                
                {msg.links && msg.links.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                     {msg.links.map((link: any, idx: number) => (
                       <a key={idx} href={link.uri} target="_blank" className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold hover:bg-slate-200 transition-colors">
                         <LinkIcon size={10} /> {link.title.substring(0, 20)}...
                       </a>
                     ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="w-12 h-8 bg-slate-100 rounded-full flex items-center justify-center animate-pulse">
                <div className="flex gap-1">
                   <div className="w-1 h-1 bg-slate-400 rounded-full" />
                   <div className="w-1 h-1 bg-slate-400 rounded-full" />
                   <div className="w-1 h-1 bg-slate-400 rounded-full" />
                </div>
             </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-white border-t border-slate-100">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything about your business..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 pr-16 text-sm font-medium focus:ring-1 focus:ring-brand-blue outline-none transition-all"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand-blue text-white rounded-lg flex items-center justify-center hover:bg-brand-dark transition-all disabled:opacity-20"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
