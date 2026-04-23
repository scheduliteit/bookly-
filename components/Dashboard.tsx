
import React, { useEffect, useState, useMemo } from 'react';
import { Appointment, Client, Service, User } from '../types';
import { Plus, Link as LinkIcon, Copy, Check, Settings, MoreHorizontal, Globe, Calendar, Clock, Sparkles, LayoutGrid, Search, ExternalLink, Activity, Info, Eye, Users, TrendingUp, ArrowRight, CheckCircle, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';
import { geminiAssistant } from '../services/geminiService';
import { translations, Language } from '../services/translations';
import ViralHypePanel from './ViralHypePanel';
import MobileInstallGuide from './MobileInstallGuide';
import { AnimatePresence } from 'motion/react';

interface DashboardProps {
  user: User;
  services: Service[];
  businessName: string;
  appointments: Appointment[];
  clients: Client[];
  connectedApps: string[];
  legalData: any;
  currency: 'ILS' | 'USD' | 'EUR' | 'GBP';
  onOpenPublicView: () => void;
  onAddEventType?: () => void;
  setActiveTab?: (tab: string) => void;
  onOpenMobileGuide?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, services, businessName, appointments, clients, connectedApps, legalData, currency, onOpenPublicView, onAddEventType, setActiveTab, onOpenMobileGuide }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState("Analyzing your business performance...");
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  const lang = (localStorage.getItem('easybookly_lang') as Language) || 'en';
  const t = translations[lang];
  const symbol = { ILS: '₪', USD: '$', EUR: '€', GBP: '£' }[currency];

  useEffect(() => {
    const fetchAi = async () => {
      setIsAdviceLoading(true);
      const res = await geminiAssistant.getStrategicGrowthAdvice(appointments);
      setAiInsight(res);
      setIsAdviceLoading(false);
    };
    if (appointments.length > 0) fetchAi();
  }, [appointments]);

  const handleCopyLink = (name: string) => {
    // Use the user's ID for the booking link
    const url = `${window.location.origin}/book/${user.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(name);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const displayServices = services.length > 0 ? services : [];

  const stats = useMemo(() => {
    const confirmed = appointments.filter(a => a.status === 'confirmed').length;
    const pending = appointments.filter(a => a.status === 'pending').length;
    const revenue = appointments
      .filter(a => a.status === 'confirmed' || a.status === 'completed')
      .reduce((sum, a) => sum + (a.price || 0), 0);
    
    return [
      { label: 'Confirmed Bookings', value: confirmed, icon: Calendar, color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
      { label: 'Pending Requests', value: pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
      { label: 'Total Revenue', value: `${symbol}${revenue}`, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'Total Clients', value: clients.length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    ];
  }, [appointments, clients, symbol]);

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 pb-32 max-w-7xl mx-auto">
      {/* High-Fidelity Strategic Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-slate-100 pb-12"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-brand-blue/5 text-brand-blue rounded-full w-fit border border-brand-blue/10">
             <div className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <h1 className="text-5xl font-black text-brand-dark tracking-tight leading-[0.9]">
            {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}, <span className="text-brand-blue">{businessName}</span>.
          </h1>
          <p className="text-slate-500 font-medium text-lg">System status: <span className="text-emerald-500 font-bold">Operational</span> • 0 incidents in last 24h</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={onOpenPublicView} 
            className="flex-1 md:flex-none px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-brand-blue hover:text-brand-blue transition-all flex items-center justify-center gap-3 shadow-sm"
          >
            <Globe size={18} /> Public Portal
          </button>
          <button 
            onClick={onAddEventType} 
            className="flex-1 md:flex-none px-10 py-4 bg-brand-blue text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-dark hover:shadow-[0_20px_40px_-10px_rgba(0,107,255,0.3)] transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <Plus size={18} strokeWidth={3} /> New Instance
          </button>
        </div>
      </motion.div>

      {/* VIRAL HYPE PANEL - The Free Revolution */}
      <ViralHypePanel onExplore={() => setActiveTab?.('ai-assistant')} />

      {/* Advanced Performance Clusters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 + 0.3 }}
            className="relative group cursor-pointer"
          >
             <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 rounded-[32px] border border-slate-100 shadow-sm" />
             <div className="absolute inset-0 bg-brand-blue/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px]" />
             
             <div className="relative p-8 flex flex-col h-full items-start">
                <div className={`w-14 h-14 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center mb-10 shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                  <s.icon size={28} />
                </div>
                <div className="space-y-1">
                  <p className="text-4xl font-black text-brand-dark tracking-tighter">{s.value}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{s.label}</p>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-100 w-full flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all">
                   <span className="text-[10px] font-black text-brand-blue uppercase">View Detailed Audit</span>
                   <ArrowRight size={14} className="text-brand-blue" />
                </div>
             </div>
          </motion.div>
        ))}
      </div>

      {/* Strategic Intelligence Interface */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-brand-dark rounded-[48px] p-12 md:p-20 relative overflow-hidden group shadow-[0_48px_80px_-20px_rgba(0,107,255,0.25)]"
      >
         {/* Background Effects */}
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-blue/15 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
         <div className="absolute bottom-0 left-0 w-32 h-32 border-l border-b border-brand-blue/20 rounded-bl-3xl m-8" />
         <div className="absolute top-0 right-0 w-32 h-32 border-r border-t border-brand-blue/20 rounded-tr-3xl m-8" />
         
         <div className="relative flex flex-col lg:flex-row items-center gap-16">
            <div className="aspect-square w-48 h-48 bg-brand-blue/10 rounded-[48px] border border-brand-blue/20 flex items-center justify-center relative backdrop-blur-xl">
               <div className="absolute inset-0 bg-brand-blue rounded-[48px] blur-3xl opacity-20 animate-pulse" />
               <Sparkles size={80} className="text-brand-blue" />
            </div>
            
            <div className="flex-1 text-center lg:text-left space-y-8">
               <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="px-4 py-1.5 bg-brand-blue text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em]">
                    Strategic Insight
                  </div>
                  <div className="flex items-center gap-3">
                     <Activity size={16} className="text-emerald-500" />
                     <span className="text-emerald-400 text-xs font-bold">Heuristic analysis complete</span>
                  </div>
               </div>
               
               <h2 className={`text-3xl md:text-5xl text-white font-black leading-[1.05] tracking-tight ${isAdviceLoading ? 'animate-pulse opacity-40' : ''}`}>
                 {isAdviceLoading ? 'Synchronizing neural weights with ecosystem activity...' : aiInsight}
               </h2>
               
               <div className="flex flex-wrap justify-center lg:justify-start gap-8 pt-4">
                  <div className="space-y-1">
                    <p className="text-brand-blue text-lg font-black uppercase tracking-widest leading-none">99.2%</p>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Confidence Score</p>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div className="space-y-1">
                    <p className="text-emerald-500 text-lg font-black uppercase tracking-widest leading-none">+12.4%</p>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Projected Growth</p>
                  </div>
               </div>
            </div>
            
            <div className="flex flex-col gap-4 w-full lg:w-auto shrink-0">
               <button 
                onClick={() => setActiveTab?.('ai-assistant')}
                className="w-full lg:w-72 py-6 bg-brand-blue text-white rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-white hover:text-brand-dark transition-all shadow-2xl shadow-brand-blue/40 flex items-center justify-center gap-3 group/btn"
               >
                 Execute Logic <ArrowRight size={20} className="group-hover/btn:translate-x-2 transition-transform" />
               </button>
               <button className="w-full lg:w-72 py-6 bg-white/5 text-slate-500 rounded-[24px] font-black text-sm uppercase tracking-widest border border-white/5 hover:bg-white/10 hover:text-white transition-all">
                 Dismiss Node
               </button>
            </div>
         </div>
      </motion.div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Event Types Pillar */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between mb-2">
            <div className="space-y-1">
               <h3 className="text-2xl font-black text-brand-dark tracking-tight">Active Deployment Units</h3>
               <p className="text-sm text-slate-400 font-medium tracking-tight">Operational endpoints for client scheduling.</p>
            </div>
            <button 
              onClick={onAddEventType}
              className="text-brand-blue text-xs font-black uppercase tracking-widest hover:bg-brand-blue/5 px-4 py-2 rounded-full transition-all"
            >
              Configure Master
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {displayServices.length > 0 ? (
              displayServices.map((service, idx) => (
                <motion.div 
                  key={service.name} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + (idx * 0.1) }}
                  className="bg-white rounded-[32px] border border-slate-100 overflow-hidden hover:shadow-2xl hover:border-brand-blue/20 transition-all group flex flex-col"
                >
                  <div className="h-2 w-full" style={{ backgroundColor: service.color || '#006bff' }} />
                  <div className="p-10 space-y-8">
                    <div className="flex justify-between items-start">
                       <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-blue/10 group-hover:text-brand-blue transition-all">
                         <LayoutGrid size={24} />
                       </div>
                       <div className="flex items-center gap-2">
                          <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-100">Active</div>
                       </div>
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-black text-brand-dark group-hover:text-brand-blue transition-colors mb-1">{service.name}</h3>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{service.duration} MIN RESOURCE • $0 FEE</p>
                    </div>
                    
                    <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                       <button 
                        onClick={() => handleCopyLink(service.name)}
                        className="flex items-center gap-3 text-brand-blue text-xs font-black uppercase tracking-widest hover:text-brand-dark transition-all"
                       >
                         {copiedId === service.name ? <CheckCircle size={18} /> : <Copy size={18} />}
                         {copiedId === service.name ? 'Link Pulled' : 'Copy Endpoint'}
                       </button>
                       <button onClick={onOpenPublicView} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl hover:bg-brand-blue/10 hover:text-brand-blue transition-all flex items-center justify-center">
                         <ExternalLink size={18} />
                       </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-32 bg-slate-50/50 border-4 border-dashed border-slate-100 rounded-[48px] flex flex-col items-center justify-center text-center gap-8">
                 <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center text-slate-200 shadow-2xl shadow-slate-200/50">
                   <Plus size={48} strokeWidth={3} />
                 </div>
                 <div className="space-y-4">
                   <h3 className="text-3xl font-black text-brand-dark leading-none">Initialize System</h3>
                   <p className="text-slate-400 font-medium max-w-xs mx-auto">Deploy your first scheduling instance to activate the booking ecosystem.</p>
                 </div>
                 <button onClick={onAddEventType} className="px-12 py-5 bg-brand-blue text-white rounded-full font-black text-sm uppercase tracking-widest shadow-2xl shadow-brand-blue/20 hover:bg-brand-dark transition-all">
                   Deploy Unit Alpha
                 </button>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Activity Stream Pillar */}
        <div className="space-y-8">
          <div className="space-y-1">
             <h3 className="text-2xl font-black text-brand-dark tracking-tight">Active Stream</h3>
             <p className="text-sm text-slate-400 font-medium tracking-tight">Real-time engagement telemetry.</p>
          </div>
          
          <div className="bg-white border border-slate-100 rounded-[40px] overflow-hidden shadow-sm flex flex-col h-fit">
            <div className="p-10 space-y-10">
              {appointments.length > 0 ? (
                appointments.slice(0, 6).map((apt, i) => (
                  <div key={apt.id} className="relative flex gap-6 group">
                    <div className="relative z-10">
                       <div className="w-12 h-12 bg-white border-2 border-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:border-brand-blue group-hover:text-brand-blue transition-all shadow-sm">
                         <Calendar size={20} />
                       </div>
                       {i !== Math.min(appointments.length, 6) - 1 && (
                         <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[2px] h-10 bg-slate-50" />
                       )}
                    </div>
                    <div className="flex-1 pb-10">
                       <h4 className="text-base font-black text-brand-dark leading-tight">{apt.clientName}</h4>
                       <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 italic">{apt.service}</p>
                       <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center gap-1.5 text-slate-300">
                             <Clock size={12} />
                             <span className="text-[10px] font-black uppercase tracking-widest">{apt.time}</span>
                          </div>
                          <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${apt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {apt.status}
                          </span>
                       </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center space-y-6">
                  <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center mx-auto text-slate-200">
                    <Activity size={32} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Silent Flux</p>
                    <p className="text-sm text-slate-300 italic font-medium">Monitoring for client engagement...</p>
                  </div>
                </div>
              )}
            </div>
            <button 
              onClick={() => setActiveTab?.('calendar')} 
              className="w-full py-6 bg-slate-50 text-slate-400 text-xs font-black uppercase tracking-[0.3em] hover:bg-slate-100 transition-all border-t border-slate-100"
            >
              Access Archive
            </button>
          </div>

          {/* Quick-Access Deployment Grid */}
          <div className="bg-brand-dark p-10 rounded-[40px] text-white space-y-10 relative overflow-hidden shadow-2xl shadow-slate-900/40">
            <div className="absolute top-0 left-0 w-full h-full bg-brand-blue/5 pointer-events-none" />
            <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] relative z-10">Instant Commands</h4>
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <button onClick={onAddEventType} className="p-6 bg-white/5 hover:bg-white/10 rounded-[24px] flex flex-col items-center gap-3 transition-all border border-white/5 group">
                <LayoutGrid size={24} className="text-brand-blue group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white">New Service</span>
              </button>
              <button onClick={() => setActiveTab?.('ai-assistant')} className="p-6 bg-white/5 hover:bg-white/10 rounded-[24px] flex flex-col items-center gap-3 transition-all border border-white/5 group">
                <Sparkles size={24} className="text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white">AI Sync</span>
              </button>
              <button onClick={onOpenPublicView} className="p-6 bg-white/5 hover:bg-white/10 rounded-[24px] flex flex-col items-center gap-3 transition-all border border-white/5 group">
                <Globe size={24} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white">Portal</span>
              </button>
              <button onClick={() => setActiveTab?.('earnings')} className="p-6 bg-white/5 hover:bg-white/10 rounded-[24px] flex flex-col items-center gap-3 transition-all border border-white/5 group">
                <Activity size={24} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white">Earnings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
