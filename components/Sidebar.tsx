
import React from 'react';
import { Calendar, Users, LayoutDashboard, Settings, CreditCard, Sparkles, Megaphone, Crown, Zap, Activity, Globe, Radio, Link as LinkIcon, Layers, LogOut } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  subscriptionPlan?: 'basic' | 'premium';
  connectedApps: string[];
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout, connectedApps }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Event Types', icon: LinkIcon },
    { id: 'calendar', label: 'Scheduled Events', icon: Calendar },
    { id: 'marketing', label: 'Workflows', icon: Zap },
    { id: 'ai-assistant', label: 'Routing Forms', icon: Layers },
    { id: 'clients', label: 'Contacts', icon: Users },
  ];

  return (
    <div className="hidden md:flex w-64 bg-white border-r border-[#eaebed] h-full flex-col shrink-0 relative z-50">
      <div className="p-8 pb-4">
        <h1 className="text-2xl font-black text-brand-dark flex items-center gap-2.5 tracking-tight cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center text-white">
            <div className="w-4 h-4 bg-white rounded-sm rotate-45" />
          </div>
          <span className="text-[#006bff]">EasyBookly</span>
        </h1>
      </div>
      
      <nav className="flex-1 px-4 pt-8 space-y-1">
        <div className="pb-4">
           <button 
             onClick={() => setActiveTab('dashboard')}
             className="w-full flex items-center gap-3 px-4 py-2.5 bg-brand-blue text-white rounded-full font-bold text-sm shadow-md hover:bg-blue-700 transition-all mb-8"
           >
              <Plus size={18} strokeWidth={3} /> Create
           </button>
        </div>

        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all font-bold text-sm ${
              activeTab === item.id
                ? 'bg-blue-50/50 text-brand-blue'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <item.icon size={18} strokeWidth={2.5} className={`${activeTab === item.id ? 'text-brand-blue' : 'text-slate-400'}`} />
            {item.label}
          </button>
        ))}

        {/* Global Sync Status */}
        {connectedApps.length > 0 && (
          <div className="mt-8 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 mx-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Sync Status</p>
            <div className="space-y-2">
              {connectedApps.includes('google') && (
                <div className="flex items-center gap-2">
                  <img src="https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png" className="w-3.5 h-3.5" alt="Google" />
                  <span className="text-[11px] font-bold text-slate-600">Google Active</span>
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full ml-auto animate-pulse" />
                </div>
              )}
              {connectedApps.includes('outlook') && (
                <div className="flex items-center gap-2">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg" className="w-3.5 h-3.5" alt="Outlook" />
                  <span className="text-[11px] font-bold text-slate-600">Outlook Active</span>
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full ml-auto animate-pulse" />
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      <div className="p-6 space-y-1 border-t border-slate-50">
        <button 
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all font-bold text-sm ${activeTab === 'settings' ? 'bg-slate-50 text-brand-dark' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Settings size={18} />
          Settings
        </button>
        <button 
          onClick={() => setActiveTab('subscription')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all font-bold text-sm ${activeTab === 'subscription' ? 'bg-slate-50 text-brand-dark' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <CreditCard size={18} />
          Billing
        </button>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all font-bold text-sm text-rose-500 hover:bg-rose-50 mt-4"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

const Plus = ({ size, strokeWidth }: { size: number, strokeWidth: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

export default Sidebar;
