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
  const [simulationMode, setSimulationMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [systemStats, setSystemStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [terminalInput, setTerminalInput] = useState("");
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [isGeneratingIntel, setIsGeneratingIntel] = useState(false);
  const [logs, setLogs] = useState<CommandLog[]>([
    { id: '1', time: '03:49:02', source: 'CORE', event: 'Simulation engine standby...', level: 'info' },
    { id: '2', time: '03:48:48', source: 'NET', event: 'Global mesh routing optimized', level: 'success' },
  ]);

  const [simulationMetrics, setSimulationMetrics] = useState({
    rps: 0,
    latency: 0,
    cacheHit: 0,
    activeSessions: 0,
    revenue: 0,
    payoutRate: 0
  });

  const fetchAllData = async () => {
    try {
      const [stats, users, recentActivities] = await Promise.all([
        api.system.getStats(),
        api.system.getUsers(),
        api.system.getActivities()
      ]);
      setSystemStats(stats);
      setDbUsers(users);
      setActivities(recentActivities);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Simulation Ticker
    const tickerInterval = setInterval(() => {
      setSimulationMetrics(prev => ({
        rps: Math.floor(Math.random() * 400 + 100),
        latency: Math.floor(Math.random() * 20 + 5),
        cacheHit: Math.floor(Math.random() * 15 + 80),
        activeSessions: Math.floor(Math.random() * 200 + 1500),
        revenue: prev.revenue + (Math.random() * 50),
        payoutRate: Math.floor(Math.random() * 10 + 90)
      }));
    }, 2000);

    // Refresh data every 2 minutes
    const dataInterval = setInterval(fetchAllData, 120000);
    
    // Simulate live log stream
    const logInterval = setInterval(() => {
      if (isLive) {
        const sources = ['AUTH', 'DB', 'APP', 'PAY', 'SEC', 'GEMINI', 'MESH', 'CACHE'];
        const events = simulationMode ? [
          `RAW_READ: node_${Math.floor(Math.random()*1000)} - 1.2Kb`,
          `SQL_QUERY: SELECT * FROM businesses WHERE id='${Math.random().toString(36).substr(5)}'`,
          `CACHE_MISS: hash_${Math.random().toString(36).substr(2,6)}`,
          `GEO_LATENCY: tok-01 -> lon-04: 142ms`,
          `AUTH_TOKEN_GEN: RS256_EXP_3600`,
          `FIREWALL_SCRUB: pattern match 'sqli' blocked`,
          `MEM_USAGE: heap used ${Math.floor(Math.random()*200 + 400)}MB`,
          `NET_SYNC: global_clocks synchronized (+1ms)`
        ] : [
          'Token refreshed for node_84',
          'Search index re-sharded',
          'Client sync operation: +12ms',
          'Vector DB query latency: 12ms',
          'Worker node A-4 recovered',
          'Gemini 1.5 prompt cached'
        ];
        
        const newLog: CommandLog = {
          id: Math.random().toString(36).substr(2, 9),
          time: new Date().toLocaleTimeString('en-GB'),
          source: sources[Math.floor(Math.random() * sources.length)],
          event: events[Math.floor(Math.random() * events.length)],
          level: Math.random() > 0.95 ? 'warning' : 'info'
        };
        setLogs(prev => [newLog, ...prev.slice(0, 30)]);
      }
    }, simulationMode ? 500 : 4000);

    return () => {
      clearInterval(logInterval);
      clearInterval(dataInterval);
      clearInterval(tickerInterval);
    };
  }, [isLive, simulationMode]);

  const handleTerminalCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput) return;

    const cmd = terminalInput.toLowerCase().trim();
    let response = `Command not recognized: ${cmd}`;
    let level: 'info' | 'success' | 'warning' | 'error' = 'info';

    if (cmd === 'clear') {
      setLogs([]);
      setTerminalInput("");
      return;
    } else if (cmd === 'simulate on') {
      setSimulationMode(true);
      response = `Simulation Mode: ACTIVATED. Streaming live platform metadata.`;
      level = 'warning';
    } else if (cmd === 'simulate off') {
      setSimulationMode(false);
      response = `Simulation Mode: DEACTIVATED. Returning to high-level telemetry.`;
      level = 'info';
    } else if (cmd === 'sync' || cmd === 'build') {
      response = `Process initiated: global_mesh_sync. Success.`;
      level = 'success';
    } else if (cmd === 'whoami') {
      response = `Authenticated: m.elsalameen@gmail.com (Master Admin)`;
    } else if (cmd === 'health') {
      response = `Cluster health: OPTIMAL. Nodes online: ${dbUsers.length}.`;
      level = 'success';
    } else if (cmd === 'help') {
      response = `Available: simulate on/off, sync, clear, whoami, health, build`;
    }

    const newLog: CommandLog = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString('en-GB'),
      source: 'LOCAL',
      event: `> ${terminalInput}`,
      level: 'info'
    };
    
    const respLog: CommandLog = {
      id: (Date.now() + 1).toString(),
      time: new Date().toLocaleTimeString('en-GB'),
      source: 'SYS',
      event: response,
      level
    };

    setLogs(prev => [respLog, newLog, ...prev]);
    setTerminalInput("");
  };

  const handleUpdateRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Are you sure you want to change this node to ${newRole.toUpperCase()}?`)) return;
    
    try {
      await api.system.updateUserRole(userId, newRole);
      fetchAllData();
    } catch (err) {
      alert("Failed to update role");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("This will permanently decommission this node. Proceed?")) return;
    try {
      await api.system.deleteUser(userId);
      fetchAllData();
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  const generateIntel = async () => {
    setIsGeneratingIntel(true);
    try {
      const insights = await api.system.generateInsights();
      setAiInsights(insights);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingIntel(false);
    }
  };

  // Performance Data - use real data from stats if available
  const perfData = useMemo(() => {
    if (systemStats?.last7DaysCharts) {
      return systemStats.last7DaysCharts.map((d: any) => ({
        time: d.date,
        req: d.count * 10 
      }));
    }
    return [
      { time: '00:00', cpu: 12, mem: 45, req: 120 },
      { time: '04:00', cpu: 8, mem: 42, req: 80 },
      { time: '08:00', cpu: 34, mem: 58, req: 450 },
      { time: '12:00', cpu: 45, mem: 65, req: 980 },
      { time: '16:00', cpu: 32, mem: 60, req: 720 },
      { time: '20:00', cpu: 18, mem: 52, req: 340 },
      { time: '23:59', cpu: 14, mem: 48, req: 210 },
    ];
  }, [systemStats]);

  const kpis = useMemo(() => [
    { label: 'Total Nodes', value: systemStats?.totalSignups?.toLocaleString() || '---', icon: UserPlus, color: 'text-indigo-400' },
    { label: 'Total Bookings', value: systemStats?.completedAppointments?.toLocaleString() || '---', icon: Calendar, color: 'text-emerald-400' },
    { label: 'Total Access Sessions', value: systemStats?.totalLogins?.toLocaleString() || '---', icon: Fingerprint, color: 'text-amber-400' },
    { label: 'Currently Live', value: simulationMetrics.activeSessions.toLocaleString(), icon: Activity, color: 'text-brand-blue' },
  ], [systemStats, simulationMetrics]);

  const handleBroadcast = () => {
    if (!broadcastMessage) return;
    const newLog: CommandLog = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString('en-GB'),
      source: 'ADMIN',
      event: `BROADCAST: ${broadcastMessage}`,
      level: 'warning'
    };
    setLogs(prev => [newLog, ...prev]);
    setBroadcastMessage("");
    alert("Broadcast sent to all active sessions.");
  };

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Simulation Live Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
         {[
           { label: 'Requests/sec', value: `${simulationMetrics.rps}`, icon: Zap, color: 'text-brand-blue' },
           { label: 'Latency', value: `${simulationMetrics.latency}ms`, icon: Activity, color: 'text-emerald-400' },
           { label: 'Cache Hit', value: `${simulationMetrics.cacheHit}%`, icon: HardDrive, color: 'text-amber-400' },
           { label: 'Mesh Status', value: 'SYNCED', icon: Network, color: 'text-indigo-400' },
           { label: 'Revenue Flow', value: `$${simulationMetrics.revenue.toFixed(0)}`, icon: CreditCard, color: 'text-brand-blue' },
           { label: 'Payout Ready', value: `${simulationMetrics.payoutRate}%`, icon: CheckCircle2, color: 'text-emerald-400' },
         ].map((m, i) => (
           <div key={i} className="bg-[#0A0A0B] border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-brand-blue/30 transition-all">
              <div>
                 <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">{m.label}</p>
                 <p className={`text-sm font-black transition-colors ${m.color}`}>{m.value}</p>
              </div>
              <m.icon size={14} className="opacity-10 group-hover:opacity-50" />
           </div>
         ))}
      </div>

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
            <div className="flex items-end gap-3 text-white">
              <h3 className={`text-4xl font-black tracking-tighter ${isLoadingStats ? 'animate-pulse opacity-50' : ''}`}>
                {kpi.value}
              </h3>
            </div>
            <div className="mt-6 flex gap-1 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
               <div className={`h-full bg-brand-blue rounded-full ${isLoadingStats ? 'animate-shimmer' : ''}`} style={{ width: i === 0 ? '60%' : i === 1 ? '85%' : '95%', transition: 'width 2s' }} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deep Forensic Chart */}
        <div className="lg:col-span-2 bg-[#0A0A0B] border border-white/10 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-blue/50 to-transparent" />
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">Platform Telemetry Matrix</h3>
              <p className="text-xs font-bold text-white/30 uppercase tracking-widest mt-1">Global load balancer distribution (7 Day Window)</p>
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

        {/* Global Node Map (Simulated visual) */}
        <div className="bg-[#0A0A0B] border border-white/10 rounded-[3rem] p-8 flex flex-col relative group overflow-hidden">
           <div className="absolute top-0 right-0 w-1 h-1/2 bg-gradient-to-b from-transparent via-emerald-500/50 to-transparent" />
           <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-blue/10 rounded-full blur-[100px]" />
           <div className="flex items-center justify-between mb-8 relative z-10">
              <h4 className="text-xl font-black text-white">Live Operations Overlay</h4>
              <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-emerald-400"><Activity size={18} /></div>
           </div>
           
           <div className="flex-1 space-y-4 relative z-10 overflow-hidden">
              <div className="relative h-48 w-full border border-white/5 rounded-3xl bg-black/40 overflow-hidden flex items-center justify-center">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,107,255,0.05)_0%,transparent_80%)]" />
                 {/* Visual dots representing global nodes */}
                 {[
                   { t: '15%', l: '20%', n: 'NYC-01' },
                   { t: '40%', l: '45%', n: 'LON-04' },
                   { t: '70%', l: '75%', n: 'TOK-02' },
                   { t: '30%', l: '80%', n: 'SGP-01' },
                   { t: '60%', l: '15%', n: 'LAX-02' }
                 ].map((node, i) => (
                   <motion.div 
                     key={i}
                     initial={{ scale: 0 }}
                     animate={{ scale: [0, 1, 0.8, 1] }}
                     transition={{ repeat: Infinity, duration: 4, delay: i * 0.5 }}
                     className="absolute w-2 h-2 bg-brand-blue rounded-full shadow-[0_0_15px_rgba(0,107,255,0.8)]"
                     style={{ top: node.t, left: node.l }}
                   >
                     <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[6px] font-black text-white/30 whitespace-nowrap uppercase tracking-widest">{node.n}</div>
                   </motion.div>
                 ))}
                 <div className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em] rotate-12 pointer-events-none">Global Mesh Topology</div>
              </div>

              {activities.length > 0 ? (
                <div className="space-y-4 overflow-y-auto max-h-48 scrollbar-hide">
                  {activities.map((act, i) => (
                    <motion.div 
                      key={act.id} 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all flex gap-3"
                    >
                      <div className="w-10 h-10 bg-brand-blue/10 rounded-xl flex items-center justify-center shrink-0">
                          <Zap size={16} className="text-brand-blue" />
                      </div>
                      <div className="min-w-0">
                          <p className="text-[11px] font-black text-white truncate">{act.event}</p>
                          <p className="text-[9px] font-medium text-white/30 uppercase tracking-widest mt-0.5">{act.user} • {act.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white/20">
                   <Box size={40} className="mb-4 opacity-50" />
                   <p className="text-[10px] font-black uppercase tracking-widest font-mono">No recent activity detected</p>
                </div>
              )}
           </div>

           <div className="mt-8 relative z-10 space-y-4">
              <input 
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Push global announcement..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white outline-none focus:ring-1 ring-amber-500/30 transition-all font-mono"
              />
              <button 
                onClick={handleBroadcast}
                className="w-full py-5 bg-brand-blue text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-brand-dark transition-all shadow-xl active:scale-95"
              >
                 Initialize Broadcast
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
                   <h3 className="text-2xl font-black text-white">Cluster Topology Matrix</h3>
                   <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Active node distribution and health telemetry</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-emerald-400 animate-pulse uppercase tracking-[0.2em] font-mono">Real-time Sync Active</span>
                  <button 
                    onClick={fetchAllData}
                    className="p-3 bg-white/5 rounded-2xl text-white/60 hover:text-white transition-all transform hover:rotate-180 duration-500"
                  >
                    <RefreshCw size={20} />
                  </button>
                </div>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: 'Core Engine', status: 'Healthy', load: '14%', icon: Cpu, mem: '1.2GB', ping: '2ms' },
                  { name: 'Vector Store', status: 'Healthy', load: '42%', icon: Database, mem: '4.8GB', ping: '12ms' },
                  { name: 'Identity Relay', status: 'Healthy', load: '12%', icon: ShieldCheck, mem: '1.4GB', ping: '4ms' },
                  { name: 'AI Controller', status: 'Healthy', load: '22%', icon: Radio, mem: '12GB', ping: '84ms' },
                  { name: 'Image Processing', status: 'Healthy', load: '4%', icon: Layers, mem: '200MB', ping: '1ms' },
                  { name: 'Public Traffic', status: 'Healthy', load: '31%', icon: Globe, mem: '2.1GB', ping: '0.5ms' },
                ].map((node, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
                    className="p-6 bg-white/5 border border-white/5 rounded-[2rem] relative group cursor-crosshair"
                  >
                     <div className={`absolute top-6 right-6 w-2 h-2 rounded-full ${node.status === 'Healthy' ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-ping'}`} />
                     <div className="w-12 h-12 bg-white/5 text-brand-blue rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-blue group-hover:text-white transition-all"><node.icon size={24} /></div>
                     <h4 className="font-black text-white mb-1">{node.name}</h4>
                     <div className="flex items-center gap-2 mb-6">
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{node.status} • {node.mem}</span>
                        <div className="w-1 h-1 rounded-full bg-white/10" />
                        <span className="text-[10px] font-black text-brand-blue font-mono">{node.ping}</span>
                     </div>
                     
                     <div className="space-y-2">
                        <div className="flex justify-between text-[8px] font-black text-white/40 uppercase tracking-widest">
                           <span>Node Utilization</span>
                           <span>{node.load}</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: node.load }}
                             className="h-full bg-brand-blue shadow-[0_0_10px_rgba(0,107,255,0.5)]" 
                           />
                        </div>
                     </div>
                  </motion.div>
                ))}
             </div>
          </div>
       </div>

       {/* Realtime Terminal */}
       <div className="bg-[#0A0A0B] border border-white/10 rounded-[3rem] p-8 flex flex-col h-full ring-1 ring-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-[#000]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,107,255,0.15)_0%,transparent_70%)]" />
          <div className="flex items-center justify-between mb-8 relative z-10">
             <h4 className="text-lg font-black text-white flex items-center gap-2">
                <TerminalIcon size={18} className={`${simulationMode ? 'text-amber-400' : 'text-brand-blue'}`} /> 
                {simulationMode ? 'RAW SIMULATION' : 'MASTER SHELL'}
             </h4>
             <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${simulationMode ? 'bg-amber-400 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
                <span className="text-[8px] font-black text-white/40 tracking-widest uppercase font-mono">{simulationMode ? 'SIM_RUNNING' : 'TTY_01'}</span>
             </div>
          </div>

          <div className="flex-1 space-y-4 font-mono text-[9px] overflow-y-auto relative z-10 scrollbar-hide flex flex-col-reverse">
             <AnimatePresence initial={false}>
               {logs.map((log) => (
                 <motion.div 
                   key={log.id} 
                   initial={{ opacity: 0, x: -10 }} 
                   animate={{ opacity: 1, x: 0 }} 
                   className="flex gap-3 leading-relaxed py-0.5"
                 >
                    <span className="text-white/10 whitespace-nowrap uppercase tracking-tighter">{log.time}</span>
                    <span className={`font-black shrink-0 ${log.level === 'error' ? 'text-rose-400' : log.level === 'warning' ? 'text-amber-400' : log.level === 'success' ? 'text-emerald-400' : 'text-brand-blue'}`}>
                       [{log.source}]:
                    </span>
                    <span className={`break-all ${simulationMode ? 'text-white/40' : 'text-white/60'}`}>{log.event}</span>
                 </motion.div>
               ))}
             </AnimatePresence>
          </div>

          <form onSubmit={handleTerminalCommand} className="mt-8 pt-6 border-t border-white/10 relative z-10">
             <div className="relative group">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-brand-blue font-black">{`>`}</span>
                <input 
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  placeholder="Master authorization required..."
                  className="w-full bg-transparent border-none outline-none pl-6 text-[10px] font-bold font-mono text-white placeholder:text-white/10"
                />
             </div>
          </form>
       </div>
    </div>
  );

  const renderUsers = () => (
    <div className="bg-[#0A0A0B] border border-white/10 rounded-[3rem] overflow-hidden animate-in fade-in duration-500 shadow-3xl">
      <div className="p-10 border-b border-white/5 bg-[#0D0D0E] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h3 className="text-2xl font-black text-white leading-none">Security Identities</h3>
           <p className="text-xs font-bold text-white/30 uppercase tracking-widest mt-2">{dbUsers.length} decrypted business nodes detected</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-blue transition-colors" size={18} />
              <input 
                placeholder="Search nodes..."
                className="bg-white/5 border border-white/10 pl-12 pr-6 py-4 rounded-2xl text-xs font-bold text-white outline-none focus:border-brand-blue/50 w-72 transition-all shadow-inner"
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
             <tr className="bg-white/[0.02]">
                <th className="px-10 py-6 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Business Identity</th>
                <th className="px-10 py-6 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Access Level</th>
                <th className="px-10 py-6 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Contact Node</th>
                <th className="px-10 py-6 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Core Sessions</th>
                <th className="px-10 py-6 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-right">Operation</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
             {(dbUsers.length > 0 ? dbUsers : []).filter(u => u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase())).map((user, i) => (
                <tr key={user.id} className="hover:bg-white/[0.03] transition-all group">
                   <td className="px-10 py-8">
                      <div className="flex items-center gap-4">
                         <div className="w-14 h-14 bg-[#111] border border-white/10 rounded-2xl flex items-center justify-center font-black text-brand-blue group-hover:border-brand-blue transition-all shadow-2xl relative overflow-hidden">
                           <div className="absolute inset-0 bg-brand-blue/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                           <span className="relative z-10">{user.displayName?.[0] || user.email?.[0] || '?'}</span>
                         </div>
                         <div>
                            <p className="text-base font-black text-white leading-tight">{user.displayName || 'Unnamed node'}</p>
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">{user.businessCategory || 'UNCLASSIFIED'}</p>
                         </div>
                      </div>
                   </td>
                   <td className="px-10 py-8">
                      <button 
                        onClick={() => handleUpdateRole(user.id, user.role)}
                        className={`text-[10px] font-black px-4 py-1.5 rounded-full border transition-all ${user.role === 'admin' ? 'bg-brand-blue text-white border-brand-blue shadow-[0_0_15px_rgba(0,107,255,0.4)]' : 'bg-white/5 text-white/40 border-white/10 hover:text-white hover:bg-white/10'}`}
                      >
                         {user.role?.toUpperCase() || 'USER'}
                      </button>
                   </td>
                   <td className="px-10 py-8 text-white/60 font-mono text-xs tracking-tight">
                      {user.email}
                   </td>
                   <td className="px-10 py-8">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full w-fit bg-brand-blue/10 text-brand-blue border border-brand-blue/20`}>
                         <Zap size={10} className="animate-pulse" />
                         <span className="text-[10px] font-black uppercase tracking-widest">{user.loginCount || 0} Sessions</span>
                      </div>
                   </td>
                   <td className="px-10 py-8 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                         <button className="p-3 bg-white/5 text-white/40 hover:text-white hover:bg-brand-blue rounded-xl transition-all shadow-xl"><Edit3 size={16} /></button>
                         <button 
                           onClick={() => handleDeleteUser(user.id)}
                           className="p-3 bg-white/5 text-white/40 hover:text-white hover:bg-rose-500 rounded-xl transition-all shadow-xl"
                         >
                            <Trash2 size={16} />
                         </button>
                      </div>
                   </td>
                </tr>
             ))}
             {dbUsers.length === 0 && (
               <tr>
                 <td colSpan={5} className="text-center py-20 opacity-20 font-black uppercase tracking-widest font-mono animate-pulse">Initializing Matrix Identities...</td>
               </tr>
             )}
          </tbody>
        </table>
      </div>
      <div className="p-10 border-t border-white/5 flex items-center justify-between bg-[#0D0D0E]">
         <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] font-mono flex items-center gap-2">
            <Cpu size={12} className="animate-spin-slow" /> {dbUsers.length} nodes successfully decrypted
         </p>
         <div className="flex gap-4">
            <button className="px-6 py-2 bg-white/5 text-white/40 rounded-xl text-[10px] font-black uppercase tracking-widest">Prev</button>
            <button className="px-6 py-2 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">Next Channel</button>
         </div>
      </div>
    </div>
  );

  const renderIntelligence = () => (
    <div className="min-h-[600px] animate-in zoom-in-95 duration-700">
       <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4">
             <div className="w-24 h-24 bg-brand-blue/10 rounded-[2rem] flex items-center justify-center mx-auto ring-1 ring-brand-blue/30 relative mb-8 rotate-12 group hover:rotate-0 transition-transform">
                <div className="absolute inset-0 bg-brand-blue blur-[40px] opacity-20" />
                <Processor size={48} className="text-brand-blue animate-pulse" />
             </div>
             <h2 className="text-5xl font-black text-white tracking-tighter">Quantum Intelligence</h2>
             <p className="text-brand-blue font-black uppercase tracking-[0.4em] text-xs">Platform Strategic Analysis System</p>
          </div>

          {aiInsights.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {aiInsights.map((insight, i) => (
                 <motion.div 
                   key={i}
                   initial={{ opacity: 0, y: 30 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.1 }}
                   className="bg-[#0A0A0B] border border-white/10 p-10 rounded-[3rem] hover:border-brand-blue/50 transition-all group"
                 >
                    <div className={`mb-6 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full w-fit ${insight.priority === 'high' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                       Priority: {insight.priority}
                    </div>
                    <h4 className="text-xl font-black text-white mb-4 group-hover:text-brand-blue transition-colors">{insight.title}</h4>
                    <p className="text-sm font-medium text-white/40 leading-relaxed mb-10">{insight.content}</p>
                    <button className="w-full py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white group-hover:bg-brand-blue group-hover:border-brand-blue transition-all">
                       Initialize Action
                    </button>
                 </motion.div>
               ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-8 bg-[#0A0A0B] border border-white/10 p-20 rounded-[4rem]">
               <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-white/20 animate-spin-slow ring-1 ring-white/10">
                  <RefreshCw size={32} />
               </div>
               <div className="text-center">
                  <h3 className="text-2xl font-black text-white mb-2">Matrix Analysis Pending</h3>
                  <p className="text-sm font-medium text-white/20 uppercase tracking-widest">Intelligence engine requires manual override to initialize telemetry decryption.</p>
               </div>
               <button 
                 onClick={generateIntel}
                 disabled={isGeneratingIntel}
                 className="px-12 py-5 bg-white text-brand-dark rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-brand-blue hover:text-white transition-all shadow-3xl disabled:opacity-50"
               >
                  {isGeneratingIntel ? 'DECRYPTING DATA...' : 'INITIALIZE INTEL SCAN'}
               </button>
            </div>
          )}
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
                <motion.div key="intel" layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                   {renderIntelligence()}
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
