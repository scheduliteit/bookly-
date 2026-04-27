import React, { useState } from 'react';
import { Appointment } from '../types';
import { Calendar as CalendarIcon, Filter, Search, MoreHorizontal, Clock, Globe, Smartphone, Trash2, Video, Copy, X, LayoutGrid, List, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { Language, translations } from '../services/translations';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  externalEvents?: any[];
  language: Language;
  onAddClick: () => void;
  onUpdateAppointment?: (apt: Appointment) => void;
  onDeleteAppointment?: (id: string) => void;
  onNavigate?: (tab: string) => void;
  onJoinMeeting?: (room: string) => void;
  onSyncNow?: () => void;
  connectedApps?: string[];
  currency?: string;
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  appointments,
  externalEvents = [],
  language,
  onAddClick,
  onUpdateAppointment,
  onDeleteAppointment,
  onNavigate,
  onJoinMeeting,
  onSyncNow,
  connectedApps = [],
  currency = 'USD'
}) => {
  const t = translations[language] || translations.en;
  const [localActiveTab, setLocalActiveTab] = useState<'upcoming' | 'pending' | 'past'>('upcoming');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);

  const combined = [
    ...appointments,
    ...externalEvents.map(e => ({
      ...e,
      id: e.id,
      title: e.title || 'Busy (Private Event)',
      date: e.date,
      time: e.time,
      duration: e.duration || 30,
      service: 'Calendar Sync',
      status: 'confirmed',
      isExternal: true,
      provider: e.provider || 'Google'
    }))
  ];

  const filtered = combined.filter(apt => {
    const aptDate = new Date(apt.date);
    const now = new Date();
    now.setHours(0,0,0,0);
    
    if (localActiveTab === 'past') return aptDate < now;
    if (localActiveTab === 'pending') return apt.status === 'pending';
    return aptDate >= now && apt.status !== 'pending';
  }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {t.yourSchedule || 'Schedule'}
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            {filtered.length} {localActiveTab} {filtered.length === 1 ? 'event' : 'events'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-1 flex gap-1 mr-2">
            <button 
              onClick={() => setView('list')}
              className={`p-2 rounded-xl transition-all ${view === 'list' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List size={18} />
            </button>
            <button 
              onClick={() => setView('grid')}
              className={`p-2 rounded-xl transition-all ${view === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
          <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 transition-all">
            <Search size={20} />
          </button>
          <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 transition-all">
            <Filter size={20} />
          </button>
          <button 
            onClick={onAddClick}
            className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-200"
          >
            <CalendarIcon size={16} /> {t.bookNew || 'New Event'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-10 border-b border-slate-100 pt-2">
        {[
          { id: 'upcoming', label: t.upcoming || 'Upcoming' },
          { id: 'pending', label: t.pending || 'Pending' },
          { id: 'past', label: t.past || 'Past' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setLocalActiveTab(tab.id as any)}
            className={`group relative pb-4 px-1 text-xs font-black uppercase tracking-[0.2em] transition-all ${
              localActiveTab === tab.id ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
            <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-t-full transition-all duration-300 ${localActiveTab === tab.id ? 'bg-brand-blue scale-x-100' : 'bg-transparent scale-x-0 group-hover:bg-slate-200 group-hover:scale-x-50'}`} />
          </button>
        ))}
      </div>

      {/* List Container */}
      <div className={`${view === 'list' ? 'bg-white/80 backdrop-blur-sm border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/40' : ''}`}>
        {filtered.length === 0 ? (
          <div className="p-24 text-center space-y-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl shadow-slate-200/40">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto text-slate-200 border border-slate-100 rotate-6 group hover:rotate-0 transition-transform">
              <CalendarIcon size={32} />
            </div>
            <div>
              <p className="text-slate-900 font-black text-xl">No {localActiveTab} events</p>
              <p className="text-slate-400 text-sm mt-1">Your schedule is clear for now.</p>
            </div>
            <button onClick={onAddClick} className="px-8 py-3 bg-brand-blue text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-brand-blue/20">Schedule First</button>
          </div>
        ) : view === 'list' ? (
          <div className="divide-y divide-slate-100">
            {filtered.map((evt, idx) => (
              <motion.div 
                key={evt.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-8 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50/50 transition-all group"
              >
                <div className="flex items-start gap-6">
                  <div className="flex flex-col items-center min-w-[64px] text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
                      {new Date(evt.date).toLocaleDateString(language, { weekday: 'short' }).toUpperCase()}
                    </p>
                    <p className="text-3xl font-black text-slate-900 leading-none">
                      {new Date(evt.date).getDate()}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mt-1">
                      {new Date(evt.date).toLocaleDateString(language, { month: 'short' }).toUpperCase()}
                    </p>
                  </div>
                  
                  <div className="w-px h-12 bg-slate-100 mt-2 hidden sm:block" />

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 bg-slate-900 text-slate-50 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {evt.time}
                      </span>
                      {evt.isExternal && (
                        <span className="px-3 py-1 bg-brand-blue/10 text-brand-blue rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-brand-blue/10">
                          <Globe size={10} /> {(evt as any).provider || 'Google'} Synced
                        </span>
                      )}
                      {evt.status === 'pending' && (
                        <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100">
                          {t.pending}
                        </span>
                      )}
                    </div>
                    
                    <h4 className="text-xl font-black text-slate-900 group-hover:text-brand-blue transition-colors">
                      {evt.title}
                    </h4>
                    
                    <div className="flex flex-wrap items-center gap-5 mt-3">
                      <span className="text-[11px] font-black text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                        <Clock size={14} className="text-slate-300 shrink-0" /> {evt.duration} {t.minutes}
                      </span>
                      <span className="text-[11px] font-black text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                        <Smartphone size={14} className="text-slate-300 shrink-0" /> {evt.service}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 mt-8 md:mt-0">
                  {evt.meetingLink && (
                    <button 
                      onClick={() => {
                        const room = evt.meetingLink?.split('/').pop();
                        if (room && onJoinMeeting) onJoinMeeting(room);
                        else window.open(evt.meetingLink, '_blank');
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-blue/20"
                    >
                      <Video size={14} /> Join Session
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedApt(evt)}
                    className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] text-slate-900 hover:border-slate-900 transition-all"
                  >
                    Details
                  </button>
                  {!evt.isExternal && (
                    <div className="relative group/menu">
                      <button className="p-3.5 text-slate-400 hover:text-slate-900 rounded-2xl hover:bg-slate-100 transition-all">
                        <MoreHorizontal size={20} strokeWidth={3} />
                      </button>
                      <div className="absolute right-0 top-full mt-3 w-56 bg-white border border-slate-200 rounded-[2rem] shadow-2xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible translate-y-4 group-hover/menu:translate-y-0 transition-all z-30 overflow-hidden shadow-slate-300/50">
                        <button onClick={() => onDeleteAppointment?.(evt.id)} className="w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 flex items-center gap-3 transition-colors">
                          <Trash2 size={16} /> Cancel Session
                        </button>
                        <button className="w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-50 flex items-center gap-3 transition-colors border-t border-slate-50">
                           <RefreshCw size={16} className="text-slate-300" /> Reschedule
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((evt, idx) => (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-brand-blue/5 transition-all group flex flex-col justify-between"
              >
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col items-center min-w-[64px] text-center bg-slate-50 p-4 rounded-3xl border border-slate-100">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
                        {new Date(evt.date).toLocaleDateString(language, { weekday: 'short' }).toUpperCase()}
                      </p>
                      <p className="text-2xl font-black text-slate-900 leading-none">
                        {new Date(evt.date).getDate()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                       {evt.meetingLink && (
                         <div className="w-10 h-10 bg-brand-blue/10 text-brand-blue rounded-2xl flex items-center justify-center">
                            <Video size={18} />
                         </div>
                       )}
                       {evt.isExternal && (
                         <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center">
                            <Globe size={18} />
                         </div>
                       )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                       <span className="px-3 py-1 bg-slate-900 text-slate-50 rounded-full text-[10px] font-black uppercase tracking-widest">{evt.time}</span>
                       {evt.status === 'pending' && <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100">{t.pending}</span>}
                    </div>
                    <h4 className="text-xl font-black text-slate-900 group-hover:text-brand-blue transition-colors line-clamp-1">{evt.title}</h4>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{evt.service}</p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                  <button 
                    onClick={() => setSelectedApt(evt)}
                    className="text-[10px] font-black text-brand-blue uppercase tracking-widest hover:translate-x-1 transition-transform"
                  >
                    View Details →
                  </button>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-slate-300" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{evt.duration}M</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Appointment Detail Modal */}
      {selectedApt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-xl bg-white rounded-[3rem] shadow-2xl relative overflow-hidden ring-1 ring-slate-100"
           >
              <button 
                onClick={() => setSelectedApt(null)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
              >
                <X size={20} />
              </button>

              <div className="p-10 space-y-8">
                 <div className="space-y-2">
                    <span className="px-3 py-1 bg-brand-blue/10 text-brand-blue rounded-full text-[10px] font-black uppercase tracking-widest leading-none">
                      Appointment Details
                    </span>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                      {selectedApt.title}
                    </h3>
                 </div>

                 <div className="grid grid-cols-2 gap-6 p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</p>
                       <p className="font-bold text-slate-900 text-lg">{(selectedApt as any).clientName || 'N/A'}</p>
                    </div>
                    <div className="space-y-1 text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</p>
                       <p className="font-bold text-slate-900 text-lg">{selectedApt.time}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service</p>
                       <p className="font-bold text-slate-900">{selectedApt.service}</p>
                    </div>
                    <div className="space-y-1 text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</p>
                       <p className="font-bold text-slate-900">{selectedApt.duration} minutes</p>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Session Note</p>
                    <div className="p-6 bg-white border border-slate-100 rounded-3xl text-sm text-slate-600 leading-relaxed italic">
                       "{(selectedApt as any).note || 'No notes provided for this session.'}"
                    </div>
                 </div>

                 <div className="flex gap-4">
                    <button 
                      onClick={() => setSelectedApt(null)}
                      className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-800/10"
                    >
                      Close Window
                    </button>
                 </div>
              </div>
           </motion.div>
        </div>
      )}
    </div>
  );
};

export default AppointmentCalendar;
