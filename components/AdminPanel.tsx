
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, CreditCard, Activity, ShieldCheck, Database, Globe, 
  ArrowUpRight, ArrowDownRight, Search, Filter, MoreHorizontal,
  Server, Cpu, HardDrive, Terminal, Zap, LayoutGrid, List,
  Settings, Bell, AlertTriangle, RefreshCw, CheckCircle2,
  Lock, ExternalLink, Trash2, Edit3, Pause, Play, Download
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

type AdminTab = 'overview' | 'users' | 'system' | 'settings';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Mock Data for Charts
  const revenueData = [
    { name: 'Mon', value: 3200 },
    { name: 'Tue', value: 4100 },
    { name: 'Wed', value: 3800 },
    { name: 'Thu', value: 5400 },
    { name: 'Fri', value: 4900 },
    { name: 'Sat', value: 6200 },
    { name: 'Sun', value: 5800 },
  ];

  const platformStats = [
    { label: 'Total Businesses', value: '1,284', change: '+12%', icon: Users, color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
    { label: 'Monthly Revenue', value: '$42,500', change: '+8%', icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Platform Load', value: '14.2%', change: '-2%', icon: Cpu, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'System Uptime', value: '99.99%', change: 'Stable', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const recentUsers = [
    { id: '1', name: 'Dr. Sarah Smith', email: 'sarah@dental.com', business: 'Elite Dental Care', plan: 'Premium', status: 'Active', joined: '2 hours ago', storage: '1.2GB' },
    { id: '2', name: 'John Miller', email: 'john@training.com', business: 'Miller Personal Training', plan: 'Basic', status: 'Active', joined: '5 hours ago', storage: '400MB' },
    { id: '3', name: 'Aria Chen', email: 'aria@yoga.com', business: 'Zen Yoga Studio', plan: 'Premium', status: 'Active', joined: '1 day ago', storage: '800MB' },
    { id: '4', name: 'Marcus Brown', email: 'marcus@legal.com', business: 'Brown & Co Legal', plan: 'Basic', status: 'Pending', joined: '2 days ago', storage: '120MB' },
    { id: '5', name: 'Sofia Rodriguez', email: 'sofia@photo.com', business: 'Luz Photography', plan: 'Premium', status: 'Active', joined: '3 days ago', storage: '2.5GB' },
  ];

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {platformStats.map((s, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
             <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Growth Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm">
           <div className="flex items-center justify-between mb-8">
              <div>
                 <h3 className="text-xl font-black text-brand-dark">Revenue Growth</h3>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Daily platform earnings across all accounts</p>
              </div>
              <div className="flex bg-slate-50 p-1 rounded-xl">
                 <button className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white shadow-sm text-brand-blue">Week</button>
                 <button className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400">Month</button>
              </div>
           </div>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0066FF" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#0066FF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 800, color: '#0F172A' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#0066FF" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                    />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Live System Activity */}
        <div className="bg-brand-dark rounded-[32px] p-8 text-white flex flex-col relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/10 blur-[100px] -z-0" />
           <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                 <h4 className="text-xl font-black tracking-tight">System Core</h4>
                 <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse delay-75" />
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse delay-150" />
                 </div>
              </div>
              
              <div className="space-y-6 flex-1">
                 {[
                   { label: 'API Latency', value: '42ms', icon: Zap },
                   { label: 'DB Connections', value: '1,492', icon: Database },
                   { label: 'Success Rate', value: '99.98%', icon: CheckCircle2 },
                   { label: 'Global Traffic', value: '8.4k req/s', icon: Globe },
                 ].map((item, i) => (
                   <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                         <div className="text-white/40"><item.icon size={18} /></div>
                         <span className="text-xs font-bold text-white/60 tracking-wider uppercase">{item.label}</span>
                      </div>
                      <span className="text-sm font-black text-emerald-400">{item.value}</span>
                   </div>
                 ))}
              </div>

              <div className="mt-8 pt-8 border-t border-white/10">
                 <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Master Switch</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isMaintenanceMode ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                       {isMaintenanceMode ? 'OFFLINE' : 'ONLINE'}
                    </span>
                 </div>
                 <button 
                  onClick={() => setIsMaintenanceMode(!isMaintenanceMode)}
                  className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${isMaintenanceMode ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' : 'bg-white text-brand-dark'}`}
                 >
                    {isMaintenanceMode ? 'Deactivate Maintenance' : 'Force Maintenance Mode'}
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h3 className="text-lg font-black text-brand-dark">Global User Matrix</h3>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Manage all business accounts across the ecosystem</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input 
                placeholder="Search by name, ID or business..."
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-xs font-bold text-brand-dark outline-none focus:ring-2 ring-brand-blue/20 w-64"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
           </div>
           <button className="p-2.5 bg-slate-50 text-slate-600 rounded-full hover:bg-slate-100 transition-all">
              <Download size={18} />
           </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
             <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Identity</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Plan</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Storage</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Operation</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
             {recentUsers.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.business.toLowerCase().includes(searchQuery.toLowerCase())).map((user, i) => (
               <tr key={user.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="px-8 py-6">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center font-black text-brand-blue shadow-sm group-hover:bg-brand-blue group-hover:text-white transition-all">
                          {user.name[0]}
                        </div>
                        <div>
                           <p className="text-sm font-black text-brand-dark">{user.name}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.business}</p>
                           <p className="text-[9px] font-medium text-slate-400 italic mt-0.5">{user.email}</p>
                        </div>
                     </div>
                  </td>
                  <td className="px-8 py-6">
                     <div className="flex flex-col gap-1">
                        <span className={`w-fit text-[10px] font-black px-2.5 py-1 rounded-full ${user.plan === 'Premium' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                           {user.plan}
                        </span>
                        <p className="text-[9px] font-bold text-slate-400 uppercase ml-1">Joined {user.joined}</p>
                     </div>
                  </td>
                  <td className="px-8 py-6">
                     <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-200 overflow-hidden relative">
                           <div className="absolute inset-0 bg-brand-blue" style={{ width: '40%' }} />
                        </div>
                        <span className="text-xs font-bold text-slate-600">{user.storage}</span>
                     </div>
                  </td>
                  <td className="px-8 py-6">
                     <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full w-fit ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{user.status}</span>
                     </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                     <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 hover:text-brand-blue hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all">
                           <Edit3 size={16} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all">
                           <Trash2 size={16} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all">
                           <MoreHorizontal size={16} />
                        </button>
                     </div>
                  </td>
               </tr>
             ))}
          </tbody>
        </table>
      </div>
      <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing {recentUsers.length} of 1,284 nodes</p>
         <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-brand-dark hover:bg-slate-50 transition-all">Previous</button>
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-brand-dark hover:bg-slate-50 transition-all">Next</button>
         </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 max-w-7xl mx-auto pb-32 pt-4">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-10 border-b border-slate-100">
        <div className="space-y-4">
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-dark text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-dark/20">
                 <Terminal size={24} />
              </div>
              <div>
                 <nav className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    <span>Platform</span>
                    <span className="text-slate-200">/</span>
                    <span className="text-brand-blue">Control Center</span>
                 </nav>
                 <h1 className="text-4xl font-black text-brand-dark tracking-tighter leading-none">Command Center v4.2</h1>
              </div>
           </div>
        </div>
        
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-[20px] shadow-inner">
           {(['overview', 'users', 'system', 'settings'] as AdminTab[]).map(tab => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white shadow-xl text-brand-blue scale-105' : 'text-slate-400 hover:text-slate-900'}`}
             >
               {tab}
             </button>
           ))}
        </div>
      </header>

      <AnimatePresence mode="wait">
         {activeTab === 'overview' && (
           <motion.div key="overview" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             {renderOverview()}
           </motion.div>
         )}
         {activeTab === 'users' && (
           <motion.div key="users" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             {renderUsers()}
           </motion.div>
         )}
         {activeTab === 'system' && (
            <motion.div 
              key="system" 
              layout 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
               <div className="md:col-span-2 space-y-8">
                  <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm h-full">
                     <h3 className="text-lg font-black text-brand-dark mb-8 flex items-center gap-2">
                        <Server size={20} className="text-brand-blue" /> Infrastructure Nodes
                     </h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { name: 'Primary Database', status: 'Healthy', load: '12%', uptime: '142d', type: 'PostgreSQL' },
                          { name: 'Authentication Layer', status: 'Healthy', load: '4%', uptime: '89d', type: 'OAuth 2.0' },
                          { name: 'Compute Node A-1', status: 'Healthy', load: '28%', uptime: '12d', type: 'V8 Engine' },
                          { name: 'Edge CDN', status: 'Healthy', load: '1%', uptime: '312d', type: 'Global Unicast' },
                          { name: 'Gemini AI Pipeline', status: 'High Traffic', load: '72%', uptime: '4h', type: 'Flash 1.5' },
                          { name: 'Redis Cache', status: 'Healthy', load: '5%', uptime: '42d', type: 'Volatile-LRU' },
                        ].map((node, i) => (
                          <div key={i} className="p-5 border border-slate-100 rounded-2xl bg-slate-50/30 group hover:border-brand-blue transition-all">
                             <div className="flex items-center justify-between mb-3">
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${node.status === 'Healthy' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                                   {node.status.toUpperCase()}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">{node.type}</span>
                             </div>
                             <p className="text-sm font-black text-brand-dark group-hover:text-brand-blue transition-colors">{node.name}</p>
                             <div className="flex items-center gap-6 mt-4">
                                <div>
                                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Load</p>
                                   <p className="text-xs font-black text-brand-dark">{node.load}</p>
                                </div>
                                <div className="w-1 h-6 bg-slate-100 rounded-full" />
                                <div>
                                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Uptime</p>
                                   <p className="text-xs font-black text-brand-dark">{node.uptime}</p>
                                </div>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
               <div className="space-y-8">
                  <div className="bg-brand-blue rounded-[32px] p-8 text-white">
                     <h4 className="text-lg font-black mb-6">Real-time Logs</h4>
                     <div className="space-y-4 font-mono">
                        {[
                          { time: '03:41:02', msg: 'New Premium Org: "Elite Dental"', type: 'success' },
                          { time: '03:40:48', msg: 'Gemini API Hook: Prompt Optimized', type: 'info' },
                          { time: '03:39:12', msg: 'DB Vacuuming completed: 21ms', type: 'info' },
                          { time: '03:38:55', msg: 'Load balancer skip node A-3', type: 'warning' },
                          { time: '03:37:01', msg: 'Deployment Success v4.2.0', type: 'success' },
                        ].map((log, i) => (
                          <div key={i} className="flex gap-3 text-[10px] leading-relaxed">
                             <span className="text-white/40">[{log.time}]</span>
                             <span className={`flex-1 ${log.type === 'warning' ? 'text-amber-300' : log.type === 'success' ? 'text-emerald-300' : 'text-white'}`}>{log.msg}</span>
                          </div>
                        ))}
                     </div>
                     <button className="w-full mt-8 py-3 rounded-xl bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">
                        Stream Full Logs
                     </button>
                  </div>
               </div>
            </motion.div>
         )}
         {activeTab === 'settings' && (
           <motion.div key="settings" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-3xl">
              <div className="bg-white border border-slate-100 rounded-[32px] p-10 shadow-sm space-y-10">
                 <div>
                    <h3 className="text-2xl font-black text-brand-dark">Global Parameters</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Configure platform-wide variables and limits</p>
                 </div>
                 
                 <div className="space-y-8">
                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl group border-2 border-transparent hover:border-brand-blue/10 transition-all">
                       <div>
                          <p className="font-black text-brand-dark mb-1">New User Registration</p>
                          <p className="text-xs font-medium text-slate-500">Allow new clients to sign up for the platform</p>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-blue" />
                       </label>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl group border-2 border-transparent hover:border-brand-blue/10 transition-all">
                       <div>
                          <p className="font-black text-brand-dark mb-1">AI Strategic Core (Gemini)</p>
                          <p className="text-xs font-medium text-slate-500">Enable artificial intelligence for business insights</p>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-blue" />
                       </label>
                    </div>

                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Platform Version Pin</label>
                       <div className="flex gap-4">
                          <select className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-black text-brand-dark outline-none focus:ring-2 ring-brand-blue/20">
                             <option>v4.2.0 (Stable - Active)</option>
                             <option>v4.1.9 (Legacy)</option>
                             <option>v4.3.0-alpha (Dev Branch)</option>
                          </select>
                          <button className="px-8 py-4 bg-brand-dark text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-xl transition-all">Deploy</button>
                       </div>
                    </div>
                 </div>

                 <div className="pt-10 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button className="px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-brand-dark transition-all">Reset to Defaults</button>
                    <button className="px-10 py-3 bg-brand-blue text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-blue/20 hover:scale-105 transition-all">Save Matrix Changes</button>
                 </div>
              </div>
           </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPanel;
