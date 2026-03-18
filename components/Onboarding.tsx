
import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Scissors, 
  Heart, 
  Briefcase, 
  Store, 
  Home, 
  GraduationCap, 
  Dumbbell, 
  Palette, 
  Car,
  Plus
} from 'lucide-react';

interface OnboardingProps {
  onComplete: (data: { name: string; category: string }) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');

  const categories = [
    { id: 'Beauty', icon: Scissors, label: 'Salon & Beauty' },
    { id: 'Wellness', icon: Heart, label: 'Health & Wellness' },
    { id: 'Professional', icon: Briefcase, label: 'Professional' },
    { id: 'Home', icon: Home, label: 'Home Services' },
    { id: 'Education', icon: GraduationCap, label: 'Education' },
    { id: 'Fitness', icon: Dumbbell, label: 'Fitness & Sport' },
    { id: 'Creative', icon: Palette, label: 'Creative & Arts' },
    { id: 'Automotive', icon: Car, label: 'Automotive' },
    { id: 'Retail', icon: Store, label: 'Retail' },
    { id: 'Other', icon: Plus, label: 'Other' },
  ];

  const handleFinish = () => {
    if (name && category) {
      onComplete({ name, category });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-xl w-full text-center space-y-10 py-10">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto text-white shadow-xl shadow-indigo-100">
            <Sparkles size={32} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Welcome to EasyBookly</h1>
          <p className="text-slate-500 font-medium">Let's get your business workspace ready.</p>
        </div>

        {step === 1 ? (
          <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 animate-in fade-in duration-500">
            <div className="text-left">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Business Name</label>
              <input 
                autoFocus
                type="text" 
                placeholder="e.g. Zen Spa, Tech Studio..." 
                className="mt-2 w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-lg font-bold focus:ring-2 focus:ring-indigo-600 outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && name && setStep(2)}
              />
            </div>
            <button 
              disabled={!name}
              onClick={() => setStep(2)}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              Next Step <ArrowRight size={20} />
            </button>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {categories.map(cat => (
                <button 
                  key={cat.id} 
                  onClick={() => setCategory(cat.label)} 
                  className={`p-4 bg-white border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${category === cat.label ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                >
                  <cat.icon size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">{cat.label}</span>
                </button>
              ))}
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <button 
                disabled={!category}
                onClick={handleFinish}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
              >
                Get Started
              </button>
              <button onClick={() => setStep(1)} className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600">Back</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
