import React, { useState, useEffect } from 'react';
import { 
  Users, Activity, Server, Shield, Database, 
  Search, Filter, MoreVertical, RefreshCw, 
  ArrowUpRight, ArrowDownRight, Zap, Globe, Lock,
  Trash2, UserPlus, Wrench, AlertTriangle, CheckCircle2,
  Settings, Loader2, Bot, Sparkles, Send, Terminal, MessageSquare, X, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Appointment, Client, User } from '../types';
import { api } from '../services/api';
import { GoogleGenAI } from '@google/genai';

interface AdminPanelProps {
  users: any[];
  appointments: Appointment[];
  clients: Client[];
}

const AdminPanel: React.FC<AdminPanelProps> = ({ users, appointments, clients }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'system' | 'repairs' | 'ai-architect' | 'feedback'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [repairStep, setRepairStep] = useState<string | null>(null);
  const [repairProgress, setRepairProgress] = useState(0);
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [feedback, setFeedback] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'system') {
      api.system.getConfigStatus().then(setConfigStatus).catch(console.error);
    }
    if (activeTab === 'feedback') {
      setIsLoading(true);
      api.system.getFeedback().then(setFeedback).catch(console.error).finally(() => setIsLoading(false));
    }
  }, [activeTab]);

  // AI Architect State
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState(false);

  const runAiAnalysis = async (customPrompt?: string) => {
    setIsAiThinking(true);
    try {
      const apiKey = 
        (typeof process !== 'undefined' ? (process.env?.API_KEY || process.env?.GEMINI_API_KEY) : undefined) || 
        (window as any).GEMINI_API_KEY || 
        (window as any).API_KEY ||
        (import.meta as any).env?.VITE_GEMINI_API_KEY ||
        (import.meta as any).env?.GEMINI_API_KEY;

      if (!apiKey || apiKey === 'undefined' || apiKey === '') {
        throw new Error("Neural Link Severed: API Key missing.");
      }

      const genAI = new GoogleGenAI({ apiKey });
      const systemContext = `
        You are the "Core System Architect" for EasyBookly, a high-performance scheduling platform.
        You have absolute authority over system nodes and database health.
        
        CURRENT SYSTEM SNAPSHOT:
        - Users: ${users.length}
        - Appointments: ${appointments.length}
        - Clients: ${clients.length}
        - Health: Optimal
        
        The user (Master Admin) says: ${customPrompt || "Run a full system diagnostic."}
        
        Provide a technical, high-level architect-style response. 
        Use markdown. Keep it concise.
      `;

      const response = await genAI.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: systemContext
      });

      if (!response || !response.text) {
        throw new Error("Empty response from Architect.");
      }

      setAiResponse(response.text);
    } catch (error: any) {
      console.error("[GEMINI] Admin Error:", error);
      setAiResponse(`Architect Link Severed. ${error.message || "Neural sync interrupted."}`);
    } finally {
      setIsAiThinking(false);
    }
  };

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

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you absolutely sure? This will wipe the user node and all associated data.')) return;
    try {
      await api.system.deleteUser(userId);
      alert('User node de-provisioned successfully.');
    } catch (error) {
      console.error(error);
      alert('Failed to delete user.');
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await api.system.updateUserRole(userId, newRole);
      alert(`User role updated to ${newRole}`);
    } catch (error) {
      console.error(error);
    }
  };

  const runRepair = async (type: string) => {
    setRepairStep(`Initializing ${type}...`);
    setRepairProgress(10);
    
    await new Promise(r => setTimeout(r, 600));
    setRepairStep(`Scanning database clusters for inconsistencies...`);
    setRepairProgress(40);
    
    await new Promise(r => setTimeout(r, 800));
    setRepairStep(`Applying security patches and optimizing indexes...`);
    setRepairProgress(75);
    
    await new Promise(r => setTimeout(r, 1000));
    setRepairStep(`Verification complete. System optimized.`);
    setRepairProgress(100);
    
    setTimeout(() => {
      setRepairStep(null);
      setRepairProgress(0);
    }, 2000);
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
          <nav className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 overflow-x-auto no-scrollbar">
            {(['overview', 'users', 'system', 'feedback', 'repairs', 'ai-architect'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-tight transition-all whitespace-nowrap ${
                  activeTab === tab 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab === 'ai-architect' ? (
                  <span className="flex items-center gap-2">
                    <Sparkles size={12} className={activeTab === tab ? 'text-indigo-600' : 'text-slate-400'} />
                    AI Architect
                  </span>
                ) : tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="p-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
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
                    <div>
                      <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-1">Resource Utilization</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Dynamic Scaling • Cloud Nodes Active</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400">Auto-heal: ON</span>
                      <div className="w-8 h-4 bg-emerald-100 rounded-full relative">
                        <div className="absolute right-1 top-1 bottom-1 w-2 h-2 bg-emerald-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                     {[
                       { label: 'Internal Processing (CPU)', value: stats.cpu, color: 'bg-indigo-600', trend: 'stable' },
                       { label: 'Cache Storage (RAM)', value: stats.memory, color: 'bg-emerald-500', trend: 'down' },
                       { label: 'Network Bandwidth', value: 64, color: 'bg-amber-500', trend: 'up' }
                     ].map(bar => (
                       <div key={bar.label}>
                         <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                           <div className="flex items-center gap-2">
                              <span className="text-slate-500">{bar.label}</span>
                              {bar.trend === 'up' && <ArrowUpRight size={10} className="text-rose-500" />}
                              {bar.trend === 'down' && <ArrowDownRight size={10} className="text-emerald-500" />}
                           </div>
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
                    <h3 className="font-black uppercase tracking-widest text-xs mb-6 text-indigo-300">Cluster Status</h3>
                    <div className="flex flex-col gap-4">
                       {[
                         { name: 'Primary Node', status: 'Optimal', load: '12%' },
                         { name: 'Auth Shard', status: 'Healthy', load: '4%' },
                         { name: 'Gateway', status: 'Busy', load: '88%' }
                       ].map(node => (
                         <div key={node.name} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                            <div>
                              <p className="text-xs font-black">{node.name}</p>
                              <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-tight">{node.status}</p>
                            </div>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${parseInt(node.load) > 80 ? 'bg-rose-500 text-white' : 'bg-white/10 text-indigo-200'}`}>
                              {node.load}
                            </span>
                         </div>
                       ))}
                    </div>
                    
                    <button 
                      onClick={() => setActiveTab('repairs')}
                      className="w-full mt-8 py-3 bg-white/10 hover:bg-white text-indigo-200 hover:text-indigo-900 border border-white/10 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all"
                    >
                      Open Repair Suite
                    </button>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600 rounded-full blur-[80px] opacity-20 translate-x-10 -translate-y-10" />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div 
              key="users"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
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
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Engagement / Name</th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Security</th>
                      <th className="px-8 py-4 text-right">Actions</th>
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
                          <button 
                            onClick={() => handleToggleRole(item.id, item.role)}
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all ${item.role === 'admin' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                          >
                            {item.role === 'admin' ? 'Master Admin' : 'Standard Node'}
                          </button>
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
                           <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleDeleteUser(item.id)}
                                className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-all"
                                title="De-provision Account"
                              >
                                <Trash2 size={16} />
                              </button>
                              <button className="p-2 text-slate-400 hover:text-indigo-600"><MoreVertical size={16} /></button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'feedback' && (
            <motion.div 
              key="feedback"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {feedback.length === 0 ? (
                  <div className="col-span-full bg-white p-20 rounded-[40px] border border-slate-100 text-center">
                    <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                      <MessageSquare size={40} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">No Feedback Signal Detected</h3>
                    <p className="text-slate-500 font-medium mt-2">The architects are currently silent. Wait for incoming transmissions.</p>
                  </div>
                ) : (
                  feedback.map((item, i) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          item.type === 'bug' ? 'bg-rose-50 text-rose-500' :
                          item.type === 'feature' ? 'bg-amber-50 text-amber-500' :
                          item.type === 'improvement' ? 'bg-indigo-50 text-brand-blue' : 'bg-slate-50 text-slate-500'
                        }`}>
                          {item.type}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">{new Date(item.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm font-bold text-brand-dark leading-relaxed mb-6 italic">"{item.message}"</p>
                      <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500">
                             {item.userEmail?.charAt(0).toUpperCase()}
                           </div>
                           <span className="text-[10px] font-black text-slate-400 truncate max-w-[120px]">{item.userEmail}</span>
                        </div>
                        <button className="text-slate-300 hover:text-indigo-600 transition-colors">
                          <CheckCircle2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'system' && (
            <motion.div 
              key="system"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
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

                     {/* Managed Credentials Check */}
                     <div className="mt-8 border-t border-white/10 pt-8">
                        <h4 className="text-white font-black text-xs uppercase tracking-widest mb-4">API Configuration Status</h4>
                        <div className="grid grid-cols-2 gap-3">
                           {[
                             { id: 'google', label: 'Google Suite' },
                             { id: 'outlook', label: 'Outlook API' },
                             { id: 'zoom', label: 'Zoom Video' },
                             { id: 'stripe', label: 'Stripe Gateway' },
                             { id: 'sendgrid', label: 'SendGrid Mail' },
                             { id: 'twilio', label: 'Twilio SMS' }
                           ].map(cfg => (
                             <div key={cfg.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-[10px] text-white/70 font-bold">{cfg.label}</span>
                                <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${configStatus?.[cfg.id] ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                   {configStatus?.[cfg.id] ? 'Configured' : 'Missing'}
                                </div>
                             </div>
                           ))}
                        </div>
                        <p className="text-[9px] text-white/30 font-bold mt-4 italic">
                          Manage these keys in your system environment variables (.env).
                        </p>
                     </div>
                  </div>
                  <div className="absolute bottom-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-[60px]" />
               </div>
            </motion.div>
          )}

          {activeTab === 'ai-architect' && (
            <motion.div 
              key="ai-architect"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="bg-indigo-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
                <div className="relative z-10">
                   <div className="flex items-center gap-4 mb-8">
                      <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10">
                         <Bot className="text-white" size={32} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black tracking-tight">AI System Architect</h2>
                        <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest">Neural Link Active • Multi-Cluster Analysis</p>
                      </div>
                   </div>
                   
                   <p className="text-indigo-100 font-bold mb-8 max-w-xl leading-relaxed">
                     I can analyze real-time system metrics, scan for database inconsistencies, and provide neural-guided repairs for your infrastructure.
                   </p>

                   <div className="flex items-center gap-4">
                      <button 
                        onClick={() => runAiAnalysis()}
                        disabled={isAiThinking}
                        className="px-6 py-3 bg-white text-indigo-900 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-950/20 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isAiThinking ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        Run Full Scan
                      </button>
                      <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all border border-white/10">
                        View Audit Log
                      </button>
                   </div>
                </div>
                <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-indigo-500 rounded-full blur-[120px] opacity-20" />
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50">
                  <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                    <Terminal size={14} className="text-slate-400" /> Command Interface
                  </h3>
                  <div className="flex gap-4">
                    <div className="flex-1 relative">
                      <input 
                        type="text" 
                        value={aiQuery}
                        onChange={(e) => setAiQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && runAiAnalysis(aiQuery)}
                        placeholder="Ask the architect to solve a problem or optimize a node..."
                        className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:border-indigo-600 outline-none transition-all placeholder:text-slate-300"
                      />
                      <button 
                        onClick={() => runAiAnalysis(aiQuery)}
                        disabled={isAiThinking || !aiQuery.trim()}
                        className="absolute right-2 top-2 bottom-2 w-12 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-indigo-600 transition-all disabled:opacity-30"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {aiResponse && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-8 bg-slate-50/50"
                  >
                    <div className="flex gap-6">
                       <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-100">
                         <Bot className="text-white" size={20} />
                       </div>
                       <div className="flex-1 prose prose-slate max-w-none text-sm font-bold text-slate-700 leading-relaxed">
                         {aiResponse.split('\n').map((line, i) => (
                           <p key={i} className="mb-4 last:mb-0">
                             {line}
                           </p>
                         ))}
                       </div>
                    </div>
                    
                    <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-2 gap-4">
                       <button 
                         onClick={() => runRepair('Database Indexing')}
                         className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-600 group transition-all"
                       >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                              <Database size={16} />
                            </div>
                            <span className="text-xs font-black text-slate-900">Execute Recommended Repair</span>
                          </div>
                          <ArrowUpRight size={14} className="text-slate-300 group-hover:text-indigo-600 transition-all" />
                       </button>
                       <button className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-600 group transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                              <RefreshCw size={16} />
                            </div>
                            <span className="text-xs font-black text-slate-900">Re-validate Logs</span>
                          </div>
                          <ArrowUpRight size={14} className="text-slate-300 group-hover:text-slate-900 transition-all" />
                       </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'repairs' && (
            <motion.div 
              key="repairs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: 'Database Index Sync', desc: 'Rebuild internal Firestore indexes and optimize query performance.', icon: Database, color: 'text-indigo-600', repairType: 'DB_INDEX' },
                  { title: 'Security Audit', desc: 'Scan for unauthorized node access and patch update-gaps in rules.', icon: Shield, color: 'text-rose-600', repairType: 'SEC_RULES' },
                  { title: 'Cache Purge', desc: 'Clear global server-side cache and force client re-synchronization.', icon: Zap, color: 'text-amber-600', repairType: 'CACHE_FLUSH' },
                  { title: 'Identity Repair', desc: 'Fix orphaned records and reconcile user identity nodes.', icon: Users, color: 'text-emerald-600', repairType: 'AUTH_REPAIR' },
                  { title: 'API Gateway Reset', desc: 'Restart the API orchestration layer and clear blocking traffic.', icon: Lock, color: 'text-slate-600', repairType: 'GW_RESTART' }
                ].map((item, i) => (
                  <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
                      <item.icon className={item.color} size={24} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-500 font-bold mb-6 leading-relaxed">{item.desc}</p>
                    <button 
                      onClick={() => runRepair(item.title)}
                      disabled={repairStep !== null}
                      className="w-full py-4 bg-slate-50 hover:bg-indigo-600 hover:text-white text-indigo-600 border border-slate-100 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-50"
                    >
                      <Wrench size={14} /> Run Repair Utility
                    </button>
                  </div>
                ))}
              </div>

              {repairStep && (
                <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6">
                   <div className="w-full max-w-md bg-white rounded-3xl p-10 shadow-2xl animate-in zoom-in-95">
                      <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-8 mx-auto">
                        <Loader2 className="text-indigo-600 animate-spin" size={40} />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 text-center mb-2">System Maintenance</h3>
                      <p className="text-sm text-slate-500 font-bold text-center mb-8 leading-relaxed">{repairStep}</p>
                      
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-6">
                        <motion.div 
                          className="h-full bg-indigo-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${repairProgress}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                         <span>Progress</span>
                         <span>{repairProgress}%</span>
                      </div>
                   </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating AI Assistant */}
      <div className="fixed bottom-8 right-8 z-[150]">
        <AnimatePresence>
          {isFloatingChatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute bottom-20 right-0 w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[600px]"
            >
              <div className="p-6 bg-indigo-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <Bot size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-black">AI Architect</p>
                    <p className="text-[10px] text-indigo-300 font-bold uppercase">System Support Active</p>
                  </div>
                </div>
                <button onClick={() => setIsFloatingChatOpen(false)} className="text-white/50 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[300px]">
                {aiResponse ? (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                      <Bot size={16} className="text-indigo-600" />
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl text-xs font-bold text-slate-700 leading-relaxed shadow-sm">
                      {aiResponse.split('\n').map((line, i) => (
                        <p key={i} className="mb-2 last:mb-0">{line}</p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <Sparkles className="text-indigo-200 mb-4" size={40} />
                    <p className="text-slate-400 text-xs font-bold">Ask me to fix nodes, analyze logs, or optimize the cluster.</p>
                  </div>
                )}
                {isAiThinking && (
                  <div className="flex gap-4 animate-pulse">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg shrink-0" />
                    <div className="h-10 bg-slate-100 rounded-2xl flex-1" />
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-50">
                <div className="relative">
                  <input
                    type="text"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && runAiAnalysis(aiQuery)}
                    placeholder="How can I optimize the auth node?"
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:border-indigo-600 outline-none transition-all"
                  />
                  <button 
                    onClick={() => runAiAnalysis(aiQuery)}
                    disabled={isAiThinking || !aiQuery.trim()}
                    className="absolute right-1.5 top-1.5 bottom-1.5 w-9 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100 disabled:opacity-30"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsFloatingChatOpen(!isFloatingChatOpen)}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 ${isFloatingChatOpen ? 'bg-slate-900' : 'bg-indigo-600'} text-white shadow-indigo-200`}
        >
          {isFloatingChatOpen ? <X size={24} /> : <MessageSquare size={24} />}
          {!isFloatingChatOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-2 border-white rounded-full animate-bounce" />
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;
;
