
import React, { useState, useMemo } from 'react';
import { Client, Appointment } from '../types';
import { Search, User, Mail, Phone, Globe, MapPin, MoreVertical, MessageSquare, Trash2, ShieldCheck, Zap, History, DollarSign, Filter, MoreHorizontal, ChevronDown, Users, UserPlus, TrendingUp } from 'lucide-react';
import { Language, translations } from '../services/translations';

interface ClientCRMProps {
  clients: Client[];
  appointments: Appointment[];
  onDeleteClient: (id: string) => void;
}

const ClientCRM: React.FC<ClientCRMProps> = ({ clients, appointments, onDeleteClient }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const lang = (localStorage.getItem('bookly_lang') as Language) || 'en';
  const t = translations[lang];

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = useMemo(() => {
    const activeThisMonth = clients.length; // Simplified for mock
    return [
      { label: 'Total Contacts', value: clients.length, icon: Users, color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
      { label: 'New this Month', value: Math.floor(clients.length * 0.3), icon: UserPlus, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'Retention Rate', value: '84%', icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50' },
    ];
  }, [clients]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-32 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark tracking-tight">Client Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage your relationships and track client growth.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-5 py-2.5 bg-slate-100 rounded-full text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all">
            Export CSV
          </button>
          <button className="px-6 py-2.5 bg-brand-blue text-white rounded-full font-bold text-sm shadow-md hover:bg-brand-dark transition-all">
            Add New Client
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-5">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-bold text-brand-dark">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 pt-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search contacts..."
            className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-12 pr-4 text-sm font-medium outline-none focus:ring-1 focus:ring-brand-blue transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="text-sm font-bold text-slate-500 flex items-center gap-2 hover:text-brand-dark transition-all">
          <Filter size={16} /> Advanced Filters
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client Name</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Information</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Booking History</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredClients.map(client => (
              <tr key={client.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-brand-blue text-white rounded-lg flex items-center justify-center text-xs font-bold">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-brand-dark block">{client.name}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Active Client</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-sm text-slate-600">{client.email}</span>
                    <span className="text-xs text-slate-400">{client.phone}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                   <div className="flex items-center gap-2">
                     <span className="text-sm font-bold text-brand-dark">
                        {appointments.filter(a => a.clientId === client.id).length}
                     </span>
                     <span className="text-xs text-slate-400">Total Bookings</span>
                   </div>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex items-center justify-end gap-2">
                     <button className="p-2 text-slate-400 hover:text-brand-blue transition-all">
                       <MessageSquare size={16} />
                     </button>
                     <button className="p-2 text-slate-400 hover:text-brand-dark transition-all">
                       <MoreHorizontal size={18} />
                     </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredClients.length === 0 && (
           <div className="p-20 text-center text-slate-400 font-medium">
             No matching contacts found in your database.
           </div>
        )}
      </div>
    </div>
  );
};

export default ClientCRM;
