
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, ShieldCheck, Sparkles, Globe, ArrowRight, Play, Check, 
  Crown, Rocket, Star, Heart, Activity, DollarSign, Timer, CreditCard, X, Users
} from 'lucide-react';
import Logo from './Logo';

interface LandingPageProps {
  onStart: (mode?: 'register' | 'login') => void;
  onLogin: () => void;
  isLoggedIn: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLogin, isLoggedIn }) => {
  const [showMagic, setShowMagic] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const monthlyStarter = 13;
  const annualStarter = 7.5; // $90 / 12
  const monthlyElite = 25;
  const annualElite = 15; // $180 / 12

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-brand-blue/10 selection:text-brand-blue overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo size="md" />
          <div className="hidden md:flex items-center gap-10">
            {['Product', 'Features', 'Pricing', 'AI Assistant'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-black text-slate-400 hover:text-brand-blue transition-all uppercase tracking-widest">{item}</a>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onLogin} className="hidden sm:block text-sm font-black text-slate-900 uppercase tracking-widest px-6 py-2 hover:bg-slate-50 rounded-full transition-all">
              {isLoggedIn ? 'Dashboard' : 'Login'}
            </button>
            <button onClick={() => onStart('register')} className="px-8 py-3 bg-brand-blue text-white rounded-full font-black text-sm uppercase tracking-widest shadow-xl shadow-brand-blue/20 hover:bg-brand-dark transition-all active:scale-95">
              {isLoggedIn ? 'Dashboard' : 'Get Started'}
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
              <Sparkles size={14} className="animate-pulse" /> The World's First AI-Native Scheduler
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-7xl md:text-[9.5rem] font-black text-brand-dark leading-[0.85] tracking-tighter"
            >
              BOOK <span className="text-brand-blue">FASTER.</span><br />
              GROW <span className="text-slate-200">WILDER.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl text-slate-500 font-medium max-w-2xl leading-relaxed"
            >
              Stop wrestling with dirty calendars. EasyBookly automates your meetings with an AI concierge, secure payouts, and a booking page that people actually love to use.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-6 pt-6"
            >
              <button 
                onClick={() => onStart()}
                className="w-full sm:w-auto px-12 py-6 bg-brand-blue text-white rounded-[32px] font-black text-xl shadow-2xl shadow-brand-blue/30 hover:bg-brand-dark transition-all transform hover:-translate-y-1 flex items-center justify-center gap-4"
              >
                {isLoggedIn ? 'Access Your Dashboard' : 'Access Your Dashboard'} <ArrowRight size={24} />
              </button>
              <button 
                onClick={() => setShowMagic(true)}
                className="flex items-center gap-4 text-brand-dark font-black uppercase tracking-widest text-sm hover:scale-105 transition-all p-4"
              >
                <div className="w-14 h-14 bg-brand-dark rounded-full flex items-center justify-center text-white"><Play size={20} fill="currentColor" /></div>
                Watch the Magic
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-10 pt-10"
            >
               <div className="flex -space-x-4">
                  {[1,2,3,4,5].map(i => (
                    <img key={i} src={`https://picsum.photos/seed/user${i}/100/100`} className="w-12 h-12 rounded-2xl border-4 border-white object-cover" referrerPolicy="no-referrer" />
                  ))}
               </div>
               <div>
                  <div className="flex gap-1 text-amber-400"><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /></div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Join 22,000+ Founders</p>
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Proof Section - Logo Wall */}
      <section className="py-20 bg-slate-50/50 border-y border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
           <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-12">Powering global teams</p>
           <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-30 grayscale hover:grayscale-0 transition-all duration-1000">
              {['Amazon', 'Revolut', 'Stripe', 'Figma', 'Spotify'].map(name => (
                <span key={name} className="text-2xl font-black tracking-tighter text-slate-900">{name}</span>
              ))}
           </div>
        </div>
      </section>

      {/* Disruptor Features */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24 max-w-3xl mx-auto space-y-6">
            <h2 className="text-5xl font-black text-brand-dark tracking-tight leading-[0.9]">Why founders are quitting <span className="text-slate-300 line-through">others</span> for us.</h2>
            <p className="text-xl text-slate-500 font-medium">We didn't just build a calendar. We built an autonomous booking engine.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { 
                title: 'AI Booking Concierge', 
                desc: 'Your private AI agent answers client questions and clarifies value before they even book.', 
                icon: Sparkles,
                color: 'bg-brand-blue'
              },
              { 
                title: 'Secured Payouts', 
                desc: 'The only global scheduler optimized for Israeli payouts and international merchant logic.', 
                icon: CreditCard,
                color: 'bg-emerald-500' 
              },
              { 
                title: 'Zero Ad Pollution', 
                desc: 'Total white-labeling. Your brand. Your domain. Your rules. Not even a "Powered by" footer.', 
                icon: ShieldCheck,
                color: 'bg-brand-dark' 
              }
            ].map((f, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all"
              >
                <div className={`w-16 h-16 ${f.color} text-white rounded-[24px] flex items-center justify-center mb-8 shadow-xl`}><f.icon size={32} /></div>
                <h3 className="text-2xl font-black text-brand-dark mb-4">{f.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The AI Showcase */}
      <section id="ai-assistant" className="py-32 bg-brand-dark text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-blue/20 rounded-full blur-[120px]" />
        
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
           <div className="space-y-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 text-brand-blue rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                 Gemini 1.5 Integration
              </div>
              <h2 className="text-5xl md:text-7xl font-black leading-[0.9] tracking-tighter">Your Assistant <br/> Never <span className="text-brand-blue">Sleeps.</span></h2>
              <div className="space-y-6">
                 {[
                   'Pre-qualify leads with smart questions',
                   'Automated meeting briefs sent to your inbox',
                   'Instant research on your booked clients',
                   'Multi-lingual support for 40+ languages'
                 ].map(text => (
                   <div key={text} className="flex items-center gap-4 text-white/70 font-bold">
                      <div className="w-6 h-6 bg-brand-blue/20 text-brand-blue rounded-full flex items-center justify-center shrink-0"><Check size={14} strokeWidth={4} /></div>
                      {text}
                   </div>
                 ))}
              </div>
              <button 
                onClick={() => onStart()}
                className="px-10 py-5 bg-white text-brand-dark rounded-[24px] font-black uppercase tracking-widest text-sm hover:bg-brand-blue hover:text-white transition-all shadow-2xl"
              >
                Start Free Trial
              </button>
           </div>
           
           <div className="relative">
              <div className="absolute inset-0 bg-brand-blue/30 blur-[100px] rounded-full scale-75" />
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[48px] shadow-2xl relative">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-brand-blue rounded-2xl flex items-center justify-center"><Sparkles size={24} /></div>
                    <div>
                      <h4 className="font-black text-sm">AI Response Generator</h4>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">Processing Inquiry...</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-white/10 p-5 rounded-2xl text-xs leading-relaxed text-white/60 italic border-l-4 border-brand-blue">
                      "I see you want to book a Strategic Consulting session. Jane specializes in Fintech pivots. Would you like to see her available slots for Friday?"
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ x: '-100%' }} animate={{ x: '0%' }} transition={{ duration: 2, repeat: Infinity }} className="h-full w-1/2 bg-brand-blue" />
                      </div>
                    </div>
                  </div>
              </div>
           </div>
        </div>
      </section>

      {/* Pricing / Value Deck */}
      <section id="pricing" className="py-32 px-6 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-3xl mx-auto space-y-6">
              <h2 className="text-5xl font-black text-brand-dark tracking-tight leading-[0.9]">Free for <span className="text-brand-blue underline decoration-slate-200">Early Adopters.</span></h2>
              <p className="text-xl text-slate-500 font-medium font-black italic">INVITE-ONLY BETA: ALL PLANS $0 FOR NOW</p>
              
              <div className="flex flex-col items-center gap-6 pt-8 opacity-50 pointer-events-none">
                <div className="flex items-center gap-5 p-1.5 bg-white rounded-[20px] border border-slate-200 w-fit shadow-sm">
                  <button 
                    onClick={() => setBillingCycle('monthly')} 
                    className={`px-8 py-3 rounded-[15px] text-sm font-black transition-all ${billingCycle === 'monthly' ? 'bg-brand-blue text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Monthly
                  </button>
                  <button 
                    onClick={() => setBillingCycle('annual')} 
                    className={`px-8 py-3 rounded-[15px] text-sm font-black transition-all flex items-center gap-2 ${billingCycle === 'annual' ? 'bg-brand-blue text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Annual <span className={`text-[10px] px-2 py-0.5 rounded-full ${billingCycle === 'annual' ? 'bg-white/20 text-white' : 'bg-emerald-500 text-white'}`}>Save 45%</span>
                  </button>
                </div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
             {/* Starter */}
             <div className="bg-white p-12 rounded-[50px] border border-slate-100 flex flex-col hover:shadow-2xl hover:scale-[1.02] transition-all duration-500">
                <div className="shrink-0 mb-10">
                  <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mb-6"><Rocket size={24} /></div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Starting Out</p>
                  <h3 className="text-3xl font-black text-brand-dark">Essentials</h3>
                </div>
                <div className="flex items-baseline gap-2 mb-10">
                  <span className="text-6xl font-black text-brand-dark tracking-tighter">
                    $0
                  </span>
                  <span className="text-xl font-bold text-slate-400 line-through decoration-brand-blue">
                    ${billingCycle === 'annual' ? annualStarter : monthlyStarter}
                  </span>
                  <span className="text-slate-400 font-bold text-xl">/mo</span>
                </div>
                <div className="flex-1 space-y-6 mb-12">
                   {['Unlimited Events', 'Manual Payouts', 'White-labeling', 'Standard CRM'].map(f => (
                     <div key={f} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                        <Check size={18} className="text-brand-blue" /> {f}
                     </div>
                   ))}
                </div>
                <button onClick={() => onStart()} className="w-full py-6 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-widest text-sm hover:bg-brand-blue transition-all shadow-xl">
                  {isLoggedIn ? 'Dashboard' : 'Activate Free Account'}
                </button>
             </div>

             {/* Pro */}
             <div className="bg-brand-blue p-12 rounded-[50px] text-white flex flex-col scale-105 shadow-[0_40px_80px_-15px_rgba(0,107,255,0.3)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8">
                   <div className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest">Best Value</div>
                </div>
                <div className="shrink-0 mb-10">
                  <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center mb-6"><Crown size={24} /></div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">Global Growth</p>
                  <h3 className="text-3xl font-black text-white">Professional</h3>
                </div>
                <div className="flex items-baseline gap-2 mb-10">
                  <span className="text-6xl font-black text-white tracking-tighter text-shadow-xl">
                    $0
                  </span>
                  <span className="text-xl font-bold text-white/40 line-through decoration-white/20">
                    ${billingCycle === 'annual' ? annualElite : monthlyElite}
                  </span>
                  <span className="text-white/60 font-bold text-xl">/mo</span>
                </div>
                <div className="flex-1 space-y-6 mb-12">
                   {['Full AI Concierge', 'Automated Payouts', 'Strategic AI Audit', 'Priority API Access', 'Team Management'].map(f => (
                     <div key={f} className="flex items-center gap-3 text-sm font-black text-white">
                        <Check size={18} className="text-white" /> {f}
                     </div>
                   ))}
                </div>
                <button onClick={() => onStart()} className="w-full py-6 bg-white text-brand-blue rounded-[24px] font-black uppercase tracking-widest text-sm hover:bg-brand-dark hover:text-white transition-all shadow-2xl">
                  {isLoggedIn ? 'Dashboard' : 'Activate Free Pro'}
                </button>
             </div>
          </div>
        </div>
      </section>

      {/* FOMO Countdown / Footer */}
      <section className="bg-brand-dark py-32 text-white relative overflow-hidden px-6">
        <div className="max-w-4xl mx-auto text-center space-y-12 relative z-10">
            <div className="w-20 h-20 bg-brand-blue mx-auto rounded-3xl flex items-center justify-center shadow-2xl shadow-brand-blue/20 rotate-12 mb-10"><Zap size={40} fill="currentColor" /></div>
            <h2 className="text-5xl md:text-8xl font-black leading-[0.8] tracking-tighter">THE FUTURE OF BOOKING IS <span className="text-brand-blue">HERE.</span></h2>
            <p className="text-xl text-white/60 font-medium max-w-xl mx-auto">
               Dont let another meeting slip through the cracks. Join the disruption and start booking sessions with global precision today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 pt-10">
               <button onClick={() => onStart()} className="w-full sm:w-auto px-16 py-8 bg-brand-blue text-white rounded-[32px] font-black text-2xl shadow-2xl shadow-brand-blue/40 hover:scale-105 transition-all">Begin Today</button>
            </div>
            
            <div className="pt-24 grid grid-cols-1 md:grid-cols-4 gap-10 text-left border-t border-white/5">
               <div className="col-span-2">
                  <Logo size="lg" className="mb-6" />
                  <p className="text-sm text-white/40 font-medium max-w-xs">Building the global infrastructure for autonomous scheduling and high-velocity commerce.</p>
               </div>
               <div>
                  <h5 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-white/40">Product</h5>
                  <div className="flex flex-col gap-4 text-sm font-bold text-white/60">
                     <a href="#" className="hover:text-white transition-all">Features</a>
                     <a href="#" className="hover:text-white transition-all">Integrations</a>
                     <a href="#" className="hover:text-white transition-all">Pricing</a>
                  </div>
               </div>
               <div>
                  <h5 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-white/40">Company</h5>
                  <div className="flex flex-col gap-4 text-sm font-bold text-white/60">
                     <a href="#" className="hover:text-white transition-all">About</a>
                     <a href="#" className="hover:text-white transition-all">Careers</a>
                     <a href="#" className="hover:text-white transition-all">Privacy</a>
                  </div>
               </div>
            </div>
            
            <p className="pt-20 text-[10px] font-black text-white/10 uppercase tracking-[0.5em]">© 2024 EasyBookly Global. All rights reserved.</p>
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
                      <h3 className="text-4xl md:text-5xl font-black text-white leading-tight">Observe the <span className="text-brand-blue">Automation Engine.</span></h3>
                      <p className="text-lg md:text-xl text-white/50 font-medium">EasyBookly isn't just a UI—it's a symphony of AI agents, payment hooks, and CRM logic working in perfect unison to make you money while you sleep.</p>
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
