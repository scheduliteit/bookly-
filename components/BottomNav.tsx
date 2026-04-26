
import React from 'react';
import { Calendar, Users, MessageSquare, LayoutDashboard, CreditCard, Settings, Globe, ShieldCheck } from 'lucide-react';
import { translations, Language } from '../services/translations';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user?: any;
  language: Language;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, user, language }) => {
  const t = translations[language];

  const isAdmin = user?.role === 'admin';

  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'calendar', label: t.calendar, icon: Calendar },
    { id: 'booking-links', label: t.publicPortal, icon: Globe },
    { id: 'clients', label: t.clients, icon: Users },
  ];

  if (isAdmin) {
    menuItems.push({ id: 'management', label: 'Admin', icon: ShieldCheck });
  }

  menuItems.push({ id: 'settings', label: t.settings, icon: Settings });

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-2 pb-[env(safe-area-inset-bottom)] z-50 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
      <div className="flex justify-around items-center h-16">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center w-full h-full transition-all ${
              activeTab === item.id ? 'text-indigo-600 scale-110' : 'text-slate-400'
            }`}
          >
            <item.icon size={20} className={activeTab === item.id ? 'animate-pulse' : ''} />
            <span className="text-[9px] mt-1 font-black uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
