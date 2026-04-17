
import React from 'react';
import { CalendarCheck2 } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', showText = true, onClick }) => {
  const sizeClasses = {
    sm: { container: 'w-6 h-6', icon: 14, text: 'text-lg' },
    md: { container: 'w-10 h-10', icon: 20, text: 'text-xl' },
    lg: { container: 'w-12 h-12', icon: 24, text: 'text-2xl' },
    xl: { container: 'w-16 h-16', icon: 32, text: 'text-3xl' },
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-center gap-3 ${className}`} onClick={onClick}>
      <div className={`${currentSize.container} bg-gradient-to-br from-[#006bff] to-[#00a2ff] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200/50 transform transition-transform hover:scale-105`}>
        <CalendarCheck2 size={currentSize.icon} strokeWidth={2.5} />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`${currentSize.text} font-black tracking-tight text-slate-900 leading-none`}>
            Easy<span className="text-[#006bff]">Bookly</span>
          </span>
          <span className="text-[8px] font-black bg-brand-blue text-white w-fit px-1.5 py-0.5 rounded-sm uppercase tracking-tighter mt-1">Free Era Active</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
