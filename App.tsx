
// Sync ID: 2026-03-20-T10:00:00Z
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import AppointmentCalendar from './components/AppointmentCalendar';
import VideoMeeting from './components/VideoMeeting';
import AIAssistant from './components/AIAssistant';
import MarketingStudio from './components/MarketingStudio';
import Pricing from './components/Pricing';
import PublicBookingPage from './components/PublicBookingPage';
import Settings from './components/Settings';
import Earnings from './components/Earnings';
import HelpCenter from './components/HelpCenter';
import ClientCRM from './components/ClientCRM';
import AdminPanel from './components/AdminPanel';
import AddAppointmentModal from './components/AddAppointmentModal';
import MobileMenu from './components/MobileMenu';
import Onboarding from './components/Onboarding';
import LandingPage from './components/LandingPage';
import FeedbackModal from './components/FeedbackModal';
import Login from './components/Login';
import Logo from './components/Logo';
import MobileInstallGuide from './components/MobileInstallGuide';
import { Appointment, Client, User, Service } from './types';
import { api } from './services/api';
import { storageService } from './services/storageService';
import { auth, onAuthStateChanged, signInWithPopup, googleProvider } from './firebase';
import { Plus, Search, Bell, Loader2, Radio, CheckCircle2, AlertCircle, X, ShieldCheck, Globe, Info, Zap, Settings as SettingsIcon, Key, ExternalLink, Lock, ArrowRight, LayoutGrid, Link as LinkIcon, Video, Bot, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { Language, translations } from './services/translations';

const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'undefined' && API_KEY !== '';

const App: React.FC = () => {
  const isFreeMode = import.meta.env.VITE_IS_FREE_MODE === 'true';
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [publicUserId, setPublicUserId] = useState<string | null>(() => {
    const match = window.location.pathname.match(/^\/book\/([^/]+)/);
    return match ? match[1] : null;
  });
  const [isPublicRoute] = useState(() => !!publicUserId);
  const [user, setUser] = useState<User | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [showPricingGate, setShowPricingGate] = useState(false);
  const [authMode, setAuthMode] = useState<'register' | 'login'>('login');
  const [registrationEmail, setRegistrationEmail] = useState<string | undefined>(undefined);
  const [pendingPlan, setPendingPlan] = useState<'basic' | 'premium' | undefined>(undefined);
  const [isPublicView, setIsPublicView] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [settingsTab, setSettingsTab] = useState<'profile' | 'services' | 'availability' | 'payouts' | 'legal'>('profile');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMobileGuide, setShowMobileGuide] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMeetingRoom, setActiveMeetingRoom] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'ILS'>('USD');
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('easybookly_lang') as Language) || 'en');
  const t = translations[language];
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('Consulting');
  const [subscriptionPlan, setSubscriptionPlan] = useState<'basic' | 'premium' | undefined>(undefined);
  const [connectedApps, setConnectedApps] = useState<string[]>([]);
  const [reminderSettings, setReminderSettings] = useState<any>({
    enabled: true,
    channels: ['email'],
    timing: 60, // 1 hour before
    messageTemplate: "Hi {clientName}, just a reminder for your {serviceName} at {businessName} on {date} at {time}."
  });
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [externalEvents, setExternalEvents] = useState<any[]>([]);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [legalData, setLegalData] = useState({
    privacyPolicy: "We value your privacy. Your data is used solely for scheduling and communication regarding your appointments. We do not sell your information to third parties.",
    termsOfService: "By booking an appointment, you agree to show up at the scheduled time. Cancellations must be made 24 hours in advance for a full refund.",
    gdprStrict: true
  });

  // Security Fix #8: useRefs for stale-closure hazards
  const pendingPlanRef = useRef(pendingPlan);
  const legalDataRef = useRef(legalData);

  useEffect(() => { pendingPlanRef.current = pendingPlan; }, [pendingPlan]);
  useEffect(() => { legalDataRef.current = legalData; }, [legalData]);

  // Hash Change Listener for navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['dashboard', 'calendar', 'clients', 'marketing', 'ai-assistant', 'settings', 'subscription', 'management', 'help'].includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Check initial hash
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Activity Heartbeat
  useEffect(() => {
    if (!user) return;
    
    // Heartbeat every 5 minutes
    const intervalId = setInterval(async () => {
      try {
        await api.user.save({
          ...user,
          lastSeenAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Heartbeat failed:", err);
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [user]);

  // Auth Listener
  useEffect(() => {
    // Set a safety timeout for initialization
    const timeoutId = setTimeout(() => {
      if (isInitializing) {
        console.warn("Auth initialization is taking longer than expected...");
      }
    }, 8000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Fetch user settings from Firestore
          const userData = await api.user.get(firebaseUser.uid);
          if (userData) {
            // Auto-upgrade if email matches
            const userEmail = firebaseUser.email?.toLowerCase();
            let effectiveUser = { ...userData, subscriptionPlan: userData.subscriptionPlan || 'premium' };
            const isMasterEmail = userEmail === 'm.elsalameen@gmail.com' || userEmail === 'scheduliteit@gmail.com';
            if (isMasterEmail) {
               console.log(`Welcome Master Admin (${userEmail}). Verifying role...`);
               if (userData.role !== 'admin') {
                  console.log("Upgrading account to Admin role...");
                  effectiveUser.role = 'admin';
                  await api.user.save(effectiveUser);
                  console.log("Role update successful.");
               } else {
                  console.log("Admin role already active.");
               }
            }
            
            // Update login tracking
            const now = new Date().toISOString();
            const updatedUser: User = {
              ...effectiveUser,
              loginCount: (userData.loginCount || 0) + 1,
              lastLoginAt: now,
              lastSeenAt: now
            };
            
            // Subscription Plan Logic
            let planToSet: 'basic' | 'premium' = userData.subscriptionPlan as 'basic' | 'premium';
            if (isFreeMode) planToSet = 'premium';
            
            setUser(updatedUser);
            await api.user.save(updatedUser);

            if (updatedUser.role === 'admin' && activeTab === 'dashboard') {
              setActiveTab('management');
            }
            setBusinessName(userData.businessName || '');
            setBusinessCategory(userData.businessCategory || 'Consulting');
            setIsOnboarded(userData.onboardingCompleted || false);
            setServices(userData.services || []);
            setConnectedApps(userData.connectedApps || []);
            setLegalData(userData.legalData || legalData);
            setCurrency(userData.currency || 'USD');
            setSubscriptionPlan(planToSet);
            setReminderSettings(userData.reminderSettings || {
              enabled: true,
              channels: ['email'],
              timing: 60,
              messageTemplate: "Hi {clientName}, just a reminder for your {serviceName} at {businessName} on {date} at {time}."
            });
          } else {
            console.log("New user detected, creating profile...");
            
            // FREE FOR NOW: All users get premium by default
            const initialPlan = 'premium';
            setSubscriptionPlan(initialPlan);
            setPendingPlan(undefined);

            // New user
            const newUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              businessName: '',
              businessCategory: 'Consulting',
              services: [],
              currency: 'USD',
              subscriptionPlan: initialPlan,
              role: (firebaseUser.email?.toLowerCase() === 'm.elsalameen@gmail.com' || firebaseUser.email?.toLowerCase() === 'scheduliteit@gmail.com') ? 'admin' : undefined,
              createdAt: new Date().toISOString(),
              workingHours: {
                monday: { start: '09:00', end: '17:00', active: true },
                tuesday: { start: '09:00', end: '17:00', active: true },
                wednesday: { start: '09:00', end: '17:00', active: true },
                thursday: { start: '09:00', end: '17:00', active: true },
                friday: { start: '09:00', end: '17:00', active: true },
                saturday: { start: '09:00', end: '17:00', active: false },
                sunday: { start: '09:00', end: '17:00', active: false },
              },
              legalData: legalData,
              onboardingCompleted: false,
              loginCount: 1,
              lastLoginAt: new Date().toISOString(),
              lastSeenAt: new Date().toISOString()
            };
            setUser(newUser);
            if (newUser.role === 'admin') {
              setActiveTab('management');
            }
            await api.user.save(newUser);
            console.log("New user profile saved.");
          }
        } else {
          setUser(null);
          setIsOnboarded(false);
        }
        setAuthError(null);
      } catch (error: any) {
        console.error("Initialization error:", error);
        setAuthError(error.message || "Failed to load your profile. Please check your internet connection.");
        showToast("Failed to load user data", "error");
      } finally {
        setIsAuthReady(true);
        setIsInitializing(false);
        clearTimeout(timeoutId);
      }
    });
    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  // Sync Data (Security Fix #5 & #8)
  useEffect(() => {
    // Payment verification removed as PayMe is no longer integrated
  }, [user?.id]); 

  useEffect(() => {
    if (user && user.onboardingCompleted) {
      const unsubApts = api.appointments.list(setAppointments);
      const unsubClients = api.clients.list(setClients);
      
      if (user.role === 'admin') {
        api.system.getUsers().then(setAllUsers).catch(console.error);
      }

      const unsubUser = api.user.sync(user.id, (updatedUser) => {
        setBusinessName(updatedUser.businessName);
        setBusinessCategory(updatedUser.businessCategory || 'Consulting');
        setIsOnboarded(updatedUser.onboardingCompleted);
        setServices(updatedUser.services || []);
        setLegalData(updatedUser.legalData || legalData);
        setCurrency(updatedUser.currency || 'USD');
        setReminderSettings(updatedUser.reminderSettings || reminderSettings);
        if (updatedUser.language && updatedUser.language !== language) {
          setLanguage(updatedUser.language as Language);
          localStorage.setItem('easybookly_lang', updatedUser.language);
        }
        setTimezone(updatedUser.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
      });

      return () => {
        unsubApts();
        unsubClients();
        unsubUser();
      };
    }
  }, [user?.id, user?.onboardingCompleted]);

  const fetchExternalEvents = React.useCallback(async () => {
    if (!user || connectedApps.length === 0) {
      setExternalEvents([]);
      return;
    }
    
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;
      
      const res = await fetch('/api/calendar/sync', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setExternalEvents(data);
      }
    } catch (err) {
      console.error("External sync failed", err);
    }
  }, [user, connectedApps]);

  useEffect(() => {
    if (user && connectedApps.length > 0) {
      fetchExternalEvents();
    }
  }, [user?.id, connectedApps, fetchExternalEvents]);

  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) return;
      
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        showToast(`${event.data.provider === 'google' ? 'Google' : 'Outlook'} Calendar Connected!`, "success");
        // Force refresh user to get new connectedApps
        if (user) {
          api.user.get(user.id).then(updated => {
            if (updated) {
              setConnectedApps(updated.connectedApps || []);
              fetchExternalEvents();
            }
          });
        }
      }
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [user, fetchExternalEvents]);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleNewBooking = async (newBooking: Appointment) => {
    try {
      const saved = await api.appointments.create(newBooking);
      showToast(`Session locked for ${saved.clientName}`);
    } catch (err) {
      showToast("Failed to save booking", "error");
    }
  };

  const handleLogin = async (email: string, uid: string, displayName: string | null) => {
    // Security Fix #7: State sync is driven by onAuthStateChanged in the effect above.
    // This is explicitly a no-op to avoid double-triggers.
  };

  const handleLogout = async () => {
    await auth.signOut();
  };

  const updateUserSettings = async (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      await api.user.save(updatedUser);
    }
  };

  // Trial Calculation
  const getTrialDaysRemaining = () => {
    if (!user?.createdAt) return 30;
    const start = new Date(user.createdAt);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const days = 30 - Math.floor(diff / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };
  
  const trialDays = getTrialDaysRemaining();
  const isTrialExpired = !isFreeMode && trialDays <= 0;

  if (isInitializing || !isAuthReady || isVerifyingPayment) {
    return (
      <div className="h-screen w-screen bg-white flex flex-col items-center justify-center space-y-6 p-6 text-center">
         <div className="animate-bounce mb-4">
            <Logo size="xl" showText={false} />
         </div>
         <div className="space-y-2">
           <Logo size="md" className="justify-center mb-2" />
           <p className="text-slate-500 text-sm font-medium max-w-[280px]">Connecting to secure servers and loading your business profile...</p>
         </div>
         {authError && (
           <div className="mt-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl max-w-md animate-in fade-in slide-in-from-bottom-4">
             <p className="text-rose-600 text-xs font-bold mb-3">{authError}</p>
             <button 
               onClick={() => window.location.reload()}
               className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-all"
             >
               Retry Connection
             </button>
           </div>
         )}
      </div>
    );
  }

  if (isPublicRoute) {
    return (
      <PublicBookingPage 
        userId={publicUserId || 'default'}
        onBookingComplete={handleNewBooking}
        onBack={() => window.location.href = '/'}
      />
    );
  }

  // Show landing page only if not a public route and not logged in (or explicitly requested)
  if (showLanding && !user) {
    return (
      <LandingPage 
        isLoggedIn={false}
        language={language}
        onUpdateLanguage={setLanguage}
        onStart={(mode) => { 
          if (isFreeMode) {
            setAuthMode(mode || 'register');
            setShowLanding(false);
          } else {
            setShowPricingGate(true);
            setShowLanding(false);
          }
        }} 
        onLogin={() => {
          setShowLanding(false);
          setAuthMode('login');
        }} 
      />
    );
  }

  if (!user && showPricingGate) {
     return (
       <Pricing 
         user={null} 
         currentPlan={undefined} 
         onPlanChange={(p) => {
           setPendingPlan(p);
           setShowPricingGate(false);
         }} 
         onAuthRequired={() => setShowPricingGate(false)} 
         onBack={() => {
           setShowPricingGate(false);
           setShowLanding(true);
         }}
       />
     );
  }

  if (!user) {
    return <Login key={authMode} onLogin={handleLogin} initialMode={authMode} preFillEmail={registrationEmail} language={language} />;
  }

  // Force subscription plan selection before onboarding or dashboard
  if (!user.subscriptionPlan) {
    if (isFreeMode) {
      // Auto-assign premium if in free mode
      updateUserSettings({ subscriptionPlan: 'premium' });
      return (
        <div className="h-screen w-screen bg-white flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin text-brand-blue" size={40} />
          <p className="text-slate-500 font-bold animate-pulse">Activating your free premium account...</p>
        </div>
      );
    }
    return (
      <Pricing 
        currentPlan={subscriptionPlan} 
        onPlanChange={(p) => updateUserSettings({ subscriptionPlan: p })} 
        user={user} 
        onBack={() => setShowLanding(true)}
      />
    );
  }

  if (!user?.onboardingCompleted && user) {
    return <Onboarding language={language} onComplete={(data) => { updateUserSettings({ businessName: data.name, businessCategory: data.category, onboardingCompleted: true }); }} />;
  }

  if (isPublicView) {
    return (
      <PublicBookingPage 
        businessName={businessName} 
        services={services}
        legalData={legalData}
        currency={currency}
        onBookingComplete={handleNewBooking}
        onBack={() => setIsPublicView(false)} 
      />
    );
  }

  const renderContent = () => {
    if (isTrialExpired) {
      return (
        <div className="h-full flex items-center justify-center p-8">
           <div className="bg-white border border-slate-100 rounded-[40px] p-12 max-w-xl text-center shadow-2xl shadow-brand-blue/5 space-y-8 animate-in zoom-in-95 duration-700">
              <div className="w-20 h-20 bg-brand-blue/10 text-brand-blue rounded-full flex items-center justify-center mx-auto mb-4">
                 <Lock size={32} />
              </div>
              <div>
                 <h2 className="text-3xl font-black text-brand-dark tracking-tight">Your AI Trial has Finished</h2>
                 <p className="text-slate-500 font-medium mt-4">You've successfully managed your first 30 days! To continue using the Command Center, AI Assistant, and Automated Workflows, please upgrade to a paid plan.</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl flex items-center gap-4 text-left">
                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-blue shadow-sm">
                    <CheckCircle2 size={20} />
                 </div>
                 <div>
                    <p className="text-sm font-black text-brand-dark uppercase tracking-tight">Access Locked</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Dashboard • AI Features • Clients</p>
                 </div>
              </div>
              <button 
                onClick={() => setActiveTab('subscription')}
                className="w-full py-5 bg-brand-blue text-white rounded-full font-black text-lg shadow-xl shadow-brand-blue/20 hover:scale-105 transition-all flex items-center justify-center gap-3"
              >
                Choose Your Plan <ArrowRight size={20} />
              </button>
           </div>
        </div>
      );
    }
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="h-full"
        >
          {(() => {
            switch (activeTab) {
              case 'dashboard':
                return <Dashboard user={user!} services={services} businessName={businessName} appointments={appointments} externalEvents={externalEvents} clients={clients} connectedApps={connectedApps} legalData={legalData} currency={currency} language={language} onOpenPublicView={() => setIsPublicView(true)} onAddEventType={() => { setSettingsTab('services'); setActiveTab('settings'); }} setActiveTab={setActiveTab} onOpenMobileGuide={() => setShowMobileGuide(true)} onJoinMeeting={setActiveMeetingRoom} />;
              case 'calendar':
                return (
                  <AppointmentCalendar 
                    appointments={appointments} 
                    externalEvents={externalEvents}
                    onAddClick={() => setShowAddModal(true)} 
                    onUpdateAppointment={(a) => api.appointments.update(a)} 
                    onDeleteAppointment={(id) => api.appointments.delete(id)} 
                    onNavigate={setActiveTab}
                    connectedApps={connectedApps} 
                    currency={currency} 
                    onJoinMeeting={setActiveMeetingRoom}
                    onSyncNow={fetchExternalEvents}
                    language={language}
                  />
                );
              case 'clients':
                return <ClientCRM clients={clients} appointments={appointments} onDeleteClient={(id) => api.clients.delete(id)} onAddClient={() => setShowAddModal(true)} language={language} />;
              case 'marketing':
                return <MarketingStudio onAddWorkflow={() => { setSettingsTab('services'); setActiveTab('settings'); }} />;
              case 'ai-assistant':
                return (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 bg-brand-blue/10 text-brand-blue rounded-3xl flex items-center justify-center mx-auto animate-bounce">
                        <Bot size={40} />
                      </div>
                      <h2 className="text-2xl font-black text-brand-dark">{t.aiCompanionActive}</h2>
                      <p className="text-slate-500 font-medium">{t.aiCompanionSubtitle}</p>
                      <button onClick={() => setActiveTab('dashboard')} className="px-8 py-3 bg-brand-blue text-white rounded-full font-bold shadow-lg hover:bg-brand-dark transition-all">{t.backToDashboard}</button>
                    </div>
                  </div>
                );
              case 'booking-links':
                return (
                  <div className="h-full space-y-8 animate-in fade-in duration-500">
                    <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                      <div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-brand-blue uppercase tracking-[0.3em] mb-1">
                          <Globe size={12} /> {t.liveAssets}
                        </div>
                        <h2 className="text-4xl font-black text-brand-dark tracking-tight">{t.bookingPortals}</h2>
                        <p className="text-slate-500 font-medium">{t.bookingPortalsSubtitle}</p>
                      </div>
                    </header>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-brand-blue/20 transition-all group flex flex-col justify-between">
                        <div className="space-y-6">
                           <div className="w-16 h-16 bg-brand-blue/10 text-brand-blue rounded-[24px] flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                              <LinkIcon size={32} />
                           </div>
                           <div>
                             <h3 className="text-2xl font-black text-brand-dark mb-2">{t.mainBookingPage}</h3>
                             <p className="text-slate-500 leading-relaxed font-medium">
                               {t.mainBookingPageSubtitle}
                             </p>
                           </div>
                           
                           <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between group/link">
                             <code className="text-[10px] font-bold text-slate-400 truncate pr-4">
                               {window.location.origin}/book/{user?.id || 'default'}
                             </code>
                             <button 
                               onClick={() => {
                                 const url = `${window.location.origin}/book/${user?.id || 'default'}`;
                                 navigator.clipboard.writeText(url);
                                 showToast(t.copyLinkToast);
                               }}
                               className="p-2 text-brand-blue hover:bg-white rounded-xl transition-all shadow-sm"
                             >
                               <ExternalLink size={16} />
                             </button>
                           </div>
                        </div>

                        <div className="mt-10 pt-10 border-t border-slate-50 grid grid-cols-2 gap-4">
                           <button 
                            onClick={() => setIsPublicView(true)}
                            className="py-4 bg-brand-blue text-white rounded-2xl font-black text-sm shadow-xl shadow-brand-blue/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                           >
                            <Globe size={18} /> {t.previewLive}
                           </button>
                           <button 
                            onClick={() => {
                                const url = `${window.location.origin}/book/${user?.id || 'default'}`;
                                window.open(url, '_blank');
                            }}
                            className="py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2"
                           >
                            {t.openInNewTab}
                           </button>
                        </div>
                      </div>

                      {/* Mini Widget Card */}
                      <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm opacity-60 flex flex-col justify-between">
                        <div className="space-y-6">
                           <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-[24px] flex items-center justify-center">
                              <LayoutGrid size={32} />
                           </div>
                           <div>
                             <h3 className="text-2xl font-black text-slate-900 mb-2">Embeddable Widget</h3>
                             <p className="text-slate-500 leading-relaxed font-medium">
                               Embed your booking flow directly into your WordPress, Wix, or custom website.
                               <span className="block mt-2 text-brand-blue text-[10px] font-black uppercase tracking-widest">Coming Soon in v2.0</span>
                             </p>
                           </div>
                        </div>
                        <div className="mt-10 pt-10 border-t border-slate-50">
                           <button disabled className="w-full py-4 bg-slate-50 text-slate-300 rounded-2xl font-black text-sm cursor-not-allowed">
                             GET EMBED CODE
                           </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              case 'management':
                return <AdminPanel users={allUsers} appointments={appointments} clients={clients} />;
              case 'earnings':
                return <Earnings appointments={appointments} currency={currency} businessName={businessName} />;
              case 'help':
                return <HelpCenter language={language} onOpenAiAssistant={() => setActiveTab('ai-assistant')} />;
              case 'subscription':
                return <Pricing currentPlan={subscriptionPlan} onPlanChange={(p) => updateUserSettings({ subscriptionPlan: p })} user={user!} />;
              case 'settings':
                return (
                  <Settings 
                    businessName={businessName} 
                    onUpdateBusinessName={(val) => updateUserSettings({ businessName: val })} 
                    services={services}
                    onUpdateServices={(val) => updateUserSettings({ services: val })}
                    connectedApps={connectedApps}
                    onUpdateConnectedApps={(val) => updateUserSettings({ connectedApps: val })}
                    legalData={legalData}
                    onUpdateLegalData={(val) => updateUserSettings({ legalData: val })}
                    currency={currency}
                    onUpdateCurrency={(val) => updateUserSettings({ currency: val })}
                    timezone={timezone}
                    onUpdateTimezone={(val) => updateUserSettings({ timezone: val })}
                    reminderSettings={reminderSettings}
                    onUpdateReminderSettings={(val) => updateUserSettings({ reminderSettings: val })}
                    userId={user!.id}
                    initialTab={settingsTab}
                    language={language}
                    onUpdateLanguage={(l) => {
                      setLanguage(l);
                      localStorage.setItem('easybookly_lang', l);
                      updateUserSettings({ language: l });
                    }}
                  />
                );
              default:
                return <Dashboard user={user!} services={services} businessName={businessName} appointments={appointments} clients={clients} connectedApps={connectedApps} legalData={legalData} currency={currency} language={language} onOpenPublicView={() => setIsPublicView(true)} onAddEventType={() => { setSettingsTab('services'); setActiveTab('settings'); }} setActiveTab={setActiveTab} onOpenMobileGuide={() => setShowMobileGuide(true)} />;
            }
          })()}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div 
      className={`flex h-screen bg-[#fcfcfc] overflow-hidden font-sans selection:bg-brand-blue/10 selection:text-brand-blue ${(language === 'he' || language === 'ar') ? 'font-hebrew' : ''}`}
      dir={translations[language].dir}
    >
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          if (tab === 'legal-direct') {
            setActiveTab('settings');
            setSettingsTab('legal');
          } else {
            setActiveTab(tab);
          }
        }} 
        user={user}
        subscriptionPlan={subscriptionPlan} 
        connectedApps={connectedApps}
        onLogout={handleLogout}
        onAddClick={() => setShowAddModal(true)}
        onOpenMobileGuide={() => setShowMobileGuide(true)}
        onSyncNow={fetchExternalEvents}
        language={language}
        onUpdateLanguage={(l) => {
          setLanguage(l);
          localStorage.setItem('easybookly_lang', l);
          updateUserSettings({ language: l });
        }}
      />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-[#eaebed] flex items-center justify-between px-8 shrink-0 z-20">
          {trialDays > 0 && trialDays <= 10 && user?.subscriptionPlan !== 'premium' && (
            <div className="absolute top-16 left-0 right-0 bg-brand-dark text-white py-1 px-8 flex items-center justify-between z-30 animate-in slide-in-from-top duration-500">
               <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                 <Zap size={10} className="text-amber-400" /> Trial ends in {trialDays} days. Upgrade now to keep your AI features.
               </p>
               <button onClick={() => setActiveTab('subscription')} className="text-[10px] font-black underline uppercase tracking-widest decoration-amber-400">Upgrade</button>
            </div>
          )}
          <div className="flex items-center gap-6 flex-1">
             <div className="md:hidden flex items-center gap-3">
               <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="w-10 h-10 bg-brand-blue/5 text-brand-blue rounded-xl flex items-center justify-center active:scale-95 transition-all border border-brand-blue/10"
               >
                 <LayoutGrid size={20} strokeWidth={2.5} />
               </button>
               <Logo size="sm" showText={false} />
             </div>
             <div className="relative w-full max-w-sm hidden md:block">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
               <input 
                  type="text" 
                  placeholder={language === 'he' ? 'חיפוש...' : 'Search...'}
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg py-1.5 pl-10 pr-4 text-sm font-medium focus:ring-1 focus:ring-brand-blue outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
               />
             </div>
          </div>
          
          <div className="flex items-center gap-6">
            {(user?.role === 'admin') && (
              <button 
                onClick={() => setActiveTab('management')}
                className="flex items-center gap-2 px-3 py-1.5 bg-brand-dark text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all animate-shimmer shadow-lg shadow-brand-blue/20"
              >
                <ShieldCheck size={14} className="text-brand-blue" /> Master Admin
              </button>
            )}
            <div 
              onClick={() => setActiveTab('help')}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 cursor-pointer transition-colors"
            >
              <span className="text-sm font-bold">{translations[language].help || 'Help'}</span>
            </div>
            <button 
              onClick={() => {
                const room = `ebk-quick-${user?.id.substring(0,5)}-${Math.random().toString(36).substr(2,6)}`;
                setActiveMeetingRoom(room);
              }}
              className="px-4 py-2 bg-brand-blue text-white rounded-xl hover:bg-brand-dark transition-all flex items-center gap-2 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand-blue/30 scale-105"
              title="Start Quick Video Meeting"
            >
              <div className="relative">
                <Video size={16} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse border-2 border-brand-blue" />
              </div>
              <span>Start Call</span>
            </button>
            <button 
              onClick={() => alert('No new notifications')}
              className="text-slate-400 hover:text-brand-blue transition-colors"
            >
              <Bell size={18} />
            </button>
            <div 
              onClick={() => setActiveTab('settings')}
              className="flex items-center gap-3 border-l border-slate-100 pl-6 cursor-pointer group"
            >
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-xs group-hover:bg-slate-200 transition-all">
                {businessName.charAt(0)}
              </div>
              <span className="text-sm font-bold text-slate-700">{translations[language].account || 'Account'}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 md:p-12 w-full custom-scroll">
          {renderContent()}
        </div>
        
        {/* Mobile FAB */}
        <button 
          onClick={() => setShowAddModal(true)}
          className="md:hidden fixed right-6 bottom-24 w-14 h-14 bg-brand-blue text-white rounded-full shadow-lg flex items-center justify-center z-40 active:scale-95 transition-all"
        >
          <Plus size={24} strokeWidth={3} />
        </button>

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} user={user} language={language} />
      </main>

      <MobileMenu 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
        onAddClick={() => setShowAddModal(true)}
      />

      {showAddModal && user && (
        <AddAppointmentModal 
          onClose={() => setShowAddModal(false)} 
          onAdd={handleNewBooking}
          clients={clients}
          services={services}
          userId={user.id}
        />
      )}

      <AnimatePresence>
        {activeMeetingRoom && (
          <VideoMeeting 
            roomName={activeMeetingRoom} 
            onClose={() => setActiveMeetingRoom(null)}
            displayName={businessName}
          />
        )}
        {showMobileGuide && (
          <MobileInstallGuide onClose={() => setShowMobileGuide(false)} />
        )}
        {showFeedbackModal && (
          <FeedbackModal onClose={() => setShowFeedbackModal(false)} />
        )}
      </AnimatePresence>

      {/* Floating Feedback Button */}
      {user && (
        <button 
          onClick={() => setShowFeedbackModal(true)}
          className="fixed bottom-24 right-8 z-[900] w-12 h-12 bg-white border border-slate-100 shadow-2xl rounded-2xl flex items-center justify-center text-slate-400 hover:text-brand-blue hover:scale-110 active:scale-95 transition-all group lg:bottom-12 lg:right-28"
          title="Share Feedback"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 5 }}
          >
            <MessageSquare size={20} strokeWidth={2.5} />
          </motion.div>
          <div className="absolute right-full mr-4 px-3 py-1.5 bg-brand-dark text-white text-[10px] font-black uppercase tracking-widest rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-2 group-hover:translate-x-0">
            Send Feedback
          </div>
        </button>
      )}

      <AIAssistant appointments={appointments} clients={clients} externalEvents={externalEvents} language={language} />
    </div>
  );
};

export default App;
