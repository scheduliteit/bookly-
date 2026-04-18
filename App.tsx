
// Sync ID: 2026-03-18-T17:21:00Z
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import AppointmentCalendar from './components/AppointmentCalendar';
import AIAssistant from './components/AIAssistant';
import MarketingStudio from './components/MarketingStudio';
import Pricing from './components/Pricing';
import PublicBookingPage from './components/PublicBookingPage';
import Settings from './components/Settings';
import Earnings from './components/Earnings';
import ClientCRM from './components/ClientCRM';
import AdminPanel from './components/AdminPanel';
import AddAppointmentModal from './components/AddAppointmentModal';
import MobileMenu from './components/MobileMenu';
import Onboarding from './components/Onboarding';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Logo from './components/Logo';
import { Appointment, Client, User, Service } from './types';
import { api } from './services/api';
import { storageService } from './services/storageService';
import { auth, onAuthStateChanged, signInWithPopup, googleProvider } from './firebase';
import { Plus, Search, Bell, Loader2, Radio, CheckCircle2, AlertCircle, X, ShieldCheck, Globe, Info, Zap, Settings as SettingsIcon, Key, ExternalLink, Lock, ArrowRight, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'undefined' && API_KEY !== '';

const App: React.FC = () => {
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
  const [authMode, setAuthMode] = useState<'register' | 'login'>('login');
  const [isPublicView, setIsPublicView] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [settingsTab, setSettingsTab] = useState<'profile' | 'services' | 'availability' | 'payouts' | 'legal'>('profile');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'ILS'>('ILS');
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('Consulting');
  const [subscriptionPlan, setSubscriptionPlan] = useState<'basic' | 'premium'>('basic');
  const [connectedApps, setConnectedApps] = useState<string[]>([]);
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [legalData, setLegalData] = useState({
    privacyPolicy: "We value your privacy. Your data is used solely for scheduling and communication regarding your appointments. We do not sell your information to third parties.",
    termsOfService: "By booking an appointment, you agree to show up at the scheduled time. Cancellations must be made 24 hours in advance for a full refund.",
    gdprStrict: true
  });

  // Hash Change Listener for navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['dashboard', 'calendar', 'clients', 'marketing', 'ai-assistant', 'settings', 'subscription', 'management'].includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Check initial hash
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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
            setUser(userData);
            setBusinessName(userData.businessName || '');
            setBusinessCategory(userData.businessCategory || 'Consulting');
            setIsOnboarded(userData.onboardingCompleted || false);
            setServices(userData.services || []);
            setConnectedApps(userData.connectedApps || []);
            setLegalData(userData.legalData || legalData);
            setCurrency(userData.currency || 'USD');
            setSubscriptionPlan(userData.subscriptionPlan || 'basic');
          } else {
            console.log("New user detected, creating profile...");
            // New user
            const newUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              businessName: '',
              businessCategory: 'Consulting',
              services: [],
              currency: 'USD',
              createdAt: new Date().toISOString(), // Start trial now
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
              onboardingCompleted: false
            };
            setUser(newUser);
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

  // Sync Data
  useEffect(() => {
    if (user && user.onboardingCompleted) {
      const unsubApts = api.appointments.list(setAppointments);
      const unsubClients = api.clients.list(setClients);
      const unsubUser = api.user.sync(user.id, (updatedUser) => {
        setBusinessName(updatedUser.businessName);
        setBusinessCategory(updatedUser.businessCategory || 'Consulting');
        setIsOnboarded(updatedUser.onboardingCompleted);
        setServices(updatedUser.services || []);
        setLegalData(updatedUser.legalData || legalData);
        setCurrency(updatedUser.currency || 'USD');
      });

      return () => {
        unsubApts();
        unsubClients();
        unsubUser();
      };
    }
  }, [user?.id, user?.onboardingCompleted]);

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
    // Handled by onAuthStateChanged
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
  const isTrialExpired = false; // "all free for now"

  if (isInitializing || !isAuthReady) {
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

  if (showLanding && !user) {
    return (
      <LandingPage 
        onStart={(mode) => { 
          if (mode) setAuthMode(mode);
          setShowLanding(false); 
        }} 
        onLogin={() => {
          setAuthMode('login');
          setShowLanding(false);
        }} 
      />
    );
  }

  if (!user) {
    return <Login key={authMode} onLogin={handleLogin} initialMode={authMode} />;
  }

  if (!user?.onboardingCompleted && user) {
    return <Onboarding onComplete={(data) => { updateUserSettings({ businessName: data.name, businessCategory: data.category, onboardingCompleted: true }); }} />;
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
                return <Dashboard user={user!} services={services} businessName={businessName} appointments={appointments} clients={clients} connectedApps={connectedApps} legalData={legalData} currency={currency} onOpenPublicView={() => setIsPublicView(true)} onAddEventType={() => { setSettingsTab('services'); setActiveTab('settings'); }} setActiveTab={setActiveTab} />;
              case 'calendar':
                return (
                  <AppointmentCalendar 
                    appointments={appointments} 
                    onAddClick={() => setShowAddModal(true)} 
                    onUpdateAppointment={(a) => api.appointments.update(a)} 
                    onDeleteAppointment={(id) => api.appointments.delete(id)} 
                    onNavigate={setActiveTab}
                    connectedApps={connectedApps} 
                    currency={currency} 
                  />
                );
              case 'clients':
                return <ClientCRM clients={clients} appointments={appointments} onDeleteClient={(id) => api.clients.delete(id)} onAddClient={() => setShowAddModal(true)} />;
              case 'marketing':
                return <MarketingStudio onAddWorkflow={() => { setSettingsTab('services'); setActiveTab('settings'); }} />;
              case 'ai-assistant':
                return <AIAssistant appointments={appointments} clients={clients} />;
              case 'management':
                return <AdminPanel />;
              case 'earnings':
                return <Earnings appointments={appointments} currency={currency} businessName={businessName} />;
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
                    initialTab={settingsTab}
                  />
                );
              default:
                return <Dashboard user={user!} services={services} businessName={businessName} appointments={appointments} clients={clients} connectedApps={connectedApps} legalData={legalData} currency={currency} onOpenPublicView={() => setIsPublicView(true)} onAddEventType={() => setActiveTab('settings')} />;
            }
          })()}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="flex h-screen bg-[#fcfcfc] overflow-hidden font-sans selection:bg-brand-blue/10 selection:text-brand-blue">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user}
        subscriptionPlan={subscriptionPlan} 
        connectedApps={connectedApps}
        onLogout={handleLogout}
        onAddClick={() => setShowAddModal(true)}
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
                  placeholder="Search..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg py-1.5 pl-10 pr-4 text-sm font-medium focus:ring-1 focus:ring-brand-blue outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
               />
             </div>
          </div>
          
          <div className="flex items-center gap-6">
            {(user?.email === 'scheduliteit@gmail.com' || user?.role === 'admin') && (
              <button 
                onClick={() => setActiveTab('management')}
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-brand-dark text-white rounded-lg text-xs font-bold hover:shadow-md transition-all animate-pulse"
              >
                <ShieldCheck size={14} /> Master Admin
              </button>
            )}
            <div 
              onClick={() => setActiveTab('ai-assistant')}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 cursor-pointer transition-colors"
            >
              <span className="text-sm font-bold">Help</span>
            </div>
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
              <span className="text-sm font-bold text-slate-700">Account</span>
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

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
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
    </div>
  );
};

export default App;
