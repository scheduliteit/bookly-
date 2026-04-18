
import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Zap, ShieldCheck, ArrowRight, TrendingUp, Gift, Heart, Star, Users, Lock, X, CheckCircle } from 'lucide-react';

interface ViralHypePanelProps {
  onExplore?: () => void;
}

const ViralHypePanel: React.FC<ViralHypePanelProps> = ({ onExplore }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-brand-dark rounded-[48px] p-1 border-4 border-brand-blue/20 shadow-2xl shadow-brand-blue/10 mb-12"
    >
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-blue/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      
      {/* Dynamic Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <div className="relative z-10 p-8 md:p-14 flex flex-col lg:flex-row items-center gap-12">
        {/* Text Content */}
        <div className="flex-1 space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-blue/10 border border-brand-blue/20 rounded-full">
            <Sparkles size={14} className="text-brand-blue animate-pulse" />
            <span className="text-[10px] font-black text-brand-blue uppercase tracking-[0.2em]">The Great Disruption</span>
          </div>

          <div className="space-y-4">
            <h2 className="text-5xl md:text-7xl font-black text-white leading-[0.9] tracking-tighter">
              OTHERS CHARGE <br />
              <span className="text-brand-blue italic pr-2">WE DISRUPT</span>
            </h2>
            <p className="text-slate-400 text-lg md:text-xl font-medium max-w-xl leading-relaxed">
              While our competitors gatekeep their best features behind monthly fees, we're giving you the full 
              <span className="text-white font-bold ml-1 italic">Enterprise Suite—completely free.</span> 
              No catch, no hidden fees, just pure growth.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <button 
              onClick={onExplore}
              className="group px-10 py-5 bg-brand-blue text-white rounded-[24px] font-black text-base shadow-2xl shadow-brand-blue/40 hover:bg-white hover:text-brand-dark transition-all flex items-center gap-3 active:scale-95"
            >
              CLAIM YOUR EARLY ACCESS <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </button>
            <div className="flex items-center gap-2 text-slate-500 font-bold text-sm bg-white/5 px-6 py-5 rounded-[24px] border border-white/5">
              <Zap size={18} className="text-amber-400" /> 
              SaaS REVOLUTION STARTING
            </div>
          </div>
        </div>

        {/* Visual Comparison Card */}
        <div className="w-full lg:w-[450px] shrink-0 space-y-4">
          {/* Scarcity Counter */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <Gift size={20} className="text-amber-400" />
                <span className="text-xs font-black text-white uppercase tracking-wider">Early Adopter Bonus</span>
             </div>
             <span className="text-xs font-black text-amber-400">92% CLAIMED</span>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-[40px] border border-white/10 p-8 space-y-6">
            <h4 className="text-xs font-black text-brand-blue uppercase tracking-widest text-center">Market Protocol Breach</h4>
            
            <div className="space-y-4">
              {/* Them */}
              <div className="p-5 bg-black/40 rounded-3xl border border-white/5 opacity-60">
                <div className="flex items-center justify-between mb-3 text-white/40">
                   <div className="flex items-center gap-2">
                     <Lock size={12} />
                     <span className="text-[10px] font-black uppercase tracking-widest">Legacy Competitors</span>
                   </div>
                   <span className="text-xs font-black">$480 - $900 / yr</span>
                </div>
                <ul className="space-y-1">
                   {['Paywalled AI Features', 'Gated Custom Routing', 'Paid Branding Removes'].map(f => (
                     <li key={f} className="text-[9px] font-bold text-rose-400/50 uppercase flex items-center gap-2">
                        <X size={10} /> {f}
                     </li>
                   ))}
                </ul>
              </div>

              {/* Us */}
              <div className="p-7 bg-brand-blue/20 rounded-[32px] border-2 border-brand-blue shadow-2xl shadow-brand-blue/30 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rotate-45 translate-x-12 -translate-y-12" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest">EasyBookly Freedom</span>
                    <div className="flex items-center gap-1.5 bg-brand-blue text-white px-3 py-1 rounded-full animate-bounce">
                        <Zap size={10} fill="currentColor" />
                        <span className="text-[9px] font-black uppercase tracking-tighter">LOCKED: FREE</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <ul className="space-y-1.5 mb-4">
                      {['Infinite Gemini AI Intelligence', 'Unlimited Custom Event Types', 'Full Brand White-labeling (No Ads)'].map(f => (
                        <li key={f} className="text-[10px] font-bold text-white uppercase flex items-center gap-2">
                            <CheckCircle size={12} className="text-emerald-400" /> {f}
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-between items-end border-t border-white/10 pt-4">
                        <div className="flex flex-col">
                           <span className="text-[9px] font-black text-brand-blue/60 uppercase">Total Lifetime Value</span>
                           <span className="text-3xl font-black text-white leading-none">$0.00</span>
                        </div>
                        <span className="text-[10px] font-black text-brand-blue bg-white px-4 py-2 rounded-xl transition-all group-hover:bg-brand-blue group-hover:text-white border border-brand-blue/20">PREMIUM UNLOCKED</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ViralHypePanel;
