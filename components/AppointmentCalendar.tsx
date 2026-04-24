
import React, { useState } from 'react';
import { Appointment } from '../types';
import { Calendar as CalendarIcon, Filter, Search, MoreHorizontal, Clock, Globe, Smartphone, Trash2, ExternalLink, ChevronDown, CheckCircle2, AlertCircle, Video } from 'lucide-react';
import { geminiAssistant } from '../services/geminiService';

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
  onJoinMeeting
}) => {
  const [localActiveTab, setLocalActiveTab] = useState<'upcoming' | 'pending' | 'past'>('upcoming');
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);

  const filterAppointments = () => {
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
      time: apt.time
    }));

    // Convert External events to unified format
    const syncEvents = externalEvents.map(e => ({
      id: e.id,
      title: e.title,
      start: e.start,
      service: 'External Focus',
      duration: Math.round((new Date(e.end).getTime() - new Date(e.start).getTime()) / 60000),
      status: 'confirmed',
      isExternal: true,
      provider: e.provider,
      color: e.color,
      date: e.start.split('T')[0],
      time: e.start.split('T')[1].substring(0, 5)
    }));

    const allEvents = [...easyBooklyEvents, ...syncEvents];

    return allEvents.filter(evt => {
      const evtDate = new Date(evt.start);
      if (localActiveTab === 'upcoming') return evtDate >= now;
      if (localActiveTab === 'past') return evtDate < now;
      return false;
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  };

  const filtered = filterAppointments();

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-brand-dark">Scheduled Events</h2>
          <p className="text-sm text-slate-500">View and manage your meetings.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => alert('Exporting calendar data...')}
            className="px-4 py-2 bg-slate-100 rounded-full text-sm font-bold text-slate-600 hover:bg-slate-200"
          >
            Export
          </button>
        </div>
      </header>

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
                      </div>
                      <h4 className="text-lg font-bold text-brand-dark">{evt.time} - {evt.title}</h4>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-slate-500 flex items-center gap-1.5"><Clock size={14} /> {evt.duration} mins</span>
                        <span className="text-sm text-slate-500 flex items-center gap-1.5"><Globe size={14} /> {evt.service}</span>
                        {(evt as any).meetingLink && (
                          <button 
                            onClick={() => {
                              const room = (evt as any).meetingLink?.split('/').pop();
                              if (room && onJoinMeeting) onJoinMeeting(room);
                              else window.open((evt as any).meetingLink, '_blank');
                            }}
                            className="flex items-center gap-1.5 px-3 py-1 bg-brand-blue/10 text-brand-blue rounded-lg text-xs font-bold border border-brand-blue/10 hover:bg-brand-blue hover:text-white transition-all ml-2"
                          >
                            <Video size={12} /> Join Video
                          </button>
                        )}
                      </div>
                   </div>
                </div>
                
                <div className="flex items-center gap-4 mt-4 md:mt-0">
                   <button 
                     onClick={() => alert(`Details for ${evt.title}: ${evt.service} at ${evt.time}`)}
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
    </div>
  );
};

export default AppointmentCalendar;
