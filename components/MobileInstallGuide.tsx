
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Share, PlusSquare, X, ChevronRight, SmartphoneNfc, Download, CheckCircle2 } from 'lucide-react';

interface MobileInstallGuideProps {
  onClose: () => void;
}

const MobileInstallGuide: React.FC<MobileInstallGuideProps> = ({ onClose }) => {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    }
  }, []);

  const steps = platform === 'ios' ? [
    { icon: <Share size={18} />, text: 'Tap the "Share" button in your Safari toolbar' },
    { icon: <PlusSquare size={18} />, text: 'Scroll down and select "Add to Home Screen"' },
    { icon: <CheckCircle2 size={18} />, text: 'Tap "Add" in the top right corner' }
  ] : [
    { icon: <PlusSquare size={18} />, text: 'Tap the three-dot menu in Chrome' },
    { icon: <Download size={18} />, text: 'Select "Install app" or "Add to Home Screen"' },
    { icon: <CheckCircle2 size={18} />, text: 'Confirm the installation in the prompt' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-brand-dark/90 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Decor */}
        <div className="h-32 bg-brand-blue flex items-center justify-center relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
           <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-sm">
             <SmartphoneNfc size={32} />
           </div>
           
           <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
           >
             <X size={20} />
           </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black text-brand-dark tracking-tight">Install EasyBookly</h3>
            <p className="text-sm text-slate-500 font-medium px-4">Get the full app experience directly on your phone's home screen.</p>
          </div>

          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 group">
                <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-brand-blue group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-0.5">Step {i + 1}</p>
                  <p className="text-sm font-bold text-slate-700">{step.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-brand-blue/5 border border-brand-blue/10 p-5 rounded-2xl">
            <div className="flex gap-4 items-start text-brand-blue">
               <div className="shrink-0 mt-1"><Smartphone size={18} /></div>
               <p className="text-xs font-bold leading-relaxed"> No App Store login required. Works instantly across all your devices.</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-4 bg-brand-dark text-white rounded-full font-black text-sm tracking-widest hover:bg-brand-blue transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            GOT IT, THANKS <ChevronRight size={18} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MobileInstallGuide;
