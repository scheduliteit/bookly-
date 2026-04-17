
import React from 'react';
import { motion } from 'motion/react';
import { Users, CreditCard, Activity, ShieldCheck, Database, Globe, ArrowUpRight, ArrowDownRight, Search, Filter, MoreHorizontal } from 'lucide-react';

interface AdminPanelProps {
  // We'll mock some global platform data here
}

const AdminPanel: React.FC<AdminPanelProps> = () => {
  const platformStats = [
    { label: 'Total Businesses', value: '1,284', change: '+12%', icon: Users, color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
    { label: 'Monthly Revenue', value: '$42,500', change: '+8%', icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Bookings', value: '18,492', change: '+15%', icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Avg. Uptime', value: '99.99%', change: 'Stable', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const recentUsers = [
    { name: 'Dr. Sarah Smith', business: 'Elite Dental Care', plan: 'Premium', status: 'Active', joined: '2 hours ago' },
    { name: 'John Miller', business: 'Miller Personal Training', plan: 'Basic', status: 'Active', joined: '5 hours ago' },
    { name: 'Aria Chen', business: 'Zen Yoga Studio', plan: 'Premium', status: 'Active', joined: '1 day ago' },
    { name: 'Marcus Brown', business: 'Brown & Co Legal', plan: 'Basic', status: 'Pending', joined: '2 days ago' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-black text-brand-dark tracking-tight">Platform Management</h1>
           <p className="text-slate-500 font-medium">Control center for the EasyBookly SaaS ecosystem.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="px-5 py-2.5 bg-brand-dark text-white rounded-full font-bold text-sm hover:shadow-lg transition-all flex items-center gap-2">
             <Database size={16} /> System Logs
           </button>
           <button className="px-5 py-2.5 bg-brand-blue text-white rounded-full font-bold text-sm hover:shadow-lg transition-all flex items-center gap-2">
             <Filter size={16} /> Advanced Filters
           </button>
        </div>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {platformStats.map((s, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
          >
             <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center`}>
                   <s.icon size={24} />
                </div>
                {s.change !== 'Stable' && (
                  <div className={`flex items-center gap-1 text-[10px] font-black ${s.change.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {s.change.startsWith('+') ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {s.change}
                  </div>
                )}
             </div>
             <p className="text-3xl font-black text-brand-dark">{s.value}</p>
             <p className="text-xs font-bold text-slate-400 capitalize mt-1 tracking-widest uppercase">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                 <h3 className="text-lg font-black text-brand-dark">Recently Registered Businesses</h3>
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      placeholder="Search users..."
                      className="pl-10 pr-4 py-2 bg-slate-50 rounded-full text-xs font-bold text-brand-dark outline-none focus:ring-2 ring-brand-blue/20"
                    />
                 </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-slate-50/50">
                          <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Owner</th>
                          <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
                          <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                          <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {recentUsers.map((user, i) => (
                         <tr key={i} className="hover:bg-slate-50 transition-all group">
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-brand-blue/10 text-brand-blue rounded-xl flex items-center justify-center font-black">
                                    {user.name[0]}
                                  </div>
                                  <div>
                                     <p className="text-sm font-black text-brand-dark">{user.name}</p>
                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.business}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-6">
                               <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${user.plan === 'Premium' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                                  {user.plan}
                               </span>
                            </td>
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-2">
                                  <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                  <span className="text-xs font-bold text-slate-600">{user.status}</span>
                               </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                               <button className="p-2 text-slate-300 hover:text-brand-blue hover:bg-white rounded-lg transition-all">
                                  <MoreHorizontal size={18} />
                               </button>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              <div className="p-4 bg-slate-50/50 text-center">
                 <button className="text-[10px] font-black text-brand-blue uppercase tracking-widest hover:underline">View All 1,284 Users</button>
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-brand-dark rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                 <h4 className="text-xl font-black mb-4 tracking-tight">System Status</h4>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                       <span className="text-xs font-bold text-white/60 uppercase tracking-widest">API Server</span>
                       <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black">STABLE</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                       <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Database</span>
                       <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black">STABLE</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                       <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Auth Service</span>
                       <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black">STABLE</span>
                    </div>
                 </div>
                 <div className="mt-8 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full border-8 border-emerald-500/20 flex items-center justify-center relative">
                       <div className="absolute inset-0 rounded-full border-t-8 border-emerald-500 animate-spin" />
                       <div className="text-center">
                          <p className="text-2xl font-black">99.9</p>
                          <p className="text-[10px] font-bold text-white/60 uppercase">Uptime</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
              <h4 className="text-sm font-black text-brand-dark mb-6 flex items-center gap-2">
                <Globe size={16} className="text-brand-blue" /> Regional Distribution
              </h4>
              <div className="space-y-5">
                 {[
                   { region: 'United Kingdom', growth: '42%', color: 'bg-brand-blue' },
                   { region: 'United States', growth: '31%', color: 'bg-indigo-500' },
                   { region: 'European Union', growth: '19%', color: 'bg-emerald-500' },
                   { region: 'Middle East', growth: '8%', color: 'bg-amber-500' },
                 ].map((r, i) => (
                   <div key={i} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                         <span className="text-slate-400">{r.region}</span>
                         <span className="text-brand-dark">{r.growth}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                         <div className={`h-full ${r.color}`} style={{ width: r.growth }} />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
