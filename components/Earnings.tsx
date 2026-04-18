
import React from 'react';
import { motion } from 'motion/react';
import { Appointment, Currency } from '../types';
import { TrendingUp, DollarSign, Calendar, Clock, ArrowUpRight, ArrowDownLeft, ChevronRight, Activity, Zap, CreditCard, ShieldCheck } from 'lucide-react';

interface EarningsProps {
  appointments: Appointment[];
  currency: Currency;
  businessName: string;
}

const Earnings: React.FC<EarningsProps> = ({ appointments, currency, businessName }) => {
  const symbol = { ILS: '₪', USD: '$', EUR: '€', GBP: '£' }[currency];
  
  const confirmedApts = appointments.filter(a => a.status === 'confirmed' || a.status === 'completed');
  const totalReceived = confirmedApts.reduce((sum, a) => sum + (a.price || 0), 0);
  const pendingAmount = appointments.filter(a => a.status === 'pending').reduce((sum, a) => sum + (a.price || 0), 0);

  const recentTransactions = confirmedApts.slice(0, 8).map(apt => ({
    id: apt.id || Math.random().toString(),
    type: 'payout',
    amount: apt.price || 0,
    date: apt.time || 'Ref: Booking',
    status: 'completed',
    client: apt.clientName,
    service: apt.service
  }));

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-blue/10 text-brand-blue rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
             <CreditCard size={12} /> Live Payout Flow
           </div>
           <h1 className="text-4xl font-black text-brand-dark tracking-tight">Earnings & Payouts</h1>
           <p className="text-slate-500 font-medium mt-2">Manage your incoming revenue and payment gateway status.</p>
        </div>
        <div className="flex items-center gap-4">
           <button className="px-6 py-3 bg-slate-50 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all">Download Report</button>
           <button className="px-8 py-3 bg-brand-blue text-white rounded-2xl font-black text-sm shadow-xl shadow-brand-blue/20 hover:bg-brand-dark transition-all">Withdraw Funds</button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-brand-dark rounded-[40px] p-10 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-1">Total Net Earnings</p>
            <div className="flex items-baseline gap-4 mb-10">
              <h2 className="text-7xl font-black tracking-tighter">{symbol}{totalReceived.toLocaleString()}</h2>
              <div className="flex items-center gap-1 text-emerald-400 font-bold text-sm bg-emerald-400/10 px-3 py-1 rounded-full">
                <TrendingUp size={14} /> +12.5%
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-10">
              <div>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Available for Payout</p>
                <p className="text-2xl font-black">{symbol}{(totalReceived * 0.85).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Pending in Escrow</p>
                <p className="text-2xl font-black text-amber-400">{symbol}{pendingAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
           {/* Gateway Status */}
           <div className="bg-white border-2 border-slate-50 rounded-[32px] p-8 shadow-sm">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Connected Gateway</h4>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-brand-blue/10 text-brand-blue rounded-2xl flex items-center justify-center">
                  <Zap size={28} fill="currentColor" />
                </div>
                <div>
                  <p className="text-lg font-black text-brand-dark">PayMe (Israel)</p>
                  <p className="text-xs font-bold text-emerald-500 flex items-center gap-1.5 uppercase tracking-widest">
                    <ShieldCheck size={12} /> Active & Verified
                  </p>
                </div>
              </div>
              <button className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">Configure Gateway</button>
           </div>

           {/* Quick Advice */}
           <div className="bg-emerald-50 rounded-[32px] p-8 border border-emerald-100/50">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                   <Activity size={18} />
                 </div>
                 <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest text-center">Revenue Tip</span>
              </div>
              <p className="text-emerald-900 font-bold text-sm leading-relaxed">
                You've seen a 20% spike in Friday bookings. Consider offering a "Weekend Kickoff" event type to boost conversions.
              </p>
           </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white border border-slate-100 rounded-[40px] overflow-hidden shadow-sm">
        <div className="p-10 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-2xl font-black text-brand-dark tracking-tight">Recent Transactions</h3>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {['all', 'incoming', 'payouts'].map(filter => (
              <button key={filter} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-brand-dark text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((tx, i) => (
              <motion.div 
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-8 hover:bg-slate-50/50 transition-all flex items-center gap-6 group cursor-default"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${tx.type === 'incoming' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                   {tx.type === 'incoming' ? <ArrowDownLeft size={20} /> : <Zap size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-base font-black text-brand-dark truncate">{tx.client}</p>
                    <span className="text-[8px] px-2 py-0.5 bg-slate-100 text-slate-400 rounded-full font-black uppercase tracking-widest">{tx.service}</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tx.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-black text-brand-dark">{symbol}{tx.amount.toLocaleString()}</p>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Successful</p>
                </div>
                <div className="text-slate-100 group-hover:text-slate-300 transition-colors pl-4">
                  <ChevronRight size={24} />
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-24 flex flex-col items-center justify-center text-center gap-4">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                  <DollarSign size={32} />
               </div>
               <p className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">No transactions found</p>
            </div>
          )}
        </div>

        <button className="w-full py-6 bg-slate-50 text-slate-400 text-xs font-black uppercase tracking-widest hover:bg-brand-blue hover:text-white transition-all border-t border-slate-100">
          View All Transactions History
        </button>
      </div>
    </div>
  );
};

export default Earnings;
