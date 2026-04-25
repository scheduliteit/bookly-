
import React, { useState, useEffect } from 'react';
import { Sparkles, Megaphone, Image as ImageIcon, Copy, Download, Loader2, Wand2, Smartphone, Monitor, Square, Check, RefreshCw, Video, Play, AlertCircle, ExternalLink, Lock, CheckCircle, Clock, Zap, ArrowRight, Mail, MessageSquare } from 'lucide-react';
import { auth } from '../firebase';

interface MarketingStudioProps {
  onAddWorkflow?: () => void;
}

const MarketingStudio: React.FC<MarketingStudioProps> = ({ onAddWorkflow }) => {
  const [activeTab, setActiveTab] = useState<'workflows' | 'creative'>('workflows');
  const [creativeMode, setCreativeMode] = useState<'image' | 'video'>('image');
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "9:16">("1:1");
  const [result, setResult] = useState<{ image?: string; video?: string; caption?: string } | null>(null);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      const selected = await (window as any).aistudio?.hasSelectedApiKey();
      setHasKey(!!selected);
    };
    checkKey();
  }, []);

  const workflows = [
    { name: 'Email reminders to host', trigger: 'When event is scheduled', icon: Mail, active: true },
    { name: 'Email reminders to invitee', trigger: '24 hours before event starts', icon: Clock, active: true },
    { name: 'Thank you email', trigger: '1 hour after event ends', icon: Sparkles, active: false },
    { name: 'Text reminder to invitee', trigger: '1 hour before event starts', icon: MessageSquare, active: true },
  ];

  const handleSelectKey = async () => {
    await (window as any).aistudio?.openSelectKey();
    setHasKey(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-32">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark tracking-tight">Workflows</h2>
          <p className="text-sm text-slate-500 mt-1">Automate your event communications with AI-driven sequences.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
           <button onClick={() => setActiveTab('workflows')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'workflows' ? 'bg-white shadow-sm text-brand-blue' : 'text-slate-500'}`}>
             Workflows
           </button>
           <button onClick={() => setActiveTab('creative')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'creative' ? 'bg-white shadow-sm text-brand-blue' : 'text-slate-500'}`}>
             Creative Studio
           </button>
        </div>
      </header>

      {activeTab === 'workflows' ? (
        <div className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {workflows.map((wf, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-all flex items-start gap-4">
                   <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-brand-blue border border-slate-100">
                      <wf.icon size={20} />
                   </div>
                   <div className="flex-1">
                      <h4 className="font-bold text-brand-dark">{wf.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">Trigger: {wf.trigger}</p>
                   </div>
                   <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${wf.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {wf.active ? 'Active' : 'Paused'}
                   </div>
                </div>
              ))}
           </div>
           
           <div className="bg-brand-blue/5 border border-dashed border-brand-blue/30 rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-brand-blue shadow-sm">
                <PlusIcon size={24} />
              </div>
              <div>
                <h3 className="font-bold text-brand-dark">Create a custom workflow</h3>
                <p className="text-sm text-slate-500">Add an automation for any event type in seconds.</p>
              </div>
              <button onClick={onAddWorkflow} className="mt-2 px-6 py-2.5 bg-brand-blue text-white rounded-full font-bold text-sm shadow-md">Create workflow</button>
           </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {[
               { label: 'Potential Reached', value: '12,482', icon: Megaphone, color: 'text-brand-blue' },
               { label: 'Infinite AI Potential', value: 'Unlimited', icon: Zap, color: 'text-amber-500' },
               { label: 'Campaign Conversion', value: '+12.4%', icon: Sparkles, color: 'text-emerald-500' }
             ].map((stat, i) => (
               <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-4">
                     <div className={`p-3 bg-slate-50 rounded-2xl ${stat.color}`}>
                        <stat.icon size={20} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                        <p className="text-xl font-black text-brand-dark">{stat.value}</p>
                     </div>
                  </div>
               </div>
             ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-6">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ad Narrative</label>
                    <textarea 
                      placeholder="Describe your session's unique value..." 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm font-medium outline-none focus:ring-1 focus:ring-brand-blue min-h-[120px]"
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                    />
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => setCreativeMode('image')} className={`flex-1 py-3 rounded-lg border text-sm font-bold transition-all ${creativeMode === 'image' ? 'border-brand-blue bg-brand-blue/5 text-brand-blue' : 'border-slate-200 text-slate-500'}`}>Image Ad</button>
                    <button onClick={() => setCreativeMode('video')} className={`flex-1 py-3 rounded-lg border text-sm font-bold transition-all ${creativeMode === 'video' ? 'border-brand-blue bg-brand-blue/5 text-brand-blue' : 'border-slate-200 text-slate-500'}`}>Video Promo</button>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Aspect Ratio</label>
                    <div className="flex gap-4">
                       <button onClick={() => setAspectRatio("1:1")} className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${aspectRatio === "1:1" ? "border-brand-blue bg-brand-blue/5 text-brand-blue" : "border-slate-200 text-slate-500"}`}>1:1 Square</button>
                       <button onClick={() => setAspectRatio("9:16")} className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${aspectRatio === "9:16" ? "border-brand-blue bg-brand-blue/5 text-brand-blue" : "border-slate-200 text-slate-500"}`}>9:16 Stories</button>
                    </div>
                 </div>
                 <button 
                    onClick={async () => {
                      if (!prompt || isGenerating) return;
                      setIsGenerating(true);
                      setResult(null);
                      
                      try {
                        const token = await auth.currentUser?.getIdToken();
                        if (!token) throw new Error("Not authenticated");

                        if (creativeMode === 'image') {
                          // Note: We don't have a specific image endpoint yet, but we'll use a generic one or simulate it
                          // For now, let's assume we want to call the backend for the caption and use a placeholder image
                          const response = await fetch('/api/ai/answer-question', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ 
                              question: `Create a punchy social media caption for a business ad with this narrative: ${prompt}`,
                              context: { type: 'marketing', aspectRatio }
                            })
                          });

                          if (!response.ok) throw new Error("Failed to generate creative");
                          const data = await response.json();
                          
                          setResult({ 
                            image: `https://picsum.photos/seed/${prompt.length}/800/800`, 
                            caption: data.answer || `✨ Transform your business! Book your session today.` 
                          });
                        } else {
                          const response = await fetch('/api/ai/answer-question', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                              question: `Write a high-energy script and social media caption for a 15-second promo video about: ${prompt}`,
                              context: { type: 'video-script' }
                            })
                          });

                          if (!response.ok) throw new Error("Failed to generate script");
                          const data = await response.json();

                          setResult({
                            video: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
                            caption: data.answer
                          });
                        }
                      } catch (error: any) {
                        console.error("Creative Studio Error:", error);
                        alert("Operations system bottleneck: " + (error.message || "Please check your network and try again."));
                      } finally {
                        setIsGenerating(false);
                      }
                    }}
                    disabled={isGenerating || !prompt}
                    className="w-full py-4 bg-brand-blue text-white rounded-full font-bold shadow-lg hover:bg-brand-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                    {isGenerating ? 'Generating...' : 'Generate Creative'}
                 </button>
              </div>
            </div>
            
            <div className="bg-slate-100 rounded-xl flex items-center justify-center p-12 border-2 border-dashed border-slate-200 overflow-hidden relative min-h-[400px]">
               {result ? (
                 <div className="w-full h-full flex flex-col gap-4 animate-in zoom-in-95 duration-500">
                   {result.image && (
                     <img src={result.image} alt="AI Generated" className="w-full h-auto rounded-lg shadow-xl" referrerPolicy="no-referrer" />
                   )}
                   {result.video && (
                     <video src={result.video} controls className="w-full h-auto rounded-lg shadow-xl" />
                   )}
                   <div className="bg-white p-4 rounded-xl border border-slate-200">
                     <p className="text-xs text-slate-600 font-medium italic">"{result.caption}"</p>
                     <button 
                       onClick={() => {
                         navigator.clipboard.writeText(result.caption || '');
                       }}
                       className="mt-3 flex items-center gap-2 text-[10px] font-black text-brand-blue uppercase tracking-widest"
                     >
                       <Copy size={12} /> Copy Caption
                     </button>
                   </div>
                 </div>
               ) : (
                 <div className="text-center space-y-2 text-slate-400">
                    <ImageIcon size={48} className="mx-auto opacity-20" />
                    <p className="text-sm font-bold">Creative Preview Area</p>
                    <p className="text-[10px] uppercase tracking-widest">{isGenerating ? 'Gemini is creating your masterpiece...' : 'Enter a prompt to start'}</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PlusIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

export default MarketingStudio;
