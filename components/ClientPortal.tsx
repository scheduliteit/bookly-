
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, LogOut, Loader2, Mail, CheckCircle2, AlertCircle, ArrowLeft, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { db, doc, onSnapshot } from '../firebase';
import Logo from './Logo';

interface ClientPortalProps {
  businessId: string;
}

const ClientPortal: React.FC<ClientPortalProps> = ({ businessId }) => {
  const [email, setEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for email in URL for auto-login
    const params = new URLSearchParams(window.location.search);
    const urlEmail = params.get('email');
    if (urlEmail && urlEmail.includes('@')) {
      setEmail(urlEmail);
      // Auto-trigger login
      const autoTrigger = async () => {
        setIsVerifying(true);
        try {
          const appts = await api.appointments.getByClientEmail(businessId, urlEmail);
          if (appts.length > 0) {
            setAppointments(appts);
            setIsLoggedIn(true);
          }
        } catch (err) {
          console.error("Auto-login failed:", err);
        } finally {
          setIsVerifying(false);
        }
      };
      autoTrigger();
    }

    // Fetch business name
    const unsub = onSnapshot(doc(db, 'users', businessId), (docSnap) => {
      if (docSnap.exists()) {
        setBusinessName(docSnap.data().businessName || 'the Business');
      }
    });
    return () => unsub();
  }, [businessId]);

  const handleLogin = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsVerifying(true);
    setError(null);
    
    try {
      // In a real app, you'd send a magic link or OTP.
      // For now, we'll "login" if we find any appointment with this email.
      const appts = await api.appointments.getByClientEmail(businessId, email);
      if (appts.length === 0) {
        setError('No appointments found for this email address.');
      } else {
        setAppointments(appts);
        setIsLoggedIn(true);
      }
    } catch (err) {
      setError('Failed to verify identity. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = async (appointmentId: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    
    try {
      await api.appointments.updateStatus(appointmentId, 'cancelled');
      setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status: 'cancelled' } : a));
    } catch (err) {
      alert('Failed to cancel appointment. Please contact the business.');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white p-10 rounded-[40px] shadow-xl border border-slate-100"
        >
          <div className="text-center space-y-6 mb-10">
            <Logo size="xl" className="justify-center" />
            <div>
              <h2 className="text-2xl font-black text-slate-900">Manage your Bookings</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">Enter your email to view your appointments with <span className="text-slate-900 font-black">{businessName}</span></p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Your Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-blue transition-colors" size={18} />
                <input 
                  type="email"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm font-bold focus:bg-white focus:border-brand-blue outline-none transition-all"
                  placeholder="john@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />
              </div>
              {error && <p className="text-[10px] font-bold text-rose-500 ml-1 mt-1 flex items-center gap-1"><AlertCircle size={10} /> {error}</p>}
            </div>

            <button 
              onClick={handleLogin}
              disabled={isVerifying}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
            >
              {isVerifying ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Look up My Bookings</>}
            </button>
          </div>

          <div className="mt-10 pt-10 border-t border-slate-50 text-center">
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Powered by EasyBookly</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] p-6 lg:p-12 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
             <Logo size="lg" showText={false} />
             <div>
               <h1 className="text-3xl font-black text-slate-900 tracking-tight">Your History</h1>
               <p className="text-sm text-slate-500 font-medium">{email} • {businessName}</p>
             </div>
          </div>
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-slate-900 rounded-2xl transition-all shadow-sm"
          >
            <LogOut size={20} />
          </button>
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-6">
            {appointments.length === 0 ? (
              <div className="py-20 bg-white border border-slate-100 rounded-[40px] text-center space-y-4">
                 <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200 italic font-serif text-4xl">?</div>
                 <h3 className="text-lg font-black text-slate-900">No appointments found</h3>
                 <p className="text-sm text-slate-400 max-w-xs mx-auto">We couldn't find any upcoming or past bookings associated with this email address.</p>
              </div>
            ) : (
              appointments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(appt => {
                const isUpcoming = new Date(`${appt.date}T${appt.time}`) > new Date();
                return (
                  <motion.div 
                    key={appt.id}
                    layoutId={appt.id}
                    className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center justify-between gap-8"
                  >
                    <div className="flex items-center gap-6">
                       <div className={`w-16 h-16 rounded-[24px] flex flex-col items-center justify-center ${appt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : appt.status === 'cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-brand-blue/10 text-brand-blue'}`}>
                          <Calendar size={24} />
                          <span className="text-[10px] font-black mt-1 uppercase tracking-widest">{appt.date.split('-')[2]}</span>
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">{appt.status}</p>
                          <h3 className="text-xl font-black text-slate-900">{appt.service}</h3>
                          <div className="flex items-center gap-4 mt-2">
                             <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                                <Clock size={14} className="text-slate-300" />
                                {appt.time} ({appt.duration}m)
                             </div>
                             <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                                <Calendar size={14} className="text-slate-300" />
                                {new Date(appt.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                       {isUpcoming && appt.status !== 'cancelled' && (
                         <button 
                           onClick={() => handleCancel(appt.id)}
                           className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 text-rose-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-50 hover:border-rose-100 transition-all"
                         >
                           Cancel
                         </button>
                       )}
                       {appt.meetingLink && appt.status === 'confirmed' && isUpcoming && (
                         <button 
                           onClick={() => window.open(appt.meetingLink, '_blank')}
                           className="flex-1 md:flex-none px-8 py-3 bg-brand-blue text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-dark transition-all shadow-lg shadow-brand-blue/20"
                         >
                           Join Now
                         </button>
                       )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-12 text-center">
           <button 
             onClick={() => window.location.href = `/book/${businessId}`}
             className="inline-flex items-center gap-2 text-xs font-black text-brand-blue uppercase tracking-[0.2em] hover:underline"
           >
             <ArrowLeft size={14} /> Back to Booking Page
           </button>
        </div>
      </div>
    </div>
  );
};

export default ClientPortal;
