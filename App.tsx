
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
import ClientCRM from './components/ClientCRM';
import AddAppointmentModal from './components/AddAppointmentModal';
import Onboarding from './components/Onboarding';
import Login from './components/Login';
import { Appointment, Client, User, Service } from './types';
import { api } from './services/api';
import { storageService } from './services/storageService';
import { auth, onAuthStateChanged, signInWithPopup, googleProvider } from './firebase';
import { Plus, Search, Bell, Loader2, Radio, CheckCircle2, AlertCircle, X, ShieldCheck, Globe, Info, Zap, Settings as SettingsIcon, Key, ExternalLink } from 'lucide-react';

const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'undefined' && API_KEY !== '';

const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [publicUserId, setPublicUserId] = useState<string | null>(() => {
    const match = window.location.pathname.match(/^\/book\/([^/]+)/);
    return match ? match[1] : null;
  });
  const [isPublicRoute] = useState(() => !!publicUserId);
  const [user, setUser] = useState<User | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isPublicView, setIsPublicView] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
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

  // Auth Listener
  useEffect(() => {
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
            // New user
            const newUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              businessName: '',
              businessCategory: 'Consulting',
              services: [],
              currency: 'USD',
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
          }
        } else {
          setUser(null);
          setIsOnboarded(false);
        }
      } catch (error) {
        console.error("Initialization error:", error);
        showToast("Failed to load user data", "error");
      } finally {
        setIsAuthReady(true);
        setIsInitializing(false);
      }
    });
    return () => unsubscribe();
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

  if (isInitializing || !isAuthReady) {
    return (
      <div className="h-screen w-screen bg-white flex flex-col items-center justify-center space-y-4">
         <div className="w-16 h-16 bg-brand-blue rounded-2xl flex items-center justify-center text-white shadow-xl animate-pulse">
            <Radio size={32} />
         </div>
         <h2 className="text-slate-900 text-sm font-bold tracking-widest uppercase">Initializing EasyBookly...</h2>
      </div>
    );
  }

  if (isPublicRoute) {
    return (
      <PublicBookingPage 
        userId={publicUserId || 'default'}
        onBookingComplete={handleNewBooking}
      />
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
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
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard businessName={businessName} appointments={appointments} clients={clients} connectedApps={connectedApps} legalData={legalData} currency={currency} onOpenPublicView={() => setIsPublicView(true)} />;
      case 'calendar':
        return <AppointmentCalendar appointments={appointments} onAddClick={() => setShowAddModal(true)} onUpdateAppointment={(a) => api.appointments.update(a)} onDeleteAppointment={(id) => api.appointments.delete(id)} connectedApps={connectedApps} currency={currency} />;
      case 'clients':
        return <ClientCRM clients={clients} appointments={appointments} onDeleteClient={(id) => api.clients.delete(id)} />;
      case 'marketing':
        return <MarketingStudio />;
      case 'ai-assistant':
        return <AIAssistant appointments={appointments} clients={clients} />;
      case 'subscription':
        return <Pricing currentPlan={subscriptionPlan} onPlanChange={(p) => updateUserSettings({ subscriptionPlan: p })} />;
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
          />
        );
      default:
        return <Dashboard businessName={businessName} appointments={appointments} clients={clients} connectedApps={connectedApps} legalData={legalData} currency={currency} onOpenPublicView={() => setIsPublicView(true)} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#fcfcfc] overflow-hidden font-sans selection:bg-brand-blue/10 selection:text-brand-blue">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        subscriptionPlan={subscriptionPlan} 
        connectedApps={connectedApps}
        onLogout={handleLogout}
      />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-[#eaebed] flex items-center justify-between px-8 shrink-0 z-20">
          <div className="flex items-center gap-6 flex-1">
             <div className="md:hidden w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center text-white font-bold">
               {businessName.charAt(0)}
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
            <div className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 cursor-pointer transition-colors">
              <span className="text-sm font-bold">Help</span>
            </div>
            <button className="text-slate-400 hover:text-brand-blue transition-colors">
              <Bell size={18} />
            </button>
            <div className="flex items-center gap-3 border-l border-slate-100 pl-6 cursor-pointer group">
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
        
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </main>

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
