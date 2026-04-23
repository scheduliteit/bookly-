
import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from '../firebase';
import Logo from './Logo';

interface LoginProps {
  onLogin: (email: string, uid: string, displayName: string | null) => void;
  initialMode?: 'register' | 'login';
  preFillEmail?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, initialMode = 'login', preFillEmail }) => {
  const [email, setEmail] = useState(preFillEmail || '');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(initialMode === 'register');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        // Set a default display name if registering
        await updateProfile(result.user, {
          displayName: email.split('@')[0]
        });
        onLogin(result.user.email || '', result.user.uid, result.user.displayName);
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        onLogin(result.user.email || '', result.user.uid, result.user.displayName);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      let message = `Error (${error.code || 'unknown'}): ${error.message || 'An error occurred during authentication.'}`;
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = 'Invalid email or password. Please check your credentials.';
      } else if (error.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Try logging in instead.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak. Please use at least 6 characters.';
      } else if (error.code === 'auth/operation-not-allowed') {
        message = '🚨 LOGIN DISABLED: You must enable "Email/Password" in your Firebase Console (Authentication > Sign-in method).';
      } else if (error.code === 'auth/popup-blocked') {
        message = 'The login popup was blocked. Please allow popups for this site.';
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        onLogin(result.user.email || '', result.user.uid, result.user.displayName);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let message = `Error (${error.code || 'unknown'}): ${error.message || 'An unexpected error occurred during Google login.'}`;
      if (error.code === 'auth/popup-blocked') {
        message = '🚨 POPUP BLOCKED: Your browser blocked the login window. Please look at your address bar and click "Allow Popups" for this site, then try again.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        message = 'Login was cancelled.';
      } else if (error.code === 'auth/operation-not-allowed') {
        message = '🚨 GOOGLE DISABLED: You must enable "Google" in your Firebase Console (Authentication > Sign-in method).';
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans selection:bg-brand-blue/10 selection:text-brand-blue">
      {/* Left Panel: Welcoming Hero */}
      <div className="hidden md:flex md:w-1/2 bg-brand-blue p-16 flex-col justify-between relative overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-5%] left-[-5%] w-64 h-64 bg-brand-dark/20 rounded-full blur-2xl" />
        
        <div className="relative z-10">
          <Logo size="lg" className="text-white mb-20" />
          <div className="space-y-6 max-w-lg">
            <h1 className="text-6xl font-black text-white leading-[0.9] tracking-tight">
              The world's <span className="text-brand-dark">simplest</span> way to book.
            </h1>
            <p className="text-xl text-white/80 font-medium leading-relaxed">
              Join 10,000+ professionals who use EasyBookly to automate their schedule and grow their business.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-brand-blue bg-slate-200 overflow-hidden">
                  <img src={`https://picsum.photos/seed/user${i}/100/100`} alt="User" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
            <p className="text-sm text-white/60 font-bold uppercase tracking-widest">Trusted by experts</p>
          </div>
          
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/10">
            <div>
              <p className="text-3xl font-black text-white">99.9%</p>
              <p className="text-xs text-white/50 font-bold uppercase tracking-widest mt-1">Uptime Reliability</p>
            </div>
            <div>
              <p className="text-3xl font-black text-white">24/7</p>
              <p className="text-xs text-white/50 font-bold uppercase tracking-widest mt-1">AI Concierge</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16 bg-[#fcfcfc]">
        <div className="w-full max-w-[400px] space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
          <div className="md:hidden flex justify-center mb-8">
            <Logo size="lg" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black text-brand-dark tracking-tight">
              {isRegistering ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="text-slate-500 font-medium">
              {isRegistering ? 'Activate your professional business engine.' : 'Log in to manage your business.'}
            </p>
          </div>

          <div className="space-y-8">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-600 animate-in shake duration-500">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <div className="text-xs font-bold leading-relaxed">
                  {error}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-blue transition-colors" size={18} />
                  <input 
                    type="email" 
                    required
                    placeholder="name@company.com"
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm focus:border-brand-blue outline-none transition-all font-bold placeholder:text-slate-300"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-blue transition-colors" size={18} />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm focus:border-brand-blue outline-none transition-all font-bold placeholder:text-slate-300"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-5 bg-brand-blue text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-brand-dark shadow-2xl shadow-brand-blue/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : (isRegistering ? 'Get Started' : 'Sign In')} <ArrowRight size={18} />
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black"><span className="bg-[#fcfcfc] px-4 text-slate-300">Or continue with</span></div>
            </div>

            <button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-sm text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              Google
            </button>
          </div>

          <p className="text-center text-sm font-bold text-slate-400">
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-brand-blue font-black hover:underline"
            >
              {isRegistering ? 'Log in' : 'Create account'}
            </button>
          </p>

          <div className="flex items-center justify-center gap-8 pt-4 opacity-20 grayscale">
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
              <ShieldCheck size={14} /> SOC2
            </div>
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
              <Zap size={14} /> ISO 27001
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
