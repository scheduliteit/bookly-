
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, ShieldCheck, Sparkles, Globe, ArrowRight, Play, Check, 
  Crown, Rocket, Star, Heart, Activity, DollarSign, Timer, CreditCard, X, Users, MessageSquare
} from 'lucide-react';
import Logo from './Logo';
import LanguageSwitcher from './LanguageSwitcher';
import { Language, translations } from '../services/translations';

interface LandingPageProps {
  onStart: (mode?: 'register' | 'login') => void;
  onLogin: () => void;
  isLoggedIn: boolean;
  language: Language;
  onUpdateLanguage: (lang: Language) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLogin, isLoggedIn, language, onUpdateLanguage }) => {
  const [showMagic, setShowMagic] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const t = translations[language];

  const monthlyStarter = 13;
  const annualStarter = 7.5; // $90 / 12
  const monthlyElite = 25;
  const annualElite = 15; // $180 / 12

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-brand-blue/10 selection:text-brand-blue overflow-x-hidden" dir={t.dir}>
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo size="md" />
          <div className="hidden md:flex items-center gap-10">
            {[
              { label: t.product, id: 'staff' },
              { label: t.features, id: 'features' },
              { label: t.pricing, id: 'pricing' },
              { label: t.aiAssistant, id: 'ai' }
            ].map((item, idx) => (
              <a key={idx} href={`#${item.id}`} className="text-sm font-black text-slate-400 hover:text-brand-blue transition-all uppercase tracking-widest">{item.label}</a>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher currentLanguage={language} onUpdateLanguage={onUpdateLanguage} />
            <button onClick={onLogin} className="hidden sm:block text-sm font-black text-slate-900 uppercase tracking-widest px-6 py-2 hover:bg-slate-50 rounded-full transition-all">
              {isLoggedIn ? t.dashboard : t.login}
            </button>
            <button onClick={() => onStart('register')} className="px-8 py-3 bg-brand-blue text-white rounded-full font-black text-sm uppercase tracking-widest shadow-xl shadow-brand-blue/20 hover:bg-brand-dark transition-all active:scale-95">
              {isLoggedIn ? t.dashboard : t.getStarted}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-blue/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-blue/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-4xl space-y-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-5 py-2 bg-brand-blue/10 text-brand-blue rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-brand-blue/10"
            >
              <Sparkles size={14} className="animate-pulse" /> {t.heroTag}
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-7xl md:text-[9.5rem] font-black text-brand-dark leading-[0.85] tracking-tighter"
            >
              {language === 'he' || language === 'ar' ? (
                <> {t.heroTitle1} <br/> {t.heroTitle2} </>
              ) : (
                <> {t.heroTitle1}<br /> {t.heroTitle2} </>
              )}
            </motion.div>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-3xl text-slate-500 font-medium max-w-3xl leading-relaxed"
            >
              {t.heroSubtitle}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col lg:flex-row items-center gap-6 pt-6"
            >
              <button 
                onClick={() => onStart()}
                className="w-full lg:w-auto px-16 py-8 bg-brand-blue text-white rounded-[32px] font-black text-2xl shadow-3xl shadow-brand-blue/30 hover:bg-brand-dark transition-all transform hover:-translate-y-1 flex items-center justify-center gap-4"
              >
                {t.accessDashboard} <ArrowRight size={28} className={t.dir === 'rtl' ? 'rotate-180' : ''} />
              </button>
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setShowMagic(true)}
                  className="flex items-center gap-4 text-brand-dark font-black uppercase tracking-widest text-sm hover:scale-105 transition-all p-4"
                >
                  <div className="w-14 h-14 bg-brand-dark rounded-full flex items-center justify-center text-white"><Play size={20} fill="currentColor" className={t.dir === 'rtl' ? 'rotate-180' : ''} /></div>
                  {t.watchMagic}
                </button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-6 md:gap-12 pt-10 flex-wrap"
            >
               <div className="flex -space-x-4">
                  <div className="w-12 h-12 rounded-2xl border-4 border-white bg-brand-blue flex items-center justify-center text-white font-black text-xs shadow-lg"><Globe size={18} /></div>
                  <div className="w-12 h-12 rounded-2xl border-4 border-white bg-slate-900 flex items-center justify-center text-white font-black text-xs shadow-lg">BETA</div>
                  <div className="w-12 h-12 rounded-2xl border-4 border-white bg-emerald-500 flex items-center justify-center text-white font-black text-xs shadow-lg"><Check size={18} /></div>
               </div>
               <div className="space-y-1">
                  <div className="flex gap-1 text-emerald-500 items-center"><Check size={14} strokeWidth={4} /><span className="text-[10px] font-black uppercase tracking-widest leading-none">FREE PRO ACCESS</span></div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">{t.joinFuture}</p>
               </div>
               <div className="h-8 w-px bg-slate-100 hidden md:block" />
               <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" />
                    ))}
                  </div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">120+ Active Pilots</p>
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Proof Section - Logo Wall */}
      <section className="py-12 bg-slate-50/30 border-y border-slate-100/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-12 overflow-x-auto no-scrollbar">
           <p className="whitespace-nowrap text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] leading-none">{t.builtForProfessionals}</p>
           <div className="flex items-center gap-12 md:gap-24 opacity-20 grayscale hover:grayscale-0 transition-all duration-1000">
              {['Architects', 'Consultants', 'Engineers', 'Coaches', 'Designers', 'Lawyers', 'Developers'].map(name => (
                <span key={name} className="text-xl font-black tracking-tighter text-slate-900 whitespace-nowrap">{name}</span>
              ))}
           </div>
        </div>
      </section>

      {/* Staff & Team Section */}
      <section id="staff" className="py-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="order-2 lg:order-1 relative">
             <div className="absolute inset-0 bg-brand-blue/5 blur-3xl transform -rotate-6 scale-110" />
             <div className="bg-white border border-slate-100 rounded-[48px] p-8 shadow-2xl relative">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-blue/10 text-brand-blue rounded-xl flex items-center justify-center"><Users size={20} /></div>
                    <h4 className="font-black text-brand-dark uppercase tracking-widest text-xs">Team Management</h4>
                  </div>
                  <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100" />
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  {[
                    { name: 'Sarah Miller', role: 'Senior Strategy', status: 'Available' },
                    { name: 'David Chen', role: 'Technical Lead', status: 'Booked' },
                    { name: 'Elena Rodriguez', role: 'Product Design', status: 'On Break' }
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100" />
                        <div>
                          <p className="text-sm font-black text-brand-dark">{s.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.role}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        s.status === 'Available' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {s.status}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Auto-Assignment</p>
                      <p className="text-xs font-black text-brand-dark">Load Balancing Active</p>
                   </div>
                   <div className="w-12 h-6 bg-brand-blue rounded-full relative">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                   </div>
                </div>
             </div>
          </div>
          
          <div className="order-1 lg:order-2 space-y-10">
             <div className="w-16 h-16 bg-brand-blue/10 text-brand-blue rounded-3xl flex items-center justify-center shadow-lg"><Users size={32} /></div>
             <h2 className="text-5xl md:text-7xl font-black text-brand-dark leading-[0.9] tracking-tighter">
                {t.staffManagementTitle || "Built for Teams & Solopreneurs"}
             </h2>
             <p className="text-xl text-slate-500 font-medium leading-relaxed">
                {t.staffManagementDesc || "Manage multiple staff members with individual calendars, specialized roles, and automatic cross-calendar availability syncing."}
             </p>
             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                   <p className="text-sm font-black text-brand-dark">{t.unlimitedStaff || "Unlimited Staff"}</p>
                   <p className="text-xs text-slate-400 font-medium">Scale without per-seat costs during our beta phase.</p>
                </div>
                <div className="space-y-2">
                   <p className="text-sm font-black text-brand-dark">Smart Routing</p>
                   <p className="text-xs text-slate-400 font-medium">Auto-assign bookings to the next available specialist.</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Reminders & Conversational AI */}
      <section id="ai" className="py-32 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-blue/10 via-transparent to-transparent opacity-50" />
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center relative z-10">
           <div className="space-y-10">
              <div className="w-16 h-16 bg-white/10 text-brand-blue rounded-3xl flex items-center justify-center shadow-lg backdrop-blur-xl"><Zap size={32} /></div>
              <h2 className="text-5xl md:text-7xl font-black leading-[0.9] tracking-tighter">
                 {t.remindersTitle || "Zero No-Shows, Guaranteed."}
              </h2>
              <p className="text-xl text-white/50 font-medium leading-relaxed italic">
                 "Professional reminders reduce missed appointments by up to 80%."
              </p>
              <div className="space-y-8">
                 {[
                   { icon: MessageSquare, title: 'WhatsApp Reminders', desc: 'Direct engagement on the world\'s most popular platform.' },
                   { icon: Activity, title: 'Real-time Updates', desc: 'Clients get instantly notified of any schedule changes.' }
                 ].map((item, i) => (
                   <div key={i} className="flex gap-6">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/5"><item.icon size={24} className="text-brand-blue" /></div>
                      <div>
                        <h4 className="font-black text-lg mb-1">{item.title}</h4>
                        <p className="text-white/40 text-sm font-medium leading-relaxed">{item.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
           
           <div className="relative">
              <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-10 rounded-[48px] shadow-3xl">
                 <div className="space-y-8">
                   <div className="flex items-center justify-between border-b border-white/5 pb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 leading-none">Reminder Engine Active</p>
                      </div>
                      <Globe size={18} className="text-white/20" />
                   </div>
                   
                   <div className="space-y-6">
                      <div className="flex justify-end">
                         <div className="bg-brand-blue p-5 rounded-3xl rounded-tr-none max-w-[280px]">
                            <p className="text-sm font-bold leading-relaxed">Hi Sarah, reminder for your Strategy Audit at 10:00 AM tomorrow.</p>
                            <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mt-3">SMS DELIVERED • 9:02 AM</p>
                         </div>
                      </div>
                      <div className="flex justify-start">
                         <div className="bg-white/10 border border-white/10 p-5 rounded-3xl rounded-tl-none max-w-[280px]">
                            <p className="text-sm font-bold text-white/80 leading-relaxed italic">"Thanks! I'll be there. Can I invite my co-founder?"</p>
                         </div>
                      </div>
                      <div className="flex justify-end">
                         <div className="bg-brand-blue p-5 rounded-3xl rounded-tr-none max-w-[280px]">
                            <p className="text-sm font-bold leading-relaxed">Yes! You can manage participants here: <span className="underline opacity-50">easybk.ly/p/x942</span></p>
                         </div>
                      </div>
                   </div>
                 </div>
              </div>
              
              <div className="absolute -bottom-10 -left-10 bg-white p-6 rounded-[32px] shadow-3xl text-brand-dark flex items-center gap-4 z-20 border border-slate-100 hidden md:flex">
                 <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><Check size={24} strokeWidth={3} /></div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Session Verified</p>
                    <p className="text-sm font-black">All Reminders Delivered</p>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24 max-w-3xl mx-auto space-y-6">
            <h2 className="text-5xl md:text-8xl font-black text-brand-dark tracking-tight leading-[0.8]">{t.whyFounders}</h2>
            <p className="text-xl text-slate-500 font-medium">{t.autonomousEngine}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-auto">
             <div className="md:col-span-8 bg-white p-10 md:p-16 rounded-[60px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all relative overflow-hidden group">
                <div className="relative z-10 space-y-6 max-w-lg">
                   <div className="w-16 h-16 bg-brand-blue text-white rounded-3xl flex items-center justify-center shadow-xl mb-10"><Sparkles size={32} /></div>
                   <h3 className="text-4xl font-black text-brand-dark mb-4">{t.aiAssistantTitle}</h3>
                   <p className="text-xl text-slate-500 font-medium leading-relaxed">Your AI concierge clarifies value, answers complex questions, and books sessions automatically across 90+ languages.</p>
                </div>
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-brand-blue/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 group-hover:scale-150 transition-transform duration-1000" />
             </div>
             
             <div className="md:col-span-4 bg-emerald-500 p-10 rounded-[60px] text-white space-y-6 flex flex-col justify-between hover:scale-[1.02] transition-all cursor-pointer group shadow-xl shadow-emerald-500/20">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-all"><DollarSign size={32} /></div>
                <div>
                   <h3 className="text-3xl font-black leading-tight mb-2">{t.payoutGlobal || "Global Payouts"}</h3>
                   <p className="text-emerald-50 font-medium italic opacity-80">Connected to 135+ currencies.</p>
                </div>
             </div>

             <div className="md:col-span-4 bg-brand-dark p-10 rounded-[60px] text-white flex flex-col justify-between h-80 hover:shadow-2xl transition-all cursor-pointer group">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center group-hover:-rotate-6 transition-all"><ShieldCheck size={32} /></div>
                <h3 className="text-3xl font-black leading-tight">{t.whiteLabelTitle || "100% White-labelled"}</h3>
             </div>

             <div className="md:col-span-8 bg-slate-50 p-10 md:p-16 rounded-[60px] border border-slate-100 flex flex-col md:flex-row items-center gap-10 hover:shadow-xl transition-all">
                <div className="flex-1 space-y-4">
                   <h3 className="text-3xl font-black text-brand-dark">{t.portalPreviewTitle || "Professional Client Experience"}</h3>
                   <p className="text-slate-500 font-medium">Give your clients a passwordless portal to manage sessions, access meetings, and sync their own calendars.</p>
                </div>
                <div className="w-full md:w-64 h-48 bg-white rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                   <div className="absolute inset-x-0 top-0 h-6 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                   </div>
                   <div className="p-6 pt-10 space-y-4">
                      <div className="h-4 w-2/3 bg-slate-100 rounded-full" />
                      <div className="h-4 w-full bg-slate-50 rounded-full" />
                      <div className="h-10 w-full bg-brand-blue/10 rounded-xl" />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* The Real Pricing / Beta Offer */}
      <section id="pricing" className="py-40 px-6 bg-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-brand-blue/[0.03] rounded-full blur-[150px] translate-x-1/2 -translate-y-1/2" />
        
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 max-w-4xl mx-auto space-y-8">
              <div className="inline-flex items-center gap-3 px-6 py-2 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-500/20">
                 <Crown size={16} /> Open Beta Access
              </div>
              <h2 className="text-6xl md:text-[8rem] font-black text-brand-dark tracking-tight leading-[0.8]">100% Free. Forever.</h2>
              <p className="text-xl md:text-3xl text-slate-500 font-medium max-w-3xl mx-auto leading-relaxed">
                 Join our early adopter pilot and get the full Enterprise-grade experience for $0. No credit card, no subscription, no catch.
              </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto relative z-10">
             {/* Starter */}
             <div className="bg-white p-12 rounded-[60px] border border-slate-100 flex flex-col hover:shadow-3xl transition-all duration-700 opacity-60">
                <div className="shrink-0 mb-10">
                  <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mb-6"><Rocket size={24} /></div>
                  <h3 className="text-2xl font-black text-brand-dark uppercase tracking-wide">Essentials</h3>
                </div>
                <div className="flex items-baseline gap-2 mb-10">
                  <span className="text-6xl font-black text-brand-dark tracking-tighter">$0</span>
                  <span className="text-slate-400 font-bold text-xl">/mo</span>
                </div>
                <div className="flex-1 space-y-6 mb-12">
                   {['Unlimited Events', 'Manual Payouts', 'White-labeling', 'Standard CRM'].map(f => (
                     <div key={f} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                        <Check size={18} className="text-brand-blue" /> {f}
                     </div>
                   ))}
                </div>
                <button onClick={() => onStart()} className="w-full py-6 bg-slate-100 text-slate-400 rounded-3xl font-black uppercase tracking-widest text-sm cursor-not-allowed">
                  Use Pro Instead
                </button>
             </div>

             {/* Professional */}
             <div className="bg-brand-blue p-12 md:p-16 rounded-[60px] text-white flex flex-col shadow-3xl shadow-brand-blue/30 scale-105 relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-8">
                   <div className="px-5 py-2 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] animate-bounce">Limited Invite</div>
                </div>
                
                <div className="shrink-0 mb-10">
                  <div className="w-16 h-16 bg-white/20 text-white rounded-3xl flex items-center justify-center mb-8 shadow-inner"><Crown size={32} /></div>
                  <h3 className="text-4xl font-black text-white">Professional</h3>
                  <p className="text-white/40 font-black uppercase tracking-widest text-[10px] mt-2">The Complete OS</p>
                </div>
                
                <div className="flex items-baseline gap-2 mb-12">
                  <div className="relative">
                    <span className="text-8xl font-black text-white tracking-tighter">$0</span>
                    <div className="absolute -top-4 -right-12 rotate-12 bg-rose-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter">LIFETIME</div>
                  </div>
                  <span className="text-2xl font-bold text-white/40 line-through">$25</span>
                  <span className="text-white/60 font-bold text-xl">/mo</span>
                </div>
                
                <div className="flex-1 space-y-6 mb-16">
                   {[
                     'Full AI Concierge (Unlimited)', 
                     'Team & Staff Management', 
                     'WhatsApp/SMS Reminders', 
                     'Professional Client Portal',
                     'Build-in Video Meetings',
                     '100% White-labelled Page'
                   ].map(f => (
                     <div key={f} className="flex items-center gap-4 text-base font-black text-white">
                        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center shrink-0"><Check size={14} className="text-white" strokeWidth={4} /></div>
                        {f}
                     </div>
                   ))}
                </div>
                
                <button 
                  onClick={() => onStart()} 
                  className="w-full py-8 bg-white text-brand-blue rounded-3xl font-black uppercase tracking-widest text-lg shadow-2xl hover:bg-brand-dark hover:text-white transition-all transform hover:-translate-y-2 active:scale-95"
                >
                  {isLoggedIn ? 'Access Core' : 'Activate Lifetime Pro'}
                </button>
             </div>
          </div>
          
          <div className="mt-40 text-center space-y-6">
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Global Standards Compliance</p>
             <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-30 grayscale">
                {['GDPR COMPLIANT', 'SSL SECURED', 'PCI DSS READY', '256-BIT ENCRYPTION'].map(t => (
                  <span key={t} className="text-[9px] font-black tracking-widest text-slate-900 border border-slate-900/10 px-3 py-1 rounded">{t}</span>
                ))}
             </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="bg-brand-dark py-40 text-white relative overflow-hidden px-6">
        <div className="absolute inset-0">
           <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-brand-blue/10 rounded-full blur-[150px] translate-x-1/3 translate-y-1/3 rotate-45" />
        </div>
        
        <div className="max-w-4xl mx-auto text-center space-y-16 relative z-10">
            <div className="w-24 h-24 bg-brand-blue mx-auto rounded-[32px] flex items-center justify-center shadow-3xl shadow-brand-blue/40 rotate-12 mb-10"><Zap size={48} fill="currentColor" /></div>
            <h2 className="text-6xl md:text-9xl font-black leading-[0.8] tracking-tighter">{t.itIsHere}</h2>
            <p className="text-xl md:text-3xl text-white/60 font-medium max-w-2xl mx-auto leading-relaxed">
               Ready to upgrade your business infrastructure? Join the elite professionals moving to AI-native scheduling.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-8 pt-10">
               <button onClick={() => onStart()} className="w-full sm:w-auto px-20 py-10 bg-brand-blue text-white rounded-[40px] font-black text-3xl shadow-3xl shadow-brand-blue/50 hover:scale-105 active:scale-95 transition-all">{t.beginToday}</button>
            </div>
            
            <div className="pt-32 grid grid-cols-1 md:grid-cols-4 gap-16 text-left border-t border-white/5">
               <div className="col-span-2">
                  <Logo size="lg" className="mb-8" />
                  <p className="text-base text-white/30 font-medium max-w-xs leading-relaxed">Building the global infrastructure for autonomous scheduling and high-velocity commerce.</p>
               </div>
               <div>
                  <h5 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-white/20">Product</h5>
                  <div className="flex flex-col gap-6 text-sm font-bold text-white/50">
                     <a href="#features" className="hover:text-white transition-all uppercase tracking-widest text-[10px]">Features</a>
                     <a href="#staff" className="hover:text-white transition-all uppercase tracking-widest text-[10px]">Staff Management</a>
                     <a href="#ai" className="hover:text-white transition-all uppercase tracking-widest text-[10px]">AI Concierge</a>
                  </div>
               </div>
               <div>
                  <h5 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-white/20">Company</h5>
                  <div className="flex flex-col gap-6 text-sm font-bold text-white/50">
                     <a href="#" className="hover:text-white transition-all uppercase tracking-widest text-[10px]">Privacy</a>
                     <a href="#" className="hover:text-white transition-all uppercase tracking-widest text-[10px]">Terms</a>
                     <a href="#" className="hover:text-white transition-all uppercase tracking-widest text-[10px]">Support</a>
                  </div>
               </div>
            </div>
            
            <p className="pt-24 text-[10px] font-black text-white/5 uppercase tracking-[1em]">© 2024 EasyBookly Global. v1.2 Pro Edition.</p>
        </div>
      </section>

      {/* Magic Modal */}
      <AnimatePresence>
        {showMagic && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowMagic(false)}
               className="absolute inset-0 bg-brand-dark/90 backdrop-blur-2xl"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-5xl bg-slate-900 rounded-[40px] border border-white/10 shadow-3xl overflow-hidden aspect-video group"
             >
                {/* Close Button */}
                <button 
                  onClick={() => setShowMagic(false)}
                  className="absolute top-8 right-8 z-50 w-12 h-12 bg-white/10 hover:bg-white text-white hover:text-brand-dark rounded-full flex items-center justify-center transition-all backdrop-blur-md"
                >
                  <X size={24} />
                </button>

                {/* Simulated AI Interface - "The Magic" */}
                <div className="absolute inset-0 flex flex-col p-12 md:p-20 items-center justify-center text-center space-y-12">
                   <div className="relative">
                      <div className="absolute inset-0 bg-brand-blue blur-[100px] opacity-20 animate-pulse scale-150" />
                      <div className="w-24 h-24 bg-brand-blue rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-brand-blue/30 relative z-10">
                        <Sparkles size={48} />
                      </div>
                   </div>
                   
                   <div className="max-w-2xl space-y-6">
                      <h3 className="text-4xl md:text-5xl font-black text-white leading-tight">{t.magicObserve}</h3>
                      <p className="text-lg md:text-xl text-white/50 font-medium">{t.magicDesc}</p>
                   </div>

                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
                      {[
                        { label: 'AI Concierge', status: 'Processing...', icon: Sparkles },
                        { label: 'Bank Payout', status: 'Verified', icon: Zap },
                        { label: 'CRM Sync', status: 'Success', icon: Users },
                        { label: 'Calendar', status: 'Optimized', icon: Timer }
                      ].map((item, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 + (i * 0.1) }}
                          className="bg-white/5 border border-white/5 p-6 rounded-3xl text-left"
                        >
                           <item.icon size={20} className="text-brand-blue mb-4" />
                           <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{item.label}</p>
                           <p className="text-xs font-bold text-white mt-1">{item.status}</p>
                        </motion.div>
                      ))}
                   </div>

                   <div className="pt-8">
                     <button onClick={() => { setShowMagic(false); onStart(); }} className="px-10 py-5 bg-brand-blue text-white rounded-full font-black uppercase tracking-widest text-sm shadow-xl shadow-brand-blue/20 hover:scale-105 transition-all">Start Your Pro Era</button>
                   </div>
                </div>

                {/* Abstract scanning line */}
                <motion.div 
                  animate={{ y: ['0%', '1000%'] }} 
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="absolute top-0 left-0 right-0 h-1 bg-brand-blue/20 blur-sm pointer-events-none" 
                />
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default LandingPage;
