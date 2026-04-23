import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, CreditCard, Activity, ShieldCheck, Database, Globe, Calendar,
  ArrowUpRight, ArrowDownRight, Search, Filter, MoreHorizontal,
  Server, Cpu, HardDrive, Terminal, Zap, LayoutGrid, List,
  Settings, Bell, AlertTriangle, RefreshCw, CheckCircle2,
  Lock, ExternalLink, Trash2, Edit3, Pause, Play, Download,
  Cloud, Cpu as Processor, Fingerprint, ShieldAlert, Radio,
  Command, Box, Layers, MousePointer2, ChevronRight, BarChart3,
  Network, Share2, Shield, Settings2, Power, Terminal as TerminalIcon,
  LogOut, UserPlus, MapPin
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, LineChart, Line, PieChart, Pie
} from 'recharts';

import { paymentService, MerchantStats } from '../services/paymentService';
import { api } from '../services/api';
import { BusinessStats } from '../types';

type AdminTab = 'overview' | 'users' | 'nodes' | 'intelligence' | 'infrastructure';

interface CommandLog {
  id: string;
  time: string;
  source: string;
  event: string;
  level: 'info' | 'success' | 'warning' | 'error';
}

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isLive, setIsLive] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [merchantState, setMerchantState] = React.useState<MerchantStats | null>(null);
  const [systemStats, setSystemStats] = useState<BusinessStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [logs, setLogs] = useState<CommandLog[]>([
    { id: '1', time: '02:41:02', source: 'AUTH', event: 'Global login spike detected (Europe)', level: 'info' },
    { id: '2', time: '02:40:48', source: 'PAY', event: 'Merchant "DentalPlus" connected meshulam', level: 'success' },
    { id: '3', time: '02:39:12', source: 'SYS', event: 'V8 Garbage collection: 142ms', level: 'info' },
    { id: '4', time: '02:38:55', source: 'DB', event: 'Read-replica lag: +4ms', level: 'warning' },
    { id: '5', time: '02:37:01', source: 'SEC', event: 'CSRF attempt blocked (92.164.x.x)', level: 'error' },
  ]);

  useEffect(() => {
    paymentService.getMerchantStats().then(setMerchantState);
    
    const fetchStats = async () => {
      try {
        const stats = await api.system.getStats();
        setSystemStats(stats);
      } catch (err) {
        console.error('Failed to fetch system stats:', err);
      } finally {
        setIsLoadingStats(false);
      }
    };
    fetchStats();

    // Refresh stats every minute
    const statsInterval = setInterval(fetchStats, 60000);
    
    // Simulate live log stream
    const interval = setInterval(() => {
      if (isLive) {
        const sources = ['AUTH', 'DB', 'APP', 'PAY', 'SEC', 'GEMINI'];
        const events = [
          'Token refreshed for node_84',
          'Search index re-sharded',
          'New booking: Medical Center IL',
          'Vector DB query latency: 12ms',
          'Worker node A-4 recovered',
          'Gemini 1.5 prompt cached'
        ];
        const newLog: CommandLog = {
          id: Math.random().toString(36).substr(2, 9),
          time: new Date().toLocaleTimeString('en-GB'),
          source: sources[Math.floor(Math.random() * sources.length)],
          event: events[Math.floor(Math.random() * events.length)],
          level: Math.random() > 0.9 ? 'warning' : 'info'
        };
        setLogs(prev => [newLog, ...prev.slice(0, 7)]);
      }
    }, 4000);
    return () => {
      clearInterval(interval);
      clearInterval(statsInterval);
    };
  }, [isLive]);

  // Performance Data
  const perfData = useMemo(() => [
    { time: '00:00', cpu: 12, mem: 45, req: 120 },
    { time: '04:00', cpu: 8, mem: 42, req: 80 },
    { time: '08:00', cpu: 34, mem: 58, req: 450 },
    { time: '12:00', cpu: 45, mem: 65, req: 980 },
    { time: '16:00', cpu: 32, mem: 60, req: 720 },
    { time: '20:00', cpu: 18, mem: 52, req: 340 },
    { time: '23:59', cpu: 14, mem: 48, req: 210 },
  ], []);

  const kpis = useMemo(() => [
    { label: 'Total Registrations', value: systemStats?.totalSignups?.toLocaleString() || '1,280', icon: UserPlus, color: 'text-indigo-400' },
    { label: 'Authenticated Load', value: systemStats?.totalLogins?.toLocaleString() || '15.4K', icon: LogOut, color: 'text-emerald-400' },
    { label: 'Concurrent Sessions', value: systemStats?.currentlyOnline?.toLocaleString() || '14', icon: Activity, color: 'text-amber-400' },
    { label: 'Node Health', value: '99.99%', icon: ShieldCheck, color: 'text-brand-blue' },
  ], [systemStats]);

  const recentUsers = [
    { id: '1', name: 'Dr. Sarah Smith', email: 'sarah@dental.com', business: 'Elite Dental Care', plan: 'Enterprise', status: 'Active', joined: '2 hours ago', storage: '1.2GB' },
    { id: '2', name: 'John Miller', email: 'john@training.com', business: 'Miller Personal Training', plan: 'Pro', status: 'Active', joined: '5 hours ago', storage: '400MB' },
    { id: '3', name: 'Aria Chen', email: 'aria@yoga.com', business: 'Zen Yoga Studio', plan: 'Enterprise', status: 'Active', joined: '1 day ago', storage: '800MB' },
    { id: '4', name: 'Marcus Brown', email: 'marcus@legal.com', business: 'Brown & Co Legal', plan: 'Starter', status: 'Pending', joined: '2 days ago', storage: '120MB' },
    { id: '5', name: 'Sofia Rodriguez', email: 'sofia@photo.com', business: 'Luz Photography', plan: 'Pro', status: 'Active', joined: '3 days ago', storage: '2.5GB' },
  ];

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[#0A0A0B] border border-white/10 p-6 rounded-[2.5rem] relative overflow-hidden group hover:border-brand-blue/50 transition-all duration-500"
          >
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${kpi.color}`}>
              <kpi.icon size={48} />
            </div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">{kpi.label}</p>
            <div className="flex items-end gap-3">
              <h3 className={`text-4xl font-black text-white tracking-tighter ${isLoadingStats ? 'animate-pulse opacity-50' : ''}`}>
                {kpi.value}
              </h3>
            </div>
            <div className="mt-6 flex gap-1 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
               <div className={`h-full bg-brand-blue rounded-full ${isLoadingStats ? 'animate-shimmer' : ''}`} style={{ width: '70%' }} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deep Forensic Chart */}
        <div className="lg:col-span-2 bg-[#0A0A0B] border border-white/10 rounded-[3rem] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">Tactical Traffic Matrix</h3>
              <p className="text-xs font-bold text-white/30 uppercase tracking-widest mt-1">Cross-cluster resource optimization</p>
            </div>
            <div className="flex items-center gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
              {['CPU', 'MEM', 'REQ'].map(l => (
                <button key={l} className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${l === 'REQ' ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' : 'text-white/40 hover:text-white'}`}>{l}</button>
              ))}
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={perfData}>
                <defs>
                   <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0066FF" stopOpacity={0.4}/>
                    <stop offset="100%" stopColor="#0066FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: 'rgba(255,255,255,0.3)' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: 'rgba(255,255,255,0.3)' }}
                />
                <Tooltip 
                  contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '16px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 900, color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="req" 
                  stroke="#0066FF" 
                  strokeWidth={4} 
                  fill="url(#glow)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Node Map */}
        <div className="bg-[#0A0A0B] border border-white/10 rounded-[3rem] p-8 flex flex-col relative group overflow-hidden">
           <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-blue/10 rounded-full blur-[100px]" />
           <div className="flex items-center justify-between mb-8 relative z-10">
              <h4 className="text-xl font-black text-white">Geographical Nodes</h4>
              <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-emerald-400"><Globe size={18} /></div>
           </div>
           
           <div className="flex-1 space-y-6 relative z-10">
              {systemStats?.topRegions.map((loc, i) => (
                <div key={i} className="p-5 bg-white/5 border border-white/5 rounded-[2rem] hover:bg-white/10 transition-all">
                   <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-brand-blue/10 rounded-xl flex items-center justify-center text-[10px] font-black">{loc.code}</div>
                         <span className="text-xs font-black text-white">{loc.country}</span>
                      </div>
                      <span className={`text-[10px] font-bold text-emerald-400`}>{loc.users} Active</span>
                   </div>
                   <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((loc.users / systemStats.totalSignups) * 100 * 5, 100)}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className={`h-full bg-brand-blue rounded-full`} 
                      />
                   </div>
                </div>
              ))}
              
              {!systemStats && [1,2,3,4].map((_, i) => (
                <div key={i} className="p-5 bg-white/5 border border-white/5 rounded-[2rem] animate-pulse">
                   <div className="h-4 bg-white/5 rounded w-1/2 mb-4" />
                   <div className="h-1.5 bg-white/5 rounded-full w-full" />
                </div>
              ))}
           </div>

           <div className="mt-8 relative z-10">
              <button className="w-full py-5 bg-white text-brand-dark rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-brand-blue hover:text-white transition-all shadow-xl">
                 Initialize Global Mesh
              </button>
           </div>
        </div>
      </div>
    </div>
  );

  const renderNodes = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in zoom-in-95 duration-500">
       <div className="md:col-span-3">
          <div className="bg-[#0A0A0B] border border-white/10 rounded-[3rem] p-10">
             <div className="flex items-center justify-between mb-10">
                <div>
                   <h3 className="text-2xl font-black text-white">Sub-system Matrix</h3>
                   <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Active node distribution and health telemetry</p>
                </div>
                <button className="p-3 bg-white/5 rounded-2xl text-white/60 hover:text-white transition-all"><RefreshCw size={20} /></button>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: 'Core Engine', status: 'Healthy', load: '14%', icon: Cpu, mem: '1.2GB' },
                  { name: 'Vector Store', status: 'Healthy', load: '42%', icon: Database, mem: '4.8GB' },
                  { name: 'Payment Relay', status: 'Warning', load: '89%', icon: CreditCard, mem: '920MB' },
                  { name: 'AI Controller', status: 'Healthy', load: '22%', icon: Radio, mem: '12GB' },
                  { name: 'Image CDN', status: 'Healthy', load: '4%', icon: Layers, mem: '200MB' },
                  { name: 'Web Traffic', status: 'Healthy', load: '31%', icon: Globe, mem: '2.1GB' },
                ].map((node, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    className="p-6 bg-white/5 border border-white/5 rounded-[2rem] relative group"
                  >
                     <div className={`absolute top-6 right-6 w-2 h-2 rounded-full ${node.status === 'Healthy' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'}`} />
                     <div className="w-12 h-12 bg-brand-blue/10 text-brand-blue rounded-2xl flex items-center justify-center mb-6"><node.icon size={24} /></div>
                     <h4 className="font-black text-white mb-1">{node.name}</h4>
                     <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-6">{node.status} • {node.mem}</p>
                     
                     <div className="space-y-2">
                        <div className="flex justify-between text-[8px] font-black text-white/40 uppercase tracking-widest">
                           <span>Node Load</span>
                           <span>{node.load}</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                           <div className="h-full bg-brand-blue" style={{ width: node.load }} />
                        </div>
                     </div>
                  </motion.div>
                ))}
             </div>
          </div>
       </div>

       {/* Realtime Stream */}
       <div className="bg-[#0A0A0B] border border-white/10 rounded-[3rem] p-8 flex flex-col h-full ring-1 ring-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,107,255,0.05)_0%,transparent_70%)]" />
          <div className="flex items-center justify-between mb-8 relative z-10">
             <h4 className="text-lg font-black text-white flex items-center gap-2">
                <TerminalIcon size={18} className="text-brand-blue" /> Terminal
             </h4>
             <button onClick={() => setIsLive(!isLive)} className={`px-3 py-1 rounded-full text-[8px] font-black transition-all ${isLive ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/40'}`}>
                {isLive ? 'LIVE' : 'PAUSED'}
             </button>
          </div>

          <div className="flex-1 space-y-4 font-mono text-[9px] overflow-hidden relative z-10">
             <AnimatePresence>
               {logs.map((log) => (
                 <motion.div 
                   key={log.id} 
                   initial={{ opacity: 0, x: -10 }} 
                   animate={{ opacity: 1, x: 0 }} 
                   className="flex gap-3 leading-relaxed"
                 >
                    <span className="text-white/20 whitespace-nowrap">{log.time}</span>
                    <span className={`font-black ${log.level === 'error' ? 'text-rose-400' : log.level === 'warning' ? 'text-amber-400' : log.level === 'success' ? 'text-emerald-400' : 'text-brand-blue'}`}>
                       {log.source}:
                    </span>
                    <span className="text-white/60 truncate">{log.event}</span>
                 </motion.div>
               ))}
             </AnimatePresence>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
             <div className="flex items-center justify-between group cursor-pointer text-white/40 hover:text-white transition-colors">
                <span className="text-[10px] font-black uppercase tracking-widest font-mono">View all logs</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-all" />
             </div>
          </div>
       </div>
    </div>
  );

  const renderUsers = () => (
    <div className="bg-[#0A0A0B] border border-white/10 rounded-[3rem] overflow-hidden animate-in fade-in duration-500">
      <div className="p-10 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h3 className="text-2xl font-black text-white leading-none">Global Matrix</h3>
           <p className="text-xs font-bold text-white/30 uppercase tracking-widest mt-2">Manage 1,284 nodes across the cluster</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input 
                placeholder="Search nodes..."
                className="bg-white/5 border border-white/10 pl-12 pr-6 py-4 rounded-2xl text-xs font-bold text-white outline-none focus:ring-1 ring-brand-blue/30 w-72 transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
           </div>
           <button className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white/60 hover:text-white hover:border-white/20 transition-all">
              <Download size={20} />
           </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
             <tr className="bg-white/5">
                <th className="px-10 py-6 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Business Identity</th>
                <th className="px-10 py-6 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Service Plan</th>
                <th className="px-10 py-6 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Telemetry</th>
                <th className="px-10 py-6 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Status</th>
                <th className="px-10 py-6 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-right">Operation</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
             {recentUsers.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.business.toLowerCase().includes(searchQuery.toLowerCase())).map((user, i) => (
                <tr key={user.id} className="hover:bg-white/5 transition-all group">
                   <td className="px-10 py-8">
                      <div className="flex items-center gap-4">
                         <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center font-black text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-all shadow-xl">
                           {user.name[0]}
                         </div>
                         <div>
                            <p className="text-base font-black text-white leading-tight">{user.name}</p>
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">{user.business}</p>
                         </div>
                      </div>
                   </td>
                   <td className="px-10 py-8">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${user.plan === 'Enterprise' ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/30' : 'bg-white/5 text-white/60 border-white/10'}`}>
                         {user.plan}
                      </span>
                   </td>
                   <td className="px-10 py-8 text-white/60 font-mono text-xs">
                      {user.storage} • {user.joined}
                   </td>
                   <td className="px-10 py-8">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full w-fit ${user.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                         <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
                         <span className="text-[10px] font-black uppercase tracking-widest">{user.status}</span>
                      </div>
                   </td>
                   <td className="px-10 py-8 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                         <button className="p-3 bg-white/5 text-white/40 hover:text-white hover:bg-brand-blue rounded-2xl transition-all shadow-xl"><Edit3 size={16} /></button>
                         <button className="p-3 bg-white/5 text-white/40 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all shadow-xl"><Trash2 size={16} /></button>
                         <button className="p-3 bg-white/5 text-white/40 hover:text-white rounded-2xl transition-all shadow-xl"><MoreHorizontal size={16} /></button>
                      </div>
                   </td>
                </tr>
             ))}
          </tbody>
        </table>
      </div>
      <div className="p-10 border-t border-white/5 flex items-center justify-between bg-white/5">
         <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] font-mono">Stream: 1,284 Nodes Active • Matrix Latency: 4ms</p>
         <div className="flex gap-4">
            <button className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white/60 hover:text-white transition-all">Matrix Back</button>
            <button className="px-8 py-3 bg-white text-brand-dark rounded-2xl text-[10px] font-black transition-all hover:bg-brand-blue hover:text-white">Initialize Next</button>
         </div>
      </div>
    </div>
  );

  const renderInfrastructure = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-8 duration-700">
       <div className="bg-[#0A0A0B] border border-white/10 rounded-[3rem] p-12 space-y-12">
          <div>
             <h3 className="text-3xl font-black text-white mb-2">Global Parameters</h3>
             <p className="text-xs font-bold text-white/30 uppercase tracking-widest font-mono">Platform orchestration layer v4.2.0</p>
          </div>
          
          <div className="space-y-10">
             {[
               { icon: Network, title: 'Node Registration', desc: 'Allow new cluster instances to join the matrix' },
               { icon: Shield, title: 'Deep Protocol (WAF)', desc: 'Advanced layer 7 threat detection and mitigation' },
               { icon: Share2, title: 'Sync-Engine', status: 'Healthy', desc: 'Real-time state synchronization across all regions' },
             ].map((item, i) => (
               <div key={i} className="flex items-center justify-between p-8 bg-white/5 border border-white/5 rounded-[2.5rem] hover:border-brand-blue/30 transition-all transition-duration-500 group">
                  <div className="flex items-center gap-6">
                     <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-white/40 group-hover:text-brand-blue transition-colors">
                        <item.icon size={24} />
                     </div>
                     <div>
                        <p className="text-base font-black text-white mb-1">{item.title}</p>
                        <p className="text-xs font-medium text-white/30">{item.desc}</p>
                     </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" className="sr-only peer" defaultChecked={i !== 1} />
                     <div className="w-16 h-8 bg-white/5 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white/20 after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-blue peer-checked:after:bg-white" />
                  </label>
               </div>
             ))}
          </div>
       </div>

       <div className="bg-[#0A0A0B] border border-white/10 rounded-[3rem] p-12 flex flex-col justify-between">
           <div className="space-y-10">
              <div>
                 <h3 className="text-3xl font-black text-white mb-2">Platform Core</h3>
                 <p className="text-xs font-bold text-white/30 uppercase tracking-widest font-mono">Deployment and kernel settings</p>
              </div>

              <div className="p-10 bg-brand-blue/10 border border-brand-blue/30 rounded-[3rem] space-y-6">
                 <div className="flex items-center gap-4 text-brand-blue">
                    <Processor className="animate-spin-slow" size={32} />
                    <div>
                       <p className="font-black text-lg">Cluster Optimization</p>
                       <p className="text-xs font-bold opacity-70">Auto-scaling group: ENABLED</p>
                    </div>
                 </div>
                 <div className="h-1 w-full bg-brand-blue/20 rounded-full">
                    <motion.div animate={{ width: ['0%', '100%'] }} transition={{ duration: 10, repeat: Infinity }} className="h-full bg-brand-blue" />
                 </div>
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Kernel Version Pin</label>
                 <select className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-8 py-5 text-sm font-black text-white outline-none focus:ring-1 ring-brand-blue/50 appearance-none transition-all">
                    <option>v4.2.0 (Stable - Master)</option>
                    <option>v4.1.9 (Legacy Support)</option>
                    <option>v4.3.0-dev (Canary)</option>
                 </select>
              </div>
           </div>

           <div className="pt-12 flex items-center justify-between">
              <button className="text-[10px] font-black text-white/20 uppercase tracking-widest hover:text-white transition-all underline decoration-white/10">Factory Master Reset</button>
              <button className="px-12 py-5 bg-white text-brand-dark rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-brand-blue hover:text-white transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)]">Sync Parameters</button>
           </div>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#000] text-white selection:bg-brand-blue selection:text-white font-sans antialiased">
      <div className="max-w-[1440px] mx-auto px-8 py-16 space-y-16">
        {/* Superior Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 relative">
          <div className="absolute top-0 left-0 w-[500px] h-[300px] bg-brand-blue/10 blur-[150px] -z-10" />
          <div className="space-y-6">
             <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-brand-blue rounded-[2rem] flex items-center justify-center shadow-[0_0_80px_-10px_rgba(0,107,255,0.6)] rotate-6 group hover:rotate-0 transition-all duration-700 cursor-pointer">
                   <Command size={40} className="text-white" />
                </div>
                <div>
                   <div className="flex items-center gap-3 text-[10px] font-black text-white/30 uppercase tracking-[0.6em] mb-2 font-mono">
                      <span>Platform Control</span>
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                      <span className="text-emerald-400">System Ready</span>
                   </div>
                   <h1 className="text-6xl font-black tracking-tighter leading-none">Command Center<span className="text-white/10 italic ml-4 font-mono">v4.2</span></h1>
                </div>
             </div>
          </div>

          <div className="flex items-center p-2 bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]">
             {(['overview', 'users', 'nodes', 'intelligence', 'infrastructure'] as AdminTab[]).map(tab => (
               <button
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={`px-10 py-4 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all relative overflow-hidden group ${activeTab === tab ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
               >
                 {activeTab === tab && (
                   <motion.div layoutId="premium-active-tab" className="absolute inset-0 bg-brand-blue rounded-[2.5rem] -z-10 shadow-[0_0_30px_rgba(0,107,255,0.4)]" />
                 )}
                 {tab}
               </button>
             ))}
          </div>
        </header>

        {/* Global Intel Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-center justify-between p-8 bg-white/[0.03] rounded-[3rem] border border-white/10 backdrop-blur-2xl group hover:border-brand-blue/30 transition-all duration-500 ring-1 ring-white/5"
        >
           <div className="flex items-center gap-8 mb-6 md:mb-0">
              <div className="flex -space-x-5">
                 {[1,2,3,4].map(i => (
                    <div key={i} className="w-12 h-12 bg-slate-900 border-4 border-[#000] rounded-[1.25rem] flex items-center justify-center overflow-hidden shadow-2xl">
                       <img src={`https://picsum.photos/seed/${i + 42}/48/48`} className="w-full h-full object-cover" />
                    </div>
                 ))}
                 <div className="w-12 h-12 bg-brand-blue ring-4 ring-[#000] rounded-[1.25rem] flex items-center justify-center font-black text-xs text-white z-10 shadow-2xl">+14</div>
              </div>
              <div>
                 <p className="text-lg font-black text-white">Advanced Intelligence Active</p>
                 <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest mt-1 animate-pulse">Scanning 1,284 nodes for economic anomalies...</p>
              </div>
           </div>
           <button className="w-full md:w-auto px-12 py-5 bg-white text-brand-dark rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-brand-blue hover:text-white transition-all shadow-2xl">Launch Matrix Audit</button>
        </motion.div>

        {/* Tab Content Orchestrator */}
        <div className="relative min-h-[600px]">
           <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div key="overview" layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.5 }}>
                   {renderOverview()}
                </motion.div>
              )}
              {activeTab === 'nodes' && (
                <motion.div key="nodes" layout initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.5 }}>
                   {renderNodes()}
                </motion.div>
              )}
              {activeTab === 'users' && (
                <motion.div key="users" layout initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.5 }}>
                   {renderUsers()}
                </motion.div>
              )}
              {activeTab === 'infrastructure' && (
                <motion.div key="infra" layout initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.5 }}>
                   {renderInfrastructure()}
                </motion.div>
              )}
              {activeTab === 'intelligence' && (
                <motion.div key="intel" layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="h-[600px] flex items-center justify-center">
                   <div className="text-center space-y-8 max-w-lg">
                      <div className="w-32 h-32 bg-brand-blue/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-brand-blue/30 relative">
                         <div className="absolute inset-0 bg-brand-blue blur-[60px] opacity-20" />
                         <Fingerprint size={64} className="text-brand-blue animate-pulse" />
                      </div>
                      <h3 className="text-3xl font-black text-white">Quantum Intelligence</h3>
                      <p className="text-sm font-medium text-white/30 leading-relaxed uppercase tracking-widest italic">Decoding global market patterns. System initialization in progress for node_isr_01.</p>
                      <button className="px-12 py-5 bg-white text-brand-dark rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-blue hover:text-white transition-all shadow-3xl">Request Decryption</button>
                   </div>
                </motion.div>
              )}
           </AnimatePresence>
        </div>

        {/* Dynamic Global Dashboard Footer */}
        <footer className="pt-24 pb-48 flex flex-col md:flex-row items-center justify-between gap-12 border-t border-white/5 relative">
           <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-brand-blue/5 blur-[120px] -z-10" />
           <div className="flex flex-wrap items-center justify-center md:justify-start gap-12">
              <div className="space-y-2">
                 <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Protocol</p>
                 <div className="flex items-center gap-3">
                    <ShieldAlert size={16} className="text-emerald-500" />
                    <span className="text-xs font-black font-mono text-white/60">KERNEL_SECURE_ENCLAVE_READY</span>
                 </div>
              </div>
              <div className="space-y-2">
                 <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Bandwidth</p>
                 <div className="flex items-center gap-3">
                    <Activity size={16} className="text-brand-blue" />
                    <span className="text-xs font-black font-mono text-white/60">GIGABIT_FIBER_MATRIX_STABLE</span>
                 </div>
              </div>
           </div>
           
           <div className="flex items-center gap-4 bg-white/5 p-4 rounded-[2rem] border border-white/10 group cursor-pointer hover:bg-brand-blue transition-all duration-500">
              <div className="w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center text-white group-hover:bg-white group-hover:text-brand-blue transition-all shadow-xl">
                 <Power size={18} />
              </div>
              <div className="pr-4">
                 <p className="text-[10px] font-black text-white/40 uppercase tracking-widest group-hover:text-white/60">System Runtime</p>
                 <p className="text-sm font-black font-mono text-white uppercase tabular-nums">142:04:12:08</p>
              </div>
           </div>
        </footer>
      </div>

      {/* Cyberpunk Overlay Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-[1000] opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_3px,4px_100%]" />
      
      {/* Subtle cursor tracker glow (Simulated) */}
      <div className="fixed inset-0 pointer-events-none z-[50] bg-[radial-gradient(circle_at_var(--x,_50%)_var(--y,_50%),rgba(0,107,255,0.03)_0%,transparent_10%)]" />
    </div>
  );
};

export default AdminPanel;
