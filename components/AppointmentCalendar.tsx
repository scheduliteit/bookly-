
import React, { useState } from 'react';
import { Appointment } from '../types';
import { Calendar as CalendarIcon, Filter, Search, MoreHorizontal, Clock, Globe, Smartphone, Trash2, ExternalLink, ChevronDown, CheckCircle2, AlertCircle, Video, Copy, X, Lock, RefreshCw, LayoutGrid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { geminiAssistant } from '../services/geminiService';
import { translations, Language } from '../services/translations';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  externalEvents?: any[];
  onAddClick: () => void;
  onUpdateAppointment?: (apt: Appointment) => void;
  onDeleteAppointment?: (id: string) => void;
  onNavigate?: (tab: string) => void;
  connectedApps: string[];
  currency?: 'ILS' | 'USD' | 'EUR' | 'GBP';
  onJoinMeeting?: (room: string) => void;
  onSyncNow?: () => Promise<void>;
  language?: Language;
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({ 
  appointments, 
  externalEvents = [],
  onAddClick, 
  onUpdateAppointment, 
  onDeleteAppointment,
  onNavigate,
  connectedApps,
  currency,
  onJoinMeeting,
  onSyncNow,
  language = 'en'
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [localActiveTab, setLocalActiveTab] = useState<'upcoming' | 'pending' | 'past'>('upcoming');

  const t = translations[language] || translations.en;

  const handleSync = async () => {
    if (!onSyncNow) return;
    setIsSyncing(true);
    await onSyncNow();
    setIsSyncing(false);
  };

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day; // Adjust to Sunday or Monday? Hebrew/Arabic might prefer different
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays(currentWeek);

  const filterAppointments = (mode?: 'list' | 'grid') => {
    const now = new Date();
    
    // Convert EasyBookly appointments to a unified format
    const easyBooklyEvents = appointments.map(apt => ({
      id: apt.id,
      title: apt.clientName,
      start: new Date(`${apt.date}T${apt.time}`).toISOString(),
      service: apt.service,
      duration: apt.duration,
      status: apt.status,
      isExternal: false,
      date: apt.date,
      time: apt.time,
      googleEventId: apt.googleEventId,
      outlookEventId: apt.outlookEventId,
      meetingLink: apt.meetingLink,
      meetingPassword: apt.meetingPassword,
      notes: (apt as any).note,
    }));

    // Convert External events to unified format
    const syncEvents = externalEvents.map(e => {
      const startDate = new Date(e.start);
      const endDate = new Date(e.end);
      
      const duration = !isNaN(endDate.getTime()) && !isNaN(startDate.getTime())
        ? Math.round((endDate.getTime() - startDate.getTime()) / 60000)
        : 30;

      const isoParts = e.start.includes('T') ? e.start.split('T') : [e.start, '00:00:00'];
      const datePart = isoParts[0];
      const timePart = isoParts[1].substring(0, 5);

      return {
        id: e.id,
        title: e.title,
        start: e.start,
        service: 'External Focus',
        duration,
        status: 'confirmed',
        isExternal: true,
        provider: e.provider,
        color: e.color,
        date: datePart,
        time: timePart
      };
    });

    const allEvents = [...easyBooklyEvents, ...syncEvents];

    if (mode === 'grid' || viewMode === 'grid') {
      return allEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    }

    return allEvents.filter(evt => {
      const evtDate = new Date(evt.start);
      if (localActiveTab === 'upcoming') return evtDate >= now;
      if (localActiveTab === 'past') return evtDate < now;
      if (localActiveTab === 'pending') return evt.status === 'pending';
      return false;
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  };

  const filtered = filterAppointments();

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20" dir={t.dir}>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className={t.dir === 'rtl' ? 'text-right' : 'text-left'}>
          <h2 className="text-2xl font-bold text-brand-dark">Scheduled Events</h2>
          <p className="text-sm text-slate-500">View and manage your meetings.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl mr-2">
            <button 
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'grid' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutGrid size={14} /> Grid
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <CalendarIcon size={14} /> List
            </button>
          </div>
          {connectedApps.length > 0 && onSyncNow && (
            <button 
              onClick={handleSync}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-4 py-2 border-2 border-slate-100 rounded-full text-sm font-bold text-slate-600 hover:border-brand-blue hover:text-brand-blue transition-all disabled:opacity-50 ${isSyncing ? 'bg-slate-50' : 'bg-white'}`}
            >
              <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? t.syncing : t.syncNow}
            </button>
          )}
          <button 
            onClick={() => alert('Exporting calendar data...')}
            className="px-4 py-2 bg-slate-100 rounded-full text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all"
          >
            Export
          </button>
        </div>
      </header>

      {viewMode === 'grid' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  const d = new Date(currentWeek);
                  d.setDate(d.getDate() - 7);
                  setCurrentWeek(d);
                }}
                className="p-2 hover:bg-slate-50 rounded-full transition-all"
              >
                <ChevronDown size={20} className="rotate-90" />
              </button>
              <h3 className="font-bold text-brand-dark min-w-[200px] text-center">
                {weekDays[0].toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', { month: 'short', day: 'numeric' })} - {weekDays[6].toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </h3>
              <button 
                onClick={() => {
                  const d = new Date(currentWeek);
                  d.setDate(d.getDate() + 7);
                  setCurrentWeek(d);
                }}
                className="p-2 hover:bg-slate-50 rounded-full transition-all"
              >
                <ChevronDown size={20} className="-rotate-90" />
              </button>
            </div>
            <button 
              onClick={() => setCurrentWeek(new Date())}
              className="text-xs font-bold text-brand-blue hover:underline"
            >
              Today
            </button>
          </div>

          <div className="grid grid-cols-7 gap-4">
            {weekDays.map((day, idx) => {
              const dayStr = day.toISOString().split('T')[0];
              const dayEvents = filterAppointments().filter(e => e.date === dayStr);
              const isToday = new Date().toISOString().split('T')[0] === dayStr;

              return (
                <div key={idx} className="space-y-3">
                  <div className={`text-center p-3 rounded-2xl border ${isToday ? 'bg-brand-blue/5 border-brand-blue/20' : 'bg-white border-slate-100'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-brand-blue' : 'text-slate-400'}`}>
                      {day.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', { weekday: 'short' })}
                    </p>
                    <p className={`text-xl font-black ${isToday ? 'text-brand-blue' : 'text-brand-dark'}`}>
                      {day.getDate()}
                    </p>
                  </div>

                  <div className="space-y-2 min-h-[400px] bg-slate-50/50 rounded-2xl p-2 border border-dashed border-slate-200">
                    {dayEvents.map(evt => (
                      <motion.div 
                        key={evt.id}
                        layoutId={evt.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => setSelectedApt(evt as any)}
                        className={`p-3 rounded-xl border shadow-sm cursor-pointer hover:scale-[1.02] transition-all group relative overflow-hidden ${evt.isExternal ? 'bg-white border-slate-200' : 'bg-brand-blue/10 border-brand-blue/20'}`}
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: evt.isExternal ? (evt as any).color : '#006bff' }} />
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{evt.time}</p>
                        <p className="text-[11px] font-bold text-brand-dark truncate leading-tight mt-0.5">{evt.title}</p>
                        {evt.isExternal && (
                          <div className="flex items-center gap-1 mt-1 opacity-60">
                             <ExternalLink size={8} className="text-slate-400" />
                             <span className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-400">{(evt as any).provider}</span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                    {dayEvents.length === 0 && (
                      <div className="h-full flex items-center justify-center opacity-20 py-10">
                        <CalendarIcon size={24} className="text-slate-300" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex items-center gap-8 border-b border-slate-100 mb-6">
        {['upcoming', 'pending', 'past'].map((tab) => (
          <button
            key={tab}
            onClick={() => setLocalActiveTab(tab as any)}
            className={`pb-4 px-1 text-sm font-bold capitalize transition-all border-b-2 ${
              localActiveTab === tab ? 'border-brand-blue text-brand-dark' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <CalendarIcon size={32} />
            </div>
            <p className="text-slate-500 font-medium">No {localActiveTab} events scheduled.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(evt => (
              <div key={evt.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 transition-all group">
                <div className="flex items-start gap-6">
                   <div className="w-3 h-3 rounded-full mt-1.5" style={{ backgroundColor: evt.isExternal ? (evt as any).color : '#006bff' }} />
                   <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                          {new Date(evt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        {evt.isExternal && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                            <ExternalLink size={8} /> {(evt as any).provider} Sync
                          </span>
                        )}
                        {!(evt as any).isExternal && (evt as any).googleEventId && (
                           <span className="px-2 py-0.5 bg-brand-blue/5 text-brand-blue rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                             <CheckCircle2 size={8} /> Google Cloud Synced
                           </span>
                        )}
                      </div>
                      <h4 className="text-lg font-bold text-brand-dark">{evt.time} - {evt.title}</h4>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-slate-500 flex items-center gap-1.5"><Clock size={14} /> {evt.duration} mins</span>
                        <span className="text-sm text-slate-500 flex items-center gap-1.5"><Globe size={14} /> {evt.service}</span>
                        {(evt as any).meetingLink && (
                          <div className="flex items-center gap-2 ml-auto">
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText((evt as any).meetingLink);
                                alert('Meeting link copied to clipboard!');
                              }}
                              className="p-2 text-slate-400 hover:text-brand-blue transition-colors"
                              title="Copy Meeting Link"
                            >
                              <Copy size={16} />
                            </button>
                            <button 
                              onClick={() => {
                                const room = (evt as any).meetingLink?.split('/').pop();
                                if (room && onJoinMeeting) onJoinMeeting(room);
                                else window.open((evt as any).meetingLink, '_blank');
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-blue/20 hover:scale-105 active:scale-95 transition-all"
                            >
                              <Video size={14} /> Join Meeting
                            </button>
                          </div>
                        )}
                      </div>
                   </div>
                </div>
                
                <div className="flex items-center gap-4 mt-4 md:mt-0">
                   <button 
                     onClick={() => setSelectedApt(evt as any)}
                     className="px-4 py-2 border border-slate-200 rounded-full text-xs font-bold text-brand-blue hover:bg-brand-blue/5 transition-all"
                   >
                     Details
                   </button>
                   {!evt.isExternal && (
                    <div className="relative group/menu">
                        <button className="p-2 text-slate-400 hover:text-slate-600"><MoreHorizontal size={20} /></button>
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-30">
                          <button onClick={() => onDeleteAppointment?.(evt.id)} className="w-full text-left px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                            <Trash2 size={16} /> Cancel Event
                          </button>
                        </div>
                    </div>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </>
      )}

      {/* EasyBookly Help Tip */}
      <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-200">
         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-blue shadow-sm">
           <AlertCircle size={20} />
         </div>
         <div className="flex-1">
            <p className="text-sm font-bold text-brand-dark">Troubleshooting Availability?</p>
            <p className="text-xs text-slate-500">If you're not seeing times you expect, check your Working Hours and Calendar Sync settings.</p>
         </div>
          <button 
            onClick={() => onNavigate?.('ai-assistant')}
            className="text-brand-blue text-xs font-bold hover:underline"
          >
            Troubleshoot
          </button>
      </div>

      {/* Appointment Details Modal */}
      {selectedApt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setSelectedApt(null)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className={`h-2 w-full ${selectedApt.isExternal ? 'bg-slate-200' : 'bg-brand-blue'}`} />
            <div className="p-8 md:p-12 space-y-8">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-3xl font-black text-brand-dark leading-tight">{(selectedApt as any).title}</h3>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{(selectedApt as any).service}</p>
                </div>
                <button onClick={() => setSelectedApt(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</p>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <CalendarIcon size={16} className="text-slate-300" />
                    {new Date((selectedApt as any).date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} at {(selectedApt as any).time}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</p>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Clock size={16} className="text-slate-300" />
                    {(selectedApt as any).duration} {t.minutes}
                  </div>
                </div>
              </div>

              {(selectedApt as any).notes && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Notes</p>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 font-medium leading-relaxed">
                    {(selectedApt as any).notes}
                  </div>
                </div>
              )}

              {(selectedApt as any).meetingLink && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest">{t.meetingDetails}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-brand-blue/5 border border-brand-blue/10 rounded-xl px-4 py-3 flex items-center gap-3 overflow-hidden">
                        <Video size={18} className="text-brand-blue/40" />
                        <span className="text-xs font-bold text-brand-blue truncate">{(selectedApt as any).meetingLink}</span>
                      </div>
                      <button 
                        onClick={() => {
                          if ((selectedApt as any).meetingLink) {
                            navigator.clipboard.writeText((selectedApt as any).meetingLink);
                            alert('Meeting link copied!');
                          }
                        }}
                        className="p-3.5 bg-brand-blue text-white rounded-xl shadow-lg shadow-brand-blue/20 hover:scale-105 active:scale-95 transition-all"
                      >
                        <Copy size={18} />
                      </button>
                    </div>
                  </div>
                  {(selectedApt as any).meetingPassword && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                      <Lock size={16} className="text-slate-400" />
                      <p className="text-xs font-bold text-slate-500">
                        {t.meetingPassword}: <span className="text-brand-dark ml-1">{(selectedApt as any).meetingPassword}</span>
                      </p>
                    </div>
                  )}
                  <button 
                    onClick={() => {
                      const link = (selectedApt as any).meetingLink;
                      const room = link?.split('/').pop();
                      if (room && onJoinMeeting && (link.includes('jitsi') || link.includes('whereby'))) onJoinMeeting(room);
                      else window.open(link, '_blank');
                    }}
                    className="w-full py-4 bg-brand-blue text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-brand-blue/20 hover:bg-brand-dark transition-all flex items-center justify-center gap-3"
                  >
                    <Video size={18} /> Join Meeting Now
                  </button>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                 {!selectedApt.isExternal && (
                   <button 
                    onClick={() => {
                      onUpdateAppointment?.({...selectedApt, status: 'cancelled'});
                      setSelectedApt(null);
                    }}
                    className="flex-1 py-4 border border-rose-100 text-rose-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-rose-50 transition-all"
                   >
                     Cancel Event
                   </button>
                 )}
                 <button 
                  onClick={() => setSelectedApt(null)}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
                 >
                   Close
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
