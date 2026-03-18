
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
import { Appointment, Client, User } from './types';
import { api } from './services/api';
import { storageService } from './services/storageService';
import { Plus, Search, Bell, Loader2, Radio, CheckCircle2, AlertCircle, X, ShieldCheck, Globe, Info, Zap, Settings as SettingsIcon } from 'lucide-react';

const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isPublicRoute] = useState(() => window.location.pathname.startsWith('/book/'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('bookly_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isOnboarded, setIsOnboarded] = useState(() => localStorage.getItem('bookly_onboarded') === 'true');
  const [isPublicView, setIsPublicView] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'ILS'>(() => (localStorage.getItem('bookly_currency') as any) || 'USD');
  const [businessName, setBusinessName] = useState(() => localStorage.getItem('bookly_business_name') || '');
  const [businessCategory, setBusinessCategory] = useState(() => localStorage.getItem('bookly_business_category') || 'Consulting');
  const [subscriptionPlan, setSubscriptionPlan] = useState<'basic' | 'premium'>(() => storageService.getSubscription());
  const [connectedApps, setConnectedApps] = useState<string[]>(() => JSON.parse(localStorage.getItem('bookly_connected_apps') || '[]'));
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState(() => JSON.parse(localStorage.getItem('bookly_services') || '[]'));
  const [legalData, setLegalData] = useState(() => JSON.parse(localStorage.getItem('bookly_legal') || JSON.stringify({
    privacyPolicy: "We value your privacy. Your data is used solely for scheduling and communication regarding your appointments. We do not sell your information to third parties.",
    termsOfService: "By booking an appointment, you agree to show up at the scheduled time. Cancellations must be made 24 hours in advance for a full refund.",
    gdprStrict: true
  })));

  useEffect(() => {
    const hydrate = async () => {
      try {
        const [aptData, clientData] = await Promise.all([
          api.appointments.list(),
          api.clients.list()
        ]);
        setAppointments(aptData);
        setClients(clientData);
      } catch (err) {
        showToast("Sync Error", "error");
      } finally {
        setTimeout(() => setIsInitializing(false), 800);
      }
    };
    if (isOnboarded) hydrate();
    else setIsInitializing(false);
  }, [isOnboarded]);

  useEffect(() => {
    if (!isInitializing) {
      storageService.saveAppointments(appointments);
      storageService.saveClients(clients);
      storageService.saveSubscription(subscriptionPlan);
      localStorage.setItem('bookly_services', JSON.stringify(services));
      localStorage.setItem('bookly_business_name', businessName);
      localStorage.setItem('bookly_business_category', businessCategory);
      localStorage.setItem('bookly_onboarded', isOnboarded.toString());
      localStorage.setItem('bookly_connected_apps', JSON.stringify(connectedApps));
      localStorage.setItem('bookly_legal', JSON.stringify(legalData));
      localStorage.setItem('bookly_currency', currency);
    }
  }, [appointments, clients, services, businessName, businessCategory, isOnboarded, subscriptionPlan, connectedApps, legalData, currency, isInitializing]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleNewBooking = async (newBooking: Appointment) => {
    const saved = await api.appointments.create(newBooking);
    setAppointments(prev => [saved, ...prev]);
    showToast(`Session locked for ${saved.clientName}`);
  };

  const handleLogin = (email: string) => {
    const mockUser: User = {
      id: 'user-' + Date.now(),
      email,
      name: email.split('@')[0],
      businessName: ''
    };
    setUser(mockUser);
    localStorage.setItem('bookly_user', JSON.stringify(mockUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('bookly_user');
  };

  if (isPublicRoute) {
    return (
      <PublicBookingPage 
        onBookingComplete={handleNewBooking}
      />
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (!isOnboarded) {
    return <Onboarding onComplete={(data) => { setBusinessName(data.name); setBusinessCategory(data.category); setIsOnboarded(true); }} />;
  }

  if (isInitializing) {
    return (
      <div className="h-screen w-screen bg-white flex flex-col items-center justify-center space-y-4">
         <div className="w-16 h-16 bg-brand-blue rounded-2xl flex items-center justify-center text-white shadow-xl animate-pulse">
            <Radio size={32} />
         </div>
         <h2 className="text-slate-900 text-sm font-bold tracking-widest uppercase">Initializing EasyBookly...</h2>
      </div>
    );
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
        return <AppointmentCalendar appointments={appointments} onAddClick={() => setShowAddModal(true)} onUpdateAppointment={(a) => setAppointments(prev => prev.map(x => x.id === a.id ? a : x))} onDeleteAppointment={(id) => setAppointments(prev => prev.filter(x => x.id !== id))} connectedApps={connectedApps} currency={currency} />;
      case 'clients':
        return <ClientCRM clients={clients} appointments={appointments} onDeleteClient={(id) => setClients(prev => prev.filter(c => c.id !== id))} />;
      case 'marketing':
        return <MarketingStudio />;
      case 'ai-assistant':
        return <AIAssistant appointments={appointments} clients={clients} />;
      case 'subscription':
        return <Pricing currentPlan={subscriptionPlan} onPlanChange={(p) => setSubscriptionPlan(p)} />;
      case 'settings':
        return (
          <Settings 
            businessName={businessName} 
            onUpdateBusinessName={setBusinessName} 
            services={services}
            onUpdateServices={setServices}
            connectedApps={connectedApps}
            onUpdateConnectedApps={setConnectedApps}
            legalData={legalData}
            onUpdateLegalData={setLegalData}
            currency={currency}
            onUpdateCurrency={setCurrency}
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

      {showAddModal && (
        <AddAppointmentModal 
          onClose={() => setShowAddModal(false)} 
          onAdd={handleNewBooking}
          clients={clients}
          services={services}
        />
      )}
    </div>
  );
};

export default App;
