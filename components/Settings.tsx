
import React, { useState, useEffect } from 'react';
import { Save, Trash2, MessageSquare, Mail, Zap, Globe, Calendar, Loader2, Sparkles, ShieldCheck, FileText, Lock, Languages, DollarSign, Activity, Server, Radio, Database, CreditCard, Send, Wallet, ArrowUpRight, Landmark, ExternalLink, Check, History, Receipt, Banknote, SmartphoneNfc, Clock, Plus, Palette, Copy, ChevronDown, Smartphone, Download } from 'lucide-react';
import { paymentService, MerchantStats, Transaction } from '../services/paymentService';
import { Service } from '../types';

interface SettingsProps {
  businessName: string;
  onUpdateBusinessName: (name: string) => void;
  services: Service[];
  onUpdateServices: (services: Service[]) => void;
  connectedApps: string[];
  onUpdateConnectedApps: (apps: string[]) => void;
  legalData: { privacyPolicy: string; termsOfService: string; gdprStrict: boolean };
  onUpdateLegalData: (data: any) => void;
  currency: 'ILS' | 'USD' | 'EUR' | 'GBP';
  onUpdateCurrency: (cur: 'ILS' | 'USD' | 'EUR' | 'GBP') => void;
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
  onUpdateCurrency
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'availability' | 'payouts' | 'legal'>('profile');
  const [name, setName] = useState(businessName);
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

  const handleConnectCalendar = async () => {
    try {
      const response = await fetch('/api/auth/url');
      const { url } = await response.json();
      window.open(url, 'oauth_popup', 'width=600,height=700');
    } catch (error) {
      console.error('OAuth error:', error);
    }
  };

  const handleConnectOutlook = async () => {
    try {
      const response = await fetch('/api/auth/outlook/url');
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

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-dark tracking-tight">Management</h2>
          <p className="text-sm text-slate-500">Configure your business identity and rules.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'availability', label: 'Availability' },
            { id: 'profile', label: 'Profile' },
            { id: 'payouts', label: 'Payments' },
            { id: 'legal', label: 'Legal' }
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

      {activeTab === 'availability' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-in slide-in-from-bottom-4">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
             <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-brand-blue/10 text-brand-blue rounded-full flex items-center justify-center">
                 <Clock size={20} />
               </div>
               <div>
                 <h3 className="font-bold text-brand-dark">Working Hours</h3>
                 <p className="text-xs text-slate-500">Active Schedule: Global Standard</p>
               </div>
             </div>
             <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50">
               Edit
             </button>
          </div>
          
          <div className="p-0">
             {schedule.map((item, idx) => (
               <div key={item.day} className={`px-8 py-5 flex items-center justify-between border-b border-slate-50 last:border-0 ${!item.active ? 'bg-slate-50/30' : ''}`}>
                  <div className="flex items-center gap-6 w-48">
                     <input type="checkbox" checked={item.active} readOnly className="w-4 h-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue" />
                     <span className={`text-sm font-bold ${item.active ? 'text-brand-dark' : 'text-slate-400'}`}>{item.day}</span>
                  </div>
                  <div className={`flex-1 text-sm font-medium ${item.active ? 'text-brand-dark' : 'text-slate-400 italic'}`}>
                     {item.hours}
                  </div>
                  {item.active && (
                    <div className="flex items-center gap-4">
                       <Plus size={16} className="text-slate-400 cursor-pointer hover:text-brand-blue" />
                       <Trash2 size={16} className="text-slate-400 cursor-pointer hover:text-rose-600" />
                    </div>
                  )}
               </div>
             ))}
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
                      <CreditCard className="text-slate-400" />
                      <div>
                         <p className="text-sm font-bold text-brand-dark">Stripe Account Connected</p>
                         <p className="text-xs text-slate-500">Direct payouts enabled</p>
                      </div>
                   </div>
                   <div className="w-3 h-3 bg-emerald-500 rounded-full" />
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
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold">
                    <Check size={14} /> Active
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
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold">
                    <Check size={14} /> Active
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
              <h3 className="font-bold text-brand-dark">Business Profile</h3>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-1.5">
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
    </div>
  );
};

export default Settings;
