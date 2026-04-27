
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronRight, CheckCircle2, User, Phone, ShieldCheck, Check, Globe, Loader2, Lock, Languages, Info, ArrowLeft, ArrowRight, CalendarDays, Star, Zap, Users, Shield, MessageSquareText, Globe2, Sparkles, Send, X, Radio, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { Service } from '../types';
import Logo from './Logo';
import { geminiAssistant } from '../services/geminiService';
import { paymentService } from '@/services/paymentService';
import PaymentErrorModal from '@/components/PaymentErrorModal';
import { Language, translations } from '../services/translations';
import LanguageSwitcher from './LanguageSwitcher';

interface PublicBookingPageProps {
  userId?: string;
  businessName?: string;
  businessTimezone?: string;
  services?: Service[];
  legalData?: { privacyPolicy: string; termsOfService: string; gdprStrict: boolean };
  currency?: 'ILS' | 'USD' | 'EUR' | 'GBP';
  onBookingComplete: (booking: any) => void;
  onBack?: () => void;
}

const PublicBookingPage: React.FC<PublicBookingPageProps> = ({ 
  userId: propUserId,
  businessName: initialBusinessName, 
  businessTimezone: initialBusinessTimezone,
  services: initialServices, 
  legalData: initialLegalData, 
  currency: initialCurrency, 
  onBookingComplete, 
  onBack 
}) => {
  const [userId, setUserId] = useState(propUserId || 'default');
  const [businessName, setBusinessName] = useState(initialBusinessName || '');
  const [businessTimezone, setBusinessTimezone] = useState(initialBusinessTimezone || 'UTC');
  const [services, setServices] = useState<Service[]>(initialServices || []);
  const [legalData, setLegalData] = useState(initialLegalData || { privacyPolicy: '', termsOfService: '', gdprStrict: true });
  const [currency, setCurrency] = useState<'ILS' | 'USD' | 'EUR' | 'GBP'>(initialCurrency || 'USD');
  const [isLoading, setIsLoading] = useState(!initialBusinessName);
  const [language, setLanguage] = useState<Language>('en');

  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState("");
  const [clientInfo, setClientInfo] = useState({ name: '', email: '', phone: '', note: '', meetingLink: '', meetingPassword: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmedMeetingLink, setConfirmedMeetingLink] = useState<string | null>(null);
  const [confirmedMeetingPassword, setConfirmedMeetingPassword] = useState<string | null>(null);
  const [gatewayError, setGatewayError] = useState<{error: string, details: string, hint: string, version?: string} | null>(null);
  
  // AI Concierge State
  const [showAi, setShowAi] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState<{role: 'ai' | 'user', text: string}[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  const [showLegalModal, setShowLegalModal] = useState<'privacy' | 'terms' | null>(null);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const symbol = { ILS: '₪', USD: '$', EUR: '€', GBP: '£' }[currency];
  const t = translations[language] || translations.en;

  const formatInTimezone = (timeStr: string, dateStr: string, targetTz: string) => {
    try {
      const d = new Date(`${dateStr}T${timeStr}:00`);
      const invDate = new Date(d.toLocaleString('en-US', { timeZone: businessTimezone }));
      const diff = invDate.getTime() - d.getTime();
      const actualBusinessDate = new Date(d.getTime() - diff);
      
      return actualBusinessDate.toLocaleTimeString('en-US', {
        timeZone: targetTz,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch(e) {
      return timeStr;
    }
  };

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
            setBusinessTimezone(data.timezone || 'UTC');
            setLanguage((data as any).language || 'en');
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
    if (selectedDate && userId) {
      const fetchSlots = async () => {
        const slots = await api.system.checkAvailability(userId, selectedDate);
        setAvailableSlots(slots);
      };
      fetchSlots();
    }
  }, [selectedDate, userId]);

  const handleBook = async () => {
    if (!selectedService) return;
    setIsSubmitting(true);
    
    // Server will handle meetingLink generation if locationType is online or zoom
    const locationType = selectedService.locationType || 'office';

    try {
      // Create the appointment using the public API endpoint
      const result = await api.appointments.create({ 
        id: Math.random().toString(36).substr(2, 9), 
        userId: userId, 
        clientId: 'public-' + Date.now(),
        clientName: clientInfo.name, 
        service: selectedService.name, 
        date: selectedDate, 
        time: selectedTime, 
        duration: selectedService.duration, 
        status: selectedService.price > 0 ? 'pending' : 'confirmed', 
        price: selectedService.price,
        locationType: locationType,
        clientTimezone: timezone,
        businessTimezone: businessTimezone,
        clientEmail: clientInfo.email, // Added for notification
        clientPhone: clientInfo.phone, // Added for notification
        note: clientInfo.note,
        meetingLink: clientInfo.meetingLink,
        meetingPassword: clientInfo.meetingPassword,
      } as any);

      setConfirmedMeetingLink(result.meetingLink || clientInfo.meetingLink || null);
      setConfirmedMeetingPassword(result.meetingPassword || clientInfo.meetingPassword || null);
      onBookingComplete(result);
      setIsSuccess(true);
    } catch (err: any) {
      console.error("Booking failed", err);
      setGatewayError({
        error: err.error || "Booking failed",
        details: err.details || err.message || "Unknown error",
        hint: err.hint || "",
        version: err.version
      });
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
         <div className="animate-pulse">
            <Logo size="xl" showText={false} />
         </div>
         <Logo size="md" className="justify-center" />
      </div>
    );
  }

  if (isSuccess) {
    const generateGoogleCalendarUrl = () => {
      if (!selectedService || !selectedDate || !selectedTime) return '';
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startDate = new Date(selectedDate);
      startDate.setHours(hours, minutes);
      const endDate = new Date(startDate.getTime() + selectedService.duration * 60000);
      
      const format = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '').split('.')[0] + 'Z';
      const startStr = format(startDate);
      const endStr = format(endDate);
      
      const details = `Booking with ${businessName}. ${confirmedMeetingLink ? `Join here: ${confirmedMeetingLink}` : ''}`;
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(selectedService.name)}&dates=${startStr}/${endStr}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(confirmedMeetingLink || 'Virtual')}`;
    };

    const downloadIcs = () => {
      if (!selectedService || !selectedDate || !selectedTime) return;
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startDate = new Date(selectedDate);
      startDate.setHours(hours, minutes);
      const endDate = new Date(startDate.getTime() + selectedService.duration * 60000);

      const format = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '').split('.')[0] + 'Z';
      const startStr = format(startDate);
      const endStr = format(endDate);

      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        `DTSTART:${startStr}`,
        `DTEND:${endStr}`,
        `SUMMARY:${selectedService.name}`,
        `DESCRIPTION:Booking with ${businessName}`,
        `LOCATION:${confirmedMeetingLink || 'Virtual'}`,
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\n');

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', 'booking.ics');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in" dir={t.dir}>
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6">
          <Check size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{t.confirmed}</h2>
        <p className="text-slate-500 mb-8">{t.scheduledWith} {businessName}.</p>
        
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-left w-full max-w-md mb-8" dir={t.dir}>
           <h3 className="font-bold text-slate-900 mb-4">{selectedService?.name}</h3>
           <div className="space-y-3">
              <div className={`flex items-center gap-3 text-sm text-slate-600 ${t.dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                 <Calendar size={16} className="text-slate-400" />
                 {new Date(selectedDate).toLocaleDateString(language === 'en' ? 'en-US' : language, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="flex flex-col gap-1">
                <div className={`flex items-center gap-3 text-sm text-slate-600 ${t.dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                   <Clock size={16} className="text-slate-400" />
                   {formatInTimezone(selectedTime, selectedDate, timezone)}, {selectedService?.duration} {t.minutes}
                </div>
                {businessTimezone !== timezone && (
                  <div className={`${t.dir === 'rtl' ? 'mr-7' : 'ml-7'} text-[10px] text-slate-400 font-medium`}>
                    ({selectedTime} {businessTimezone} - Business Time)
                  </div>
                )}
              </div>

                         {(selectedService?.locationType === 'online' || selectedService?.locationType === 'zoom') && (
                <div className="mt-4 p-4 bg-brand-blue/5 border border-brand-blue/10 rounded-xl space-y-2">
                   <div className={`flex items-center gap-2 text-brand-blue text-[10px] font-black uppercase tracking-widest ${t.dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                      <Video size={14} /> {t.virtualMeetingRoom}
                   </div>
                   <div className={`flex items-center justify-between ${t.dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs font-bold text-slate-600 truncate mr-4">{confirmedMeetingLink || t.linkGenFailed}</span>
                      <button 
                        onClick={() => {
                          if (confirmedMeetingLink) navigator.clipboard.writeText(confirmedMeetingLink);
                        }}
                        className="text-[10px] font-black text-brand-blue uppercase bg-white px-3 py-1 rounded-md border border-brand-blue/10 hover:bg-brand-blue/5 transition-all"
                      >
                        {t.copy}
                      </button>
                   </div>
                   {confirmedMeetingPassword && (
                     <div className={`text-[10px] font-bold text-slate-400 ${t.dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                       {t.meetingPassword}: <span className="text-slate-600">{confirmedMeetingPassword}</span>
                     </div>
                   )}
                </div>
              )}
           </div>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
           <a 
            href={generateGoogleCalendarUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
           >
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" className="w-5 h-5" alt="Google" referrerPolicy="no-referrer" />
            Add to Google Calendar
           </a>
           
           <button 
            onClick={downloadIcs}
            className="w-full py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
           >
            <Calendar size={20} className="text-brand-blue" />
            Download iCal File
           </button>

           <button 
            onClick={() => onBack ? onBack() : window.location.href = '/'} 
            className="mt-4 text-slate-400 hover:text-slate-900 transition-colors text-sm font-bold uppercase tracking-widest"
           >
            {t.close}
           </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center p-4 ${language === 'he' || language === 'ar' ? 'font-sans' : ''}`}
      dir={t.dir}
    >
      {/* Floating Language Switcher for Public Users */}
      <div className="fixed top-8 right-8 z-[110]">
         <LanguageSwitcher currentLanguage={language} onUpdateLanguage={setLanguage} />
      </div>

      {/* AI Float Button */}
      <button 
        onClick={() => setShowAi(!showAi)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-brand-blue text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-[100]"
      >
        {showAi ? <X size={24} /> : <Sparkles size={24} />}
      </button>

      {/* AI Inquiry Drawer */}
      {showAi && (
        <div className={`fixed bottom-24 ${t.dir === 'rtl' ? 'left-4 sm:left-8' : 'right-4 sm:right-8'} w-[calc(100%-32px)] sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-[100] animate-in slide-in-from-bottom-4`} dir={t.dir}>
           <div className="bg-brand-blue p-4 text-white">
              <h4 className="font-bold flex items-center gap-2 text-sm"><Sparkles size={14} /> {t.aiIntelligence}</h4>
              <p className="text-[10px] opacity-80">{t.aiInquirySubtitle}</p>
           </div>
           <div className="h-64 overflow-y-auto p-4 space-y-4 text-xs scroll-smooth">
              {aiMessages.length === 0 && (
                <p className="text-slate-400 italic">"{t.typeQuestion}"</p>
              )}
              {aiMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[80%] p-2.5 rounded-xl ${m.role === 'user' ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-700'}`}>
                      {m.text}
                   </div>
                </div>
              ))}
              {isAiTyping && <div className="text-slate-400 text-[10px] animate-pulse">{t.aiThinking}</div>}
           </div>
           <div className="p-3 border-t border-slate-100 flex gap-2">
              <input 
                className="flex-1 bg-slate-50 rounded-lg px-3 py-2 text-xs outline-none"
                placeholder={t.typeQuestion}
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && askAi()}
              />
              <button onClick={askAi} className="p-2 bg-brand-blue text-white rounded-lg"><Send size={14} className={t.dir === 'rtl' ? 'rotate-180' : ''} /></button>
           </div>
        </div>
      )}

      <PaymentErrorModal 
        isOpen={!!gatewayError}
        onClose={() => setGatewayError(null)}
        error={gatewayError?.error || ""}
        details={gatewayError?.details || ""}
        hint={gatewayError?.hint || ""}
        version={gatewayError?.version}
      />

      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col md:flex-row min-h-[640px] animate-in zoom-in-95 duration-700">
        
        {/* Left Side: Summary & Branding */}
        <div className={`w-full md:w-[360px] border-b md:border-b-0 ${t.dir === 'rtl' ? 'md:border-l' : 'md:border-r'} border-slate-100 p-6 md:p-10 bg-white`}>
          <div className="flex items-center gap-3 mb-6 md:mb-10">
            <button 
              onClick={() => { 
                if (step > 1) setStep(step - 1); 
                else if (onBack) onBack();
                else window.location.href = '/';
              }} 
              className="w-11 h-11 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all font-bold"
              title={t.goBack}
            >
              <ArrowLeft size={20} className={t.dir === 'rtl' ? 'rotate-180' : ''} />
            </button>
            {onBack && step === 1 && (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.returnToApp}</span>
            )}
          </div>
          
          <div className="space-y-6">
            <div className={`flex items-center gap-4 ${t.dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
              <Logo size="lg" showText={false} />
              <div className={t.dir === 'rtl' ? 'text-right' : 'text-left'}>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{businessName}</p>
                <h1 className="text-2xl font-black text-slate-900">{selectedService?.name || t.scheduleTime}</h1>
              </div>
            </div>

            {selectedService && (
              <div className="space-y-5 pt-4 border-t border-slate-50">
                <div className={`flex items-center gap-3 text-slate-600 font-bold text-sm ${t.dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                  <Clock size={18} className="text-slate-300" />
                  {selectedService.duration} {t.minutes}
                </div>
                <div className={`flex items-center gap-3 text-slate-600 font-bold text-sm ${t.dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                  <Video size={18} className="text-slate-300" />
                  {t.integratedVideo}
                </div>
                {selectedDate && (
                  <div className={`flex items-start gap-3 text-brand-blue font-bold text-sm animate-in fade-in ${t.dir === 'rtl' ? 'flex-row-reverse text-right' : ''}`}>
                    <Calendar size={18} className="text-brand-blue/40" />
                    <div>
                      <span>{new Date(selectedDate).toLocaleDateString(language === 'en' ? 'en-US' : language, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                      {selectedTime && <span className="block text-brand-dark opacity-70 mt-0.5">{selectedTime}</span>}
                    </div>
                  </div>
                )}
                <div className={`flex items-center gap-3 text-emerald-600 font-bold text-sm ${t.dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                  <Zap size={18} className="text-emerald-400" />
                  {symbol}{selectedService.price} {t.standardFee}
                </div>
              </div>
            )}
            

          </div>
        </div>

        {/* Right Side: Step Contents */}
        <div className="flex-1 p-6 md:p-10 bg-[#fdfdfd] overflow-y-auto custom-scroll relative">
          
          {/* Step 1: Service Selection */}
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
              <div className={t.dir === 'rtl' ? 'text-right' : 'text-left'}>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t.whatSessionWorks}</h2>
                <p className="text-sm text-slate-500 mt-1">{t.selectEventType}</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                 {services.map(s => (
                   <button 
                    key={s.name} 
                    onClick={() => { setSelectedService(s); setStep(2); }}
                    className={`p-8 bg-white border border-slate-200 rounded-2xl hover:border-brand-blue hover:shadow-xl hover:shadow-brand-blue/5 transition-all group flex items-center justify-between ${t.dir === 'rtl' ? 'flex-row-reverse text-right' : 'text-left'}`}
                   >
                     <div className={`flex items-center gap-6 ${t.dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: s.color }} />
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-blue transition-colors">{s.name}</h3>
                          <p className="text-sm text-slate-400 font-medium">{s.duration} {t.minutes} • {symbol}{s.price}</p>
                        </div>
                     </div>
                     <ChevronRight className={`text-slate-300 group-hover:text-brand-blue transition-all ${t.dir === 'rtl' ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} size={24} />
                   </button>
                 ))}
              </div>
            </div>
          )}
          {/* Step 2: Date & Time Selection */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-700">
               <h2 className={`text-2xl font-black text-slate-900 mb-8 tracking-tight ${t.dir === 'rtl' ? 'text-right' : ''}`}>{t.chooseYourTime}</h2>
               <div className={`flex flex-col lg:flex-row gap-8 lg:gap-12 ${t.dir === 'rtl' ? 'lg:flex-row-reverse' : ''}`}>
                  <div className="flex-1">
                     <div className={`flex justify-between items-center mb-6 ${t.dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                        <h4 className="font-bold text-slate-800">
                          {new Date(selectedDate || Date.now()).toLocaleDateString(language, { month: 'long', year: 'numeric' })}
                        </h4>
                        <div className={`flex gap-2 ${t.dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                           <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><ArrowLeft size={16} className={t.dir === 'rtl' ? 'rotate-180' : ''} /></button>
                           <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><ArrowRight size={16} className={t.dir === 'rtl' ? 'rotate-180' : ''} /></button>
                        </div>
                     </div>
                     <div className={`grid grid-cols-7 gap-2 text-center mb-4 ${t.dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                        {(t.dir === 'rtl' ? (language === 'he' ? ['ש', 'ו', 'ה', 'ד', 'ג', 'ב', 'א'] : ['ج', 'خ', 'ر', 'ث', 'ن', 'ح', 'س']) : ['S', 'M', 'T', 'W', 'T', 'F', 'S']).map(d => (
                           <span key={d} className="text-[10px] font-black text-slate-300 tracking-widest">{d}</span>
                        ))}
                     </div>
                     <div className="grid grid-cols-7 gap-1 sm:gap-2">
                        {Array.from({length: 31}).map((_, i) => {
                          const date = `2024-05-${String(i+1).padStart(2, '0')}`;
                          const isSelected = selectedDate === date;
                          const isAvailable = i % 3 !== 0; // Simulated availability
                          return (
                            <button 
                              key={i} 
                              disabled={!isAvailable}
                              onClick={() => setSelectedDate(date)}
                              className={`h-11 sm:h-12 w-full rounded-xl sm:rounded-2xl text-sm font-bold transition-all flex items-center justify-center relative ${
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
                       <p className={`text-xs font-black text-slate-400 uppercase tracking-widest mb-6 ${t.dir === 'rtl' ? 'text-right' : ''}`}>{new Date(selectedDate).toLocaleDateString(language, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                       <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scroll">
                          {(availableSlots.length > 0 ? availableSlots : ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']).map(time => {
                             const clientTime = formatInTimezone(time, selectedDate, timezone);
                             const isDifferentTz = businessTimezone !== timezone;
                             return (
                               <div key={time} className="flex flex-col gap-2">
                                  <button 
                                   onClick={() => { setSelectedTime(time); }}
                                   className={`w-full py-4 px-4 border-2 font-black rounded-2xl transition-all flex justify-between items-center ${t.dir === 'rtl' ? 'flex-row-reverse text-right' : 'text-left'} ${selectedTime === time ? 'bg-slate-800 text-white border-slate-800 scale-[0.98]' : 'border-brand-blue/30 text-brand-blue hover:border-brand-blue'}`}
                                  >
                                     <div className={`flex flex-col ${t.dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                        <span className="text-sm">{clientTime}</span>
                                        {isDifferentTz && (
                                          <span className="text-[10px] opacity-60 font-medium">({time} Business Local)</span>
                                        )}
                                     </div>
                                     {selectedTime === time && <Check size={16} />}
                                  </button>
                                  {selectedTime === time && (
                                    <button 
                                     onClick={() => setStep(3)}
                                     className="w-full py-4 bg-brand-blue text-white font-black rounded-2xl text-sm shadow-xl shadow-brand-blue/20 animate-in slide-in-from-top-2"
                                    >
                                      {t.confirmTime}
                                    </button>
                                  )}
                               </div>
                             );
                          })}
                       </div>
                    </div>
                  )}
               </div>
            </div>
          )}

          {/* Step 3: Confirmation Details */}
          {step === 3 && (
            <div className={`max-w-md mx-auto space-y-10 animate-in fade-in slide-in-from-right-8 duration-700 ${t.dir === 'rtl' ? 'text-right' : ''}`}>
               <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t.completeBooking}</h2>
                  <p className="text-sm text-slate-500 mt-1">{t.calendarInviteNotice}</p>
               </div>

               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className={`text-[10px] font-black text-slate-400 uppercase tracking-widest ${t.dir === 'rtl' ? 'mr-1' : 'ml-1'}`}>{t.fullName}</label>
                    <input 
                      className={`w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 text-base sm:text-sm font-bold focus:border-brand-blue outline-none transition-all placeholder:text-slate-300 ${t.dir === 'rtl' ? 'text-right' : 'text-left'}`}
                      placeholder="Jane Doe"
                      value={clientInfo.name}
                      onChange={e => setClientInfo({...clientInfo, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-[10px] font-black text-slate-400 uppercase tracking-widest ${t.dir === 'rtl' ? 'mr-1' : 'ml-1'}`}>{t.emailAddress}</label>
                    <input 
                      type="email"
                      className={`w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 text-base sm:text-sm font-bold focus:border-brand-blue outline-none transition-all placeholder:text-slate-300 ${t.dir === 'rtl' ? 'text-right' : 'text-left'}`}
                      placeholder="jane@company.com"
                      value={clientInfo.email}
                      onChange={e => setClientInfo({...clientInfo, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-[10px] font-black text-slate-400 uppercase tracking-widest ${t.dir === 'rtl' ? 'mr-1' : 'ml-1'}`}>{t.additionalNotes}</label>
                    <textarea 
                      rows={4}
                      className={`w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 text-base sm:text-sm font-bold focus:border-brand-blue outline-none transition-all placeholder:text-slate-300 resize-none ${t.dir === 'rtl' ? 'text-right' : 'text-left'}`}
                      placeholder={t.sharedNotePlaceholder}
                      value={clientInfo.note}
                      onChange={e => setClientInfo({...clientInfo, note: e.target.value})}
                    />
                  </div>

                  {(selectedService?.locationType === 'online' || selectedService?.locationType === 'zoom') && (
                    <div className="space-y-6 pt-6 border-t border-slate-100">
                       <div className={`flex items-center gap-2 text-brand-blue text-[10px] font-black uppercase tracking-widest mb-2 ${t.dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                          <Video size={14} /> {t.meetingDetails}
                       </div>
                       <div className="space-y-2">
                        <label className={`text-[10px] font-black text-slate-400 uppercase tracking-widest ${t.dir === 'rtl' ? 'mr-1' : 'ml-1'}`}>{t.meetingLink}</label>
                        <input 
                          className={`w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 text-base sm:text-sm font-bold focus:border-brand-blue outline-none transition-all placeholder:text-slate-300 ${t.dir === 'rtl' ? 'text-right' : 'text-left'}`}
                          placeholder={t.meetingLinkPlaceholder}
                          value={clientInfo.meetingLink}
                          onChange={e => setClientInfo({...clientInfo, meetingLink: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className={`text-[10px] font-black text-slate-400 uppercase tracking-widest ${t.dir === 'rtl' ? 'mr-1' : 'ml-1'}`}>{t.meetingPassword}</label>
                        <input 
                          className={`w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 text-base sm:text-sm font-bold focus:border-brand-blue outline-none transition-all placeholder:text-slate-300 ${t.dir === 'rtl' ? 'text-right' : 'text-left'}`}
                          placeholder={t.meetingPasswordPlaceholder}
                          value={clientInfo.meetingPassword}
                          onChange={e => setClientInfo({...clientInfo, meetingPassword: e.target.value})}
                        />
                      </div>
                    </div>
                  )}
               </div>
               
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                   <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                     {t.agreeToTerms} <span onClick={() => setShowLegalModal('terms')} className="text-brand-blue font-bold cursor-pointer transition-all hover:underline">{t.termsOfService}</span> {language === 'en' ? 'and' : ''} <span onClick={() => setShowLegalModal('privacy')} className="text-brand-blue font-bold cursor-pointer transition-all hover:underline">{t.privacyPolicy}</span>. {t.dataSecureNotice}
                   </p>
                </div>

                <AnimatePresence>
                  {showLegalModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" dir={t.dir}>
                       <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-[32px] w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
                       >
                          <div className={`p-8 border-b border-slate-100 flex items-center justify-between ${t.dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                             <h3 className="text-2xl font-black text-brand-dark tracking-tight">
                                {showLegalModal === 'terms' ? t.termsOfService : t.privacyPolicy}
                             </h3>
                             <button onClick={() => setShowLegalModal(null)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400"><X size={24} /></button>
                          </div>
                          <div className={`p-10 overflow-y-auto custom-scroll ${t.dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                             <div className="prose prose-slate max-w-none">
                                <p className="text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
                                   {showLegalModal === 'terms' ? legalData.termsOfService : legalData.privacyPolicy}
                                   {(!legalData.termsOfService && showLegalModal === 'terms') && "Standard Terms of Service for " + businessName + ". By booking, you agree to attend at the scheduled time."}
                                   {(!legalData.privacyPolicy && showLegalModal === 'privacy') && "Standard Privacy Policy for " + businessName + ". We respect your privacy and only use your data for booking purposes."}
                                </p>
                             </div>
                          </div>
                          <div className="p-8 border-t border-slate-50 bg-slate-50/50">
                             <button onClick={() => setShowLegalModal(null)} className="w-full py-4 bg-brand-blue text-white rounded-2xl font-black text-sm shadow-xl shadow-brand-blue/20">{t.iUnderstand}</button>
                          </div>
                       </motion.div>
                    </div>
                  )}
                </AnimatePresence>

               <button 
                onClick={handleBook}
                disabled={isSubmitting || !clientInfo.name || !clientInfo.email}
                className="w-full py-5 bg-brand-blue text-white rounded-3xl font-black text-lg shadow-2xl shadow-brand-blue/30 hover:bg-brand-dark transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
               >
                 {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : t.completeBookingBtn}
                 {!isSubmitting && <ArrowRight size={20} className={t.dir === 'rtl' ? 'rotate-180' : ''} />}
               </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-12 flex flex-col items-center gap-6 px-4">
        <div className={`flex flex-col sm:flex-row items-center gap-3 py-4 sm:py-2.5 px-8 sm:px-6 bg-white border border-slate-200 rounded-[28px] sm:rounded-full shadow-sm hover:shadow-xl hover:border-brand-blue/30 transition-all group cursor-pointer ${t.dir === 'rtl' ? 'flex-row-reverse' : ''}`} onClick={() => window.open('https://easybookly.com', '_blank')}>
          <div className={`flex items-center gap-2 ${t.dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
            <Logo size="sm" />
            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 group-hover:text-brand-blue transition-colors text-center">{t.createOwnPage}</span>
          <ChevronRight size={14} className={`text-slate-300 group-hover:text-brand-blue transition-all hidden sm:block ${t.dir === 'rtl' ? 'rotate-180 group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'}`} />
        </div>
        
        <div className={`flex items-center gap-3 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] opacity-50 ${t.dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
          <ShieldCheck size={14} /> {t.verifiedSecure}
        </div>
      </div>
    </div>
  );
};

export default PublicBookingPage;
