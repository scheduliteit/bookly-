
import React from 'react';
import { Globe, Check } from 'lucide-react';
import { Language } from '../services/translations';

interface LanguageSwitcherProps {
  currentLanguage: Language;
  onUpdateLanguage: (lang: Language) => void;
  variant?: 'minimal' | 'full' | 'ghost';
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ currentLanguage, onUpdateLanguage, variant = 'minimal' }) => {
  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'he', label: 'עברית', flag: '🇮🇱' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  ];

  const current = languages.find(l => l.code === currentLanguage) || languages[0];

  if (variant === 'ghost') {
    return (
      <div className="flex items-center gap-2">
        {languages.map(lang => (
          <button
            key={lang.code}
            onClick={() => onUpdateLanguage(lang.code)}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                currentLanguage === lang.code 
                ? 'bg-brand-blue text-white shadow-md' 
                : 'text-slate-400 hover:text-brand-dark hover:bg-slate-100'
            }`}
            title={lang.label}
          >
            {lang.code.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-600 hover:bg-slate-100 transition-all font-bold text-[10px] uppercase tracking-widest">
        <Globe size={14} className="text-brand-blue" />
        {current.label}
      </button>
      
      <div className="absolute bottom-full mb-2 right-0 bg-white border border-slate-100 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 w-40 overflow-hidden z-[200]">
        <div className="p-2 border-b border-slate-50 bg-slate-50/50">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Select Language</p>
        </div>
        <div className="py-1">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => onUpdateLanguage(lang.code)}
              className="w-full text-left px-4 py-2 text-[11px] font-bold text-slate-600 hover:bg-brand-blue/5 hover:text-brand-blue flex items-center justify-between group/item"
            >
              <div className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </div>
              {currentLanguage === lang.code && <Check size={12} className="text-brand-blue" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
