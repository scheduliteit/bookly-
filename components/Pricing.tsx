
import React, { useState } from 'react';
import { Check, Shield, Rocket, Sparkles, Star, Loader2, Crown, Zap, Lock, ShieldCheck, CreditCard, ArrowRight, SmartphoneNfc, FileText, Globe } from 'lucide-react';
import { paymentService } from '../services/paymentService';

interface PricingProps {
  currentPlan: 'basic' | 'premium';
  onPlanChange: (plan: 'basic' | 'premium') => void;
}

const Pricing: React.FC<PricingProps> = ({ currentPlan, onPlanChange }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState<{plan: string, price: number, name: string} | null>(null);

  const handleInitiateUpgrade = async (planId: 'basic' | 'premium', price: number, name: string) => {
    if (planId === currentPlan) return;
    setShowCheckout({ plan: planId, price, name });
  };

  const handleFinalizePayment = async () => {
    if (!showCheckout) return;
    setIsProcessing(showCheckout.plan);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const totalAmount = showCheckout.price * (billingCycle === 'annual' ? 12 : 1);
    
    await paymentService.processIncomingPayment(
      totalAmount, 
      `Standard Subscription: ${showCheckout.name}`
    );
    
    onPlanChange(showCheckout.plan as 'basic' | 'premium');
    setShowCheckout(null);
    setIsProcessing(null);
  };

  const monthlyStarter = 15;
  const annualStarter = 12;
  const monthlyElite = 30;
  const annualElite = 25;

  const plans = [
    {
      id: 'basic' as const,
      name: 'Essentials',
      price: billingCycle === 'annual' ? annualStarter : monthlyStarter,
      description: 'Ideal for individuals and small teams starting out.',
      features: [
        'Unlimited Event Types',
        'Automatic Calendar Sync',
        'Email & SMS Reminders',
        'Integrations (Stripe, PayPal)',
        'Basic Performance Insights'
      ],
      icon: Rocket,
      buttonText: 'Current Plan',
      tagline: 'SOLO FOUNDATION'
    },
    {
      id: 'premium' as const,
      name: 'Professional',
      price: billingCycle === 'annual' ? annualElite : monthlyElite,
      description: 'Advanced features for growing businesses and teams.',
      features: [
        'All Essential Features',
        'Gemini AI Meeting Briefs',
        'Custom Routing Forms',
        'Multi-user Team Pages',
        'Advanced Analytics Dashboards',
        'Priority Global Support'
      ],
      icon: Crown,
      buttonText: 'Upgrade Now',
      isPopular: true,
      badge: 'Best Value',
      tagline: 'SCALABLE GROWTH'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 animate-in fade-in duration-1000 pb-32">
      <div className="text-center mb-20 space-y-6">
        <div className="inline-flex items-center gap-2 px-5 py-2 bg-brand-blue/10 text-brand-blue rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-brand-blue/10">
          <Sparkles size={12} className="animate-pulse" /> Global Scheduling Power
        </div>
        <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter">
          Simple plans. <span className="text-brand-blue">Powerful results.</span>
        </h2>
        <p className="text-slate-500 max-w-2xl mx-auto font-medium text-xl leading-relaxed">
          Join thousands of professionals who save time with our automated scheduling platform.
        </p>

        <div className="flex flex-col items-center gap-6 pt-8">
          <div className="flex items-center gap-5 p-1.5 bg-slate-100 rounded-[20px] border border-slate-200 w-fit shadow-inner">
            <button onClick={() => setBillingCycle('monthly')} className={`px-8 py-3 rounded-[15px] text-sm font-black transition-all ${billingCycle === 'monthly' ? 'bg-white text-brand-blue shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Monthly</button>
            <button onClick={() => setBillingCycle('annual')} className={`px-8 py-3 rounded-[15px] text-sm font-black transition-all flex items-center gap-2 ${billingCycle === 'annual' ? 'bg-white text-brand-blue shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Annual <span className="bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded-full">Save 20%</span></button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {plans.map((plan) => (
          <div key={plan.id} className={`group relative flex flex-col p-1 bg-gradient-to-br transition-all duration-700 rounded-[48px] ${plan.isPopular ? 'from-brand-blue via-blue-400 to-indigo-500 shadow-[0_32px_64px_-12px_rgba(0,107,255,0.25)] scale-105 z-10' : 'from-slate-200 to-slate-200'}`}>
            <div className="bg-white rounded-[44px] p-10 h-full flex flex-col relative overflow-hidden">
              <div className="mb-12 flex items-start justify-between">
                <div>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-xl ${plan.isPopular ? 'bg-brand-blue text-white shadow-blue-200' : 'bg-slate-100 text-slate-400'}`}><plan.icon size={28} /></div>
                  <span className="text-[10px] font-black text-brand-blue uppercase tracking-[0.3em]">{plan.tagline}</span>
                  <h3 className="text-3xl font-black text-slate-900 mt-1">{plan.name}</h3>
                </div>
              </div>
              <div className="mb-12">
                <div className="flex items-baseline gap-1">
                  <span className="text-6xl font-black text-slate-900 tracking-tighter">${plan.price}</span>
                  <span className="text-slate-400 font-bold text-xl">/mo</span>
                </div>
              </div>
              <div className="flex-1 space-y-5 mb-12">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${plan.isPopular ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-400'}`}><Check size={14} strokeWidth={4} /></div>
                    <span className="text-sm font-bold text-slate-600">{feature}</span>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => handleInitiateUpgrade(plan.id, plan.price, plan.name)}
                disabled={currentPlan === plan.id}
                className={`w-full py-6 px-8 rounded-3xl font-black text-base transition-all flex items-center justify-center gap-3 ${currentPlan === plan.id ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : plan.isPopular ? 'bg-brand-blue text-white hover:bg-slate-900 shadow-xl' : 'bg-slate-900 text-white hover:bg-brand-blue shadow-lg'}`}
              >
                {currentPlan === plan.id ? <ShieldCheck size={20} /> : <Zap size={20} />}
                {currentPlan === plan.id ? 'Active Plan' : plan.buttonText}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCheckout && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95">
             <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">Checkout</h3>
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1 mt-1">
                       <Globe size={10} /> Secure Global Payment
                    </p>
                  </div>
                  <button onClick={() => setShowCheckout(null)} className="p-2 hover:bg-slate-100 rounded-full">✕</button>
                </div>
                <div className="space-y-6">
                   <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{showCheckout.name}</span>
                         <span className="text-xs font-black text-brand-blue uppercase tracking-widest">{billingCycle}</span>
                      </div>
                      <div className="flex justify-between items-end">
                         <span className="text-xl font-black text-slate-900">Total</span>
                         <span className="text-3xl font-black text-slate-900">${billingCycle === 'annual' ? (showCheckout.price * 12).toLocaleString() : showCheckout.price.toLocaleString()}</span>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <button className="flex flex-col items-center justify-center p-4 bg-brand-blue/5 border-2 border-brand-blue rounded-2xl gap-2">
                         <CreditCard size={24} className="text-brand-blue" />
                         <span className="text-[10px] font-black uppercase text-brand-blue">Stripe / Card</span>
                      </button>
                      <button className="flex flex-col items-center justify-center p-4 bg-slate-50 border-2 border-transparent rounded-2xl gap-2">
                         <Globe size={24} className="text-slate-400" />
                         <span className="text-[10px] font-black uppercase text-slate-400">PayPal</span>
                      </button>
                   </div>

                   <button 
                    onClick={handleFinalizePayment}
                    disabled={!!isProcessing}
                    className="w-full py-6 bg-brand-blue text-white rounded-[28px] font-black text-sm shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                   >
                     {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Lock size={18} />}
                     {isProcessing ? 'Processing Payment...' : `Pay $${billingCycle === 'annual' ? (showCheckout.price * 12).toLocaleString() : showCheckout.price.toLocaleString()}`}
                   </button>
                   
                   <p className="text-[10px] text-center font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                     <ShieldCheck size={12} className="text-emerald-500" /> Professional Invoice Included
                   </p>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pricing;
