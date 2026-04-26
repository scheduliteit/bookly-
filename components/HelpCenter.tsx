
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Mail, 
  MessageSquare, 
  LifeBuoy, 
  BookOpen, 
  Zap, 
  ArrowRight,
  ShieldCheck,
  Search,
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { translations, Language } from '../services/translations';

interface HelpCenterProps {
  language: Language;
  onOpenAiAssistant: () => void;
}

const HelpCenter: React.FC<HelpCenterProps> = ({ language, onOpenAiAssistant }) => {
  const t = translations[language];
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    { q: t.faqQ1, a: t.faqA1 },
    { q: t.faqQ2, a: t.faqA2 },
    { q: t.faqQ3, a: t.faqA3 },
    { q: t.faqQ4, a: t.faqA4 },
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 pb-32 max-w-7xl mx-auto">
      {/* Strategic Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-slate-100 pb-12"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-brand-blue/5 text-brand-blue rounded-full w-fit border border-brand-blue/10">
             <LifeBuoy size={14} className="animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest">{t.helpCenterTitle}</span>
          </div>
          <h1 className="text-5xl font-black text-brand-dark tracking-tight leading-[0.9]">
            {t.helpCenterTitle}.
          </h1>
          <p className="text-slate-500 font-medium text-lg max-w-2xl">{t.helpCenterSubtitle}</p>
        </div>

        <div className="relative w-full lg:w-96">
           <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
           <input 
             type="text"
             placeholder={t.search}
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full pl-16 pr-8 py-5 bg-white border-2 border-slate-100 rounded-[28px] focus:border-brand-blue outline-none transition-all font-bold text-slate-600 shadow-sm"
           />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Support Content */}
        <div className="lg:col-span-2 space-y-12">
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black text-brand-dark tracking-tight">{t.commonQuestions}</h2>
              <BookOpen size={24} className="text-slate-200" />
            </div>

            <div className="space-y-4">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`bg-white border-2 rounded-[32px] transition-all overflow-hidden ${openFaq === idx ? 'border-brand-blue shadow-lg shadow-brand-blue/5' : 'border-slate-50 hover:border-slate-200'}`}
                  >
                    <button 
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full px-8 py-7 flex items-center justify-between text-left group"
                    >
                      <span className={`text-lg font-black transition-colors ${openFaq === idx ? 'text-brand-blue' : 'text-slate-700 group-hover:text-brand-blue'}`}>
                        {faq.q}
                      </span>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${openFaq === idx ? 'bg-brand-blue text-white rotate-180' : 'bg-slate-50 text-slate-400'}`}>
                        <ChevronDown size={20} />
                      </div>
                    </button>
                    <AnimatePresence>
                      {openFaq === idx && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-8 pb-8"
                        >
                          <div className="pt-4 border-t border-slate-50">
                            <p className="text-slate-500 font-medium leading-relaxed">
                              {faq.a}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              ) : (
                <div className="py-20 text-center space-y-6 bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-[48px]">
                  <Search size={48} className="mx-auto text-slate-200" />
                  <p className="text-slate-400 font-bold italic">No answers found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          </section>

          {/* Quick Support Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-brand-dark rounded-[40px] p-10 text-white relative overflow-hidden group shadow-xl shadow-slate-900/20"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/10 rounded-full blur-3xl group-hover:bg-brand-blue/20 transition-all" />
              <Zap size={32} className="text-brand-blue mb-8" />
              <h3 className="text-2xl font-black mb-2">{t.chatWithAi}</h3>
              <p className="text-slate-400 text-sm font-medium mb-8">Get instant answers about your booking ecosystem from your neural assistant.</p>
              <button 
                onClick={onOpenAiAssistant}
                className="flex items-center gap-2 text-brand-blue text-xs font-black uppercase tracking-widest hover:text-white transition-colors"
              >
                Launch Intelligence <ArrowRight size={14} />
              </button>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white border-2 border-slate-50 rounded-[40px] p-10 relative overflow-hidden group shadow-sm hover:border-brand-blue/20 transition-all"
            >
              <Mail size={32} className="text-brand-blue mb-8" />
              <h3 className="text-2xl font-black text-brand-dark mb-2">{t.emailSupport}</h3>
              <p className="text-slate-400 text-sm font-medium mb-8">Can't find what you're looking for? Our human support team is ready to assist.</p>
              <a 
                href="mailto:support@easybookly.example"
                className="flex items-center gap-2 text-brand-blue text-xs font-black uppercase tracking-widest hover:text-brand-dark transition-colors"
              >
                Contact Engineers <ExternalLink size={14} />
              </a>
            </motion.div>
          </div>
        </div>

        {/* Sidebar Support Info */}
        <div className="space-y-8">
          <div className="bg-white border border-slate-100 rounded-[40px] p-10 space-y-10 shadow-sm">
            <div className="space-y-4">
              <h3 className="text-xl font-black text-brand-dark tracking-tight">{t.supportContact}</h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">
                {t.contactInfoLabel}
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 group cursor-pointer">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-blue/10 group-hover:text-brand-blue transition-all">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                  <p className="text-sm font-bold text-slate-600">support@easybookly.example</p>
                </div>
              </div>

              <div className="flex items-center gap-4 group cursor-pointer">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-blue/10 group-hover:text-brand-blue transition-all">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Status</p>
                  <p className="text-sm font-bold text-emerald-500">{t.operational}</p>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-50">
              <div className="px-6 py-4 bg-slate-50 rounded-2xl flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.responseTime}</span>
                <ShieldCheck size={16} className="text-brand-blue" />
              </div>
            </div>
          </div>

          <div className="bg-brand-blue rounded-[40px] p-10 text-white space-y-6 shadow-xl shadow-brand-blue/20">
            <Smartphone size={32} className="text-white/40" />
            <h3 className="text-xl font-black tracking-tight leading-tight">Master your business on the go.</h3>
            <p className="text-white/70 text-sm font-medium">Install our PWA to receive real-time push notifications and manage clients anywhere.</p>
            <button className="w-full py-4 bg-white text-brand-blue rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-dark hover:text-white transition-all shadow-lg">
              Install App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
