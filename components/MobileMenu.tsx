
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, Users, Settings, Sparkles, Zap, 
  Link as LinkIcon, LogOut, Plus, ShieldCheck, X, CreditCard, Activity, HelpCircle
} from 'lucide-react';
import { User } from '../types';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user?: User | null;
  onLogout?: () => void;
  onAddClick?: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ 
  isOpen, onClose, activeTab, setActiveTab, user, onLogout, onAddClick 
}) => {
  const isAdmin = user?.role === 'admin';

  const menuItems = [
    { id: 'dashboard', label: 'Event Types', icon: LinkIcon },
    { id: 'earnings', label: 'Earnings', icon: Activity },
    { id: 'calendar', label: 'Scheduled Events', icon: Calendar },
    { id: 'marketing', label: 'Workflows', icon: Zap },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles },
    { id: 'subscription', label: 'Billing & Plan', icon: CreditCard },
    { id: 'clients', label: 'Contacts', icon: Users },
    { id: 'help', label: 'Help Center', icon: HelpCircle },
  ];

  if (isAdmin) {
    menuItems.push({ id: 'management', label: 'Management', icon: ShieldCheck });
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-[100] md:hidden"
          />

          {/* Roll Down Panel */}
          <motion.div 
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 right-0 bg-white shadow-2xl z-[101] md:hidden rounded-b-[40px] border-b border-brand-blue/10 overflow-hidden"
          >
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.2 } }
              }}
              className="p-6 pb-10 space-y-8"
            >
              {/* Header */}
              <motion.div variants={{ hidden: { y: -20, opacity: 0 }, visible: { y: 0, opacity: 1 } }} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center text-white">
                      <Zap size={18} fill="currentColor" />
                   </div>
                   <span className="font-black text-brand-dark uppercase tracking-tight">Full Control</span>
                </div>
                <button 
                  onClick={onClose}
                  className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 active:scale-90 transition-all font-black"
                >
                  <X size={20} />
                </button>
              </motion.div>

              {/* Action */}
              <motion.button 
                variants={{ hidden: { y: -20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
                onClick={() => { onAddClick?.(); onClose(); }}
                className="w-full py-4 bg-brand-blue text-white rounded-2xl font-black text-sm shadow-xl shadow-brand-blue/20 flex items-center justify-center gap-3 animate-pulse"
              >
                <Plus size={20} strokeWidth={3} /> Create Event
              </motion.button>

              {/* Navigation Grid */}
              <div className="grid grid-cols-2 gap-3">
                {menuItems.map((item) => (
                  <motion.button
                    key={item.id}
                    variants={{ hidden: { scale: 0.8, opacity: 0 }, visible: { scale: 1, opacity: 1 } }}
                    onClick={() => { setActiveTab(item.id); onClose(); }}
                    className={`flex flex-col items-center gap-3 p-5 rounded-3xl transition-all border ${
                      activeTab === item.id
                        ? 'bg-brand-blue/5 border-brand-blue/20 text-brand-blue'
                        : 'bg-slate-50/50 border-slate-100 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <item.icon size={22} strokeWidth={activeTab === item.id ? 3 : 2} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* Bottom Section */}
              <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }} className="pt-6 border-t border-slate-100">
                 <div className="flex items-center justify-between mb-6">
                    <button 
                      onClick={() => { setActiveTab('settings'); onClose(); }}
                      className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-brand-dark text-white' : 'bg-slate-50 text-slate-400'}`}
                    >
                      <Settings size={16} /> Settings
                    </button>
                    <button 
                      onClick={onLogout}
                      className="flex items-center gap-2 text-rose-500 font-black text-[10px] uppercase tracking-widest px-4"
                    >
                      <LogOut size={14} /> Exit
                    </button>
                 </div>

                 {/* User Info Bar */}
                 <div className="bg-brand-blue p-5 rounded-[24px] flex items-center gap-4 shadow-xl shadow-brand-blue/20">
                    <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center font-black text-xl backdrop-blur-md border border-white/20">
                      S
                    </div>
                    <div className="flex-1 overflow-hidden">
                       <p className="text-sm font-black text-white truncate">{user?.email || 'm.elsalameen@gmail.com'}</p>
                       <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest mt-0.5 italic">Free Phase User</p>
                    </div>
                 </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
