
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Users, LayoutDashboard, Settings, CreditCard, Sparkles, Megaphone, Crown, Zap, Activity, Globe, Radio, Link as LinkIcon, Layers, LogOut, Plus, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import Logo from './Logo';
import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user?: User | null;
  subscriptionPlan?: 'basic' | 'premium';
  connectedApps: string[];
  onLogout?: () => void;
  onAddClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, user, onLogout, connectedApps, onAddClick }) => {
  const isAdmin = user?.role === 'admin';
  const [isRolledDown, setIsRolledDown] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Event Types', icon: LinkIcon },
    { id: 'earnings', label: 'Earnings', icon: Activity },
    { id: 'calendar', label: 'Scheduled Events', icon: Calendar },
    { id: 'marketing', label: 'Workflows', icon: Zap },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles },
    { id: 'subscription', label: 'Billing & Plan', icon: CreditCard },
    { id: 'clients', label: 'Contacts', icon: Users },
  ];

  if (isAdmin) {
    menuItems.push({ id: 'management', label: 'Management', icon: ShieldCheck });
  }

  return (
    <div className="hidden md:flex w-64 bg-white border-r border-[#eaebed] h-full flex-col shrink-0 relative z-50 transition-all duration-500">
      <div className="p-8 pb-4 flex items-center justify-between">
        <Logo size="md" className="cursor-pointer" onClick={() => setActiveTab('dashboard')} />
        <button 
          onClick={() => setIsRolledDown(!isRolledDown)}
          className="w-10 h-10 rounded-2xl bg-slate-50/50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-brand-blue hover:text-white transition-all shadow-sm group"
        >
          {isRolledDown ? <ChevronUp size={18} /> : <div className="animate-bounce"><ChevronDown size={18} /></div>}
        </button>
      </div>
      
      <AnimatePresence mode="wait">
        {isRolledDown && (
          <motion.div 
            key="sidebar-content"
            initial={{ height: 0, opacity: 0, scaleY: 0.8, originY: 0 }}
            animate={{ height: 'calc(100% - 100px)', opacity: 1, scaleY: 1, originY: 0 }}
            exit={{ height: 0, opacity: 0, scaleY: 0.8, originY: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <motion.nav 
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05
                  }
                }
              }}
              className="flex-1 px-4 pt-8 space-y-1 overflow-y-auto custom-scroll"
            >
              <motion.div variants={{ hidden: { y: -20, opacity: 0 }, visible: { y: 0, opacity: 1 } }} className="pb-4">
                 <button 
                   onClick={onAddClick}
                   className="w-full flex items-center gap-3 px-4 py-2.5 bg-brand-blue text-white rounded-full font-bold text-sm shadow-md hover:bg-blue-700 transition-all mb-8"
                 >
                    <Plus size={18} strokeWidth={3} /> Create
                 </button>
              </motion.div>

              {menuItems.map((item) => (
                <motion.button
                  key={item.id}
                  variants={{ hidden: { x: -20, opacity: 0 }, visible: { x: 0, opacity: 1 } }}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all font-bold text-sm ${
                    activeTab === item.id
                      ? 'bg-blue-50/50 text-brand-blue'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <item.icon size={18} strokeWidth={2.5} className={`${activeTab === item.id ? 'text-brand-blue' : 'text-slate-400'}`} />
                  {item.label}
                </motion.button>
              ))}

              {/* Early Access Info */}
              {!isAdmin && (
                <motion.div variants={{ hidden: { scale: 0.9, opacity: 0 }, visible: { scale: 1, opacity: 1 } }} className="mt-6 px-4 py-4 bg-brand-blue/5 rounded-2xl border border-brand-blue/10 mx-1">
                   <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={12} className="text-brand-blue" />
                      <span className="text-[9px] font-black text-brand-blue uppercase tracking-widest">Early Access Active</span>
                   </div>
                   <p className="text-[10px] font-bold text-slate-500 leading-tight italic">
                     Enjoy global premium AI and Full White-labeling free during our beta phase. (Value: $11/mo)
                   </p>
                </motion.div>
              )}

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
            </motion.nav>

            <div className="p-6 space-y-1 border-t border-slate-50">
              <button 
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all font-bold text-sm ${activeTab === 'settings' ? 'bg-slate-50 text-brand-dark' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Settings size={18} />
                Settings
              </button>
              
              <div className="mt-4 pt-4 border-t border-slate-50">
                <div 
                  onClick={() => { setActiveTab('settings'); setIsRolledDown(false); }}
                  className="px-4 py-3 flex items-center gap-3 group cursor-pointer hover:bg-slate-50 rounded-xl transition-all"
                >
                  <div className="w-10 h-10 bg-brand-blue text-white rounded-full flex items-center justify-center font-black shadow-lg shadow-brand-blue/20 group-hover:scale-110 transition-transform">
                    {onLogout ? 'S' : 'U'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-black text-brand-dark truncate">{user?.email || 'User Account'}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Free Early Access</p>
                  </div>
                </div>
                <button 
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all font-bold text-sm text-rose-500 hover:bg-rose-50 mt-2"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Sidebar;
