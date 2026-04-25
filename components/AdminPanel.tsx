import React, { useState, useEffect } from 'react';
import { 
  Users, Activity, Server, Shield, Database, 
  Search, Filter, MoreVertical, RefreshCw, 
  ArrowUpRight, ArrowDownRight, Zap, Globe, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Appointment, Client, User } from '../types';

interface AdminPanelProps {
  users: any[];
  appointments: Appointment[];
  clients: Client[];
}

const AdminPanel: React.FC<AdminPanelProps> = ({ users, appointments, clients }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'system'>('overview');
  const [isLoading, setIsLoading] = useState(false);

  // Mock server stats
  const stats = {
    cpu: 18,
    memory: 42,
    latency: 24,
    uptime: '14d 6h 22m',
    storage: 12.4
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="flex-1 bg-[#fcfcfc] overflow-y-auto custom-scroll">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <Shield className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Control</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Node v20.11.0 • Global Cloud Network
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            className={`w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all ${isLoading ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={18} />
          </button>
          <div className="h-6 w-px bg-slate-100 mx-2" />
          <nav className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
            {(['overview', 'users', 'system'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-tight transition-all ${
                  activeTab === tab 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="p-8">
        {activeTab === 'overview' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Volume', value: `$${(appointments.reduce((acc, curr) => acc + (curr.price || 0), 0)).toLocaleString()}`, icon: Globe, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Active Sessions', value: appointments.length, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Database Nodes', value: '4 Cluster', icon: Database, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Server Memory', value: `${stats.memory}%`, icon: Zap, color: 'text-rose-600', bg: 'bg-rose-50' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                  <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <stat.icon className={stat.color} size={24} />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* System Health */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Resource Utilization (Real-time)</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">Auto-scaling: Enabled</span>
                    <div className="w-8 h-4 bg-indigo-100 rounded-full relative">
                      <div className="absolute right-1 top-1 bottom-1 w-2 h-2 bg-indigo-600 rounded-full" />
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                   {[
                     { label: 'Internal Processing (CPU)', value: stats.cpu, color: 'bg-indigo-600' },
                     { label: 'Cache Storage (RAM)', value: stats.memory, color: 'bg-emerald-500' },
                     { label: 'Network Bandwidth', value: 64, color: 'bg-amber-500' }
                   ].map(bar => (
                     <div key={bar.label}>
                       <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                         <span className="text-slate-500">{bar.label}</span>
                         <span className="text-slate-900">{bar.value}%</span>
                       </div>
                       <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${bar.value}%` }}
                           transition={{ duration: 1, ease: "easeOut" }}
                           className={`h-full ${bar.color}`} 
                         />
                       </div>
                     </div>
                   ))}
                </div>
              </div>

              <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
                <div className="relative z-10">
                  <h3 className="font-black uppercase tracking-widest text-xs mb-6 text-indigo-300">Network Latency (ms)</h3>
                  <div className="flex items-baseline gap-2 mb-8">
                    <span className="text-5xl font-black">{stats.latency}</span>
                    <span className="text-indigo-300 font-bold uppercase tracking-tighter">avg ms</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                      <span className="text-xs font-bold text-indigo-200">Core Uptime</span>
                      <span className="text-xs font-black">{stats.uptime}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                      <span className="text-xs font-bold text-indigo-200">Encryption</span>
                      <span className="text-xs font-black text-emerald-400">AES-256 GCM</span>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600 rounded-full blur-[80px] opacity-20 translate-x-10 -translate-y-10" />
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
               <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search systems by node or ID..." 
                    className="pl-11 pr-6 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:border-indigo-600 outline-none w-80"
                  />
               </div>
               <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest">
                 <Filter size={14} /> Filter Logs
               </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Account Node</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Role</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Engagement</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Security</th>
                    <th className="px-8 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(users.length > 0 ? users : clients).map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-600 uppercase">
                             {(item.name || item.email || 'U').charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">ID-{item.id.substring(0, 8)}</p>
                            <p className="text-xs text-slate-500 font-bold tracking-tight">{item.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${item.role === 'admin' ? 'bg-brand-blue/10 text-brand-blue' : 'bg-slate-100 text-slate-600'}`}>
                          {item.role === 'admin' ? 'Master Admin' : 'Standard Node'}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                           {item.phone || item.subscriptionPlan === 'premium' ? <Globe size={14} className="text-emerald-500" /> : <Lock size={14} className="text-slate-300" />}
                           <p className="text-xs font-bold text-slate-700">{item.name || 'Anonymous'}</p>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-1.5">
                           <span className={`w-2 h-2 rounded-full ${item.lastSeenAt ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                           <span className="text-[10px] font-black text-slate-900 uppercase">
                             {item.lastSeenAt ? 'Online' : 'Offline'}
                           </span>
                         </div>
                      </td>
                      <td className="px-8 py-5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                         <button className="p-2 text-slate-400 hover:text-indigo-600"><MoreVertical size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'system' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in zoom-in-95">
             <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-6">Execution Runtime Logs</h3>
                <div className="space-y-4 font-mono text-[10px]">
                   {[
                     { time: '14:02:22', msg: 'Core process initialized on cluster-01', type: 'info' },
                     { time: '14:02:25', msg: 'Auth handshake success: secure_token_v4', type: 'success' },
                     { time: '14:02:44', msg: 'GC cycle complete: reclaimed 244MB', type: 'info' },
                     { time: '14:03:01', msg: 'Warning: Latency spike detected on eu-west-1', type: 'warning' },
                     { time: '14:03:10', msg: 'Re-routing traffic to secondary gateway', type: 'info' }
                   ].map((log, i) => (
                     <div key={i} className="flex gap-3 items-start border-b border-slate-50 pb-3">
                        <span className="text-slate-400 shrink-0">{log.time}</span>
                        <span className={
                          log.type === 'success' ? 'text-emerald-600' :
                          log.type === 'warning' ? 'text-amber-600' : 'text-slate-600'
                        }>{log.msg}</span>
                     </div>
                   ))}
                </div>
             </div>

             <div className="bg-slate-950 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                   <h3 className="text-indigo-400 font-black tracking-widest uppercase text-xs mb-8 flex items-center gap-2">
                     <Server size={14} /> Node Health Infrastructure
                   </h3>
                   <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'Cluster-01', status: 'Healthy', color: 'bg-emerald-500' },
                        { label: 'Cluster-02', status: 'Optimal', color: 'bg-indigo-500' },
                        { label: 'Web-Gateway', status: 'Load 12%', color: 'bg-emerald-500' },
                        { label: 'Auth-Node', status: 'Encrypted', color: 'bg-white' }
                      ].map(node => (
                        <div key={node.label} className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                          <p className="text-white font-black text-sm mb-1">{node.label}</p>
                          <div className="flex items-center gap-2">
                             <span className={`w-1.5 h-1.5 rounded-full ${node.color}`} />
                             <span className="text-[10px] text-white/50 font-bold uppercase">{node.status}</span>
                          </div>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-[60px]" />
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
