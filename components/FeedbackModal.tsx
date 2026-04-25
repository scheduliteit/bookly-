
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Bug, MessageSquare, Sparkles, Star, Loader2, CheckCircle2, Zap } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface FeedbackModalProps {
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose }) => {
  const [type, setType] = useState<'bug' | 'feature' | 'improvement' | 'other'>('improvement');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      await addDoc(collection(db, 'feedback'), {
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'anonymous',
        type,
        message,
        createdAt: serverTimestamp(),
        status: 'new',
        platform: 'web'
      });
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-[1001] flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative"
      >
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 p-2 text-slate-400 hover:text-brand-dark transition-colors"
        >
          <X size={20} />
        </button>

        <div className="px-8 pt-10 pb-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-brand-blue/10 text-brand-blue rounded-2xl flex items-center justify-center">
              <MessageSquare size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-brand-dark">Share Your Feedback</h2>
              <p className="text-sm text-slate-500 font-medium tracking-tight">Help us build the absolute best scheduler.</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center space-y-4"
              >
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-black text-brand-dark">Feedback Received!</h3>
                <p className="text-slate-500 text-sm font-medium">Your input is now in the hands of our architects.</p>
              </motion.div>
            ) : (
              <form key="form" onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">What kind of feedback?</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'bug', label: 'Report a Bug', icon: Bug, color: 'text-rose-500 bg-rose-50' },
                      { id: 'improvement', label: 'Improvement', icon: Zap, color: 'text-brand-blue bg-blue-50' },
                      { id: 'feature', label: 'Feature Request', icon: Star, color: 'text-amber-500 bg-amber-50' },
                      { id: 'other', label: 'Other', icon: Sparkles, color: 'text-slate-500 bg-slate-50' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setType(item.id as any)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all ${
                          type === item.id 
                          ? 'border-brand-dark bg-slate-50 ring-1 ring-brand-dark' 
                          : 'border-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${item.color}`}>
                          <item.icon size={14} />
                        </div>
                        <span className="text-xs font-bold text-slate-700">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Detail your thoughts</label>
                  <textarea
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what's on your mind..."
                    className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-1 focus:ring-brand-blue transition-all resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    disabled={isSubmitting || !message.trim()}
                    className="w-full bg-brand-dark text-white rounded-2xl py-4 font-black text-sm shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isSubmitting ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        <Send size={18} />
                        Transmit Feedback
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FeedbackModal;
