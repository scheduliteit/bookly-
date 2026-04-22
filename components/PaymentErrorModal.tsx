
import React from 'react';
import { AlertCircle, Copy, X, ShieldAlert, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PaymentErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: string;
  details: string;
  hint: string;
}

const PaymentErrorModal: React.FC<PaymentErrorModalProps> = ({ isOpen, onClose, error, details, hint }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    const text = `GATEWAY ERROR:\nMessage: ${error}\nDetails: ${details}\nHint: ${hint}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden border border-slate-100"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
                    <ShieldAlert size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Gateway Alert</h3>
                    <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">Version 2.4.0 (IPv4 Force)</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-all">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-900 font-black mb-3">
                    <AlertCircle size={16} className="text-rose-500" />
                    <span>{error}</span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono leading-relaxed break-all whitespace-pre-wrap">
                    {details}
                  </div>
                </div>

                {hint && (
                  <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-2">Diagnostic Hint</span>
                    <p className="text-xs text-blue-700 font-medium leading-relaxed">{hint}</p>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={handleCopy}
                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95"
                  >
                    {copied ? <RefreshCw size={18} className="animate-spin text-emerald-400" /> : <Copy size={18} />}
                    {copied ? 'LOG COPIED' : 'COPY LOG FOR SUPPORT'}
                  </button>
                  <button 
                    onClick={onClose}
                    className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
                  >
                    CLOSE
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Encrypted Diagnostic ID: EB-${Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PaymentErrorModal;
