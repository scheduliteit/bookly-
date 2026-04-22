
import React, { useEffect, useState, useMemo } from 'react';
import { Appointment, Client, Service, User } from '../types';
import { Plus, Link as LinkIcon, Copy, Check, Settings, MoreHorizontal, Globe, Calendar, Clock, Sparkles, LayoutGrid, Search, ExternalLink, Activity, Info, Eye, Users, TrendingUp, ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { geminiAssistant } from '../services/geminiService';
import { translations, Language } from '../services/translations';
import ViralHypePanel from './ViralHypePanel';

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
}

const Dashboard: React.FC<DashboardProps> = ({ user, services, businessName, appointments, clients, connectedApps, legalData, currency, onOpenPublicView, onAddEventType, setActiveTab }) => {
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
    <div className="space-y-10 animate-in fade-in duration-700 pb-32 max-w-7xl mx-auto">
      {/* Personalized Greeting */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-black text-brand-dark tracking-tight">
            {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}, {businessName}!
          </h1>
          <p className="text-slate-500 font-medium mt-2">Here's what's happening with your business today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onOpenPublicView} className="px-6 py-2.5 text-brand-blue border-2 border-brand-blue/10 rounded-full font-bold text-sm hover:bg-brand-blue/5 transition-all flex items-center gap-2">
            <Eye size={16} /> Preview Site
          </button>
          <button onClick={onAddEventType} className="px-8 py-2.5 bg-brand-blue text-white rounded-full font-bold text-sm hover:shadow-2xl shadow-brand-blue/20 transition-all flex items-center gap-2">
            <Plus size={18} /> New Event
          </button>
        </div>
      </motion.div>

      {/* VIRAL HYPE PANEL - The Free Revolution */}
      <ViralHypePanel onExplore={() => setActiveTab?.('ai-assistant')} />

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${s.bg} ${s.color} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                <s.icon size={24} />
              </div>
              <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Live</div>
            </div>
            <p className="text-2xl font-black text-brand-dark">{s.value}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Primary Share Link Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-2 border-brand-blue/10 rounded-[32px] p-8 md:p-10 flex flex-col md:flex-row items-center gap-10 shadow-xl shadow-brand-blue/5 border-dashed"
      >
        <div className="w-full md:w-auto flex flex-col items-center md:items-start text-center md:text-left">
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
             Live Booking Page
           </div>
           <h3 className="text-2xl font-black text-brand-dark tracking-tight mb-2">Your Personal Booking Link</h3>
           <p className="text-slate-500 font-medium max-w-sm">Share this link with your clients so they can view your availability and book sessions instantly.</p>
        </div>
        
        <div className="flex-1 w-full bg-slate-50 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 border border-slate-100">
           <div className="flex-1 w-full relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                 <Globe size={18} />
              </div>
              <input 
                readOnly
                value={`${window.location.origin}/book/${user.id}`}
                className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-slate-600 outline-none"
              />
           </div>
           <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={() => handleCopyLink('primary')}
                className="flex-1 md:flex-none px-6 py-3 bg-brand-blue text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-brand-dark transition-all active:scale-95"
              >
                {copiedId === 'primary' ? <Check size={18} /> : <Copy size={18} />}
                {copiedId === 'primary' ? 'COPIED' : 'COPY LINK'}
              </button>
              <button 
                onClick={onOpenPublicView}
                className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-brand-blue hover:border-brand-blue transition-all"
                title="View Page"
              >
                <ExternalLink size={18} />
              </button>
           </div>
        </div>
      </motion.div>

      {/* AI Growth Advisor - Strategic Intelligence Tier */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-brand-dark p-10 rounded-[48px] flex flex-col md:flex-row items-center gap-10 shadow-[0_32px_64px_-16px_rgba(0,107,255,0.25)] relative overflow-hidden group"
      >
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-blue/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
         
         <div className="w-24 h-24 bg-brand-blue/20 text-brand-blue rounded-[32px] flex items-center justify-center shrink-0 border border-brand-blue/30 backdrop-blur-sm relative">
           <div className="absolute inset-0 bg-brand-blue animate-ping opacity-10 rounded-[32px]" />
           <TrendingUp size={48} />
         </div>
         
         <div className="flex-1 text-center md:text-left space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <h4 className="text-[10px] font-black text-brand-blue uppercase tracking-[0.4em]">
                 Strategic Intelligence Tier 
              </h4>
              <span className="w-fit mx-auto md:mx-0 bg-emerald-500/10 text-emerald-400 text-[8px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-emerald-500/20">
                PROACTIVE AUDIT: ACTIVE
              </span>
            </div>
            
            <p className={`text-2xl md:text-3xl text-white font-black leading-[1.1] tracking-tight ${isAdviceLoading ? 'animate-pulse opacity-50' : ''}`}>
              {isAdviceLoading ? 'Synchronizing with global market data...' : aiInsight}
            </p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
               <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                  <CheckCircle size={14} className="text-emerald-500" /> Pattern recognition enabled
               </div>
               <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                  <CheckCircle size={14} className="text-emerald-500" /> Revenue optimization active
               </div>
            </div>
         </div>
         
         <div className="flex flex-col gap-3 shrink-0">
           <button 
            onClick={() => setActiveTab?.('ai-assistant')} 
            className="px-10 py-5 bg-brand-blue text-white rounded-full font-black text-sm hover:bg-white hover:text-brand-dark transition-all shadow-xl shadow-brand-blue/20 flex items-center gap-2 group/btn"
           >
             EXECUTE STRATEGY <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
           </button>
           <button 
            className="px-10 py-5 bg-white/5 text-slate-400 rounded-full font-black text-xs hover:bg-white/10 hover:text-white transition-all border border-white/5"
           >
             IGNORE INSIGHT
           </button>
         </div>
      </motion.div>

      {/* Event Types Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-brand-dark tracking-tight">Your Event Types</h3>
            <button onClick={onAddEventType} className="text-brand-blue text-sm font-bold hover:underline">Manage All</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayServices.length > 0 ? (
              displayServices.map((service) => (
                <motion.div 
                  key={service.name} 
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="bg-white border-2 border-slate-50 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:border-brand-blue/20 transition-all group flex flex-col relative"
                >
                  <div className="h-2 w-full" style={{ backgroundColor: service.color || '#006bff' }} />
                  
                  <div className="p-8 flex-1">
                    <div className="flex justify-between items-start mb-8">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-brand-blue/10 group-hover:text-brand-blue transition-all">
                        <LayoutGrid size={20} />
                      </div>
                      <div className="flex items-center gap-2">
                         <button onClick={onAddEventType} className="text-slate-300 hover:text-brand-blue p-2 rounded-xl hover:bg-slate-50 transition-all"><Settings size={20} /></button>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-black text-brand-dark mb-1">{service.name}</h3>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{service.duration} MINS • ONE-ON-ONE</p>
                    
                    <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
                      <button 
                        onClick={() => handleCopyLink(service.name)}
                        className="flex items-center gap-2 text-brand-blue text-xs font-black hover:text-brand-dark transition-all"
                      >
                        {copiedId === service.name ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        {copiedId === service.name ? 'LINK COPIED' : 'COPY LINK'}
                      </button>
                      <button onClick={onOpenPublicView} className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-brand-blue/10 hover:text-brand-blue transition-all">
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-24 bg-slate-50 border-4 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-center gap-6">
                 <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-slate-200 shadow-xl">
                   <Plus size={40} />
                 </div>
                 <div className="max-w-xs">
                   <h3 className="text-xl font-black text-brand-dark">Ready to start?</h3>
                   <p className="text-sm text-slate-400 font-medium mt-2">Create your first event type and start sharing your booking link with the world.</p>
                 </div>
                 <button onClick={onAddEventType} className="px-10 py-4 bg-brand-blue text-white rounded-full font-black text-sm shadow-2xl shadow-brand-blue/20 hover:bg-brand-dark transition-all">
                   Create Event Type
                 </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Activity Feed */}
        <div className="space-y-6">
          <h3 className="text-xl font-black text-brand-dark tracking-tight">Recent Activity</h3>
          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 space-y-6">
              {appointments.length > 0 ? (
                appointments.slice(0, 5).map((apt, i) => (
                  <div key={apt.id} className="flex gap-4 group">
                    <div className="relative">
                      <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-brand-blue/10 group-hover:text-brand-blue transition-all">
                        <Calendar size={18} />
                      </div>
                      {i !== appointments.slice(0, 5).length - 1 && (
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-slate-50" />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <p className="text-sm font-black text-brand-dark">{apt.clientName}</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">Booked {apt.service}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{apt.time}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase ${apt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center space-y-3">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                    <Activity size={24} />
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No activity yet</p>
                </div>
              )}
            </div>
            <button onClick={() => setActiveTab?.('calendar')} className="w-full py-4 bg-slate-50 text-slate-400 text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all border-t border-slate-100">
              View Full Calendar
            </button>
          </div>

          {/* Quick Actions */}
          <div className="bg-brand-dark p-6 rounded-3xl text-white space-y-4">
            <h4 className="text-xs font-black text-white/40 uppercase tracking-widest">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={onAddEventType} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl flex flex-col items-center gap-2 transition-all border border-white/5">
                <LayoutGrid size={20} className="text-brand-blue" />
                <span className="text-[10px] font-black uppercase tracking-widest">New Event</span>
              </button>
              <button onClick={() => setActiveTab?.('ai-assistant')} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl flex flex-col items-center gap-2 transition-all border border-white/5">
                <Sparkles size={20} className="text-amber-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">AI Audit</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
