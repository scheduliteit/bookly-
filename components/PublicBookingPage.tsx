
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronRight, CheckCircle2, User, Phone, ShieldCheck, Check, Globe, Loader2, Lock, Languages, Info, ArrowLeft, ArrowRight, CalendarDays, Star, Zap, Users, Shield, MessageSquareText, Globe2, Sparkles, Send, X, Radio, Video, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { db, doc, onSnapshot } from '../firebase';
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
  const [notFound, setNotFound] = useState(false);
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
      setIsLoading(true);
      setNotFound(false);
      console.log(`[PUBLIC-BOOKING] Starting real-time sync for userId: ${userId}`);
      
      // Real-time sync for public profile
      const unsubPublic = onSnapshot(doc(db, 'public_profiles', userId), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log(`[PUBLIC-BOOKING] Received public profile sync for ${userId}:`, data);
          setBusinessName(data.businessName || 'Consultant');
          setServices(data.services || []);
          setLegalData(data.legalData || { privacyPolicy: '', termsOfService: '', gdprStrict: true });
          setCurrency(data.currency || 'USD');
          setBusinessTimezone(data.timezone || 'UTC');
          setLanguage((data as any).language || 'en');
          setIsLoading(false);
          setNotFound(false);
        } else {
          // Fallback to users collection if public_profile doesn't exist yet
          console.log(`[PUBLIC-BOOKING] Public profile ${userId} not found. Trying users collection sync...`);
          const unsubUser = onSnapshot(doc(db, 'users', userId), (userSnap) => {
             if (userSnap.exists()) {
                const userData = userSnap.data();
                console.log(`[PUBLIC-BOOKING] Received user profile sync for ${userId}:`, userData);
                setBusinessName(userData.businessName || 'Consultant');
                setServices(userData.services || []);
                setLegalData(userData.legalData || { privacyPolicy: '', termsOfService: '', gdprStrict: true });
                setCurrency(userData.currency || 'USD');
                setBusinessTimezone(userData.timezone || 'UTC');
                setLanguage((userData as any).language || 'en');
                setNotFound(false);
             } else {
                console.warn(`[PUBLIC-BOOKING] No user document found for ${userId}`);
                setNotFound(true);
             }
             setIsLoading(false);
          }, (err) => {
             console.error("[PUBLIC-BOOKING] Error syncing user collection:", err);
             setNotFound(true);
             setIsLoading(false);
          });
          return () => unsubUser();
        }
      }, (err) => {
        console.error("[PUBLIC-BOOKING] Error syncing public profile:", err);
        setNotFound(true);
        setIsLoading(false);
      });

      return () => {
        unsubPublic();
      };
    } else if (initialBusinessName) {
      console.log("[PUBLIC-BOOKING] Initialized with props data");
      setNotFound(false);
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

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const calendarDays = (() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysCount = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];
    
    // Padding for first week
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysCount; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  })();

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));

  const isSelected = (day: Date | null) => {
    if (!day || !selectedDate) return false;
    return day.toISOString().split('T')[0] === selectedDate;
  };

  const isToday = (day: Date | null) => {
    if (!day) return false;
    return day.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
  };

  const isPast = (day: Date | null) => {
    if (!day) return true;
    const today = new Date();
    today.setHours(0,0,0,0);
    return day < today;
  };

  if (notFound) {
    return (
       <div className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center p-8 text-center" dir={t.dir}>
          <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-300 mb-6">
             <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">{language === 'he' ? 'פרופיל לא נמצא' : language === 'ar' ? 'الملف الشخصي غير موجود' : 'Profile Not Found'}</h2>
          <p className="text-slate-500 max-w-xs mb-8">
            {language === 'he' ? 'דף ההזמנות שחיפשת אינו קיים או שהוא פרטי כרגע.' : language === 'ar' ? 'صفحة الحجز التي تبحث عنها غير موجودة أو أنها خاصة حاليًا.' : 'The booking page you\'re looking for doesn\'t exist or is currently private.'}
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-8 py-3 bg-brand-blue text-white rounded-full font-black text-sm uppercase tracking-widest shadow-lg shadow-brand-blue/20"
          >
            {t.returnToApp || 'Go to Homepage'}
          </button>
       </div>
    );
  }

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
      <div className="min-h-screen bg-[#fcfcfc] flex flex-col items-center justify-center p-6 animate-in fade-in duration-1000" dir={t.dir}>
        <div className="w-full max-w-xl bg-white rounded-[40px] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-2 bg-emerald-500" />
          
          <div className="p-10 md:p-16 text-center space-y-10">
            <div className="space-y-4">
              <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[32px] flex items-center justify-center mx-auto rotate-12 group-hover:rotate-0 transition-transform">
                <Check size={48} strokeWidth={3} />
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">{t.confirmed}</h2>
              <p className="text-slate-500 font-medium max-w-sm mx-auto">
                {t.scheduledWith} <span className="text-slate-900 font-black">{businessName}</span>. A confirmation has been sent to your email.
              </p>
            </div>

            <div className="bg-slate-50/80 backdrop-blur-sm p-8 rounded-[32px] border border-slate-100 text-left space-y-6" dir={t.dir}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900">{selectedService?.name}</h3>
                <div className="px-3 py-1 bg-white rounded-full text-[10px] font-black text-brand-blue border border-brand-blue/10 uppercase tracking-widest">
                  {symbol}{selectedService?.price}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className={`flex items-start gap-3 text-sm text-slate-600 ${t.dir === 'rtl' ? 'flex-row-reverse text-right' : ''}`}>
                    <Calendar size={18} className="text-slate-300 shrink-0" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Date</p>
                      <p className="font-bold">{new Date(selectedDate).toLocaleDateString(language, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className={`flex items-start gap-3 text-sm text-slate-600 ${t.dir === 'rtl' ? 'flex-row-reverse text-right' : ''}`}>
                    <Clock size={18} className="text-slate-300 shrink-0" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Time</p>
                      <p className="font-bold">{formatInTimezone(selectedTime, selectedDate, timezone)} <span className="text-slate-400 font-medium">({selectedService?.duration} min)</span></p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {(selectedService?.locationType === 'online' || selectedService?.locationType === 'zoom') && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest mb-1">{t.virtualMeetingRoom}</p>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => confirmedMeetingLink && window.open(confirmedMeetingLink, '_blank')}
                          className="flex-1 py-3 px-4 bg-brand-blue text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-brand-blue/20"
                        >
                          Join Meeting
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => window.open(generateGoogleCalendarUrl(), '_blank')}
                  className="py-5 bg-white border-2 border-slate-100 text-slate-900 rounded-[24px] text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:border-slate-900 transition-all group"
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" className="w-5 h-5 group-hover:scale-110 transition-transform" alt="Google" referrerPolicy="no-referrer" />
                  Google
                </button>
                <button 
                  onClick={downloadIcs}
                  className="py-5 bg-white border-2 border-slate-100 text-slate-900 rounded-[24px] text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:border-slate-900 transition-all group"
                >
                  <Calendar size={20} className="text-brand-blue group-hover:scale-110 transition-transform" />
                  iCal
                </button>
              </div>
              <button 
                onClick={() => {
                  if (onBack) onBack();
                  else window.location.href = '/';
                }} 
                className="py-6 px-10 bg-slate-900 text-white rounded-3xl text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:scale-105 transition-all"
              >
                {t.returnToApp || 'Return to App'}
              </button>
              <button 
                onClick={() => setIsSuccess(false)} 
                className="py-4 text-slate-400 hover:text-slate-900 transition-colors text-[10px] font-black uppercase tracking-[0.3em]"
              >
                {t.close || 'Close'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 flex items-center gap-3 px-6 py-3 bg-white border border-slate-100 rounded-full shadow-sm text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <ShieldCheck size={14} className="text-emerald-500" /> Securely processed by EasyBookly AI
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
              className="group flex items-center gap-3 py-2 px-3 -ml-3 rounded-2xl hover:bg-slate-50 transition-all text-left"
              title={t.goBack}
            >
              <div className="w-11 h-11 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-all bg-white font-bold">
                <ArrowLeft size={20} className={t.dir === 'rtl' ? 'rotate-180' : ''} />
              </div>
              {onBack && step === 1 && (
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest">{t.returnToApp}</span>
                  <span className="text-xs font-medium text-slate-400 capitalize whitespace-nowrap">Dashboard</span>
                </div>
              )}
            </button>
          </div>
          
          <div className="space-y-6">
            <div className={`flex items-center gap-4 ${t.dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
              <Logo size="lg" showText={false} />
              <div className={t.dir === 'rtl' ? 'text-right' : 'text-left'}>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{businessName || 'Business Portal'}</p>
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
          
          {/* Step Progress */}
          {step <= 3 && (
            <div className={`flex items-center gap-4 mb-16 ${t.dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
              {[1, 2, 3].map((s) => (
                <React.Fragment key={s}>
                  <div className={`flex items-center gap-3 transition-all duration-500 ${step === s ? 'flex-[2]' : 'flex-1'}`}>
                    <div className={`h-2.5 rounded-full transition-all duration-700 ${step >= s ? 'bg-brand-blue w-full' : 'bg-slate-100 w-full'}`} />
                  </div>
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Step 1: Service Selection */}
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
              <div className={t.dir === 'rtl' ? 'text-right' : 'text-left'}>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t.whatSessionWorks}</h2>
                <p className="text-sm text-slate-500 mt-1">{t.selectEventType}</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                 {services.length > 0 ? services.map(s => (
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
                 )) : (
                   <div className="py-20 text-center space-y-6 bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-100">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-slate-300">
                         <CalendarDays size={40} strokeWidth={1} />
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-black text-slate-900">No events found</p>
                        <p className="text-sm text-slate-400 font-medium">Please check back later or contact us directly.</p>
                      </div>
                      {onBack && (
                         <button 
                           onClick={onBack}
                           className="px-8 py-3 bg-white border border-slate-200 text-brand-blue font-black text-xs uppercase tracking-widest rounded-full hover:bg-brand-blue hover:text-white hover:border-brand-blue transition-all shadow-sm"
                         >
                           {t.backToDashboard}
                         </button>
                      )}
                   </div>
                 )}
              </div>
            </div>
          )}
                {/* Step 2: Date & Time Selection */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-700">
               <h2 className={`text-3xl font-black text-slate-900 mb-10 tracking-tight ${t.dir === 'rtl' ? 'text-right' : ''}`}>{t.chooseYourTime}</h2>
               <div className={`flex flex-col lg:flex-row gap-8 lg:gap-16 ${t.dir === 'rtl' ? 'lg:flex-row-reverse' : ''}`}>
                  <div className="flex-1">
                     <div className={`flex justify-between items-center mb-8 bg-slate-50 p-4 rounded-2xl ${t.dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                        <h4 className="font-black text-slate-900 text-lg uppercase tracking-wider">
                          {currentMonth.toLocaleDateString(language, { month: 'long', year: 'numeric' })}
                        </h4>
                        <div className={`flex gap-3 ${t.dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                           <button onClick={prevMonth} className="p-2.5 hover:bg-white hover:shadow-md rounded-xl text-slate-400 transition-all"><ArrowLeft size={18} className={t.dir === 'rtl' ? 'rotate-180' : ''} /></button>
                           <button onClick={nextMonth} className="p-2.5 hover:bg-white hover:shadow-md rounded-xl text-slate-400 transition-all"><ArrowRight size={18} className={t.dir === 'rtl' ? 'rotate-180' : ''} /></button>
                        </div>
                     </div>
                     <div className={`grid grid-cols-7 gap-2 text-center mb-6 px-2 ${t.dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                        {(t.dir === 'rtl' ? (language === 'he' ? ['ש', 'ו', 'ה', 'ד', 'ג', 'ב', 'א'] : ['ج', 'خ', 'ر', 'ث', 'ن', 'ح', 'س']) : ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']).map(d => (
                           <span key={d} className="text-[10px] font-black text-slate-400 tracking-[0.2em]">{d}</span>
                        ))}
                     </div>
                     <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
                        {calendarDays.map((day, i) => {
                          if (!day) return <div key={`empty-${i}`} className="h-12 w-full" />;
                          
                          const dateStr = day.toISOString().split('T')[0];
                          const selected = isSelected(day);
                          const past = isPast(day);
                          const today = isToday(day);

                          return (
                            <button 
                              key={i} 
                              disabled={past}
                              onClick={() => setSelectedDate(dateStr)}
                              className={`h-11 sm:h-14 w-full rounded-2xl text-sm font-black transition-all flex items-center justify-center relative border-2 ${
                                past ? 'text-slate-200 border-transparent cursor-not-allowed' :
                                selected ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200' : 
                                'bg-white border-slate-100 hover:border-brand-blue/30 text-slate-900'
                              }`}
                            >
                              {day.getDate()}
                              {today && !selected && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-brand-blue rounded-full" />}
                              {!past && !selected && <div className="absolute bottom-2 w-1 h-1 bg-slate-200 rounded-full" />}
                            </button>
                          );
                        })}
                     </div>
                  </div>

                  {selectedDate && (
                    <div className="w-full lg:w-72 space-y-6 animate-in slide-in-from-bottom-4">
                       <div className={`pb-4 border-b border-slate-100 ${t.dir === 'rtl' ? 'text-right' : ''}`}>
                          <p className="text-[10px] font-black text-brand-blue uppercase tracking-[0.2em] mb-1">{t.availableTimes || 'Available Times'}</p>
                          <h4 className="text-xl font-black text-slate-900">{new Date(selectedDate).toLocaleDateString(language, { weekday: 'long', month: 'short', day: 'numeric' })}</h4>
                       </div>
                       
                       <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 overflow-y-auto max-h-[450px] pr-2 custom-scroll">
                          {availableSlots.length > 0 ? availableSlots.map(time => {
                             const clientTime = formatInTimezone(time, selectedDate, timezone);
                             const isDifferentTz = businessTimezone !== timezone;
                             return (
                               <div key={time} className="space-y-2">
                                  <button 
                                   onClick={() => { setSelectedTime(time); }}
                                   className={`w-full py-4 px-5 border-2 font-black rounded-2xl transition-all flex justify-between items-center group ${t.dir === 'rtl' ? 'flex-row-reverse text-right' : 'text-left'} ${selectedTime === time ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'border-slate-100 text-slate-600 hover:border-brand-blue/30 hover:bg-slate-50'}`}
                                  >
                                     <div className={`flex flex-col ${t.dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                        <span className="text-sm tracking-tight">{clientTime}</span>
                                        {isDifferentTz && (
                                          <span className="text-[10px] opacity-60 font-black uppercase tracking-widest mt-0.5">({time} Local)</span>
                                        )}
                                     </div>
                                     {selectedTime === time ? <CheckCircle2 size={16} /> : <div className="w-4 h-4 rounded-full border border-slate-200 group-hover:border-brand-blue/30" />}
                                  </button>
                                  {selectedTime === time && (
                                    <button 
                                     onClick={() => setStep(3)}
                                     className="w-full py-4 bg-brand-blue text-white font-black rounded-2xl text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand-blue/20 animate-in zoom-in-95"
                                    >
                                      {t.confirmTime}
                                    </button>
                                  )}
                               </div>
                             );
                          }) : (
                            <div className="py-20 text-center space-y-4 opacity-40">
                               <Clock size={32} className="mx-auto" />
                               <p className="text-[10px] font-black uppercase tracking-widest">No Slots Found</p>
                            </div>
                          )}
                       </div>
                    </div>
                  )}
               </div>
            </div>
          )}

          {/* Step 3: Confirmation Details */}
          {step === 3 && (
            <div className={`max-w-md mx-auto space-y-12 animate-in fade-in slide-in-from-right-8 duration-700 ${t.dir === 'rtl' ? 'text-right' : ''}`}>
               <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-blue/10 text-brand-blue rounded-full text-[10px] font-black uppercase tracking-widest">
                    <User size={12} /> {t.lastStep || 'Final Step'}
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{t.completeBooking}</h2>
                  <p className="text-sm text-slate-500 font-medium">{t.calendarInviteNotice}</p>
               </div>

               <div className="space-y-8">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className={`text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ${t.dir === 'rtl' ? 'mr-1' : 'ml-1'}`}>{t.fullName}</label>
                      <div className="relative group">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-blue transition-colors" size={18} />
                        <input 
                          className={`w-full bg-slate-50 border-2 border-slate-50 rounded-2xl pl-12 pr-5 py-4 text-base sm:text-sm font-black focus:bg-white focus:border-brand-blue outline-none transition-all placeholder:text-slate-300 ${t.dir === 'rtl' ? 'text-right' : 'text-left'}`}
                          placeholder="Your Name"
                          value={clientInfo.name}
                          onChange={e => setClientInfo({...clientInfo, name: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={`text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ${t.dir === 'rtl' ? 'mr-1' : 'ml-1'}`}>{t.emailAddress}</label>
                      <div className="relative group">
                        <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-blue transition-colors" size={18} />
                        <input 
                          type="email"
                          className={`w-full bg-slate-50 border-2 border-slate-50 rounded-2xl pl-12 pr-5 py-4 text-base sm:text-sm font-black focus:bg-white focus:border-brand-blue outline-none transition-all placeholder:text-slate-300 ${t.dir === 'rtl' ? 'text-right' : 'text-left'}`}
                          placeholder="email@example.com"
                          value={clientInfo.email}
                          onChange={e => setClientInfo({...clientInfo, email: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={`text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ${t.dir === 'rtl' ? 'mr-1' : 'ml-1'}`}>{t.additionalNotes}</label>
                    <textarea 
                      rows={4}
                      className={`w-full bg-slate-50 border-2 border-slate-50 rounded-3xl px-6 py-5 text-base sm:text-sm font-black focus:bg-white focus:border-brand-blue outline-none transition-all placeholder:text-slate-300 resize-none ${t.dir === 'rtl' ? 'text-right' : 'text-left'}`}
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
