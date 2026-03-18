
import React, { useState } from 'react';
import { Appointment } from '../types';
import { Calendar as CalendarIcon, Filter, Search, MoreHorizontal, Clock, Globe, Smartphone, Trash2, ExternalLink, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { geminiAssistant } from '../services/geminiService';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onAddClick: () => void;
  onUpdateAppointment?: (apt: Appointment) => void;
  onDeleteAppointment?: (id: string) => void;
  connectedApps: string[];
  currency?: 'ILS' | 'USD' | 'EUR' | 'GBP';
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({ 
  appointments, 
  onAddClick, 
  onUpdateAppointment, 
  onDeleteAppointment,
  connectedApps,
  currency
}) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'pending' | 'past'>('upcoming');
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);

  const filterAppointments = () => {
    const now = new Date();
    return appointments.filter(apt => {
      const aptDate = new Date(`${apt.date}T${apt.time}`);
      if (activeTab === 'upcoming') return aptDate >= now;
      if (activeTab === 'past') return aptDate < now;
      return false;
    }).sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
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
          <button className="px-4 py-2 bg-slate-100 rounded-full text-sm font-bold text-slate-600 hover:bg-slate-200">
            Export
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-slate-100 mb-6">
        {['upcoming', 'pending', 'past'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-4 px-1 text-sm font-bold capitalize transition-all border-b-2 ${
              activeTab === tab ? 'border-brand-blue text-brand-dark' : 'border-transparent text-slate-400 hover:text-slate-600'
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
            <p className="text-slate-500 font-medium">No {activeTab} events scheduled.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(apt => (
              <div key={apt.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 transition-all group">
                <div className="flex items-start gap-6">
                   <div className="w-3 h-3 rounded-full mt-1.5" style={{ backgroundColor: '#006bff' }} />
                   <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                        {new Date(apt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <h4 className="text-lg font-bold text-brand-dark">{apt.time} - {apt.clientName}</h4>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-slate-500 flex items-center gap-1.5"><Clock size={14} /> {apt.duration} mins</span>
                        <span className="text-sm text-slate-500 flex items-center gap-1.5"><Globe size={14} /> {apt.service}</span>
                      </div>
                   </div>
                </div>
                
                <div className="flex items-center gap-4 mt-4 md:mt-0">
                   <button className="px-4 py-2 border border-slate-200 rounded-full text-xs font-bold text-brand-blue hover:bg-brand-blue/5 transition-all">
                     Details
                   </button>
                   <div className="relative group/menu">
                      <button className="p-2 text-slate-400 hover:text-slate-600"><MoreHorizontal size={20} /></button>
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-30">
                        <button onClick={() => onDeleteAppointment?.(apt.id)} className="w-full text-left px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                          <Trash2 size={16} /> Cancel Event
                        </button>
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bookly Help Tip */}
      <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-200">
         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-blue shadow-sm">
           <AlertCircle size={20} />
         </div>
         <div className="flex-1">
            <p className="text-sm font-bold text-brand-dark">Troubleshooting Availability?</p>
            <p className="text-xs text-slate-500">If you're not seeing times you expect, check your Working Hours and Calendar Sync settings.</p>
         </div>
         <button className="text-brand-blue text-xs font-bold hover:underline">Troubleshoot</button>
      </div>
    </div>
  );
};

export default AppointmentCalendar;
