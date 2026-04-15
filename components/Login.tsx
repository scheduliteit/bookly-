
import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from '../firebase';

interface LoginProps {
  onLogin: (email: string, uid: string, displayName: string | null) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
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
        message = `🚨 LOGIN DISABLED: You must enable "Email/Password" in your Firebase Console (Authentication > Sign-in method). \n\n(Verify Project: project-a78dac39-7bf0-47db-af6)`;
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
        message = `🚨 GOOGLE DISABLED: You must enable "Google" in your Firebase Console (Authentication > Sign-in method). \n\n(Verify Project: project-a78dac39-7bf0-47db-af6)`;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[440px] space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-brand-blue rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl shadow-brand-blue/20">
            <ShieldCheck size={32} />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-brand-dark tracking-tight">
              {isRegistering ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-slate-500 font-medium">
              {isRegistering ? 'Start your 14-day free trial today.' : 'Log in to manage your business.'}
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-600 animate-in slide-in-from-top-2">
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
              <div className="text-xs font-bold leading-relaxed">
                {error}
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required
                  placeholder="name@company.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-brand-blue outline-none transition-all font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-brand-blue outline-none transition-all font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-brand-blue text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-brand-dark shadow-lg shadow-brand-blue/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : (isRegistering ? 'Get Started' : 'Sign In')} <ArrowRight size={18} />
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold"><span className="bg-white px-4 text-slate-400">Or continue with</span></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Google
          </button>
        </div>

        <p className="text-center text-sm font-medium text-slate-500">
          {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-brand-blue font-bold hover:underline"
          >
            {isRegistering ? 'Log in' : 'Create one for free'}
          </button>
        </p>

        <div className="flex items-center justify-center gap-6 pt-4 opacity-40 grayscale">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <ShieldCheck size={14} /> SOC2 Compliant
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <Zap size={14} /> ISO 27001
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
