import React, { useState, useEffect } from 'react';
import { Save, Trash2, MessageSquare, Mail, Zap, Globe, Calendar, Loader2, Sparkles, ShieldCheck, FileText, Lock, Languages, DollarSign, Activity, Server, Radio, Database, CreditCard, Send, Wallet, ArrowUpRight, Landmark, ExternalLink, Check, History, Receipt, Banknote, SmartphoneNfc, Clock, Plus, Palette, Copy, ChevronDown, Smartphone, Download, Bell, Info, Search, Users, AlertCircle } from 'lucide-react';
import { paymentService, MerchantStats, Transaction } from '../services/paymentService';
import { Service } from '../types';
import { translations, Language } from '../services/translations';
import DiagnosticTool from './DiagnosticTool';

interface SettingsProps {
  businessName: string;
  onUpdateBusinessName: (name: string) => void;
  services: Service[];
  onUpdateServices: (services: Service[]) => void;
  connectedApps: string[];
  onUpdateConnectedApps: (apps: string[]) => void;
  legalData: { privacyPolicy: string; termsOfService: string; gdprStrict: boolean };
  onUpdateLegalData: (data: any) => void;
  currency: 'USD' | 'EUR' | 'GBP' | 'ILS';
  onUpdateCurrency: (cur: 'USD' | 'EUR' | 'GBP' | 'ILS') => void;
  timezone: string;
  onUpdateTimezone: (tz: string) => void;
  reminderSettings: {
    enabled: boolean;
    channels: string[];
    timing: number;
    messageTemplate: string;
  };
  onUpdateReminderSettings: (settings: any) => void;
  availabilitySettings?: any;
  onUpdateAvailabilitySettings?: (settings: any) => void;
  dateOverrides?: { [date: string]: { active: boolean; start?: string; end?: string } };
  onUpdateDateOverrides?: (overrides: any) => void;
  staff?: any[];
  onUpdateStaff?: (staff: any[]) => void;
  userId: string;
  initialTab?: 'profile' | 'services' | 'availability' | 'payouts' | 'legal' | 'localization' | 'reminders' | 'audit' | 'staff';
  language: Language;
  onUpdateLanguage: (lang: Language) => void;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  businessName, 
  onUpdateBusinessName, 
  services, 
  onUpdateServices,
  connectedApps,
  onUpdateConnectedApps,
  legalData,
  onUpdateLegalData,
  currency,
  onUpdateCurrency,
  timezone,
  onUpdateTimezone,
  reminderSettings,
  onUpdateReminderSettings,
  availabilitySettings,
  onUpdateAvailabilitySettings,
  dateOverrides = {},
  onUpdateDateOverrides,
  staff = [],
  onUpdateStaff,
  userId,
  initialTab,
  language,
  onUpdateLanguage,
  showToast
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'services' | 'availability' | 'payouts' | 'legal' | 'localization' | 'reminders' | 'audit' | 'staff'>(initialTab || 'profile');
  const [name, setName] = useState(businessName);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [newOverrideDate, setNewOverrideDate] = useState('');
  const [newOverrideStart, setNewOverrideStart] = useState('09:00');
  const [newOverrideEnd, setNewOverrideEnd] = useState('17:00');
  const [newOverrideActive, setNewOverrideActive] = useState(false);

  const handleUpdateStaffHours = (staffId: string, day: string, data: any) => {
    if (!onUpdateStaff) return;
    const updatedStaff = staff.map(s => {
      if (s.id === staffId) {
        return {
          ...s,
          workingHours: {
            ...s.workingHours,
            [day]: { ...s.workingHours[day], ...data }
          }
        };
      }
      return s;
    });
    onUpdateStaff(updatedStaff);
  };

  const [newStaff, setNewStaff] = useState({ name: '', email: '', role: 'member', color: '#006bff' });

  const handleAddStaff = () => {
    if (!newStaff.name || !newStaff.email) {
      if (showToast) showToast('Please enter name and email', 'error');
      return;
    }
    const staffToAdd = {
      ...newStaff,
      id: `staff-${Date.now()}`,
      workingHours: {
        'Monday': { start: '09:00', end: '17:00', active: true },
        'Tuesday': { start: '09:00', end: '17:00', active: true },
        'Wednesday': { start: '09:00', end: '17:00', active: true },
        'Thursday': { start: '09:00', end: '17:00', active: true },
        'Friday': { start: '09:00', end: '17:00', active: true },
        'Saturday': { start: '09:00', end: '17:00', active: false },
        'Sunday': { start: '09:00', end: '17:00', active: false },
      }
    };
    if (onUpdateStaff) onUpdateStaff([...staff, staffToAdd]);
    setNewStaff({ name: '', email: '', role: 'member', color: '#006bff' });
    if (showToast) showToast('Staff member added!', 'success');
  };

  const handleDeleteStaff = (id: string) => {
    if (onUpdateStaff) onUpdateStaff(staff.filter(s => s.id !== id));
  };

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  useEffect(() => {
    setName(businessName);
  }, [businessName]);

  const [newService, setNewService] = useState<Partial<Service>>({ name: '', duration: 30, price: 0, color: '#006bff', locationType: 'online' });

  const handleAddService = () => {
    if (!newService.name?.trim()) {
      if (showToast) showToast('Please enter an event name', 'error');
      return;
    }
    
    if (!newService.duration || newService.duration <= 0) {
      if (showToast) showToast('Duration must be at least 1 minute', 'error');
      return;
    }

    const serviceToAdd: Service = {
      name: newService.name.trim(),
      duration: newService.duration || 30,
      price: newService.price || 0,
      color: newService.color || '#006bff',
      locationType: (newService.locationType as any) || 'online'
    };

    console.log('[SETTINGS] Adding new service:', serviceToAdd);
    onUpdateServices([...services, serviceToAdd]);
    setNewService({ name: '', duration: 30, price: 0, color: '#006bff', locationType: 'online' });
    
    if (showToast) showToast(`"${serviceToAdd.name}" added successfully!`, 'success');
  };

  const handleDeleteService = (serviceName: string) => {
    onUpdateServices(services.filter(s => s.name !== serviceName));
  };
  const [merchantStats, setMerchantStats] = useState<MerchantStats>({
    grossEarnings: 0,
    netEarnings: 0,
    pendingPayout: 0,
    isGatewayConnected: false,
    history: []
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPayoutInProgress, setIsPayoutInProgress] = useState(false);
  const [isCalendarConnected, setIsCalendarConnected] = useState(() => localStorage.getItem('easybookly_calendar_connected') === 'true');

  useEffect(() => {
    const fetchStats = async () => {
      const stats = await paymentService.getMerchantStats();
      setMerchantStats(stats);
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const provider = event.data.provider;
        if (provider === 'google') {
          setIsCalendarConnected(true);
          localStorage.setItem('easybookly_calendar_connected', 'true');
        } else if (provider === 'outlook') {
          localStorage.setItem('easybookly_outlook_connected', 'true');
        }
        
        if (!connectedApps.includes(provider)) {
          onUpdateConnectedApps([...connectedApps, provider]);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [connectedApps, onUpdateConnectedApps]);

  const handleDisconnectApp = async (provider: string) => {
    try {
      const response = await fetch('/api/auth/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('eb_token')}`
        },
        body: JSON.stringify({ provider })
      });
      
      if (response.ok) {
        onUpdateConnectedApps(connectedApps.filter(app => app !== provider));
        if (provider === 'google') {
          setIsCalendarConnected(false);
          localStorage.removeItem('easybookly_calendar_connected');
        } else if (provider === 'outlook') {
          localStorage.removeItem('easybookly_outlook_connected');
        }
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const handleConnectCalendar = async () => {
    try {
      const response = await fetch(`/api/auth/google/url?userId=${userId}`);
      const { url } = await response.json();
      window.open(url, 'oauth_popup', 'width=600,height=700');
    } catch (error) {
      console.error('OAuth error:', error);
    }
  };

  const handleConnectZoom = async () => {
    try {
      const response = await fetch(`/api/auth/zoom/url?userId=${userId}`);
      const { url } = await response.json();
      window.open(url, 'oauth_popup', 'width=600,height=700');
    } catch (error) {
      console.error('Zoom OAuth error:', error);
    }
  };

  const handleConnectOutlook = async () => {
    try {
      const response = await fetch(`/api/auth/outlook/url?userId=${userId}`);
      const { url } = await response.json();
      window.open(url, 'oauth_popup', 'width=600,height=700');
    } catch (error) {
      console.error('Outlook OAuth error:', error);
    }
  };

  const handleConnectGateway = async () => {
    setIsConnecting(true);
    await paymentService.connectLocalGateway();
    const stats = await paymentService.getMerchantStats();
    setMerchantStats(stats);
    setIsConnecting(false);
  };

  const handleTriggerPayout = async () => {
    setIsPayoutInProgress(true);
    await paymentService.triggerPayout();
    const stats = await paymentService.getMerchantStats();
    setMerchantStats(stats);
    setIsPayoutInProgress(false);
  };

  const schedule = [
    { day: 'Sunday', hours: '9:00am – 5:00pm', active: true },
    { day: 'Monday', hours: '9:00am – 5:00pm', active: true },
    { day: 'Tuesday', hours: '9:00am – 5:00pm', active: true },
    { day: 'Wednesday', hours: '9:00am – 5:00pm', active: true },
    { day: 'Thursday', hours: '9:00am – 5:00pm', active: true },
    { day: 'Friday', hours: 'Unavailable', active: false },
    { day: 'Saturday', hours: 'Unavailable', active: false },
  ];

  const [localLanguage, setLocalLanguage] = useState<Language>(language);
  const [localCurrency, setLocalCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'ILS'>(currency);
  const t = translations[language];

  const handleSaveLocalization = () => {
    onUpdateLanguage(localLanguage);
    onUpdateCurrency(localCurrency);
    alert('Localization settings saved!');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-dark tracking-tight">{t.settings}</h2>
          <p className="text-sm text-slate-500">Configure your business identity and rules.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
          {[
            { id: 'profile', label: t.profile },
            { id: 'staff', label: 'Staff' },
            { id: 'services', label: t.services },
            { id: 'reminders', label: 'Reminders' },
            { id: 'availability', label: t.availability },
            { id: 'payouts', label: t.payouts },
            { id: 'localization', label: t.localization },
            { id: 'legal', label: t.legal },
            { id: 'audit', label: t.audit }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-white shadow-sm text-brand-blue' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'staff' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
           <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
             <div className="p-8 border-b border-slate-100 flex items-center justify-between">
               <div>
                 <h3 className="font-bold text-brand-dark">Team Management</h3>
                 <p className="text-xs text-slate-500 mt-1">Add staff members and manage their individual availability.</p>
               </div>
               <div className="w-10 h-10 bg-brand-blue/10 text-brand-blue rounded-full flex items-center justify-center">
                 <Users size={20} />
               </div>
             </div>
             
             <div className="p-8 space-y-8">
               {staff.length === 0 ? (
                 <div className="py-12 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 mb-4 shadow-sm">
                      <Users size={32} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-400">No team members yet</h4>
                    <p className="text-xs text-slate-400 mt-1">Add your team to expand your business capacity.</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {staff.map((member: any) => (
                      <React.Fragment key={member.id}>
                        <div className="relative group bg-white border border-slate-100 p-6 rounded-[24px] shadow-sm hover:shadow-md transition-all">
                         <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black" style={{ backgroundColor: member.color }}>
                               {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                               <h4 className="font-black text-brand-dark">{member.name}</h4>
                               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{member.role}</p>
                            </div>
                         </div>
                         <div className="space-y-2 mb-6">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                               <Mail size={12} className="shrink-0" />
                               <span className="truncate">{member.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                               <Clock size={12} className="shrink-0" />
                               <span>Standard Hours</span>
                            </div>
                         </div>
                         <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                            <button 
                              onClick={() => setEditingStaffId(member.id === editingStaffId ? null : member.id)}
                              className="text-[10px] font-black text-brand-blue uppercase tracking-widest hover:underline"
                            >
                               {editingStaffId === member.id ? 'Close' : 'Edit Hours'}
                            </button>
                            <button 
                              onClick={() => handleDeleteStaff(member.id)}
                              className="text-slate-300 hover:text-rose-600 transition-colors"
                            >
                               <Trash2 size={16} />
                            </button>
                         </div>
                      </div>
                      {editingStaffId === member.id && (
                        <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-slate-50/50 p-8 rounded-[32px] border border-slate-100 animate-in slide-in-from-top-4">
                           <div className="flex items-center justify-between mb-6">
                              <h4 className="text-sm font-black text-brand-dark uppercase tracking-widest">Working Hours for {member.name}</h4>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Manage individual availability</p>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {Object.entries(member.workingHours || {}).map(([day, hours]: [string, any]) => (
                                <div key={day} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                   <div className="flex items-center gap-3">
                                      <input 
                                        type="checkbox" 
                                        checked={hours.active} 
                                        onChange={(e) => handleUpdateStaffHours(member.id, day, { active: e.target.checked })}
                                        className="w-4 h-4 rounded text-brand-blue" 
                                      />
                                      <span className="text-xs font-bold w-20">{day}</span>
                                   </div>
                                   {hours.active && (
                                     <div className="flex items-center gap-2">
                                        <input 
                                          type="time" 
                                          value={hours.start} 
                                          onChange={(e) => handleUpdateStaffHours(member.id, day, { start: e.target.value })}
                                          className="px-2 py-1 bg-slate-50 border-0 rounded text-[10px] font-bold outline-none" 
                                        />
                                        <span className="text-[10px] text-slate-300">–</span>
                                        <input 
                                          type="time" 
                                          value={hours.end} 
                                          onChange={(e) => handleUpdateStaffHours(member.id, day, { end: e.target.value })}
                                          className="px-2 py-1 bg-slate-50 border-0 rounded text-[10px] font-bold outline-none" 
                                        />
                                     </div>
                                   )}
                                </div>
                              ))}
                           </div>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                 </div>
               )}

               <div className="pt-8 border-t border-slate-100">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Plus size={14} className="text-brand-blue" /> Add Team Member
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Full Name</label>
                        <input 
                          type="text" 
                          placeholder="John Doe" 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue outline-none font-bold"
                          value={newStaff.name}
                          onChange={e => setNewStaff({...newStaff, name: e.target.value})}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Email Address</label>
                        <input 
                          type="email" 
                          placeholder="john@example.com" 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue outline-none font-bold"
                          value={newStaff.email}
                          onChange={e => setNewStaff({...newStaff, email: e.target.value})}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Role</label>
                        <select 
                           className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue outline-none font-bold cursor-pointer"
                           value={newStaff.role}
                           onChange={e => setNewStaff({...newStaff, role: e.target.value as any})}
                        >
                           <option value="member">Staff Member</option>
                           <option value="manager">Manager</option>
                        </select>
                     </div>
                  </div>
                  <div className="mt-8 flex items-center justify-between p-6 bg-brand-blue/5 rounded-[24px] border border-brand-blue/10">
                     <div className="flex items-center gap-4">
                        <div className="flex gap-2">
                           {['#006bff', '#7c3aed', '#ec4899', '#f97316', '#10b981'].map(c => (
                              <button 
                                key={c}
                                onClick={() => setNewStaff({...newStaff, color: c})}
                                className={`w-8 h-8 rounded-full border-4 transition-all ${newStaff.color === c ? 'border-white scale-110 shadow-sm' : 'border-transparent opacity-40 hover:opacity-100'}`}
                                style={{ backgroundColor: c }}
                              />
                           ))}
                        </div>
                        <p className="text-[10px] font-bold text-slate-500">Pick a distinct color for this member's calendar entries.</p>
                     </div>
                     <button 
                       onClick={handleAddStaff}
                       className="px-8 py-3 bg-brand-blue text-white rounded-xl font-bold text-sm hover:bg-brand-dark transition-all shadow-lg shadow-brand-blue/20"
                     >
                       Add to Team
                     </button>
                  </div>
               </div>
             </div>
           </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-brand-dark">Event Types</h3>
                <p className="text-xs text-slate-500 mt-1">Manage the types of appointments clients can book.</p>
              </div>
              <div className="w-10 h-10 bg-brand-blue/10 text-brand-blue rounded-full flex items-center justify-center">
                <Zap size={20} />
              </div>
            </div>
            <div className="p-8 space-y-6">
              {services.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 mb-4 shadow-sm">
                    <Zap size={32} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-400">No event types yet</h4>
                  <p className="text-xs text-slate-400 mt-1">Add your first service below to start booking.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map((service) => (
                    <div key={service.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: service.color || '#006bff' }} />
                        <div>
                          <p className="text-sm font-bold text-brand-dark">{service.name}</p>
                          <div className="flex items-center gap-1.5">
                            <p className="text-[10px] text-slate-500 font-medium">{service.duration} mins • ${service.price}</p>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter ${service.locationType === 'online' ? 'bg-brand-blue/10 text-brand-blue' : 'bg-slate-100 text-slate-500'}`}>
                              {service.locationType || 'Office'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteService(service.name)}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-6 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Add New Event Type</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Event Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 30 Min Meeting" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-blue font-bold transition-all"
                      value={newService.name}
                      onChange={e => setNewService({...newService, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Duration (min)</label>
                    <input 
                      type="number" 
                      placeholder="30" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-blue font-bold transition-all"
                      value={newService.duration}
                      onChange={e => setNewService({...newService, duration: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Price ($)</label>
                    <input 
                      type="number" 
                      placeholder="0" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-blue font-bold transition-all"
                      value={newService.price}
                      onChange={e => setNewService({...newService, price: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Location</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-blue font-bold transition-all appearance-none cursor-pointer"
                      value={newService.locationType}
                      onChange={e => setNewService({...newService, locationType: e.target.value as any})}
                    >
                      <option value="online">Integrated Private Video Link</option>
                      <option value="office">In-Person (Office)</option>
                      <option value="phone">Phone Call</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-brand-blue shadow-sm">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-brand-dark">Pro Tip</p>
                      <p className="text-[10px] text-slate-500">Adding a price enables automated client billing.</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleAddService}
                    className="px-6 py-3 bg-brand-blue text-white rounded-xl font-bold text-sm hover:bg-brand-dark transition-all flex items-center gap-2 shadow-lg shadow-brand-blue/20"
                  >
                    <Plus size={16} /> Add Event Type
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'availability' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-brand-blue/10 text-brand-blue rounded-full flex items-center justify-center">
                   <Clock size={20} />
                 </div>
                 <div>
                   <h3 className="font-bold text-brand-dark">Standard Working Hours</h3>
                   <p className="text-xs text-slate-500">Global defaults for the business.</p>
                 </div>
               </div>
            </div>
            
            <div className="p-0">
               {Object.entries(availabilitySettings?.workingHours || {}).map(([day, hours]: [string, any]) => (
                 <div key={day} className={`px-8 py-5 flex items-center justify-between border-b border-slate-50 last:border-0 ${!hours.active ? 'bg-slate-50/30' : ''}`}>
                    <div className="flex items-center gap-6 w-48">
                       <input 
                        type="checkbox" 
                        checked={hours.active} 
                        onChange={(e) => onUpdateAvailabilitySettings?.({
                          ...availabilitySettings,
                          workingHours: {
                            ...availabilitySettings.workingHours,
                            [day]: { ...hours, active: e.target.checked }
                          }
                        })}
                        className="w-4 h-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue" 
                       />
                       <span className={`text-sm font-bold ${hours.active ? 'text-brand-dark' : 'text-slate-400'}`}>{day}</span>
                    </div>
                    {hours.active ? (
                      <div className="flex items-center gap-4">
                         <input 
                           type="time" 
                           value={hours.start} 
                           onChange={(e) => onUpdateAvailabilitySettings?.({
                             ...availabilitySettings,
                             workingHours: {
                               ...availabilitySettings.workingHours,
                               [day]: { ...hours, start: e.target.value }
                             }
                           })}
                           className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none" 
                         />
                         <span className="text-slate-300 font-bold">to</span>
                         <input 
                           type="time" 
                           value={hours.end} 
                           onChange={(e) => onUpdateAvailabilitySettings?.({
                             ...availabilitySettings,
                             workingHours: {
                               ...availabilitySettings.workingHours,
                               [day]: { ...hours, end: e.target.value }
                             }
                           })}
                           className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none" 
                         />
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400 italic">Business Closed</span>
                    )}
                 </div>
               ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
             <div className="p-8 border-b border-slate-100">
               <h3 className="font-bold text-brand-dark">Date Overrides & Absence</h3>
               <p className="text-xs text-slate-500 mt-1">Set specific days as closed or with custom hours (e.g. holidays).</p>
             </div>
             <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Date</label>
                      <input 
                        type="date" 
                        value={newOverrideDate}
                        onChange={e => setNewOverrideDate(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                      <select 
                        value={newOverrideActive ? 'open' : 'closed'}
                        onChange={e => setNewOverrideActive(e.target.value === 'open')}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                      >
                         <option value="closed">Closed / Vacation</option>
                         <option value="open">Custom Hours</option>
                      </select>
                   </div>
                   {newOverrideActive && (
                     <>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start</label>
                           <input type="time" value={newOverrideStart} onChange={e => setNewOverrideStart(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End</label>
                           <input type="time" value={newOverrideEnd} onChange={e => setNewOverrideEnd(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none" />
                        </div>
                     </>
                   )}
                   <button 
                     disabled={!newOverrideDate}
                     onClick={() => {
                        onUpdateDateOverrides?.({
                          ...dateOverrides,
                          [newOverrideDate]: {
                            active: newOverrideActive,
                            start: newOverrideActive ? newOverrideStart : undefined,
                            end: newOverrideActive ? newOverrideEnd : undefined
                          }
                        });
                        setNewOverrideDate('');
                     }}
                     className="px-6 py-3 bg-brand-blue text-white rounded-xl font-bold text-sm hover:bg-brand-dark transition-all disabled:opacity-50"
                   >
                     Add Override
                   </button>
                </div>

                {Object.keys(dateOverrides).length > 0 && (
                  <div className="space-y-4 pt-8 border-t border-slate-50">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Active Overrides</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(dateOverrides).map(([date, data]: [string, any]) => (
                          <div key={date} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                             <div>
                                <p className="text-sm font-black text-slate-900">{new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                <p className={`text-[10px] font-bold uppercase tracking-widest ${data.active ? 'text-emerald-600' : 'text-rose-600'}`}>
                                   {data.active ? `${data.start} – ${data.end}` : 'Business Closed'}
                                </p>
                             </div>
                             <button 
                               onClick={() => {
                                 const updated = { ...dateOverrides };
                                 delete updated[date];
                                 onUpdateDateOverrides?.(updated);
                               }}
                               className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                             >
                                <Trash2 size={16} />
                             </button>
                          </div>
                        ))}
                     </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {activeTab === 'payouts' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
             <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-brand-dark">Billing & Payments</h3>
                <div className="flex items-center gap-2">
                   <ShieldCheck size={16} className="text-emerald-500" />
                   <span className="text-[10px] font-bold text-emerald-600 uppercase">Secure</span>
                </div>
             </div>
             <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                   <div>
                      <p className="text-sm font-bold text-slate-700">Available for Payout</p>
                      <p className="text-3xl font-bold text-brand-dark">${merchantStats.pendingPayout.toLocaleString()}</p>
                   </div>
                   <button 
                    onClick={handleTriggerPayout}
                    className="px-6 py-2.5 bg-brand-blue text-white rounded-lg font-bold text-sm hover:bg-brand-dark"
                   >
                     Withdraw to Bank
                   </button>
                </div>
                
                 <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <CreditCard className="text-brand-blue" />
                      </div>
                      <div>
                         <p className="text-sm font-bold text-brand-dark">Stripe Payout System</p>
                         <p className="text-xs text-slate-500">Automated Direct Deposits Enabled</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                     <Check size={12} /> Active
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'reminders' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-brand-dark">Automated Reminders</h3>
                <p className="text-xs text-slate-500 mt-1">Configure when and how clients receive appointment notifications.</p>
              </div>
              <div className="w-10 h-10 bg-brand-blue/10 text-brand-blue rounded-full flex items-center justify-center">
                <Bell size={20} />
              </div>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                    <Zap size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-dark">Enable Reminders</p>
                    <p className="text-xs text-slate-500">Automatically send notifications before sessions</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={reminderSettings.enabled}
                    onChange={(e) => onUpdateReminderSettings({ ...reminderSettings, enabled: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Smartphone size={14} /> Notification Channels
                  </label>
                  <div className="space-y-3">
                    {[
                      { id: 'email', label: 'Email', icon: <Mail size={16} /> },
                      { id: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare size={16} /> },
                      { id: 'sms', label: 'SMS', icon: <SmartphoneNfc size={16} /> }
                    ].map((channel) => (
                      <label key={channel.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:border-brand-blue/30 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="text-slate-400">{channel.icon}</div>
                          <span className="text-sm font-bold text-brand-dark">{channel.label}</span>
                        </div>
                        <input 
                          type="checkbox"
                          checked={reminderSettings.channels.includes(channel.id)}
                          onChange={(e) => {
                            const newChannels = e.target.checked 
                              ? [...reminderSettings.channels, channel.id]
                              : reminderSettings.channels.filter((c: string) => c !== channel.id);
                            onUpdateReminderSettings({ ...reminderSettings, channels: newChannels });
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock size={14} /> Reminder Timing
                  </label>
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                    <p className="text-xs text-slate-500 font-medium italic">Send reminder how many minutes before?</p>
                    <div className="flex items-center gap-4">
                      <select 
                        value={reminderSettings.timing}
                        onChange={(e) => onUpdateReminderSettings({ ...reminderSettings, timing: Number(e.target.value) })}
                        className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-1 focus:ring-brand-blue"
                      >
                        <option value="15">15 minutes before</option>
                        <option value="30">30 minutes before</option>
                        <option value="60">1 hour before</option>
                        <option value="120">2 hours before</option>
                        <option value="1440">24 hours before</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
                    <Info size={20} className="text-amber-500 shrink-0" />
                    <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                      <strong>Pro Tip:</strong> Most businesses find that sending a reminder <strong>1 hour</strong> before the session reduces no-shows by up to 40%.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={14} /> Message Template
                </label>
                <textarea 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-brand-blue outline-none transition-all min-h-[120px] resize-none"
                  value={reminderSettings.messageTemplate}
                  onChange={(e) => onUpdateReminderSettings({ ...reminderSettings, messageTemplate: e.target.value })}
                  placeholder="Set your custom reminder message..."
                />
                <div className="flex flex-wrap gap-2">
                  {['{clientName}', '{serviceName}', '{businessName}', '{date}', '{time}', '{link}'].map(tag => (
                    <span key={tag} className="px-2 py-1 bg-slate-100 text-[10px] font-bold text-slate-500 rounded-md border border-slate-200">{tag}</span>
                  ))}
                </div>
              </div>
              
              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => alert('Settings saved to cloud!')}
                  className="px-8 py-3 bg-brand-blue text-white rounded-xl font-bold text-sm hover:bg-brand-dark transition-all flex items-center gap-2"
                >
                  <Save size={18} /> Save Notification Rules
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100">
              <h3 className="font-bold text-brand-dark">Calendar Sync</h3>
              <p className="text-xs text-slate-500 mt-1">Connect your external calendars to prevent double bookings.</p>
            </div>
            <div className="p-8 space-y-6">
              {/* Google Calendar */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <img src="https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png" className="w-6 h-6" alt="Google Calendar" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-dark">Google Calendar</p>
                      <p className="text-xs text-slate-500">{connectedApps.includes('google') ? 'Connected and syncing' : 'Not connected'}</p>
                    </div>
                  </div>
                  {connectedApps.includes('google') ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100">
                        <Check size={14} /> Active
                      </div>
                      <button 
                        onClick={() => handleDisconnectApp('google')}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        title="Disconnect Google Calendar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={handleConnectCalendar}
                      className="px-6 py-2.5 bg-brand-blue text-white rounded-lg font-bold text-sm hover:bg-brand-dark shadow-md transition-all"
                    >
                      Connect
                    </button>
                  )}
                </div>

                {!connectedApps.includes('google') && (
                  <div className="p-6 bg-brand-blue/5 rounded-2xl border border-brand-blue/10 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-brand-blue/10 text-brand-blue rounded-lg flex items-center justify-center shrink-0">
                        <Info size={16} />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold text-brand-dark">Setup Instructions</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          To connect Google Calendar, you must configure your Client ID and Client Secret in the <strong>Admin Settings</strong> (via the backend or environment variables).
                        </p>
                        <div className="pt-2">
                          <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest mb-2">Authorized Redirect URIs</p>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-brand-blue/20">
                              <code className="text-[10px] font-mono text-slate-600 truncate mr-2">{window.location.origin}/auth/callback</code>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/auth/callback`);
                                  alert('Copied dev callback');
                                }}
                                className="p-1.5 hover:bg-slate-50 rounded-lg text-brand-blue transition-all"
                              >
                                <Copy size={12} />
                              </button>
                            </div>
                            {/* Also provide the shared/preview URL if available */}
                            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-brand-blue/20">
                              <code className="text-[10px] font-mono text-slate-600 truncate mr-2">https://ais-pre-aal6thy3ti4eogtu3iyvnn-508897601969.europe-west2.run.app/auth/callback</code>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(`https://ais-pre-aal6thy3ti4eogtu3iyvnn-508897601969.europe-west2.run.app/auth/callback`);
                                  alert('Copied shared callback');
                                }}
                                className="p-1.5 hover:bg-slate-50 rounded-lg text-brand-blue transition-all"
                              >
                                <Copy size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Outlook Calendar */}
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg" className="w-6 h-6" alt="Outlook Calendar" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-dark">Outlook Calendar</p>
                    <p className="text-xs text-slate-500">{connectedApps.includes('outlook') ? 'Connected and syncing' : 'Not connected'}</p>
                  </div>
                </div>
                {connectedApps.includes('outlook') ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100">
                      <Check size={14} /> Active
                    </div>
                    <button 
                      onClick={() => handleDisconnectApp('outlook')}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      title="Disconnect Outlook Calendar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleConnectOutlook}
                    className="px-6 py-2.5 bg-brand-blue text-white rounded-lg font-bold text-sm hover:bg-brand-dark shadow-md transition-all"
                  >
                    Connect
                  </button>
                )}
              </div>

              {/* Integrated Video Toggle */}
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <Radio className="text-brand-blue" size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-dark">Built-in Video Calls</p>
                    <p className="text-xs text-slate-500">Every online booking gets a private video room link.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold">
                  <Check size={14} /> Global Active
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100">
              <h3 className="font-bold text-brand-dark">Mobile App</h3>
              <p className="text-xs text-slate-500 mt-1">Install EasyBookly on your phone for a native experience.</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-start gap-4 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                  <Smartphone className="text-brand-blue" />
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-bold text-brand-dark">Install on Home Screen</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center font-bold text-[10px] border border-slate-200">1</div>
                      <span>Open this page in Safari (iOS) or Chrome (Android)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center font-bold text-[10px] border border-slate-200">2</div>
                      <span>Tap the <strong>Share</strong> button (iOS) or <strong>Menu</strong> (Android)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center font-bold text-[10px] border border-slate-200">3</div>
                      <span>Select <strong>"Add to Home Screen"</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100">
              <h3 className="font-bold text-brand-dark">Booking Rules</h3>
              <p className="text-xs text-slate-500 mt-1">Fine-tune your availability with buffer times and notice periods.</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Buffer Time (Between Bookings)</label>
                  <div className="relative">
                    <select 
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold appearance-none focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                      value={availabilitySettings?.bufferTime || 0}
                      onChange={(e) => onUpdateAvailabilitySettings({ ...availabilitySettings, bufferTime: parseInt(e.target.value) })}
                    >
                      <option value="0">No Buffer</option>
                      <option value="5">5 Minutes</option>
                      <option value="10">10 Minutes</option>
                      <option value="15">15 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="60">1 Hour</option>
                    </select>
                    <Clock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">Adds a gap before and after every appointment to prevent back-to-back fatigue.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Minimum Notice Period</label>
                  <div className="relative">
                    <select 
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold appearance-none focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                      value={availabilitySettings?.minimumNotice || 0}
                      onChange={(e) => onUpdateAvailabilitySettings({ ...availabilitySettings, minimumNotice: parseInt(e.target.value) })}
                    >
                      <option value="0">Instant Booking</option>
                      <option value="15">15 Minutes before</option>
                      <option value="30">30 Minutes before</option>
                      <option value="60">1 Hour before</option>
                      <option value="120">2 Hours before</option>
                      <option value="240">4 Hours before</option>
                      <option value="1440">24 Hours before</option>
                    </select>
                    <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">Prevents clients from booking a slot too close to the current time.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100">
              <h3 className="font-bold text-brand-dark">Business Profile</h3>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Business Timezone</label>
                <div className="flex gap-4">
                  <select 
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                    value={timezone}
                    onChange={(e) => onUpdateTimezone(e.target.value)}
                  >
                    {['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Jerusalem', 'Asia/Tokyo', 'Australia/Sydney'].map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                    {/* Add more if needed, but these are good defaults */}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5 pt-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Business Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <button 
                onClick={() => onUpdateBusinessName(name)}
                className="px-8 py-3 bg-brand-blue text-white rounded-xl font-bold text-sm hover:bg-brand-dark transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'localization' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-brand-dark">Language & Locale</h3>
                <p className="text-xs text-slate-500 mt-1">Select your preferred language and currency display.</p>
              </div>
              <div className="w-10 h-10 bg-brand-blue/10 text-brand-blue rounded-full flex items-center justify-center">
                <Globe size={20} />
              </div>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Languages size={14} /> Application Language
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { id: 'en', label: 'English' },
                      { id: 'he', label: 'עברית' },
                      { id: 'es', label: 'Español' },
                      { id: 'fr', label: 'Français' },
                      { id: 'de', label: 'Deutsch' },
                      { id: 'ar', label: 'العربية' }
                    ].map((lang) => (
                      <button 
                        key={lang.id}
                        onClick={() => setLocalLanguage(lang.id as Language)}
                        className={`px-4 py-3 rounded-xl border font-bold text-sm transition-all focus:outline-none ${localLanguage === lang.id ? 'bg-brand-blue text-white border-brand-blue shadow-lg' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-brand-blue/30'}`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <DollarSign size={14} /> Default Currency
                  </label>
                  <select 
                    value={localCurrency}
                    onChange={(e) => setLocalCurrency(e.target.value as any)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                  >
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                    <option value="ILS">ILS (₪) - Israeli Shekel</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={handleSaveLocalization}
                  className="px-8 py-3 bg-brand-blue text-white rounded-xl font-bold text-sm hover:bg-brand-dark transition-all flex items-center gap-2"
                >
                  <Save size={18} /> Update Localization
                </button>
              </div>

              <div className="pt-8 border-t border-slate-50 space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={14} /> Timezone Settings
                </label>
                <div className="p-6 bg-brand-blue/5 rounded-2xl border border-brand-blue/10">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <Globe className="text-brand-blue" size={20} />
                       <div>
                         <p className="text-sm font-bold text-brand-dark">Current Detection</p>
                         <p className="text-xs text-slate-500">{timezone}</p>
                       </div>
                     </div>
                     <select 
                        value={timezone}
                        onChange={(e) => onUpdateTimezone(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none"
                     >
                       {['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Jerusalem', 'Asia/Tokyo', 'Australia/Sydney'].map(tz => (
                         <option key={tz} value={tz}>{tz}</option>
                       ))}
                     </select>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'legal' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-brand-dark">Legal & Compliance</h3>
                <p className="text-xs text-slate-500 mt-1">Manage your business terms and data protection policies.</p>
              </div>
              <div className="w-10 h-10 bg-brand-blue/10 text-brand-blue rounded-full flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 bg-brand-blue/5 text-brand-blue rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-blue/10">
                    <Database size={12} /> Privacy Policy
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed italic">
                  This text appears on your public booking page. Be clear about how you use client data.
                </p>
                <textarea 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-brand-blue outline-none transition-all min-h-[160px] resize-none"
                  value={legalData.privacyPolicy}
                  onChange={(e) => onUpdateLegalData({ ...legalData, privacyPolicy: e.target.value })}
                  placeholder="Insert your privacy policy content here..."
                />
              </div>

              <div className="pt-8 border-t border-slate-50 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 bg-brand-blue/5 text-brand-blue rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-blue/10">
                    <FileText size={12} /> Terms of Service
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed italic">
                  Define your cancellation rules, refund policies, and user behavior expectations.
                </p>
                <textarea 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-brand-blue outline-none transition-all min-h-[160px] resize-none"
                  value={legalData.termsOfService}
                  onChange={(e) => onUpdateLegalData({ ...legalData, termsOfService: e.target.value })}
                  placeholder="Insert your terms of service content here..."
                />
              </div>

              <div className="pt-8 border-t border-slate-50">
                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <Lock className="text-brand-blue" size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-dark">GDPR & Protection Mode</p>
                      <p className="text-xs text-slate-500">Strict consent checkbox for all bookings</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={legalData.gdprStrict}
                      onChange={(e) => onUpdateLegalData({ ...legalData, gdprStrict: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="animate-in slide-in-from-bottom-4">
          <DiagnosticTool />
        </div>
      )}
    </div>
  );
};

export default Settings;
