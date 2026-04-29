
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Server, Database, Globe, CheckCircle2, AlertCircle, Loader2, RefreshCw, Zap, Search, Activity, History } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, getDocs, limit, query } from 'firebase/firestore';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: string;
  icon: any;
}

const DiagnosticTool: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([
    { name: 'Firebase Authentication', status: 'pending', message: 'Verifying user identity...', icon: ShieldCheck },
    { name: 'Firestore Connectivity', status: 'pending', message: 'Checking database access...', icon: Database },
    { name: 'Server Integrity', status: 'pending', message: 'Pinging cloud backend...', icon: Server },
    { name: 'Public Profile Visibility', status: 'pending', message: 'Testing public booking link...', icon: Globe },
    { name: 'API Services', status: 'pending', message: 'Validating microservices...', icon: Activity },
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [lastAudit, setLastAudit] = useState<string | null>(localStorage.getItem('eb_last_audit'));

  const runAudit = async () => {
    setIsRunning(true);
    const newResults: TestResult[] = [...results].map(r => ({ ...r, status: 'pending' }));
    setResults(newResults);

    // 1. Auth Test
    try {
      const user = auth.currentUser;
      if (user) {
        newResults[0] = { ...newResults[0], status: 'success', message: `Authenticated as ${user.email}`, details: `UID: ${user.uid.substring(0, 8)}...` };
      } else {
        newResults[0] = { ...newResults[0], status: 'error', message: 'User not signed in', details: 'Dashboard requires valid auth session.' };
      }
    } catch (e: any) {
      newResults[0] = { ...newResults[0], status: 'error', message: 'Auth Fault', details: e.message };
    }
    setResults([...newResults]);

    // 2. Firestore Test
    try {
      if (auth.currentUser) {
        const testSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (testSnap.exists()) {
          newResults[1] = { ...newResults[1], status: 'success', message: 'Read/Write Permitted', details: 'Primary user node accessible.' };
        } else {
          newResults[1] = { ...newResults[1], status: 'success', message: 'Connection OK', details: 'Connection active (profile missing but accessible).' };
        }
      } else {
         newResults[1] = { ...newResults[1], status: 'error', message: 'Auth Required', details: 'Cannot test Firestore without UID.' };
      }
    } catch (e: any) {
      newResults[1] = { ...newResults[1], status: 'error', message: 'Firestore Denied', details: e.message };
    }
    setResults([...newResults]);

    // 3. Server Ping
    try {
      const start = Date.now();
      const res = await fetch('/api/health');
      if (res.ok) {
        const ms = Date.now() - start;
        newResults[2] = { ...newResults[2], status: 'success', message: 'Backend Operational', details: `Latency: ${ms}ms` };
      } else {
        newResults[2] = { ...newResults[2], status: 'error', message: 'Backend Unreachable', details: `Status: ${res.status}` };
      }
    } catch (e: any) {
      newResults[2] = { ...newResults[2], status: 'error', message: 'Cloud Proxy Error', details: 'Network request failed.' };
    }
    setResults([...newResults]);

    // 4. Public Profile Visibility
    try {
      if (auth.currentUser) {
        const url = `/api/availability?userId=${auth.currentUser.uid}&date=${new Date().toISOString().split('T')[0]}`;
        const res = await fetch(url);
        if (res.ok) {
          newResults[3] = { ...newResults[3], status: 'success', message: 'Gateway Active', details: 'Availability service responding.' };
        } else {
          const errorText = await res.text();
          newResults[3] = { ...newResults[3], status: 'error', message: 'Public Route Degraded', details: `Status ${res.status}: ${errorText.substring(0, 100)}` };
        }
      } else {
         newResults[3] = { ...newResults[3], status: 'pending', message: 'Skipped', details: 'Signin required to detect profile.' };
      }
    } catch (e: any) {
        newResults[3] = { ...newResults[3], status: 'error', message: 'Profile Sync Fault', details: e.message };
    }
    setResults([...newResults]);

    // 5. API Services
    try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch('/api/admin/config-status', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            newResults[4] = { ...newResults[4], status: 'success', message: 'Configurations Validated', details: `Active: ${Object.keys(data).filter(k => data[k]).join(', ')}` };
        } else {
            newResults[4] = { ...newResults[4], status: 'error', message: 'Config Access Denied', details: 'Admin-tier privileges required.' };
        }
    } catch (e: any) {
        newResults[4] = { ...newResults[4], status: 'error', message: 'Integration Fault', details: e.message };
    }
    
    setResults([...newResults]);
    setIsRunning(false);
    const now = new Date().toLocaleString();
    setLastAudit(now);
    localStorage.setItem('eb_last_audit', now);
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto py-12 px-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-brand-dark tracking-tight">System Audit</h2>
          <p className="text-sm text-slate-500 font-medium">Verify your environment and connectivity.</p>
        </div>
        <button 
          onClick={runAudit}
          disabled={isRunning}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isRunning ? 'bg-slate-100 text-slate-400' : 'bg-brand-blue text-white shadow-xl shadow-brand-blue/20 hover:bg-brand-dark'}`}
        >
          {isRunning ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          {isRunning ? 'Auditing...' : 'Run Audit'}
        </button>
      </div>

      <div className="space-y-4">
        {results.map((r, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-3xl p-6 flex items-center gap-6 shadow-sm">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              r.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 
              r.status === 'error' ? 'bg-rose-50 text-rose-600' : 
              'bg-slate-50 text-slate-400'
            }`}>
              <r.icon size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-brand-dark uppercase tracking-tight">{r.name}</h4>
                {r.status === 'success' && <CheckCircle2 size={16} className="text-emerald-500" />}
                {r.status === 'error' && <AlertCircle size={16} className="text-rose-500" />}
                {r.status === 'pending' && <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-pulse" />}
              </div>
              <p className={`text-xs font-bold mt-0.5 ${r.status === 'error' ? 'text-rose-500' : 'text-slate-400'}`}>{r.message}</p>
              {r.details && (
                <p className="text-[10px] font-mono text-slate-400 mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100 truncate">
                  {r.details}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {lastAudit && (
        <div className="flex items-center justify-center gap-2 text-slate-400">
           <History size={14} />
           <span className="text-[10px] font-black uppercase tracking-widest leading-none">Last Audit: {lastAudit}</span>
        </div>
      )}

      <div className="p-8 bg-brand-dark rounded-[40px] text-white relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue opacity-10 blur-3xl" />
         <div className="relative space-y-4">
            <div className="flex items-center gap-2 text-brand-blue">
               <Zap size={16} fill="currentColor" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">Quick Resolve</span>
            </div>
            <h3 className="text-xl font-black">Something not looking right?</h3>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              Most issues are resolved by refreshing the application or checking your internet connection. If "API Services" fails, ensure your Admin API Key is configured in the environment.
            </p>
            <div className="pt-4 flex gap-3">
               <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">Reload App</button>
               <button onClick={() => auth.signOut().then(() => window.location.reload())} className="px-6 py-2.5 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">Reset Session</button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default DiagnosticTool;
