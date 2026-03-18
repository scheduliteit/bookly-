
import React, { useState } from 'react';
import { X, Calendar, Clock, User, Briefcase, DollarSign, ChevronDown } from 'lucide-react';
import { Appointment } from '../types';

interface AddAppointmentModalProps {
  onClose: () => void;
  onAdd: (appointment: Appointment) => void;
  clients: any[];
  services: any[];
}

const AddAppointmentModal: React.FC<AddAppointmentModalProps> = ({ 
  onClose, 
  onAdd, 
  clients, 
  services
}) => {
  const [formData, setFormData] = useState({
    clientName: '',
    service: services[0]?.name || '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    price: services[0]?.price || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const service = services.find(s => s.name === formData.service);
    const newApt: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      clientId: 'manual',
      clientName: formData.clientName,
      service: formData.service,
      date: formData.date,
      time: formData.time,
      duration: service?.duration || 60,
      status: 'confirmed',
      price: formData.price
    };
    onAdd(newApt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-10">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-bold text-brand-dark">Schedule Event</h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-brand-dark transition-all rounded-full hover:bg-slate-100"><X size={24} /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Invitee Name *</label>
              <input 
                required 
                list="clients" 
                value={formData.clientName} 
                onChange={(e) => setFormData({...formData, clientName: e.target.value})} 
                className="w-full border border-slate-200 rounded-lg p-3 text-sm font-medium focus:ring-1 focus:ring-brand-blue outline-none transition-all" 
                placeholder="Name of the person booking..." 
              />
              <datalist id="clients">{clients.map(c => <option key={c.id} value={c.name} />)}</datalist>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Event Type</label>
                <div className="relative">
                   <select 
                    value={formData.service} 
                    onChange={(e) => {
                      const s = services.find(x => x.name === e.target.value);
                      setFormData({...formData, service: e.target.value, price: s?.price || 0});
                    }} 
                    className="w-full border border-slate-200 rounded-lg p-3 pr-10 text-sm font-medium outline-none appearance-none focus:ring-1 focus:ring-brand-blue"
                   >
                    {services.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Fee ($)</label>
                <input 
                  type="number" 
                  value={formData.price} 
                  onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} 
                  className="w-full border border-slate-200 rounded-lg p-3 text-sm font-medium focus:ring-1 focus:ring-brand-blue outline-none transition-all" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Date</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full border border-slate-200 rounded-lg p-3 text-sm font-medium focus:ring-1 focus:ring-brand-blue outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Start Time</label>
                <input type="time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} className="w-full border border-slate-200 rounded-lg p-3 text-sm font-medium focus:ring-1 focus:ring-brand-blue outline-none" />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-4">
               <button type="button" onClick={onClose} className="px-6 py-3 font-bold text-sm text-slate-500 hover:text-brand-dark transition-all">Cancel</button>
               <button type="submit" className="px-8 py-3 bg-brand-blue text-white rounded-full font-bold text-sm shadow-lg hover:bg-brand-dark transition-all active:scale-95">
                 Schedule Event
               </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddAppointmentModal;
