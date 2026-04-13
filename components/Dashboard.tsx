
import React, { useEffect, useState, useMemo } from 'react';
import { Appointment, Client, Service } from '../types';
import { Plus, Link as LinkIcon, Copy, Check, Settings, MoreHorizontal, Globe, Calendar, Clock, Sparkles, LayoutGrid, Search, ExternalLink, Activity, Info, Eye } from 'lucide-react';
import { geminiAssistant } from '../services/geminiService';
import { translations, Language } from '../services/translations';
import { SERVICES } from '../constants';

interface DashboardProps {
  businessName: string;
  appointments: Appointment[];
  clients: Client[];
  connectedApps: string[];
  legalData: any;
  currency: 'ILS' | 'USD' | 'EUR' | 'GBP';
  onOpenPublicView: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ businessName, appointments, clients, connectedApps, legalData, currency, onOpenPublicView }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState("Analyzing your session velocity...");
  const lang = (localStorage.getItem('easybookly_lang') as Language) || 'en';
  const t = translations[lang];

  useEffect(() => {
    const fetchAi = async () => {
      const res = await geminiAssistant.getSummary(appointments);
      setAiInsight(res);
    };
    if (appointments.length > 0) fetchAi();
  }, [appointments]);

  const handleCopyLink = (name: string) => {
    const url = `${window.location.origin}/book/${name.toLowerCase().replace(/\s+/g, '-')}`;
    navigator.clipboard.writeText(url);
    setCopiedId(name);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-32 max-w-7xl mx-auto">
      {/* EasyBookly-style Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark tracking-tight">Event Types</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Create and share links to book appointments on your calendar.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onOpenPublicView} className="px-6 py-2.5 text-brand-blue border border-brand-blue rounded-full font-bold text-sm hover:bg-brand-blue/5 transition-all flex items-center gap-2">
            <Eye size={16} /> View Client Portal
          </button>
          <button className="px-8 py-2.5 bg-brand-blue text-white rounded-full font-bold text-sm hover:shadow-lg shadow-brand-blue/20 transition-all flex items-center gap-2">
            <Plus size={18} /> New Event Type
          </button>
        </div>
      </header>

      {/* Profile Bar */}
      <div className="flex items-center gap-4 py-3 px-5 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="w-10 h-10 bg-brand-blue text-white rounded-full flex items-center justify-center font-bold">
          {businessName.charAt(0)}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-brand-dark">{businessName}</p>
          <p className="text-xs text-slate-400 font-medium">easybookly.com/{businessName.toLowerCase().replace(/\s+/g, '-')}</p>
        </div>
        <button onClick={onOpenPublicView} className="text-brand-blue text-xs font-bold hover:underline">Preview your booking site</button>
      </div>

      {/* AI Intelligence Layer */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-start gap-5 shadow-sm">
         <div className="w-12 h-12 bg-brand-blue/10 text-brand-blue rounded-xl flex items-center justify-center shrink-0">
           <Sparkles size={24} />
         </div>
         <div className="flex-1">
            <h4 className="text-sm font-bold text-brand-dark flex items-center gap-2 uppercase tracking-wider">
               Gemini Intelligence <span className="bg-emerald-100 text-emerald-600 text-[8px] px-1.5 py-0.5 rounded">Active</span>
            </h4>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed italic">"{aiInsight}"</p>
         </div>
      </div>

      {/* Event Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SERVICES.map((service) => (
          <div key={service.name} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col relative">
            <div className="h-1.5 w-full" style={{ backgroundColor: service.color || '#006bff' }} />
            
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-6">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue" defaultChecked />
                <div className="flex items-center gap-2">
                   <button className="text-slate-400 hover:text-brand-blue p-1.5 rounded-lg hover:bg-slate-50 transition-all"><Settings size={18} /></button>
                   <button className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition-all"><MoreHorizontal size={18} /></button>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-brand-dark mb-1">{service.name}</h3>
              <p className="text-sm text-slate-500 font-medium mb-8">{service.duration} mins, One-on-One</p>
              
              <button onClick={onOpenPublicView} className="text-brand-blue text-sm font-bold hover:underline flex items-center gap-1.5">
                <Eye size={14} /> View booking page
              </button>
            </div>

            <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
              <button 
                onClick={() => handleCopyLink(service.name)}
                className="flex items-center gap-2 text-brand-blue text-xs font-bold hover:text-brand-dark transition-all"
              >
                {copiedId === service.name ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                {copiedId === service.name ? 'Link Copied' : 'Copy link'}
              </button>
              <button className="px-5 py-1.5 border border-brand-blue text-brand-blue rounded-full text-xs font-bold hover:bg-brand-blue hover:text-white transition-all">
                Share
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
