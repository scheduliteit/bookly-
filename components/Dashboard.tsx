
import React, { useEffect, useState, useMemo } from 'react';
import { Appointment, Client, Service, User } from '../types';
import { Plus, Link as LinkIcon, Copy, Check, Settings, MoreHorizontal, Globe, Calendar, Clock, Sparkles, LayoutGrid, Search, ExternalLink, Activity, Info, Eye, Users } from 'lucide-react';
import { geminiAssistant } from '../services/geminiService';
import { translations, Language } from '../services/translations';

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
}

const Dashboard: React.FC<DashboardProps> = ({ user, services, businessName, appointments, clients, connectedApps, legalData, currency, onOpenPublicView, onAddEventType }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState("Analyzing your session velocity...");
  const lang = (localStorage.getItem('easybookly_lang') as Language) || 'en';
  const t = translations[lang];
  const symbol = { ILS: '₪', USD: '$', EUR: '€', GBP: '£' }[currency];

  useEffect(() => {
    const fetchAi = async () => {
      const res = await geminiAssistant.getSummary(appointments);
      setAiInsight(res);
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
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
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${s.bg} ${s.color} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                <s.icon size={24} />
              </div>
              <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Live</div>
            </div>
            <p className="text-2xl font-black text-brand-dark">{s.value}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* AI Intelligence Layer */}
      <div className="bg-brand-blue p-8 rounded-3xl flex flex-col md:flex-row items-center gap-8 shadow-2xl shadow-brand-blue/20 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
         <div className="w-20 h-20 bg-white/10 text-white rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-md border border-white/10">
           <Sparkles size={40} />
         </div>
         <div className="flex-1 text-center md:text-left">
            <h4 className="text-xs font-black text-white/60 flex items-center justify-center md:justify-start gap-2 uppercase tracking-[0.2em] mb-2">
               Gemini Strategic Insight <span className="bg-emerald-400 text-brand-dark text-[8px] px-2 py-0.5 rounded-full font-black">AI ACTIVE</span>
            </h4>
            <p className="text-xl text-white font-medium leading-relaxed italic">"{aiInsight}"</p>
         </div>
         <button onClick={() => window.location.hash = '#ai-assistant'} className="px-6 py-3 bg-white text-brand-blue rounded-full font-black text-sm hover:bg-brand-dark hover:text-white transition-all shrink-0">
           Full Analysis
         </button>
      </div>

      {/* Event Types Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-brand-dark tracking-tight">Your Event Types</h3>
          <button onClick={onAddEventType} className="text-brand-blue text-sm font-bold hover:underline">Manage All</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayServices.length > 0 ? (
            displayServices.map((service) => (
              <div key={service.name} className="bg-white border-2 border-slate-50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-brand-blue/20 transition-all group flex flex-col relative">
                <div className="h-2 w-full" style={{ backgroundColor: service.color || '#006bff' }} />
                
                <div className="p-8 flex-1">
                  <div className="flex justify-between items-start mb-8">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
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
              </div>
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
    </div>
  );
};

export default Dashboard;
