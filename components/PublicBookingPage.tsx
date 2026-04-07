
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronRight, CheckCircle2, User, Phone, ShieldCheck, Check, Globe, Loader2, Lock, Languages, Info, ArrowLeft, ArrowRight, CalendarDays, Star, Zap, Users, Shield, MessageSquareText, Globe2, Sparkles, Send, X, Radio } from 'lucide-react';
import { api } from '../services/api';
import { Service } from '../types';
import { geminiAssistant } from '../services/geminiService';
import { paymentService } from '../services/paymentService';

interface PublicBookingPageProps {
  userId?: string;
  businessName?: string;
  services?: Service[];
  legalData?: { privacyPolicy: string; termsOfService: string; gdprStrict: boolean };
  currency?: 'ILS' | 'USD' | 'EUR' | 'GBP';
  onBookingComplete: (booking: any) => void;
  onBack?: () => void;
}

const PublicBookingPage: React.FC<PublicBookingPageProps> = ({ 
  userId: propUserId,
  businessName: initialBusinessName, 
  services: initialServices, 
  legalData: initialLegalData, 
  currency: initialCurrency, 
  onBookingComplete, 
  onBack 
}) => {
  const [userId, setUserId] = useState(propUserId || 'default');
  const [businessName, setBusinessName] = useState(initialBusinessName || '');
  const [services, setServices] = useState<Service[]>(initialServices || []);
  const [legalData, setLegalData] = useState(initialLegalData || { privacyPolicy: '', termsOfService: '', gdprStrict: true });
  const [currency, setCurrency] = useState<'ILS' | 'USD' | 'EUR' | 'GBP'>(initialCurrency || 'USD');
  const [isLoading, setIsLoading] = useState(!initialBusinessName);

  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState("");
  const [clientInfo, setClientInfo] = useState({ name: '', email: '', phone: '', note: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // AI Concierge State
  const [showAi, setShowAi] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState<{role: 'ai' | 'user', text: string}[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const symbol = { ILS: '₪', USD: '$', EUR: '€', GBP: '£' }[currency];

  useEffect(() => {
    if (!initialBusinessName && userId !== 'default') {
      const fetchProfile = async () => {
        try {
          const data = await api.publicProfile.get(userId);
          if (data) {
            setBusinessName(data.businessName);
            setServices(data.services);
            setLegalData(data.legalData);
            setCurrency(data.currency);
          }
        } catch (err) {
          console.error("Failed to fetch public profile", err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchProfile();
    } else if (initialBusinessName) {
      setIsLoading(false);
    }
  }, [initialBusinessName, userId]);

  useEffect(() => {
    if (selectedDate) {
      const fetchSlots = async () => {
        const slots = await api.system.checkAvailability(selectedDate);
        setAvailableSlots(slots);
      };
      fetchSlots();
    }
  }, [selectedDate]);

  const handleBook = async () => {
    if (!selectedService) return;
    setIsSubmitting(true);
    const appointmentId = Math.random().toString(36).substr(2, 9);
    
    try {
      // Create the appointment first (as pending if payment is required)
      const result = await api.appointments.create({ 
        id: appointmentId, 
        userId: userId, // The owner of the business
        clientId: 'public-' + Date.now(),
        clientName: clientInfo.name, 
        service: selectedService.name, 
        date: selectedDate, 
        time: selectedTime, 
        duration: selectedService.duration, 
        status: selectedService.price > 0 ? 'pending' : 'confirmed', 
        price: selectedService.price,
      });

      if (selectedService.price > 0) {
        // Redirect to Payment Gateway (Stripe or PayMe)
        const { url } = await paymentService.createCheckoutSession({
          serviceName: selectedService.name,
          amount: selectedService.price,
          currency: currency,
          appointmentId: appointmentId,
          successUrl: `${window.location.origin}/api/payments/success?sessionId={CHECKOUT_SESSION_ID}&appointmentId=${appointmentId}`,
          cancelUrl: `${window.location.origin}/api/payments/cancel?appointmentId=${appointmentId}`
        });
        window.location.href = url;
      } else {
        onBookingComplete(result);
        setIsSuccess(true);
      }
    } catch (err) {
      console.error("Booking failed", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const askAi = async () => {
    if (!aiInput.trim()) return;
    const userText = aiInput;
    setAiInput("");
    setAiMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsAiTyping(true);
    
    const reply = await geminiAssistant.answerClientQuestion(
      userText, 
      selectedService?.name || "General Inquiry", 
      businessName
    );
    
    setAiMessages(prev => [...prev, { role: 'ai', text: reply }]);
    setIsAiTyping(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4">
         <div className="w-16 h-16 bg-brand-blue rounded-2xl flex items-center justify-center text-white shadow-xl animate-pulse">
            <Radio size={32} />
         </div>
         <h2 className="text-slate-900 text-sm font-bold tracking-widest uppercase">Loading Booking Page...</h2>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6">
          <Check size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Confirmed</h2>
        <p className="text-slate-500 mb-8">You are scheduled with {businessName}.</p>
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-left w-full max-w-md mb-8">
           <h3 className="font-bold text-slate-900 mb-4">{selectedService?.name}</h3>
           <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                 <Calendar size={16} className="text-slate-400" />
                 {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                 <Clock size={16} className="text-slate-400" />
                 {selectedTime}, {selectedService?.duration} min
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                 <Globe2 size={16} className="text-slate-400" />
                 {timezone}
              </div>
           </div>
        </div>
        <div className="flex gap-4">
           <button className="px-6 py-2 bg-slate-900 text-white rounded-full text-sm font-bold shadow-md">Add to Calendar</button>
           <button onClick={onBack} className="px-6 py-2 border border-slate-200 rounded-full text-sm font-bold text-slate-500">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center p-4">
      {/* AI Float Button */}
      <button 
        onClick={() => setShowAi(!showAi)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-brand-blue text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-[100]"
      >
        {showAi ? <X size={24} /> : <Sparkles size={24} />}
      </button>

      {/* AI Inquiry Drawer */}
      {showAi && (
        <div className="fixed bottom-24 right-8 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-[100] animate-in slide-in-from-bottom-4">
           <div className="bg-brand-blue p-4 text-white">
              <h4 className="font-bold flex items-center gap-2 text-sm"><Sparkles size={14} /> AI Booking Concierge</h4>
              <p className="text-[10px] opacity-80">Ask anything about this session</p>
           </div>
           <div className="h-64 overflow-y-auto p-4 space-y-4 text-xs scroll-smooth">
              {aiMessages.length === 0 && (
                <p className="text-slate-400 italic">"What should I prepare for the meeting?"</p>
              )}
              {aiMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[80%] p-2.5 rounded-xl ${m.role === 'user' ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-700'}`}>
                      {m.text}
                   </div>
                </div>
              ))}
              {isAiTyping && <div className="text-slate-400 text-[10px] animate-pulse">Assistant is thinking...</div>}
           </div>
           <div className="p-3 border-t border-slate-100 flex gap-2">
              <input 
                className="flex-1 bg-slate-50 rounded-lg px-3 py-2 text-xs outline-none"
                placeholder="Type your question..."
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && askAi()}
              />
              <button onClick={askAi} className="p-2 bg-brand-blue text-white rounded-lg"><Send size={14} /></button>
           </div>
        </div>
      )}

      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col md:flex-row min-h-[640px] animate-in zoom-in-95 duration-700">
        
        {/* Left Side: Summary & Branding */}
        <div className="w-full md:w-[360px] border-b md:border-b-0 md:border-r border-slate-100 p-10 bg-white">
          <button onClick={() => { if(step > 1) setStep(step - 1); else onBack?.(); }} className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 mb-10 transition-all">
            <ArrowLeft size={18} />
          </button>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-brand-blue rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-brand-blue/20">
                {businessName.charAt(0)}
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{businessName}</p>
                <h1 className="text-2xl font-black text-slate-900">{selectedService?.name || 'Schedule Time'}</h1>
              </div>
            </div>

            {selectedService && (
              <div className="space-y-5 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-3 text-slate-600 font-bold text-sm">
                  <Clock size={18} className="text-slate-300" />
                  {selectedService.duration} Minutes
                </div>
                <div className="flex items-center gap-3 text-slate-600 font-bold text-sm">
                  <Globe size={18} className="text-slate-300" />
                  Online Meeting (Zoom/Meet)
                </div>
                {selectedDate && (
                  <div className="flex items-start gap-3 text-brand-blue font-bold text-sm animate-in fade-in">
                    <Calendar size={18} className="text-brand-blue/40" />
                    <div>
                      <span>{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                      {selectedTime && <span className="block text-brand-dark opacity-70 mt-0.5">{selectedTime}</span>}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 text-emerald-600 font-bold text-sm">
                  <Zap size={18} className="text-emerald-400" />
                  {symbol}{selectedService.price} Standard Fee
                </div>
              </div>
            )}
            
            <div className="pt-10">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-3">Service Timezone</p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold text-slate-600">
                <Globe2 size={12} /> {timezone}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Step Contents */}
        <div className="flex-1 p-10 bg-[#fdfdfd] overflow-y-auto custom-scroll relative">
          
          {/* Step 1: Service Selection */}
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">What session works for you?</h2>
                <p className="text-sm text-slate-500 mt-1">Select the event type you'd like to book with us.</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                 {services.map(s => (
                   <button 
                    key={s.name} 
                    onClick={() => { setSelectedService(s); setStep(2); }}
                    className="p-8 bg-white border border-slate-200 rounded-2xl hover:border-brand-blue hover:shadow-xl hover:shadow-brand-blue/5 transition-all text-left group flex items-center justify-between"
                   >
                     <div className="flex items-center gap-6">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: s.color }} />
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-blue transition-colors">{s.name}</h3>
                          <p className="text-sm text-slate-400 font-medium">{s.duration} min • {symbol}{s.price}</p>
                        </div>
                     </div>
                     <ChevronRight className="text-slate-300 group-hover:text-brand-blue group-hover:translate-x-1 transition-all" size={24} />
                   </button>
                 ))}
              </div>
            </div>
          )}

          {/* Step 2: Date & Time Selection */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-700">
               <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Choose your time</h2>
               <div className="flex flex-col lg:flex-row gap-12">
                  <div className="flex-1">
                     <div className="flex justify-between items-center mb-6">
                        <h4 className="font-bold text-slate-800">May 2024</h4>
                        <div className="flex gap-2">
                           <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><ArrowLeft size={16} /></button>
                           <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><ArrowRight size={16} /></button>
                        </div>
                     </div>
                     <div className="grid grid-cols-7 gap-2 text-center mb-4">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                          <span key={d} className="text-[10px] font-black text-slate-300 tracking-widest">{d}</span>
                        ))}
                     </div>
                     <div className="grid grid-cols-7 gap-2">
                        {Array.from({length: 31}).map((_, i) => {
                          const date = `2024-05-${String(i+1).padStart(2, '0')}`;
                          const isSelected = selectedDate === date;
                          const isAvailable = i % 3 !== 0; // Simulated availability
                          return (
                            <button 
                              key={i} 
                              disabled={!isAvailable}
                              onClick={() => setSelectedDate(date)}
                              className={`h-12 w-full rounded-2xl text-sm font-bold transition-all flex items-center justify-center relative ${
                                !isAvailable ? 'text-slate-200 cursor-not-allowed' :
                                isSelected ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/30 scale-105' : 
                                'bg-slate-50 hover:bg-brand-blue/10 text-brand-blue'
                              }`}
                            >
                              {i + 1}
                              {isAvailable && !isSelected && <div className="absolute bottom-2 w-1 h-1 bg-brand-blue rounded-full opacity-40" />}
                            </button>
                          );
                        })}
                     </div>
                  </div>

                  {selectedDate && (
                    <div className="w-full lg:w-56 space-y-3 animate-in fade-in zoom-in-95">
                       <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                       <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scroll">
                          {['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'].map(time => (
                            <div key={time} className="flex flex-col gap-2">
                               <button 
                                onClick={() => { setSelectedTime(time); }}
                                className={`w-full py-4 border-2 font-black rounded-2xl text-sm transition-all ${selectedTime === time ? 'bg-slate-800 text-white border-slate-800 scale-[0.98]' : 'border-brand-blue/30 text-brand-blue hover:border-brand-blue'}`}
                               >
                                  {time}
                               </button>
                               {selectedTime === time && (
                                 <button 
                                  onClick={() => setStep(3)}
                                  className="w-full py-4 bg-brand-blue text-white font-black rounded-2xl text-sm shadow-xl shadow-brand-blue/20 animate-in slide-in-from-top-2"
                                 >
                                   Confirm Time
                                 </button>
                               )}
                            </div>
                          ))}
                       </div>
                    </div>
                  )}
               </div>
            </div>
          )}

          {/* Step 3: Confirmation Details */}
          {step === 3 && (
            <div className="max-w-md mx-auto space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
               <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Complete your booking</h2>
                  <p className="text-sm text-slate-500 mt-1">We'll send you a calendar invite with all the details.</p>
               </div>

               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Your Full Name *</label>
                    <input 
                      className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:border-brand-blue outline-none transition-all placeholder:text-slate-300"
                      placeholder="Jane Doe"
                      value={clientInfo.name}
                      onChange={e => setClientInfo({...clientInfo, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address *</label>
                    <input 
                      type="email"
                      className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:border-brand-blue outline-none transition-all placeholder:text-slate-300"
                      placeholder="jane@company.com"
                      value={clientInfo.email}
                      onChange={e => setClientInfo({...clientInfo, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Additional Notes</label>
                    <textarea 
                      rows={4}
                      className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:border-brand-blue outline-none transition-all placeholder:text-slate-300 resize-none"
                      placeholder="Share anything that will help prepare for our meeting..."
                      value={clientInfo.note}
                      onChange={e => setClientInfo({...clientInfo, note: e.target.value})}
                    />
                  </div>
               </div>
               
               <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    By confirming this booking, you agree to our <span className="text-brand-blue font-bold cursor-pointer">Terms of Service</span> and <span className="text-brand-blue font-bold cursor-pointer">Privacy Policy</span>. Your data is handled securely via EasyBookly.
                  </p>
               </div>

               <button 
                onClick={handleBook}
                disabled={isSubmitting || !clientInfo.name || !clientInfo.email}
                className="w-full py-5 bg-brand-blue text-white rounded-3xl font-black text-lg shadow-2xl shadow-brand-blue/30 hover:bg-brand-dark transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
               >
                 {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : 'Complete Booking'}
                 {!isSubmitting && <ArrowRight size={20} />}
               </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-12 flex items-center gap-3 py-2 px-4 bg-white/50 backdrop-blur-md rounded-full border border-white/20 text-slate-400 hover:text-slate-600 transition-all cursor-pointer">
        <ShieldCheck size={16} className="text-emerald-500" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Verified Secure by EasyBookly Scheduling</span>
      </div>
    </div>
  );
};

export default PublicBookingPage;
